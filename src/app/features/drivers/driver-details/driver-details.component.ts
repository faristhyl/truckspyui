import { Component, OnInit, TemplateRef } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

import { Driver, RestService, Vehicle } from '@app/core/services';

@Component({
  selector: 'app-driver-details',
  templateUrl: './driver-details.component.html',
  styleUrls: ['./driver-details.component.css']
})
export class DriverDetailsComponent implements OnInit {

  childPath: string;
  folders = ['view', 'logs', 'safety-alerts', 'vehicle-utilization', 'events'];
  driverId: string;
  driver: Driver;
  isLoaded: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private restService: RestService,
    private modalService: BsModalService) {
    this.driver = new Driver();
    this.isLoaded = false;
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
    this.driverId = this.route.snapshot.paramMap.get("id");
    this.restService.getDriver(this.driverId)
      .subscribe(result => {
        this.driver = result;
        this.isLoaded = true;
      });

    this.restService.get1000ActiveVehiclesLight()
      .subscribe(result => {
        this.vehicles = result;
        this.vehiclesLoaded = true;
      });
  }

  /**
   * Assign Vehicle modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _assignVehicleModal: BsModalRef;
  assignVehicleData = {
    vehicleId: ""
  };
  vehicles: Vehicle[];
  vehiclesLoaded: boolean;

  assignVehicle(template: TemplateRef<any>) {
    this.assignVehicleData = {
      vehicleId: this.vehicles && this.vehicles.length > 0 && this.vehicles[0].id || ""
    };
    this._assignVehicleModal = this.modalService.show(template, { class: "modal-400" });
  }

  /**
   * Workaround for the SmartAdmin select2 wrappers.
   */
   vehicleChanged(value) {
    this.assignVehicleData.vehicleId = value;
  }

  doAssignVehicle(): void {
    this.restService.assignDriverToVehicle(this.driverId, this.assignVehicleData.vehicleId)
      .subscribe(
        good => {
          this.restService.getDriver(this.driverId)
            .subscribe(result => {
              this.driver = result;
              this._assignVehicleModal.hide();
            });
        }
      );
  }
  closeAssignVehicleModal(): void {
    this._assignVehicleModal.hide();
  }

}
