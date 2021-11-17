import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { select, Store } from "@ngrx/store";
import { combineLatest } from "rxjs";

import { RestService, Device } from '@app/core/services/rest.service';
import { getConfigDeviceTypes } from "@app/core/store/config";
import { AuthState } from '@app/core/store/auth';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { ReplaceUnderscorePipe } from '@app/shared/pipes/utils.pipe';
import _filter from 'lodash/filter';

@Component({
  selector: 'app-driver-devices',
  templateUrl: './driver-devices.component.html',
  styleUrls: ['./driver-devices.component.css']
})
export class DriverDevicesComponent implements OnInit {

  driverId: string;
  deviceTypes: string[];
  devices: Device[];

  @ViewChild("theDevicesTable") devicesTable: any;

  tableLength: number = 10;
  orderColumns = ["iccid", "type", "imei", "lastCommunication", null];
  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        return `<a href="#/devices/${full.id}/view">${full.iccid}</a>`;
      }
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        let deviceType = full.type;
        return !!deviceType ? this.replaceUnderscore.transform(deviceType) : "";
      }.bind(this)
    },
    { data: "imei" },
    {
      data: null,
      render: function (data, type, full, meta) {
        return !full.lastCommunication ? "" : this.dateService.transformDateTime(full.lastCommunication);
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (full.forceToVehicle && full.forceToVehicle.id) {
          var remoteId = full.forceToVehicle.remoteId || "(unspecified)";
          var id = full.forceToVehicle.id;
          return `<a href="#/vehicles/${id}/view">${remoteId}</a>`;
        }
        return "";
      }
    },
  ];

  options: any;
  defineOptions() {
    this.options = {
      columnsManagementMinified: true,
      noToolbar: true,
      processing: true,
      serverSide: false,
      pageLength: this.tableLength,
      data: [],
      columns: this.valueColumns
    };
  }

  filters = {
    iccid: "",
    deviceType: "",
    imei: ""
  }

  /**
   * Constructor to instantiate an instance of DriverDevicesComponent.
   */
  constructor(
    private restService: RestService,
    private replaceUnderscore: ReplaceUnderscorePipe,
    private store: Store<AuthState>,
    private dateService: DateService,
    private route: ActivatedRoute) {
    this.driverId = this.route.snapshot.parent.paramMap.get('id');
  }

  ngOnInit() {
    this.defineOptions();
    this.loadData();
  }

  loadData() {
    combineLatest(
      this.store.pipe(select(getConfigDeviceTypes)),
      this.restService.get1000DevicesForDriver(this.driverId)
    ).subscribe(data => {
      this.deviceTypes = data[0];
      this.devices = data[1];
      this.doFilter();
    })
  }

  onDeviceTypeChanged(deviceType) {
    this.filters.deviceType = deviceType;
    this.doFilter();
  }

  clearIccid() {
    this.filters.iccid = "";
    this.doFilter();
  }

  clearImei() {
    this.filters.imei = "";
    this.doFilter();
  }

  doFilter() {
    let filtered = [...this.devices];
    if (this.filters.iccid) { //filter data based on iccid
      filtered = _filter(filtered, (device: Device) => {
        return device.iccid.toLowerCase().includes(this.filters.iccid.toLowerCase());
      })
    }

    if (this.filters.deviceType) { //filter data based on device type
      filtered = _filter(filtered, (device: Device) => {
        return device.type === this.filters.deviceType;
      })
    }

    if (this.filters.imei) { //search data based on imei
      filtered = _filter(filtered, (device: Device) => {
        return !!device.imei && device.imei.toLowerCase().includes(this.filters.imei.toLowerCase());
      })
    }

    this.devicesTable.dataReload(filtered);
  }

}
