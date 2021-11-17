import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';

import { RestService, Vehicle, LocalStorageService, Company } from '@app/core/services'
import { AuthState } from '@app/core/store/auth';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { getConfigCompany } from '@app/core/store/config';

@Component({
  selector: 'app-thirdparty-vehicle-view',
  templateUrl: './vehicle-view.component.html',
  styleUrls: ['./vehicle-view.component.css']
})
export class ThirdPartyVehicleViewComponent implements OnInit {

  vehicleId: string;
  vehicle: Vehicle = new Vehicle();
  loaded: boolean = false;

  company: Company;
  loginAsCompany: Company;
  theCompany() {
    return !!this.loginAsCompany ? this.loginAsCompany : this.company;
  };

  @ViewChild("appReportsTable") appReportsTable: any;
  refreshReports() {
    this.appReportsTable.reloadReports();
  }

  /**
   * Constructor to instantiate an instance of ThirdPartyVehicleViewComponent.
   */
  constructor(
    private route: ActivatedRoute,
    private restService: RestService,
    private store: Store<AuthState>,
    private lsService: LocalStorageService,
    private dateService: DateService) { }

  ngOnInit() {
    this.store.select(getConfigCompany).subscribe((company: Company) => {
      this.company = company;
    });
    this.loginAsCompany = this.lsService.getCompany();

    this.vehicleId = this.route.snapshot.paramMap.get('id');
    this.restService.getVehicleForThirdParty(this.vehicleId)
      .subscribe(result => {
        this.vehicle = result;
        this.loaded = true;
      });
  }

}
