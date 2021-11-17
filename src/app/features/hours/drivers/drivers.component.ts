import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { combineLatest, forkJoin, Observable, of } from 'rxjs';
import * as moment from 'moment';

import {
  ColumnSelector, ColumnSelectorUtil, DataTableService, DispatchGroup, DriversMetaNames, DriverStatuses, FilterDriversOption, FilterParams,
  LocalStorageService, RestService, HOSUtilService
} from '@app/core/services';
import { ExcelService } from '@app/core/services/excel.service';
import { REFRESH_TABLE_INTERVAL } from '@app/core/smartadmin.config';
import { AuthState, getTableLength } from '@app/core/store/auth';
import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-drivers',
  templateUrl: './drivers.component.html',
  styleUrls: ['./drivers.component.css'],
  providers: [ExcelService]
})
export class DriversComponent implements OnInit {

  @ViewChild('driversTable') driversTable: any;

  tableColumns: ColumnSelector[] = [];
  tableName = 'table_drivers';
  tableLength: number;
  filterOption: FilterDriversOption;
  private defaultAllDrivers = []; // drivers which we don't filter, for dispatch group 'All'
  private defaultDriversIdsForDispatchGroup: string[] = []; // drivers which we don't filter, for dispatch group 'All'
  dispatchGroups: DispatchGroup[] = [];
  drivers = [];
  driverMetaNames: DriversMetaNames[] = [];
  terminals = [];
  subsets = [];
  vehicles = [];
  refreshDataTableInterval;
  orderColumns = [null, 'name', 'asset.name', 'event-type', 'event_time', null, null, null, 'available_drive', 'available_shift', 'available_cycle', 'gain_time_when', 'gain_time_how_much', null, null, 'next_violation_timestamp', 'uncertified_logs', null, null,];
  valueColumns = [
    { // Driver ID
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return this.findDriverAlias(full.userId)
      }.bind(this)
    },
    { // Driver Name
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        let driverName = this.findDriverName(full.userId);
        return `<a data-toggle="tooltip" data-placement="top" title="Go to ${driverName}'s Logs" onclick='truckspy.redirectDriverToLog("${full.userId}")'>${driverName}</a>`
      }.bind(this)
    },
    { // Vehicle
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.findVehicle(full.assetId)
      }.bind(this)
    },
    { // Status
      data: 'eventType',
      orderable: true,
    },
    { // Last Contact
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return moment(full.eventTime).format("MM/DD/YYYY hh:mm A");
      }.bind(this),
    },
    { // Last Position
      data: 'location',
      orderable: false,
    },
    { // Current Ruleset
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return this.findCurrentRuleSetByUserId(full.userId)
      }.bind(this)
    },
    { // Until Break
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return this.convertMillisecondToTime(full.availableBreak);
      }.bind(this)
    },
    { // Drive Left
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.findDriveLeft(full.availableDrive, full.availableShift);
      }.bind(this)
    },
    { // Shift Left
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.convertMillisecondToTime(full.availableShift);
      }.bind(this)
    },
    { // Cycle Left
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.convertMillisecondToTime(full.availableCycle);
      }.bind(this)
    },
    { // Gain Time At
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.getGainTimeAt(full);
      }.bind(this)
    },
    { // Time Gained
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.getTimeGained(full);
      }.bind(this)
    },
    { // Time Gained at StartOfDay
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return this.convertMillisecondToTime(full.gainTimeHowMuchNextDay);
      }.bind(this)
    },
    { // Next Violation
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return full.nextViolation ? full.nextViolation : "N/A";
      }
    },
    { // Time of Next Violation
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return full.nextViolationTimestamp ? moment(full.nextViolationTimestamp).format("hh:mm A") : "N/A";
      }
    },
    { // Uncertified Logs
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return `<span style="color: red"><b>${full.uncertifiedLogs}</b></span>`;
      }
    },
    { // Pending Edits
      data: 'pendingEditRequests',
      orderable: false,
    },
    { // Violation
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return '';
      }
    },
  ];

  // datatable functions for find records
  /* start here */
  findDriverAlias(driverId) {
    let driverData = this.drivers.find(d => d.id == driverId);
    return driverData ? driverData.alias : '';
  }

  findDriverName(driverId) {
    let driverData = this.drivers.find(d => d.id == driverId);
    return driverData ? driverData.name() : '';
  }

  findVehicle(assetId) {
    let vehicleData = this.vehicles.find(v => v.id == assetId);
    return vehicleData ? vehicleData.name : '';
  }

  findCurrentRuleSetByUserId(userId) {
    let driverMeta: DriversMetaNames = this.driverMetaNames.find(d => d.id === userId);
    return driverMeta ? driverMeta.getCurrentRuleset() : "";
  }

  convertMillisecondToTime(time, hideSeconds = true) {
    return time ? this.hosUtilService.millisToTime(moment.duration(time).asMilliseconds(), hideSeconds) : 'N/A';
  }

  findDriveLeft(drive, shift) {
    // Handles a case when a certain drive left is greater than shift left.
    if (drive) {
      const driveLeft = moment.duration(drive).asMilliseconds(),
        shiftLeft = moment.duration(shift).asMilliseconds();

      return (driveLeft > shiftLeft) ? this.convertMillisecondToTime(shift) : this.convertMillisecondToTime(drive);
    }

    return "00:00";
  }

  sanitizeGainTimeWhen(datetime) {
    let year = datetime.split("-")[0],
      dateTime = datetime;

    if (year === "10000") {
      dateTime = datetime.replace(/10000/, "1000");
    }

    return dateTime;
  }

  getGainTimeAt(full: DriverStatuses) {
    let gainTimeWhen = this.sanitizeGainTimeWhen(full.gainTimeWhen),
        nineTenSeventy = gainTimeWhen.split("T")[0],
        yearOneThousand = nineTenSeventy.split("-")[0],
        gainTimeAt = "N/A",
        gainTimeWhich = full.gainTimeWhich ? full.gainTimeWhich : "N/A";

    if (gainTimeWhich === "NA - Reset Complete") {
      gainTimeAt = gainTimeWhich;
    } else if (nineTenSeventy === "1970-01-01" || yearOneThousand === "1000") {
      gainTimeAt = gainTimeAt;
    } else if (gainTimeWhich === "N/A") {
      gainTimeAt = gainTimeWhen;
    } else {
      gainTimeAt = `${gainTimeWhich} :
      ${moment(gainTimeWhen).format("MM/DD/YYYY hh:mm A")}`;
    }

    return gainTimeAt;
  }

  getTimeGained(full: DriverStatuses) {
    let gainTimeWhen = this.sanitizeGainTimeWhen(full.gainTimeWhen), nineTenSeventy = gainTimeWhen.split("T")[0];
    return (nineTenSeventy === "1970-01-01") ? "N/A" : this.convertMillisecondToTime(full.gainTimeHowMuch);
  }

  driversOption: any;
  defineOptions() {
    this.driversOption = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        // Datatable is dependent on drivers data for finding driver name
        let params: FilterParams = this.dataTableService.calculateParamsForVis(data, this.orderColumns);
        this.excelService.tableData = [];
        combineLatest(
          this.restService.getDriversStatuses(params, this.filterOption, this.tableLength, this.excelService.tableData),
          this.restService.getDriversMetaNames()
        ).subscribe(data => {
          if (this.drivers.length) {
            this.driverMetaNames = data[1];
            callback({
              aaData: data[0] ? data[0].results : [],
              recordsTotal: data[0] ? data[0].resultCount : 0,
              recordsFiltered: data[0] ? data[0].resultCount : 0
            })
          } else {
            callback({ aaData: [], recordsTotal: 0, recordsFiltered: 0 })
          }
        })
      },
      columns: this.valueColumns,
      columnDefs: [
        { className: "text-center", targets: '_all' }
      ],
      order: [[4, 'desc']],
      breakResponsiveness: true,
      scrollX: true
    };
  }

  constructor(
    private restService: RestService,
    private hosUtilService: HOSUtilService,
    private store: Store<AuthState>,
    private lsService: LocalStorageService,
    private dataTableService: DataTableService,
    private excelService: ExcelService<DriverStatuses>,
    private router: Router) {
    this.filterOption = new FilterDriversOption();
    this.filterOption = {
      selectedDispatchGroupId: 'all',
      selectedDriverId: 'all',
      selectedTerminalId: 'all',
      selectedSubsetId: 'all',
      selectedStatus: true
    }
    let loggedInAs = this.lsService.getLoginAs();
    this.store.pipe(select(getTableLength)).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      
      // load data for dropdown filter
      this.loadData();
      // temporary set table length for client side pagination as visTrack api not supporting pagination
      this.tableLength = 10;
      this.defineOptions();
    });
  }

  ngOnInit() {
    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.redirectDriverToLog = this.redirectDriverToLog.bind(this);
  }

  ngOnDestroy() {
    window.truckspy.redirectDriverToLog = null;
  }

  redirectDriverToLog(driverId) {
    this.router.navigate(['/hours/logs'], { state: { driverId } })
  }

  loadData() {
    forkJoin([
      this.restService.get1000DispatchGroupsLight(),
      this.restService.getAllDriversForHOS(),
      this.restService.getAllTerminalForHOS(),
      this.restService.getAllVehiclesForHOS(),
      this.restService.getCurrentUser()
    ]).subscribe(data => {
      this.dispatchGroups = data[0];
      this.defaultAllDrivers = data[1];
      this.drivers = data[1];
      this.terminals = data[2];
      this.vehicles = data[3];

      const attributes = data[4].attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
      this.refreshData();
    })
  }

  private defaultColumnNames = [
    'Driver ID', 'Driver Name', 'Vehicle', 'Status', 'Last Contact', 'Last Position', 'Current Ruleset', 'Until Break', 'Drive Left',
    'Shift Left', 'Cycle Left', 'Gain Time At', 'Time Gained', 'Time Gained at StartOfDay', 'Next Violation', 'Time of Next Violation',
    'Uncertified Logs', 'Pending Edits', 'Violation'];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

  getAllSubset() {
    this.restService.getSubsetsByTerminalIdForHos(this.filterOption.selectedTerminalId)
      .subscribe(val => {
        this.subsets = val;
      })
  }

  onDispatchGroupFilterChange() {
    if (this.filterOption.selectedDispatchGroupId !== 'all') {
      this.filterOption.selectedDriverId = 'all'
      this.filterOption.selectedSubsetId = 'all';
      this.filterOption.selectedTerminalId = 'all';
      this.filterDriverComboboxByDispatchGroup().subscribe((res) => {
        this.refreshData();
      })
    } else {
      this.filterOption.selectedDriverIds = [];
      this.drivers = this.defaultAllDrivers;
      this.refreshData();
    }
  }

  onDriverFilterChange() {
    if (this.filterOption.selectedDriverId !== 'all') {
      this.filterOption.selectedSubsetId = 'all';
      this.filterOption.selectedTerminalId = 'all';
      this.filterOption.selectedDriverIds = null;
      this.refreshData();
    } else {
      // return drivers from selected dispatch group, if the user selects all drivers
      if (this.filterOption.selectedDispatchGroupId && this.filterOption.selectedDriverId === 'all') {
        this.filterOption.selectedDriverIds = this.defaultDriversIdsForDispatchGroup;
      }
      this.refreshData();
    }
  }

  onTerminalFilterChange() {
    if (this.filterOption.selectedTerminalId !== 'all') {
      this.getAllSubset();
      this.refreshData();
    } else {
      this.filterOption.selectedSubsetId = 'all';
      this.refreshData();
    }
  }

  onRefreshDataTableInterval() {
    clearInterval(this.refreshDataTableInterval);
    this.refreshDataTableInterval = setInterval(() => {
      this.refreshData();
    }, REFRESH_TABLE_INTERVAL);
  }

  // this method will refresh the data when dropdown selection change
  refreshData() {
    this.onRefreshDataTableInterval();
    if (this.driversTable) {
      this.driversTable.ajaxReload();
    }
  }

  private filterDriverComboboxByDispatchGroup(): Observable<any> {
    return this.restService.getAllDrivers(
      { page: 1, sort: 'firstName.ASC' }, 
      '(active)',
      10000,
      {
        reportingProfileId: "",
        connectionId: "",
        dispatchGroupId: this.filterOption.selectedDispatchGroupId.toString()
      }
    ).pipe(
      map(res => res.results),
      switchMap(truckSpyDrivers => {
        this.drivers = this.defaultAllDrivers;
        // filter drivers by emails
        this.drivers = this.drivers.filter((visTrucksDriver) => {
          return !!truckSpyDrivers.find(truckSpyDriver => {
            return truckSpyDriver.remoteId === visTrucksDriver.alias
          });
        });
        // save all drivers ids for selected dispatch group
        this.filterOption.selectedDriverIds = this.defaultDriversIdsForDispatchGroup = this.drivers.map(driver => driver.id);
        return of(true);
      })
    );
  }

  // excel downloading:
  private excelOptions = {
    title: 'Last Reported Status',
    fileName: 'driver-last-reported-status',
    header: this.defaultColumnNames,
    data: [] // fill out in prepareDataForExcel
  }

  downloadExcel() {
    this.getDataForExcel().subscribe(data => {
      this.prepareDataForExcel(data); // set data for excel table
      this.generateExcel();
    });
  }

  private generateExcel() {
    this.excelService.generateExcel(this.excelOptions);
  }
  
  private getDataForExcel() {
    // get data for excel
    return of(this.excelService.tableData);
  }

  private prepareDataForExcel(data: DriverStatuses[]) {
    this.excelOptions.data = data.map(item => {
      // fields
      const fields = {
        driverId: this.findDriverAlias(item.userId),
        driverName: this.findDriverName(item.userId),
        vehicle: this.findVehicle(item.assetId),
        status: item.eventType,
        lastContact: moment(item.eventTime).format("MM/DD/YYYY hh:mm A"),
        lastPosition: item.location,
        currentRuleset: this.findCurrentRuleSetByUserId(item.userId),
        untilBreak: this.convertMillisecondToTime(item.availableBreak),
        driveLeft: this.findDriveLeft(item.availableDrive, item.availableShift),
        shiftLeft: this.convertMillisecondToTime(item.availableShift),
        cycleLeft: this.convertMillisecondToTime(item.availableCycle),
        gainTimeAt: this.getGainTimeAt(item),
        timeGained: this.getTimeGained(item),
        timeGainedAtStartOfDay: this.convertMillisecondToTime(item.gainTimeHowMuchNextDay),
        nextViolation: (item as any).nextViolation ? (item as any).nextViolation : "N/A",
        timeOfNextViolation: (item as any).nextViolationTimestamp ? moment((item as any).nextViolationTimestamp).format("hh:mm A") : "N/A",
        uncertifiedLogs: item.uncertifiedLogs,
        pendingEditRequests: item.pendingEditRequests,
        violation: '',
      }
      // row
      const excelRowArray = Object.values(fields);
      return excelRowArray;
    })
  }
  // ***

}