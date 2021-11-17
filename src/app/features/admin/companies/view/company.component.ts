import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Company, RestService, Source } from '@app/core/services';

@Component({
  selector: 'app-admin-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css']
})
export class AdminCompanyComponent implements OnInit {

  companyId: string;
  company: Company = new Company();
  source: Source;

  pricingSchemes: string[];
  isUpdatePricingSchemeOn: boolean;
  selectedPricingScheme: string;

  selectedBilledDate: number;
  isUpdateBilledOn: boolean;

  /**
   * Constructor to instantiate an instance of AdminCompanyComponent.
   */
  constructor(
    private route: ActivatedRoute,
    private restService: RestService) { }

  ngOnInit() {
    this.companyId = this.route.snapshot.paramMap.get("id");
    this.getCompanyInfo();

    this.restService.getAllPricingScheme()
      .subscribe(result => {
        this.pricingSchemes = result;
      })
  }

  getCompanyInfo() {
    this.restService.getCompanyBy(this.companyId)
      .subscribe(result => {
        this.company = result;
        this.source = this.company.getDefaultSource();
      });
  }

  toggleDevicesEnable() {
    const observable = this.company.devicesEnabled
      ? this.restService.devicesDisable(this.company.id)
      : this.restService.devicesEnable(this.company.id);
    observable.subscribe((success) => {
      this.getCompanyInfo();
    });
  }

  toggleCreditAllow() {
    this.restService.doCreditAllow(this.company.id)
      .subscribe((result) => {
        this.company = result;
        this.source = this.company.getDefaultSource();
      });
  }

  beginEditBilledOn() {
    this.isUpdateBilledOn = true;
    this.selectedBilledDate = this.company.billedOn;
  }
  onUpdateBilledOn() {
    if (this.selectedBilledDate) {
      this.restService.updateCompanyBilledOn(this.company.id, this.selectedBilledDate)
        .subscribe(result => {
          if (result) {
            this.getCompanyInfo();
            this.cancelEditBilledOn();
          }
        })
    }
  }
  cancelEditBilledOn() {
    this.isUpdateBilledOn = false;
    this.selectedBilledDate = null;
  }

  /**
   * Edit pricing scheme related logic
   */
  beginEditPricingSchemeOn() {
    this.isUpdatePricingSchemeOn = true;
    this.selectedPricingScheme = this.company.pricingScheme;
  }
  onUpdatePricingSchemeOn() {
    if (this.selectedPricingScheme) {
      this.restService.updatePricingScheme(this.company.id, this.selectedPricingScheme)
        .subscribe(result => {
          if (result) {
            this.getCompanyInfo();
            this.cancelEditPricingSchemeOn();
          }
        })
    }
  }
  cancelEditPricingSchemeOn() {
    this.isUpdatePricingSchemeOn = false;
    this.selectedPricingScheme = null;
  }

  toggleCameraOnly() {
    this.restService.toggleCameraOnly(this.company.id)
      .subscribe(updated => {
        this.getCompanyInfo();
      });
  }

}
