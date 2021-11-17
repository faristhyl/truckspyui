import { Component, OnInit, ViewChild, OnDestroy, ElementRef, HostListener, TemplateRef } from '@angular/core';
import { combineLatest, Subscription, interval, of } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { ModalDirective, BsModalRef, BsModalService } from 'ngx-bootstrap';

import {
  RestService, Vehicle, Driver, TripsHandler, TripStatus, BookingStatus, Booking, TripsHandlerItem,
  ResourceType, Customer, VehicleType, FeedbackType, DomicileLocation, Trip, StopType, Stop,
  TripResourcesHandler, Connection, ColumnSelector, ColumnSelectorUtil, LocalStorageService,
  Resource, Reportable
} from '@app/core/services/rest.service';
import { COUNTRIES } from '@app/core/smartadmin.config';
import { StorageService } from '@app/core/services/storage.service';
import { AddressUtil } from '@app/features/shared/address-input.component';
import { DateService, TimezoneHandlerPipe } from '@app/shared/pipes/timezone-handler.pipe';
import { AuthState, getTableLength } from '@app/core/store/auth';

const DISPATCH_GROUP_ID = 'dispatch_group_id';
const HIDE_BOOKINGS = 'hide_bookings';
const FIVE_MINUTE_MILLIS: number = 5 * 60 * 1000;

/**
 * Logic/behavior in terms of refreshing tables:
 * 1) Delete Trip (+Booking AND +Trip)
 *    ===> Refresh Bookings (left collapse/page unchanged) AND Refresh Trips (left collapse/page unchanged)
 * 2) Create Trip (-Booking AND +Trip)
 *    ===> Refresh Bookings (left collapse/page unchanged) AND Refresh Trips (left collapse/page unchanged)
 * 3) Switch V-tab Trips
 *    ===> Refresh Trips (reset collapse/page)
 * 4) Switch H-tab Trips
 *    ===> Refresh Trips (reset collapse/page)
 * 
 * 5) Create Booking (+Booking.Available)
 *    ===> Refresh Bookings (left collapse/page unchanged)
 * 6) Switch V-tab Booking
 *    ===> Refresh Bookings (reset collapse/page)
 */
@Component({
  selector: 'app-dispatch',
  templateUrl: './dispatch.component.html',
  styleUrls: ['./dispatch.component.scss']
})
export class DispatchComponent implements OnInit, OnDestroy {

  @ViewChild('columnSelectorContextTrips', { read: ElementRef }) columnSelectorContextTrips: ElementRef;
  @ViewChild('columnSelectorContextBookings', { read: ElementRef }) columnSelectorContextBookings: ElementRef;
  showColumnSelectorTrips = false;
  showColumnSelectorBookings = false;
  columnSelectorTripsMenuLeft: number;
  columnSelectorTripsMenuTop: number;
  columnSelectorBookingsMenuLeft: number;
  columnSelectorBookingsMenuTop: number;

  tableLength: number;
  tableNameTrips = 'table_dispatch_trips';
  tableNameBookings = 'table_dispatch_bookings';
  tableTripsColumns: ColumnSelector[] = [];
  tableTripsColumnsClone: ColumnSelector[] = [];
  tableBookingsColumns: ColumnSelector[] = [];
  tableBookingsColumnsClone: ColumnSelector[] = [];

  availableBookings: Booking[] = [];

  /**
   * Add Trip modal reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("addTripModal") _addTripModal: ModalDirective;
  stopTypes = [
    StopType.PICKUP, StopType.DROP, StopType.DROP_DOCK, StopType.PICKUP_DOCK, StopType.TRAILER_POSITION, StopType.TRACTOR_POSITION
  ];
  stopTypesEnum = StopType;

  resourceTypes = [ResourceType.VEHICLE, ResourceType.DRIVER];
  tripData: {
    booking: Booking;
    bookingId: string;
    bookingStops: Stop[];
    stopsBegin: any,
    stops: any[];
    resources: any[],
    fixedResourcesCount: number;
    vehicleType: VehicleType;
  };
  applicableVehicles: Vehicle[] = [];

  /**
   * Workaround for the SmartAdmin select2 wrapper.
   */
  resourceChanged(resource, value) {
    resource.entityId = value;
  }

  onTypeChange(resource, value): void {
    let collection = (value === ResourceType.VEHICLE) ? this.applicableVehicles : this.activeDrivers;
    resource.entityId = !!collection && collection.length > 0 && collection[0].id || "";
    resource.entity = !!collection && collection.length > 0 && collection[0] || null;
  }

  onBookingDrop(item: TripsHandlerItem, event: any) {
    let booking: Booking = event.dragData;
    let vehicleType = booking.vehicleType;
    this.applicableVehicles = (!!vehicleType && !!vehicleType.id)
      ? this.vehicles.filter(vehicle => !!vehicle.vehicleType && vehicle.vehicleType.id === vehicleType.id)
      : this.vehicles;

    let resources: any[] = new TripResourcesHandler(item).getInitResource(this.applicableVehicles, this.activeDrivers);
    this.UNIQUE_RESOURCE_ID = 1;
    this.tripData = {
      booking: booking,
      bookingId: booking.id,
      bookingStops: booking.stops,
      stopsBegin: Math.max(...booking.stops.map(stop => (stop.stopOrder))),
      stops: [],
      resources: resources.map((next: any) => ({
        ...next,
        id: this.UNIQUE_RESOURCE_ID++,
      })),
      fixedResourcesCount: resources.length,
      vehicleType: vehicleType
    }
    this.UNIQUE_ID = 1;
    this._addTripModal.show();
  }

  isValidForm(addTripForm) {
    // See details here: https://stackoverflow.com/questions/51466641
    return addTripForm.form.valid || addTripForm.form.status === "DISABLED";
  }

  doCreateTrip() {
    let dateService = this.dateService;
    let body = {
      "bookingIds": [
        this.tripData.bookingId
      ],
      "dispatchOrder": 1,
      "resources": this.tripData.resources.map((resource: any, index: number) => (
        {
          "entityType": resource.entityType,
          "entityId": resource.entityId,
        }
      )),
      "stops": this.tripData.stops.map((stop: any, index: number) => (
        {
          "stopOrder": this.tripData.stopsBegin + index + 1,
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

    // console.log(body);
    this.restService.createTrip(body)
      .subscribe(
        data => {
          this._addTripModal.hide();
          this.reloadBookings(false);
          this.reloadTrips(false);
        }
      );
  }

  /**
   * Unique ID holder to utilize within view for name/id fields (avoiding view mixed up for input values).
   */
  UNIQUE_ID: number;
  addStop() {
    let stops = this.tripData.stops;
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
    this.tripData.stops.splice(index, 1);
  }

  UNIQUE_RESOURCE_ID: number;
  addResource() {
    let resources = this.tripData.resources;
    let nextResource = {
      id: this.UNIQUE_RESOURCE_ID++,
      entityId: !!this.applicableVehicles && this.applicableVehicles.length > 0 && this.applicableVehicles[0].id,
      entityType: ResourceType.VEHICLE,
      editable: true,
      removable: true,
      entity: !!this.applicableVehicles && this.applicableVehicles.length > 0 && this.applicableVehicles[0]
    }
    resources.push(nextResource);
  }
  deleteResource(index: number) {
    this.tripData.resources.splice(index, 1);
  }

  closeTripModal() {
    this._addTripModal.hide();
  }

  /**
   * Edit Trip modal reference to operate with within component.
   * @type {BsModalRef}
   */
  @ViewChild("editTripModal") _editTripModal: ModalDirective;
  editTripData: any = {};

  /**
   * Moving `theStop` right before `beforeStop` equals to:
   * 1. Remove `theStop`
   * 2. Put the stop right before `beforeStop`
   */
  onStopReorder(beforeStop, $event) {
    let theStop = $event.dragData.stop;
    if (theStop.id !== beforeStop.id) {
      // 1. Remove `theStop`
      this.editTripData.stops = this.editTripData.stops.filter(
        next => next.id !== theStop.id);
      // 2. Put the stop right before `beforeStop`
      const beforeIndex = this.editTripData.stops.findIndex(
        next => next.id === beforeStop.id);
      this.editTripData.stops.splice(beforeIndex, 0, theStop);
    }
  }

  editTrip(trip: Trip) {
    let addressUtil = this.addressUtil;
    let timezoneHandler = this.timezoneHandler;
    let locations = this.locations;

    let bookingBased: boolean = trip.bookingIds && trip.bookingIds.length > 0;
    let bookingId = bookingBased ? trip.bookingIds[0] : null;
    let observable = bookingBased ? this.restService.getBooking(bookingId) : of(null);

    observable
      .subscribe(theBooking => {
        let vehicleType = theBooking && theBooking.vehicleType;
        this.applicableVehicles = (!!vehicleType && !!vehicleType.id)
          ? this.vehicles.filter(vehicle => !!vehicle.vehicleType && vehicle.vehicleType.id === vehicleType.id)
          : this.vehicles;
        let resources: Resource[] = trip.dispatches.map(dispatch => dispatch.resource);

        this.UNIQUE_RESOURCE_ID = 1;
        this.editTripData = {
          trip: trip,
          booking: theBooking,
          bookingId: theBooking && theBooking.id,
          stops: trip.stops.map((stop: Stop, index: number) => (
            {
              // Read-only ones related fields:
              stop: stop,
              reportedDepart: stop.reportedDepart,
              completedAt: stop.completedAt,

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
          )),
          beginResources: resources.map((next: Resource) => ({
            entityType: next.entityType,
            entityId: next.entityId,
          })),
          resources: resources.map((next: Resource) => ({
            entityType: next.entityType,
            entityId: next.entityId,
            id: this.UNIQUE_RESOURCE_ID++,
          })),
          fixedResourcesCount: resources.length,
          vehicleType: vehicleType
        }
        this.UNIQUE_ID = 1;
        this._editTripModal.show();
      });
  }
  addEditStop() {
    let stops = this.editTripData.stops;
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
  deleteEditStop(index: number) {
    this.editTripData.stops.splice(index, 1);
  }

  resourcesInvalid: boolean = false;
  onEditTypeChange(resource, value): void {
    let collection = (value === ResourceType.VEHICLE) ? this.applicableVehicles : this.activeDrivers;
    resource.entityId = !!collection && collection.length > 0 && collection[0].id || "";
    this.validateResources();
  }
  addEditResource() {
    let resources = this.editTripData.resources;
    let nextResource = {
      id: this.UNIQUE_RESOURCE_ID++,
      entityId: !!this.applicableVehicles && this.applicableVehicles.length > 0 && this.applicableVehicles[0].id,
      entityType: ResourceType.VEHICLE
    }
    resources.push(nextResource);
    this.validateResources();
  }
  deleteEditResource(index: number) {
    this.editTripData.resources.splice(index, 1);
    this.validateResources();
  }
  validateResources() {
    let vehicleResource = this.editTripData.resources.find(function (next) {
      return next.entityType === ResourceType.VEHICLE;
    });
    let driverResource = this.editTripData.resources.find(function (next) {
      return next.entityType === ResourceType.DRIVER;
    });
    this.resourcesInvalid = !vehicleResource || !driverResource;
  }
  isValidEditForm(editTripForm) {
    this.validateResources();
    // See details here: https://stackoverflow.com/questions/51466641
    return !this.resourcesInvalid && (editTripForm.form.valid || editTripForm.form.status === "DISABLED");
  }

  doUpdateTrip(): void {
    let end = this.editTripData.resources;
    let begin = this.editTripData.beginResources;
    // resourcesAdd = end - begin
    // resourcesRemove = begin - end

    let dispatched = this.editTripData.trip.status === this.tripStatuses.DISPATCHED;
    let preassigned = this.editTripData.trip.status === this.tripStatuses.PREASSIGNED;

    let dateService = this.dateService;
    let originalStops = this.editTripData.trip.stops.map(stop => stop.id);
    let finalStops = this.editTripData.stops.map(stop => stop.id);
    let toRemove = originalStops.filter(oNext => {
      let presented = finalStops.find(function (fNext) {
        return fNext === oNext;
      });
      return !presented;
    })

    let data = {
      // "bookingIds": [],
      "resourcesAdd": end.filter(eNext => {
        let presented = begin.find(function (bNext) {
          return eNext.entityType === bNext.entityType && eNext.entityId === bNext.entityId;
        });
        return !presented;
      }),
      "resourcesRemove": begin.filter(bNext => {
        let presented = end.find(function (eNext) {
          return eNext.entityType === bNext.entityType && eNext.entityId === bNext.entityId;
        });
        return !presented;
      }),
      "orderedStops": this.editTripData.stops.map((stop: any, index: number) => {
        let editable = preassigned || (dispatched && !stop.reportedDepart && !stop.completedAt);
        if (!editable) {
          return {
            "id": stop.id,
          }
        }

        let stopData = {
          // "stopOrder": index + 1,
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
        if (typeof(stop.id) === 'string' || stop.id instanceof String) {
          stopData["id"] = stop.id;
        }
        return stopData;
      }),
      "stopsRemove": toRemove.map(nextId => ({
        "id": nextId
      }))
    }

    this.restService.updateTrip(this.editTripData.trip.id, data)
      .subscribe(
        data => {
          this._editTripModal.hide();
          this.reloadTrips(false);
        }
      );
  }
  closeEditTripModal(): void {
    this._editTripModal.hide();
  }

  /**
   * Reorder Trips modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("reorderTripsModal") _reorderTripsModal: ModalDirective;
  reorderTrips: any = {};

  onTripReorder(entityType: string, beforeTrip: Trip, entity: Reportable, trips: Trip[], event: any) {
    let theTrip = event.dragData.trip;
    if (theTrip.id === beforeTrip.id) {
      return;
    }

    this.reorderTrips = {
      entityType: entityType,
      entityId: event.dragData.entity.id,
      entity: entity,
      trips: trips,
      trip: theTrip,
      beforeTrip: beforeTrip
    };
    this._reorderTripsModal.show();
  }

  closeReorderTripsModal() {
    this._reorderTripsModal.hide();
  }
  doReorderTrips() {
    let theTripId = this.reorderTrips.trip.id;
    let beforeTripId = this.reorderTrips.beforeTrip.id;
    let originalIds = this.reorderTrips.trips.map(trip => trip.id);

    let adjustedIds = [];
    originalIds.forEach(id => {
      if (id === theTripId) {
        // do nothing
      } else if (id === beforeTripId) {
        adjustedIds.push(theTripId);
        adjustedIds.push(beforeTripId);
      } else {
        adjustedIds.push(id);
      }
    });

    let data = {
      "trips": adjustedIds.map(id => {
        return { "id": id }
      }),
      "dispatchResource": {
        "entityType": this.reorderTrips.entityType,
        "entityId": this.reorderTrips.entityId
      }
    }

    this.restService.reorderTrips(data)
      .subscribe(
        success => {
          this._reorderTripsModal.hide();
          this.reloadTrips(false);
        }
      );
  }

  /**
  * Reassign Trip modal directive reference to operate with within component.
  * @type {ModalDirective}
  */
  @ViewChild("reassignTripModal") _reassignTripModal: ModalDirective;
  reassignTrip: any = {};

  onTripReassign(entityType: string, toEntity: Reportable, event: any) {
    let fromEntity = event.dragData.entity;
    if (fromEntity.id === toEntity.id) {
      return;
    }

    this.reassignTrip = {
      entityType: entityType,
      fromEntity: fromEntity,
      toEntity: toEntity,
      trip: event.dragData.trip
    };
    this._reassignTripModal.show();
  }

  closeReassignTripModal() {
    this._reassignTripModal.hide();
  }
  doReassignTrip() {
    let data = {
      "resourcesAdd": [{
        "entityType": this.reassignTrip.entityType,
        "entityId": this.reassignTrip.toEntity.id
      }],
      "resourcesRemove": [{
        "entityType": this.reassignTrip.entityType,
        "entityId": this.reassignTrip.fromEntity.id
      }],
      "orderedStops": this.reassignTrip.trip.stops.map((stop: any, index: number) => (
        {
          "id": stop.id,
        }
      )),
      "stopsRemove": []
    }

    this.restService.updateTrip(this.reassignTrip.trip.id, data)
      .subscribe(
        success => {
          this._reassignTripModal.hide();
          this.reloadTrips(false);
        }
      );
  }

  /**
   * Unassign Trip modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("unassignTripModal") _unassignTripModal: ModalDirective;
  unassignTrip: any = {};

  onTripDrop(event: any) {
    this.unassignTrip = event.dragData;
    this._unassignTripModal.show();
  }

  closeUnassignTripModal() {
    this._unassignTripModal.hide();
  }
  doUnassignTrip() {
    this.restService.deleteTrip(this.unassignTrip.trip.id)
      .subscribe(
        success => {
          this._unassignTripModal.hide();
          this.reloadBookings(false);
          this.reloadTrips(false);
        }
      );
  }

  vehicles: Vehicle[] = [];
  vehiclesLoaded: boolean = false;
  connections: Connection[] = [];
  connectionsLoaded: boolean = false;
  drivers: Driver[];
  activeDrivers: Driver[];
  driversLoaded: boolean = false;
  tripsHandler: TripsHandler;
  items: TripsHandlerItem[] = [];
  itemsFilter: {
    filteredItems: TripsHandlerItem[],
    paginatedItems: {
      array: TripsHandlerItem[],
      begin: number,
      end: number
    }
  } = {
      filteredItems: [],
      paginatedItems: {
        array: [],
        begin: 0,
        end: 0
      }
    };

  bookings: Booking[] = [];
  bookingsFilter: {
    filteredBookings: Booking[],
    paginatedBookings: {
      array: Booking[],
      begin: number,
      end: number
    }
  } = {
      filteredBookings: [],
      paginatedBookings: {
        array: [],
        begin: 0,
        end: 0
      }
    };

  // Trips table
  tSearch: string = "";
  tripStatuses = TripStatus;
  tabStatuses = {
    "Plan": [TripStatus.PREASSIGNED, TripStatus.DISPATCHED],
    "Current": [TripStatus.DISPATCHED, TripStatus.ON_HOLD, TripStatus.APPROVED],
    "Complete": [TripStatus.COMPLETE]
  };
  tripsTab: string = "Plan";
  defaultSorting: boolean = false;
  tripsStatuses = this.tabStatuses[this.tripsTab];
  showCurrent() {
    this.tripsTab = "Current";
    this.defaultSorting = false;
    this.tripsStatuses = this.tabStatuses[this.tripsTab];
    this.reloadTrips();
  }
  showPlan() {
    this.tripsTab = "Plan";
    this.defaultSorting = false;
    this.tripsStatuses = this.tabStatuses[this.tripsTab];
    this.reloadTrips();
  }
  showComplete() {
    this.tripsTab = "Complete";
    this.defaultSorting = true;
    this.tripsStatuses = this.tabStatuses[this.tripsTab];
    this.reloadTrips();
  }

  tripsPage: number = 1;
  tripsPageSize: number = 5;
  changeTripsPage(newPage) {
    this.tripsPage = newPage;
  }

  /**
   * Doing client side filtering: ordering, pagination, horizontal tabulation logic.
   */
  initializeItems(refresh: boolean) {
    if (refresh) {
      this.tSearch = "";
    }
    this.items = this.tripsHandler.getItems(this.entityType);
    this.changeTripsPage(refresh ? 1 : this.tripsPage);
    this.initializeTripsCollapseMap(refresh);
  }

  tripsCollapseMap: any = {};
  initializeTripsCollapseMap(refresh: boolean) {
    if (refresh) {
      this.tripsCollapseMap = {};
    }
    this.items.forEach(item => {
      let entityId: string = item.getEntity().id;
      item.trips.forEach(trip => {
        let tripId = trip.id;
        let oldValue = !!this.tripsCollapseMap[`${entityId}.${tripId}`];
        this.tripsCollapseMap[`${entityId}.${tripId}`] = oldValue;

        trip.stops.forEach(stop => {
          let stopId = stop.id;
          let oldValue = !!this.tripsCollapseMap[`${entityId}.${tripId}.${stopId}`];
          this.tripsCollapseMap[`${entityId}.${tripId}.${stopId}`] = oldValue;
        });
      });
    });
  }

  /**
   * Doing server side request for trips and call `initializeItems()` to do filtering.
   */
  reloadTrips(refresh: boolean = true) {
    this.restService.get1000Trips(this.tripsStatuses, this.dispatchGroupId, this.defaultSorting)
      .subscribe(result => {
        this.tripsHandler = result;
        this.tripsHandler.initWith(this.vehicles, this.drivers);
        this.initializeItems(refresh);
      });
  }

  entityType = ResourceType.VEHICLE;
  entityTypes = ResourceType;
  showVehicle() {
    this.entityType = ResourceType.VEHICLE;
    this.initializeItems(true);
  }
  showDriver() {
    this.entityType = ResourceType.DRIVER;
    this.initializeItems(true);
  }

  // Bookings table
  bSearch: string = "";
  status: string = BookingStatus.AVAILABLE;
  statuses = BookingStatus;
  showAvailable() {
    this.status = BookingStatus.AVAILABLE;
    this.reloadBookings();
  }
  showDispatched() {
    this.status = BookingStatus.DISPATCHED;
    this.reloadBookings();
  }
  showCompleted() {
    this.status = BookingStatus.COMPLETED;
    this.reloadBookings();
  }

  reloadBookings(refresh: boolean = true) {
    this.restService.get1000Bookings(this.status)
      .subscribe(result => {
        this.bookings = result;
        // https://github.com/truckspy/truckspyui/issues/676
        // this.bookings.forEach(b => b.stops.sort((a, b) => {
        //   return new Date(a.appointmentFrom).getTime() - new Date(b.appointmentFrom).getTime();
        // }));
        this.initializeBookings(refresh);
      });
  }

  /**
   * Doing client side filtering: filtering, ordering, pagination.
   */
  initializeBookings(refresh: boolean) {
    if (refresh) {
      this.bSearch = "";
    }
    this.changeBookingsPage(refresh ? 1 : this.bookingsPage);
    this.initializeBookingsCollapseMap(refresh);
  }

  bookingsCollapseMap: any = {};
  initializeBookingsCollapseMap(refresh: boolean) {
    if (refresh) {
      this.bookingsCollapseMap = {};
    }
    this.bookings.forEach(booking => {
      let bookingId = booking.id;
      let oldValue = !!this.bookingsCollapseMap[`${bookingId}`];
      this.bookingsCollapseMap[`${bookingId}`] = oldValue;

      booking.stops.forEach(stop => {
        let stopId = stop.id;
        let oldValue = !!this.tripsCollapseMap[`${bookingId}.${stopId}`];
        this.tripsCollapseMap[`${bookingId}.${stopId}`] = oldValue;
      });
    });
  }

  bookingsPage: number = 1;
  bookingsPageSize: number = 10;
  changeBookingsPage(newPage) {
    this.bookingsPage = newPage;
  }

  /**
   * Defines if `stop` is current one.
   * Filters out all finished spots (`trip.status` should be `DISPATCHED` or `PREASSIGNED`) and select the first one.
   * 
   * Defines if actual route should be displayed on the map.
   */
  isNext(stops, stop, preassigned, dispatched) {
    let leftStops = stops.filter(stop => (preassigned || (dispatched && !stop.reportedDepart && !stop.completedAt)));
    if (!leftStops || leftStops.length == 0) {
      return false;
    }
    return leftStops[0].id === stop.id;
  }

  firstDriver(trip: Trip): Driver {
    if (!!trip && !!trip.dispatches && trip.dispatches.length > 0) {
      let resources: Resource[] = trip.dispatches.map(dispatch => dispatch.resource);
      let theResource = resources.find(next => next.entityType === ResourceType.DRIVER);
      if (!!theResource) {
        let theDriver = this.drivers.find(driver => driver.id === theResource.entityId);
        return theDriver;
      }
    }
    return null;
  }

  constructor(
    private restService: RestService,
    private modalService: BsModalService,
    private dateService: DateService,
    private addressUtil: AddressUtil,
    private timezoneHandler: TimezoneHandlerPipe,
    private storage: StorageService,
    private store: Store<AuthState>,
    private lsService: LocalStorageService) { }

  reloadTimer: Subscription;

  ngOnInit() {
    let loggedInAs = this.lsService.getLoginAs();
    combineLatest(
      this.restService.getCurrentUser(),
      this.store.pipe(select(getTableLength))
    ).subscribe(([user, length]) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;

      const attributes = user.attributes;
      const tableTripsAttribute = attributes.find(item => item.name === this.tableNameTrips);
      const tableBookingsAttribute = attributes.find(item => item.name === this.tableNameBookings);

      this.tableTripsColumns = !!tableTripsAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNamesTrips, JSON.parse(tableTripsAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNamesTrips);
      this.tableTripsColumnsClone = this.tableTripsColumns.map(next => ({ ...next })); // deep copy
      this.isLastColumnTrips = this.tableTripsColumns.filter(item => item.visible === true).length === 1;

      this.tableBookingsColumns = !!tableBookingsAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNamesBookings, JSON.parse(tableBookingsAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNamesBookings);
      this.tableBookingsColumnsClone = this.tableBookingsColumns.map(next => ({ ...next })); // deep copy
      this.isLastColumnBookings = this.tableBookingsColumns.filter(item => item.visible === true).length === 1;
    });
    this.loadTripsTable();

    this.storage.get(HIDE_BOOKINGS).then(hide => {
      this.showBookings(!hide);
    })

    this.reloadTimer = interval(FIVE_MINUTE_MILLIS)
      .subscribe(x => {
        console.log("Refreshing dispatch board (every 5 minutes)...");
        this.reloadTrips(false);
        this.reloadBookings(false);
      });
  }

  ngOnDestroy(): void {
    this.reloadTimer.unsubscribe();
  }

  loadTripsTable() {
    combineLatest(
      this.restService.get1000VehiclesLight({
        reportingProfile: false, type: true, dispatchGroup: false
      }), // ordered by remoteId.ASC
      this.restService.get1000Connections(), // ordered by creatredAt.DESC
      // We asume that 2 light calls will be more lightweight than 1 heavy call (RestService#get1000Drivers())
      // this.restService.get1000Drivers(), // ordered by remoteId.ASC
      this.restService.get1000DriversLight(), // ordered by remoteId.ASC
      this.restService.get1000ActiveDriversLight(), // ordered by remoteId.ASC
      this.restService.get1000DispatchGroupsLight() // ordered by name.ASC
    ).subscribe(
      data => {
        this.vehicles = data[0];
        this.vehiclesLoaded = true;

        this.connections = data[1];
        this.connectionsLoaded = true;

        this.drivers = data[2];
        this.activeDrivers = data[3];
        this.driversLoaded = true;

        this.dispatchGroups = data[4];
        this.storage.get(DISPATCH_GROUP_ID).then(id => {
          if (id && this.dispatchGroups.find(group => group.id === id)) {
            this.dispatchGroupId = id;
          }
          this.reloadTrips();
        })
      }
    );
  }

  loadBookingsTable() {
    this.bookingsTableLoaded = true;
    this.restService.get1000FeedbackTypes()
      .subscribe(result => {
        this.feedbackTypes = result;

        combineLatest(
          this.restService.get1000Customers(),
          this.restService.get1000VehicleTypes(),
          this.restService.get2000LocationsLight()
        ).subscribe(
          data => {
            this.customers = data[0];
            this.customersLoaded = true;

            this.types = data[1];
            this.typesLoaded = true;

            this.locations = data[2];
          });
      });
    this.reloadBookings();
  }

  /**
   * Add Booking logic.
   */
  bookingsTableLoaded: boolean = false;
  customers: Customer[];
  customersLoaded: boolean = false;
  types: VehicleType[] = [];
  typesLoaded: boolean = false;
  feedbackTypes: FeedbackType[];
  locations: DomicileLocation[] = [];

  refreshBookingsTable() {
    this.reloadBookings(false);
  }

  /**
   * Bookings switch
   */
  visibleBookings: boolean = true;

  showBookings(visible: boolean) {
    this.visibleBookings = visible;
    this.storage.set(HIDE_BOOKINGS, !visible);
    if (visible) {
      if (!this.bookingsTableLoaded) {
        this.loadBookingsTable();
      } else {
        this.refreshBookingsTable();
      }
    }
  }

  /**
   * Filter by dispatch group
   */

  dispatchGroupId = null;
  dispatchGroups = [];

  changeDispatchGroup() {
    if (this.dispatchGroupId) {
      this.storage.set(DISPATCH_GROUP_ID, this.dispatchGroupId);
    } else {
      this.storage.remove(DISPATCH_GROUP_ID);
    }
    this.reloadTrips();
  }

  private defaultColumnNamesTrips = [
    this.getEntityName.bind(this), 'Stops', 'Trip No', 'Status', 'Origin', 'Load Date', 'Destination', 'Delv Date'
  ];

  private defaultColumnNamesBookings = [
    'Stops', 'Book No', 'Customer', 'Origin', 'Load Date', 'Load No', 'Destination', 'Delv Date', 'Vehicle Type'
  ];

  getEntityName() {
    return this.entityType === this.entityTypes.VEHICLE ? "Vehicle" : "Driver";
  }

  saveSelectedColumns(columns: ColumnSelector[], tableName: string) {
    this.restService.saveColumnSelection(tableName, columns);
  }

  /**
   * Close column select menu on click outside
   */
  @HostListener('document:click', ['$event'])
  clickout(event) {
    const showHideElementTrips = document.getElementById("tripsContextShowHide");
    if (!!showHideElementTrips && showHideElementTrips.contains(event.target) && !this.showColumnSelectorTrips) {
      this.showTripsContextMenu(event);
    } else if (this.showColumnSelectorTrips) {
      if (!this.columnSelectorContextTrips.nativeElement.contains(event.target) && !showHideElementTrips.contains(event.target)) {
        this.showColumnSelectorTrips = !this.showColumnSelectorTrips;
      }
    }

    const showHideElementBookings = document.getElementById("bookingsContextShowHide");
    if (!!showHideElementBookings && showHideElementBookings.contains(event.target) && !this.showColumnSelectorBookings) {
      this.showBookingsContextMenu(event);
    } else if (this.showColumnSelectorBookings) {
      if (!this.columnSelectorContextBookings.nativeElement.contains(event.target) && !showHideElementBookings.contains(event.target)) {
        this.showColumnSelectorBookings = !this.showColumnSelectorBookings;
      }
    }
  }

  getTripsColumnVisible(id) {
    return this.tableTripsColumns.find(item => item.index === id).visible;
  }

  getBookingsColumnVisible(id) {
    return this.tableBookingsColumns.find(item => item.index === id).visible;
  }

  /**
   * Watch column selection checkboxes
   */
  columnSelectionChange(tableName, tableColumns, column) {
    const visible = !column.visible;
    const index = column.index;
    tableColumns.forEach(item => {
      if (item.index === index) {
        item.visible = visible;
      }
    })

    const isLastColumn = tableColumns.filter(item => item.visible === true);
    if (tableName === this.tableNameTrips) {
      this.isLastColumnTrips = isLastColumn.length === 1;
    }
    if (tableName === this.tableNameBookings) {
      this.isLastColumnBookings = isLastColumn.length === 1;
    }
  }
  isLastColumnTrips: boolean;
  isLastColumnBookings: boolean;

  getName(name) {
    return name instanceof Function ? name() : name;
  }

  applyColumnSelection(tableName: string, tableColumns: ColumnSelector[]) {
    if (tableName === this.tableNameTrips) {
      this.tableTripsColumns = this.tableTripsColumnsClone.map(next => ({ ...next })); // deep copy
    }
    if (tableName === this.tableNameBookings) {
      this.tableBookingsColumns = this.tableBookingsColumnsClone.map(next => ({ ...next })); // deep copy
    }
    this.saveSelectedColumns(tableColumns, tableName);

    this.showColumnSelectorTrips = !this.showColumnSelectorTrips;
    this.showColumnSelectorBookings = !this.showColumnSelectorBookings;
  }

  showTripsContextMenu(e) {
    e.preventDefault();
    const columnsCount = this.tableTripsColumns.length;
    const origin = {
      left: e.clientX + 10,
      top: e.clientY - (80 + columnsCount * 22)
    };
    this.setTripsPosition(origin);
    this.tableTripsColumnsClone = this.tableTripsColumns.map(next => ({ ...next })); // deep copy
    this.isLastColumnTrips = this.tableTripsColumnsClone.filter(item => item.visible === true).length === 1;
    this.showColumnSelectorTrips = !this.showColumnSelectorTrips;
  }
  showBookingsContextMenu(e) {
    e.preventDefault();
    const columnsCount = this.tableBookingsColumns.length;
    const origin = {
      left: e.clientX + 10,
      top: e.clientY - (80 + columnsCount * 22)
    };
    this.setBookingsPosition(origin);
    this.tableBookingsColumnsClone = this.tableBookingsColumns.map(next => ({ ...next })); // deep copy
    this.isLastColumnBookings = this.tableBookingsColumnsClone.filter(item => item.visible === true).length === 1;
    this.showColumnSelectorBookings = !this.showColumnSelectorBookings;
  }

  setTripsPosition({ top, left }) {
    this.columnSelectorTripsMenuLeft = left;
    this.columnSelectorTripsMenuTop = top;
  }
  setBookingsPosition({ top, left }) {
    this.columnSelectorBookingsMenuLeft = left;
    this.columnSelectorBookingsMenuTop = top;
  }

}
