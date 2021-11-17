import { Component, OnInit, ViewChild, TemplateRef, Renderer2 } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import * as moment from 'moment';
import * as $ from 'jquery';
import * as _ from 'lodash';

import {
  RestService, FilterUnidentifiedDrivingOption, SingleAssignUnidentifiedDriving, LocalStorageService,
  FilterParams, DataTableService, DriverHistory, DriverHistoriesUnidentifiedDrivingEvents, PageResult
} from '@app/core/services';
import { ExcelService } from '@app/core/services/excel.service';
import { getTableLength, AuthState } from '@app/core/store/auth';
import { REFRESH_TABLE_INTERVAL } from '@app/core/smartadmin.config';
import { of } from 'rxjs';
import { plainToClassFromExist } from 'class-transformer';

export class BulkAssignUnidentifiedDriving {
  note: string;
  driverId: number = null;
  undefinedDrivingHistoryEvents: SingleAssignUnidentifiedDriving[] = [];
}

@Component({
  selector: 'app-unidentified-driving',
  templateUrl: './unidentified-driving.component.html',
  styleUrls: ['./unidentified-driving.component.css'],
  providers: [ExcelService]
})
export class UnidentifiedDrivingComponent implements OnInit {

  @ViewChild('undefinedDrivingEventTable') undefinedDrivingEventTable: any;
  @ViewChild('bulkUndefinedDrivingEventTable') bulkUndefinedDrivingEventTable: any;
  @ViewChild('singleAssignModal') singleAssign: TemplateRef<any>;
  @ViewChild('bulkAssignModal') bulkAssign: TemplateRef<any>;

  currentDate = new Date();
  tableLength: number;
  filterOption: FilterUnidentifiedDrivingOption;
  vehicles = [];
  terminals = [];
  drivers = [];
  undefinedDrivingEventOption: any;
  bulkUndefinedDrivingEventOption: any;
  singleAssignData: SingleAssignUnidentifiedDriving;
  bulkAssignData: BulkAssignUnidentifiedDriving;
  bulkAssingResultDataArr: any[];
  bulkSelectAllCheckbox: boolean;

  refreshDataTableInterval;

  orderColumns = ["Date/Time", "Event", "Vin", "Vehicle", "Location", "Lat / Lon", "Start / End Odometer", "Accumulated Miles", "Note", "Action"];
  valueColumns = [
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return moment(full.eventTime).format("MM/DD/YYYY hh:mm A");
      }.bind(this),
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return moment(full.autoEventEndTimestamp).format("MM/DD/YYYY hh:mm A");
      }.bind(this),
    },
    {
      data: 'eventType',
      orderable: false,
    },
    {
      data: 'vin',
      orderable: false,
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.findVehicle(full.assetId)
      }.bind(this)
    },
    {
      data: 'location',
      orderable: false,
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let lat = Number(full.latitude).toFixed(2);
        let lon = Number(full.longitude).toFixed(2);
        return `${lat} / ${lon}`
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return `${full.startOdometerInMi} / ${full.endOdometerInMi}`;
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return full.accumulatedMiles;
      }
    },
    {
      data: 'note',
      orderable: false,
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return `<span id="${full.id}" style="cursor: pointer;"><i class="fa fa-pencil" aria-hidden="true"></i></span>`
      }.bind(this)
    }
  ];

  defineOptions() {
    this.undefinedDrivingEventOption = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
        this.excelService.tableData = [];
        this.restService.getDriverHistoriesMetaUnidentifiedDrivingEvents(params, this.filterOption, this.tableLength, this.excelService.tableData)
          .subscribe(
            async (data: any) => {
              data.results = await this.mapResonseResultForundefinedDrivingEvent(data);
              callback({
                aaData: data ? data.results : [],
                recordsTotal: data ? data.resultCount : 0,
                recordsFiltered: data ? data.resultCount : 0
              })
            }
          );
      },
      columns: this.valueColumns,
      columnDefs: [
        { className: "text-center", targets: '_all' }
      ],
      order: [[0, 'asc']],
      rowCallback: (row: Node, data: any | Object, index: number) => {
        const self = this;
        let handler = (event) => {
          this.onSingleAssign(data);
        };
        $(`#${data.id}`, row).unbind('click', handler);
        $(`#${data.id}`, row).bind('click', handler);
        // add green background if row is assigned
        if (data.note !== 'Automatic Transition') {
          this.renderer.setStyle(row, 'background', '#dff0d8');
        }

        return row;
      },
      responsive: true
    }
  }

  async mapResonseResultForundefinedDrivingEvent(data, byOrder: boolean = false) {
    // get assetId and eventTime from first endpoint
    let dataArrForNextEndPoint: any[] = data.results.map(d => {
      return { assetId: d.assetId, eventTime: d.eventTime }
    });
    // get data from second endpoint - driver histories.
    let responseArr;
    if (byOrder) {
      responseArr = await this.getDriverHistoriesByCertainQuantityItems(dataArrForNextEndPoint);
    } else {
      responseArr = await this.getDriverHistories(dataArrForNextEndPoint);
    }
    return data.results.map((d: DriverHistoriesUnidentifiedDrivingEvents, i) => {
      let driverHistoryData: DriverHistory = responseArr[i][0];
      d.startOdometerInKm = d.odometerKm;
      d.startOdometerInMi = d.onStartOdometerInMi();
      d.endOdometerInKm = driverHistoryData ? driverHistoryData.odometerKm : null;
      d.endOdometerInMi = d.onEndOdometerInMi();
      d.accumulatedMiles = d.endOdometerInMi - d.startOdometerInMi;
      d.accumulatedMiles = d.accumulatedMiles < 0 ? 0 : d.accumulatedMiles;
      return d;
    });
  }

  constructor(
    private restService: RestService,
    private store: Store<AuthState>,
    private modalService: BsModalService,
    private lsService: LocalStorageService,
    private renderer: Renderer2,
    private excelService: ExcelService<DriverHistoriesUnidentifiedDrivingEvents>,
    private dataTableService: DataTableService) {
    this.bulkSelectAllCheckbox = false;
    let prevDate = new Date();
    prevDate.setHours(0, 0, 0);
    prevDate.setDate(prevDate.getDate() - 6);
    this.currentDate.setHours(0, 0, 0);
    this.filterOption = new FilterUnidentifiedDrivingOption();
    this.filterOption = {
      selectedVehicleId: [],
      dateRange: [
        prevDate,
        this.currentDate
      ],
      selectedTerminalId: 'all',
      ISODateRange: [],
      isUnassigned: true,
      isClassified: null
    }
    this.convertFilterDateToISODate();
    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      // temporary set table length for client side pagination as visTrack api not supporting paginations
      this.tableLength = 10;
      //get filter dropdown data
      this.getAllTerminals();
      this.getAllDrivers();
      this.getAllVehicles();
      this.defineOptions();
    });
  }

  async getDriverHistories(dataArrForNextEndPoint): Promise<any> {
    return Promise.all(dataArrForNextEndPoint.map(data => {
      return this.restService.getDriverHistoriesForUnidentifiedDriver(data, this.filterOption, 1).toPromise()
    }));
  }

  // method for sending requests for pointed quantity of items by order 
  async getDriverHistoriesByCertainQuantityItems(dataArrForNextEndPoint, quantityItems: number = 500): Promise<any> {
    let result = []
    const length = dataArrForNextEndPoint.length;
    const dividedLength = Math.ceil(length/quantityItems);
    for (let i = 0; i < dividedLength; i++) {
      const dividedDataArray = dataArrForNextEndPoint.slice(i * quantityItems, i * quantityItems + quantityItems);
      await Promise.all(dividedDataArray.map(data => {
        return this.restService.getDriverHistoriesForUnidentifiedDriver(data, this.filterOption, 1).toPromise()
      })).then((item: any) => {
        result = [...result, ...item]
      });
    }
    return result;
  }

  ngOnInit() {}

  convertFilterDateToISODate() {
    this.filterOption.ISODateRange[0] = this.filterOption.dateRange[0].toISOString();
    this.filterOption.ISODateRange[1] = this.filterOption.dateRange[1].toISOString();
  }

  getAllVehicles() {
    this.restService.getAllVehiclesForHOS().subscribe(val => {
      this.vehicles = val;
      this.refreshData();
    })
  }

  findVehicle(assetId) {
    let vehicleData = this.vehicles.find(v => v.id == assetId);
    return vehicleData ? vehicleData.name : '';
  }

  getAllTerminals() {
    this.restService.getAllTerminalForHOS().subscribe(val => {
      this.terminals = val;
    })
  }

  getAllDrivers() {
    this.restService.getAllDriversForHOS()
      .subscribe(
        data => {
          this.drivers = data;
        }
      );
  }

  onRefreshDataTableInterval() {
    clearInterval(this.refreshDataTableInterval);
    this.refreshDataTableInterval = setInterval(() => {
      this.refreshData();
    }, REFRESH_TABLE_INTERVAL);
  }

  // this method will refresh the data when dropdown selecion change
  refreshData() {
    this.convertFilterDateToISODate();
    this.onRefreshDataTableInterval();
    if (this.undefinedDrivingEventTable) {
      this.undefinedDrivingEventTable.ajaxReload();
    }
  }

  onSelectAllVehicles() {
    this.filterOption.selectedVehicleId = this.vehicles.map(v => v.id);
    this.refreshData();
  }

  /**
   * Edit Driver modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _singleAssign: BsModalRef;
  _bulkAssign: BsModalRef;

  onSingleAssign(data) {
    this.singleAssignData = data;
    this.singleAssignData.driverId = null;
    this._singleAssign = this.modalService.show(this.singleAssign, { class: "modal-450", ignoreBackdropClick: true })
  }

  onSaveSingleAssign() {
    this.singleAssignData.userId = this.singleAssignData.driverId;
    this.restService.updateDriverHistory([this.singleAssignData])
      .subscribe(res => {
        this._singleAssign.hide();
        this.refreshData();
      })
  }

  closeSingleAssignModal() {
    this._singleAssign.hide();
  }

  bulkOrderColumns = ["", "Status", "Vin", "Vehicle", "Start / End Odometer", "Accumulated Miles", "Date", "Time"];
  bulkValueColumns = [
    {
      data: '',
      orderable: false
    },
    {
      title: "Status",
      data: 'eventType',
      orderable: false,
    },
    {
      data: 'vin',
      orderable: false,
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return this.findVehicle(full.assetId)
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return `${full.startOdometerInMi} / ${full.endOdometerInMi}`;
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return full.accumulatedMiles;
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return moment(full.eventTime).format("MM/DD/YYYY");
      },
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return moment(full.eventTime).format("hh:mm A");
      },
    }
  ];

  defineOptionsForBulk() {
    this.bulkUndefinedDrivingEventOption = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        let params: FilterParams = this.dataTableService.calculateParams(data, this.bulkOrderColumns);
        this.restService.getDriverHistoriesMetaUnidentifiedDrivingEvents(params, this.filterOption, this.tableLength)
          .subscribe(
            async (data: any) => {
              this.bulkSelectAllCheckbox = false;
              // get assetId and eventTime from first endpoint
              let dataArrForNextEndPoint: any[] = data.results.map(d => {
                return { assetId: d.assetId, eventTime: d.eventTime }
              });
              // get data from second endpoint - driver histories.
              let responseArr = await this.getDriverHistories(dataArrForNextEndPoint);
              // calculate start, end odometer and accumulated miles.
              data.results = data.results.map((d: DriverHistoriesUnidentifiedDrivingEvents, i) => {
                let isDataChecked = this.bulkAssignData.undefinedDrivingHistoryEvents.find(checkboxData => checkboxData.id === d.id);
                d.isChecked = !!isDataChecked;

                let driverHistoryData: DriverHistory = responseArr[i][0];
                d.startOdometerInKm = d.odometerKm;
                d.startOdometerInMi = d.onStartOdometerInMi();
                d.endOdometerInKm = driverHistoryData.odometerKm;
                d.endOdometerInMi = d.onEndOdometerInMi();
                d.accumulatedMiles = d.endOdometerInMi - d.startOdometerInMi;
                d.accumulatedMiles = d.accumulatedMiles < 0 ? 0 : d.accumulatedMiles;
                return d;
              });
              this.bulkAssingResultDataArr = data.results;
              callback({
                aaData: data ? data.results : [],
                recordsTotal: data ? data.resultCount : 0,
                recordsFiltered: data ? data.resultCount : 0
              })
            }
          );
      },
      columns: this.bulkValueColumns,
      columnDefs: [
        {
          targets: 0,
          searchable: false,
          orderable: false,
          className: 'dt-body-center',
          render: function (data, type, full, meta) {
            return `<div style="text-align: center">
            <input type="checkbox" name="single-checkbox" class="undefined-driving-event-checkbox" 
            id="single-checkbox-${full.uuid}" value="${full.id}" ${full.isChecked ? 'checked' : ''}/></div>`;
          }.bind(this)
        },
        {
          className: "text-center", targets: '_all'
        }],
      order: [[1, 'desc']],
      rowCallback: (row: Node, data: any | Object, index: number) => {
        const self = this;
        let handler = (event) => {
          // handle single checkbox checked event
          if ($(`#single-checkbox-${data.uuid}`, row).is(':checked')) {
            self.bulkAssignData.undefinedDrivingHistoryEvents.push(data);
            self.bulkSelectAllCheckbox = self.isAllChecked();
          } else {
            _.remove(self.bulkAssignData.undefinedDrivingHistoryEvents, (d => data.id === d.id));
            self.bulkSelectAllCheckbox = false;
          }
        };

        // check every time for weather all checkbox is checked or not.
        self.bulkSelectAllCheckbox = !self.isAllChecked();

        // bind and unbind click method as per documentation
        $(`#single-checkbox-${data.uuid}`, row).unbind('change', handler);
        $(`#single-checkbox-${data.uuid}`, row).bind('change', handler);
        return row;
      }
    }
  }

  // check weather all checkbox is checked or not
  isAllChecked(): boolean {
    return this.bulkAssingResultDataArr.map(d => d.isChecked).some(s => !s)
  }

  onBulkAssign() {
    this.bulkAssignData = new BulkAssignUnidentifiedDriving();
    this._bulkAssign = this.modalService.show(this.bulkAssign, { class: "modal-60", ignoreBackdropClick: true })
    this.defineOptionsForBulk()
  }

  onSelectAllCheckBoxBulkUndefinedDrivingEvent() {
    let checkboxInput = $('.undefined-driving-event-checkbox', this.bulkUndefinedDrivingEventTable);
    if (!this.bulkSelectAllCheckbox) {
      // all checkbox is unselected
      checkboxInput.prop('checked', false);
      this.bulkAssignData.undefinedDrivingHistoryEvents = [];
    } else {
      // all checkbox is selected
      checkboxInput.prop('checked', true);
      checkboxInput.each(element => {
        let findData = this.bulkAssingResultDataArr.find(d => d.id == checkboxInput[element].value);
        if (findData)
          this.bulkAssignData.undefinedDrivingHistoryEvents.push(findData);
      });
    }
  }

  onSaveBulkAssign() {
    if (!this.bulkAssignData.undefinedDrivingHistoryEvents.length) {
      return;
    }
    let bodyData = this.bulkAssignData.undefinedDrivingHistoryEvents.map(d => {
      d.userId = this.bulkAssignData.driverId;
      d.note = this.bulkAssignData.note;
      return d;
    });
    this.restService.updateDriverHistory(bodyData)
      .subscribe(res => {
        this._bulkAssign.hide();
      })
  }

  closeBulkAssignModal() {
    this._bulkAssign.hide();
  }

  // excel downloading:
  private excelHeader = ["Date/Time", "Event", "Vin", "Vehicle", "Location", "Lat / Lon", "Start / End Odometer", "Accumulated Miles", "Note"];
  private excelOptions = {
    title: 'Unidentified Driving',
    fileName: 'unidentified-driving',
    header: this.excelHeader,
    data: [] // fill out in prepareDataForExcel
  }

  downloadExcel() {
    this.getDataForExcel().subscribe(async (data: any) => {
      data = plainToClassFromExist(
        new PageResult<DriverHistoriesUnidentifiedDrivingEvents>(DriverHistoriesUnidentifiedDrivingEvents), 
        {resultCount: data.length, results: data }
      );
      data = await this.mapResonseResultForundefinedDrivingEvent(data, true);
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

  private prepareDataForExcel(data: DriverHistoriesUnidentifiedDrivingEvents[]) {
    this.excelOptions.data = data.map(item => {
      // fields
      const fields = {
        dateTime: moment(item.eventTime).format("MM/DD/YYYY hh:mm A"),
        eventType: item.eventType,
        vin: item.vin,
        vehicle: this.findVehicle(item.assetId),
        location: item.location,
        latLon: `${Number(item.latitude).toFixed(2)} / ${Number(item.longitude).toFixed(2)}`,
        startEndOdometer: `${item.startOdometerInMi} / ${item.endOdometerInMi}`,
        accumulatedMiles: item.accumulatedMiles,
        note: item.note
      }
      // row
      const excelRowArray = Object.values(fields);
      return excelRowArray;
    })
  }
  // ***

}
