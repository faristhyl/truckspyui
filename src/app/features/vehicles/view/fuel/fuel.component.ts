import { Component } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { RestService, FilterParams, DataTableService, FuelStatistics, LocalStorageService } from '@app/core/services';
import { getTableLength, AuthState } from '@app/core/store/auth';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
  selector: 'app-vehicle-fuel',
  templateUrl: './fuel.component.html',
  styleUrls: ['./fuel.component.css']
})
export class VehicleFuelComponent {

  vehicleId: string;
  statistics: FuelStatistics;

  tableLength: number;

  /**
   * Ordering field names for DataTable columns.
   */
  orderColumns = ["posDate", null, null, null];
  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        return this.dateService.transformDateTime(full.posDate);
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (!full.locationName) {
          return `${full.locationState}`;
        } else {
          return !!full.locationState ? `${full.locationName}, ${full.locationState}` : `${full.locationName}`;
        }
      }
    },
    { data: "quantity", orderable: false, defaultContent: "" },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let quantity = full.quantity;
        let pricePer = full.pricePer;
        if (quantity == null || pricePer == null) {
          return "";
        }
        return this.currencyPipe.transform(quantity * pricePer);
      }.bind(this)
    },
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
        this.restService.getAllVehicleFuelTransactions(this.vehicleId, params, this.tableLength)
          .subscribe(
            data => {
              callback({
                aaData: data.results,
                recordsTotal: data.resultCount,
                recordsFiltered: data.resultCount
              })
            },
          );
      },
      columns: this.valueColumns,
      order: [[0, 'desc']]
    };
  }

  /**
   * Constructor to instantiate an instance of VehicleFuelComponent.
   */
  constructor(
    private route: ActivatedRoute,
    private restService: RestService,
    private currencyPipe: CurrencyPipe,
    private dataTableService: DataTableService,
    private dateService: DateService,
    private store: Store<AuthState>,
    private lsService: LocalStorageService) {
    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;

      this.defineOptions();
      this.loadData();
    });
  }

  loadData() {
    this.vehicleId = this.route.snapshot.parent.paramMap.get('id');
    this.restService.getFuelStatistics(this.vehicleId)
      .subscribe(statistics => {
        this.statistics = statistics;
      });
  }

}
