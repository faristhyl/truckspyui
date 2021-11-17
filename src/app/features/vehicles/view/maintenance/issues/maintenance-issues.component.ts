import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest } from 'rxjs';
import _filter from 'lodash/filter';

import {
  RestService, DataTableService, LocalStorageService, ColumnSelector, ColumnSelectorUtil, IssueSourceType,
  IssueStatus, WorkOrder, MaintenanceIssue
} from '@app/core/services';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
  selector: 'app-vehicle-maintenance-issues',
  templateUrl: './maintenance-issues.component.html',
  styleUrls: ['./maintenance-issues.component.css']
})
export class VehicleMaintenanceIssuesComponent implements OnInit {

  @ViewChild("issuesTable") issuesTable: any;

  vehicleId: string;

  tableColumns: ColumnSelector[] = [];
  tableName = 'table_vehicle_maintenance_issues';

  // orderColumns = [
  //   'number', null, /*"source.type",*/ 'status', 'description', null, 'createdAt'];

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
      // orderable: false,
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
      render: function (data, type, full, meta) {
        return full.description || '';
      }
    },
    {
      data: null,
      // orderable: false,
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
      serverSide: false,
      pageLength: 10,
      data: [],
      columns: this.valueColumns,
      order: [[5, 'desc']]
    }
  };

  constructor(
    private route: ActivatedRoute,
    private restService: RestService,
    private dataTableService: DataTableService,
    private dateService: DateService,
    private lsService: LocalStorageService) { }

  sources = [IssueSourceType.DRIVER_INSPECTION, IssueSourceType.ENGINE_FAULT, IssueSourceType.SCHEDULED_MAINTENANCE, IssueSourceType.USER_CREATED];
  statuses = [IssueStatus.NEW, IssueStatus.ASSIGNED, IssueStatus.ON_HOLD, IssueStatus.REPAIRED, IssueStatus.RESOLVED];
  filters = {
    issueId: "",
    sourceType: "",
    status: IssueStatus.NEW,
    workOrderId: ""
  }

  /**
   * Workaround for the SmartAdmin select2 wrappers.
   */
  issueChanged(value) {
    this.filters.issueId = value;
    this.doFilter();
  }
  sourceTypeChanged(value) {
    this.filters.sourceType = value;
    this.doFilter();
  }
  statusChanged(value) {
    this.filters.status = value;
    this.doFilter();
  }
  workOrderChanged(value) {
    this.filters.workOrderId = value;
    this.doFilter();
  }

  doFilter() {
    let filtered = [...this.issues];
    if (!!this.filters.issueId) { // filter by issueId
      filtered = _filter(filtered, function (issue: MaintenanceIssue) {
        return issue.id === this.filters.issueId;
      }.bind(this));
    }
    if (!!this.filters.sourceType) { // filter by sourceType
      filtered = _filter(filtered, function (issue: MaintenanceIssue) {
        return !!issue.source && issue.source.type === this.filters.sourceType;
      }.bind(this));
    }
    if (!!this.filters.status) { // filter by status
      filtered = _filter(filtered, function (issue: MaintenanceIssue) {
        return issue.status === this.filters.status;
      }.bind(this));
    }
    if (!!this.filters.workOrderId) { // filter by workOrderId
      filtered = _filter(filtered, function (issue: MaintenanceIssue) {
        return !!issue.repairOrder && issue.repairOrder.id === this.filters.workOrderId;
      }.bind(this));
    }

    this.issuesTable.dataReload(filtered);
  }

  ngOnInit() {
    this.vehicleId = this.route.snapshot.parent.paramMap.get('id');

    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });

    this.defineOptions();
    this.loadData();
  }

  issues: MaintenanceIssue[] = [];
  issuesLoaded: boolean = false;
  workOrders: WorkOrder[] = [];
  workOrdersLoaded: boolean = false;

  loadData() {
    combineLatest(
      this.restService.get1000MaintenanceIssues(this.vehicleId), // ordered by number.ASC
      this.restService.get1000WorkOrdersByVehicle(this.vehicleId) // ordered by number.ASC
    ).subscribe(
      data => {
        this.issues = data[0];
        this.issuesLoaded = true;
        this.doFilter();

        this.workOrders = data[1];
        this.workOrdersLoaded = true;
      }
    );
  }

  private defaultColumnNames = [
    'Issue Num', "Source", "Status", "Description", "Work Order", "Created At"];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

}
