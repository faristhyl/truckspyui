import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, NgZone } from '@angular/core';
import { BsModalService, BsModalRef, ModalDirective } from 'ngx-bootstrap/modal';

import {
  RestService, FilterParams, DataTableService, GlobalFunctionsService, ColumnSelector, ColumnSelectorUtil
} from '@app/core/services'

@Component({
  selector: 'app-company-dispatchgroups',
  templateUrl: './company-dispatchgroups.component.html',
  styleUrls: ['./company-dispatchgroups.component.css']
})
export class CompanyDispatchGroupsComponent implements OnInit, OnDestroy {

  @ViewChild("dispatchgroupsTable") dispatchgroupsTable: any;

  tableColumns: ColumnSelector[] = [];
  tableName = 'tabele_company_dispatchgroups';

  orderColumns = ["name", null];
  valueColumns = [
    { data: "name" },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        var groupEncoded = this.gfService.encodeParam(full);
        return `<a onclick='truckspy.editModal("${groupEncoded}")'>Edit</a>`;
      }.bind(this)
    }
  ];
  options = {
    columnsManagementMinified: true,
    noToolbar: true,
    processing: true,
    serverSide: true,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
      this.restService.getAllDispatchGroups(params)
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
    columns: this.valueColumns
  };

  /**
   * Add DispatchGroup modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addDispatchGroupModal: BsModalRef;
  dispatchGroupData = {};

  addDispatchGroup(template: TemplateRef<any>) {
    this.dispatchGroupData = {
      name: ""
    };
    this._addDispatchGroupModal = this.modalService.show(template, { class: "modal-sm" });
  }

  createDispatchGroup(): void {
    this.restService.createDispatchGroup(this.dispatchGroupData)
      .subscribe(
        data => {
          this._addDispatchGroupModal.hide();
          this.dispatchgroupsTable.ajaxReload();
        }
      );
  }
  closeDispatchGroupModal(): void {
    this._addDispatchGroupModal.hide();
  }

  /**
   * Edit modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("editModal") _editModal: ModalDirective;
  editData = {
    id: "",
    name: ""
  };

  editModal(groupEncoded: string) {
    this.ngZone.run(() => {
      var group = this.gfService.decodeParam(groupEncoded);
      this.editModalPrivate(group);
    });
  }
  editModalPrivate(group: any) {
    this.editData = {
      id: group.id,
      name: group.name
    };
    this._editModal.show();
  }

  closeEditModal() {
    this._editModal.hide();
  }
  edit(editData: any) {
    let data = {
      name: editData.name
    };
    this.restService.updateDispatchGroup(editData.id, data)
      .subscribe(
        success => {
          this._editModal.hide();
          this.dispatchgroupsTable.ajaxReload();
        }
      );
  }

  /**
   * Constructor to instantiate an instance of CompanyDispatchGroupsComponent.
   */
  constructor(
    private restService: RestService,
    private dataTableService: DataTableService,
    private modalService: BsModalService,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService) { }

  ngOnInit() {
    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });

    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.editModal = this.editModal.bind(this);
  }

  ngOnDestroy() {
    window.truckspy.editModal = null;
  }

  private defaultColumnNames = ['Name', 'Actions'];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

}
