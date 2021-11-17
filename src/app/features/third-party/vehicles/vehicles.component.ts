import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import {
  RestService, DataTableService, FilterParams, Vehicle, LocalStorageService, Status, ColumnSelector,
  ColumnSelectorUtil, DomicileLocation, FilterVehiclesThirdParty, EntityThirdParty
} from '@app/core/services/rest.service';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { getTableLength } from '@app/core/store/auth';

@Component({
  selector: 'app-thirdparty-vehicles',
  templateUrl: './vehicles.component.html',
  styleUrls: ['./vehicles.component.css']
})
export class ThirdPartyVehiclesComponent implements OnInit, OnDestroy {

  @ViewChild("vehiclesTable") vehiclesTable: any;

  tableColumns: ColumnSelector[] = [];
  private tableName = 'table_vehicles_for_third_party';

  reportingProfiles: EntityThirdParty[];
  locations: DomicileLocation[];
  filters: FilterVehiclesThirdParty = {
    reportingProfileId: "",
    domicileLocationId: "",
    remoteId: "",
    status: Status.ACTIVE
  };
  statuses: string[] = [Status.ACTIVE, Status.DELETED];

  private vehicleSearchTerm$ = new Subject();

  tableLength: number;
  orderColumns = ["remoteId", null, "status", null, null, "dataProcessedThrough"];
  valueColumns = [
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        var remoteId = full.remoteId || "(unspecified)";
        var id = full.id;
        return `<a href="#/third-party/vehicles/${id}/view">${remoteId}</a>`;
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        var reportingName = full.reportingProfile && full.reportingProfile.name;
        var reportingId = full.reportingProfile && full.reportingProfile.id;
        return reportingId ? `<a href="#/third-party/companies/${reportingId}/view">${reportingName}</a>` : "N/A";
      }
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        var status = full.status;
        var deletedAt = full.deletedAt;
        if (!deletedAt || status !== "(deleted)") {
          return status;
        }
        var tooltip = "Deleted at " + this.dateService.transformDateTime(deletedAt);
        return `<span title="${tooltip}">${status}</span>`;
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return (full.domicileLocation && full.domicileLocation.name) || "";
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (!!full.lastPosition) {
          return this.dateService.transformDateTime(full.lastPosition.datetime);
        }
        return '';
      }.bind(this)
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.dateService.transformDateTime(full.dataProcessedThrough);
      }.bind(this)
    }
  ];

  options: any;
  defineOptions() {
    this.options = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
        this.restService.getAllVehiclesForThirdParty(params, this.tableLength, this.filters)
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
      columns: this.valueColumns,
      rowCallback: function (row, data) {
        if (data.dataError) {
          $(row).addClass('danger');
        } else if (data.status === Status.DELETED) {
          $(row).addClass('info');
        }
      }
    };
  }

  vehicles: Vehicle[] = [];
  vehiclesLoaded: boolean = false;

  /**
   * Constructor to instantiate an instance of ThirdPartyVehiclesComponent.
   */
  constructor(
    private store: Store<any>,
    private restService: RestService,
    private dataTableService: DataTableService,
    private dateService: DateService,
    private lsService: LocalStorageService) {
    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.clearFilters();
      this.loadFiltersData();
      this.defineOptions();
    });

    // rxjs - searching filter by vehicle remoteId 
    this.vehicleSearchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.refreshDataTable();
    })
  }

  @ViewChild("profileSelect2") profileSelect2: any;
  @ViewChild("locationSelect2") locationSelect2: any;
  clearFilters() {
    this.filters = {
      reportingProfileId: "",
      domicileLocationId: "",
      remoteId: "",
      status: Status.ACTIVE
    }

    // Workaround for select2 selected value
    if (this.profileSelect2 && this.profileSelect2.nativeElement) {
      $(this.profileSelect2.nativeElement).val("").trigger('change');
    }
    if (this.locationSelect2 && this.locationSelect2.nativeElement) {
      $(this.locationSelect2.nativeElement).val("").trigger('change');
    }
  }
  loadFiltersData() {
    forkJoin(
      this.restService.get1000EntitiesForThirdParty(),
      this.restService.get1000LocationsForThirdParty(),
    ).subscribe(([reportingProfiles, locations]) => {
      this.reportingProfiles = reportingProfiles;
      this.locations = locations;
    })
  }

  onReportProfileChanged(reportingProfileId) {
    this.filters.reportingProfileId = reportingProfileId;
    this.refreshDataTable();
  }
  onStatusChanged(status) {
    this.filters.status = status;
    this.refreshDataTable();
  }
  onRemoteIdChanged(event) {
    this.vehicleSearchTerm$.next(event)
  }
  clearVehicle() {
    this.filters.remoteId = "";
    this.refreshDataTable();
  }
  onLocationsChanged(domocileLocationId) {
    this.filters.domicileLocationId = domocileLocationId;
    this.refreshDataTable();
  }

  refreshDataTable() {
    if (this.vehiclesTable) {
      this.vehiclesTable.ajaxReload();
    }
  }

  ngOnInit() {
    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });
  }

  ngOnDestroy() {
    this.vehicleSearchTerm$.complete();
  }

  private defaultColumnNames = ['Vehicle', 'Company', 'Status', 'Domicile', 'Last Communication', 'Data Through'];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

}
