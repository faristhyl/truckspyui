import { Component, Input, TemplateRef } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { RestService, Vehicle } from '@app/core/services/rest.service';

@Component({
    selector: 'app-vehicle-map-modal',
    templateUrl: './vehicle-map-modal.component.html'
})
export class VehicleMapModalComponent {

    @Input() vehicle: Vehicle; // We assume this might be light version of vehicle with only `id` and `remoteId`
    @Input() highlight: string;
    theVehicle: Vehicle;

    constructor(
        private restService: RestService,
        private modalService: BsModalService) { }

    /**
     * Vehicle map modal reference to operate with within component.
     * @type {BsModalRef}
     */
    _vehicleMapModal: BsModalRef;
    showVehicleMapModal(template: TemplateRef<any>) {
        this.restService.getVehicle(this.vehicle.id)
            .subscribe(result => {
                this.theVehicle = result;
                this._vehicleMapModal = this.modalService.show(template, { class: "modal-lg" });
            });
    }
    closeVehicleMapModal(): void {
        this._vehicleMapModal.hide();
    }

}
