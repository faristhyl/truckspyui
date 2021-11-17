import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest } from 'rxjs';
import _filter from 'lodash/filter';

import {
  RestService, DataTableService, LocalStorageService, ColumnSelector, ColumnSelectorUtil, WorkOrder, User, RepairOrderStatus
} from '@app/core/services';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
  selector: 'app-vehicle-maintenance-workorders',
  templateUrl: './maintenance-workorders.component.html',
  styleUrls: ['./maintenance-workorders.component.css']
})
export class VehicleMaintenanceWorkOrdersComponent implements OnInit {

  @ViewChild("ordersTable") ordersTable: any;

  vehicleId: string;

  tableColumns: ColumnSelector[] = [];
  tableName = 'table_vehicle_maintenance_work_orders';

  // orderColumns = ["number", "status", null, null, "createdAt"];

  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        var id = full.id;
        var number = full.getNumber();
        return `<a href="#/maintenance/workorders/${id}/view">${number}</a>`;
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
        const issues = full.issues;
        if (!issues || issues.length === 0) {
          return "";
        }
        return issues
          .map(function (issue) {
            var number = issue.number;
            var id = issue.id;
            return `<a href="#/maintenance/issues/${id}/view">${number}</a>`;
          })
          .join(", ");
      }.bind(this)
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return full.assignedTo ? full.assignedTo.name() : '';
      }
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
      columns: this.valueColumns
    }
  };

  constructor(
    private route: ActivatedRoute,
    private restService: RestService,
    private dataTableService: DataTableService,
    private dateService: DateService,
    private lsService: LocalStorageService) { }

  statuses = [RepairOrderStatus.NEW, RepairOrderStatus.CLOSED];
  filters = {
    workOrderId: "",
    status: "",
    userId: ""
  }

  /**
   * Workaround for the SmartAdmin select2 wrappers.
   */
  workOrderChanged(value) {
    this.filters.workOrderId = value;
    this.doFilter();
  }
  statusChanged(value) {
    this.filters.status = value;
    this.doFilter();
  }
  userChanged(value) {
    this.filters.userId = value;
    this.doFilter();
  }

  doFilter() {
    let filtered = [...this.workOrders];
    if (!!this.filters.workOrderId) { // filter by workOrderId
      filtered = _filter(filtered, function (order: WorkOrder) {
        return order.id === this.filters.workOrderId;
      }.bind(this));
    }
    if (!!this.filters.status) { // filter by status
      filtered = _filter(filtered, function (order: WorkOrder) {
        return order.status === this.filters.status;
      }.bind(this));
    }
    if (!!this.filters.userId) { // filter by userId
      filtered = _filter(filtered, function (order: WorkOrder) {
        return !!order.assignedTo && order.assignedTo.id === this.filters.userId;
      }.bind(this));
    }
    this.ordersTable.dataReload(filtered);
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

  workOrders: WorkOrder[] = [];
  workOrdersLoaded: boolean = false;
  users: User[] = [];
  usersLoaded: boolean = false;

  loadData() {
    combineLatest(
      this.restService.get1000WorkOrdersByVehicle(this.vehicleId), // ordered by number.ASC
      this.restService.get1000Users() // // ordered by firstName.ASC
    ).subscribe(
      data => {
        this.workOrders = data[0];
        this.workOrdersLoaded = true;
        this.doFilter();

        this.users = data[1];
        this.usersLoaded = true;
      }
    );
  }

  private defaultColumnNames = [
    'Work Order Num', "Status", "Issues", "Assigned To", "Created At"];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

}
