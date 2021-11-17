import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import _filter from 'lodash/filter';

import {
  RestService, Inspection, InspectionType, Driver, ColumnSelector, ColumnSelectorUtil, LocalStorageService
} from '@app/core/services';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { getTableLength } from '@app/core/store/auth';

@Component({
  selector: 'app-vehicle-inspections',
  templateUrl: './vehicle-inspections.component.html',
  styleUrls: ['./vehicle-inspections.component.css']
})
export class VehicleInspectionsComponent implements OnInit {

  @ViewChild("inspectionsTable") inspectionsTable: any;

  vehicleId: string;

  tableLength: number;
  tableColumns: ColumnSelector[] = [];
  tableName = 'table_vehicle_inspections';

  // orderColumns = [
  //   'inspectionNum', null, 'createdAt', null, "type", "safe"];

  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        var inspectionNum = full.getNum();
        var id = full.id;
        return `<a href="#/inspection/list/${id}/view">${inspectionNum}</a>`;
      }
    },
    {
      data: null,
      // orderable: false,
      render: function (data, type, full, meta) {
        const driver = full.driver;
        if (!driver) {
          return '';
        }
        var remoteId = driver.remoteId || "(unspecified)";
        var name = driver.name();
        var id = driver.id;
        return `<a href="#/drivers/${id}/view">${remoteId} ${name}</a>`;
      }
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return this.dateService.transformDateTime(full.createdAt);
      }.bind(this)
    },
    {
      data: "defectCount",
      // orderable: false,
    },
    {
      data: "type"
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return full.isSafe();
      }
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
      columns: this.valueColumns,
      order: [[2, 'desc']]
    }
  };

  constructor(
    private route: ActivatedRoute,
    private store: Store<any>,
    private restService: RestService,
    private router: Router,
    private dateService: DateService,
    private lsService: LocalStorageService) { }

  types = [InspectionType.PRETRIP, InspectionType.POSTTRIP];
  filters = {
    query: "",
    driverId: ""
  }

  /**
   * Workaround for the SmartAdmin select2 wrappers.
   */
  queryChanged(value) {
    this.filters.query = value;
    this.doFilter();
  }
  clearQuery() {
    this.filters.query = "";
    this.doFilter();
  }
  driverChanged(value) {
    this.filters.driverId = value;
    this.doFilter();
  }

  doFilter() {
    let filtered = [...this.inspections];
    if (!!this.filters.query) { // filter by query
      filtered = _filter(filtered, function (inspection: Inspection) {
        const inspectionNum = `${inspection.getNum()}`.toLowerCase();
        return inspectionNum.includes(this.filters.query.toLowerCase());
      }.bind(this));
    }
    if (!!this.filters.driverId) { // filter by driverId
      filtered = _filter(filtered, function (inspection: Inspection) {
        return !!inspection.driver && inspection.driver.id === this.filters.driverId;
      }.bind(this));
    }

    this.inspectionsTable.dataReload(filtered);
  }

  ngOnInit() {
    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });

    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.defineOptions();
    });

    this.loadData();
  }

  inspections: Inspection[] = [];
  inspectionsLoaded: boolean = false;
  drivers: Driver[] = [];
  driversLoaded: boolean = false;

  loadData() {
    this.vehicleId = this.route.snapshot.parent.paramMap.get('id');
    combineLatest(
      this.restService.get1000InspectionsForVehicle(this.vehicleId), // ordered by createdAt.DESC
      this.restService.get1000DriversLight() // ordered by remoteId.ASC
    ).subscribe(
      data => {
        this.inspections = data[0];
        this.inspectionsLoaded = true;
        this.doFilter();

        this.drivers = data[1];
        this.driversLoaded = true;
      }
    );
  }

  private defaultColumnNames = [
    'Inspection Num', "Driver", "Created At", "Defects", "Type", "Safe To Operate"];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

}
