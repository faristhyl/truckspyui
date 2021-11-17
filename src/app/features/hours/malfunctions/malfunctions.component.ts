import { Component, OnInit, ViewChild } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable, combineLatest, of } from 'rxjs';
import * as moment from 'moment';

import { FilterMalfunctionsOption, RestService, LocalStorageService, FilterParams, DataTableService, DispatchGroup, EldMalfunction } from '@app/core/services';
import { ExcelService } from '@app/core/services/excel.service';
import { getTableLength, AuthState } from '@app/core/store/auth';
import { REFRESH_TABLE_INTERVAL } from '@app/core/smartadmin.config';
import { map, switchMap } from 'rxjs/operators';

export const getAllEvents = () => {
  return [{
    id: "MalPower,MalSync,MalTime,MalPos,MalTransfer,MalRecord",
    name: "Malfunctions"
  }, {
    id: "DiagSync,DiagMissing,DiagTransfer,DiagPower,DiagUnidentified",
    name: "Diagnostics"
  }]
}
export const getMalfunctionEvents = () => {
  return [{
    id: "MalPower",
    name: "Power Malfunction"
  }, {
    id: "MalSync",
    name: "Syncing Malfunction"
  }, {
    id: "MalPos",
    name: "Position Malfunction"
  }, {
    id: "MalTime",
    name: "Time Malfunction"
  }, {
    id: "MalTransfer",
    name: "Transfer Malfunction"
  }, {
    id: "MalRecord",
    name: "Data Recording Malfunction"
  }]
}
export const getDiagnosticsEvents = () => {
  return [{
    id: "DiagSync",
    name: "Syncing Diagnostic"
  }, {
    id: "DiagMissing",
    name: "Missing Diagnostic"
  }, {
    id: "DiagTransfer",
    name: "Transfer Diagnostic"
  }, {
    id: "DiagPower",
    name: "Power Data Diagnostic"
  }, {
    id: "DiagUnidentified",
    name: "Unidentified Driving Diagnostic"
  }]
}
export const getClearedStatus = () => {
  return [{
    id: true,
    name: "Cleared"
  }, {
    id: false,
    name: "Not Yet Cleared"
  }]
}

@Component({
  selector: 'app-malfunctions',
  templateUrl: './malfunctions.component.html',
  styleUrls: ['./malfunctions.component.css'],
  providers: [ExcelService]
})
export class MalfunctionsComponent implements OnInit {

  @ViewChild('malfunctionsTable') malfunctionsTable: any;

  currentDate = new Date();
  tableLength: number;
  filterOption: FilterMalfunctionsOption;
  eventTypeArr = [];
  eventSpecificTypeArr = [];
  clearedArr = [];
  private defaultAllDrivers = []; // drivers which we don't filter, for dispatch group 'All'
  private defaultDriversIdsForDispatchGroup: string[] = []; // drivers which we don't filter, for dispatch group 'All'
  dispatchGroups: DispatchGroup[] = [];
  drivers = [];
  vehicles = [];
  malfunctionsOption: any;
  refreshDataTableInterval;

  orderColumns = ["begin-timestamp", "event-type", "asset-vin", "asset-id", "user-id", "description", "end-timestamp,begin_timestamp"];
  valueColumns = [
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return moment(full.beginTimestamp).format("MM/DD/YYYY hh:mm A");
      }.bind(this),
    },
    {
      data: 'eventType',
      orderable: true,
    },
    {
      data: 'vin',
      orderable: true
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.findVehicle(full.assetId)
      }.bind(this)
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.findDriverName(full.userId)
      }.bind(this)
    },
    {
      data: 'description',
      orderable: true
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return full.endTimestamp ? 'Cleared' : 'Not Yet Cleared';
      }
    },
  ];

  defineOptions() {
    this.malfunctionsOption = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        let params: FilterParams = this.dataTableService.calculateParamsForVis(data, this.orderColumns);
        this.excelService.tableData = [];
        this.restService.getEldMalfunctions(params, this.filterOption, this.tableLength, this.vehicles.map(v => v.id), this.excelService.tableData)
          .subscribe(data => {
            if (this.drivers.length) {
              callback({
                aaData: data ? data.results : [],
                recordsTotal: data ? data.resultCount : 0,
                recordsFiltered: data ? data.resultCount : 0
              })
            } else {
              callback({ aaData: [], recordsTotal: 0, recordsFiltered: 0 })
            }
          });
      },
      columns: this.valueColumns,
      columnDefs: [
        { className: "text-center", targets: '_all' }
      ],
      order: [[0, 'asc']],
    }
  }

  constructor(
    private store: Store<AuthState>,
    private restService: RestService,
    private lsService: LocalStorageService,
    private dataTableService: DataTableService,
    private excelService: ExcelService<EldMalfunction>
  ) {
    let prevDate = new Date();
    prevDate.setDate(prevDate.getDate() - 6);
    this.filterOption = new FilterMalfunctionsOption();
    this.filterOption = {
      eventType: 'all',
      eventSpecificType: 'all',
      remarkDescription: '',
      dateRange: [
        prevDate,
        this.currentDate
      ],
      ISODateRange: [],
      isCleared: 'all',
      selectedDispatchGroupId: 'all',
      selectedDriverId: 'all',
      selectedVehicleId: []
    }
    this.convertFilterDateToISODate();
    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      // temporary set table length for client side pagination as visTrack api not supporting paginations
      this.tableLength = 10;
      this.fetchAllDropdownData();
      this.defineOptions();
    });
  }

  ngOnInit() {
    this.getEventType();
    this.getClearedStatus();
  }

  convertFilterDateToISODate() {
    this.filterOption.ISODateRange[0] = moment(this.filterOption.dateRange[0]).toISOString()
    this.filterOption.ISODateRange[1] = moment(this.filterOption.dateRange[1]).toISOString()
  }

  getEventType() {
    this.eventTypeArr = getAllEvents();
  }

  getEventsByEventType() {
    if (this.filterOption.eventType !== 'all') {
      this.eventSpecificTypeArr = this.filterOption.eventType.includes('Mal') ?
        getMalfunctionEvents() :
        getDiagnosticsEvents();
    } else {
      this.filterOption.eventSpecificType = 'all';
    }
    this.refreshData();
  }

  getClearedStatus() {
    this.clearedArr = getClearedStatus();
  }

  fetchAllDropdownData() {
    const observables: Observable<any>[] = [
      this.restService.getAllDriversForHOS(),
      this.restService.getAllVehiclesForHOS(),
      this.restService.get1000DispatchGroupsLight()
    ];
    combineLatest.apply(this, observables).subscribe(
      data => {
        this.drivers = this.defaultAllDrivers = data[0];
        this.vehicles = data[1];
        this.dispatchGroups = data[2];
        this.refreshData();
      });
  }

  findDriverName(driverId) {
    let driverData = this.drivers.find(d => d.id == driverId);
    return driverData ? `${driverData.firstName} ${driverData.lastName}` : '';
  }

  findVehicle(assetId) {
    let vehicleData = this.vehicles.find(v => v.id == assetId);
    return vehicleData ? vehicleData.name : '';
  }

  onDispatchGroupFilterChange() {
    if (this.filterOption.selectedDispatchGroupId !== 'all') {
      this.filterOption.selectedDriverId = 'all'
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

  onSelectAllVehicles() {
    this.filterOption.selectedVehicleId = this.vehicles.map(v => v.id);
    this.refreshData();
  }

  onRefreshDataTableInterval() {
    clearInterval(this.refreshDataTableInterval);
    this.refreshDataTableInterval = setInterval(() => {
      this.refreshData();
    }, REFRESH_TABLE_INTERVAL);
  }

  // this method will refresh the data when dropdown selection change
  refreshData() {
    this.convertFilterDateToISODate();
    this.onRefreshDataTableInterval();
    if (this.malfunctionsTable) {
      this.malfunctionsTable.ajaxReload();
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

  isNoComboboxDrivers () {
    // check existing of drivers on filter combobox
    return this.filterOption.selectedDriverIds && !this.filterOption.selectedDriverIds.length && this.filterOption.selectedDispatchGroupId !== 'all'
  }

  // excel downloading:
  private excelHeader = ["Date/Time", "Event", "Vin", "Vehicle", "Driver", "Remark", "Status"];
  private excelOptions = {
    title: 'Malfunctions & Data Diagnosis',
    fileName: 'malfunctions-and-data-diagnosis',
    header: this.excelHeader,
    data: [] // fill out in prepareDataForExcel
  }

  downloadExcel() {
    this.getDataForExcel().subscribe(async data => {
      this.prepareDataForExcel(data); // set data for excel table
      this.generateExcel();
    });
  }

  private generateExcel() {
    this.excelService.generateExcel(this.excelOptions);
  }
  
  private getDataForExcel() {
    // get data for excel
    return of(this.excelService.tableData)
  }

  private prepareDataForExcel(data: EldMalfunction[]) {
    this.excelOptions.data = data.map(item => {
      // fields
      const fields = {
        dateTime: moment(item.beginTimestamp).format("MM/DD/YYYY hh:mm A"),
        eventType: item.eventType,
        vin: item.vin,
        vehicle: this.findVehicle(item.assetId),
        driver: this.findDriverName(item.userId),
        remark: item.description,
        status: item.endTimestamp ? 'Cleared' : 'Not Yet Cleared'
      }
      // row
      const excelRowArray = Object.values(fields);
      return excelRowArray;
    })
  }
  // ***

}
