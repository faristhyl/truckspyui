import { Component, OnInit, ViewChild } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { combineLatest, Observable, of } from 'rxjs';
import * as moment from 'moment';

import {
  RestService, FilterLogEditsOption, LocalStorageService, FilterParams, DataTableService, DriverHistory, DispatchGroup
} from '@app/core/services';
import { ExcelService } from '@app/core/services/excel.service';
import { getTableLength, AuthState } from '@app/core/store/auth';
import { REFRESH_TABLE_INTERVAL } from '@app/core/smartadmin.config';
import { map, switchMap } from 'rxjs/operators';

export class LogEditsInnerChildRow {
  uuid: string;
  driverHistoryArr: DriverHistory[]
}

@Component({
  selector: 'app-log-edits',
  templateUrl: './log-edits.component.html',
  styleUrls: ['./log-edits.component.css'],
  providers: [ExcelService]
})
export class LogEditsComponent implements OnInit {
  @ViewChild('logEditsTable') logEditsTable: any;

  currentDate = new Date();
  tableLength: number;
  refreshDataTableInterval;
  private defaultAllDrivers = []; // drivers which we don't filter, for dispatch group 'All'
  private defaultDriversIdsForDispatchGroup: string[] = []; // drivers which we don't filter, for dispatch group 'All'
  dispatchGroups: DispatchGroup[] = [];
  drivers = [];
  vehicles = [];
  terminals = [];
  filterOption: FilterLogEditsOption;
  logEditsOption: any;
  innerChildRows: LogEditsInnerChildRow[];
  orderColumns = ["", "u.alias", "u.first-name", "a.name", "t.name", "event-time", "event-type", "change-requested-by-name", "last-changed-date", "edit_reason"];
  valueColumns = [
    {
      "className": 'details-control',
      "orderable": false,
      "data": null,
      "defaultContent": ''
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.findDriverAlias(full.userId);
      }.bind(this)
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.findDriverName(full.userId);
      }.bind(this)
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.findVehicle(full.assetId);
      }.bind(this)
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.findTerminalByAccountId(full.accountId);
      }.bind(this)
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return moment(full.eventTime).format("MM/DD/YYYY hh:mm A");
      }.bind(this),
    },
    {
      data: 'eventType',
      orderable: true,
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return `${data.changeRequestedByName ? data.changeRequestedByName : ''}`;
      }.bind(this),
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return moment(full.lastChangedDate).format("MM/DD/YYYY hh:mm A");
      }.bind(this),
    },
    {
      data: '',
      orderable: true,
      render: function (data, type, full, meta) {
        return `${full.editReason ? full.editReason : `Other: ${full.note}`}`;
      }.bind(this),
    }
  ];

  defineOptions() {
    this.logEditsOption = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        let params: FilterParams = this.dataTableService.calculateParamsForVis(data, this.orderColumns);
        this.excelService.tableData = [];
        this.restService.getDriverHistoriesForLogEdits(params, this.filterOption, this.tableLength, this.excelService.tableData)
          .subscribe(
            data => {
              this.innerChildRows = [];
              Promise.all(data.results.map(r => {
                return new Promise((resolve, reject) => {
                  this.restService.getDriverHistoriesByUuid(r.uuid).toPromise()
                    .then(d => {
                      let innerChildData = new LogEditsInnerChildRow();
                      innerChildData.uuid = r.uuid;
                      innerChildData.driverHistoryArr = d;
                      resolve(innerChildData)
                    }).catch(error => {
                      reject(error);
                    })
                })
              })).then((response: LogEditsInnerChildRow[]) => {
                this.innerChildRows = response;
                if (this.drivers.length) {
                  callback({
                    aaData: data ? data.results : [],
                    recordsTotal: data ? data.resultCount : 0,
                    recordsFiltered: data ? data.resultCount : 0
                  })
                } else {
                  callback({ aaData: [], recordsTotal: 0, recordsFiltered: 0 })
                }
              }).catch(error => {
                console.error('Error while getting data');

              })
            }
          );
      },
      columns: this.valueColumns,
      order: [[8, 'desc']],
      rowCallback: (row: Node, data: any | Object, index: number) => {
        const self = this;
        let handler = (event) => {
          var tr = $(row)[0];
          var selectedRow = this.logEditsTable.getRow(tr);

          if (selectedRow.child.isShown()) {
            // This row is already open - close it
            selectedRow.child.hide();
            $(tr).removeClass('shown');
          }
          else {
            // Open this row
            let innerData = self.findInnerChildDataByUuid(data.uuid);
            selectedRow.child(this.generateTable(innerData.driverHistoryArr)).show();
            $(tr).addClass('shown');
          }
        };
        $(`.details-control`, row).unbind('click', handler);
        $(`.details-control`, row).bind('click', handler);
        return row;
      },
    };
  }

  findInnerChildDataByUuid(uuid: string): LogEditsInnerChildRow {
    return this.innerChildRows.filter(child => child.uuid === uuid)[0];
  }

  generateTable(data: DriverHistory[]) {
    return `
        <table class="table table-striped table-bordered table-hover" style="margin: 20px 0px 20px 0px;">
          <tr>
            <th class="col">Driver Id</th>
            <th class="col">Driver Name</th>
            <th class="col">Vehicle</th>
            <th class="col">Status</th>
            <th class="col">Changed By</th>
            <th class="col">Date/Time of Edit</th>
          </tr>
          <tr>
            <td>${this.findDriverAlias(data[1].userId)}</td>
            <td>
              ${data[1].hasOwnProperty('changeRequestedByName') ?
        this.findDriverName(data[1].userId) :
        data[1].recordOrigin === 'FromUnidentifiedDriver' ? 'Unidentified Driver' : ''}
            </td>
            <td>${this.findVehicle(data[1].assetId)}</td>
            <td>${data[0].eventType}</td>
            <td>${data[1].changeRequestedByName ? data[1].changeRequestedByName : ''}</td>
            <td>${moment(data[1].eventTime).format("MM/DD/YYYY hh:mm A")}</td>
          </tr>
        </table>
          `;
  }

  constructor(
    private restService: RestService,
    private store: Store<AuthState>,
    private lsService: LocalStorageService,
    private dataTableService: DataTableService,
    private excelService: ExcelService<DriverHistory>
  ) {
    let prevDate = new Date();
    prevDate.setDate(prevDate.getDate() - 7);
    this.filterOption = new FilterLogEditsOption();
    this.filterOption = {
      selectedDispatchGroupId: 'all',
      selectedDriverId: 'all',
      selectedTerminalId: 'all',
      logType: 'all',
      isFilterByDriverId: false,
      dateRange: [
        prevDate,
        this.currentDate
      ],
      ISODateRange: []
    }
    this.convertFilterDateToISODate();
    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      // fetch data for 2 dropdown drivers, terminals
      this.fetchAllDropdownData();
      // temporary set table length for client side pagination as visTrack api not supporting pagination
      this.tableLength = 10;
      this.defineOptions();
      this.refreshData();
    });
  }

  ngOnInit() {}

  fetchAllDropdownData() {
    const observables: Observable<any>[] = [
      this.restService.getAllDriversForHOS(),
      this.restService.getAllTerminalForHOS(),
      this.restService.getAllVehiclesForHOS(),
      this.restService.get1000DispatchGroupsLight()
    ];
    combineLatest.apply(this, observables).subscribe(data => {
      this.drivers = this.defaultAllDrivers = data[0];
      this.terminals = data[1];
      this.vehicles = data[2];
      this.dispatchGroups = data[3]
      this.refreshData();
    });
  }

  findDriverName(driverId) {
    let driverData = this.drivers.find(d => d.id == driverId);
    return driverData ? `${driverData.name()}` : '';
  }

  findDriverAlias(driverId) {
    let driverData = this.drivers.find(d => d.id == driverId);
    return driverData ? driverData.alias : '';
  }

  findVehicle(assetId) {
    let vehicleData = this.vehicles.find(v => v.id == assetId);
    return vehicleData ? vehicleData.name : '';
  }

  findTerminalByAccountId(accountId) {
    let terminalData = this.terminals.find(t => t.accountId == accountId);
    return terminalData ? terminalData.name : '';
  }

  onRefreshDataTableInterval() {
    clearInterval(this.refreshDataTableInterval);
    this.refreshDataTableInterval = setInterval(() => {
      this.refreshData();
    }, REFRESH_TABLE_INTERVAL);
  }

  refreshData() {
    this.onRefreshDataTableInterval();
    this.convertFilterDateToISODate();
    if (this.logEditsTable) {
      this.logEditsTable.ajaxReload();
    }
  }

  convertFilterDateToISODate() {
    this.filterOption.ISODateRange[0] = this.filterOption.dateRange[0].toISOString();
    this.filterOption.ISODateRange[1] = this.filterOption.dateRange[1].toISOString();
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
  private excelHeader = ["Driver Id", "Driver Name", "Vehicle", "Terminal", "Log Date/Time", "Status", "Changed By", "Date/Time of Edit", "Reason for Edit"];
  private excelOptions = {
    title: 'Log Edits',
    fileName: 'log-edits',
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
    return of(this.excelService.tableData);
  }

  private prepareDataForExcel(data: DriverHistory[]) {
    this.excelOptions.data = data.map(item => {
      // fields
      const fields = {
        driverId: this.findDriverAlias(item.userId),
        driverName: this.findDriverName(item.userId),
        vehicle: this.findVehicle(item.assetId),
        status: this.findTerminalByAccountId(item.accountId),
        logDateTime: moment(item.eventTime).format("MM/DD/YYYY hh:mm A"),
        eventType: item.eventType,
        changeRequestedByName: `${item.changeRequestedByName ? item.changeRequestedByName : ''}`,
        dateTimeOfEdit: moment(item.lastChangedDate).format("MM/DD/YYYY hh:mm A"),
        reasonForEdit: `${item.editReason ? item.editReason : `Other: ${item.note}`}`
      }
      // row
      const excelRowArray = Object.values(fields);
      return excelRowArray;
    })
  }
  // ***
}