import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import * as fileSaver from 'file-saver';
import { BsModalRef } from 'ngx-bootstrap';
import * as moment from 'moment';
import * as _ from 'lodash';

import { LocalStorageService, DataTableService, FilterParams, RestService, Driver } from '@app/core/services';
import { ConfigState } from '@app/core/store/config';
import { getTableLength } from '@app/core/store/auth';
import { ReportModal, ReportParametersModal } from "@app/features/hours/report/report.component";

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
}

export class FilterReportOption {
  dateRange: Array<Date> = [];
  ISODateRange: Array<string> = [];
  onlyDate: Array<string> = [];
  userId: number | 'all';
  assetId: number | 'all';
  assetIdArr: number[] = [];
  selectedUserIdArr: Array<number>;
  terminalId: number | 'all';
  exportType: string;
  driverVehicleUnitType: string;
  isCertified: boolean = null;  // null - all the reports, true - with field 'certified' = true, false - with field 'certified' = false
  informationType: string;
  driverHistoryUpdateDataReason: string;
  isUnidIncluded: boolean;
  eventType: string | 'all';
  usagePer: string;
  usageMonth: string;
}

@Component({
  selector: 'app-report-modal',
  templateUrl: './report-modal.component.html',
  styleUrls: ['./report-modal.component.css']
})
export class ReportModalComponent implements OnInit {

  @Input('reportModalData') public reportModalData: ReportModal;
  @Input('modalType') public modalType: string;
  @Input('_reportModal') public _reportModal: BsModalRef;
  @Input('allRerports') public allRerports: any;
  @ViewChild('dataTableCertifiedLogTable') dataTableCertifiedLogTable: any;
  @ViewChild('dataTableDocumentsTable') dataTableDocumentsTable: any;
  @ViewChild('dataTableSpecialMovesTable') dataTableSpecialMovesTable: any;
  @ViewChild('dataTableVehicleDailyUsageReportTable') dataTableVehicleDailyUsageReportTable: any;

  drivers = [];
  allDrivers = [];
  terminals = [];
  vehicles = [];
  driverHistoryUpdateDataReasonArr = [];
  dataTableCertifiedLogOption: any;
  dataTableDocumentsOption: any;
  dataTableSpecialMovesOption: any;
  dataTableVehicleDailyUsageReportOption: any;
  filterOption: FilterReportOption;
  tableLength: number;
  certifiedLogTableValueColumns;
  radioBtnVerticalAlignRequired = ['driver-timecard', 'driver-log']
  driverSelectionError: boolean;
  displayCapabilityPrivate: any;
  isDisabledTerminal: boolean;
  isBtnShow: boolean;
  constructor(
    private store: Store<ConfigState>,
    private lsService: LocalStorageService,
    private dataTableService: DataTableService,
    private restService: RestService,
    private router: Router,
  ) {
    this.filterOption = new FilterReportOption();
    this.isDisabledTerminal = false;
  }

  ngOnInit() {
    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      // temporary set table length for client side pagination as visTrack api not supporting paginations
      this.tableLength = 10;

      this.getAllRequiredData(this.modalType);
    });
  }

  // methods to fetch all required data for modal
  getAllRequiredData(modalType) {
    if (this.findReportParameterValue('driverSelection'))
      this.getAllDrivers();

    if (this.findReportParameterValue('userId'))
      this.getActiveDrivers();

    if (this.findReportParameterValue('terminalId'))
      this.getAllTerminals();

    if (this.findReportParameterValue('assetId'))
      this.getAllVehicles();

    this.getAllDriverHistoryUpdateDataReasons();

    // for certified logs
    if (this.reportModalData.nameSlag === modalType) {
      this.initializeDataTableCertifiedLogTable();
    }
    // for documents
    if (this.reportModalData.nameSlag === modalType) {
      this.initializeDataTableDocumentsTable();
    }
    //for special moves
    if (this.reportModalData.nameSlag === modalType) {
      this.initializeDataTableSpecialMovesTable();
    }
    // for vehicle daily usage report
    if (this.reportModalData.nameSlag === modalType) {
      this.initializeDataTableVehicleDailyUsageReportTable();
    }
    if (this.reportModalData.nameSlag === modalType) {
      this.displayCapabilityPrivate = this.displayCapability.bind(this);
    }
    this.setFilterOption();
  }

  initializeDataTableCertifiedLogTable() {
    const orderColumns = ["Driver", "date", "Report"];
    const valueColumns = [
      {
        data: 'driverName',
        orderable: false,
      },
      {
        data: 'date',
        orderable: false,
      },
      {
        data: null,
        orderable: false,
        render: (data, type, full, meta) => {
          return `<i id="spinner-${full.id}" class="fa fa-spinner fa-spin fa-pulse fa-lg" style="cursor: pointer;"></i>`;
        }
      }
    ];
    this.dataTableCertifiedLogOption = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        let reportData = this.findReportParameterValue('reportType')
        if (reportData.value !== 'uncertified_logs') {
          this.reportModalData.isbtnDisabled = true;
        }
        this.setFilterOption();
        let params: FilterParams = this.dataTableService.calculateParamsForVis(data, orderColumns);
        this.restService.getDriverDailies(params, this.filterOption, this.tableLength)
          .subscribe(data => {
            callback({
              aaData: data ? data.results : [],
              recordsTotal: data ? data.resultCount : 0,
              recordsFiltered: data ? data.resultCount : 0
            })
          })
      },
      columns: valueColumns,
      order: [[1, 'asc']],
      columnDefs: [
        { className: "text-center", targets: '_all' }
      ],
      rowCallback: async (row: Node, data: any | Object, index: number) => {
        const self = this;
        let onClickDownloadPdf = async (event) => {
          self.certifiedDownloadPdf(data);
        };
        let reportData = self.findReportParameterValue('reportType');
        let selectedIconEle = $(`#spinner-${data.id}`, row);
        if (reportData) {
          if (reportData.value == 'uncertified_logs') {
            selectedIconEle.attr("class", "fa fa-file-pdf-o");
            selectedIconEle.css('cursor', 'default');
            return row;
          } else {
            let pdfRes = await self.restService.getCertifiedLogPDF(data.logDate, data.userId, true).toPromise();
            if (pdfRes.status == 200) {
              if (reportData.value !== 'uncertified_logs') {
                self.reportModalData.isbtnDisabled = false;
              }
              selectedIconEle.attr("class", "fa fa-file-pdf-o");
              selectedIconEle.css("color", "red");
              selectedIconEle.unbind('click', onClickDownloadPdf);
              selectedIconEle.bind('click', onClickDownloadPdf);
              return row;
            } else {
              selectedIconEle.attr("class", "fa fa-file-pdf-o");
              selectedIconEle.css('cursor', 'default');
              return row;
            }
          }
        } else {
          selectedIconEle.attr("class", "fa fa-file-pdf-o");
          return row;
        }
      }
    }
  }

  refreshDataTableCertifiedLogTable() {
    if (this.dataTableCertifiedLogTable) {
      this.reportModalData.isbtnDisabled = true;
      this.dataTableCertifiedLogTable.ajaxReload();
    }
  }

  certifiedDownloadPdf(data) {
    this.restService.getCertifiedLogPDF(data.logDate, data.userId, false)
      .subscribe(response => {
        this.openPDFInNewTab(response);
      },
        e => {
          console.error("Error while downloading file. Please contact us");
        });
  }

  openPDFInNewTab(response) {
    var blob = URL.createObjectURL(new Blob([response], { type: 'application/pdf' }));
    window.open(blob, '_blank');
  }

  initializeDataTableDocumentsTable() {
    const orderColumns = ["driver", "date", "Document Type", "Document Reports"];
    const valueColumns = [
      {
        data: 'driverName',
        orderable: false,
      },
      {
        data: 'date',
        orderable: true,
      },
      {
        data: null,
        orderable: false,
        render: (data, type, full, meta) => {
          return ``;
        }
      },
      {
        data: null,
        orderable: false,
        render: (data, type, full, meta) => {
          return ``;
        }
      }
    ];
    this.dataTableDocumentsOption = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        this.setFilterOption();
        let params: FilterParams = this.dataTableService.calculateParamsForVis(data, orderColumns);
        this.restService.getDriverDailies(params, this.filterOption, this.tableLength)
          .subscribe(data => {
            callback({
              aaData: data ? data.results : [],
              recordsTotal: data ? data.resultCount : 0,
              recordsFiltered: data ? data.resultCount : 0
            })
          })
      },
      columns: valueColumns,
      columnDefs: [
        { className: "text-center", targets: '_all' }
      ],
      order: [[1, 'asc']]
    }
  }

  refreshDataTableDocumentsTable() {
    if (this.dataTableDocumentsTable) {
      this.dataTableDocumentsTable.ajaxReload();
    }
  }

  initializeDataTableSpecialMovesTable() {
    const orderColumns = ["Driver", "event_time", "Special Moves"];
    const valueColumns = [
      {
        data: null,
        orderable: false,
        render: function (data, type, full, meta) {
          let driverName = this.findDriverName(full.userId);
          return `${driverName}`;
        }.bind(this)
      },
      {
        data: null,
        orderable: false,
        render: function (data, type, full, meta) {
          return moment(full.eventTime).format("MM/DD/YYYY hh:mm A");
        }.bind(this),
      },
      {
        data: 'eventType',
        orderable: false,
      }
    ];
    this.dataTableSpecialMovesOption = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        this.setFilterOption();
        let params: FilterParams = this.dataTableService.calculateParamsForVis(data, orderColumns);
        this.restService.getDriverHistoriesForSpecialMoves(params, this.filterOption, this.tableLength)
          .subscribe(data => {
            callback({
              aaData: data ? data.results : [],
              recordsTotal: data ? data.resultCount : 0,
              recordsFiltered: data ? data.resultCount : 0
            })
          })
      },
      columns: valueColumns,
      columnDefs: [
        { className: "text-center", targets: '_all' }
      ],
      rowCallback: async (row: Node, data: any | Object, index: number) => {
        const self = this;
        $(row).on('click', () => {
          self.redirectUserToDriverLog(data.userId);
        });
        $(row).attr('data-toggle', 'tooltip');
        $(row).attr('data-placement', 'top');
        let driverName = self.findDriverName(data.userId);
        $(row).attr('title', `Go to ${driverName}'s Logs`)
      },
      order: [[1, 'asc']]
    }
  }

  redirectUserToDriverLog(driverId) {
    this.router.navigateByUrl(`/hours/logs`, { state: { driverId } });
    this.onCloseReportModal()
  }

  refreshDataTableSpecialMovesTable() {
    if (this.dataTableSpecialMovesTable) {
      this.dataTableSpecialMovesTable.ajaxReload();
    }
  }

  initializeDataTableVehicleDailyUsageReportTable() {
    const orderColumns = ["Vehicle Name", "VIN", "Driver Name", "event-time", "Status"];
    const valueColumns = [
      {
        data: null,
        orderable: false,
        render: function (data, type, full, meta) {
          return this.findVehicle(full.assetId)
        }.bind(this)
      },
      {
        data: 'vin',
        orderable: false
      },
      {
        data: null,
        orderable: true,
        render: function (data, type, full, meta) {
          return this.findDriverName(full.userId);
        }.bind(this)
      }, {
        data: null,
        orderable: true,
        render: function (data, type, full, meta) {
          return moment(full.eventTime).format("MM/DD/YYYY hh:mm A");
        }.bind(this),
      }, {
        data: 'recordStatus',
        orderable: true,
      }
    ];
    this.dataTableVehicleDailyUsageReportOption = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        this.setFilterOption();
        let params: FilterParams = this.dataTableService.calculateParamsForVis(data, orderColumns);
        this.restService.getDriverHistoriesForVehicleDailyUsage(params, this.filterOption, this.tableLength)
          .subscribe(data => {
            callback({
              aaData: data ? data.results : [],
              recordsTotal: data ? data.resultCount : 0,
              recordsFiltered: data ? data.resultCount : 0
            })
          })
      },
      columns: valueColumns,
      columnDefs: [
        { className: "text-center", targets: '_all' }
      ],
      order: [[3, 'asc']]
    }
  }

  refreshDataTableVehicleDailyUsageReportTable() {
    if (this.dataTableVehicleDailyUsageReportTable) {
      this.dataTableVehicleDailyUsageReportTable.ajaxReload();
    }
  }

  getActiveDrivers() {
    this.restService.getAllDriversForHOS()
      .subscribe(data => {
        this.drivers = data;
      });
  }

  getAllDrivers() {
    this.restService.getAllDriversForHOS(null)
      .subscribe(data => {
        this.allDrivers = data;
      });
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

  getAllVehicles() {
    this.restService.getAllVehiclesForHOS().subscribe(val => {
      this.vehicles = val;
    })
  }

  findVehicle(assetId) {
    let vehicleData = this.vehicles.find(v => v.id == assetId);
    return vehicleData ? vehicleData.name : '';
  }

  getAllDriverHistoryUpdateDataReasons() {
    this.driverHistoryUpdateDataReasonArr = getDriverHistoryUpdateDataReasons();
  }

  onSelectAllVehicles(index) {
    this.reportModalData.parameters[index].value = this.vehicles.map(v => v.id);
  }

  // after submit form and change form value methods
  onCloseReportModal() {
    this._reportModal.hide();
  }

  onReportModalExport() {
    this.driverSelectionError = false;
    this.filterOption.exportType = 'pdf';
    this.setFilterOption();
    if (this.reportModalData.nameSlag === 'certified-logs') {
      this.reportModalData.isbtnDisabled = true;
      let reportTypeData = this.findReportParameterValue('reportType');
      if (reportTypeData.value === 'all_logs' || reportTypeData.value === 'certified_logs') {
        this.restService.getCertifiedLogBulkExport(this.filterOption)
          .subscribe(response => {
            this.reportModalData.isbtnDisabled = false;
            fileSaver(response, this.generateCertifiedZipFileName('zip'));
          }, error => {
            this.reportModalData.isbtnDisabled = false;
            console.error('Error while downloading file');
          })
      } else if (reportTypeData.value === 'uncertified_logs') {
        this.restService.getRunUncertifiedLogsReport(this.reportModalData.id, true, this.filterOption)
          .subscribe(response => {
            this.reportModalData.isbtnDisabled = false;
            if (this.filterOption.exportType === 'pdf') {
              this.openPDFInNewTab(response);
            } else {
              fileSaver(response, this.generateCertifiedZipFileName(this.filterOption.exportType));
            }
          }, error => {
            this.reportModalData.isbtnDisabled = false;
            console.error('Error while downloading file');
          })
      } else {
        this.filterOption.exportType = 'pdf'
        this.restService.getRunCertifiedLogsReport(this.reportModalData.id, true, this.filterOption)
          .subscribe(response => {
            this.reportModalData.isbtnDisabled = false;
            if (this.filterOption.exportType === 'pdf') {
              this.openPDFInNewTab(response);
            } else {
              fileSaver(response, this.generateCertifiedZipFileName(this.filterOption.exportType));
            }
          }, error => {
            this.reportModalData.isbtnDisabled = false;
            console.error('Error while downloading file');
          })
      }
    } else if (this.reportModalData.nameSlag === 'cost-estimator') {
      this.reportModalData.isbtnDisabled = true;
      this.restService.getRunCostEstimatorReport()
        .subscribe(response => {
          this.reportModalData.isbtnDisabled = false;
          fileSaver(response, this.generateCostEstimatorFileName(this.reportModalData.exportType));
        }, error => {
          this.reportModalData.isbtnDisabled = false;
          console.error('Error while downloading file');
        })
    } else if (this.reportModalData.nameSlag === 'driver-vehicle') {
      this.reportModalData.isbtnDisabled = true;
      this.restService.getRunDriverAndVehicleInformationReport(this.reportModalData.id, this.filterOption)
        .subscribe(response => {
          this.reportModalData.isbtnDisabled = false;

          if (this.filterOption.exportType === 'pdf') {
            this.openPDFInNewTab(response);
          } else {
            fileSaver(response, this.generateDriverVehicleFileName(this.filterOption.exportType));
          }
        }, error => {
          this.reportModalData.isbtnDisabled = false;
          console.error('Error while downloading file');
        })
    } else if (this.reportModalData.nameSlag === 'driver-log') {
      this.reportModalData.isbtnDisabled = true;
      if (this.filterOption.selectedUserIdArr.length > 0) {
        let driverReport = this.findReportParameterValue('driverReport');
        if (driverReport.value === 'driver_logs') {
          this.reportModalData.id = this.findReportIdByName('Driver Log Report');
          this.restService.getRunDriverLogsReport(this.reportModalData.id, this.filterOption)
            .subscribe(response => {
              this.reportModalData.isbtnDisabled = false;
              if (this.filterOption.exportType === 'pdf') {
                this.openPDFInNewTab(response);
              } else {
                fileSaver(response, this.generateDriverLogFileName(this.filterOption.exportType));
              }
            }, error => {
              this.reportModalData.isbtnDisabled = false;
              console.error('Error while downloading file');
            })
        } else if (driverReport.value === 'edited_logs') {
          this.reportModalData.id = this.findReportIdByName('Log Edit Report');
          this.restService.getRunLogEditsReport(this.reportModalData.id, this.filterOption)
            .subscribe(response => {
              this.reportModalData.isbtnDisabled = false;
              if (this.filterOption.exportType === 'pdf') {
                this.openPDFInNewTab(response);
              } else {
                fileSaver(response, this.generateDriverLogFileName(this.filterOption.exportType));
              }
            }, error => {
              this.reportModalData.isbtnDisabled = false;
              console.error('Error while downloading file');
            })
        } else {
          this.reportModalData.id = this.findReportIdByName('Include Original Report (Current Log vs Edit Log)');
          this.restService.getRunCurrentLogVsEditLogReport(this.reportModalData.id, this.filterOption)
            .subscribe(response => {
              this.reportModalData.isbtnDisabled = false;
              if (this.filterOption.exportType === 'pdf') {
                this.openPDFInNewTab(response);
              } else {
                fileSaver(response, this.generateDriverLogFileName(this.filterOption.exportType));
              }
            }, error => {
              this.reportModalData.isbtnDisabled = false;
              console.error('Error while downloading file');
            })
        }
      } else {
        this.reportModalData.isbtnDisabled = false;
        this.driverSelectionError = true;
      }
    } else if (this.reportModalData.nameSlag === 'driver-timecard') {
      this.reportModalData.isbtnDisabled = true;
      this.restService.getRunOnDutyAndOffDutyReport(this.reportModalData.id, this.filterOption)
        .subscribe(response => {
          this.reportModalData.isbtnDisabled = false;
          if (this.filterOption.exportType === 'pdf') {
            this.openPDFInNewTab(response);
          } else {
            fileSaver(response, this.generateDriverTimecardFileName(this.filterOption.exportType));
          }
        }, error => {
          this.reportModalData.isbtnDisabled = false;
          console.error('Error while downloading file');
        })
    } else if (this.reportModalData.nameSlag === 'driver-app-vesion') {
      this.reportModalData.isbtnDisabled = true;
      this.restService.getRunMobileAppVersionReport(this.reportModalData.id, this.filterOption)
        .subscribe(response => {
          this.reportModalData.isbtnDisabled = false;
          if (this.filterOption.exportType === 'pdf') {
            this.openPDFInNewTab(response);
          } else {
            fileSaver(response, this.generateMobileAppVersionReportFileName(this.filterOption.exportType));
          }
        }, error => {
          this.reportModalData.isbtnDisabled = false;
          console.error('Error while downloading file');
        })
    } else if (this.reportModalData.nameSlag === 'driving-open-defect') {
      this.reportModalData.isbtnDisabled = true;
      this.restService.getRunDrivingOnOpenDefectsReport(this.reportModalData.id, this.filterOption)
        .subscribe(response => {
          this.reportModalData.isbtnDisabled = false;
          if (this.filterOption.exportType === 'pdf') {
            this.openPDFInNewTab(response);
          } else {
            fileSaver(response, this.generateOpenDefectsReportFileName(this.filterOption.exportType));
          }
        }, error => {
          this.reportModalData.isbtnDisabled = false;
          console.error('Error while downloading file');
        })
    } else if (this.reportModalData.nameSlag === 'driving-without-DVIR') {
      this.reportModalData.isbtnDisabled = true;
      this.restService.getRunDrivingWithoutDvirReport(this.reportModalData.id, this.filterOption)
        .subscribe(response => {
          this.reportModalData.isbtnDisabled = false;
          if (this.filterOption.exportType === 'pdf') {
            this.openPDFInNewTab(response);
          } else {
            fileSaver(response, this.generateDrivingWithoutDVIRReportFileName(this.filterOption.exportType));
          }
        }, error => {
          this.reportModalData.isbtnDisabled = false;
          console.error('Error while downloading file');
        })
    } else if (this.reportModalData.nameSlag === 'edit-logs') {
      this.reportModalData.isbtnDisabled = true;
      this.restService.getRunLogEditsReport(this.reportModalData.id, this.filterOption)
        .subscribe(response => {
          this.reportModalData.isbtnDisabled = false;
          if (this.filterOption.exportType === 'pdf') {
            this.openPDFInNewTab(response);
          } else {
            fileSaver(response, this.generateDriverEditLogFileName(this.filterOption.exportType));
          }
        }, error => {
          this.reportModalData.isbtnDisabled = false;
          console.error('Error while downloading file');
        })
    } else if (this.reportModalData.nameSlag === 'hours-miles') {
      this.reportModalData.isbtnDisabled = true;
      this.restService.getRunReport(this.reportModalData.id, this.filterOption)
        .subscribe(response => {
          this.reportModalData.isbtnDisabled = false;
          if (this.filterOption.exportType === 'pdf') {
            this.openPDFInNewTab(response);
          } else {
            fileSaver(response, this.generateHoursAndMilesFileName(this.filterOption.exportType));
          }
        }, error => {
          this.reportModalData.isbtnDisabled = false;
          console.error('Error while downloading file');
        })
    } else if (this.reportModalData.nameSlag === 'hours-worked') {
      this.reportModalData.isbtnDisabled = true;
      this.restService.getRunReport(this.reportModalData.id, this.filterOption)
        .subscribe(response => {
          this.reportModalData.isbtnDisabled = false;
          if (this.filterOption.exportType === 'pdf') {
            this.openPDFInNewTab(response);
          } else {
            fileSaver(response, this.generateHoursWorkedFileName(this.filterOption.exportType));
          }
        }, error => {
          this.reportModalData.isbtnDisabled = false;
          console.error('Error while downloading file');
        })
    } else if (this.reportModalData.nameSlag === 'invalid-data') {
      this.reportModalData.isbtnDisabled = true;
      this.restService.getRunInvalidDataReport(this.reportModalData.id, this.filterOption)
        .subscribe(response => {
          this.reportModalData.isbtnDisabled = false;
          if (this.filterOption.exportType === 'pdf') {
            this.openPDFInNewTab(response);
          } else {
            fileSaver(response, this.generateInvalidDataReportFileName(this.filterOption.exportType));
          }
        }, error => {
          this.reportModalData.isbtnDisabled = false;
          console.error('Error while downloading file');
        })
    } else if (this.reportModalData.nameSlag === 'odometer-jump') {
      this.reportModalData.isbtnDisabled = true;
      this.restService.getRunOdometerJumpsReport(this.reportModalData.id, this.filterOption)
        .subscribe(response => {
          this.reportModalData.isbtnDisabled = false;
          if (this.filterOption.exportType === 'pdf') {
            this.openPDFInNewTab(response);
          } else {
            fileSaver(response, this.generateOdometerJumpReportFileName(this.filterOption.exportType));
          }
        }, error => {
          this.reportModalData.isbtnDisabled = false;
          console.error('Error while downloading file');
        })
    } else if (this.reportModalData.nameSlag === 'raw-punch') {
      this.reportModalData.isbtnDisabled = true;
      this.restService.getRunRawPunchReport(this.reportModalData.id, this.filterOption)
        .subscribe(response => {
          this.reportModalData.isbtnDisabled = false;
          if (this.filterOption.exportType === 'pdf') {
            this.openPDFInNewTab(response);
          } else {
            fileSaver(response, this.generateRawPunchReportFileName(this.filterOption.exportType));
          }
        }, error => {
          this.reportModalData.isbtnDisabled = false;
          console.error('Error while downloading file');
        })
    } else if (this.reportModalData.nameSlag === 'rejected-edits') {
      this.reportModalData.isbtnDisabled = true;
      this.restService.getRunRejectedEditsReport(this.reportModalData.id, this.filterOption)
        .subscribe(response => {
          this.reportModalData.isbtnDisabled = false;
          if (this.filterOption.exportType === 'pdf') {
            this.openPDFInNewTab(response);
          } else {
            fileSaver(response, this.generateRejectedEditsReportFileName(this.filterOption.exportType));
          }
        }, error => {
          this.reportModalData.isbtnDisabled = false;
          console.error('Error while downloading file');
        })
    } else if (this.reportModalData.nameSlag === 'special-moves') {
      this.reportModalData.isbtnDisabled = true;
      this.restService.getRunSpecialMovesReport(this.reportModalData.id, this.filterOption)
        .subscribe(response => {
          this.reportModalData.isbtnDisabled = false;
          if (this.filterOption.exportType === 'pdf') {
            this.openPDFInNewTab(response);
          } else {
            fileSaver(response, this.generateSpecialMovesReportFileName(this.filterOption.exportType));
          }
        }, error => {
          this.reportModalData.isbtnDisabled = false;
          console.error('Error while downloading file');
        })
    } else if (this.reportModalData.nameSlag === 'usage') {
      this.reportModalData.isbtnDisabled = true;
      this.restService.getRunUsageReport(this.reportModalData.id, this.filterOption)
        .subscribe(response => {
          this.reportModalData.isbtnDisabled = false;
          if (this.filterOption.exportType === 'pdf') {
            this.openPDFInNewTab(response);
          } else {
            fileSaver(response, this.generateUsageReportFileName(this.filterOption.exportType));
          }
        }, error => {
          this.reportModalData.isbtnDisabled = false;
          console.error('Error while downloading file');
        })
    } else if (this.reportModalData.nameSlag === 'VBUS-disconnection') {
      this.reportModalData.isbtnDisabled = true;
      this.restService.getRunDisconnectionReport(this.reportModalData.id, this.filterOption)
        .subscribe(response => {
          this.reportModalData.isbtnDisabled = false;
          if (this.filterOption.exportType === 'pdf') {
            this.openPDFInNewTab(response);
          } else {
            fileSaver(response, this.generateDisconnectionReportFileName(this.filterOption.exportType));
          }
        }, error => {
          this.reportModalData.isbtnDisabled = false;
          console.error('Error while downloading file');
        })
    }
  }

  generateCertifiedZipFileName(fileType: string): string {
    let fileName = 'Certified_Logs';
    // get selected driver
    let driverData = this.findReportParameterValue('userId');
    if (driverData && driverData.value !== 'all') {
      fileName += '_' + this.drivers.find(d => d.id == driverData.value).email;
    } else {
      fileName += '_All_Drivers'
    }

    // get selected terminal
    let terminalData = this.findReportParameterValue('assetId');
    if (terminalData && terminalData.value !== 'all') {
      fileName += '_' + this.terminals.find(t => t.id == terminalData.value).name;
    } else {
      fileName += '_All_Terminals'
    }
    fileName += `_${this.filterOption.onlyDate[0]}_${this.filterOption.onlyDate[1]}`;
    fileName += `.${fileType}`;
    return fileName
  }

  generateCostEstimatorFileName(fileType: string): string {
    return `Estimate.${fileType}`;
  }

  generateDriverVehicleFileName(fileType: string): string {
    return `Driver And Vehicle Information Report.${fileType}`;
  }

  generateDriverLogFileName(fileType: string): string {
    return `Driver Log Report.${fileType}`;
  }

  generateDriverTimecardFileName(fileType: string): string {
    return `Driver's Timecard Report.${fileType}`;
  }

  generateMobileAppVersionReportFileName(fileType: string): string {
    return `Mobile App Version Report.${fileType}`;
  }

  generateOpenDefectsReportFileName(fileType: string): string {
    return `Driving on Open Defects Report.${fileType}`;
  }

  generateDrivingWithoutDVIRReportFileName(fileType: string): string {
    return `Driving Without DVIR Report.${fileType}`;
  }

  generateDriverEditLogFileName(fileType: string): string {
    return `Log Edit Report.${fileType}`;
  }

  generateHoursAndMilesFileName(fileType: string): string {
    return `Hours and Miles (Date Range).${fileType}`;
  }

  generateHoursWorkedFileName(fileType: string): string {
    return `Hours Worked (Date Range).${fileType}`;
  }

  generateInvalidDataReportFileName(fileType: string): string {
    return `Invalid Data Report.${fileType}`;
  }

  generateOdometerJumpReportFileName(fileType: string): string {
    return `Odometer Jump Report.${fileType}`;
  }

  generateRawPunchReportFileName(fileType: string): string {
    return `Raw Punch Report.${fileType}`;
  }

  generateRejectedEditsReportFileName(fileType: string): string {
    return `Rejected Edits Report.${fileType}`;
  }

  generateSpecialMovesReportFileName(fileType: string): string {
    return `Special Moves Report.${fileType}`;
  }

  generateUsageReportFileName(fileType: string): string {
    return `Usage Report.${fileType}`;
  }

  generateDisconnectionReportFileName(fileType: string): string {
    return `Disconnection Report.${fileType}`;
  }

  findReportParameterValue(parameterName: string): ReportParametersModal {
    return this.reportModalData.parameters.find(p => p.name === parameterName);
  }

  setFilterOption() {
    // set date
    let dateRange = this.findReportParameterValue('dateRange');
    if (dateRange) {
      this.filterOption.dateRange = dateRange.value ? dateRange.value : [];
    }

    // set driver
    let driverData = this.findReportParameterValue('userId');
    if (driverData && driverData.value !== 'all') {
      this.filterOption.userId = driverData.value;
      this.isDisabledTerminal = true;
    } else {
      this.isDisabledTerminal = false;
      this.filterOption.userId = 'all';
    }

    // set terminal
    let terminalData = this.findReportParameterValue('terminalId');
    if (terminalData && terminalData.value !== 'all') {
      this.filterOption.terminalId = terminalData.value;
    } else {
      this.filterOption.terminalId = 'all';
    }

    // set report
    let reportData = this.findReportParameterValue('reportType');
    if (reportData) {
      if (reportData.value === 'certified_logs') {
        this.filterOption.isCertified = true;
      } else if (reportData.value === 'uncertified_logs') {
        this.filterOption.isCertified = false;
      } else {
        this.filterOption.isCertified = null;
      }
    }

    // set Information type
    let informationType = this.findReportParameterValue('informationType');
    if (informationType) {
      this.filterOption.informationType = informationType.value;
    }

    // set Driver Selection
    let driverSelection = this.findReportParameterValue('driverSelection');
    if (driverSelection) {
      this.filterOption.selectedUserIdArr = driverSelection.value.map(d => d.id);
    }

    // set unit type
    let driverVehicleUnit = this.findReportParameterValue('driverVehicleUnit');
    if (driverVehicleUnit) {
      this.filterOption.driverVehicleUnitType = driverVehicleUnit.value;
    }

    // set vehicle data
    let vehicalData = this.findReportParameterValue('assetId');
    if (vehicalData) {
      if (vehicalData.isMulti) {
        this.filterOption.assetIdArr = vehicalData.value;
      } else {
        if (Array.isArray(vehicalData.value)) {
          if (vehicalData.value.length > 0) {
            this.filterOption.assetId = vehicalData.value[0];
          } else {
            this.filterOption.assetId == 'all';
          }
        } else {
          this.filterOption.assetId = vehicalData.value;
        }
      }
    }

    //set document type
    let documentTypeRadioData = this.findReportParameterValue('documentTypeRadio');
    if (documentTypeRadioData) {
      this.filterOption.exportType = documentTypeRadioData.value;
    } else {
      this.filterOption.exportType = 'pdf';
    }

    // set driver update reason
    let driverHistoryUpdateDataReasonsData = this.findReportParameterValue('driverHistoryUpdateDataReasons');
    if (driverHistoryUpdateDataReasonsData) {
      this.filterOption.driverHistoryUpdateDataReason = driverHistoryUpdateDataReasonsData.value.split(' ')
        .map(w => w[0].toUpperCase() + w.substr(1).toLowerCase())
        .join('+');
    }

    // check unidentified drivers incude or not
    let includeUnidentifiedDriversTypeData = this.findReportParameterValue('includeUnidentifiedDriversType');
    if (includeUnidentifiedDriversTypeData) {
      this.filterOption.isUnidIncluded = includeUnidentifiedDriversTypeData.value;
    } else {
      this.filterOption.isUnidIncluded = false;
    }

    // set usage type
    let usageTypeData = this.findReportParameterValue('usageType');
    if (usageTypeData) {
      this.filterOption.usagePer = usageTypeData.value;
    }

    // set usage detection
    let usageDetectedData = this.findReportParameterValue('usageDetected');
    if (usageDetectedData) {
      this.filterOption.usageMonth = usageDetectedData.value;
    }

    // convert datetime to only date
    this.convertFilterDateTimeToOnlyDate();
    // convert datetime to ISO date
    this.convertFilterDateToISODate();
  }

  convertFilterDateTimeToOnlyDate() {
    if (this.filterOption.dateRange.length > 0) {
      this.filterOption.onlyDate[0] = moment(this.filterOption.dateRange[0]).format('YYYY-MM-DD')
      this.filterOption.onlyDate[1] = moment(this.filterOption.dateRange[1]).format('YYYY-MM-DD')
    }
  }

  convertFilterDateToISODate() {
    this.filterOption.ISODateRange[0] = moment(this.filterOption.dateRange[0]).toISOString()
    this.filterOption.ISODateRange[1] = moment(this.filterOption.dateRange[1]).toISOString()
  }

  onDriverChange() {
    this.setFilterOption();
    if (this.reportModalData.nameSlag === 'certified-logs') {
      this.refreshDataTableCertifiedLogTable();
    }

    if (this.reportModalData.nameSlag === 'special-moves') {
      this.refreshDataTableSpecialMovesTable();
    }

    if (this.reportModalData.nameSlag === 'vehicle-daily-usage') {
      this.refreshDataTableVehicleDailyUsageReportTable();
    }
  }
  displayCapability(item: Driver) {
    return item.name();
  }

  onDriverSelectionChanged() {
    let driverData = this.findReportParameterValue('driverSelection');
    this.driverSelectionError = driverData && driverData.value.length <= 0;
  }

  onTerminalChange() {
    this.setFilterOption();
    if (this.reportModalData.nameSlag === 'certified-logs') {
      this.refreshDataTableCertifiedLogTable();
    }

    if (this.reportModalData.nameSlag === 'special-moves') {
      this.refreshDataTableSpecialMovesTable();
    }
  }

  onDateRangeFilterChange() {
    this.setFilterOption();
    if (this.reportModalData.nameSlag === 'certified-logs') {
      this.refreshDataTableCertifiedLogTable();
    }

    if (this.reportModalData.nameSlag === 'special-moves') {
      this.refreshDataTableSpecialMovesTable();
    }

    if (this.reportModalData.nameSlag === 'vehicle-daily-usage') {
      this.refreshDataTableVehicleDailyUsageReportTable();
    }
  }

  onReportTypeChange() {
    this.reportModalData.isbtnDisabled = true;
    this.setFilterOption();
    if (this.reportModalData.nameSlag === 'certified-logs') {
      let reportData = this.findReportParameterValue('reportType');
      if (reportData) {
        if (reportData.value === 'certified_logs' || reportData.value === 'all_logs') {
          this.reportModalData.parameters = this.reportModalData.parameters.map(para => {
            if (para.name === 'dataTableCertifiedLog') {
              para.isShow = true;
            }

            if (para.name === 'documentTypeRadio') {
              para.isShow = false;
            }
            return para;
          })
          this.reportModalData.exportBtnName = 'Bulk Export';
          this.refreshDataTableCertifiedLogTable();
        } else if (reportData.value === 'uncertified_logs') {
          this.reportModalData.parameters = this.reportModalData.parameters.map(para => {
            if (para.name === 'dataTableCertifiedLog') {
              para.isShow = true;
            }
            if (para.name === 'documentTypeRadio') {
              para.isShow = true;
            }
            return para;
          })
          this.reportModalData.exportBtnName = 'Generate Report';
          this.refreshDataTableCertifiedLogTable();
          this.reportModalData.isbtnDisabled = false;
        } else if (reportData.value === 'summary_logs') {
          this.reportModalData.parameters = this.reportModalData.parameters.map(para => {
            if (para.name === 'dataTableCertifiedLog') {
              para.isShow = false;
            }
            if (para.name === 'documentTypeRadio') {
              para.isShow = true;
            }
            return para;
          })
          this.reportModalData.isbtnDisabled = false;
          this.reportModalData.exportBtnName = 'Generate Summary';
        }
      }
    }
  }

  onSpecialMovesChange() {
    this.setFilterOption();
    if (this.reportModalData.nameSlag === 'special-moves') {
      this.refreshDataTableSpecialMovesTable();
    }
  }

  onDriverVehicleUnitChange() {
    this.setFilterOption();
    if (this.reportModalData.nameSlag === 'special-moves') {
      this.refreshDataTableSpecialMovesTable();
    }
  }

  onAssetChange() {
    this.setFilterOption();
    if (this.reportModalData.nameSlag === 'vehicle-daily-usage') {
      this.refreshDataTableVehicleDailyUsageReportTable();
    }
  }

  findReportIdByName(name: string): number {
    let findId = this.allRerports.find(r => r.name === name);
    return findId ? findId.id : null;
  }

}
