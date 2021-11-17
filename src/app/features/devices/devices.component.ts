import { Component, OnInit, ViewChild } from '@angular/core';
import { select, Store } from "@ngrx/store";
import { combineLatest } from "rxjs";

import {
  RestService, DataTableService, LocalStorageService, ColumnSelector, ColumnSelectorUtil, FilterDevices, Device, Vehicle,
  DeviceStatus
} from '@app/core/services/rest.service';
import { getTableLength, AuthState } from '@app/core/store/auth';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { ReplaceUnderscorePipe } from '@app/shared/pipes/utils.pipe';
import { getConfigDeviceTypes } from "@app/core/store/config";
import _filter from 'lodash/filter';

@Component({
  selector: 'app-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.css']
})
export class DevicesComponent implements OnInit {

  @ViewChild("devicesTable") devicesTable: any;
  tableColumns: ColumnSelector[] = [];
  tableName = 'table_devices';
  
  tableLength: number;
  orderColumns = ["iccid", "serialNumber", "status", "type", "imei", null, null, "softwareVersion", null];
  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        return `<a href="#/devices/${full.id}/view">${full.iccid}</a>`;
      }
    },
    { data: 'serialNumber' },
    { data: "status" },
    {
      data: null,
      render: function (data, type, full, meta) {
        let deviceType = full.type;
        return !!deviceType ? this.replaceUnderscore.transform(deviceType) : "";
      }.bind(this)
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        let operationalStatus = full.operationalStatus;
        return !!operationalStatus ? this.replaceUnderscore.transform(operationalStatus) : "";
      }.bind(this)
    },
    { data: "imei" },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (full.reportingProfile && full.reportingProfile.id) {
          return `<a href="#/reporting/${full.reportingProfile.id}/view">${full.reportingProfile.name}</a>`;
        }
        return "";
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (full.lastVehicle && full.lastVehicle.id) {
          var remoteId = full.lastVehicle.remoteId || "(unspecified)";
          var id = full.lastVehicle.id;
          return `<a href="#/vehicles/${id}/view">${remoteId}</a>`;
        }
        return "";
      }
    },
    { data: "softwareVersion" },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return this.dateService.transformDateTime(full.lastCommunication);
      }.bind(this)
    },
  ];

  options: any;
  defineOptions() {
    this.options = {
      noToolbar: true,
      processing: true,
      serverSide: false,
      pageLength: this.tableLength,
      data: [],
      columns: this.valueColumns
    };
  }

  statuses: string[] = [DeviceStatus.ACTIVE, DeviceStatus.DEACTIVATED];
  deviceTypes: string[];
  devices: Device[];
  vehicles: Vehicle[];
  operationalStatuses: string[];

  filters: FilterDevices = {
    status: "",
    deviceType: "",
    operationalStatus: "",
    selectedVehicle: "",
    iccid: "",
    serialNumber: "",
    imei: "",
    softwareVersion: ""
  }

  downloadExcelReport() {
    this.restService.downloadDevicesExcelReport();
  }

  /**
   * Constructor to instantiate an instance of DevicesComponent.
   */
  constructor(
    private restService: RestService,
    private dataTableService: DataTableService,
    private replaceUnderscore: ReplaceUnderscorePipe,
    private store: Store<AuthState>,
    private dateService: DateService,
    private lsService: LocalStorageService) {
    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.loadData();
      this.defineOptions();
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

  loadData() {
    combineLatest(
      this.store.pipe(select(getConfigDeviceTypes)),
      this.restService.get1000Devices(),
      this.restService.get1000VehiclesLight(),
      this.restService.getDeviceValidOperationalStatuses()
      ).subscribe(data => {
      this.deviceTypes = data[0];
      this.devices = data[1];
      this.vehicles = data[2];
      this.operationalStatuses = data[3];
      this.doFilter();
    })
  }

  onStatusChanged(status) {
    this.filters.status = status;
    this.doFilter();
  }

  onDeviceTypeChanged(deviceType) {
    this.filters.deviceType = deviceType;
    this.doFilter();
  }

  onOperationalStatusChanged(operationalStatus) {
    this.filters.operationalStatus = operationalStatus;
    this.doFilter();
  }

  onVehicleChanged($event) {
    this.filters.selectedVehicle = $event;
    this.doFilter();
  }

  clearIccid() {
    this.filters.iccid = "";
    this.doFilter();
  }

  clearSerialNumber() {
    this.filters.serialNumber = "";
    this.doFilter();
  }

  clearImei() {
    this.filters.imei = "";
    this.doFilter();
  }

  clearSoftwareVersion() {
    this.filters.softwareVersion = "";
    this.doFilter();
  }

  doFilter() {
    let filtered = [...this.devices];
    if (this.filters.iccid) { //filter data based on iccid
      filtered = _filter(filtered, (device: Device) => {
        return device.iccid.toLowerCase().includes(this.filters.iccid.toLowerCase());
      })
    }

    if (this.filters.serialNumber) { //filter data based on serialNumber
      filtered = _filter(filtered, (device: Device) => {
        return !!device.serialNumber && device.serialNumber.toLowerCase().includes(this.filters.serialNumber.toLowerCase());
      })
    }

    if (this.filters.imei) { //search data based on imei
      filtered = _filter(filtered, (device: Device) => {
        return !!device.imei && device.imei.toLowerCase().includes(this.filters.imei.toLowerCase());
      })
    }

    if (this.filters.status) { //filter data based on status
      filtered = _filter(filtered, (device: Device) => {
        return device.status === this.filters.status;
      })
    }

    if (this.filters.deviceType) { //filter data based on device type
      filtered = _filter(filtered, (device: Device) => {
        return device.type === this.filters.deviceType;
      })
    }

    if (this.filters.operationalStatus) { //filter data based on operationalStatus
      filtered = _filter(filtered, (device: Device) => {
        return device.operationalStatus === this.filters.operationalStatus;
      })
    }

    if (this.filters.selectedVehicle) { //filter data based on vehicle id
      filtered = _filter(filtered, (device: Device) => {
        return device.lastVehicle ? device.lastVehicle.id === this.filters.selectedVehicle : false;
      })
    }

    if (this.filters.softwareVersion) { //filter data based on software version
      filtered = _filter(filtered, (device: Device) => {
        return !!device.softwareVersion && device.softwareVersion.toLowerCase().includes(this.filters.softwareVersion.toLowerCase());
      })
    }

    this.devicesTable.dataReload(filtered);
  }

  private defaultColumnNames = [
    'Device ID', 'Serial Number', 'Status', 'Device Type', 'Op Status', 'IMEI', 'Reporting Profile', 'Last Vehicle', 'Software Version', 'Last Communication'];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

}
