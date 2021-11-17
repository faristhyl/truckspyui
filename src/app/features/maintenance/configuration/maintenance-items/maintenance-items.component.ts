import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, NgZone } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { BsModalService, BsModalRef, ModalDirective } from 'ngx-bootstrap/modal';

import {
  RestService, FilterParams, DataTableService, ColumnSelector, ColumnSelectorUtil, Measure, MaintenanceItemType,
  MaintenanceGroup, GlobalFunctionsService
} from '@app/core/services'
import { MaintenanceGroupDeleted, MaintenanceGroupAddedUpdated } from '@app/core/store/util';

@Component({
  selector: 'app-maintenance-items',
  templateUrl: './maintenance-items.component.html',
  styleUrls: ['./maintenance-items.component.css']
})
export class MaintenanceItemsComponent implements OnInit, OnDestroy {

  @ViewChild("itemsTable") itemsTable: any;
  tableColumns: ColumnSelector[] = [];
  tableName = 'table_maintenance_configuration_itemsTable';

  orderColumns = ["name", null/*["measure", "numberOf"]*/, null, null];
  valueColumns = [
    { data: "name" },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return `${full.numberOf} ${full.measure}`;
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return full.group && full.group.name;
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        var itemEncoded = this.gfService.encodeParam(full);
        return `<a onclick='truckspy.editItemModal("${itemEncoded}")'>Edit</a>&nbsp;&nbsp;|&nbsp;&nbsp;`
          + `<a onclick='truckspy.deleteItemModal("${itemEncoded}")'>Delete</a>`;

      }.bind(this)
    }
  ];
  options = {
    noToolbar: true,
    processing: true,
    serverSide: true,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
      this.restService.getAllMaintenanceItems(params)
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
   * Add Maintenance Item modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addMaintenanceItemModal: BsModalRef;

  measures = [Measure.DAYS, Measure.ENGINE_HOURS, Measure.MILES];

  itemTypesMap: { [key in Measure]?: MaintenanceItemType } = {
    [Measure.DAYS]: MaintenanceItemType.PERIODIC_BASED,
    [Measure.ENGINE_HOURS]: MaintenanceItemType.ENGINE_HOURS_BASED,
    [Measure.MILES]: MaintenanceItemType.MILEAGE_BASED
  };
  maintenanceGroups: MaintenanceGroup[] = [];
  maintenanceGroupsLoaded: boolean = false;

  itemData = {
    name: "",
    numberOf: 0,
    measure: this.measures[0],
    groupId: ""
  }

  addItem(template: TemplateRef<any>) {
    this.itemData = {
      name: "",
      numberOf: 0,
      measure: this.measures[0],
      groupId: this.maintenanceGroups[0].id // we guarantee this within a view
    };
    this._addMaintenanceItemModal = this.modalService.show(template, { class: "modal-400" });
  }

  createItem(): void {
    const data = {
      group: {
        id: this.itemData.groupId
      },
      name: this.itemData.name,
      type: this.itemTypesMap[this.itemData.measure],
      numberOf: this.itemData.numberOf,
      measure: this.itemData.measure
    }

    this.restService.createMaintenanceItem(data)
      .subscribe(
        data => {
          this._addMaintenanceItemModal.hide();
          this.itemsTable.ajaxReload();
        }
      );
  }
  closeItemModal(): void {
    this._addMaintenanceItemModal.hide();
  }

  /**
   * Delete Maintenance Item modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("deleteItemModal") _deleteItemModal: ModalDirective;
  forItem: any = {};

  deleteItemModal(itemEncoded: string) {
    this.ngZone.run(() => {
      var item = this.gfService.decodeParam(itemEncoded);
      this.deleteItemModalPrivate(item);
    });
  }
  deleteItemModalPrivate(item: any) {
    this.forItem = item;
    this._deleteItemModal.show();
  }

  closeDeleteItemModal() {
    this._deleteItemModal.hide();
  }
  deleteItem(item: any) {
    this.restService.deleteMaintenanceItem(item.id)
      .subscribe(
        success => {
          this._deleteItemModal.hide();
          this.itemsTable.ajaxReload();
        }
      );
  }

  /**
   * Edit modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("editItemModal") _editItemModal: ModalDirective;
  editData = {
    id: "",
    name: "",
    numberOf: 0,
    measure: this.measures[0],
    groupId: ""
  };

  editItemModal(itemEncoded: string) {
    this.ngZone.run(() => {
      var item = this.gfService.decodeParam(itemEncoded);
      this.editItemModalPrivate(item);
    });
  }
  editItemModalPrivate(item: any) {
    this.editData = {
      id: item.id,
      name: item.name,
      numberOf: item.numberOf,
      measure: item.measure,
      groupId: item.group.id
    };
    this._editItemModal.show();
  }

  closeEditItemModal() {
    this._editItemModal.hide();
  }
  edit(editData: any) {
    const data = {
      group: {
        id: editData.groupId
      },
      name: editData.name,
      numberOf: editData.numberOf,
      type: this.itemTypesMap[editData.measure],
      measure: editData.measure
    }
    this.restService.updateMaintenanceItem(editData.id, data)
      .subscribe(
        success => {
          this._editItemModal.hide();
          this.itemsTable.ajaxReload();
        }
      );
  }

  /**
   * Constructor to instantiate an instance of MaintenanceItemsComponent.
   */
  constructor(
    private actions$: Actions,
    private restService: RestService,
    private dataTableService: DataTableService,
    private modalService: BsModalService,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService) { }

  ngOnInit() {
    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.deleteItemModal = this.deleteItemModal.bind(this);
    window.truckspy.editItemModal = this.editItemModal.bind(this);

    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });

    this.loadMaintenanceGroups();
  }

  loadMaintenanceGroups() {
    this.maintenanceGroupsLoaded = false;
    this.restService.get1000MaintenanceGroups()
      .subscribe(data => {
        this.maintenanceGroups = data;
        this.maintenanceGroupsLoaded = true;
      });
  }

  ngOnDestroy(): void {
    window.truckspy.editItemModal = null;
    window.truckspy.deleteItemModal = null;
  }

  private defaultColumnNames = ["Name", "When", "Assigned To", "Actions"];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

  onMaintenanceGroupDeleted = this.actions$.subscribe(action => {
    if (action instanceof MaintenanceGroupDeleted || action instanceof MaintenanceGroupAddedUpdated) {
      this.itemsTable.ajaxReload();
      this.loadMaintenanceGroups();
    }
  });

}
