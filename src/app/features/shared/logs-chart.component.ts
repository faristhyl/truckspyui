import { Component, OnInit, TemplateRef, ViewChild, Input } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest, Observable, of } from 'rxjs';
import { NgForm } from '@angular/forms';
import { map, take } from 'rxjs/operators';
import * as moment from 'moment';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { REFRESH_TABLE_INTERVAL } from '@app/core/smartadmin.config';

import {
  DataTableService, Driver, DriverDailies, DriverDailiesUtil, DriverHistory, DriverHistoryUpdateDetails, DriverViolationObject,
  FilterParams, FilterReportOption, LocalStorageService, RestService
} from '@app/core/services';
import { ExcelService } from '@app/core/services/excel.service';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { HumanizePipe } from '@app/shared/pipes/utils.pipe';
import { getTableLength } from '@app/core/store/auth';
import { select, Store } from '@ngrx/store';
import { getConfigStatesKeyValues } from '@app/core/store/config';

declare var $: any;
export const getDriverHistoryUpdateDataReasons = () => {
  return [
    'Driver Not Logged On',
    'ELD Device Failure',
    'Engineers Road Test',
    'Incorrect Data Entered',
    'Incorrect Status Selected',
    'Missing GPS Location',
    'Rental Vehicle no ELD on-board',
    'Other',
  ]
};

@Component({
  selector: 'app-logs-chart',
  templateUrl: './logs-chart.component.html',
  styleUrls: ['./logs-chart.component.css'],
  providers: [ExcelService]
})
export class LogsChartComponent implements OnInit {
  @ViewChild('driverHistoryTable') driverHistoryTable: any;
  @ViewChild('editDriverHistoryModal') editDriverHistory: TemplateRef<any>;
  @ViewChild('d3ChartZoomInOutModal') d3ChartZoomInOutModal: TemplateRef<any>;

  @Input('isShowOnlyChart') isShowOnlyChart: boolean;
  @Input('selectedDriverId') selectedDriverId: string;

  isDateDriverTimeZone: boolean = false;
  drivers = [];
  driversLoaded: boolean = false;
  driverId: string;
  loaded: boolean = false;
  selectedDriver: Driver;
  driverData: DriverDailies;
  driverHistoryUpdateData: DriverHistoryUpdateDetails;
  refreshDataTableInterval;
  totalMileageInMi: number;
  driverLogs: any = {};
  violations = {
    // Driver is continuously in driving for more than 11 hours
    hour11Violation: [],
    // Driver is continuously in Driving or OnDuty (without sleeping or OffDuty) for more than 14 hours
    hour14Violation: [],
    // Driver is allowed to work/rest only for 70 Hours in 8 days.
    hour70Violation: [],
    // After 70 hour violations driver has to be in OffDuty for min 34 Hours before next OnDuty/ Driving.Breaking this is 70 hours violation
    hour34Violation: [],
    hour30Violation: [],
  }
  dateMaxDate: Date = new Date();
  logDataArr = [];
  exceptions = [];
  driversLogsLoaded: boolean = false;
  selectedDate: string = new Date().toDateString();
  dateTimePickerDate: Date = new Date();
  chartsDataLoaded: boolean = true;
  vehicleLocationLoaded: boolean = true;
  isSelectedDateOn: boolean = false;
  isDriverHistoryUpdateStatusDisabled: boolean = false;
  logParams = {
    driverId: null
  }

  logsChartApi: { checkDriverDetailsExceptionsExist$: Function } = { // methods of child components (GridChartComponent)
    checkDriverDetailsExceptionsExist$: (date) => this.checkDriverDetailsExceptionsExist$(date),
  }

  tableLength: number;
  chartImg: string | ArrayBuffer;
  orderColumns = [null, 'event_time', 'event_type', 'location', 'note', null, null, null, null];
  valueColumns = [
    {
      data: null,
      orderable: false,
      render: (data, type, full, meta) => {
        return meta.row + 1 + meta.settings.oAjaxData.start;
      }
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.adjustTime(full.eventTime);
      }.bind(this)
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.getStatus(full);
      }.bind(this)
    },
    {
      data: 'location',
      orderable: true
    },
    {
      data: 'note',
      orderable: true
    },
    {
      data: 'vehicleName',
      orderable: false
    },
    {
      data: null,
      orderable: false,
      render: (data, type, full, meta) => {
        return this.getOdometer(full);
      }
    },
    {
      data: null,
      orderable: false,
      render: (data, type, full, meta) => {
        return this.getViolation(full);
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return `<span id="${full.uuid}" class="edit-data" style="cursor: pointer"><i class="fa fa-pencil"></i></span>`;
      },
    }
  ];

  getStatus(full) {
    let eventType = this.humanizePipe.transform(full.eventType);
    return `${eventType + (full.driverEdit ? ' (edited)': '')}`;
  }

  getOdometer(full) {
    let manualOdometer = full.odometerSource == "Manual" ? `<span class="hos-log-entry-marker">M</span>` : ``;
    return `${manualOdometer}${full.odometer()}`;
  }

  getViolation(full) {
    let violationStr = '';
    let violationArr = full.violations ? full.violations.DriverViolations : null;

    const addViolation = (label: string) => {
      let findViolation: DriverViolationObject = violationArr.find(v => v.iconLabel == label);
      let violationTooltip = null;
      if (this.isDateDriverTimeZone) {
        let violationTooltipArr = findViolation.toolTipText.split('Violation at');
        let violationTooltipDateTime = this.adjustDateTime(moment(violationTooltipArr[1].trim()));
        violationTooltip = `${violationTooltipArr[0]}Violation at ${moment(violationTooltipDateTime).format('DD-MMM-YY HH:mm')}`
      }
      violationStr += `<span data-toggle="tooltip" data-placement="left" title="${violationTooltip ? violationTooltip : findViolation.toolTipText}" style="background-color: rgb(221, 68, 54);padding: 1px 8px 1px 8px; color: white; cursor: pointer; margin-bottom: 3px; display: inline-block;">${label}</span> <br />`
    }

    if (violationArr) {
      if (full.hour11Violation) {
        addViolation('11');
      }
      if (full.hour14Violation) {
        addViolation('14');
      }
      if (full.hour30Violation) {
        addViolation('30');
      }
      if (full.hour34Violation) {
        addViolation('34');
      }
      if (full.hour70Violation) {
        addViolation('70');
      }
    }

    return violationStr;
  }

  adjustDateTime(dateTime) {
    let retTime = dateTime;
    if (this.isDateDriverTimeZone) {
      retTime = this.dateService.transformDateTime(dateTime);
    }
    return retTime;
  }

  adjustDate(date) {
    let retTime = date;
    if (this.isDateDriverTimeZone) {
      retTime = this.dateService.transformDate(date);
    }
    return retTime;
  }

  adjustTime(time) {
    let retTime = time;
    if (this.isDateDriverTimeZone) {
      retTime = this.dateService.transformDateTime(time);
    }
    return moment(retTime).format("hh:mm A");
  }

  isDateMatch(eventTime, selectedDate) {
    if (this.isDateDriverTimeZone) {
      return this.dateService.transformDate(eventTime) === moment(selectedDate).format('YYYY-MM-DD');
    } else {
      return moment(eventTime).format('YYYY-MM-DD') === moment(selectedDate).format('YYYY-MM-DD');
    }
  }

  driverHistoryTableOptionsOptions: any;
  defineOption() {
    this.driverHistoryTableOptionsOptions = {
      // paging: false,
      // info: false,
      noToolbar: true,
      noToolbarFooter: true,
      processing: true,
      serverSide: true,
      pageLength: -1,
      ajax: (data, callback, settings) => {
        let fromDate = new Date(this.selectedDate);
        fromDate.setDate(fromDate.getDate() - 15);
        fromDate.setHours(24, 0, 0);
        let toDate = new Date(this.selectedDate);
        toDate.setDate(toDate.getDate() + 2);
        toDate.setHours(24, 0, 0);
        let params: FilterParams = this.dataTableService.calculateParamsForVis(data, this.orderColumns);
        let driverId = this.driverId;

        if (driverId) {
          this.restService.getDriverHistories(params, driverId, fromDate.toISOString(), toDate.toISOString())
            .subscribe(histories => {
              this.restService.getDriverViolations(driverId)
                .subscribe(driverViolation => {
                  this.exceptions = [];
                  // Filter data which has violations
                  let allViolationArr = driverViolation.filter(v => v.violations || v.cycleResetTimestamp);

                  // checking and adding violations in data
                  histories = histories.map(d => {
                    let findViolation = allViolationArr.find(v => Number(v.driverHistoryId) === Number(d.id))
                    if (findViolation) {
                      d.violations = findViolation.violations;
                      d.cycleResetTimestamp = findViolation.cycleResetTimestamp;
                    }
                    return d;
                  })

                  // checking and adding violations in data
                  this.checkAndAddViolationsInData([...histories]);
                  // data processing for chart
                  this.processDriverHistory([...histories]);
                  // update Vehicle info for each driver history log
                  let resultset = histories.filter((history: DriverHistory, index) => {
                    let b = this.isDateMatch(history.eventTime, this.selectedDate);
                    if (b && this.loaded) {
                      let name = this.driverData && this.driverData.vehicle && this.driverData.vehicle.name ?
                        this.driverData.vehicle.name :
                        '';
                      history.setVehicle(name);
                    }
                    return b;
                  });

                  let driverData = new DriverDailies();
                  if (resultset.length > 0) {
                    this.totalMileageInMi = driverData.onTotalMileageInMi(resultset[resultset.length - 1].odometerKm,
                      resultset[0].odometerKm);
                  } else {
                    this.totalMileageInMi = 0;
                  }
                  this.driverData.totalMileageInMi = this.totalMileageInMi;
                  this.logDataArr = resultset;
                  callback({
                    aaData: resultset,
                    recordsTotal: resultset.length,
                    recordsFiltered: resultset.length
                  })
                })
            });
        } else {
          callback({
            aaData: [],
            recordsTotal: 0,
            recordsFiltered: 0
          })
        }
      },
      columns: this.valueColumns,
      order: [[1, 'asc']],
      rowCallback: (row: Node, data: any | Object, index: number) => {
        if (data.driverEdit) {
          $(row).addClass('hos-log-edited');
        }
  
        const self = this;
        let handler = (event) => {
          self.onEditDriverHistory(data);
        };

        $(`#${data.uuid}`, row).unbind('click', handler);
        $(`#${data.uuid}`, row).bind('click', handler);
        return row;
      },
      responsive: true
    };
  }

  checkAndAddViolationsInData(driverHistoryArr) {
    let eventNameArr = ['OffDuty', 'Sleeper', 'Driver', 'OnDuty'];
    this.violations.hour11Violation = [];
    this.violations.hour14Violation = [];
    this.violations.hour30Violation = [];
    this.violations.hour34Violation = [];
    this.violations.hour70Violation = [];
    const addViolation = (prevEventTime, prevDayEvent, prevDriverEdit, eventDate, violationType) => {
      // add violations for chart based on violations
      this.violations[violationType].push({
        type: (violationType === 'hour34Violation') ? "Vert" : "Horz",
        beginTime: this.alignedToNearestMin(prevEventTime),
        endTime: this.adjustEndTime(prevEventTime, eventDate),
        beginEvent: prevDayEvent,
        endEvent: prevDayEvent,
        driverEdit: prevDriverEdit,
        showTime: false
      })
    }
    // sort driverHistory Array based on timestamp in ascending order
    driverHistoryArr = driverHistoryArr.sort((a, b) => {
      let beginDateTime: any = new Date(a.eventTime);
      let endDateTime: any = new Date(b.eventTime);
      return beginDateTime - endDateTime;
    })

    const getNextDriverHistoryEvent = (eventType, index: number) => {
      for (var i = index; i < driverHistoryArr.length; i++) {
        if (driverHistoryArr[i].eventType != eventType && eventNameArr.indexOf(driverHistoryArr[i].eventType) !== -1)
          return driverHistoryArr[i++];
      }
    }

    driverHistoryArr = driverHistoryArr.map((driverHistory: DriverHistory, i) => {
      if (driverHistory.violations) {
        let violationArr = driverHistory.violations.DriverViolations;
        let nextEvent: DriverHistory = getNextDriverHistoryEvent(driverHistory.eventType, i);

        if (nextEvent) {
          let nextEventTimeMoment = moment(this.adjustDateTime(nextEvent.eventTime));

          violationArr.forEach(violation => {
            let eventDateMoment = moment(this.adjustDateTime(violation.timestamp));
            if (violation.iconLabel === '11') {
              driverHistory.addHour11Violation();
              addViolation(eventDateMoment, driverHistory.eventType, driverHistory.driverEdit, nextEventTimeMoment, 'hour11Violation')
            }

            if (violation.iconLabel === '14') {
              driverHistory.addHour14Violation();
              addViolation(eventDateMoment, driverHistory.eventType, driverHistory.driverEdit, nextEventTimeMoment, 'hour14Violation')
            }

            if (violation.iconLabel === '30') {
              driverHistory.addHour30Violation();
              addViolation(eventDateMoment, driverHistory.eventType, driverHistory.driverEdit, nextEventTimeMoment, 'hour30Violation')
            }

            if (violation.iconLabel === '70') {
              driverHistory.addHour70Violation();
              addViolation(eventDateMoment, driverHistory.eventType, driverHistory.driverEdit, nextEventTimeMoment, 'hour70Violation')
            }
          })
        }
      }

      if (driverHistory.cycleResetTimestamp) {
        let selectedDateToDate = moment(this.selectedDate).format('YYYY-MM-DD');
        if (moment(this.adjustDateTime(selectedDateToDate)).format('YYYY-MM-DD') === moment(this.adjustDateTime(driverHistory.cycleResetTimestamp)).format('YYYY-MM-DD')) {
          driverHistory.addHour34Violation();
          this.add34CycleResetEvent(moment(this.adjustDateTime(driverHistory.cycleResetTimestamp)), "hour34ExceptionTime");
        }
      }
      return driverHistory;
    })
    return driverHistoryArr;
  }

  statusArr = [
    'OnDuty',
    'OffDuty',
    'Driving',
    'Sleeper',
    'PersonalUse',
    'Remark',
    'Inter',
    'PowerOn',
    'PowerOff',
    'Login'
  ];

  states: any[];

  driverHistoryUpdateDataReasonArr = getDriverHistoryUpdateDataReasons();

  /**
   * Constructor to instantiate an instance of ComposeComponent.
   */
  constructor(
    private store: Store<any>,
    private restService: RestService,
    private dataTableService: DataTableService,
    private dateService: DateService,
    private humanizePipe: HumanizePipe,
    private lsService: LocalStorageService,
    private modalService: BsModalService,
    private router: Router,
    private excelService: ExcelService<DriverHistory>
  ) {
    if (this.router.getCurrentNavigation()) {
      let params = this.router.getCurrentNavigation().extras.state;
      if (params) this.logParams.driverId = params.driverId;
    }
  }

  driverChanged(newDriverId) {
    this.selectedDriver = this.drivers.find(d => d.id == newDriverId);
    this.driverId = newDriverId;
    this.loadDriverDetails(newDriverId);
  }

  onPreviousDate() {
    let currentDate = new Date(this.selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    this.selectedDate = currentDate.toDateString();
    this.loadDriverDetails(this.driverId);
  }

  openDatePicker() {
    this.isSelectedDateOn = !this.isSelectedDateOn;
    this.dateTimePickerDate = new Date(this.selectedDate);
  }

  onSelectedDateChange(dateTimePicker) {
    this.isSelectedDateOn = false;
    let currentDate = new Date(dateTimePicker);
    this.selectedDate = currentDate.toDateString();
    this.loadDriverDetails(this.driverId);
  }

  onNextDate() {
    let currentDate = new Date(this.selectedDate);
    if (moment(currentDate, 'YYYY-MM-DD').format('YYYY-MM-DD') ===
      moment(this.dateMaxDate, 'YYYY-MM-DD').format('YYYY-MM-DD')) {
      return false;
    }
    currentDate.setDate(currentDate.getDate() + 1);
    this.selectedDate = currentDate.toDateString();
    this.loadDriverDetails(this.driverId);
    return true;
  }
  onChangeDateTimeZone() {
    this.loadDriverDetails(this.driverId);
  }

  ngOnInit() {
    this.defineOption();
    const observables: Observable<any>[] = [
      this.store.pipe(select(getConfigStatesKeyValues), take(1)),
      this.store.select(getTableLength),
      this.restService.getAllDriversForHOS(),
    ];
    combineLatest.apply(this, observables).subscribe(
      data => {
        this.states = data[0];
        let length = data[1];
        this.drivers = data[2];
        if (this.drivers.length) {
          if (this.selectedDriverId) {
            this.driverId = this.selectedDriverId;
            this.selectedDriver = this.drivers.find(d => d.id == this.driverId);
          } else if (this.logParams.driverId) {
            this.driverId = this.logParams.driverId;
            this.selectedDriver = this.drivers.find(d => d.id == this.driverId);
          } else {
            this.driverId = this.drivers[0].id;
            this.selectedDriver = this.drivers[0];
          }

          let loggedInAs = this.lsService.getLoginAs();
          this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
          // temporary set table length for client side pagination as visTrack api not supporting pagination
          this.tableLength = 10;
          this.loadDriverDetails(this.driverId);
          this.driversLoaded = true;
        }
      });
  }

  exceptionsMap = {
    usa: [],
    canada: []
  };
  exceptionsList = [];
  exceptionsUSA = false;
  exceptionsCanada = false;
  usaSelected = true;
  showUSA() {
    this.usaSelected = true;
    this.exceptionsList = this.exceptionsMap.usa;
  }
  showCanada() {
    this.usaSelected = false;
    this.exceptionsList = this.exceptionsMap.canada;
  }

  prepareFilterOptionsForDetails(driverId, date = this.selectedDate) {
    let fromDate = new Date(date);
    fromDate.setDate(fromDate.getDate() - 14);
    let toDate = new Date(date);
    let filterOption = new FilterReportOption();
    filterOption.userId = driverId;

    let toDateParam = this.dateService.transform2OdometerDate(toDate)
    filterOption.onlyDate = [
      this.dateService.transform2OdometerDate(fromDate),
      toDateParam
    ]
    return {
      filterOption,
      toDateParam
    };
  }
  loadDriverDetails(driverId) {
    const { filterOption, toDateParam } = this.prepareFilterOptionsForDetails(driverId);
    this.restService
      .getDriverDailies(null, filterOption).subscribe(theResult => {
        this.driverData = theResult.results[0];
        this.exceptionsMap = new DriverDailiesUtil(theResult.results).getExceptions(toDateParam);
        
        this.exceptionsUSA = this.exceptionsMap.usa.length > 0;
        this.exceptionsCanada = this.exceptionsMap.canada.length > 0;
        this.usaSelected = this.exceptionsUSA;
        this.exceptionsList = this.exceptionsMap.usa;

        if (this.driverData) {
          this.driverData.totalMileageInMi = this.totalMileageInMi;
          if (this.driverData) this.loaded = true;
          this.refreshHistoryTable();
        }
      });
  }

  // check exceptions existing of driver details for certain date, it is used in app-gridchart
  checkDriverDetailsExceptionsExist$(date) {
    const { filterOption, toDateParam } = this.prepareFilterOptionsForDetails(this.driverId, date);
    return this.restService.getDriverDailies(null, filterOption).pipe(map((theResult) => {
      const exceptionsMap = new DriverDailiesUtil(theResult.results).getExceptions(toDateParam);
      const exceptionsUSA = exceptionsMap.usa.length > 0;
      const exceptionsCanada = exceptionsMap.canada.length > 0;
      return exceptionsUSA || exceptionsCanada;
    }))
  }

  alignedToNearestMin(eventTime) {
    return eventTime.add(30, 'seconds').startOf('minute');
  }

  adjustEndTime(startTime, endTime) {
    var duration = moment.duration(endTime.diff(startTime)).asMilliseconds();
    if (duration < 60000) {
      endTime.add(60000 - duration, 'milliseconds');
    }
    return this.alignedToNearestMin(endTime);
  }

  add34CycleResetEvent(eventTime, status) {
    this.exceptions.push({
      type: "Vert",
      eventType: status,
      beginTime: this.alignedToNearestMin(eventTime),
      endTime: this.alignedToNearestMin(eventTime),
      beginEvent: null,
      endEvent: null
    });
  }

  addRemarkEvent(eventTime, startEventType, endEventType, note) {
    let eldStatus = "none";
    if (note === "VBUS Connected") {
      eldStatus = "Connected";
    } else if (note === "VBUS Disconnected") {
      eldStatus = "Disconnected";
    }
    this.exceptions.push({
      type: "Vert",
      eventType: "Remark",
      beginTime: this.alignedToNearestMin(eventTime),
      endTime: this.alignedToNearestMin(eventTime),
      beginEvent: startEventType,
      endEvent: endEventType,
      eldStatus: eldStatus
    });
  }

  processDriverHistory(driverHistory) {
    let eventStatus = [];
    let excludeDriveTimeEvents = [];
    let totalStatus = {
      OffDuty: 0,
      Sleeper: 0,
      Driving: 0,
      OnDuty: 0,
      all: 0
    }
    let noEventForDay = true;
    let isOffDutyEventOccur = false,
      isOnDutyEventOccur = false,
      isDrivingEventOccur = false,
      isSleeperEventOccur = false;
    const statusArr = ["OffDuty", "OnDuty", "Driving", "Sleeper"];
    let dayStart = moment(moment(this.selectedDate).format('YYYY-MM-DD'));
    let dayEnd = moment(moment(this.selectedDate).format('YYYY-MM-DD')).add(1, 'day');
    dayEnd = dayEnd.subtract(1, 'seconds');

    const alignedToNearestMin = function (eventTime) {
      return eventTime.add(30, 'seconds').startOf('minute');
    }
    const adjustEndTime = function (startTime, endTime) {
      var duration = moment.duration(endTime.diff(startTime)).asMilliseconds();
      if (duration < 60000) {
        endTime.add(60000 - duration, 'milliseconds');
      }
      return alignedToNearestMin(endTime);
    }

    // Sort driverHistory records based on eventTime
    let sDriverHistory = driverHistory.sort((histA, histB) => moment(this.adjustDateTime(histA.eventTime)).diff(this.adjustDateTime(histB.eventTime)));

    // Filter History collection for inactive event
    const historyCollectionSize = sDriverHistory.length;

    // Filter history item if it is already edited
    for (let i = 0; i < historyCollectionSize; i += 1) {
      for (let j = 0; j < historyCollectionSize; j += 1) {
        if (sDriverHistory[i].id !== sDriverHistory[j].id &&
          sDriverHistory[i].uuid === sDriverHistory[j].uuid &&
          sDriverHistory[i].recordStatus === "Active" &&
          sDriverHistory[j].recordStatus === "InactiveChangeRequested" &&
          !sDriverHistory[j].deletedAt) {
          sDriverHistory[i].hasPendingRequest = true;
        }
      }
    }

    // Filter history item if has same uuid
    for (let i = 0; i < historyCollectionSize; i += 1) {
      for (let j = 0; j < historyCollectionSize; j += 1) {
        if (sDriverHistory[i].id !== sDriverHistory[j].id &&
          sDriverHistory[i].uuid === sDriverHistory[j].uuid &&
          !sDriverHistory[j].deletedAt) {
          sDriverHistory[i].noSameUUID = false;
          break;
        }
      }
    }

    // Let the deactivated event(s) also display
    for (let i = 0; i < historyCollectionSize; i += 1) {
      for (let j = 0; j < historyCollectionSize; j += 1) {
        if (sDriverHistory[i].id !== sDriverHistory[j].id &&
          sDriverHistory[i].uuid === sDriverHistory[j].uuid &&
          sDriverHistory[i].recordStatus === "InactiveChanged" &&
          sDriverHistory[j].recordStatus === "InactiveChanged" &&
          !sDriverHistory[j].deletedAt) {
          sDriverHistory[i].noSameUUIDParent = sDriverHistory[i].id > sDriverHistory[j].id;
          break;
        }
      }
    }

    let prevDayEvent = null, prevEventTime = null, prevDriverEdit = false;
    let firstEventOfDay = true;
    sDriverHistory.forEach((history) => {
      if (history.recordStatus === 'InactiveChanged' || history.recordStatus === 'InactiveChangeRequested') return;
      let eventDate = moment(this.adjustDateTime(history.eventTime));
      if (eventDate < dayStart) { // prevDay
        if (statusArr.indexOf(history.eventType) !== -1) prevDayEvent = history.eventType;
        prevDriverEdit = history.driverEdit;
      } else if (this.isDateMatch(history.eventTime, this.selectedDate)) {
        if (history.eventType === 'Remark') {
          this.addRemarkEvent(eventDate, prevDayEvent, "Remark", history.note);
        } else {
          // add ExcludeDriveTime to excludeDriveTimeEvents of driverLogs for changing line's color in GridChartComponent
          if (history.eventType == 'ExcludeDriveTime') {
            excludeDriveTimeEvents.push({
              type: 'ExcludeDriveTime',
              eventTime: moment(this.adjustDateTime(history.eventTime))
            })
          }
          if (statusArr.indexOf(history.eventType) === -1 || history.eventType === 'PersonalUse') return;

          let showTime = false;
          switch (history.eventType) {
            case "OffDuty":
              showTime = isOffDutyEventOccur;
              isOffDutyEventOccur = true;
              break;
            case "Sleeper":
              showTime = isSleeperEventOccur;
              isSleeperEventOccur = true;
              break;
            case "Driving":
              showTime = isDrivingEventOccur;
              isDrivingEventOccur = true;
              break;
            case "OnDuty":
              showTime = isOnDutyEventOccur;
              isOnDutyEventOccur = false;
              break;
          }

          noEventForDay = false;
          if (firstEventOfDay) {
            // Add Event for Horz Line
            eventStatus.push({
              type: "Horz",
              beginTime: alignedToNearestMin(dayStart),
              endTime: adjustEndTime(dayStart, eventDate),
              beginEvent: prevDayEvent ? prevDayEvent : "OffDuty",
              endEvent: prevDayEvent ? prevDayEvent : "OffDuty",
              driverEdit: prevDriverEdit,
              showTime: true
            });
            
            // Add start point of Vertical Event
            eventStatus.push({
              type: "Vert",
              beginTime: alignedToNearestMin(eventDate),
              endTime: alignedToNearestMin(eventDate),
              beginEvent: prevDayEvent ? prevDayEvent : "OffDuty",
              endEvent: prevDayEvent ? prevDayEvent : "OffDuty",
            });
            prevDayEvent = history.eventType;
            prevEventTime = alignedToNearestMin(eventDate);
            prevDriverEdit = history.driverEdit;
            firstEventOfDay = false;
          } else {
            // Update last Event for Vertical Line
            eventStatus[eventStatus.length - 1].endEvent = prevDayEvent;

            // Add Event for Horz Line
            eventStatus.push({
              type: "Horz",
              beginTime: alignedToNearestMin(prevEventTime),
              endTime: adjustEndTime(prevEventTime, eventDate),
              beginEvent: prevDayEvent,
              endEvent: prevDayEvent,
              driverEdit: prevDriverEdit,
              showTime: true
            });
            // Add start point of Vertical Event
            eventStatus.push({
              type: "Vert",
              beginTime: alignedToNearestMin(eventDate),
              endTime: alignedToNearestMin(eventDate),
              beginEvent: prevDayEvent,
              endEvent: prevDayEvent
            });
            prevDayEvent = history.eventType;
            prevEventTime = alignedToNearestMin(eventDate);
            prevDriverEdit = history.driverEdit;
            firstEventOfDay = false;
          }
        }
      }
    });

    if (noEventForDay) {// if No Event Status
      // then add selected date event from start to current time
      let d = new Date();
      let mda = moment(d).toArray();
      let msa = dayStart.toArray();
      if (mda[0] === msa[0] && mda[1] === msa[1] && mda[2] === msa[2]) {
        eventStatus.push({
          type: "Horz",
          beginTime: alignedToNearestMin(dayStart),
          endTime: adjustEndTime(dayStart, moment(d)),
          beginEvent: prevDayEvent ? prevDayEvent : "OffDuty",
          endEvent: prevDayEvent ? prevDayEvent : "OffDuty",
          driverEdit: prevDriverEdit,
          showTime: false
        });
      } else {
        eventStatus.push({
          type: "Horz",
          beginTime: alignedToNearestMin(dayStart),
          endTime: alignedToNearestMin(dayEnd),
          beginEvent: prevDayEvent ? prevDayEvent : "OffDuty",
          endEvent: prevDayEvent ? prevDayEvent : "OffDuty",
          driverEdit: prevDriverEdit,
          showTime: false
        });
      }
    } else { // put end time of last event as end of Day

      // *note This push will affect the right side of chart.
      // Update last Event for Vertical Line
      eventStatus[eventStatus.length - 1].endEvent = prevDayEvent;
      // Add Event for Horz Line
      eventStatus.push({
        type: "Horz",
        beginTime: alignedToNearestMin(prevEventTime),
        endTime: adjustEndTime(prevEventTime, moment.min(moment(prevEventTime).endOf('day'), moment(new Date()))),
        beginEvent: prevDayEvent ? prevDayEvent : "OffDuty",
        endEvent: prevDayEvent ? prevDayEvent : "OffDuty",
        driverEdit: prevDriverEdit,
        showTime: true
      });
    }

    // Check duration for all Horz events for all eventType
    eventStatus.forEach(event => {
      if (event.type === 'Horz' && event.endTime >= event.beginTime) {
        var duration = moment.duration(event.endTime.diff(event.beginTime)).asMilliseconds();
        totalStatus[event.beginEvent] += duration;
        totalStatus['all'] += duration;
      }
    });

    this.driverLogs = {
      histories: sDriverHistory,
      eventStatus: eventStatus,
      excludeDriveTimeEvents: excludeDriveTimeEvents,
      totalStatus: totalStatus,
      exceptions: this.exceptions,
      allViolations: this.violations.hour11Violation.concat(this.violations.hour14Violation, this.violations.hour70Violation),
      isExceptions: this.exceptionsUSA || this.exceptionsCanada
    }
    this.driversLogsLoaded = true;
  }

  onRefreshDataTableInterval() {
    clearInterval(this.refreshDataTableInterval);
    this.refreshDataTableInterval = setInterval(() => {
      this.refreshHistoryTable()
    }, REFRESH_TABLE_INTERVAL);
  }

  refreshHistoryTable() {
    this.onRefreshDataTableInterval();
    if (this.driverHistoryTable)
      this.driverHistoryTable.ajaxReload();
  }

  /**
   * Edit Driver modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _editDriverHistory: BsModalRef;

  onEditDriverHistory(data: DriverHistoryUpdateDetails) {
    this.driverHistoryUpdateData = data;
    this.driverHistoryUpdateData.time = this.driverHistoryUpdateData.eventTime;
    this.driverHistoryUpdateData.date = this.driverHistoryUpdateData.eventTime;
    // convert odometer from km to miles
    let updateOdometerMi = new DriverHistoryUpdateDetails();
    updateOdometerMi.odometerKm = this.driverHistoryUpdateData.odometerKm;
    this.driverHistoryUpdateData.odometerMi = Number(updateOdometerMi.odometerToMi()) | 0;
    this._editDriverHistory = this.modalService.show(this.editDriverHistory, { class: "modal-450", ignoreBackdropClick: true });
  }

  onUpdateState(formData: NgForm) {
    if (!this.driverHistoryUpdateData.state) {
      formData.form.controls.state.setErrors({ required: true })
    } else {
      formData.form.controls.state.setErrors(null)
    }
  }

  onUpdateReason(formData: NgForm) {
    if (!this.driverHistoryUpdateData.editReason) {
      formData.form.controls.editReason.setErrors({ required: true })
    } else {
      formData.form.controls.editReason.setErrors(null)
    }
  }

  onPersonalConveyanceChange() {
    if (this.driverHistoryUpdateData.personalConveyance) {
      this.driverHistoryUpdateData.yardMoves = false;
      this.isDriverHistoryUpdateStatusDisabled = true;
      this.driverHistoryUpdateData.eventType = 'OffDuty';
    } else {
      this.onEnabledDriverHistoryUpdateStatus();
    }
  }

  onYardMovesChange() {
    if (this.driverHistoryUpdateData.yardMoves) {
      this.driverHistoryUpdateData.personalConveyance = false;
      this.isDriverHistoryUpdateStatusDisabled = true;
      this.driverHistoryUpdateData.eventType = 'OnDuty';
    } else {
      this.onEnabledDriverHistoryUpdateStatus();
    }
  }

  onEnabledDriverHistoryUpdateStatus() {
    if (!this.driverHistoryUpdateData.personalConveyance && !this.driverHistoryUpdateData.yardMoves) {
      this.isDriverHistoryUpdateStatusDisabled = false;
    }
  }

  onUpdateEditDriverHistory(formData: NgForm) {
    if (!this.driverHistoryUpdateData.editReason) {
      formData.form.controls.editReason.setErrors({ required: true })
      return false;
    } else {
      formData.form.controls.editReason.setErrors(null)
    }

    // convert odometer from miles to km
    let updateOdometerKm = new DriverHistoryUpdateDetails();
    updateOdometerKm.odometerMi = this.driverHistoryUpdateData.odometerMi;
    this.driverHistoryUpdateData.odometerKm = Number(updateOdometerKm.odometerToKm()) | 0;
    // combine time and date together
    let newDate = new Date(this.driverHistoryUpdateData.date);
    let newTime = new Date(this.driverHistoryUpdateData.time);
    let createDate = `${newDate.getFullYear()}-${newDate.getMonth() + 1}-${newDate.getDate()} ${newTime.getHours()}:${newTime.getMinutes()}`;
    this.driverHistoryUpdateData.eventTime = new Date(createDate).toISOString();
    this.driverHistoryUpdateData.driverEdit = true;
    this.restService.updateDriverHistoryDetails([this.driverHistoryUpdateData])
      .subscribe(data => {
        this._editDriverHistory.hide();
        this.refreshHistoryTable();
      })
  }

  closeEditDriverHistoryModal(): void {
    this._editDriverHistory.hide();
  }

  /**
   * show d3 zoom in chart with within component.
   * @type {BsModalRef}
   */
  _d3ChartZoomInOut: BsModalRef;
  onZoomChart(chatId) {
    let allParentNode = document.getElementById(chatId).children.item(0).children;
    let chartEle = allParentNode.item(0);

    // create a file blob of our SVG.
    let doctype = '<?xml version="1.0" standalone="no"?>'
      + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
    let source = (new XMLSerializer()).serializeToString(chartEle);
    let blob = new Blob([doctype + source], { type: 'image/svg+xml;charset=utf-8' });

    // read blob file
    let reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = e => {
      this._d3ChartZoomInOut = this.modalService.show(this.d3ChartZoomInOutModal, { class: 'modal-lg' })
      this.chartImg = reader.result
    };
  }

  closeD3ChartZoomInOutModal() {
    this._d3ChartZoomInOut.hide();
  }

   // excel downloading:
   private excelHeader = ["Id", "Time", "Status", "Location", "Remarks", "Vehicle", "Odometer", "Violation"];
   private excelOptions = {
     title: 'Logs',
     fileName: 'logs',
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
    return of(this.logDataArr);
   }

  private prepareDataForExcel(data: DriverHistory[]) {
    this.excelOptions.data = data.map((item, idx) => {
       // fields
      const fields = {
        id: idx + 1,
        time: this.adjustTime(item.eventTime),
        status: this.getStatus(item),
        location: item.location,
        note: item.note,
        vehicleName: item.vehicleName,
        odometer: this.getOdometer(item),
        violation: this.getViolation(item)
      }
       // row
      const excelRowArray = Object.values(fields);
      return excelRowArray;
    })
  }
   // ***
}
