import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';

import { RestService } from '@app/core/services';

export class ReportParametersModal {
  name: string;
  isMulti: boolean;
  isShow: boolean;
  value: any;
  class: string;
}

export class ReportModal {
  id: number;
  nameSlag: string;
  name: string;
  description: string;
  exportType: string;
  exportBtnName: string;
  isbtnDisabled: boolean;
  isBtnShow: boolean;
  parameters: ReportParametersModal[]
}

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {

  @ViewChild('reportModal') reportModalRef: TemplateRef<any>;

  tableLength: number;
  reportModalData: ReportModal;
  reportModalDataArr: ReportModal[] = [];
  allRerports: any = [];

  modalType: string;

  constructor(
    private modalService: BsModalService,
    private restService: RestService,
  ) { }

  ngOnInit() {
    this.reportModalDataArr = [];
    this.getAllReports();
  }

  getAllReports() {
    this.restService.getAllReports()
      .subscribe(response => {
        this.allRerports = response;
        this.createReportModalData();
      })
  }

  /**
   * Report modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _reportModal: BsModalRef

  // Open report modal and set data based on modal type
  onOpenReportModel(modalType) {
    this.modalType = modalType;
    let className;
    let lgModels = ['certified-logs', 'documents', 'driver-log', 'driver-app-vesion', 'driving-open-defect',
      'edit-logs', 'invalid-data', 'special-moves', 'vehicle-daily-usage'];
    className = lgModels.includes(modalType) ? 'modal-lg' : 'modal-md';
    this.reportModalData = _.cloneDeep(this.findReportModalData(modalType));
    if (className && this.reportModalData) {
      this._reportModal = this.modalService.show(this.reportModalRef, { class: className, ignoreBackdropClick: true });
    }
  }

  // before modal open 
  findReportModalData(nameSlag: string): ReportModal {
    return this.reportModalDataArr.find(rm => rm.nameSlag === nameSlag);
  }

  createReportModalData(): ReportModal[] {
    let prevDate = new Date();
    prevDate.setDate(prevDate.getDate() - 7);
    let currentDate = new Date();

    this.allRerports.forEach(element => {
      if (element.name === 'Certified Logs Summary Report') {
        this.reportModalDataArr.push({
          id: element.id,
          nameSlag: "certified-logs",
          name: "Certified Logs",
          description: "",
          exportType: "pdf",
          exportBtnName: "Bulk Export",
          isbtnDisabled: true,
          isBtnShow: true,
          parameters: [
            { name: "userId", isMulti: false, isShow: true, value: "all",
              class: "col-xs-12 col-md-4 col-lg-4 margin-top-10" },
            { name: "terminalId", isMulti: false, isShow: true, value: "all",
              class: "col-xs-12 col-md-4 col-lg-4 margin-top-10" },
            {
              name: "dateRange", isMulti: false, isShow: true, value: [
                prevDate,
                currentDate
              ], class: "col-xs-12 col-md-4 col-lg-4 margin-top-10"
            },
            { name: "reportType", isMulti: false, isShow: true, value: "all_logs",
              class: "col-xs-12 col-md-6 col-lg-6 margin-top-10 padding-left-5" },
            { name: "documentTypeRadio", isMulti: false, isShow: false, value: "pdf",
              class: "col-xs-12 col-md-6 col-lg-6 margin-top-10" },
            { name: "dataTableCertifiedLog", isMulti: false, isShow: true, value: "",
              class: "col-xs-12 col-md-12 col-lg-12 margin-top-10" }
          ]
        })
      } else if (element.name === 'Daily Document') {
        this.reportModalDataArr.push({
          id: element.id,
          nameSlag: "documents",
          name: "Documents",
          description: "",
          exportBtnName: "Generate Report",
          exportType: "pdf",
          isbtnDisabled: false,
          isBtnShow: true,
          parameters: [
            { name: "userId", isMulti: false, isShow: true, value: "all",
              class: "col-xs-12 col-md-4 col-lg-4 margin-top-10" },
            { name: "terminalId", isMulti: false, isShow: true, value: "all",
              class: "col-xs-12 col-md-4 col-lg-4 margin-top-10" },
            { name: "documentType", isMulti: false, isShow: true, value: "all",
              class: "col-xs-12 col-md-4 col-lg-4 margin-top-10" },
            {
              name: "dateRange", isMulti: false, isShow: true, value: [
                prevDate,
                currentDate
              ], class: "col-xs-12 col-md-4 col-lg-4 margin-top-10"
            },
            { name: "dataTableDocuments", isMulti: false, isShow: true, value: "",
              class: "col-xs-12 col-md-12 col-lg-12 margin-top-10" }
          ]
        })
      } else if (element.name === 'Driver And Vehicle Information Report') {
        this.reportModalDataArr.push({
          id: element.id,
          nameSlag: "driver-vehicle",
          name: "Driver and Vehicle Information Report",
          description: "",
          exportBtnName: "Generate Report",
          exportType: "pdf",
          isbtnDisabled: false,
          isBtnShow: true,
          parameters: [
            { name: "informationType", isMulti: false, isShow: true, value: "Driver",
              class: "col-xs-12 col-md-6 col-lg-6" },
            {
              name: "dateRange", isMulti: false, isShow: true, value: [
                prevDate,
                currentDate
              ], class: "col-xs-12 col-md-6 col-lg-6"
            },
            { name: "documentTypeRadio", isMulti: false, isShow: true, value: "pdf",
              class: "col-xs-12 col-md-12 col-lg-12 margin-top-10 padding-left-5" },
          ]
        })
      } else if (element.name === 'Log Edit Report') {
        this.reportModalDataArr.push({
          id: element.id,
          nameSlag: "driver-log",
          name: "Driver Logs",
          description: "",
          exportBtnName: "Export",
          exportType: "pdf",
          isbtnDisabled: false,
          isBtnShow: true,
          parameters: [
            { name: "documentTypeRadio", isMulti: false, isShow: true, value: "pdf",
              class: "col-xs-12 col-md-4 col-lg-4 padding-left-5" },
            { name: "driverVehicleUnit", isMulti: false, isShow: true, value: "mi",
              class: "col-xs-12 col-md-4 col-lg-4 padding-left-5" },
            { name: "driverReport", isMulti: false, isShow: true, value: "driver_logs",
              class: "col-xs-12 col-md-4 col-lg-4 padding-left-5" },
            {
              name: "dateRange", isMulti: false, isShow: true, value: [
                prevDate,
                currentDate
              ], class: "col-xs-12 col-md-6 col-lg-6 margin-top-10"
            },
            { name: "driverSelectionArrowKey", isMulti: false, isShow: true, value: "",
              class: "col-xs-12 col-md-6 col-lg-6" },
            { name: "driverSelection", isMulti: false, isShow: true, value: [],
              class: "col-xs-12 col-md-12 col-lg-12 margin-top-10" },
          ]
        })

        this.reportModalDataArr.push({
          id: element.id,
          nameSlag: "edit-logs",
          name: "Edit Logs",
          description: "",
          exportBtnName: "Export",
          exportType: "pdf",
          isbtnDisabled: false,
          isBtnShow: true,
          parameters: [
            { name: "userId", isMulti: false, isShow: true, value: "all",
              class: "col-xs-12 col-md-6 col-lg-6" },
            { name: "terminalId", isMulti: false, isShow: true, value: "all",
              class: "col-xs-12 col-md-6 col-lg-6" },
            {
              name: "dateRange", isMulti: false, isShow: true, value: [
                prevDate,
                currentDate
              ], class: "col-xs-12 col-md-6 col-lg-6 margin-top-10"
            },
            { name: "driverHistoryUpdateDataReasons", isMulti: false, isShow: true, value: "all",
              class: "col-xs-12 col-md-6 col-lg-6 margin-top-10" },
            { name: "documentTypeRadio", isMulti: false, isShow: true, value: "pdf",
              class: "col-xs-12 col-md-6 col-lg-6 margin-top-10 padding-left-5" },
            { name: "driverVehicleUnit", isMulti: false, isShow: true, value: "mi",
              class: "col-xs-12 col-md-6 col-lg-6 margin-top-10 padding-left-5" },
          ]
        })
      } else if (element.name === "Driver's Timecard Report") {
        this.reportModalDataArr.push({
          id: element.id,
          nameSlag: "driver-timecard",
          name: "Driver's Timecard",
          description: "",
          exportBtnName: "Export",
          exportType: "pdf",
          isbtnDisabled: false,
          isBtnShow: true,
          parameters: [
            { name: "userId", isMulti: false, isShow: true, value: "all", class: "col-xs-12 col-md-6 col-lg-6" },
            {
              name: "dateRange", isMulti: false, isShow: true, value: [
                prevDate,
                currentDate
              ], class: "col-xs-12 col-md-6 col-lg-6"
            },
            { name: "reportTypeRadio", isMulti: false, isShow: true, value: "details",
              class: "col-xs-12 col-md-6 col-lg-6 margin-top-10 padding-left-5" },
            { name: "documentTypeRadio", isMulti: false, isShow: true, value: "pdf",
              class: "col-xs-12 col-md-6 col-lg-6 margin-top-10 padding-left-5" }
          ]
        })
      } else if (element.name === 'Mobile App Version Report') {
        this.reportModalDataArr.push({
          id: element.id,
          nameSlag: "driver-app-vesion",
          name: "Drivers App Version",
          description: "",
          exportBtnName: "Export",
          exportType: "pdf",
          isbtnDisabled: false,
          isBtnShow: true,
          parameters: [
            { name: "documentTypeRadio", isMulti: false, isShow: true, value: "pdf",
              class: "col-xs-12 col-md-12 col-lg-12 margin-top-10 padding-left-5" },
            {
              name: "instructions",
              isMulti: false, isShow: true, value: [
                'Exported application version report will have 5 columns.: <b>Account, Driver Name, Driver Email, ' +
                'Mobile OS Version and Software Version.<b>',
                'Accounts column shows what account is the driver registered.',
                'Driver Name column shows the full name of the driver (First Name Last Name).',
                'Driver Email column shows the email address of the driver.',
                "Mobile OS Version shows the driver's mobile operating system version.",
                'Software Version shows the current HOS app version installed.'
              ],
              class: "col-xs-12 col-md-12 col-lg-12"
            },
          ]
        })
      } else if (element.name === 'Driving on Open Defects Report') {
        this.reportModalDataArr.push({
          id: element.id,
          nameSlag: "driving-open-defect",
          name: "Driving on Open Defect",
          description: "",
          exportBtnName: "Export",
          exportType: "pdf",
          isbtnDisabled: false,
          isBtnShow: true,
          parameters: [
            { name: "assetId", isMulti: true, isShow: true, value: [], class: "col-xs-12 col-md-6 col-lg-6" },
            { name: "terminalId", isMulti: false, isShow: true, value: "all", class: "col-xs-12 col-md-6 col-lg-6" },
            {
              name: "dateRange", isMulti: false, isShow: true, value: [
                prevDate,
                currentDate
              ], class: "col-xs-12 col-md-6 col-lg-6 margin-top-10"
            },
            { name: "documentTypeRadio", isMulti: false, isShow: true, value: "pdf",
              class: "col-xs-12 col-md-6 col-lg-6 margin-top-10 padding-left-5" },
          ]
        })
      } else if (element.name === 'Driving Without DVIR Report') {
        this.reportModalDataArr.push({
          id: element.id,
          nameSlag: "driving-without-DVIR",
          name: "Driving Without DVIR",
          description: "",
          exportBtnName: "Export",
          exportType: "pdf",
          isbtnDisabled: false,
          isBtnShow: true,
          parameters: [
            { name: "assetId", isMulti: true, isShow: true, value: [], class: "col-xs-12 col-md-6 col-lg-6" },
            { name: "terminalId", isMulti: false, isShow: true, value: "all", class: "col-xs-12 col-md-6 col-lg-6" },
            {
              name: "dateRange", isMulti: false, isShow: true, value: [
                prevDate,
                currentDate
              ], class: "col-xs-12 col-md-6 col-lg-6 margin-top-10"
            },
            { name: "documentTypeRadio", isMulti: false, isShow: true, value: "pdf",
              class: "col-xs-12 col-md-6 col-lg-6 margin-top-10 padding-left-5" },
          ]
        })
      } else if (element.name === 'Hours and Miles (Date Range)') {
        this.reportModalDataArr.push({
          id: element.id,
          nameSlag: "hours-miles",
          name: "Hours and Miles",
          description: "",
          exportBtnName: "Export",
          exportType: "pdf",
          isbtnDisabled: false,
          isBtnShow: true,
          parameters: [
            { name: "userId", isMulti: false, isShow: true, value: "all", class: "col-xs-12 col-md-6 col-lg-6" },
            { name: "terminalId", isMulti: false, isShow: true, value: "all", class: "col-xs-12 col-md-6 col-lg-6" },
            {
              name: "dateRange", isMulti: false, isShow: true, value: [
                prevDate,
                currentDate
              ], class: "col-xs-12 col-md-6 col-lg-6 margin-top-10"
            },
            { name: "documentTypeRadio", isMulti: false, isShow: true, value: "pdf",
              class: "col-xs-12 col-md-6 col-lg-6 margin-top-10 padding-left-5" },
            { name: "driverVehicleUnit", isMulti: false, isShow: true, value: "mi",
              class: "col-xs-12 col-md-6 col-lg-6 margin-top-10 padding-left-5" },
          ]
        })
      } else if (element.name === 'Hours Worked (Date Range)') {
        this.reportModalDataArr.push({
          id: element.id,
          nameSlag: "hours-worked",
          name: "Hours Worked",
          description: "",
          exportBtnName: "Export",
          exportType: "pdf",
          isbtnDisabled: false,
          isBtnShow: true,
          parameters: [
            { name: "userId", isMulti: false, isShow: true, value: "all", class: "col-xs-12 col-md-6 col-lg-6" },
            { name: "terminalId", isMulti: false, isShow: true, value: "all", class: "col-xs-12 col-md-6 col-lg-6" },
            {
              name: "dateRange", isMulti: false, isShow: true, value: [
                prevDate,
                currentDate
              ], class: "col-xs-12 col-md-6 col-lg-6 margin-top-10"
            },
            { name: "documentTypeRadio", isMulti: false, isShow: true, value: "pdf",
              class: "col-xs-12 col-md-6 col-lg-6 margin-top-10 padding-left-5" }
          ]
        })
      } else if (element.name === 'Invalid Data Report') {
        this.reportModalDataArr.push({
          id: element.id,
          nameSlag: "invalid-data",
          name: "Invalid Data",
          description: "",
          exportBtnName: "Export",
          exportType: "pdf",
          isbtnDisabled: false,
          isBtnShow: true,
          parameters: [
            { name: "documentTypeRadio", isMulti: false, isShow: true, value: "pdf",
              class: "col-xs-12 col-md-12 col-lg-12 margin-top-10 padding-left-5" },
            {
              name: "instructions",
              isMulti: false, isShow: true, value: [
                "Exported Invalid Data Report will have 4 columns: <b>Reason, Account, " +
                "Data Identifier and Data Value.</b>",
                "Reason column indicates the cause for the data's invalidity.",
                "There can be one of these causes:",
                "(1) USER NAME LENGTH: User First Name length and User Last Name length needs to be between 2 ~30",
                "(2) ASSET NAME LENGTH: Equipment Name length needs to be between 1 ~10",
                "(3) ASSET VIN EMPTY: Equipment(Vehicle) VIN cannot be empty",
                "(4) ASSET VIN INVALID: Equipment(Vehicle) VIN needs to be 17 alphanumeric letters OR 18 " +
                "alphanumeric letters if the first letter is -",
                "(5) CARRIER NAME INVALID: Carrier Name length needs to be between 4 ~120. The name can " +
                "contain space, alphanumeric letter or. , & : ;",
                "(6) CARRIER DOT NUMBER INVALID: Carrier Dot Number length needs to be between 1 ~9 and " +
                "cannot be empty <br />",
                "Account columns indicates in which account the data can be found.",
                "Data Identifier indicates unique identifier for the data.",
                "For User, it is his/ her email.",
                "For Equipment, is it its name.",
                "For Carrier, it is its name.",
                "Data Value indicates the primary value of the data.",
                "For User, it is his / her full name.",
                "For Equipment, it is its VIN.",
                "For Carrier, it is its Carrier DOT Number.",
                "Using the information in the row, you can locate your data and update its value.",
                "If all data in your account is valid, the exported Invalid Data Report should be empty."
              ],
              class: "col-xs-12 col-md-12 col-lg-12"
            },
          ]
        })
      } else if (element.name === 'Odometer Jump Report') {
        this.reportModalDataArr.push({
          id: element.id,
          nameSlag: "odometer-jump",
          name: "Odometer Jump",
          description: "",
          exportBtnName: "Export",
          exportType: "pdf",
          isbtnDisabled: false,
          isBtnShow: true,
          parameters: [
            { name: "assetId", isMulti: true, isShow: true, value: [], class: "col-xs-12 col-md-6 col-lg-6" },
            {
              name: "dateRange", isMulti: false, isShow: true, value: [
                prevDate,
                currentDate
              ], class: "col-xs-12 col-md-6 col-lg-6"
            },
            { name: "includeUnidentifiedDriversType", isMulti: false, isShow: true, value: false,
              class: "col-xs-12 col-md-6 col-lg-6 margin-top-10" },
            { name: "driverVehicleUnit", isMulti: false, isShow: true, value: "mi",
              class: "col-xs-12 col-md-6 col-lg-6 margin-top-10 padding-left-5" },
            { name: "documentTypeRadio", isMulti: false, isShow: true, value: "pdf",
              class: "col-xs-12 col-md-12 col-lg-12 margin-top-10 padding-left-5" }
          ]
        })
      } else if (element.name === 'Raw Punch Report') {
        this.reportModalDataArr.push({
          id: element.id,
          nameSlag: "raw-punch",
          name: "Raw Punch",
          description: "",
          exportBtnName: "Export",
          exportType: "pdf",
          isbtnDisabled: false,
          isBtnShow: true,
          parameters: [
            { name: "userId", isMulti: false, isShow: true, value: "all", class: "col-xs-12 col-md-6 col-lg-6" },
            {
              name: "dateRange", isMulti: false, isShow: true, value: [
                prevDate,
                currentDate
              ], class: "col-xs-12 col-md-6 col-lg-6"
            },
            { name: "documentTypeRadio", isMulti: false, isShow: true, value: "pdf",
              class: "col-xs-12 col-md-12 col-lg-12 margin-top-10 padding-left-5" }
          ]
        })
      } else if (element.name === 'Rejected Edits Report') {
        this.reportModalDataArr.push({
          id: element.id,
          nameSlag: "rejected-edits",
          name: "Rejected Edits",
          description: "",
          exportBtnName: "Export",
          exportType: "pdf",
          isbtnDisabled: false,
          isBtnShow: true,
          parameters: [
            { name: "userId", isMulti: false, isShow: true, value: "all", class: "col-xs-12 col-md-6 col-lg-6" },
            {
              name: "dateRange", isMulti: false, isShow: true, value: [
                prevDate,
                currentDate
              ], class: "col-xs-12 col-md-6 col-lg-6"
            },
            { name: "documentTypeRadio", isMulti: false, isShow: true, value: "pdf",
              class: "col-xs-12 col-md-6 col-lg-6 margin-top-10 padding-left-5" },
            { name: "driverVehicleUnit", isMulti: false, isShow: true, value: "mi",
              class: "col-xs-12 col-md-6 col-lg-6 margin-top-10 padding-left-5" }
          ]
        })
      } else if (element.name === 'Special Moves Report') {
        this.reportModalDataArr.push({
          id: element.id,
          nameSlag: "special-moves",
          name: "Special Moves",
          description: "",
          exportBtnName: "Export",
          exportType: "pdf",
          isbtnDisabled: false,
          isBtnShow: true,
          parameters: [
            { name: "userId", isMulti: false, isShow: true, value: "all", class: "col-xs-12 col-md-4 col-lg-4" },
            { name: "terminalId", isMulti: false, isShow: true, value: "all", class: "col-xs-12 col-md-4 col-lg-4" },
            { name: "specialMoves", isMulti: false, isShow: true, value: "all", class: "col-xs-12 col-md-4 col-lg-4" },
            { name: "driverVehicleUnit", isMulti: false, isShow: true, value: "mi",
              class: "col-xs-12 col-md-4 col-lg-4 margin-top-10 padding-left-5" },
            {
              name: "dateRange", isMulti: false, isShow: true, value: [
                prevDate,
                currentDate
              ], class: "col-xs-12 col-md-4 col-lg-4 margin-top-10"
            },
            { name: "documentTypeRadio", isMulti: false, isShow: true, value: "pdf",
              class: "col-xs-12 col-md-4 col-lg-4 margin-top-10 padding-left-5" },
            { name: "dataTableSpecialMoves", isMulti: false, isShow: true, value: "",
              class: "col-xs-12 col-md-12 col-lg-12 margin-top-10" }
          ]
        })
      } else if (element.name === 'Usage Report') {
        this.reportModalDataArr.push({
          id: element.id,
          nameSlag: "usage",
          name: "Usage",
          description: "",
          exportBtnName: "Generate Report",
          exportType: "pdf",
          isbtnDisabled: false,
          isBtnShow: true,
          parameters: [
            { name: "usageType", isMulti: false, isShow: true, value: "Driver",
              class: "col-xs-12 col-md-6 col-lg-6" },
            { name: "usageDetected", isMulti: false, isShow: true, value: "6",
              class: "col-xs-12 col-md-6 col-lg-6" },
            { name: "documentTypeRadio", isMulti: false, isShow: true, value: "pdf",
              class: "col-xs-12 col-md-12 col-lg-12 margin-top-10 padding-left-5" },
          ]
        })
      } else if (element.name === 'Disconnection Report') {
        this.reportModalDataArr.push({
          id: element.id,
          nameSlag: "VBUS-disconnection",
          name: "VBUS Disconnection",
          description: "",
          exportBtnName: "Generate Report",
          exportType: "pdf",
          isbtnDisabled: false,
          isBtnShow: true,
          parameters: [
            { name: "assetId", isMulti: true, isShow: true, value: [], class: "col-xs-12 col-md-6 col-lg-6" },
            {
              name: "dateRange", isMulti: false, isShow: true, value: [
                prevDate,
                currentDate
              ], class: "col-xs-12 col-md-6 col-lg-6"
            },
            { name: "driverVehicleUnit", isMulti: false, isShow: true, value: "mi",
              class: "col-xs-12 col-md-6 col-lg-6 margin-top-10 padding-left-5" },
            { name: "documentTypeRadio", isMulti: false, isShow: true, value: "pdf",
              class: "col-xs-12 col-md-6 col-lg-6 margin-top-10 padding-left-5" },
          ]
        })
      }
    });

    this.reportModalDataArr.push({
      id: null,
      nameSlag: "vehicle-daily-usage",
      name: "Vehicle Daily Usage Report",
      description: "",
      exportBtnName: "Export",
      exportType: "pdf",
      isbtnDisabled: true,
      isBtnShow: false,
      parameters: [
        { name: "assetId", isMulti: false, isShow: true, value: [], class: "col-xs-12 col-md-4 col-lg-4" },
        { name: "userId", isMulti: false, isShow: true, value: "all", class: "col-xs-12 col-md-4 col-lg-4" },
        {
          name: "dateRange", isMulti: false, isShow: true, value: [
            prevDate,
            currentDate
          ], class: "col-xs-12 col-md-4 col-lg-4"
        },
        { name: "dataTableVehicleDailyUsageReport", isMulti: false, isShow: true, value: "",
          class: "col-xs-12 col-md-12 col-lg-12 margin-top-10" }
      ]
    })

    this.reportModalDataArr = this.reportModalDataArr.sort((a, b) => a.name > b.name ? 1 : -1)

    return this.reportModalDataArr;
  }

}