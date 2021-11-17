import { Component, Input, OnChanges, Output, EventEmitter, TemplateRef, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import {
    RestService, VehicleType, Customer, FeedbackType, StopType, DomicileLocation, DateUtil
} from '@app/core/services/rest.service';
import { AddressUtil } from '@app/features/shared/address-input.component';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
    selector: 'app-create-booking',
    templateUrl: './create-booking.component.html'
})
export class CreateBokingComponent implements OnChanges {

    inProgress: boolean;
    @Input() linkName: string;
    @Output() callback: EventEmitter<any> = new EventEmitter();

    constructor(
        private restService: RestService,
        private dateService: DateService,
        private modalService: BsModalService,
        private addressUtil: AddressUtil) {
    }

    ngOnChanges() { }

    /**
     * Add Booking modal reference to operate with within component.
     * @type {BsModalRef}
     */
    _addBookingModal: BsModalRef;
    @Input() customers: Customer[];
    @Input() types: VehicleType[];
    @Input() feedbackTypes: FeedbackType[];
    @Input() locations: DomicileLocation[] = [];
    stopTypes = [
        StopType.PICKUP, StopType.DROP, StopType.DROP_DOCK, StopType.PICKUP_DOCK, StopType.TRAILER_POSITION, StopType.TRACTOR_POSITION
    ];
    bookingData: any = {};

    addBooking(template: TemplateRef<any>) {
        this.UNIQUE_ID = 1;
        this.bookingData = {
            customerId: (!!this.customers && this.customers.length > 0 && this.customers[0].id) || "",
            typeId: "",
            stops: []
        }

        // Required to add 2 stops
        this.addStop();
        this.addStop();

        this._addBookingModal = this.modalService.show(template, { class: "modal-lg" });
    }

    /**
     * Unique ID holder to utilize within view for name/id fields (avoiding view mixed up for input values).
     */
    UNIQUE_ID: number;
    addStop() {
        let stops = this.bookingData.stops;
        let nextStop = {
            id: this.UNIQUE_ID++,
            // appointmentFrom: this.dateService.getCurrentTime(),
            // appointmentTo: this.dateService.getCurrentTimePlusMinute(),
            appPeriod: [this.dateService.getCurrentTime(), this.dateService.getCurrentTimePlusMinute()],
            type: this.stopTypes[0],
            address: this.addressUtil.defaultAddress(),
            phone: "",
            fax: "",
            isLocation: false,
            locationId: !!this.locations && this.locations.length > 0 && this.locations[0].id,
            name: "",
            loadNo: "",
            bolNo: "",
            deliveryNo: "",
            dimensions: "",
            cargoValue: null,
            plannedServiceTime: null,
            containsHazardousMaterials: false,
            plannedArrival: this.dateService.getCurrentTimePlusMinute(),
            temperature: null,
            description: "",
            requiredFeedbackTypes: []
        }
        stops.push(nextStop);
    }
    deleteStop(index: number) {
        this.bookingData.stops.splice(index, 1);
    }

    createBooking(): void {
        let dateService = this.dateService;
        let body = {
            "customer": {
                "id": this.bookingData.customerId
            },
            "vehicleType": !this.bookingData.typeId ? null : {
                "id": this.bookingData.typeId
            },
            "stops": this.bookingData.stops.map((stop: any, index: number) => (
                {
                    "stopOrder": index + 1,
                    "arriveDate": dateService.transform4Backend(stop.appPeriod[0]), // TODO: remove arriveDate as soon as it will not be required
                    "appointmentFrom": dateService.transform4Backend(stop.appPeriod[0]),
                    "appointmentTo": dateService.transform4Backend(stop.appPeriod[1]),
                    "type": stop.type,
                    "requiredFeedbackTypes": stop.requiredFeedbackTypes.map((feedbackId: string) => (
                        {
                            "id": feedbackId
                        }
                    )),
                    "phone": stop.phone,
                    "fax": stop.fax,
                    "location": stop.isLocation ? { "id": stop.locationId } : null,
                    "name": stop.isLocation ? null : stop.name,
                    "loadNo": stop.loadNo,
                    "bolNo": stop.bolNo,
                    "deliveryNo": stop.deliveryNo,
                    "dimensions": stop.dimensions,
                    "cargoValue": stop.cargoValue,
                    "plannedServiceTime": stop.plannedServiceTime,
                    "containsHazardousMaterials": stop.containsHazardousMaterials,
                    "plannedArrival": dateService.transform4Backend(stop.plannedArrival),
                    "temperature": stop.temperature,
                    "description": stop.description,
                    "address": stop.isLocation ? null : {
                        "line1": stop.address.line1,
                        "line2": stop.address.line2,
                        "city": stop.address.city,
                        "state": stop.address.state,
                        "country": stop.address.country,
                        "zip": stop.address.zip
                    }
                }
            ))
        };

        this.restService.createBooking(body)
            .subscribe(
                data => {
                    // console.log(data);
                    this._addBookingModal.hide();
                    this.callback.emit([]);
                }
            );
    }
    closeBookingModal(): void {
        this._addBookingModal.hide();
    }

}
