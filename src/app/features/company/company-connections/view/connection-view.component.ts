import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, TemplateRef, ViewChild, NgZone, OnDestroy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Actions } from '@ngrx/effects';
import { BsModalService, BsModalRef, ModalDirective } from 'ngx-bootstrap/modal';

import { RestService, DataTableService, Connection, FilterParams, ConnectionType, GlobalFunctionsService } from '@app/core/services'
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { ExitEditMode } from '@app/core/store/shortcuts';
import { ReplaceUnderscorePipe, CapitalizeAllPipe } from '@app/shared/pipes/utils.pipe';

@Component({
  selector: 'app-connection-view',
  templateUrl: './connection-view.component.html',
  styleUrls: ['./connection-view.component.css']
})
export class ConnectionViewComponent implements OnInit, OnDestroy {

  @ViewChild('connectionIssuesTable') connectionIssuesTable: any;

  connectionId: string;
  connection: Connection;
  loaded: boolean = false;
  edit: boolean = false;
  connectionData = {
    name: "",
    type: "",
    auth: {},
    allowedCapabilities: []
  };
  connectionTypes: ConnectionType[] = [];
  connectionTypesLoaded: boolean = false;
  authFields: string[] = [];
  capabilities: string[] = [];
  testsInProgress: boolean = false;

  beginEdit() {
    let theType = this.connection.type;
    this.connectionData = {
      name: this.connection.name,
      type: theType,
      auth: { ...this.connection.auth },
      allowedCapabilities: this.connection.allowedCapabilities
    };

    let connectionType = this.connectionTypes.find(function (element) {
      return element.type === theType;
    });
    this.capabilities = (connectionType && connectionType.capabilities) || [];
    this.displayCapabilityPrivate = this.displayCapability.bind(this);

    this.edit = true;
  }
  onTypeChange(value): void {
    let connectionType = this.connectionTypes.find(function (element) {
      return element.type === value;
    });

    this.connectionData.type = (connectionType && connectionType.type) || "";
    this.connectionData.auth = (connectionType && connectionType.initAuth()) || {};
    this.connectionData.allowedCapabilities = [];
    this.authFields = (connectionType && connectionType.auth) || [];
    this.capabilities = (connectionType && connectionType.capabilities) || [];
  }

  displayCapabilityPrivate: any;
  displayCapability(item: string) {
    let noUnderscore = this.replaceUnderscore.transform(item);
    let result = this.capitalizeAll.transform(noUnderscore);
    return result;
  }

  cancelEdit() {
    this.loadAuthFields();
    this.edit = false;
  }

  /** Shortcuts logic */
  onExitEditMode = this.actions$.subscribe(action => {
    if (action instanceof ExitEditMode) {
      this.cancelEdit();
    }
  });

  save() {
    this.restService.updateConnection(this.connectionId, this.connectionData)
      .subscribe(
        data => {
          this.connection = data;
          this.loadAuthFields();
          this.edit = false;
        }
      );
  }

  runTests() {
    this.testsInProgress = true;
    this.restService.testConnection(this.connectionId)
      .subscribe(result => {
        this.testsInProgress = false;
      },
        error => {
          this.testsInProgress = false;
        })
  }

  /**
   * Ordering field names for DataTable columns.
   */
  orderColumnsOperations = ["operation", "finishedAt", "durationSeconds", "status"];
  valueColumnsOperations = [
    { data: "operation" },
    {
      data: null,
      render: function (data, type, full, meta) {
        return this.dateService.transformDateTime(full.finishedAt);
      }.bind(this)
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return this.numberPipe.transform(full.durationSeconds, '1.1-1');
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (!full.error) {
          return full.status();
        }

        var operationEncoded = this.gfService.encodeParam(full);
        return `${full.status()} <a class="action-link" onclick='truckspy.detailsModal("${operationEncoded}")'>Details</a>`;
      }.bind(this)
    }
  ];
  optionsOperations = {
    noToolbar: true,
    processing: true,
    serverSide: true,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumnsOperations);
      this.restService.getAllOperationsFor(this.connectionId, params)
        .subscribe(
          data => {
            callback({
              aaData: data.results,
              recordsTotal: data.resultCount,
              recordsFiltered: data.resultCount
            })
          }
        );
    },
    columns: this.valueColumnsOperations,
    order: [[1, 'desc']],
    rowCallback: function (row, data) {
      if (data.error) {
        $(row).addClass('danger');
      }
    }
  };

  /**
   * Ordering field names for DataTable columns.
   */
  orderColumnsIssues = ["message", "objectType", "createdAt", null];
  valueColumnsIssues = [
    { data: 'message' },
    {
      data: null,
      render: function (data, type, full, meta) {
        return `${full.objectType} (${full.objectId})`;
      }
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return this.dateService.transformDateTime(full.createdAt);
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (full.solvedAt && full.solvedBy) {
          return `Solved By: ${full.solvedBy} <br/> Solved At: ${this.dateService.transformDateTime(full.solvedAt)}`
        } else {
          return `<a class="action-link" onclick='truckspy.markIssueSolved("${full.id}", this)'>Mark Solved</a>`
        }
      }.bind(this)
    }
  ];
  optionsIssues = {
    noToolbar: true,
    processing: true,
    serverSide: true,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumnsIssues);
      this.restService.getAllIssuesFor(this.connectionId, params)
        .subscribe(
          data => {
            callback({
              aaData: data.results,
              recordsTotal: data.resultCount,
              recordsFiltered: data.resultCount
            })
          }
        );
    },
    columns: this.valueColumnsIssues,
    order: [[2, 'desc']],
    rowCallback: function (row, data) {
      if (data.error) {
        $(row).addClass('danger');
      }
    }
  };

  refreshIssuesData() {
    if (this.connectionIssuesTable) {
      this.connectionIssuesTable.ajaxReload();
    }
  }


  /**
   * Details modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("detailsModal") _detailsModal: ModalDirective;
  theOperation: any = {};

  detailsModal(operationEncoded: string) {
    this.ngZone.run(() => {
      var operation = this.gfService.decodeParam(operationEncoded);
      this.detailsModalPrivate(operation);
    });
  }
  detailsModalPrivate(operation: any) {
    this.theOperation = operation;
    this._detailsModal.show();
  }

  closeDetailsModal() {
    this._detailsModal.hide();
  }

  /**
   * Toggle Connection's Status modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _toggleStatusModal: BsModalRef;

  toggleStatus(template: TemplateRef<any>) {
    this._toggleStatusModal = this.modalService.show(template, { class: "modal-sm" });
  }
  doToggleStatus(): void {
    this.restService.toggleConnectionStatus(this.connectionId, this.connection.enabled)
      .subscribe(
        data => {
          this._toggleStatusModal.hide();
          this.connection = data;
          this.loadAuthFields();
        }
      );
  }
  closeToggleStatusModal(): void {
    this._toggleStatusModal.hide();
  }

  constructor(
    private route: ActivatedRoute,
    private actions$: Actions,
    private restService: RestService,
    private replaceUnderscore: ReplaceUnderscorePipe,
    private capitalizeAll: CapitalizeAllPipe,
    private modalService: BsModalService,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService,
    private numberPipe: DecimalPipe,
    private dataTableService: DataTableService,
    private dateService: DateService) { }

  ngOnInit() {
    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.detailsModal = this.detailsModal.bind(this);
    window.truckspy.markIssueSolved = this.markIssueSolved.bind(this);

    this.connection = new Connection();
    this.connectionId = this.route.snapshot.paramMap.get("id");
    this.restService.getConnection(this.connectionId)
      .subscribe(
        data => {
          this.connection = data;
          this.loaded = true;

          this.restService.getConfigConnectionTypes().subscribe(val => {
            this.connectionTypes = val;
            this.connectionTypesLoaded = true; // beginEdit() should be possible only after this
            this.loadAuthFields();
          });
        }
      );
  }

  ngOnDestroy() {
    window.truckspy.detailsModal = null;
    window.truckspy.markIssueSolved = null;
  }

  loadAuthFields() {
    let type = this.connection.type;
    let connectionType = this.connectionTypes.find(function (element) {
      return element.type === type;
    });
    this.authFields = connectionType.auth;
  }

  markIssueSolved(id: string, element: any) {
    var waitElement = document.createElement('span');
    waitElement.innerHTML = 'wait...';
    element.parentNode.replaceChild(waitElement, element);

    this.restService.markIssueSolved(this.connectionId, id)
      .subscribe(
        good => {
          this.refreshIssuesData();
        },
        error => {
          waitElement.parentNode.replaceChild(element, waitElement);
        }
      );
  }

}
