import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { COUNTRIES } from '@app/core/smartadmin.config';
import {
  Booking, RestService, Customer, VehicleType, FeedbackType, DomicileLocation, StopType, Stop
} from '@app/core/services/rest.service';
import { DateService, TimezoneHandlerPipe } from '@app/shared/pipes/timezone-handler.pipe';
import { AddressUtil } from '@app/features/shared/address-input.component';

@Component({
  selector: 'app-booking-view',
  templateUrl: './booking-view.component.html',
  styleUrls: ['./booking-view.component.css']
})
export class BookingViewComponent implements OnInit {

  @ViewChild("appReportsTable") appReportsTable: any;

  bookingId: string;
  booking: Booking = new Booking();
  loaded: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private restService: RestService,
    private modalService: BsModalService,
    private addressUtil: AddressUtil,
    private timezoneHandler: TimezoneHandlerPipe,
    private dateService: DateService) { }

  ngOnInit() {
    this.bookingId = this.route.snapshot.paramMap.get("id");
    this.restService.getBooking(this.bookingId)
      .subscribe(result => {
        this.booking = result;
        // console.log(this.booking);
        this.loaded = true;

        this.restService.get1000FeedbackTypes()
          .subscribe(result => {
            this.feedbackTypes = result;

            this.restService.get1000Customers()
              .subscribe(result => {
                this.customers = result;
                this.customersLoaded = true;
              });
            this.restService.get1000VehicleTypes()
              .subscribe(result => {
                this.types = result;
                this.typesLoaded = true;
              });
            this.restService.get2000LocationsLight()
              .subscribe(result => {
                this.locations = result;
                this.locationsLoaded = true;
              });
          });
      });
  }

  /**
   * Edit Booking modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _editBookingModal: BsModalRef;
  customers: Customer[];
  customersLoaded: boolean = false;
  types: VehicleType[];
  typesLoaded: boolean = false;
  feedbackTypes: FeedbackType[];
  locations: DomicileLocation[] = [];
  locationsLoaded: boolean = false;
  stopTypes = [
    StopType.PICKUP, StopType.DROP, StopType.DROP_DOCK, StopType.PICKUP_DOCK, StopType.TRAILER_POSITION, StopType.TRACTOR_POSITION
  ];
  bookingData: any = {};

  editBooking(template: TemplateRef<any>) {
    let addressUtil = this.addressUtil;
    let timezoneHandler = this.timezoneHandler;
    let locations = this.locations;

    this.bookingData = {
      customerId: this.booking.customer.id,
      typeId: this.booking.vehicleType && this.booking.vehicleType.id || "",
      stops: this.booking.stops.map((stop: Stop, index: number) => (
        {
          id: stop.id,
          stopOrder: index + 1,
          // appointmentFrom: timezoneHandler.transform(stop.appointmentFrom),
          // appointmentTo: timezoneHandler.transform(stop.appointmentTo),
          appPeriod: [timezoneHandler.transform(stop.appointmentFrom), timezoneHandler.transform(stop.appointmentTo)],
          type: stop.type,
          phone: stop.phone,
          fax: stop.fax,
          name: stop.name,
          loadNo: stop.loadNo,
          bolNo: stop.bolNo,
          deliveryNo: stop.deliveryNo,
          dimensions: stop.dimensions,
          cargoValue: stop.cargoValue,
          plannedServiceTime: stop.plannedServiceTime,
          containsHazardousMaterials: stop.containsHazardousMaterials,
          plannedArrival: timezoneHandler.transform(stop.plannedArrival),
          temperature: stop.temperature,
          description: stop.description,
          requiredFeedbackTypes: stop.requiredFeedbackTypes.map((feedback: FeedbackType) => feedback.id),
          isLocation: stop.isLocation(),
          locationId: stop.isLocation()
            ? stop.location.id
            : !!locations && locations.length > 0 && locations[0].id,
          address: stop.isLocation() ? addressUtil.defaultAddress() : {
            line1: stop.address.line1,
            line2: stop.address.line2,
            city: stop.address.city,
            state: stop.address.state,
            country: stop.address.country || COUNTRIES[0].key,
            zip: stop.address.zip
          }
        }
      ))
    };

    this._editBookingModal = this.modalService.show(template, { class: "modal-lg" });
  }
  deleteStop(index: number) {
    this.bookingData.stops.splice(index, 1);
  }

  doUpdate(): void {
    let dateService = this.dateService;

    let data = {
      "customer": {
        "id": this.bookingData.customerId
      },
      "vehicleType": !this.bookingData.typeId ? null : {
        "id": this.bookingData.typeId
      },
      "stops": this.bookingData.stops.map((stop: any, index: number) => (
        {
          "id": stop.id,
          // "stopOrder" will be handled on the server side, manual change will cause 500
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
          "location": stop.isLocation ? { "id": stop.locationId } : null,
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
    }
    this.restService.updateBooking(this.booking.id, data)
      .subscribe(
        data => {
          this._editBookingModal.hide();
          this.booking = data;
        }
      );
  }
  closeEditBookingModal(): void {
    this._editBookingModal.hide();
  }

  /**
   * Add Stop modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addStopModal: BsModalRef;
  stopData: any = {};

  addStop(template: TemplateRef<any>) {
    this.stopData = {
      stopOrder: this.booking.stops.length + 1,
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

    this._addStopModal = this.modalService.show(template, { class: "modal-lg" });
  }

  createStop(): void {
    let body = {
      "stopOrder": this.stopData.stopOrder,
      "arriveDate": this.dateService.transform4Backend(this.stopData.appPeriod[0]), // TODO: remove arriveDate as soon as it will not be required
      "appointmentFrom": this.dateService.transform4Backend(this.stopData.appPeriod[0]),
      "appointmentTo": this.dateService.transform4Backend(this.stopData.appPeriod[1]),
      "type": this.stopData.type,
      "requiredFeedbackTypes": this.stopData.requiredFeedbackTypes.map((feedbackId: string) => (
        {
          "id": feedbackId
        }
      )),
      "phone": this.stopData.phone,
      "fax": this.stopData.fax,
      "location": this.stopData.isLocation ? { "id": this.stopData.locationId } : null,
      "name": this.stopData.isLocation ? null : this.stopData.name,
      "loadNo": this.stopData.loadNo,
      "bolNo": this.stopData.bolNo,
      "deliveryNo": this.stopData.deliveryNo,
      "dimensions": this.stopData.dimensions,
      "cargoValue": this.stopData.cargoValue,
      "plannedServiceTime": this.stopData.plannedServiceTime,
      "containsHazardousMaterials": this.stopData.containsHazardousMaterials,
      "plannedArrival": this.dateService.transform4Backend(this.stopData.plannedArrival),
      "temperature": this.stopData.temperature,
      "description": this.stopData.description,
      "address": this.stopData.isLocation ? null : {
        "line1": this.stopData.address.line1,
        "line2": this.stopData.address.line2,
        "city": this.stopData.address.city,
        "state": this.stopData.address.state,
        "country": this.stopData.address.country,
        "zip": this.stopData.address.zip
      }
    };

    this.restService.createStop(this.bookingId, body)
      .subscribe(
        data => {
          this.restService.getBooking(this.bookingId)
            .subscribe(result => {
              this.booking = result;
              this._addStopModal.hide();
            });
        }
      );
  }
  closeStopModal(): void {
    this._addStopModal.hide();
  }

}
