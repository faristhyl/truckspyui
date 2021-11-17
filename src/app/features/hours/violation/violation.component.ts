import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import * as moment from 'moment';

import {
  RestService, FilterParams, StatusInBoolean, FilterViolationOption, LocalStorageService, DataTableService,
  DriverViolations,
  DispatchGroup,
  
} from '@app/core/services';
import { ExcelService } from '@app/core/services/excel.service';
import { Store, select } from '@ngrx/store';
import { getTableLength, AuthState } from '@app/core/store/auth';
import { REFRESH_TABLE_INTERVAL } from '@app/core/smartadmin.config';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export class UploadFileViolation {
  id: number;
  userId: number;
  driverViolationId: number;
  note: string;

  constructor(uploadData: DriverViolations) {
    this.userId = uploadData.userId;
    this.driverViolationId = uploadData.id;
  }
}

declare var $: any;
export const getViolationNames = () => {
  return [{
    id: "SHIFT_DRIVE_HOURS",
    value: "USA - Shift Drive Hours"
  }, {
    id: "SHIFT_ELAPSED_HOURS",
    value: "USA - Shift Elapsed Hours"
  }, {
    id: "CYCLE_DUTY_HOURS",
    value: "USA - Cycle Duty Hours"
  }, {
    id: "BREAK_DRIVE_HOURS",
    value: "USA - Break Drive Hours"
  }, {
    id: "CAN_DAILY_DRIVE_HOURS",
    value: "Canada - Daily Drive Hours"
  }, {
    id: "CAN_DAILY_DUTY_HOURS",
    value: "Canada - Daily Duty Hours"
  }, {
    id: "CAN_SHIFT_DRIVE_HOURS",
    value: "Canada - Shift Drive Hours"
  }, {
    id: "CAN_SHIFT_DUTY_HOURS",
    value: "Canada - Shift Duty Hours"
  }, {
    id: "CAN_SHIFT_ELAPSED_HOURS",
    value: "Canada - Shift Elapsed Hours"
  }, {
    id: "CAN_DAILY_OFF_DUTY_HOURS",
    value: "Canada - Daily OffDuty Hours"
  }, {
    id: "CAN_24MAN_OFF_DUTY_HOURS",
    value: "Canada - 24 OffDuty Hours"
  }, {
    id: "CAN_CYCLE1_DUTY_HOURS",
    value: "Canada - Cycle 1 - Duty Hours"
  }, {
    id: "CAN_CYCLE2_DUTY_HOURS",
    value: "Canada - Cycle 2 - Duty Hours"
  }, {
    id: "CAN_CYCLE2_24OFF_DUTY_HOURS",
    value: "Canada - Cycle 2 - 24 OffDuty Hours"
  }, {
    id: "CAN_OIL_WELL_SERVICE",
    value: "Canada - Oil Well Service"
  }, {
    id: "ALBERTA_SHIFT_DRIVE_HOURS",
    value: "Alberta Region - Shift Drive Hours"
  }, {
    id: "ALBERTA_SHIFT_DUTY_HOURS",
    value: "Alberta Region - Shift Duty Hours"
  }, {
    id: "ALBERTA_BREAK_HOURS",
    value: "Alberta Region - Break Hours"
  }, {
    id: "MEX_SHIFT_DRIVE_HOURS",
    value: "Mexico - Driving Hours In Shift"
  }, {
    id: "MEX_BREAK_DRIVE_HOURS",
    value: "Mexico - Hours Before 30 Minute Break"
  }]
}

@Component({
  selector: 'app-violation',
  templateUrl: './violation.component.html',
  styleUrls: ['./violation.component.css'],
  providers: [ExcelService]
})

export class ViolationComponent implements OnInit {

  @ViewChild('docUploadModal') docUpload: TemplateRef<any>;
  @ViewChild('driverViolationTable') driverViolationTable: any;

  currentDate = new Date();
  tableLength: number;
  filterOption: FilterViolationOption;
  drivers = [];
  terminals = [];
  subsets = [];
  violations = [];
  status: StatusInBoolean;
  uploadData: UploadFileViolation;
  uploadDataMedia: File;
  uploadFileName: string;
  driverViolations;

  private defaultAllDrivers = []; // drivers which we don't filter, for dispatch group 'All'
  private defaultDriversIdsForDispatchGroup: string[] = []; // drivers which we don't filter, for dispatch group 'All'
  dispatchGroups: DispatchGroup[] = [];

  refreshDataTableInterval;

  orderColumns = ["timestamp", "Driver", "Violation Type", "Documents & Notes"];
  valueColumns = [
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return moment(full.timestamp).format("MM/DD/YYYY");
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let driverName = this.findDriverName(full.userId);
        return `<a data-toggle="tooltip" data-placement="top" title="Go to ${driverName}'s Logs" 
                id="driver-${full.id}">${driverName}</a>`
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        function getLabel(violation) {
          if (!!full.iconLabel) {
            return full.iconLabel;
          }
          let labelMap = {
            'CYCLE_DUTY_HOURS': "70",
            'SHIFT_ELAPSED_HOURS': "14",
            'SHIFT_DRIVE_HOURS': "11"
          }
          return labelMap[full.violationName] || "undefined";
        }

        return `<span data-toggle="tooltip" data-placement="top" title="${full.toolTipText}"
                style="background-color: rgb(221, 68, 54);padding: 1px 8px 1px 8px; color: white; cursor: pointer;">
                ${getLabel(full)}</span>`;
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return `<span data-toggle="tooltip" data-placement="top" title="Upload PDF/Notes" 
                style="cursor: pointer;" id="${full.id}"><i class="fa fa-upload" aria-hidden="true"></i></span>`
      }
    }
  ];
  driverVoilationOption: any;

  defineOptions() {
    this.driverVoilationOption = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        let params: FilterParams = this.dataTableService.calculateParamsForVis(data, this.orderColumns);
        this.excelService.tableData = [];
        this.restService.getDriverViolationsForViolation(params, this.filterOption, this.tableLength, this.excelService.tableData)
          .subscribe(
            data => {
              if (this.drivers.length) {
                callback({
                  aaData: data ? data.results : [],
                  recordsTotal: data ? data.resultCount : 0,
                  recordsFiltered: data ? data.resultCount : 0
                })
              } else {
                callback({ aaData: [], recordsTotal: 0, recordsFiltered: 0 })
              }
            }
          );
      },
      columns: this.valueColumns,
      order: [[0, 'desc']],
      rowCallback: (row: Node, data: any | Object, index: number) => {
        const self = this;
        let handler = (event) => {
          self.openDocUploadModal(data);
        };
        let onClickDriverName = (event) => {
          self.redirectUserToDriverLog(data.userId);
        }
        $(`#${data.id}`, row).unbind('click', handler);
        $(`#${data.id}`, row).bind('click', handler);
        $(`#driver-${data.id}`, row).unbind('click', onClickDriverName);
        $(`#driver-${data.id}`, row).bind('click', onClickDriverName);
        return row;
      },
    };
  }

  constructor(
    private restService: RestService,
    private modalService: BsModalService,
    private store: Store<AuthState>,
    private lsService: LocalStorageService,
    private dataTableService: DataTableService,
    private excelService: ExcelService<DriverViolations>,
    private router: Router) {
    this.status = new StatusInBoolean();
    let prevDate = new Date();
    prevDate.setDate(prevDate.getDate() - 7);
    this.filterOption = new FilterViolationOption();
    this.filterOption = {
      selectedDispatchGroupId: 'all',
      selectedDriverId: 'all',
      dateRange: [
        prevDate,
        this.currentDate
      ],
      selectedTerminalId: 'all',
      selectedSubsetId: 'all',
      selectedViolationId: 'all',
      ISODateRange: []
    }
    this.convertFilterDateToISODate();
    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      // fetch data for dropdown dispatch groups
      this.getDispatchGroups();
      // fetch data for 3 dropdown drivers, terminals, violation
      this.getAllDrivers();
      this.getAllTerminals();
      this.getAllViolation();
      // temporary set table length for client side pagination as visTrack api not supporting paginations
      this.tableLength = 10;
      this.defineOptions();
      this.refreshData();
    });
  }

  ngOnInit() {}

  redirectUserToDriverLog(driverId) {
    this.router.navigateByUrl(`/hours/logs`, { state: { driverId } })
  }

  getAllDrivers() {
    this.restService.getAllDriversForHOS(null)
      .subscribe(
        data => {
          this.drivers = this.defaultAllDrivers = data;
          this.refreshData();
        }
      );
  }

  findDriverName(driverId) {
    let driverData = this.drivers.find(d => d.id == driverId);
    return driverData ? `${driverData.name()}` : '';
  }

  getAllTerminals() {
    this.restService.getAllTerminalForHOS().subscribe(val => {
      this.terminals = val;
    })
  }

  // subset dropdown is dependent on terminal option selection
  getAllSubset() {
    this.restService.getSubsetsByTerminalIdForHos(this.filterOption.selectedTerminalId)
      .subscribe(val => {
        this.subsets = val;
      })
  }

  getAllViolation() {
    this.violations = getViolationNames();
  }

  getDispatchGroups() {
    this.restService.get1000DispatchGroupsLight().subscribe(dispatchGroups => {
      this.dispatchGroups = dispatchGroups;
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
    this.convertFilterDateToISODate();
    if (this.driverViolationTable) {
      this.driverViolationTable.ajaxReload();
    }
  }

  convertFilterDateToISODate() {
    this.filterOption.ISODateRange[0] = this.filterOption.dateRange[0].toISOString();
    this.filterOption.ISODateRange[1] = this.filterOption.dateRange[1].toISOString();
  }

  /**
   * Upload Document File modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _docUpload: BsModalRef;
  customerData: any = {};

  // Open upload modal and get the upload data
  openDocUploadModal(uploadData) {
    this.uploadData = new UploadFileViolation(uploadData);
    this._docUpload = this.modalService.show(this.docUpload, { class: "modal-450", ignoreBackdropClick: true })
  }

  // When user select the file
  onDocFileChange(event) {
    this.uploadDataMedia = event.target.files[0];
  }

  // Upload the document
  onUploadDocFile() {
    const formData = new FormData();
    formData.append('json', JSON.stringify([this.uploadData]));
    formData.append(`${this.uploadData.driverViolationId}`, this.uploadDataMedia);

    this.restService.uploadDriverViolationDocuments(formData)
      .subscribe(data => {
        this._docUpload.hide();
        this.refreshData();
      })
  }

  closeDocUploadModal(): void {
    this._docUpload.hide();
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
  private excelHeader = ["Date", "Driver", "Violation Type"];
  private excelOptions = {
    title: 'Driver Violation',
    fileName: 'driver-violation',
    header: this.excelHeader,
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

  private prepareDataForExcel(data: DriverViolations[]) {
    this.excelOptions.data = data.map(item => {
      // fields
      const fields = {
        date: moment(item.timestamp).format("MM/DD/YYYY"),
        driverName: this.findDriverName(item.userId),
        violationType: (item.violationName === 'SHIFT_ELAPSED_HOURS') ? '14' : item.iconLabel
      }
      // row
      const excelRowArray = Object.values(fields);
      return excelRowArray;
    })
  }
  // ***

}
