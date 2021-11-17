import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, NgZone } from '@angular/core';
import { Store } from '@ngrx/store';
import { BsModalService, BsModalRef, ModalDirective } from 'ngx-bootstrap/modal';
import { Observable, combineLatest } from 'rxjs';

import {
  RestService, FilterParams, DataTableService, ColumnSelector, ColumnSelectorUtil, GlobalFunctionsService, Vehicle,
  MaintenanceGroup
} from '@app/core/services'
import { MaintenanceGroupDeleted, MaintenanceGroupAddedUpdated } from '@app/core/store/util';

@Component({
  selector: 'app-maintenance-groups',
  templateUrl: './maintenance-groups.component.html',
  styleUrls: ['./maintenance-groups.component.css']
})
export class MaintenanceGroupsComponent implements OnInit, OnDestroy {

  @ViewChild("maintenanceGroupsTable") maintenanceGroupsTable: any;
  tableColumns: ColumnSelector[] = [];
  tableName = 'table_maintenance_configuration_groups';

  orderColumns = ["name", null];
  valueColumns = [
    { data: "name" },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        var groupEncoded = this.gfService.encodeParam(full);
        return `<a onclick='truckspy.editGroupModal("${groupEncoded}")'>Edit</a>&nbsp;&nbsp;|&nbsp;&nbsp;`
          + `<a onclick='truckspy.deleteGroupModal("${groupEncoded}")'>Delete</a>`;
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
      this.restService.getAllMaintenanceGroups(params)
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
   * Add Maintenance Group modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addMaintenanceGroupModal: BsModalRef;
  groupData = {
    name: "",
    vehicleIds: []
  };

  addMaintenanceGroup(template: TemplateRef<any>) {
    this.groupData = {
      name: "",
      vehicleIds: []
    };
    this._addMaintenanceGroupModal = this.modalService.show(template, { class: "modal-sm" });
  }

  addGroupActions() {
    this._addMaintenanceGroupModal.hide();
    this.store.dispatch(new MaintenanceGroupAddedUpdated());
    this.maintenanceGroupsTable.ajaxReload();
  }

  createMaintenanceGroup(): void {
    let groupInfo = {
      "name": this.groupData.name
    }
    let toLink = this.groupData.vehicleIds;

    this.restService.createMaintenanceGroup(groupInfo)
      .subscribe(
        (created: MaintenanceGroup) => {
          if (toLink.length > 0) {
            this.restService.assignVehiclesToMaintenanceGroup(created.id, toLink)
              .subscribe(
                data => {
                  this.addGroupActions();
                }
              );
          } else {
            this.addGroupActions();
          }
        }
      );
  }
  closeMaintenanceGroupModal(): void {
    this._addMaintenanceGroupModal.hide();
  }

  /**
   * Edit modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("editGroupModal") _editGroupModal: ModalDirective;
  editData = {
    id: "",
    name: "",
    vehicleIds: [],
    vehicleIdsInitial: []
  };
  vehicles: Vehicle[];
  vehiclesLoaded: boolean = false;

  editGroupModal(groupEncoded: string) {
    this.ngZone.run(() => {
      var group = this.gfService.decodeParam(groupEncoded);
      this.editGroupModalPrivate(group);
    });
  }
  editGroupModalPrivate(group: any) {
    this.editData = {
      id: group.id,
      name: group.name,
      vehicleIds: (group.vehicles && group.vehicles.length > 0
        && group.vehicles.map(vehicle => vehicle.id)) || [],
      vehicleIdsInitial: (group.vehicles && group.vehicles.length > 0
        && group.vehicles.map(vehicle => vehicle.id)) || []
    };
    this._editGroupModal.show();
  }

  closeEditGroupModal() {
    this._editGroupModal.hide();
  }
  edit(editData: any) {
    let toLink = editData.vehicleIds.filter(function (id) {
      return editData.vehicleIdsInitial.indexOf(id) < 0;
    });
    let toUnlink = editData.vehicleIdsInitial.filter(function (id) {
      return editData.vehicleIds.indexOf(id) < 0;
    });

    let data = {
      name: editData.name
    };
    const observables: Observable<any>[] = [
      this.restService.updateMaintenanceGroup(editData.id, data)
    ];
    if (toLink.length > 0) {
      observables.push(this.restService.assignVehiclesToMaintenanceGroup(editData.id, toLink))
    }
    if (toUnlink.length > 0) {
      observables.push(this.restService.unassignVehiclesFromMaintenanceGroup(editData.id, toUnlink))
    }

    combineLatest.apply(this, observables).subscribe(
      good => {
        this._editGroupModal.hide();
        this.store.dispatch(new MaintenanceGroupAddedUpdated());
        this.maintenanceGroupsTable.ajaxReload();
      }
    );
  }

  /**
   * Delete Maintenance Group modal directive reference to operate with within component.
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
    this.restService.deleteMaintenanceGroup(group.id)
      .subscribe(
        success => {
          this._deleteGroupModal.hide();
          this.store.dispatch(new MaintenanceGroupDeleted());
          this.maintenanceGroupsTable.ajaxReload();
        }
      );
  }

  /**
   * Constructor to instantiate an instance of MaintenanceGroupsComponent.
   */
  constructor(
    private store: Store<any>,
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

    this.restService.get1000ActiveVehiclesLight()
      .subscribe(result => {
        this.vehicles = result;
        this.vehiclesLoaded = true;
      });

    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.editGroupModal = this.editGroupModal.bind(this);
    window.truckspy.deleteGroupModal = this.deleteGroupModal.bind(this);
  }

  ngOnDestroy(): void {
    window.truckspy.editGroupModal = null;
    window.truckspy.deleteGroupModal = null;
  }

  private defaultColumnNames = ['Name', 'Actions'];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

}
