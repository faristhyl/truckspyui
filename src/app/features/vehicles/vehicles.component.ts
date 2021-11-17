import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Actions } from "@ngrx/effects";
import { Store } from '@ngrx/store';
import { forkJoin, Subject } from 'rxjs';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { LngLat, Map } from 'mapbox-gl';
import {
  RestService, DataTableService, ReportingProfile, FilterParams, EntityType, Vehicle, Company, LocalStorageService, Status,
  ColumnSelector, ColumnSelectorUtil, FilterVehicles, Connection, DomicileLocation, DispatchGroup
} from '@app/core/services/rest.service';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { HTMLGeneratorService } from '@app/shared/pipes/utils.pipe';
import { MinifyMenu } from '@app/core/store/layout';
import { mapConfig } from '@app/core/smartadmin.config';
import { getConfigCompany } from '@app/core/store/config';
import { LoggedInAs, LoggedOutAs, getTableLength } from '@app/core/store/auth';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-vehicles',
  templateUrl: './vehicles.component.html',
  styleUrls: ['./vehicles.component.css']
})
export class VehiclesComponent implements OnInit, OnDestroy {

  tableColumns: ColumnSelector[] = [];
  private tableName = 'table_vehicles';

  infoHeader: string;
  datetimeHeader: string;

  reportingProfiles: ReportingProfile[];
  connections: Connection[];
  locations: DomicileLocation[];
  dispatchGroups: DispatchGroup[];
  dispatchGroupsLoaded: boolean = false;
  categories: string[];
  filters: FilterVehicles = {
    reportingProfileId: "",
    connectionId: "",
    domicileLocationId: "",
    dispatchGroupId: "",
    remoteId: "",
    category: ""
  };

  private vehicleSearchTerm$ = new Subject();

  /**
   * We want dynamic headers to be set up on DataTable loaded (within callback).
   * Initial set up should be also done within #ngOnInit();
   *
   * @memberof VehiclesComponent
   */
  setupHeaders() {
    this.infoHeader = this.dataError ? "Error&nbsp;Message" : "Last&nbsp;Location";
    this.datetimeHeader = this.dataError ? "Error Datetime" : "Last&nbsp;Location Datetime";
  }

  /**
   * Status filtering logic.
   */
  status: string = Status.ACTIVE;
  dataError: boolean = false;
  isActiveTab() {
    return this.status === Status.ACTIVE;
  }
  showActive() {
    this.status = Status.ACTIVE;
    this.clearFilters();
    this.dataError = false;
    this.vehiclesTable.ajaxReload();
  }
  showDeleted() {
    this.status = Status.DELETED;
    this.clearFilters();
    this.dataError = false;
    this.vehiclesTable.ajaxReload();
  }
  showDataError() {
    this.clearFilters();
    this.dataError = true;
    this.vehiclesTable.ajaxReload();
  }

  tableLength: number;
  orderColumns = ["remoteId", null, "status", "category", null, null, null, null];
  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        var remoteId = full.remoteId || "(unspecified)";
        var id = full.id;
        return `<a href="#/vehicles/${id}/view">${remoteId}</a>`;
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        var reportingName = full.reportingProfile && full.reportingProfile.name;
        var reportingId = full.reportingProfile && full.reportingProfile.id;
        return reportingId ? `<a href="#/reporting/${reportingId}/view">${reportingName}</a>` : "N/A";
      }
    },
    {
      data: null,
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
      data: 'category',
      orderable: true,
    },
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
        return (!!full.domicileLocation && !!full.domicileLocation.id)
          ? `<a href="#/location/list/${full.domicileLocation.id}/view">${full.domicileLocation.name || "(unspecified)"}</a>`
          : "";
      }
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
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (this.dataError) {
          return (full.lastOperation && full.lastOperation.errorMessage) || "";
        }

        let noPosition: boolean = !full.lastPosition || !full.lastPosition.id;
        if (noPosition) {
          return "";
        }
        return full.lastPosition.place;
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (this.dataError) {
          return this.dateService.transformDateTime(full.dataErrorAt);
        }

        let noPosition: boolean = !full.lastPosition || !full.lastPosition.id;
        if (noPosition) {
          return "";
        }
        let datetime = full.lastPosition.datetime;
        return this.dateService.transformDateTime(datetime);
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return full.reportingProfile.activeSubscriptionsOf(EntityType.VEHICLE)
          .map((next) => this.htmlGenerator.productBadge(next.productType))
          .join(" ");
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
        this.restService.getAllVehicles(params, this.status, this.dataError, this.tableLength, this.filters)
          .subscribe(
            data => {
              this.setupHeaders();
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
        }
      }
    };
  }

  tabsState: string = "table";
  /**
   * Bounds definition for the map to fit.
   */
  fitBounds: number[][] = [];
  fitBoundsOptions = {
    padding: { top: 25, bottom: 25, left: 25, right: 25 }
  }
  vehicles: Vehicle[] = [];
  vehiclesLoaded: boolean = false;

  theMapInstance: Map;
  onLoad(mapInstance: Map) {
    this.theMapInstance = mapInstance;
  }
  onMinifyMenu = this.actions$.subscribe(action => {
    if (action instanceof MinifyMenu) {
      this.theMapInstance.resize();
    }
  });

  calculateBounds(activeVehicles: Vehicle[]): number[][] {
    if (!activeVehicles || activeVehicles.length === 0) {
      // USA (without Alaska) bounds
      return [[-124.848974, 24.396308], [-66.885444, 49.384358]];
    }
    if (activeVehicles.length === 1) {
      let vehicle = activeVehicles[0];
      return [
        [vehicle.lastPosition.longitude - 0.25, vehicle.lastPosition.latitude - 0.25],
        [vehicle.lastPosition.longitude + 0.25, vehicle.lastPosition.latitude + 0.25]
      ];
    }
    let minLng = 181;
    let maxLng = -181;
    let minLat = 91;
    let maxLat = -91;
    activeVehicles.forEach(function (next) {
      if (minLng > next.lastPosition.longitude) {
        minLng = next.lastPosition.longitude;
      }
      if (maxLng < next.lastPosition.longitude) {
        maxLng = next.lastPosition.longitude;
      }
      if (minLat > next.lastPosition.latitude) {
        minLat = next.lastPosition.latitude;
      }
      if (maxLat < next.lastPosition.latitude) {
        maxLat = next.lastPosition.latitude;
      }
    });
    return [[minLng, minLat], [maxLng, maxLat]];
  }

  selectedLngLat: LngLat;
  currentVehicle: Vehicle;

  displayVehicle(vehicle: Vehicle) {
    // Workaround: remove popup binded with #vehicleMarker
    $(".mapboxgl-map").find(".mapboxgl-popup").remove();

    let lngLat = new LngLat(vehicle.lastPosition.longitude, vehicle.lastPosition.latitude);
    // Display modal
    this.selectedLngLat = lngLat;
    this.currentVehicle = vehicle;

    // fly to exact location
    this.theMapInstance.flyTo({
      center: lngLat
    });
  }

  buttonEntered(vehicle: Vehicle) {
    var scrollPosition = $('#scrollableDiv').scrollTop() + $(`#divScrollTo-${vehicle.id}`).position().top;
    $('#scrollableDiv').animate({
      scrollTop: scrollPosition
    }, 200, 'swing', $(`#divScrollTo-${vehicle.id}`).toggleClass("hovered"));
  }

  buttonLeaved(vehicle: Vehicle) {
    $(`#divScrollTo-${vehicle.id}`).toggleClass("hovered");
  }

  /**
   * Map styling logic.
   */
  style: string = mapConfig.STREETS;
  isDefault: boolean = true;
  toggleStyle() {
    this.style = this.isDefault ? mapConfig.SATELLITE : mapConfig.STREETS;
    this.isDefault = !this.isDefault;
  }

  /**
   * Constructor to instantiate an instance of VehiclesComponent.
   */
  constructor(
    private store: Store<any>,
    private actions$: Actions,
    private restService: RestService,
    private dataTableService: DataTableService,
    private modalService: BsModalService,
    private htmlGenerator: HTMLGeneratorService,
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
  @ViewChild("connectionSelect2") connectionSelect2: any;
  @ViewChild("locationSelect2") locationSelect2: any;
  clearFilters() {
    this.filters = {
      reportingProfileId: "",
      connectionId: "",
      domicileLocationId: "",
      remoteId: "",
      dispatchGroupId: this.filters.dispatchGroupId,
      category: ""
    }

    // Workaround for select2 selected value
    if (this.profileSelect2 && this.profileSelect2.nativeElement) {
      $(this.profileSelect2.nativeElement).val("").trigger('change');
    }
    if (this.connectionSelect2 && this.connectionSelect2.nativeElement) {
      $(this.connectionSelect2.nativeElement).val("").trigger('change');
    }
    if (this.locationSelect2 && this.locationSelect2.nativeElement) {
      $(this.locationSelect2.nativeElement).val("").trigger('change');
    }
  }
  loadFiltersData() {
    forkJoin(
      this.restService.get1000ReportingProfiles(),
      this.restService.get1000Connections(),
      this.restService.get2000LocationsLight(),
      this.restService.getAllVehicleCategories()
    ).subscribe(([reportingProfiles, connections, locations, categories]) => {
      this.reportingProfiles = reportingProfiles;
      this.connections = connections;
      this.locations = locations;
      this.categories = categories;
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

  onRemoteIdChanged(event) {
    this.vehicleSearchTerm$.next(event)
  }

  onConnectionsChanged(connectionId) {
    this.filters.connectionId = connectionId;
    this.refreshDataTable();
  }

  onCategoryChanged(category) {
    this.filters.category = category;
    this.refreshDataTable();
  }

  onLocationsChanged(domocileLocationId) {
    this.filters.domicileLocationId = domocileLocationId;
    this.refreshDataTable();
  }

  onGroupChange(groupId): void {
    this.filters.dispatchGroupId = groupId;
    this.refreshDataTable();
    this.loadMapVehicles();
  }

  refreshDataTable() {
    if (this.vehiclesTable) {
      this.vehiclesTable.ajaxReload();
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
    this.setupHeaders();
    this.store.select(getConfigCompany).subscribe((company: Company) => {
      this.company = company;
    });
    this.loginAsCompany = this.lsService.getCompany();

    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });

    this.loadMapVehicles();
  }

  ngOnDestroy() {
    this.vehicleSearchTerm$.complete();
  }

  loadMapVehicles() {
    this.restService.get1000ActiveVehicles(this.filters.dispatchGroupId)
      .subscribe(result => {
        this.vehicles = result.filter(
          vehicle => vehicle.hasLastPosition());
        this.fitBounds = this.calculateBounds(this.vehicles);
        this.vehiclesLoaded = true;
      });
  }

  /**
   * Add Vehicle modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addVehicleModal: BsModalRef;
  vehicleData = {
    remoteId: "",
    autoFix: true,
    category: "",
    year: "",
    make: "",
    model: "",
    vin: "",
    secondaryVin: ""
  };

  company: Company;
  loginAsCompany: Company;
  @ViewChild("vehiclesTable") vehiclesTable: any;

  addVehicle(template: TemplateRef<any>) {
    this.vehicleData = {
      remoteId: "",
      autoFix: true,
      category: (this.categories && this.categories.length >= 1 && this.categories[0]) || "",
      year: "",
      make: "",
      model: "",
      vin: "",
      secondaryVin: ""
    };

    this._addVehicleModal = this.modalService.show(template, { class: "modal-450" });
  }

  doCreate(): void {
    this.restService.createVehicle(this.vehicleData)
      .subscribe(
        data => {
          this._addVehicleModal.hide();
          this.vehiclesTable.ajaxReload();
        }
      );
  }
  closeAddVehicleModal(): void {
    this._addVehicleModal.hide();
  }

  private defaultColumnNames = ['Vehicle', 'Reporting Profile', 'Status', 'Category', 'Connection', 'Domicile', 'Driver',
    function () {
      return this.dataError ? "Error Message" : "Last Location";
    }.bind(this),
    function () {
      return this.dataError ? "Error Datetime" : "Last Location Datetime";
    }.bind(this),
    'Products'
  ];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

  clearVehicle() {
    this.filters.remoteId = "";
    this.refreshDataTable();
  }

}
