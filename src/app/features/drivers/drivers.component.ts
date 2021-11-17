import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Actions } from "@ngrx/effects";
import { Store, select } from '@ngrx/store';
import { forkJoin } from 'rxjs';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { take } from 'rxjs/operators'

import { getConfigStatesKeyValues } from '@app/core/store/config';
import {
  RestService, DataTableService, FilterParams, Company, LocalStorageService, Status, ColumnSelector, ColumnSelectorUtil,
  ReportingProfile, Connection, FilterDrivers, DispatchGroup
} from '@app/core/services/rest.service';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { getConfigCompany } from '@app/core/store/config';
import { LoggedInAs, LoggedOutAs, getTableLength } from '@app/core/store/auth';

@Component({
  selector: 'app-drivers',
  templateUrl: './drivers.component.html',
  styleUrls: ['./drivers.component.css']
})
export class DriversComponent implements OnInit {

  /**
   * Status filtering logic.
   */
  status: string = Status.ACTIVE;
  isActiveTab() {
    return this.status === Status.ACTIVE;
  }
  showActive() {
    this.status = Status.ACTIVE;
    this.clearFilters();
    this.driversTable.ajaxReload();
  }
  showDeleted() {
    this.status = Status.DELETED;
    this.clearFilters();
    this.driversTable.ajaxReload();
  }

  tableColumns: ColumnSelector[] = [];
  private tableName = 'table_drivers';
  tableLength: number;

  reportingProfiles: ReportingProfile[];
  connections: Connection[];
  dispatchGroups: DispatchGroup[];
  dispatchGroupsLoaded: boolean = false;
  filters: FilterDrivers;

  orderColumns = ["remoteId", "firstName", null, "status", null, null];
  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        var remoteId = full.remoteId || "(unspecified)";
        var id = full.id;
        return `<a href="#/drivers/${id}/view">${remoteId}</a>`;
      }
    },
    { data: "name" },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        var reportingName = full.reportingProfile && full.reportingProfile.name;
        var reportingId = full.reportingProfile && full.reportingProfile.id;
        return reportingId ? `<a href="#/reporting/${reportingId}/view">${reportingName}</a>` : "N/A";
      }
    },
    { data: "status" },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (!full.connectionBindList || full.connectionBindList.length === 0) {
          return "";
        }
        return full.connectionBindList
          .filter(bind => !!bind.connection)
          .map(function (bind: any) {
            return `<a href="#/company/connections/${bind.connection.id}/view">${bind.connection.name}</a>`;
          })
          .join(", ");
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let date = full.lastTimeEntry && full.lastTimeEntry.startedAt;
        return this.dateService.transformDateTime(date);
      }.bind(this)
    }
  ];

  options: any;
  defineOptions() {
    this.options = {
      // scrollY: "354px",
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
        this.restService.getAllDrivers(params, this.status, this.tableLength, this.filters)
          .subscribe(
            data => {
              callback({
                aaData: data.results,
                recordsTotal: data.resultCount,
                recordsFiltered: data.resultCount
              })
            }
          );
      },
      columns: this.valueColumns
    };
  }

  constructor(
    private store: Store<any>,
    private actions$: Actions,
    private restService: RestService,
    private dataTableService: DataTableService,
    private modalService: BsModalService,
    private dateService: DateService,
    private lsService: LocalStorageService) {
    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.clearFilters();
      this.loadFiltersData();
      this.defineOptions();
    });
  }

  @ViewChild("profileSelect2") profileSelect2: any;
  @ViewChild("connectionSelect2") connectionSelect2: any;
  clearFilters() {
    this.filters = {
      reportingProfileId: "",
      connectionId: "",
      dispatchGroupId: ""
    }

    // Workaround for select2 selected value
    if (this.profileSelect2 && this.profileSelect2.nativeElement) {
      $(this.profileSelect2.nativeElement).val("").trigger('change');
    }
    if (this.connectionSelect2 && this.connectionSelect2.nativeElement) {
      $(this.connectionSelect2.nativeElement).val("").trigger('change');
    }
  }
  loadFiltersData() {
    forkJoin(
      this.restService.get1000ReportingProfiles(),
      this.restService.get1000Connections(),
    ).subscribe(([reportingProfiles, connections]) => {
      this.reportingProfiles = reportingProfiles;
      this.connections = connections;
    })

    this.restService.get1000DispatchGroupsLight()
      .subscribe(dispatchGroups => {
        this.dispatchGroups = dispatchGroups;
        this.dispatchGroupsLoaded = true;
      })
  }

  onReportProfileChanged(reportingProfileId) {
    this.filters.reportingProfileId = reportingProfileId;
    this.refreshDataTable();
  }

  onConnectionsChanged(connectionId) {
    this.filters.connectionId = connectionId;
    this.refreshDataTable();
  }

  onGroupChange(groupId): void {
    this.filters.dispatchGroupId = groupId;
    this.refreshDataTable();
  }

  refreshDataTable() {
    if (this.driversTable) {
      this.driversTable.ajaxReload();
    }
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
  theCompany() {
    return !!this.loginAsCompany ? this.loginAsCompany : this.company;
  }

  ngOnInit() {
    this.store.pipe(select(getConfigStatesKeyValues), take(1)).subscribe(val => {
      this.states = val;
    });

    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });

    this.store.select(getConfigCompany).subscribe((company: Company) => {
      this.company = company;
    });
    this.loginAsCompany = this.lsService.getCompany();
  }

  /**
   * Add Driver modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addDriverModal: BsModalRef;
  states: any[];
  driverData = {
    firstName: "",
    lastName: "",
    remoteId: "",
    licenseNumber: "",
    licenseState: "",
    licenseExpiration: this.dateService.getCurrentTime(),
    username: "",
    newPassword: ""
  };

  company: Company;
  loginAsCompany: Company;
  @ViewChild("driversTable") driversTable: any;

  addDriver(template: TemplateRef<any>) {
    this.driverData = {
      firstName: "",
      lastName: "",
      remoteId: "",
      licenseNumber: "",
      licenseState: "",
      licenseExpiration: this.dateService.getCurrentTime(),
      username: "",
      newPassword: ""
    };

    this._addDriverModal = this.modalService.show(template, { class: "modal-400" });
  }

  doCreate(): void {
    let theData = {
      ...this.driverData,
      "licenseExpiration": this.driverData.licenseExpiration ? this.dateService.transform4Backend(this.driverData.licenseExpiration) : null
    }
    this.restService.createDriver(theData)
      .subscribe(
        data => {
          this._addDriverModal.hide();
          this.driversTable.ajaxReload();
        }
      );
  }
  closeAddDriverModal(): void {
    this._addDriverModal.hide();
  }

  private defaultColumnNames = ['Driver ID', 'Name', 'Reporting Profile', 'Status', 'Connection', 'Last Entry'];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

}
