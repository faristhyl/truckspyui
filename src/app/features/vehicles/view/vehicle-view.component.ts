import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { Actions } from "@ngrx/effects";
import { Store } from '@ngrx/store';

import { RestService, Vehicle, LocalStorageService, Company, EngineSnapshot } from '@app/core/services'
import { LoggedInAs, AuthState, LoggedOutAs } from '@app/core/store/auth';
import { getConfigCompany } from '@app/core/store/config';

@Component({
  selector: 'app-vehicle-view',
  templateUrl: './vehicle-view.component.html',
  styleUrls: ['./vehicle-view.component.css']
})
export class VehicleViewComponent implements OnInit {

  childPath: string;
  folders = ['view', 'alerts', 'maintenance', 'inspections', 'events', 'fuel', 'utilization'];

  vehicleId: string;
  vehicle: Vehicle = new Vehicle();
  isLoaded: boolean = false;

  engineSnapshot: EngineSnapshot = null;
  engineLoaded: boolean = false;

  company: Company;
  loginAsCompany: Company;
  theCompany() {
    return !!this.loginAsCompany ? this.loginAsCompany : this.company;
  }

  onLoggedInAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedInAs) {
      this.loginAsCompany = this.lsService.getCompany();
    }
  });
  onLoggedOutAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedOutAs) {
      this.loginAsCompany = null;
    }
  });

  /**
   * Constructor to instantiate an instance of VehicleViewComponent.
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private restService: RestService,
    private actions$: Actions,
    private store: Store<AuthState>,
    private lsService: LocalStorageService) {
    this.router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        let path = this.route.firstChild.routeConfig.path;
        if (this.folders.includes(path)) {
          this.childPath = path;
        }
      }
    });
  }

  ngOnInit() {
    this.vehicleId = this.route.snapshot.paramMap.get("id");

    this.loginAsCompany = this.lsService.getCompany();
    this.store.select(getConfigCompany).subscribe((company: Company) => {
      this.company = company;

      // We want to fetch EngineSnapshot only when `devicesEnabled==true`
      if (this.theCompany() && this.theCompany().devicesEnabled) {
        this.restService.getEngineSnapshotFor(this.vehicleId)
          .subscribe(result => {
            this.engineSnapshot = result;
            this.engineLoaded = true;
          });
      }
    });

    this.restService.getVehicle(this.vehicleId)
      .subscribe(result => {
        this.vehicle = result;
        this.isLoaded = true;
      });
  }

  getProgressStyles(value: number): any {
    const percentage = (!!value && value >= 0) ? value : 0;
    let color = 'indianred';
    if (percentage > 15) {
      color = 'orange';
    }
    if (percentage > 50) {
      color = 'forestgreen';
    }

    return {
      "width": Math.round(percentage) + '%',
      "background-color": color
    }
  }

}
