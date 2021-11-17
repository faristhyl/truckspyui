import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import {
  DataTableService, ReportingProfile, FilterParams, FilterVehiclesThirdParty, RestService, Status, DomicileLocation
} from '@app/core/services';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-thirdparty-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css']
})
export class ThirdPartyCompanyComponent implements OnInit, OnDestroy {

  companyId: string;
  company: ReportingProfile = new ReportingProfile();
  @ViewChild("vehiclesTable") vehiclesTable: any;

  /**
   * Constructor to instantiate an instance of ThirdPartyCompanyComponent.
   */
  constructor(
    private dataTableService: DataTableService,
    private dateService: DateService,
    private route: ActivatedRoute,
    private restService: RestService) { }

  ngOnInit() {
    this.companyId = this.route.snapshot.paramMap.get("id");
    this.getCompanyInfo();

    this.filters.reportingProfileId = this.companyId;
    this.clearFilters();
    this.loadFiltersData();
    this.defineOptions();

    // rxjs - searching filter by vehicle remoteId 
    this.vehicleSearchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.refreshDataTable();
    })
  }

  ngOnDestroy() {
    this.vehicleSearchTerm$.complete();
  }

  getCompanyInfo() {
    this.restService.getEntityForThirdParty(this.companyId)
      .subscribe(result => {
        this.company = result
      });
  }

  /**
   * Vehicles table logic.
   */
  locations: DomicileLocation[];
  filters: FilterVehiclesThirdParty = {
    reportingProfileId: "",
    domicileLocationId: "",
    remoteId: "",
    status: Status.ACTIVE
  };
  statuses: string[] = [Status.ACTIVE, Status.DELETED];
  private vehicleSearchTerm$ = new Subject();

  @ViewChild("locationSelect2") locationSelect2: any;
  clearFilters() {
    this.filters = {
      reportingProfileId: "",
      domicileLocationId: "",
      remoteId: "",
      status: Status.ACTIVE
    }

    // Workaround for select2 selected value
    if (this.locationSelect2 && this.locationSelect2.nativeElement) {
      $(this.locationSelect2.nativeElement).val("").trigger('change');
    }
  }
  loadFiltersData() {
    this.restService.get1000LocationsForThirdParty()
      .subscribe(locations => {
        this.locations = locations;
      })
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

  orderColumns = ["remoteId", "status", null, null, "dataProcessedThrough"];
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
  tableLength: number;

  defineOptions() {
    this.options = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
        this.filters.reportingProfileId = this.companyId;
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

}
