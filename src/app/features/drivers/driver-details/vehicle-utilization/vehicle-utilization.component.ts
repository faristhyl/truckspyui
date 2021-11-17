import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';

import {
  RestService, LocalStorageService, FilterParams, DataTableService, VehicleOption
} from '@app/core/services';
import { AuthState, getTableLength } from '@app/core/store/auth';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
  selector: 'app-vehicle-utilization',
  templateUrl: './vehicle-utilization.component.html',
  styleUrls: ['./vehicle-utilization.component.css']
})
export class VehicleUtilizationComponent implements OnInit {

  @ViewChild('vehicleUtilizationTable') vehicleUtilizationTable: any;

  driverId: string;
  tableLength: number;
  vehicles: VehicleOption[];
  selectedVehicleId: string;

  orderColumns = [null, 'startedAt', "endedAt"];
  valueColumns = [
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let theVehicle = this.vehicles.find(function (next: VehicleOption) {
          return next.vehicle_id === full.vehicleId;
        });

        var remoteId = (theVehicle && theVehicle.remote_id) || "(unspecified)";
        var id = full.vehicleId;
        return `<a href="#/vehicles/${id}/view">${remoteId}</a>`;
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
          this.restService.getUtilizationVehicleOptionsFor(this.driverId),
          this.restService.getAllVehicleUtilizationsForDriver(params, this.driverId, this.selectedVehicleId, this.tableLength)
        ).subscribe(data => {
          this.vehicles = data[0];
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
    this.selectedVehicleId = '';
    this.driverId = this.route.snapshot.parent.paramMap.get('id');

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
    if (this.selectedVehicleId) {
      this.selectedVehicleId = '';
      this.refreshData();
    }
  }

}
