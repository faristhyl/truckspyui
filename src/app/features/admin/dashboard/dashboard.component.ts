import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { ConfigState, getConfigDeviceTypes } from '@app/core/store/config';
import { RestService, Company } from '@app/core/services';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  deviceData = {
    iccid: "",
    imei: "",
    serialNumber: "",
    type: null,
    company: null
  }
  deviceEnabledCompanies: Company[] = [];
  qrCode: string = null;
  deviceTypes: string[] = [];

  createDevice() {
    this.qrCode = null;

    let data = {
      iccid: this.deviceData.iccid,
      imei: this.deviceData.imei,
      serialNumber: this.deviceData.serialNumber,
      type: this.deviceData.type,
      company: {
        id: this.deviceData.company.id,
        pricingScheme: this.deviceData.company.pricingScheme
      }
    };

    this.restService.addDevice(data)
      .subscribe(
        device => {
          this.qrCode = device.qrCode;
        },
      );
  }

  constructor(
    private store: Store<ConfigState>,
    private restService: RestService) {
    this.store.select(getConfigDeviceTypes).subscribe((deviceTypes: string[]) => {
      this.deviceTypes = deviceTypes;
      this.deviceData.type = (this.deviceTypes && this.deviceTypes.length >= 1 && this.deviceTypes[0]) || null;
    });
  }

  ngOnInit() {
    this.restService.get1000Companies()
      .subscribe(
        companies => {
          this.deviceEnabledCompanies = companies.filter(
            company => company.devicesEnabled);
          this.deviceData.company = (this.deviceEnabledCompanies && this.deviceEnabledCompanies.length >= 1 && this.deviceEnabledCompanies[0]) || null;
        },
      );
  }

}
