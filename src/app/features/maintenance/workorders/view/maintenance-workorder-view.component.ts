import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, ViewChild, NgZone, OnDestroy, TemplateRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { combineLatest } from 'rxjs';
import { LongActionLinkComponent } from '@app/features/shared/long-action-link.component';

import {
  RestService, WorkOrder, ColumnSelector, ColumnSelectorUtil, LocalStorageService, GlobalFunctionsService, MaintenanceIssue,
  User
} from '@app/core/services';
import { getTableLength } from '@app/core/store/auth';
import * as fileSaver from 'file-saver';

@Component({
  selector: 'app-maintenance-workorder-view',
  templateUrl: './maintenance-workorder-view.component.html',
  styleUrls: ['./maintenance-workorder-view.component.css']
})
export class MaintenanceWorkOrderViewComponent implements OnInit, OnDestroy {

  orderId: string;
  order: WorkOrder;
  loaded: boolean = false;
  users: User[];

  @ViewChild("issuesTable") issuesTable: any;

  tableLength: number;
  tableColumns: ColumnSelector[] = [];
  tableName = 'table_maintenance_workorder_issues';

  // orderColumns = ['number', 'description', null];

  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        var number = full.number;
        var id = full.id;
        return `<a href="#/maintenance/issues/${id}/view">${number}</a>`;
      }
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return full.description;
      }
    },
    {
      data: null,
      orderable: false,
      className: "text-center",
      render: function (data, type, full, meta) {
        var issueEncoded = this.gfService.encodeParam(full);
        return `<a onclick='truckspy.unassignIssue("${issueEncoded}", this)'>
          <i class="fa fa-trash fa-lg"></i>
        </a>`;
      }.bind(this)
    }
  ];
  options: any;
  defineOptions() {
    this.options = {
      noToolbar: true,
      processing: true,
      serverSide: false,
      pageLength: this.tableLength,
      data: [],
      columns: this.valueColumns
    }
  };

  /**
   * Complete Work Order.
   */
  doComplete(orderId: string, actionComponent: LongActionLinkComponent) {
    this.restService.closeWorkOrder(orderId)
      .subscribe(
        updated => {
          this.order = updated;
          actionComponent.actionFinished();
        },
        error => {
          actionComponent.actionFailed();
        }
      );
  }

  unassignIssue(issueEncoded: string, element: any) {
    this.ngZone.run(() => {
      var issue = this.gfService.decodeParam(issueEncoded);
      this.unassignIssuePrivate(issue, element);
    });
  }
  unassignIssuePrivate(issue: MaintenanceIssue, element: any) {
    var waitElement = document.createElement('span');
    waitElement.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
    element.parentNode.replaceChild(waitElement, element);

    this.restService.unassignIssueFromWorkOrder(this.orderId, issue.id)
      .subscribe(
        updated => {
          this.order = updated;
          this.issuesTable.dataReload(this.order.issues);
        },
        error => {
          waitElement.parentNode.replaceChild(element, waitElement);
        }
      );
  }

  /**
   * Constructor to instantiate an instance of MaintenanceWorkOrderViewComponent.
   */
  constructor(
    private gfService: GlobalFunctionsService,
    private ngZone: NgZone,
    private store: Store<any>,
    private route: ActivatedRoute,
    private restService: RestService,
    private modalService: BsModalService,
    private lsService: LocalStorageService) { }

  ngOnDestroy(): void {
    window.truckspy.unassignIssue = null;
  }

  ngOnInit() {
    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.unassignIssue = this.unassignIssue.bind(this);

    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });

    // Fetch table length preferences
    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.defineOptions();
    });

    this.loadData();
  }

  loadData() {
    this.orderId = this.route.snapshot.paramMap.get("id");
    combineLatest(
      this.restService.getWorkOrder(this.orderId),
      this.restService.get1000Users()
    ).subscribe(([order, users]) => {
      this.order = order;
      this.users = users;
      this.loaded = true;
      this.issuesTable.dataReload(this.order.issues);
    });
  }

  private defaultColumnNames = [
    'Issue Num', "Information", "Actions"];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

  onDownloadPDF() {
    this.restService.downloadWorkOrderById(this.orderId, 'PDF')
      .subscribe(response => {
        fileSaver(response, `work-order-${this.order.getNumber()}.pdf`);
      })
  }

  /**
   * Assign User modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _assignUserModal: BsModalRef;
  assignedTo: User = null;

  assignUser(template: TemplateRef<any>) {
    this.assignedTo = (!!this.users && this.users.length > 0 && this.users[0]) || null;
    this._assignUserModal = this.modalService.show(template, { class: "modal-400" });
  }

  doAssignUser(): void {
    this.restService.assignWorkOrderToUser(this.orderId, this.assignedTo.id)
      .subscribe(
        updated => {
          this.order = updated;
          this._assignUserModal.hide();
        }
      );
  }

  doUnassignUser(userId, actionComponent: LongActionLinkComponent) {
    this.restService.unassignWorkOrderFromUser(this.orderId)
      .subscribe(
        updated => {
          this.order = updated;
          actionComponent.actionFinished();
        },
        error => {
          actionComponent.actionFailed();
        });
  }

  closeAssignUserModal(): void {
    this._assignUserModal.hide();
  }

}
