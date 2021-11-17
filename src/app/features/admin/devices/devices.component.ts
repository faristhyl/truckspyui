import { Component, OnInit, ViewChild, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import _filter from 'lodash/filter';

import {
  LocalStorageService, DataTableService, RestService, GlobalFunctionsService, User, Company, Device, ColumnSelector,
  ColumnSelectorUtil, LoginAsService
} from '@app/core/services';
import { ConfigState, getConfigDeviceTypes } from '@app/core/store/config';
import { plainToClass } from 'class-transformer';
import { ReplaceUnderscorePipe } from '@app/shared/pipes/utils.pipe';
import { getTableLength } from '@app/core/store/auth';

@Component({
  selector: 'app-admin-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.css']
})
export class AdminDevicesComponent implements OnInit, OnDestroy {

  @ViewChild("devicesTable") devicesTable: any;

  tableLength: number;
  tableColumns: ColumnSelector[] = [];
  tableName = 'table_admin_devices';
  optionsDevices: any;
  tSearch: string;

  private defaultColumnNames = ['Device ID', 'Serial Number', "Device Type", "IMEI", "Company Name", "Last Vehicle"];

  orderColumns = ["iccid", "serialNumber", "type", "imei", null, null];
  valueColumns = [
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return `<a href="#/admin/devices/${full.id}/view">${full.iccid}</a>`;
      },
    },
    {
      data: 'serialNumber',
      orderable: true,
      render: function (data, type, full, meta) {
        return full.serialNumber || "";
      },
    },
    {
      data: null,
      orderable: true,
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
    {
      data: 'imei',
      orderable: true,
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        const company = full.company;
        var name = company.name || "(unspecified)";
        var id = company.id;
        return `<a href="#/admin/companies/${id}/view">${name}</a>`;
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let result = "";
        if (full.lastVehicle) {
          if (full.reportingProfile && full.lastVehicle.id &&
            full.reportingProfile.company && full.reportingProfile.company.users.length > 0) {
            var companyEncoded = this.gfService.encodeParam(full.reportingProfile.company);
            var userEncoded = this.gfService.encodeParam(full.reportingProfile.company.users[0]);
            var vehicleIdEncoded = this.gfService.encodeParam(full.lastVehicle.id);
            var remoteId = full.lastVehicle.remoteId || "(unspecified)";
            result = `<a onclick='truckspy.loginAs("${userEncoded}", "${companyEncoded}","${vehicleIdEncoded}")'>${remoteId}</a>`;
          }
        }
        return result;
      }.bind(this),
    },
  ];

  defineOptions() {
    this.optionsDevices = {
      noToolbar: true,
      processing: true,
      serverSide: false,
      pageLength: this.tableLength,
      data: [],
      columns: this.valueColumns,
      order: [[0, 'asc']],
    }
  };

  filters = {
    companyName: "",
    deviceType: "",
    operationalStatus: "",
    iccid: "",
    serialNumber: "",
    imei: ""
  };

  companies: Company[];
  devices: Device[];
  deviceTypes: string[];
  operationalStatuses: string[];

  constructor(
    private router: Router,
    private loginAsService: LoginAsService,
    private restService: RestService,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService,
    private dataTableService: DataTableService,
    private store: Store<ConfigState>,
    private lsService: LocalStorageService,
    private replaceUnderscore: ReplaceUnderscorePipe,
  ) { }

  ngOnInit() {
    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });

    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.defineOptions();
    });

    this.loadAllData();
    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.loginAs = this.loginAs.bind(this);
  }

  ngOnDestroy() {
    window.truckspy.loginAs = null;
  }

  loadAllData() {
    combineLatest(
      this.restService.get1000Companies(),
      this.store.select(getConfigDeviceTypes),
      this.restService.get1000AdminDevices(),
      this.restService.getDeviceValidOperationalStatuses()
    ).subscribe(data => {
      this.companies = data[0];
      this.deviceTypes = data[1];
      this.devices = data[2];
      this.operationalStatuses = data[3];
      this.doFilter();
    });
  }

  onIccidChanged() {
    this.doFilter();
  }

  onImeiChanged() {
    this.doFilter();
  }

  onCompanyChanged(companyName) {
    this.filters.companyName = companyName;
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

    if (this.filters.companyName) { //filter data based on company name
      filtered = _filter(filtered, (device: Device) => {
        return !!device.company && device.company.name === this.filters.companyName;
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

    this.devicesTable.dataReload(filtered);
  }

  /**
   * Login as functionality.
   */
  loginAs(userEncoded: string, companyEncoded: string, idEncoded: string) {
    this.ngZone.run(() => {
      var user = this.gfService.decodeParam(userEncoded);
      var company = this.gfService.decodeParam(companyEncoded);
      var id = this.gfService.decodeParam(idEncoded);
      this.loginAsPrivate(user, company, id);
    });
  }

  loginAsPrivate(user: any, company: any, id: string) {
    let companyObject: Company = plainToClass(Company, company as Company);
    let userObject: User = plainToClass(User, user as User);
    this.loginAsService.loginAsUser2URI(companyObject.id, userObject, `/vehicles/${id}/view`);
  }

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

}
