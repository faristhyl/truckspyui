import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import _filter from 'lodash/filter';

import {
  RestService, DataTableService, LocalStorageService, MaintenanceStatisctics, ColumnSelector, ColumnSelectorUtil,
  IssueSourceType, IssueStatus, Vehicle, WorkOrder, MaintenanceIssue, FilterParams, FilterIssues
} from '@app/core/services';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { getTableLength } from '@app/core/store/auth';

@Component({
  selector: 'app-maintenance-issues',
  templateUrl: './maintenance-issues.component.html',
  styleUrls: ['./maintenance-issues.component.css']
})
export class MaintenanceIssuesComponent implements OnInit {

  @ViewChild("issuesTable") issuesTable: any;

  statistics: MaintenanceStatisctics;

  tableLength: number;
  tableColumns: ColumnSelector[] = [];
  tableName = 'table_maintenance_issues';

  orderColumns = [
    'number', null, 'status', null, 'description', null, 'createdAt'];

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
      orderable: false,
      render: function (data, type, full, meta) {
        return full.source && full.source.type || '';
      }
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return full.status;
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        const vehicle = full.vehicle;
        var remoteId = vehicle.remoteId || "(unspecified)";
        var id = vehicle.id;
        return `<a href="#/vehicles/${id}/view">${remoteId}</a>`;
      }
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return full.description || '';
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (full.repairOrder && full.repairOrder.id) {
          var id = full.repairOrder.id;
          var number = full.repairOrder.getNumber();
          return `<a href="#/maintenance/workorders/${id}/view">${number}</a>`;
        }
        return "";
      }.bind(this)
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return this.dateService.transformDateTime(full.createdAt);
      }.bind(this)
    }
  ];
  options: any;
  defineOptions() {
    this.options = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
        this.restService.getAllMaintenanceIssues(params, this.tableLength, this.filters)
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
      columns: this.valueColumns,
      order: [[0, 'desc']]
    }
  };

  /**
   * Add Issue modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addIssueModal: BsModalRef;
  issueData = {
    description: "",
    vehicleId: ""
  };
  vehicleIdChanged(value) {
    this.issueData.vehicleId = value;
  }

  addIssue(template: TemplateRef<any>) {
    this.issueData = {
      description: "",
      vehicleId: (this.vehicles && this.vehicles.length >= 1 && this.vehicles[0].id) || "",
    };

    this._addIssueModal = this.modalService.show(template, { class: "modal-450" });
  }

  doCreate(): void {
    this.restService.createMaintenanceIssue(this.issueData)
      .subscribe(
        data => {
          this.refreshDataTable();
          this._addIssueModal.hide();
        });
  }
  closeAddIssueModal(): void {
    this._addIssueModal.hide();
  }

  constructor(
    private store: Store<any>,
    private restService: RestService,
    private modalService: BsModalService,
    private dataTableService: DataTableService,
    private dateService: DateService,
    private lsService: LocalStorageService) { }

  sources = [IssueSourceType.DRIVER_INSPECTION, IssueSourceType.ENGINE_FAULT, IssueSourceType.SCHEDULED_MAINTENANCE, IssueSourceType.USER_CREATED];
  statuses = [IssueStatus.NEW, IssueStatus.ASSIGNED, IssueStatus.ON_HOLD, IssueStatus.REPAIRED, IssueStatus.RESOLVED, IssueStatus.NOT_ACTIONABLE];
  filters: FilterIssues = {
    issueNum: "",
    issueSourceType: "",
    issueStatus: IssueStatus.NEW,
    vehicleId: "",
    workOrderId: ""
  };

  clearIssueNum() {
    this.filters.issueNum = "";
    this.refreshDataTable();
  }

  /**
   * Workaround for the SmartAdmin select2 wrappers.
   */
  sourceTypeChanged(value) {
    this.filters.issueSourceType = value;
    this.refreshDataTable();
  }
  statusChanged(value) {
    this.filters.issueStatus = value;
    console.log(this.filters.issueStatus);
    this.refreshDataTable();
  }
  vehicleChanged(value) {
    this.filters.vehicleId = value;
    this.refreshDataTable();
  }
  workOrderChanged(value) {
    this.filters.workOrderId = value;
    this.refreshDataTable();
  }

  refreshDataTable() {
    if (this.issuesTable) {
      this.issuesTable.ajaxReload();
    }
  }

  ngOnInit() {
    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });

    this.loadStatistics();

    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.defineOptions();
    });

    this.loadFiltersData();
  }

  issues: MaintenanceIssue[] = [];
  issuesLoaded: boolean = false;
  vehicles: Vehicle[] = [];
  vehiclesLoaded: boolean = false;
  vehiclesAvailable: boolean = false;
  workOrders: WorkOrder[] = [];
  workOrdersLoaded: boolean = false;

  loadFiltersData() {
    combineLatest(
      this.restService.get1000VehiclesLight(), // ordered by remoteId.ASC
      this.restService.get1000WorkOrders() // ordered by number.ASC
    ).subscribe(
      data => {
        this.vehicles = data[0];
        this.vehiclesAvailable = this.vehicles && this.vehicles.length >= 1;
        this.vehiclesLoaded = true;

        this.workOrders = data[1];
        this.workOrdersLoaded = true;
      }
    );
  }

  loadStatistics() {
    this.restService.getMaintenanceStatistics()
      .subscribe(statistics => {
        this.statistics = statistics;
      });
  }

  private defaultColumnNames = [
    'Issue Num', "Source", "Status", "Vehicle", "Description", "Work Order", "Created At"];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

}
