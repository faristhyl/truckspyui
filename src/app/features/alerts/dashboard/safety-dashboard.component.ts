import { Component, NgZone, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { forkJoin } from 'rxjs';
import { plainToClass } from 'class-transformer';

import {
  DashboardRow, DispatchGroup, Driver, DriverScoreContext, FilterSafetyDashboard, GlobalFunctionsService, ReportingProfile, ReportPeriod,
  RestService, SafetyDashboard, ScoreReport
} from '@app/core/services';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { CapitalizeAllPipe, ReplaceDashesPipe } from '@app/shared/pipes/utils.pipe';

@Component({
  selector: 'app-safety-dashboard',
  templateUrl: './safety-dashboard.component.html',
  styleUrls: ['./safety-dashboard.component.css']
})
export class SafetyDashboardComponent implements OnInit, OnDestroy {

  @ViewChild('waitModal') waitModal: TemplateRef<any>;
  @ViewChild("dashboardTable") dashboardTable: any;

  orderColumns = ["name", null, null, null];

  showScoreReport(driver: Driver, scoreReport: ScoreReport, display: boolean = false) {
    if (!scoreReport) {
      return "";
    }
    if (display) {
      let isMagnify = scoreReport.driverScoreContexts && scoreReport.driverScoreContexts.length > 0;
      let magnify = `<span style="width: 15px;" class="pull-right">&nbsp;</span>`;
      if (isMagnify) {
        var driverEncoded = this.gfService.encodeParam(driver);
        var reportEncoded = this.gfService.encodeParam(scoreReport);
        var contextsEncoded = this.gfService.encodeParam(scoreReport.driverScoreContexts);
        magnify = `<a style="width: 15px;" class="pull-right" onclick='truckspy.showScoreDetail("${driverEncoded}", "${reportEncoded}", "${contextsEncoded}")'>
          <span><i class="fa fa-search"></i></span>
        </a>`;
      }
      return `<span style="width: calc(100% - 15px); margin-left: 15px;">${scoreReport.score} | ${scoreReport.drivingMinutes || scoreReport.drivingMiles} | ${scoreReport.positiveEventCount} | ${scoreReport.negativeEventCount}</span>${magnify}`;
    }
    return scoreReport.score;
  }

  valueColumns = [
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        const driver = full.driver;
        if (!driver) {
          return '';
        }
        var remoteId = driver.remoteId || "(unspecified)";
        var name = driver.name();
        var id = driver.id;
        return `<a href="#/drivers/${id}/view">${name} (${remoteId})</a>`;
      }
    },
    {
      orderable: true,
      render: function (data, type, full, meta) {
        return this.showScoreReport(full.driver, full.scoreReports[0], type == 'display');
      }.bind(this)
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.showScoreReport(full.driver, full.scoreReports[1], type == 'display');
      }.bind(this)
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.showScoreReport(full.driver, full.scoreReports[2], type == 'display');
      }.bind(this)
    }
  ];
  options: any;
  defineOptions() {
    this.options = {
      noToolbar: true,
      processing: true,
      serverSide: false,
      scrollY: '50vh',
      scrollCollapse: true,
      paging: false,
      data: [],
      columns: this.valueColumns,
      columnDefs: [
        {
          targets: [1, 2, 3],
          defaultContent: "",
          createdCell: function (cell, cellData, rowData, rowIndex, colIndex) {
            $(cell).css('text-align', 'center');
            let scoreReport: ScoreReport | null = rowData.scoreReports[colIndex - 1];
            if (!scoreReport) {
              return;
            }
            if (scoreReport.isNinetiethPercentile) {
              $(cell).css('background-color', '#eaf0ea');
            }
            if (scoreReport.isFiftienthPercentile) {
              $(cell).css('background-color', '#f8efdb');
            }
            if (scoreReport.isTenthPercentile) {
              $(cell).css('background-color', '#fdcdd8');
            }
          }
        }
      ]
    };
  }

  /**
   * Filtering logic
   */
  filters: FilterSafetyDashboard = {
    reportingProfileId: '',
    dispatchGroupId: ''
  };
  dashboard: SafetyDashboard;
  rows: DashboardRow[] = [];
  displayRows: DashboardRow[] = [];

  reportingProfiles: ReportingProfile[] = [];
  reportingProfilesLoaded: boolean = false;
  dispatchGroups: DispatchGroup[] = [];
  dispatchGroupsLoaded: boolean = false;

  onDispatchGroupIdChanged(event) {
    this.filters.dispatchGroupId = event;
    this.loadDashboard();
  }

  onReportingProfileIdChanged(event) {
    this.filters.reportingProfileId = event;
    this.loadDashboard();
  }

  isNinetiethPercentile: boolean = false;
  isFiftienthPercentile: boolean = false;
  isTenthPercentile: boolean = false;

  filter10() {
    this.isNinetiethPercentile = false;
    this.isFiftienthPercentile = false;
    this.isTenthPercentile = !this.isTenthPercentile;
    this.doUIFilter();
  }
  filter50() {
    this.isNinetiethPercentile = false;
    this.isFiftienthPercentile = !this.isFiftienthPercentile;
    this.isTenthPercentile = false;
    this.doUIFilter();
  }
  filter90() {
    this.isNinetiethPercentile = !this.isNinetiethPercentile;
    this.isFiftienthPercentile = false;
    this.isTenthPercentile = false;
    this.doUIFilter();
  }
  private checkReport(report: ScoreReport) {
    let isFilterSet = this.isNinetiethPercentile || this.isFiftienthPercentile || this.isTenthPercentile;
    return !isFilterSet || !!report && report.isNinetiethPercentile === this.isNinetiethPercentile &&
      report.isFiftienthPercentile === this.isFiftienthPercentile &&
      report.isTenthPercentile === this.isTenthPercentile;
  }
  doUIFilter() {
    this.displayRows = (this.rows || [])
      .filter(row => this.checkReport(row.scoreReports[0]) || this.checkReport(row.scoreReports[1]) || this.checkReport(row.scoreReports[2]));
    this.dashboardTable.dataReload(this.displayRows);
  }

  constructor(
    private restService: RestService,
    private modalService: BsModalService,
    private dateService: DateService,
    private replaceDashes: ReplaceDashesPipe,
    private capitalizeAll: CapitalizeAllPipe,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService
  ) { }

  ngOnInit() {
    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.showScoreDetail = this.showScoreDetail.bind(this);

    this.defineOptions();
    this.defineOptionsAlerts();
    this.loadDashboard();
    this.loadFiltersData();
  }

  ngOnDestroy() {
    window.truckspy.showScoreDetail = null;
  }

  _waitModal: BsModalRef;
  loadDashboard() {
    this._waitModal = this.modalService.show(this.waitModal, { class: "modal-400 modal-info", ignoreBackdropClick: true });

    this.restService.getSafetyDashboard(this.filters)
      .subscribe(
        dashboardData => {
          this.dashboard = dashboardData;
          this.setHeaders(this.dashboard)

          this.rows = this.dashboard.rows;
          this.doUIFilter();
          this.closeWaitModal();
        }
      );
  }
  setHeaders(dashboard: SafetyDashboard) {
    dashboard.reportPeriods.forEach((period: ReportPeriod, index) => {
      let start = this.dateService.transformDateMMDD(period.startedAt);
      let end = this.dateService.transformDateMMDD(period.endedAt);
      $(`#header-column-${index + 1}`)
        .html(`${start}&nbsp;-&nbsp;${end}<br>Score&nbsp;|&nbsp;Mins/Miles&nbsp;|&nbsp;+&nbsp;|&nbsp;-`);
    });
  }
  closeWaitModal() {
    if (this._waitModal) {
      this._waitModal.hide();
    }
  }

  loadFiltersData() {
    forkJoin(
      this.restService.get1000ReportingProfiles(),
      this.restService.get1000DispatchGroupsLight()
    ).subscribe(([reportingProfiles, dispatchGroups]) => {
      this.reportingProfiles = reportingProfiles;
      this.reportingProfilesLoaded = true;
      this.dispatchGroups = dispatchGroups;
      this.dispatchGroupsLoaded = true;
    })
  }

  /**
   * Show Score Detail functionality.
   */
  showScoreDetail(driverEncoded: string, reportEncoded: string, contextsEncoded: string) {
    this.ngZone.run(() => {
      var driver = this.gfService.decodeParam(driverEncoded);
      var report = this.gfService.decodeParam(reportEncoded);
      var contexts = this.gfService.decodeParam(contextsEncoded);
      this.showScoreDetailPrivate(driver, report, contexts);
    });
  }
  showScoreDetailPrivate(driver: any, report: any, contexts: any) {
    let driverObject: Driver = plainToClass(Driver, driver as Driver);
    let reportObject: ScoreReport = plainToClass(ScoreReport, report as ScoreReport);
    let contextsObject: DriverScoreContext[] = plainToClass(DriverScoreContext, contexts as DriverScoreContext[]);
    this.scoreDetailData = {
      driver: driverObject,
      report: reportObject,
      contexts: contextsObject
    }

    this._scoreDetailModal = this.modalService.show(this.scoreDetailModal, { class: "modal-lg" });

    var refreshTimer = setInterval(function () {
      var alertsTable = new $.fn.dataTable.Api("#alertsTable");
      if (alertsTable) {
        alertsTable.clear().rows.add(contextsObject).draw(true);
        alertsTable.page(0).draw('page');
        clearInterval(refreshTimer);
      }
    }.bind(this), 100);
  }

  closeScoreDetailModal() {
    this._scoreDetailModal.hide();
  }

  @ViewChild('scoreDetailModal') scoreDetailModal: TemplateRef<any>;
  _scoreDetailModal: BsModalRef;
  scoreDetailData = {
    driver: null,
    report: null,
    contexts: []
  }

  valueColumnsAlerts = [
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return `<a target="_blank" href="#/alerts/${full.driveAlert.id}">${full.driveAlert.netradyneId}</a>`;
      }
    },
    {
      orderable: true,
      render: function (data, type, full, meta) {
        return this.dateService.transformDateTime(full.driveAlert.datetime);
      }.bind(this)
    },
    {
      orderable: true,
      data: "driveAlert.textualLocation"
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        let noDashes = this.replaceDashes.transform(full.driveAlert.typeDesc);
        let result = this.capitalizeAll.transform(noDashes);
        return result;
      }.bind(this)
    },
    {
      orderable: true,
      data: "driveAlert.severityDesc"
    },
    {
      orderable: true,
      data: "impact"
    }
  ];
  optionsAlerts: any;
  defineOptionsAlerts() {
    this.optionsAlerts = {
      noToolbar: true,
      processing: true,
      serverSide: false,
      scrollY: '50vh',
      scrollCollapse: true,
      paging: false,
      data: [],
      columns: this.valueColumnsAlerts,
      order: [[1, 'desc']]
    };
  }

}
