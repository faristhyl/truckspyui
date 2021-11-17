import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import {
  RestService, DataTableService, FilterParams, LocalStorageService, ColumnSelector, ColumnSelectorUtil, Vehicle, Driver
} from '@app/core/services/rest.service';
import { FilterLinehaulTrips } from '@app/core/services/rest.model';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { getTableLength } from '@app/core/store/auth';

@Component({
  selector: 'app-linehaul-trips',
  templateUrl: './linehaul-trips.component.html',
  styleUrls: ['./linehaul-trips.component.css']
})
export class LinehaulTripsComponent implements OnInit {

  @ViewChild("linehaulTripsTable") linehaulTripsTable: any;
  tableColumns: ColumnSelector[] = [];
  private tableName = 'table_linehaul_trips';

  dateTimeRange: any;

  tableLength: number;
  orderColumns = ["tripNum", "entityId", "date", "vehicleRemoteId", "firstDriverRemoteId", null, null, "milesQty", "totalRate", "flatRate", "dropAndHook", null];
  valueColumns = [
    {
      data: 'tripNum',
      orderable: true
    },
    {
      data: 'entityId',
      orderable: true
    },
    {
      data: 'date',
      orderable: true,
      render: function (data, type, full, meta) {
        return this.dateService.transform2OdometerDate(full.date)
      }.bind(this)
    },
    {
      data: 'vehicleRemoteId',
      orderable: true,
      render: function (data, type, full, meta) {
        const vehicle = full.vehicle;
        if (!vehicle) {
          return '';
        }
        var remoteId = vehicle.remoteId || "(unspecified)";
        var id = vehicle.id;
        return `<a href="#/vehicles/${id}/view">${remoteId}</a>`;
      }
    },
    {
      data: 'firstDriverRemoteId',
      orderable: true,
      render: function (data, type, full, meta) {
        let content = ``;
        if (full.firstDriver) {
          content += `<a href="#/drivers/${full.firstDriver.id}/view">${full.firstDriverRemoteId}: ${full.firstDriver.firstName + ' ' + full.firstDriver.lastName}</a><br/>`;
        }
        if (full.secondDriver) {
          content += `<a href="#/drivers/${full.secondDriver.id}/view">${full.secondDriverReportId}: ${full.secondDriver.name()}</a><br/>`;
        }
        return content;
      }
    },
    {
      data: 'legOrigin',
      orderable: false,
      render: function (data, type, full, meta) {
        if (full.originLocation) {
          return `<a href="#/location/list/${full.originLocation.id}/view">${full.legOrigin}</a>`;
        }
        return `${full.legOrigin}`;
      }
    },
    {
      data: 'legDestination',
      orderable: false,
      render: function (data, type, full, meta) {
        if (full.destinationLocation) {
          return `<a href="#/location/list/${full.destinationLocation.id}/view">${full.legDestination}</a>`;
        }
        return `${full.legDestination}`;
      }
    },
    {
      data: "milesQty",
      orderable: true
    },
    {
      data: "totalRate",
      orderable: true,
      render: function (data, type, full, meta) {
        return this.currencyPipe.transform(+full.totalRate, 'USD', 'symbol', '1.2-4');
      }.bind(this)
    },
    {
      data: "flatRate",
      orderable: true,
      render: function (data, type, full, meta) {
        return this.currencyPipe.transform(+full.flatRate);
      }.bind(this)
    },
    {
      data: "dropAndHook",
      orderable: true,
      render: function (data, type, full, meta) {
        return this.currencyPipe.transform(+full.dropAndHook);
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let amount = +full.amountRate + +full.flatRate + +full.dropAndHook;
        return this.currencyPipe.transform(amount);
      }.bind(this)
    },
  ];

  entities: string[] = [];
  vehicles: Vehicle[] = [];
  drivers: Driver[] = [];
  filters: FilterLinehaulTrips = {
    entityId: '',
    vehicleRemoteId: '',
    driverRemoteId: '',
    beginDate: null,
    endDate: null
  }

  options: any;
  defineOptions() {
    this.options = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
        this.restService.getAllLinehaulTrips(params, this.tableLength, this.filters)
          .subscribe(data => {
            callback({
              aaData: data.results,
              recordsTotal: data.resultCount,
              recordsFiltered: data.resultCount
            })
          });
      },
      columns: this.valueColumns
    };
  }

  constructor(
    private store: Store<any>,
    private restService: RestService,
    private dataTableService: DataTableService,
    private dateService: DateService,
    private currencyPipe: CurrencyPipe,
    private lsService: LocalStorageService) {
    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.defineOptions();
    });

    this.restService.getAllLinehaulTrips({ page: 1, sort: '' }, 1000)
      .pipe(map(res => res.results))
      .subscribe(linehaulTrips => {
        const uniqueEntities = [];
        linehaulTrips.map(linehaulTrip => linehaulTrip.entityId)
          .forEach(entityId => {
            if (!uniqueEntities.includes(entityId)) {
              uniqueEntities.push(entityId);
            }
          })
        this.entities = uniqueEntities;
      });

    this.restService.get1000VehiclesLight().subscribe(result => {
      this.vehicles = result;
    });
    this.restService.get1000DriversLight().subscribe(result => {
      this.drivers = result;
    });
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

  refreshLinehaulTripsTable() {
    this.linehaulTripsTable.ajaxReload();
  }

  private defaultColumnNames = ['Trip Number', 'Entity Id', 'Date', 'Vehicle', 'Drivers', 'Origin', 'Destination', 'Miles Qty', 'Total Rate', 'Flat Rate', 'D&H', 'Total Amount'];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

  onEntityChanged($event) {
    this.filters.entityId = $event;
    this.refreshLinehaulTripsTable();
  }

  onVehicleChanged($event) {
    this.filters.vehicleRemoteId = $event;
    this.refreshLinehaulTripsTable();
  }

  onDriverChanged($event) {
    this.filters.driverRemoteId = $event;
    this.refreshLinehaulTripsTable();
  }

  onDateRangeChange($event) {
    this.filters.beginDate = this.dateService.transform2OdometerDate($event.value[0]);
    this.filters.endDate = this.dateService.transform2OdometerDate($event.value[1]);
    this.refreshLinehaulTripsTable();
  }

}
