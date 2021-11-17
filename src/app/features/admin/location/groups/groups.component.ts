import { Component, OnInit, ViewChild, NgZone, TemplateRef } from '@angular/core';
import { BsModalService, ModalDirective, BsModalRef } from 'ngx-bootstrap';

import { RestService, GlobalFunctionsService, ColumnSelector, ColumnSelectorUtil } from '@app/core/services';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
  selector: 'app-admin-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})
export class AdminGroupsComponent implements OnInit {

  tableColumnsGlobal: ColumnSelector[] = [];
  tableNameGlobal = 'table_admin_location_global';

  valueColumnsGlobal = [
    {
      data: null,
      render: function (data, type, full, meta) {
        var name = full.name;
        var id = full.id;
        return `<a href="#/admin/location/locations?groupId=${id}">${name}</a>`;
      }
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return this.dateService.transformDateTime(full.createdAt);
      }.bind(this)
    },
    { data: "locationCount" },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        var groupEncoded = this.gfService.encodeParam(full);
        return `<a onclick='truckspy.deleteGroupModal("${groupEncoded}")'>Delete</a>&nbsp;&nbsp;|&nbsp;&nbsp;`
          + `<a href="#/admin/location/locations?groupId=${full.id}">View</a>`;
      }.bind(this)
    }
  ];

  optionsGlobal = {
    noToolbar: true,
    serverSide: false,
    ajax: (data, callback, settings) => {
      this.restService.get1000AdminLocationGroups()
        .subscribe(
          data => {
            callback({
              aaData: data,
              recordsTotal: data.length,
              recordsFiltered: data.length
            })
          }
        );
    },
    columns: this.valueColumnsGlobal,
    order: [[1, 'desc']]
  };

  @ViewChild("globalGroupsTable") globalGroupsTable: any;

  /**
   * Add Global Location Group modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addGroupModal: BsModalRef;
  groupData = {};

  addGroup(template: TemplateRef<any>) {
    this.groupData = {
      name: ""
    };
    this._addGroupModal = this.modalService.show(template, { class: "modal-sm" });
  }

  createGroup(): void {
    this.restService.createAdminLocationGroup(this.groupData)
      .subscribe(
        data => {
          this._addGroupModal.hide();
          this.globalGroupsTable.ajaxReload();
        }
      );
  }
  closeAddGroupModal(): void {
    this._addGroupModal.hide();
  }

  /**
   * Delete Global Location Group modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("deleteGroupModal") _deleteGroupModal: ModalDirective;
  forGroup = {
    name: ""
  };

  deleteGroupModal(groupEncoded: string) {
    this.ngZone.run(() => {
      var group = this.gfService.decodeParam(groupEncoded);
      this.deleteGroupModalPrivate(group);
    });
  }
  deleteGroupModalPrivate(group: any) {
    this.forGroup = group;
    this._deleteGroupModal.show();
  }

  closeDeleteGroupModal() {
    this._deleteGroupModal.hide();
  }
  deleteGroup(group: any) {
    this.restService.deleteAdminLocationGroup(group.id)
      .subscribe(
        success => {
          this._deleteGroupModal.hide();
          this.globalGroupsTable.ajaxReload();
        }
      );
  }

  /**
   * Constructor to instantiate an instance of AdminGroupsComponent.
   */
  constructor(
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService,
    private restService: RestService,
    private modalService: BsModalService,
    private dateService: DateService) { }

  ngOnInit() {
    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttributeGlobal = attributes.find(item => item.name === this.tableNameGlobal);
      this.tableColumnsGlobal = !!tableAttributeGlobal
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNamesGlobal, JSON.parse(tableAttributeGlobal.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNamesGlobal);
    });

    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.deleteGroupModal = this.deleteGroupModal.bind(this);
  }

  private defaultColumnNamesGlobal = ['Name', 'Created At', 'Locations', 'Actions'];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableNameGlobal, columns);
  }

}
