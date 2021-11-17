import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Actions } from '@ngrx/effects';
import { Store } from "@ngrx/store";
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { Observable, combineLatest } from 'rxjs';
import { plainToClass } from 'class-transformer';

import {
  RestService, DataTableService, FilterParams, LocalStorageService, ColumnSelector, ColumnSelectorUtil,
  GlobalFunctionsService, DriveAlert, Driver, FilterAlertOption, DriveAlertStatus, Company
} from '@app/core/services/rest.service';
import { getTableLength, AuthState, LoggedInAs, LoggedOutAs } from '@app/core/store/auth';
import { getConfigCompany } from '@app/core/store/config';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { ReplaceDashesPipe, CapitalizeAllPipe } from '@app/shared/pipes/utils.pipe';
import { AlertViewModalComponent } from '@app/features/alerts/view/alert-view-modal.component';

@Component({
  selector: 'app-vehicle-alerts',
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css']
})
export class VehicleAlertsComponent implements OnInit {

  company: Company;
  loginAsCompany: Company;
  theCompany() {
    return !!this.loginAsCompany ? this.loginAsCompany : this.company;
  }

  onLoggedInAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedInAs) {
      this.loginAsCompany = this.lsService.getCompany();
    }
  });
  onLoggedOutAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedOutAs) {
      this.loginAsCompany = null;
    }
  });

  @ViewChild("alertsTable") alertsTable: any;

  tableColumns: ColumnSelector[] = [];
  tableColumnsShort: ColumnSelector[] = [];
  tableName = "table_vehicle_alerts";
  tableLength: number;

  vehicleId: string;
  drivers: Driver[];
  filters: FilterAlertOption;

  orderColumns = ["netradyneId", "datetime", "typeDesc", null, "textualLocation", "reviewed", "status", null, null];
  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        const alertEncoded = this.gfService.encodeParam(full);
        return `<a class="action-link" onclick='truckspy.viewAlert("${alertEncoded}")'>${full.netradyneId}</a>`;
      }.bind(this)
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return this.dateService.transformDateTime(full.datetime);
      }.bind(this)
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        let noDashes = this.replaceDashes.transform(full.typeDesc);
        let result = this.capitalizeAll.transform(noDashes);
        return result + full.speedDescription();
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
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
    { data: "textualLocation" },
    {
      data: null,
      render: function (data, type, full, meta) {
        const alertEncoded = this.gfService.encodeParam(full);
        let icon = full.reviewed
          ? `<i class="fa fa-check-square-o" style="color: green"></i><b style="color: #3276b1">&nbsp;Reviewed</b><br>`
          : ``;
        let action = full.reviewed
          ? `<a onclick='truckspy.markNotReviewed("${alertEncoded}", this)' title='Make Unreviewed'><i class="fa fa-times-circle"></i>&nbsp;Make Unreviewed</a>`
          : `<a onclick='truckspy.markReviewed("${alertEncoded}", this)' title='Make Reviewed'><i class="fa fa-check-square-o"></i>&nbsp;Make Reviewed</a>`;

        return `${icon} ${action}`;
      }.bind(this)
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        const isCoachable = full.status === DriveAlertStatus.COACHABLE;
        const isNotCoachable = full.status === DriveAlertStatus.NON_COACHABLE;
        const isNotApplicable = full.status === DriveAlertStatus.NOT_APPLICABLE;
        const notDefined = full.status === null;

        let iconCoachable = `<i class="fa fa-check-square-o" style="color: green"></i><b style="color: #3276b1">&nbsp;Coachable</b>`;
        let iconNotCoachable = `<i class="fa fa-times-circle" style="color: red"></i><b style="color: #3276b1">&nbsp;Not Coachable</b>`;
        let iconNotApplicable = `<i class="fa fa-exclamation-triangle" style="color: gray"></i><b style="color: #3276b1">&nbsp;Not Applicable</b>`;

        const alertEncoded = this.gfService.encodeParam(full);
        const actionCoachable = `<a onclick='truckspy.markCoachable("${alertEncoded}", this)' title='Make Coachable'><i class="fa fa-check-square-o"></i>&nbsp;Make Coachable</a>`;
        const actionNotCoachable = `<a onclick='truckspy.markNotCoachable("${alertEncoded}", this)' title='Make not Coachable'><i class="fa fa-times-circle"></i>&nbsp;Make not Coachable</a>`;
        const actionNotApplicable = `<a onclick='truckspy.markNotApplicable("${alertEncoded}", this)' title='Make not Applicable'><i class="fa fa-exclamation-triangle"></i>&nbsp;Make not Applicable</a>`;

        if (notDefined) {
          return `${actionCoachable}<br>${actionNotCoachable}<br>${actionNotApplicable}`;
        }
        if (isCoachable) {
          return `${iconCoachable}<br>${actionNotCoachable}<br>${actionNotApplicable}`;
        }
        if (isNotCoachable) {
          return `${iconNotCoachable}<br>${actionCoachable}<br>${actionNotApplicable}`;
        }
        if (isNotApplicable) {
          return `${iconNotApplicable}<br>${actionCoachable}<br>${actionNotCoachable}`;
        }
      }.bind(this)
    },
    {
      data: "isSentToDriver()",
      orderable: false
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return this.dateService.transformDateTime(full.coachingCompletedAt);
      }.bind(this)
    }
  ];

  options: any;
  optionsShort: any;
  defineOptions() {
    this.options = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        // drivers are dependent on view alert modal
        if (this.drivers) {
          let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
          this.restService.getAllDriveAlerts(params, this.filters, this.tableLength)
            .subscribe(
              data => {
                callback({
                  aaData: data.results,
                  recordsTotal: data.resultCount,
                  recordsFiltered: data.resultCount
                })
              }
            );
        }
      },
      columns: this.valueColumns,
      order: [[1, 'desc']]
    };

    this.optionsShort = { ...this.options };
    this.optionsShort.columns = this.valueColumns.slice(0, -2);
  }

  /**
   * Constructor to instantiate an instance of VehicleAlertsComponent.
   */
  constructor(
    private actions$: Actions,
    private route: ActivatedRoute,
    private restService: RestService,
    private replaceDashes: ReplaceDashesPipe,
    private capitalizeAll: CapitalizeAllPipe,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService,
    private dataTableService: DataTableService,
    private modalService: BsModalService,
    private dateService: DateService,
    private store: Store<AuthState>,
    private lsService: LocalStorageService) {
    this.vehicleId = this.route.snapshot.parent.paramMap.get('id');
    let loggedInAs = this.lsService.getLoginAs();

    this.store.select(getConfigCompany).subscribe((company: Company) => {
      this.company = company;
    });
    this.loginAsCompany = this.lsService.getCompany();

    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.filters = {
        selectedVehicleId: this.vehicleId,
        selectedDriverId: "",
        reviewed: '',
        status: "",
        sentToDriver: "",
        coachingCompleted: ""
      }
      this.defineOptions();
      this.loadData();
    });
  }

  ngOnInit() {
    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.viewAlert = this.viewAlert.bind(this);
    window.truckspy.markReviewed = this.markReviewed.bind(this);
    window.truckspy.markNotReviewed = this.markNotReviewed.bind(this);
    window.truckspy.markCoachable = this.markCoachable.bind(this);
    window.truckspy.markNotCoachable = this.markNotCoachable.bind(this);
    window.truckspy.markNotApplicable = this.markNotApplicable.bind(this);

    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
      this.tableColumnsShort = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNamesShort, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNamesShort);
    });
  }

  ngOnDestroy() {
    window.truckspy.viewAlert = null;
    window.truckspy.markReviewed = null;
    window.truckspy.markNotReviewed = null;
    window.truckspy.markCoachable = null;
    window.truckspy.markNotCoachable = null;
    window.truckspy.markNotApplicable = null;
  }

  private defaultColumnNames = ["Event ID", "DateTime", "Type", "Driver", "Place", "Reviewed", "Coachable",
    "Coaching Sent To Driver", "Coaching Completed At"];
  private defaultColumnNamesShort = this.defaultColumnNames.slice(0, -2);

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

  loadData() {
    combineLatest(
      this.restService.get1000DriversLight(), // ordered by remoteId.ASC
    ).subscribe(data => {
      this.drivers = data[0];
      this.reloadTable();
    })
  }

  viewAlert(alertEncoded: string) {
    this.ngZone.run(() => {
      var alert = this.gfService.decodeParam(alertEncoded);
      var alertObject: DriveAlert = plainToClass(DriveAlert, alert as DriveAlert);
      this.viewAlertPrivate(alertObject);
    });
  }
  viewAlertPrivate(alert: DriveAlert) {
    this.viewAlertModal = this.modalService.show(AlertViewModalComponent, {
      class: "modal-xl",
      initialState: { alert: alert, drivers: this.drivers, reloadParent: this.reloadTable.bind(this) }
    });
  }
  viewAlertModal: BsModalRef;
  reloadTable() {
    this.alertsTable.ajaxReload();
  }

  markReviewed(alertEncoded: string, element: any) {
    this.ngZone.run(() => {
      var alert = this.gfService.decodeParam(alertEncoded);
      this.markReviewedPrivate(alert, element);
    });
  }
  markReviewedPrivate(alert: any, element: any) {
    let observable = this.restService.markAlertReviewed(alert.id);
    this.callAlertAction(observable, element);
  }

  markNotReviewed(alertEncoded: string, element: any) {
    this.ngZone.run(() => {
      var alert = this.gfService.decodeParam(alertEncoded);
      this.markNotReviewedPrivate(alert, element);
    });
  }
  markNotReviewedPrivate(alert: any, element: any) {
    // let observable = combineLatest(
    //   this.restService.markAlertNotReviewed(alert.id),
    //   this.restService.markAlertNotCoachable(alert.id)
    // );
    let observable = this.restService.markAlertNotReviewed(alert.id);
    this.callAlertAction(observable, element);
  }

  markCoachable(alertEncoded: string, element: any) {
    this.ngZone.run(() => {
      var alert = this.gfService.decodeParam(alertEncoded);
      this.markCoachablePrivate(alert, element);
    });
  }
  markCoachablePrivate(alert: any, element: any) {
    let observable = this.restService.markAlertCoachable(alert.id);
    this.callAlertAction(observable, element);
  }

  markNotCoachable(alertEncoded: string, element: any) {
    this.ngZone.run(() => {
      var alert = this.gfService.decodeParam(alertEncoded);
      this.markNotCoachablePrivate(alert, element);
    });
  }
  markNotCoachablePrivate(alert: any, element: any) {
    let observable = this.restService.markAlertNotCoachable(alert.id);
    this.callAlertAction(observable, element);
  }

  markNotApplicable(alertEncoded: string, element: any) {
    this.ngZone.run(() => {
      var alert = this.gfService.decodeParam(alertEncoded);
      this.markNotApplicablePrivate(alert, element);
    });
  }
  markNotApplicablePrivate(alert: any, element: any) {
    let observable = this.restService.markAlertNotApplicable(alert.id);
    this.callAlertAction(observable, element);
  }

  callAlertAction(observable: Observable<any>, element: any) {
    var waitElement = document.createElement('span');
    waitElement.innerHTML = 'wait...';
    element.parentNode.replaceChild(waitElement, element);

    observable.subscribe(
      good => {
        this.alertsTable.ajaxReload();
      },
      error => {
        waitElement.parentNode.replaceChild(element, waitElement);
      }
    );
  }

}
