import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';

import {
  RestService, LocalStorageService, FilterParams, DataTableService, DriverOption
} from '@app/core/services';
import { AuthState, getTableLength } from '@app/core/store/auth';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
  selector: 'app-utilization',
  templateUrl: './utilization.component.html',
  styleUrls: ['./utilization.component.css']
})
export class UtilizationComponent implements OnInit {

  @ViewChild('vehicleUtilizationTable') vehicleUtilizationTable: any;

  vehicleId: string;
  tableLength: number;
  drivers: DriverOption[];
  selectedDriverId: string;

  orderColumns = [null, 'startedAt', "endedAt"];
  valueColumns = [
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let theDriver = this.drivers.find(function (next: DriverOption) {
          return next.driver_id === full.driverId;
        });

        var remoteId = theDriver.remote_id || "(unspecified)";
        var name = theDriver.name();
        var id = full.driverId;
        return `<a href="#/drivers/${id}/view">${name} (${remoteId})</a>`;
      }.bind(this)
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.dateService.transformDateTime(full.startedAt);
      }.bind(this)
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.dateService.transformDateTime(full.endedAt);
      }.bind(this)
    },
  ];

  vehicleUtilizationOption: any;
  defineOptions() {
    this.vehicleUtilizationOption = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
        combineLatest(
          this.restService.getUtilizationDriverOptionsFor(this.vehicleId),
          this.restService.getAllVehicleUtilizations(params, this.vehicleId, this.selectedDriverId, this.tableLength)
        ).subscribe(data => {
          this.drivers = data[0];
          callback({
            aaData: data[1] ? data[1].results : [],
            recordsTotal: data[1] ? data[1].resultCount : 0,
            recordsFiltered: data[1] ? data[1].resultCount : 0
          })
        });
      },
      columns: this.valueColumns,
      order: [[1, 'desc']],
    };
  }

  constructor(
    private restService: RestService,
    private store: Store<AuthState>,
    private lsService: LocalStorageService,
    private dataTableService: DataTableService,
    private route: ActivatedRoute,
    private dateService: DateService) { }

  ngOnInit() {
    this.selectedDriverId = '';
    this.vehicleId = this.route.snapshot.parent.paramMap.get('id');

    let loggedInAs = this.lsService.getLoginAs();
    this.store.pipe(select(getTableLength)).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.defineOptions();
    });
  }

  refreshData() {
    if (this.vehicleUtilizationTable) {
      this.vehicleUtilizationTable.ajaxReload();
    }
  }

  clearQuery() {
    if (this.selectedDriverId) {
      this.selectedDriverId = '';
      this.refreshData();
    }
  }

}
