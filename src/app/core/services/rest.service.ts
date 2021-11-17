import { TOKEN_INTERCEPTOR_HEADER, MAPBOX_API_URL, MAPBOX_ACCESS_TOKEN, MESSAGES_PAGESIZE, LOCAL_STORAGE_VIS_KEY_NAME } from '@app/core/smartadmin.config';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from "@angular/common/http";

import { environment } from '@env/environment';
import { Observable, throwError, of, ObservableInput, forkJoin } from "rxjs";
import { map, catchError, take, switchMap, tap } from 'rxjs/operators';
import { plainToClass, plainToClassFromExist } from "class-transformer";
import { NotificationService } from './notification.service';
import {
  User, PageResult, FilterParams, Driver, ReportingProfile, Connection, Company, Dictionary,
  Operation, ConnectionType, Invoice, Subscription, SearchResult, Report, LocalTime, Vehicle, ProductEstimation,
  Notification, NotificationType, NotificationSettingsList, NotificationSettings, LocationGroup, OdometerAdjustment,
  DomicileLocation, AuthInfo, MapboxPlace, LocationWrapper, PositionsData, Position, Statistics, Message, Device,
  ReportType, ReportEntity, Attribute, FuelTransaction, FuelStatistics, DispatchGroup, VehicleType, Discount, Customer,
  Booking, FeedbackType, DwellEvent, DwellStat, BookingStatus, Stop, Trip, TripsHandler, Status, TripChangeLog,
  InspectionConfig, Question, ConfigQuestion, ColumnSelector, MaintenanceIssue, MaintenanceStatisctics,
  WorkOrder, FaultRule, MaintenanceGroup, MaintenanceItem, Inspection, DriveAlert, IssueStatus, RepairOrderStatus,
  SPNDescription, EntityType, EntityTypeUtil, Event, Feedback, DriverHistory, DriverDailies, FilterViolationOption, Terminal,
  Subset, Violations, FilterUnidentifiedDrivingOption, VehicleList, FilterMalfunctionsOption, EldMalfunction,
  DriverHistoriesUnidentifiedDrivingEvents, DriverViolations, DriverViolationDocument, FilterReportOption, MyAccount,
  FilterFmcsaDataTransferOption, SingleAssignUnidentifiedDriving, FilterLogEditsOption, Auth, DriverHistoryUpdateDetails,
  VehicleOption, VehicleUtilization, FilterVehicles, DriversMetaNames, DriverStatuses, FilterDriversOption, FilterAlertOption,
  NotificationSending, FilterDrivers, EngineSnapshot, DriverOption, MaintenanceItemProgress, RequestVideoOption, ScheduledDashboardItem,
  ConnectionIssue, Oauth2Client, FilterIssues, DriveAlertStatus, SafetyDashboard, FilterSafetyDashboard, DriveAlertHistogram,
  FilterUsers, RoleType, FilterVehiclesThirdParty, EntityThirdParty, FilterLinehaulTrips, LinehaulTrip, FuelStation, VehicleParts,
  DriveAlertComment, FilterLocations, DispatchRoute
} from './rest.model';
import * as _ from 'lodash';

const API_URL = environment.apiBaseUrl;
const VIS_API_BASE = environment.visApiUrl;

function tokenIntercepted(headers?: HttpHeaders): HttpHeaders {
  let result = !headers ? new HttpHeaders().append(TOKEN_INTERCEPTOR_HEADER, 'true') : headers.append(TOKEN_INTERCEPTOR_HEADER, 'true');
  return result;
}

function ignoreLoadingBar(headers?: HttpHeaders): HttpHeaders {
  let result = !headers ? new HttpHeaders().append('ignoreLoadingBar', 'true') : headers.append('ignoreLoadingBar', 'true');
  return result;
}

const httpHeaders = new HttpHeaders({
  'Content-Type': 'application/json'
});
const authOptions = { headers: ignoreLoadingBar(httpHeaders) };
const authOptionsTokenized = { headers: tokenIntercepted(ignoreLoadingBar(httpHeaders)) };
const httpInterceptedOptions = { headers: tokenIntercepted(httpHeaders) };
const getHttpInterceptedOptions = { headers: tokenIntercepted() };
const exposedHttpHeaders = new HttpHeaders({
  // 'Access-Control-Request-Headers': 'Content-Disposition'
});
const getReportOptions = { headers: tokenIntercepted(exposedHttpHeaders), observe: 'response' as 'response', responseType: 'blob' as 'blob' };

@Injectable()
export class LocalStorageService {

  constructor() { }

  public storeSearch(query: string) {
    localStorage.setItem("search-query", query || "");
  }

  public getSearch(): string {
    return localStorage.getItem("search-query") || "";
  }

  public storeApiKey(key: string) {
    localStorage.setItem("apiKey", key || "");
  }

  public getApiKey(): string {
    return localStorage.getItem("apiKey") || "";
  }

  public storeVisApiKey(authData: Auth) {
    let token = authData ? btoa(`${authData.username}:${authData.password}`) : "";
    localStorage.setItem(LOCAL_STORAGE_VIS_KEY_NAME, token)
  }
  public storeLoginAsVisApiKey(authData: Auth) {
    let token = authData ? btoa(`${authData.username}:${authData.password}`) : "";
    localStorage.setItem("loginAs.visApiKey", token)
  }

  public getVisApiKey(): string {
    return localStorage.getItem(LOCAL_STORAGE_VIS_KEY_NAME) || "";
  }
  public getLoginAsVisApiKey(): string {
    return localStorage.getItem("loginAs.visApiKey") || "";
  }
  public clearApiKey(): void {
    localStorage.removeItem("apiKey");
    localStorage.removeItem("loginAs.user");
    localStorage.removeItem("loginAs.company");
    localStorage.removeItem("loginAs.visApiKey");
    localStorage.removeItem("loginAs.localtime");
    localStorage.removeItem(LOCAL_STORAGE_VIS_KEY_NAME);
  }

  /**
   * Stores user info to impersonate/imitate as a logged in one.
   */
  public storeLoginAsInfo(loginAs: any, company: any) {
    localStorage.setItem("loginAs.user", JSON.stringify(loginAs) || "");
    localStorage.setItem("loginAs.company", JSON.stringify(company) || "");
  }
  public storeLoginAsLocaltime(localtime: any) {
    localStorage.setItem("loginAs.localtime", JSON.stringify(localtime) || "");
  }

  public getLoginAs(): User {
    let loginAs = localStorage.getItem("loginAs.user");
    return loginAs ? plainToClass(User, JSON.parse(loginAs) as User) : null;
  }
  public getCompany(): Company {
    let company = localStorage.getItem("loginAs.company");
    return company ? plainToClass(Company, JSON.parse(company) as Company) : null;
  }
  public getLoginAsLocaltime(): LocalTime {
    let localtime = localStorage.getItem("loginAs.localtime");
    return localtime ? plainToClass(LocalTime, JSON.parse(localtime) as LocalTime) : null;
  }

  public clearLoginAsInfo(): void {
    localStorage.removeItem("loginAs.user");
    localStorage.removeItem("loginAs.company");
    localStorage.removeItem("loginAs.visApiKey");
    localStorage.removeItem("loginAs.localtime");
  }

  public clearLocalStorageBy(prefix: string) {
    var keysToRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      let nextKey: string = localStorage.key(i);
      if (nextKey.indexOf(prefix) !== -1) {
        keysToRemove = [...keysToRemove, nextKey];
      }
    }

    for (var i = 0; i < keysToRemove.length; i++) {
      localStorage.removeItem(keysToRemove[i]);
    }
  }
}

@Injectable()
export class RestService {

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) { }

  private handleAttachment(response: any, defaultFileName: string = "report") {
    function getFilename(disposition: string) {
      if (disposition && disposition.indexOf('attachment') !== -1) {
        var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        var matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          let filename = matches[1].replace(/['"]/g, '');
          return filename;
        }
      }
      return null;
    }

    let dataType = response.type;
    let binaryData = [];
    binaryData.push(response.body);
    let downloadLink = document.createElement('a');
    downloadLink.href = window.URL.createObjectURL(new Blob(binaryData, { type: dataType }));
    let disposition = response.headers.get("Content-Disposition");
    let filename = getFilename(disposition);
    let theName = filename || defaultFileName;
    downloadLink.setAttribute('download', theName);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.parentNode.removeChild(downloadLink);
  }

  public doReportDownload(uri: string, filename: string) {
    let theUri = (uri.indexOf("/") === 0 && API_URL.lastIndexOf("/") === API_URL.length - 1) ? uri.replace("/", "") : uri;
    this.http.get(API_URL + theUri, getReportOptions)
      .subscribe((response: any) => this.handleAttachment(response))
  }

  public doLogin(email: string, password: string): Observable<AuthInfo> {
    const body = {
      username: email,
      password: password
    }

    return this.http.post<AuthInfo>(API_URL + "api/web/auth", body, authOptions)
      .pipe(
        map(data => {
          return plainToClass(AuthInfo, data);
        }),
        catchError(this.handleLoginError)
      );
  }

  public doLogout() {
    this.http.get<any>(API_URL + 'api/web/logout', authOptionsTokenized)
      .pipe(
        map(data => { return true }),
        catchError(function () {
          return of(false);
        })
      ).subscribe(result => {
        let message = `Logged out: ${result}`;
        console.log(message);
      });
  }

  public doForgotPassword(email: string): Observable<boolean> {
    const body = {
      email: email
    }

    return this.http.post<boolean>(API_URL + "api/web/public/security/forgotpassword", body, authOptionsTokenized)
      .pipe(
        map(data => { return true }),
        catchError(function () {
          return of(false);
        })
      );
  }

  public doResetPassword(email: string, newPassword: string, hash: string): Observable<boolean> {
    const body = {
      email: email,
      key: hash,
      password: newPassword
    }

    return this.http.post<boolean>(API_URL + "api/web/public/security/resetpassword", body, authOptionsTokenized)
      .pipe(
        map(data => { return true }),
        catchError(function () {
          return of(false);
        })
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `NotificationSending` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort query parameter, e.g. `subject.ASC`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<NotificationSending>>} An `Observable` of the paginated result of `NotificationSending`s
   * @memberof RestService
   */
  public getAllNotificationSendings(params: FilterParams, limit: number = 10): Observable<PageResult<NotificationSending>> {
    return this.http
      .get<PageResult<NotificationSending>>(API_URL + `api/web/notifications/sending?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<NotificationSending>(NotificationSending), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public secureResetPassword(passwordData: any): Observable<boolean> {
    return this.http
      .patch<boolean>(API_URL + `api/web/secureresetpassword`, passwordData, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Preferences</b>: Password changed successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Booking` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `bookNo.DESC` or `billingName.ASC`
   * @param {string} status `status` field filtering, might be one of: `all`, `completed`, `dispatched`, `available`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<Booking>>} An `Observable` of the paginated result of `Booking`s
   * @memberof RestService
   */
  public getAllBookings(params: FilterParams, status: string, limit: number = 10): Observable<PageResult<Booking>> {
    let uri = status === BookingStatus.ALL
      ? `api/web/dispatching/bookings`
      : `api/web/dispatching/bookings/${status}`;
    return this.http
      .get<PageResult<Booking>>(API_URL + `${uri}?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Booking>(Booking), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Fetches up to 1000 `Booking` instances to handle the pagination logic on the UI side.
   *
   * @param {string} status `status` field filtering, might be one of: `all`, `completed`, `dispatched`, `available`
   * @returns {Observable<Booking[]>} An `Observable` of the `Booking`s array
   * @memberof RestService
   */
  public get1000Bookings(status: string): Observable<Booking[]> {
    let params: FilterParams = new FilterParams(1, `createdAt.DESC`);
    return this.getAllBookings(params, status, 1000).pipe(
      map(
        pageResult => pageResult.results
      )
    )
  }

  public getAllBookingsFor(customerId: string, params: FilterParams, status: string = null, limit: number = 10): Observable<PageResult<Booking>> {
    let uri = status === BookingStatus.ALL
      ? `api/web/customers/${customerId}/bookings`
      : `api/web/customers/${customerId}/bookings/${status}`;
    return this.http
      .get<PageResult<Booking>>(API_URL + `${uri}?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Booking>(Booking), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getBooking(id: string): Observable<Booking> {
    return this.http
      .get<Booking>(API_URL + `api/web/dispatching/bookings/details/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Booking, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public updateBooking(id: string, data: any): Observable<Booking> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<Booking>(API_URL + `api/web/dispatching/bookings/${id}`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Booking</b>: Updated successfully");
          return plainToClass(Booking, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createBooking(data: any): Observable<Booking> {
    return this.http
      .post<Booking>(API_URL + "api/web/dispatching/bookings", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Booking</b>: Created successfully");
          return plainToClass(Booking, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createStop(bookingId: string, data: any): Observable<Stop> {
    let body = {
      "booking": {
        "id": bookingId
      },
      "stop": data
    }

    return this.http
      .post<Stop>(API_URL + "api/web/dispatching/stops", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Stop</b>: Created successfully");
          return plainToClass(Stop, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches feedback for the specified `Stop`.
   *
   * @returns {Observable<Feedback[]>} An `Observable` of the array of `Feedback`s
   * @memberof RestService
   */
  public getFeedbacksFor(stopId: string): Observable<Feedback[]> {
    return this.http
      .get<Feedback[]>(API_URL + `api/web/dispatching/stops/${stopId}/feedback`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Feedback, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Fetches paginated result of 1000 `Trip` instances to handle the pagination logic on the UI side.
   *
   * @param {string} statuses `status` field filtering, might be either `PREASSIGNED`, 'DISPATCHED', `ON HOLD`, `APPROVED` or `COMPLETE`
   * @returns {Observable<TripsHandler>} An `Observable` of the `TripsHandler`
   * @memberof RestService
   */
  public get1000Trips(statuses: string[], dispatchGroupId?: number, defaultSorting?: boolean): Observable<TripsHandler> {
    statuses = !!statuses ? statuses : [];
    let statusesParam: string = statuses.map(status => `statuses[]=${status}`).join('&');
    if (dispatchGroupId) {
      statusesParam = statusesParam + (statusesParam ? '&' : '') + `dispatchGroupId=${dispatchGroupId}`;
    }
    let sorting = defaultSorting ? "sort=createdAt.DESC&" : "";
    return this.http
      .get<TripsHandler>(API_URL + `api/web/dispatching/trips?limit=1000&page=1&${sorting}${statusesParam}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let pageResult: PageResult<Trip> = plainToClassFromExist(new PageResult<Trip>(Trip), response);
          return new TripsHandler(pageResult.results);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getDispatchRoute(stopId: string): Observable<DispatchRoute> {
    return this.http
      .get<DispatchRoute>(API_URL + `api/web/dispatching/stops/${stopId}/route`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(DispatchRoute, response);
        }),
        catchError(function () {
          return of(null);
        })
      )
  }

  public get1000TripChangeLogs(tripId: string): Observable<TripChangeLog[]> {
    return this.http
      .get<TripChangeLog[]>(API_URL + `api/web/dispatching/trips/${tripId}/change-history?limit=1000&page=1&sort=createdAt.DESC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let pageResult: PageResult<TripChangeLog> = plainToClassFromExist(new PageResult<TripChangeLog>(TripChangeLog), response);
          return pageResult.results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public deleteTrip(id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/dispatching/trips/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Trip</b>: Trip unassigned successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createTrip(data: any): Observable<Trip> {
    return this.http
      .post<Trip>(API_URL + "api/web/dispatching/trips", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Trip</b>: Created successfully");
          return plainToClass(Trip, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateTrip(id: string, data: any): Observable<Trip> {
    return this.http
      .patch<Trip>(API_URL + `api/web/dispatching/trips/${id}`, data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Trip</b>: Updated successfully");
          return plainToClass(Trip, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public reorderTrips(data: any): Observable<Trip> {
    return this.http
      .patch<boolean>(API_URL + `api/web/dispatching/trips`, data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Trips</b>: Reordered successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Driver` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `remoteId.DESC` or `firstName.ASC`
   * @param {string} status `status` field filtering, might be either `(active)` or `(deleted)`
   * @param {number} limit amount of instances to fetch
   * @param {FilterDrivers} filters ID based filters
   * @returns {Observable<PageResult<Driver>>} An `Observable` of the paginated result of `Driver`s
   * @memberof RestService
   */
  public getAllDrivers(params: FilterParams, status: string, limit: number = 10, filters: FilterDrivers): Observable<PageResult<Driver>> {
    let idParams = "";
    if (filters.reportingProfileId) {
      idParams += `&reportingProfileId=${filters.reportingProfileId}`;
    }
    if (filters.connectionId) {
      idParams += `&connectionId=${filters.connectionId}`;
    }
    if (filters.dispatchGroupId) {
      idParams += `&dispatchGroupId=${filters.dispatchGroupId}`;
    }

    return this.http
      .get<PageResult<Driver>>(API_URL + `api/web/drivers?status=${status}&limit=${limit}&page=${params.page}&sort=${params.sort}${idParams}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Driver>(Driver), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * IMPORTANT: as default ordering utilized `remoteId.ASC` logic, which is utilized in the `DispatchComponent`.
   * In case of adjustments - need to refactor logic to avoid behavior change.
   */
  public get1000Drivers(): Observable<Driver[]> {
    return this.http
      .get<PageResult<Driver>>(API_URL + `api/web/drivers?limit=1000&sort=remoteId.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<Driver>(Driver), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * IMPORTANT: as default ordering utilized `remoteId.ASC` logic, which is utilized in many components.
   * In case of adjustments - need to refactor logic to avoid behavior change.
   */
  public get1000DriversLight(): Observable<Driver[]> {
    return this.get1000DriversLightBy();
  }

  public get1000ActiveDriversLight(): Observable<Driver[]> {
    return this.get1000DriversLightBy(Status.ACTIVE);
  }

  public get1000DriversLightBy(status?: string): Observable<Driver[]> {
    let statusPart = !!status ? `&status=${status}` : '';
    return this.http
      .get<PageResult<Driver>>(API_URL + `api/web/drivers/light/list?limit=1000&sort=remoteId.ASC${statusPart}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<Driver>(Driver), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getDriver(id: string): Observable<Driver> {
    return this.http
      .get<Driver>(API_URL + `api/web/drivers/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Driver, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public updateDriver(id: string, data: any): Observable<Driver> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<Driver>(API_URL + "api/web/drivers", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Driver</b>: Updated successfully");
          return plainToClass(Driver, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateDriverAttributes(entityId: string, attributes: any): Observable<boolean> {
    return this.updateEditableAttributes(entityId, "Driver", attributes);
  }
  public updateVehicleAttributes(entityId: string, attributes: any): Observable<boolean> {
    return this.updateEditableAttributes(entityId, "Vehicle", attributes);
  }
  private updateEditableAttributes(entityId: string, entityType: string, attributes: any): Observable<boolean> {
    let body = {
      "attributes": attributes,
      "entityId": entityId,
      "entityType": entityType
    };
    return this.http
      .patch<Driver>(API_URL + "api/web/editable-attributes", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createDriver(data: any): Observable<Driver> {
    return this.http
      .post<Driver>(API_URL + "api/web/drivers", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Driver</b>: Created successfully");
          return plainToClass(Driver, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignDriverToReportingProfile(driverId: string, assignData: any): Observable<Driver> {
    return this.http
      .patch<Driver>(API_URL + `api/web/drivers/${driverId}/assigntoreportingprofile`, assignData, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Driver</b>: Assigned successfully");
          return plainToClass(Driver, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignDriverToVehicle(driverId: string, vehicleId: any): Observable<Driver> {
    return this.http
      .request<Vehicle>("LINK", API_URL + `api/web/drivers/${driverId}/vehicle/${vehicleId}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Driver</b>: Vehicle assigned successfully");
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public toggleStatus(driverId: string): Observable<Driver> {
    return this.http
      .patch<Driver>(API_URL + `api/web/drivers/${driverId}/togglestatus`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Driver</b>: Status changed successfully");
          return plainToClass(Driver, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches list of `DriverHistory` instances based on the searching parameters.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort query parameter, e.g. `-event_type`
   * @param {string} id driver Id
   * @param {any} fromEventTime from time period
   * @param {any} toEventTime to time period
   */
  public getDriverHistories(params: FilterParams, id: string, fromEventTime, toEventTime): Observable<DriverHistory[]> {
    return this.http
      .get<DriverHistory[]>(
        VIS_API_BASE + `api/v2/driverHistories?user-id=${id}&sort=${params.sort}&from-event-time=${fromEventTime}&to-event-time=${toEventTime}`
      )
      .pipe(
        map((response) => {
          return plainToClass(DriverHistory, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches result of the specified amount (`limit` parameter) of `Driver Histories` instances.
   *
   * @param {number} data driver asset id - Vehicle Id
   * @param {FilterUnidentifiedDrivingOption} filterOption filter results
   * @param {number} limit limit the result
   * @returns {Observable<DriverHistory>} An `Observable` of the result
   * @memberof RestService
   */
  public getDriverHistoriesForUnidentifiedDriver(data, filterOption: FilterUnidentifiedDrivingOption, limit: number = 1): Observable<DriverHistory> {
    return this.http
      .get<DriverHistory>(
        VIS_API_BASE + `api/v2/driverHistories?offset=1&limit=${limit}&event-type=Driving&from-event-time=${data.eventTime}&asset-id=${data.assetId}`
      )
      .pipe(
        map(response => {
          return plainToClass(DriverHistory, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getDriverViolations(id: string): Observable<DriverViolations[]> {
    return this.http.get(VIS_API_BASE + `api/v2/driverCalcs?user-id=${id}`).pipe(
      map((response) => {
        return plainToClass(DriverViolations, response);
      }),
      catchError((response: HttpErrorResponse) => this.handleError(response))
    );
  }

  public updateDriverHistoryDetails(updateDriverHistoryData: DriverHistoryUpdateDetails[]): Observable<any> {
    return this.http
      .put<DriverDailies>(
        VIS_API_BASE + `api/v2/driverHistories`,
        updateDriverHistoryData
      ).pipe(
        map((response) => {
          this.notifySuccess('<b>Driver History</b>: Updated successfully');
          return plainToClass(DriverDailies, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of 25 `Message` instances.
   *
   * @param {string} folder folder to fetch messages for
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `createdAt.DESC` or `receiverId.ASC`
   * @param {string} query search query
   * @param {string} driverId driver based filtering
   * @returns {Observable<PageResult<Message>>} An `Observable` of the paginated result of `Message`s
   * @memberof RestService
   */
  public getMessages(folder: string, params: FilterParams, query: string, driverId: string): Observable<PageResult<Message>> {
    let searchParams = !!query ? `&search=${query}` : "";
    let driverParams = !!driverId ? `&driverId=${driverId}` : "";

    return this.http
      .get<PageResult<Message>>(API_URL + `api/common/messages/${folder}?limit=${MESSAGES_PAGESIZE}&page=${params.page}&sort=${params.sort}${searchParams}${driverParams}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Message>(Message), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getMessageImage(messageId: string, imageId: string): Observable<Blob> {
    return this.http
      .get(API_URL + `api/common/messages/${messageId}/image/${imageId}`, { headers: tokenIntercepted(), responseType: 'blob' })
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getInboxMessages(params: FilterParams, query: string, driverId: string = null): Observable<PageResult<Message>> {
    return this.getMessages("inbox", params, query, driverId);
  }
  public getSentMessages(params: FilterParams, query: string, driverId: string = null): Observable<PageResult<Message>> {
    return this.getMessages("sent", params, query, driverId);
  }
  public getDraftMessages(params: FilterParams, query: string, driverId: string = null): Observable<PageResult<Message>> {
    return this.getMessages("drafts", params, query, driverId);
  }
  public getArchivedMessages(params: FilterParams, query: string, driverId: string = null): Observable<PageResult<Message>> {
    return this.getMessages("archived", params, query, driverId);
  }

  public searchMessages(query: string, params: FilterParams): Observable<PageResult<Message>> {
    return this.http
      .get<PageResult<Message>>(API_URL + `api/common/messages/search/${query}?limit=25&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Message>(Message), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public multipleMessageAction(action: string, ids: string[]): Observable<boolean> {
    let input = new FormData();
    ids.forEach(id => {
      input.append('ids[]', id);
    });

    return this.http
      .post<boolean>(API_URL + `api/common/messages/${action}/multiple`, input, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess(`<b>Message</b>: Messages marked as ${action}`);
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public archiveMultipleMessages(ids: string[]): Observable<boolean> {
    return this.multipleMessageAction("archive", ids);
  }
  public unarchiveMultipleMessages(ids: string[]): Observable<boolean> {
    return this.multipleMessageAction("unarchive", ids);
  }
  public readMultipleMessages(ids: string[]): Observable<boolean> {
    return this.multipleMessageAction("read", ids);
  }
  public unreadMultipleMessages(ids: string[]): Observable<boolean> {
    return this.multipleMessageAction("unread", ids);
  }

  public acknowledgeMessage(id: string): Observable<boolean> {
    return this.http
      .post<boolean>(API_URL + `api/common/messages/${id}/acknowledge`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Message</b>: Message acknowledged successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public readMessage(id: string): Observable<boolean> {
    return this.http
      .post<boolean>(API_URL + `api/common/messages/${id}/read`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          console.log(`Message [${id}] marked read`);
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createMessage(data: any): Observable<Message> {
    let isDraft = data.draft || false;
    let body = {
      draft: isDraft,
      receiver: "App\\Entity\\Driver",
      subject: data.subject,
      body: data.body,
    };
    if (!!data.id) {
      body["id"] = data.id;
    }
    if (!!data.receiverId) {
      body["receiverId"] = data.receiverId;
    }
    if (!!data.reMessageId) {
      body["reMessageId"] = data.reMessageId;
    }

    return this.http
      .post<Message>(API_URL + "api/common/messages", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let message = isDraft
            ? "<b>Message</b>: Message saved as draft successfully"
            : "<b>Message</b>: Message sent successfully";
          this.notifySuccess(message);
          return plainToClass(Message, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public sendMessage(message: Message): Observable<Message> {
    let data = {
      id: message.id,
      receiver: message.receiver,
      receiverId: message.receiverId,
      subject: message.subject,
      body: message.body,
      draft: false
    }

    return this.createMessage(data);
  }

  public get1000LocationGroups(): Observable<LocationGroup[]> {
    return this.http
      .get<PageResult<LocationGroup>>(API_URL + `api/web/locationgroups?limit=1000&sort=createdAt.DESC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<LocationGroup>(LocationGroup), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public deleteLocationGroup(id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/locationgroups/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Location Group</b>: Group deleted successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createLocationGroup(data: any): Observable<LocationGroup> {
    return this.http
      .post<LocationGroup>(API_URL + "api/web/locationgroups", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Location Group</b>: Group added successfully");
          return plainToClass(LocationGroup, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public unassignLocationGroupFrom(profileId: string, id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/reportingprofiles/${profileId}/locationgroup/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Reporting Profile</b>: Location Group unassigned successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignLocationGroupTo(profileId: string, id: string): Observable<boolean> {
    return this.http
      .post<boolean>(API_URL + `api/web/reportingprofiles/${profileId}/locationgroup/${id}`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Reporting Profile</b>: Location Group assigned successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getValidLocationsFor(profileId: string, query: string): Observable<DomicileLocation[]> {
    let searchURI = !!query ? `&search=${query}` : "";
    return this.http
      .get<DomicileLocation[]>(API_URL + `api/web/reportingprofiles/${profileId}/locations?limit=1000&page=1${searchURI}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<DomicileLocation>(DomicileLocation), response).results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getLocationsFor(groupId: string, page: number, perPage: number = 500): Observable<PageResult<DomicileLocation>> {
    return this.http
      .get<PageResult<DomicileLocation>>(API_URL + `api/web/locationgroups/${groupId}/locations?limit=${perPage}&page=${page}&sort=name.ASC&displayable=true`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<DomicileLocation>(DomicileLocation), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `DomicileLocation` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `remoteId.DESC` or `status.ASC`
   * @param {number} limit amount of instances to fetch
   * @param {FilterLocations} filters search filter params
   * @returns {Observable<PageResult<DomicileLocation>>} An `Observable` of the paginated result of `DomicileLocation`s
   * @memberof RestService
   */
  public getAllLocations(params: FilterParams, limit: number = 10, filters: FilterLocations): Observable<PageResult<DomicileLocation>> {
    let searchParams = "";
    if (filters.name) {
      searchParams += `&name=${filters.name}`;
    }

    return this.http
      .get<PageResult<DomicileLocation>>(API_URL + `api/web/locations?limit=${limit}&page=${params.page}&sort=${params.sort}${searchParams}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<DomicileLocation>(DomicileLocation), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000Locations(): Observable<DomicileLocation[]> {
    return this.http
      .get<DomicileLocation[]>(API_URL + `api/web/locations?limit=1000&page=1&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<DomicileLocation>(DomicileLocation), response).results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get2000LocationsLight(): Observable<DomicileLocation[]> {
    return this.http
      .get<PageResult<DomicileLocation>>(API_URL + `api/web/locations/light/list?limit=2000&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<DomicileLocation>(DomicileLocation), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getLocation(id: string): Observable<DomicileLocation> {
    return this.http
      .get<DomicileLocation>(API_URL + `api/web/locations/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(DomicileLocation, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public doMixedSearch(groupId: string, query: string): Observable<any[]> {
    if (!query) {
      return of([]);
    }

    let locations = this.http.get(API_URL + `api/web/locationgroups/${groupId}/locations?limit=10&page=1&search=${query}&displayable=true`, getHttpInterceptedOptions);
    let places = this.http.get(MAPBOX_API_URL + `geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=US,CA,MX`, { headers: httpHeaders });
    return forkJoin([locations, places]).pipe(
      map(results => {
        let locations = plainToClassFromExist(new PageResult<DomicileLocation>(DomicileLocation), results[0]).results;
        let places = plainToClass(MapboxPlace, results[1]["features"]);
        let result = locations.map(l => new LocationWrapper(true, l)).slice(0, 10)
          .concat(
            places.map(p => new LocationWrapper(false, p))
          );
        return result;
      }),
      catchError((response: HttpErrorResponse) => this.handleError(response))
    );
  }

  public searchPlaceByCoordinates(query: string): Observable<any> {
    let places = this.http.get(MAPBOX_API_URL + `geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=US,CA,MX`, { headers: httpHeaders });
    return places.pipe(
      map(results => {
        let places = plainToClass(MapboxPlace, results["features"]);
        return places[0]
      }),
    );
  }

  public searchPlacesByCoordinates(query: string, itemsQuantity: number = 10): Observable<any> {
    let places = this.http.get(MAPBOX_API_URL + `geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=US,CA,MX`, { headers: httpHeaders });
    return places.pipe(
      map(results => {
        let places = plainToClass(MapboxPlace, results["features"]);
        return places
      }),
      map(places => places.slice(0, itemsQuantity))
    );
  }

  public doMixedProfileSearch(profileId: string, query: string): Observable<any[]> {
    if (!query) {
      return of([]);
    }

    let searchURI = !!query ? `&search=${query}` : "";
    let locations = this.http.get(API_URL + `api/web/reportingprofiles/${profileId}/locations?limit=1000&page=1${searchURI}`, getHttpInterceptedOptions);
    let places = this.http.get(MAPBOX_API_URL + `geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=US,CA,MX`, { headers: httpHeaders });
    return forkJoin([locations, places]).pipe(
      map(results => {
        let locations = plainToClassFromExist(new PageResult<DomicileLocation>(DomicileLocation), results[0]).results;
        let places = plainToClass(MapboxPlace, results[1]["features"]);
        let result = locations
          .filter( // Let's filter out 3-rd party integration locations here without lon/lat
            location => location.hasLonLat())
          .map(l => new LocationWrapper(true, l)).slice(0, 10)
          .concat(
            places.map(p => new LocationWrapper(false, p))
          );
        return result;
      }),
      catchError((response: HttpErrorResponse) => this.handleError(response))
    );
  }

  public createLocation(data: any): Observable<DomicileLocation> {
    return this.http
      .post<DomicileLocation>(API_URL + "api/web/locations", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Location</b>: Location added successfully");
          return plainToClass(DomicileLocation, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Updates `Location` based on the provided data.
   * It is a full update API call (missed ones will be handled as `null`), `polygon` and `locationGroupId` are required.
   */
  public updateLocation(locationData: any): Observable<DomicileLocation> {
    return this.http
      .patch<DomicileLocation>(API_URL + `api/web/locations`, locationData, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Location</b>: Updated successfully");
          return plainToClass(DomicileLocation, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public deleteLocation(id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/locations/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Location</b>: Location deleted successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public get1000AdminLocationGroups(): Observable<LocationGroup[]> {
    return this.http
      .get<PageResult<LocationGroup>>(API_URL + `api/web/admin/locationgroups?limit=1000&sort=createdAt.DESC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<LocationGroup>(LocationGroup), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public deleteAdminLocationGroup(id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/admin/locationgroups/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Location Group</b>: Group deleted successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createAdminLocationGroup(data: any): Observable<LocationGroup> {
    return this.http
      .post<LocationGroup>(API_URL + "api/web/admin/locationgroups", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Location Group</b>: Group added successfully");
          return plainToClass(LocationGroup, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getAdminAllLocations(params: FilterParams, limit: number = 10): Observable<PageResult<DomicileLocation>> {
    return this.http
      .get<PageResult<DomicileLocation>>(API_URL + `api/web/admin/locations?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<DomicileLocation>(DomicileLocation), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getAdmin1000Locations(): Observable<DomicileLocation[]> {
    return this.http
      .get<DomicileLocation[]>(API_URL + `api/web/admin/locations?limit=1000&page=1&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let pageResult: PageResult<DomicileLocation> = plainToClassFromExist(new PageResult<DomicileLocation>(DomicileLocation), response);
          return pageResult.results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public searchLocationsForAdmin(search: string): Observable<DomicileLocation[]> {
    let queryParams = '';
    if (search) {
      queryParams += `&search=${search}`;
    }
    return this.http
      .get<DomicileLocation[]>(API_URL + `api/web/admin/locations?limit=10&page=1&sort=name.ASC${queryParams}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let pageResult: PageResult<DomicileLocation> = plainToClassFromExist(new PageResult<DomicileLocation>(DomicileLocation), response);
          return pageResult.results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getAdminLocation(id: string): Observable<DomicileLocation> {
    return this.http
      .get<DomicileLocation>(API_URL + `api/web/admin/locations/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(DomicileLocation, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public createAdminLocation(data: any): Observable<DomicileLocation> {
    return this.http
      .post<DomicileLocation>(API_URL + "api/web/admin/locations", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Location</b>: Location added successfully");
          return plainToClass(DomicileLocation, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Updates `Location` based on the provided data.
   * It is a full update API call (missed ones will be handled as `null`), `polygon` and `locationGroupId` are required.
   */
  public updateAdminLocation(locationData: any): Observable<DomicileLocation> {
    return this.http
      .patch<DomicileLocation>(API_URL + `api/web/admin/locations`, locationData, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Location</b>: Updated successfully");
          return plainToClass(DomicileLocation, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public deleteAdminLocation(id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/admin/locations/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Location</b>: Location deleted successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of `DwellEvent` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `id.DESC` or `startedAt.ASC`
   * @returns {Observable<PageResult<DwellEvent>>} An `Observable` of the paginated result of `DwellEvent`s
   * @memberof RestService
   */
  private getDwellEvents(uri: string, params: FilterParams): Observable<PageResult<DwellEvent>> {
    return this.http
      .get<PageResult<DwellEvent>>(API_URL + `${uri}?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<DwellEvent>(DwellEvent), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getDwellEventsForVehicle(vehicleId: string, params: FilterParams): Observable<PageResult<DwellEvent>> {
    let uri = `api/web/vehicles/${vehicleId}/dwellevents`;
    return this.getDwellEvents(uri, params);
  }

  public getDwellEventsForLocation(locationId: string, params: FilterParams): Observable<PageResult<DwellEvent>> {
    let uri = `api/web/locations/${locationId}/dwellevents`;
    return this.getDwellEvents(uri, params);
  }

  public downloadExcelForVehicleDwellEvents(vehicleId: string) {
    return this.http.get(API_URL + `api/web/vehicles/${vehicleId}/dwellevents/EXCEL`, getReportOptions)
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      ).subscribe(res => this.handleAttachment(res, 'vehicle-dwell-events.xlsx'));
  }

  public downloadVehicleEventsExcelReport(vehicleId: string) {
    return this.http.get(API_URL + `api/web/vehicleevents/${vehicleId}/vehicle-event-list-report`, getReportOptions)
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      ).subscribe(res => this.handleAttachment(res, 'vehicle-events-report.xlsx'));
  }

  public downloadDevicesExcelReport() {
    return this.http.get(API_URL + `api/web/devices/list/report`, getReportOptions)
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      ).subscribe(res => this.handleAttachment(res, 'devices-report.xlsx'));
  }

  public downloadIncompleteTrainingSessionsExcelReport() {
    return this.http.get(API_URL + `api/web/drive-alerts/coaching-session/report`, getReportOptions)
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      ).subscribe(res => this.handleAttachment(res, 'incomplete-training-sessions.xlsx'));
  }

  public downloadAdminInvoicesExcelReport() {
    return this.http.get(API_URL + `api/web/admin/invoices/sync/status-report`, getReportOptions)
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      ).subscribe(res => this.handleAttachment(res, 'invoices-report.xlsx'));
  }

  /**
   * Fetches artray of `DwellStat` instances.
   *
   * @returns {Observable<DwellStat[]>} An `Observable` of the array of `DwellStat`s
   * @memberof RestService
   */
  public getDwellStatsFor(locationId: string, startDate: string, endDate: string): Observable<DwellStat[]> {
    return this.http
      .get<DwellStat[]>(API_URL + `api/web/locations/${locationId}/dwellstats?startDate=${startDate}&endDate=${endDate}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(DwellStat, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getPositionsFor(vehicleId: string, hopToErrors: boolean, endDatetime: string, page: number, perPage: string): Observable<PositionsData> {
    let additionalParams = hopToErrors ? `hopToErrors=true` : `endDatetime=${endDatetime}`;
    return this.http
      .get<PositionsData>(API_URL + `api/web/positions?limit=${perPage}&page=${page}&vehicleId=${vehicleId}&${additionalParams}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(PositionsData, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Creates `Position` for the specified vehicle based on the provided `data` (should contain
   * `datetime` and `locationId`).
   */
  public createPositionFor(vehicleId: string, data: any): Observable<Position> {
    let body = {
      vehicleId: vehicleId,
      ...data
    }
    return this.http
      .post<Position>(API_URL + "api/web/positions", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Position</b>: Position added successfully");
          return plainToClass(Position, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Creates many `Position`s based on the provided `data`, which contains `createPositionRequests` array of position
   * datas to create, each entry should contain `vehicleid`, `datetime` and `locationId` (optionally `lan` and `lat`).
   */
  public createManyPositions(data: any): Observable<boolean> {
    return this.http
      .post<boolean>(API_URL + "api/web/positions/many", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Position</b>: Position(s) added successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Updates `Position`s list defined by `positionIds` array for the specified vehicle based on
   * the provided `data` (contains `action` and/or `assignToVehicleId`).
   */
  public updatePositionsFor(vehicleId: string, positionIds: string[], data: any): Observable<any> {
    let body = {
      vehicleId: vehicleId,
      positionIds: positionIds,
      ...data
    }
    return this.http
      .patch<any>(API_URL + "api/web/positions", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Position</b>: Positions updated successfully");
          return response;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getEngineSnapshotFor(vehicleId: string): Observable<EngineSnapshot> {
    return this.http
      .get<EngineSnapshot>(API_URL + `api/web/vehicles/${vehicleId}/engine-snapshot`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(EngineSnapshot, response);
        }),
        catchError(function () { // returns null in case of 404 error
          return of(null);
        })
      )
  }

  public getVehiclesToAssignFor(vehicleId: string, positionIds: string[]): Observable<Vehicle> {
    let body = {
      vehicleId: vehicleId,
      action: "Reassign",
      positionIds: positionIds
    }
    return this.http
      .post<Vehicle>(API_URL + "api/web/positions/canassigntovehicles", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Vehicle` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `remoteId.DESC` or `status.ASC`
   * @param {string} status `status` field filtering, might be either `(active)` or `(deleted)`
   * @param {boolean} dataError `dataError` field filtering, if specified `status` filtering will be ignored
   * @param {number} limit amount of instances to fetch
   * @param {FilterVehicles} filters ID based filters
   * @returns {Observable<PageResult<Vehicle>>} An `Observable` of the paginated result of `Vehicle`s
   * @memberof RestService
   */
  public getAllVehicles(params: FilterParams, status: string, dataError: boolean, limit: number = 10, filters: FilterVehicles): Observable<PageResult<Vehicle>> {
    let filtering = `dataError=1&`; // in case dataError ones are needed
    if (!dataError) {
      filtering = `status=${status}&`;
    }

    let idParams = "";
    if (filters.reportingProfileId) {
      idParams += `&reportingProfileId=${filters.reportingProfileId}`;
    }
    if (filters.connectionId) {
      idParams += `&connectionId=${filters.connectionId}`;
    }
    if (filters.domicileLocationId) {
      idParams += `&domicileLocationId=${filters.domicileLocationId}`;
    }
    if (filters.dispatchGroupId) {
      idParams += `&dispatchGroupId=${filters.dispatchGroupId}`;
    }
    if (filters.remoteId) {
      idParams += `&remoteId=${filters.remoteId}`;
    }
    if (filters.category) {
      idParams += `&category=${filters.category}`;
    }

    return this.http
      .get<PageResult<Vehicle>>(API_URL + `api/web/vehicles?${filtering}limit=${limit}&page=${params.page}&sort=${params.sort}${idParams}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Vehicle>(Vehicle), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * IMPORTANT: as default ordering utilized `remoteId.ASC` logic, which is utilized in the `DispatchComponent`.
   * In case of adjustments - need to refactor logic to avoid behavior change.
   */
  public get1000Vehicles(): Observable<Vehicle[]> {
    return this.get1000VehiclesBy();
  }

  public get1000ActiveVehicles(dispatchGroupId?: string): Observable<Vehicle[]> {
    return this.get1000VehiclesBy(Status.ACTIVE, dispatchGroupId);
  }

  public get1000VehiclesBy(status?: string, dispatchGroupId?: string): Observable<Vehicle[]> {
    let statusPart = !!status ? `&status=${status}` : '';
    let idParams = "";
    if (dispatchGroupId) {
      idParams += `&dispatchGroupId=${dispatchGroupId}`;
    }

    return this.http
      .get<PageResult<Vehicle>>(API_URL + `api/web/vehicles?limit=1000&sort=remoteId.ASC${statusPart}${idParams}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<Vehicle>(Vehicle), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * IMPORTANT: as default ordering utilized `remoteId.ASC` logic, which is utilized in many components.
   * In case of adjustments - need to refactor logic to avoid behavior change.
   */
  public get1000VehiclesLight(parts: VehicleParts = null): Observable<Vehicle[]> {
    return this.get1000VehiclesLightBy(null, null, parts);
  }

  public get1000ActiveVehiclesLight(dispatchGroupId: string = null, parts: VehicleParts = null): Observable<Vehicle[]> {
    return this.get1000VehiclesLightBy(Status.ACTIVE, dispatchGroupId, parts);
  }

  public get1000VehiclesLightBy(status: string = null, dispatchGroupId: string = null, parts: VehicleParts = null): Observable<Vehicle[]> {
    let statusPart = !!status ? `&status=${status}` : '';
    let idParams = "";
    if (dispatchGroupId) {
      idParams += `&dispatchGroupId=${dispatchGroupId}`;
    }

    let partsParams = "";
    if (!!parts && !!parts.reportingProfile) {
      partsParams += `&reportingProfile=true`;
    }
    if (!!parts && !!parts.type) {
      partsParams += `&type=true`;
    }
    if (!!parts && !!parts.dispatchGroup) {
      partsParams += `&dispatchGroup=true`;
    }

    return this.http
      .get<PageResult<Vehicle>>(API_URL + `api/web/vehicles/light/list?limit=1000&sort=remoteId.ASC${statusPart}${idParams}${partsParams}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<Vehicle>(Vehicle), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * IMPORTANT: as default ordering utilized `remoteId.ASC` logic, which is utilized in the `AdminDeviceComponent`.
   * In case of adjustments - need to refactor logic to avoid behavior change.
   */
  public get1000AdminVehiclesForCompany(companyId: string): Observable<Vehicle[]> {
    return this.http
      .get<PageResult<Vehicle>>(API_URL + `api/web/admin/vehicles?limit=1000&sort=remoteId.ASC&companyId=${companyId}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<Vehicle>(Vehicle), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getVehicle(id: string): Observable<Vehicle> {
    return this.http
      .get<Vehicle>(API_URL + `api/web/vehicles/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public ignoreVehicleErrors(id: string): Observable<boolean> {
    return this.http
      .put<boolean>(API_URL + `api/web/vehicles/${id}/ignoreerror`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Errors ignored");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateVehicle(id: string, data: any): Observable<Vehicle> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<Vehicle>(API_URL + "api/web/vehicles", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Updated successfully");
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createVehicle(data: any): Observable<Vehicle> {
    return this.http
      .post<Vehicle>(API_URL + "api/web/vehicles", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Created successfully");
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignVehicleToReportingProfile(vehicleId: string, assignData: any): Observable<Vehicle> {
    return this.http
      .patch<Vehicle>(API_URL + `api/web/vehicles/${vehicleId}/assigntoreportingprofile`, assignData, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Assigned successfully");
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public toggleVehicleStatus(vehicleId: string): Observable<Vehicle> {
    return this.http
      .patch<Vehicle>(API_URL + `api/web/vehicles/${vehicleId}/togglestatus`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Status changed successfully");
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignDomicile(vehicleId: string, locationId: string): Observable<Vehicle> {
    return this.http
      .patch<Vehicle>(API_URL + `api/web/vehicles/${vehicleId}/assigndomicile/${locationId}`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Domicile assigned successfully");
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  // request for getting vehicle categories, it is used on vehicles table for filtering
  public getAllVehicleCategories(): Observable<string[]> {
    return this.http
      .get<Vehicle>(API_URL + `api/web/vehicles/vehicle-categories/list`, getHttpInterceptedOptions)
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `InspectionConfig` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `name.DESC` or `id.ASC`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<InspectionConfig>>} An `Observable` of the paginated result of `InspectionConfig`s
   * @memberof RestService
   */
  public getAllInspectionConfigs(params: FilterParams, limit: number = 10): Observable<PageResult<InspectionConfig>> {
    return this.http
      .get<PageResult<InspectionConfig>>(API_URL + `api/web/inspectionconfig?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<InspectionConfig>(InspectionConfig), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * IMPORTANT: as default ordering utilized `name.ASC` logic, which is utilized in the `VehicleViewComponent`.
   * In case of adjustments - need to refactor logic to avoid behavior change.
   */
  public get1000InspectionConfigs(): Observable<InspectionConfig[]> {
    return this.http
      .get<PageResult<InspectionConfig>>(API_URL + `api/web/inspectionconfig?limit=1000&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<InspectionConfig>(InspectionConfig), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000InspectionConfigsLight(): Observable<InspectionConfig[]> {
    return this.http
      .get<PageResult<InspectionConfig>>(API_URL + `api/web/inspectionconfig/light?limit=1000&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<InspectionConfig>(InspectionConfig), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getInspectionConfig(id: string): Observable<InspectionConfig> {
    return this.http
      .get<PageResult<InspectionConfig>>(API_URL + `api/web/inspectionconfig/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(InspectionConfig, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public updateInspectionConfig(id: string, data: any): Observable<InspectionConfig> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<InspectionConfig>(API_URL + "api/web/inspectionconfig", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Inspection Configuration</b>: Updated successfully");
          return plainToClass(InspectionConfig, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createInspectionConfig(data: any): Observable<InspectionConfig> {
    return this.http
      .post<InspectionConfig>(API_URL + "api/web/inspectionconfig", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Inspection Configuration</b>: Created successfully");
          return plainToClass(InspectionConfig, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignInspectionConfigToVehicle(vehicleId: string, id: string): Observable<Vehicle> {
    return this.http
      .request<Vehicle>("LINK", API_URL + `api/web/vehicles/${vehicleId}/inspectionconfig/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Inspection Configuration assigned successfully");
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public unassignInspectionConfigFromVehicle(vehicleId: string, id: string): Observable<boolean> {
    return this.http
      .request<boolean>("UNLINK", API_URL + `api/web/vehicles/${vehicleId}/inspectionconfig/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Inspection Configuration unassigned successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Inspection` instances.
   * IMPORTANT: API provides also next query parameters `driverId`, `vehicleId`.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `inspectionNum.DESC` or `type.ASC`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<Inspection>>} An `Observable` of the paginated result of `Inspection`s
   * @memberof RestService
   */
  public getAllInspections(params: FilterParams, limit: number = 10, vehicleId: string = null): Observable<PageResult<Inspection>> {
    const vehiclePart = !!vehicleId ? `&vehicleId=${vehicleId}` : "";
    return this.http
      .get<PageResult<Inspection>>(API_URL + `api/web/inspections?limit=${limit}&page=${params.page}&sort=${params.sort}${vehiclePart}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Inspection>(Inspection), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Fetches up to 1000 `Inspection` instances to handle the pagination logic on the UI side.
   *
   * @returns {Observable<Inspection[]>} An `Observable` of the `Inspection`s array
   * @memberof RestService
   */
  public get1000Inspections(): Observable<Inspection[]> {
    let params: FilterParams = new FilterParams(1, `createdAt.DESC`);
    return this.getAllInspections(params, 1000).pipe(
      map(
        pageResult => pageResult.results
      )
    )
  }

  public get1000InspectionsForVehicle(vehicleId: string): Observable<Inspection[]> {
    let params: FilterParams = new FilterParams(1, `createdAt.DESC`);
    return this.getAllInspections(params, 1000, vehicleId).pipe(
      map(
        pageResult => pageResult.results
      )
    )
  }

  public getInspectionSignature(id: string): Observable<Blob> {
    return this.http
      .get(API_URL + `api/web/inspections/${id}/signature`, { headers: tokenIntercepted(), responseType: 'blob' })
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getInspection(id: string): Observable<Inspection> {
    return this.http
      .get<Inspection>(API_URL + `api/web/inspections/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Inspection, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getInspectionByAnswer(answerId: string): Observable<Inspection> {
    return this.http
      .get<Inspection>(API_URL + `api/web/inspections/answer/${answerId}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Inspection, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getAnswerImage(inspectionId: string, answerId: string): Observable<Blob> {
    return this.http
      .get(API_URL + `api/web/inspections/${inspectionId}/answers/${answerId}/image`, { headers: tokenIntercepted(), responseType: 'blob' })
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public downloadInspectionById(id: string, type: string): Observable<Blob> {
    return this.http
      .get(API_URL + `api/web/inspections/${id}/${type}`, { headers: tokenIntercepted(), responseType: 'blob' })
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Question` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `text.DESC` or `createdAt.ASC`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<Question>>} An `Observable` of the paginated result of `Question`s
   * @memberof RestService
   */
  public getAllQuestions(params: FilterParams, limit: number = 10): Observable<PageResult<Question>> {
    return this.http
      .get<PageResult<Question>>(API_URL + `api/web/questions?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Question>(Question), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * IMPORTANT: as default ordering utilized `text.ASC` logic, which is utilized in the `ConfigurationViewComponent`.
   * In case of adjustments - need to refactor logic to avoid behavior change.
   */
  public get1000Questions(): Observable<Question[]> {
    return this.http
      .get<PageResult<Question>>(API_URL + `api/web/questions?limit=1000&sort=text.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<Question>(Question), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getAllQuestionsFor(configuration: InspectionConfig, params: FilterParams, limit: number = 10): Observable<PageResult<Question>> {
    return this.http
      .get<PageResult<Question>>(API_URL + `api/web/questions?limit=1000&page=1&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          configuration
          let paginated = plainToClassFromExist(new PageResult<Question>(Question), response);
          let anyQuestion = !!configuration.questions && configuration.questions.length > 0;
          if (!anyQuestion) {
            return paginated;
          }

          let excludeIds = configuration.questions.map(function (next: ConfigQuestion) {
            return next.question.id;
          });
          let questions = (paginated && paginated.results) || [];
          let filteredQuestions = questions.filter(
            (question: Question) => !excludeIds.includes(question.id)
          );

          let begin = (params.page - 1) * limit;
          let end = params.page * limit - 1;
          let body = {
            "results": filteredQuestions.splice(begin, end),
            "resultCount": filteredQuestions.length
          }
          return plainToClassFromExist(new PageResult<Question>(Question), body);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000QuestionsFor(configuration: InspectionConfig): Observable<Question[]> {
    return this.http
      .get<PageResult<Question>>(API_URL + `api/web/questions?limit=1000&page=1&sort=text.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          configuration
          let paginated = plainToClassFromExist(new PageResult<Question>(Question), response);
          let questions = (paginated && paginated.results) || [];

          let anyQuestion = !!configuration.questions && configuration.questions.length > 0;
          if (!anyQuestion) {
            return questions;
          }

          let excludeIds = configuration.questions.map(function (next: ConfigQuestion) {
            return next.question.id;
          });
          let filteredQuestions = questions.filter(
            (question: Question) => !excludeIds.includes(question.id)
          );
          return filteredQuestions;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public createQuestion(data: any): Observable<Question> {
    let body = {
      ...data,
      "status": true
    }
    return this.http
      .post<Question>(API_URL + "api/web/questions", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Question</b>: Created successfully");
          return plainToClass(Question, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateQuestion(id: string, data: any): Observable<Question> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<Question>(API_URL + "api/web/questions", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Question</b>: Updated successfully");
          return plainToClass(Question, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignQuestionToInspectionConfig(configId: string, id: string, position: number): Observable<boolean> {
    return this.http
      .request<boolean>("LINK", API_URL + `api/web/inspectionconfig/${configId}/question/${id}/${position}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Inspection Configuration</b>: Question assigned successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public unassignQuestionFromInspectionConfig(configId: string, id: string): Observable<boolean> {
    return this.http
      .request<boolean>("UNLINK", API_URL + `api/web/inspectionconfig/${configId}/question/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Inspection Configuration</b>: Question unassigned successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of 10 `OdometerAdjustment` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `datetime.DESC` or `reason.ASC`
   * @returns {Observable<PageResult<OdometerAdjustment>>} An `Observable` of the paginated result of `OdometerAdjustment`s
   * @memberof RestService
   */
  public getAllOdometerAdjustments(vehicleId: string, params: FilterParams): Observable<PageResult<OdometerAdjustment>> {
    return this.http
      .get<PageResult<OdometerAdjustment>>(API_URL + `api/web/vehicles/${vehicleId}/odometeradjustments?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<OdometerAdjustment>(OdometerAdjustment), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Fetches valid datetimes for the specified `day` and `vehicleId`.
   *
   * @param {string} vehicleId Vehicle's ID
   * @param {string} day Date in the format `yyyy-MM-dd`
   * @memberof RestService
   */
  public getOdometerAdjustmentsDatetimesFor(vehicleId: string, day: string): Observable<string[]> {
    return this.http
      .get<string[]>(API_URL + `api/web/vehicles/${vehicleId}/odometeradjustments/datetimes/${day}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return response;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public createOdometerAdjustment(vehicleId: string, data: any): Observable<OdometerAdjustment> {
    return this.http
      .post<OdometerAdjustment>(API_URL + `api/web/vehicles/${vehicleId}/odometeradjustments`, data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Odometer Adjustment</b>: Created successfully");
          return plainToClass(OdometerAdjustment, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public deleteOdometerAdjustment(vehicleId: string, id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/vehicles/${vehicleId}/odometeradjustments/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Odometer Adjustment</b>: Entry removed successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getAllReportingProfiles(params: FilterParams, limit: number = 10): Observable<PageResult<ReportingProfile>> {
    return this.http
      .get<PageResult<ReportingProfile>>(API_URL + `api/web/reportingprofiles?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<ReportingProfile>(ReportingProfile), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000ReportingProfiles(): Observable<ReportingProfile[]> {
    return this.http
      .get<PageResult<ReportingProfile>>(API_URL + `api/web/reportingprofiles?limit=1000&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<ReportingProfile>(ReportingProfile), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000ReportingProfileLights(): Observable<ReportingProfile[]> {
    return this.http
      .get<PageResult<ReportingProfile>>(API_URL + `api/web/reportingprofiles/light?limit=1000&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<ReportingProfile>(ReportingProfile), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getProductsFor(reportingProfileId: string): Observable<ProductEstimation[]> {
    return this.http
      .get<ProductEstimation[]>(API_URL + `api/web/products/${reportingProfileId}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(ProductEstimation, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getReportingProfile(id: string): Observable<ReportingProfile> {
    return this.http
      .get<ReportingProfile>(API_URL + `api/web/reportingprofiles/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(ReportingProfile, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public deleteSubscription(reportingProfileId: string, subscriptionId: string): Observable<boolean> {
    let httpOptions = getHttpInterceptedOptions;
    httpOptions["body"] = {
      subscriptionId: subscriptionId
    };

    return this.http
      .delete<boolean>(API_URL + `api/web/reportingprofiles/${reportingProfileId}/unsubscribe`, httpOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Reporting Profile</b>: Unsubscribed successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public subscribeToProduct(reportingProfileId: string, product: string): Observable<boolean> {
    let body = {
      product: product
    };

    return this.http
      .post<boolean>(API_URL + `api/web/reportingprofiles/${reportingProfileId}/subscribe`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Reporting Profile</b>: Subscribed successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getReports(entityId: string, reportName: string, params: FilterParams): Observable<PageResult<Report>> {
    return this.http
      .get<PageResult<Report>>(API_URL + `api/web/reports/${reportName}/${entityId}?limit=10&page=${params.page}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Report>(Report), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getReportTypes(): Observable<ReportType[]> {
    return this.http
      .get<ReportType[]>(API_URL + `api/web/reports/types`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let result = [];
          Object.keys(response).forEach(pType => {
            let rNames: string[] = response[pType];
            result.push(new ReportType(pType, rNames));
          });
          return result;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getReportEntities(reportName: string, startDateTime: string, endDateTime: string): Observable<ReportEntity[]> {
    return this.http
      .get<ReportEntity[]>(API_URL + `api/web/reports/entities?reportName=${reportName}&startDateTime=${startDateTime}&endDateTime=${endDateTime}`, getHttpInterceptedOptions)
      .pipe(
        map((response: any) => {
          let entities = response.entities;
          if (!entities) {
            return [];
          }

          let result = [];
          Object.keys(entities).forEach(entityId => {
            let next: any = entities[entityId];
            let nextEntity = plainToClass(ReportEntity, next);
            result.push(nextEntity);
          });
          return result;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public buildCustomReport(entities: ReportEntity[], reportName: string, startDateTime: string, endDateTime: string, fileType: string) {
    let reportables = {};
    entities.forEach((reportable: ReportEntity) => {
      let entityId = reportable.entityId;
      reportables[entityId] = {
        "belongsTo": reportable.belongsTo,
        "entityId": reportable.entityId,
        "entityType": reportable.entityType,
        "name": reportable.name,
        "status": reportable.status
      }
    });

    let body = {
      "entities": reportables,
      "reportName": reportName,
      "startDateTime": startDateTime,
      "endDateTime": endDateTime,
      "fileType": fileType
    }

    return this.http
      .post(API_URL + `api/web/report`, body, getReportOptions)
      .subscribe((response: any) => this.handleAttachment(response))
  }

  public createReportingProfile(data: any): Observable<ReportingProfile> {
    return this.http
      .post<ReportingProfile>(API_URL + "api/web/reportingprofiles", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Reporting Profile</b>: Created successfully");
          return plainToClass(ReportingProfile, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateReportingProfile(id: string, data: any): Observable<ReportingProfile> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<ReportingProfile>(API_URL + "api/web/reportingprofiles", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Reporting Profile</b>: Updated successfully");
          return plainToClass(ReportingProfile, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateSubscriptionSettings(id: string, settings: any): Observable<Subscription> {
    let body = {
      "settings": settings
    };
    return this.http
      .patch<Subscription>(API_URL + `api/web/subscriptions?id=${id}`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Subscription</b>: Settings updated successfully");
          return plainToClass(Subscription, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public get1000Notifications(): Observable<Notification[]> {
    return this.http
      .get<PageResult<Notification>>(API_URL + `api/web/notifications?limit=1000&sort=createdAt.DESC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<Notification>(Notification), response);
          let notificationsList = (paginated && paginated.results) || [];
          return notificationsList.filter(
            notification => notification.acknowledgeable);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public acknowledgeNotification(id: string): Observable<boolean> {
    return this.http
      .post<boolean>(API_URL + `api/web/notifications/${id}/acknowledge`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getNotificationSettingsTypes(): Observable<NotificationType[]> {
    return this.http
      .get<NotificationType[]>(API_URL + `api/web/notificationsettings/types`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(NotificationType, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getNotificationSettingsList(): Observable<NotificationSettingsList> {
    return this.http
      .get<NotificationSettingsList>(API_URL + `api/web/notificationsettings`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          const list = plainToClass<NotificationSettings, any>(NotificationSettings, response);
          return new NotificationSettingsList(list);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getReport_ReadyValidSettingsFor(entityId: string): Observable<any> {
    return this.http
      .get<NotificationSettingsList>(API_URL + `api/web/notificationsettings/validsettings/Report_Ready/${entityId}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let result = [];
          Object.keys(response["reportNames"]).map(function (key, index) {
            let reportName = key;
            let fileTypes = response["reportNames"][reportName]["fileTypes"];
            result.push({
              "reportName": reportName,
              "fileTypes": fileTypes
            });
          });
          return result;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public deleteNotificationSettings(id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/notificationsettings/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Notification Settings</b>: Entry removed successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createNotificationSettings(data: any): Observable<NotificationSettings> {
    return this.http
      .post<NotificationSettings>(API_URL + "api/web/notificationsettings", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Notification Settings</b>: Entry added successfully");
          return plainToClass(NotificationSettings, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateNotificationSettings(createdNotificationSettingId: string, data: any): Observable<NotificationSettings> {
    return this.http
      .patch<NotificationSettings>(API_URL + `api/web/notificationsettings/${createdNotificationSettingId}`, data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Notification Settings</b>: Entry updated successfully");
          return plainToClass(NotificationSettings, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Company` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `name.DESC`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<Company>>} An `Observable` of the paginated result of `Company`s
   * @memberof RestService
   */
  public getAllCompanies(params: FilterParams, limit: number = 10): Observable<PageResult<Company>> {
    return this.http
      .get<PageResult<Company>>(API_URL + `api/web/admin/companies?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Company>(Company), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * We can bypass setting up `X-Auth-AsUser` header within `RestInterceptor` anytime since we will not
   * Login As admin from other users.
   */
  public get1000Companies(): Observable<Company[]> {
    const options = {
      headers: httpInterceptedOptions.headers.set('x-bypass-interceptor', 'true')
    }
    return this.http
      .get<Company[]>(API_URL + `api/web/admin/companies?limit=1000&page=1&sort=name.ASC`, options)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Company>(Company), response).results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getAllPricingScheme(): Observable<string[]> {
    return this.http.get<string[]>(API_URL + `api/web/admin/pricing-scheme`, getHttpInterceptedOptions)
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public updatePricingScheme(companyId: string, selectedPricingScheme: string): Observable<any> {
    let body = { "pricingSchema": selectedPricingScheme };
    return this.http
      .patch<any>(API_URL + `api/web/admin/companies/${companyId}/pricing-schema`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Company</b>: Pricing scheme updated successfully");
          return response;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public toggleCameraOnly(companyId: string): Observable<Company> {
    return this.http
      .patch<Company>(API_URL + `api/web/admin/companies/${companyId}/camera-only`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Company</b>: Camera Only updated successfully");
          return plainToClass(Company, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createCompany(companyData: any, userData: any): Observable<Company> {
    let data = {
      company: companyData,
      user: {
        ...userData,
        username: userData.email
      }
    }

    return this.http
      .post<Company>(API_URL + "api/web/admin/companies", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Company</b>: Company added successfully");
          return plainToClass(Company, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getCompany(): Observable<Company> {
    return this.http
      .get<Company>(API_URL + 'api/web/company', getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Company, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * We can bypass setting up `X-Auth-AsUser` header within `RestInterceptor` anytime since we will not
   * Login As admin from other users.
   */
  public getCompanyBy(id: string): Observable<Company> {
    const options = {
      headers: httpInterceptedOptions.headers.set('x-bypass-interceptor', 'true')
    }
    return this.http
      .get<Company>(API_URL + `api/web/admin/companies/${id}`, options)
      .pipe(
        map(response => {
          return plainToClass(Company, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public updateCompany(id: string, data: any): Observable<Company> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<Company>(API_URL + "api/web/company", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Company</b>: Updated successfully");
          return plainToClass(Company, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of 10 `DispatchGroup` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `name.DESC` or `createdAt.ASC`
   * @returns {Observable<PageResult<DispatchGroup>>} An `Observable` of the paginated result of `DispatchGroup`s
   * @memberof RestService
   */
  public getAllDispatchGroups(params: FilterParams): Observable<PageResult<DispatchGroup>> {
    return this.http
      .get<PageResult<DispatchGroup>>(API_URL + `api/web/dispatchgroups?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<DispatchGroup>(DispatchGroup), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000DispatchGroups(): Observable<DispatchGroup[]> {
    return this.http
      .get<PageResult<DispatchGroup>>(API_URL + `api/web/dispatchgroups?limit=1000&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<DispatchGroup>(DispatchGroup), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000DispatchGroupsLight(): Observable<DispatchGroup[]> {
    return this.http
      .get<PageResult<DispatchGroup>>(API_URL + `api/web/dispatchgroups/light?limit=1000&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<DispatchGroup>(DispatchGroup), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000VehicleTypes(): Observable<VehicleType[]> {
    return this.http
      .get<PageResult<VehicleType>>(API_URL + `api/web/vehicletypes?limit=1000&sort=type.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<VehicleType>(VehicleType), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000VehicleTypesLight(): Observable<VehicleType[]> {
    return this.http
      .get<PageResult<VehicleType>>(API_URL + `api/web/vehicletypes/light?limit=1000&sort=type.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<VehicleType>(VehicleType), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public createDispatchGroup(data: any): Observable<DispatchGroup> {
    let body = {
      name: data.name
    };
    return this.http
      .post<DispatchGroup>(API_URL + "api/web/dispatchgroups", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Dispatch Group</b>: Created successfully");
          return plainToClass(DispatchGroup, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateDispatchGroup(id: string, data: any): Observable<DispatchGroup> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<DispatchGroup>(API_URL + `api/web/dispatchgroups/${id}`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Dispatch Group</b>: Updated successfully");
          return plainToClass(DispatchGroup, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public unassignDispatchGroupFromDriver(driverId: string, id: string): Observable<boolean> {
    return this.http
      .request<boolean>("UNLINK", API_URL + `api/web/drivers/${driverId}/dispatchgroup/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Driver</b>: Dispatch Group unassigned successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignDispatchGroupToDriver(driverId: string, id: string): Observable<Driver> {
    return this.http
      .request<Driver>("LINK", API_URL + `api/web/drivers/${driverId}/dispatchgroup/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Driver</b>: Dispatch Group assigned successfully");
          return plainToClass(Driver, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public unassignDispatchGroupFromVehicle(vehicleId: string, id: string): Observable<boolean> {
    return this.http
      .request<boolean>("UNLINK", API_URL + `api/web/vehicles/${vehicleId}/dispatchgroup/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Dispatch Group unassigned successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignDispatchGroupToVehicle(vehicleId: string, id: string): Observable<Vehicle> {
    return this.http
      .request<Vehicle>("LINK", API_URL + `api/web/vehicles/${vehicleId}/dispatchgroup/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Dispatch Group assigned successfully");
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public unassignVehicleTypeFromVehicle(vehicleId: string, id: string): Observable<boolean> {
    return this.http
      .request<boolean>("UNLINK", API_URL + `api/web/vehicles/${vehicleId}/vehicletype/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Vehicle Type unassigned successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignVehicleTypeToVehicle(vehicleId: string, id: string): Observable<Vehicle> {
    return this.http
      .request<Vehicle>("LINK", API_URL + `api/web/vehicles/${vehicleId}/vehicletype/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Vehicle Type assigned successfully");
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of 10 `FeedbackType` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `type.DESC` or `createdAt.ASC`
   * @returns {Observable<PageResult<FeedbackType>>} An `Observable` of the paginated result of `FeedbackType`s
   * @memberof RestService
   */
  public getAllFeedbackTypes(params: FilterParams): Observable<PageResult<FeedbackType>> {
    return this.http
      .get<PageResult<FeedbackType>>(API_URL + `api/web/dispatching/feedback-types?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<FeedbackType>(FeedbackType), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000FeedbackTypes(): Observable<FeedbackType[]> {
    return this.http
      .get<FeedbackType[]>(API_URL + `api/web/dispatching/feedback-types?limit=1000&page=1&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<FeedbackType>(FeedbackType), response).results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public createFeedbackType(data: any): Observable<FeedbackType> {
    let body = {
      name: data.name,
      type: data.type
    };
    return this.http
      .post<FeedbackType>(API_URL + "api/web/dispatching/feedback-types", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Feedback Type</b>: Created successfully");
          return plainToClass(FeedbackType, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateFeedbackType(id: string, data: any): Observable<FeedbackType> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<FeedbackType>(API_URL + `api/web/dispatching/feedback-types/${id}`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Feedback Type</b>: Updated successfully");
          return plainToClass(FeedbackType, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of 10 `VehicleType` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `type.DESC` or `createdAt.ASC`
   * @returns {Observable<PageResult<VehicleType>>} An `Observable` of the paginated result of `VehicleType`s
   * @memberof RestService
   */
  public getAllVehicleTypes(params: FilterParams): Observable<PageResult<VehicleType>> {
    return this.http
      .get<PageResult<VehicleType>>(API_URL + `api/web/vehicletypes?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<VehicleType>(VehicleType), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public createVehicleType(data: any): Observable<VehicleType> {
    let body = {
      type: data.type,
      description: data.description,
      volume: data.volume,
      capacity: data.capacity,
      tareWeight: data.tareWeight,
    };
    return this.http
      .post<VehicleType>(API_URL + "api/web/vehicletypes", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle Type</b>: Created successfully");
          return plainToClass(VehicleType, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateVehicleType(id: string, data: any): Observable<VehicleType> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<VehicleType>(API_URL + `api/web/vehicletypes/${id}`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle Type</b>: Updated successfully");
          return plainToClass(VehicleType, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public addSource(sourceToken: string): Observable<Company> {
    let body = {
      "source": sourceToken
    };
    return this.http
      .post<Company>(API_URL + "api/web/company/addsource", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Company</b>: Billing Information updated successfully");
          return plainToClass(Company, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public setDefaultReportingProfile(reportingProfileId: string): Observable<Company> {
    return this.http
      .patch<Company>(API_URL + `api/web/company/setdefaultreportingprofile/${reportingProfileId}`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Company</b>: Default Reporting Profile was set successfully");
          return plainToClass(Company, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `FuelTransaction` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort query parameter, e.g. `transactionId.ASC`
   * @param {number} [limit=10] amount of instances to fetch
   * @param {string} [entityId=null] entity ID to fetch transactions for, use `null` to fetch transactions for the entire Company
   * @returns {Observable<PageResult<FuelTransaction>>} An `Observable` of the paginated result of `FuelTransaction`s
   * @memberof RestService
   */
  public getAllFuelTransactions(params: FilterParams, limit: number = 10, entityId: string = null): Observable<PageResult<FuelTransaction>> {
    let entityURI = !!entityId ? `reportingProfileId=${entityId}&` : "";
    return this.http
      .get<PageResult<FuelTransaction>>(API_URL + `api/web/fuel?${entityURI}limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<FuelTransaction>(FuelTransaction), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getAllVehicleFuelTransactions(vehicleId: string, params: FilterParams, limit: number = 10): Observable<PageResult<FuelTransaction>> {
    return this.http
      .get<PageResult<FuelTransaction>>(API_URL + `api/web/vehicles/${vehicleId}/fuel?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<FuelTransaction>(FuelTransaction), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getFuelStatistics(entityId: string): Observable<FuelStatistics> {
    return this.http
      .get<PageResult<FuelStatistics>>(API_URL + `api/web/fuel/stats/${entityId}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(FuelStatistics, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getFuelStations(page: number = 1, limit: number = 10, coordinates?: number[]): Observable<PageResult<FuelStation>> {
    let queryParams = ``;
    if (coordinates) {
      queryParams += `&latitude=${coordinates[1]}&longitude=${coordinates[0]}`;
    }
    return this.http.get<PageResult<FuelStation>>(API_URL + `api/web/fuel/stations?page=${page}&limit=${limit}${queryParams}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<FuelStation>(FuelStation), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get10000FuelStations(coordinates: number[] = null, radius: number = null): Observable<PageResult<FuelStation>> {
    let queryParams = ``;
    if (coordinates) {
      queryParams += `&latitude=${coordinates[1]}&longitude=${coordinates[0]}`;
      if (radius) {
        queryParams += `&radius=${radius}`;
      }
    }
    return this.http.get<PageResult<FuelStation>>(API_URL + `api/web/fuel/stations?page=1&limit=10000${queryParams}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<FuelStation>(FuelStation), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `MaintenanceIssue` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `number.DESC` or `status.ASC`
   * @param {number} limit amount of instances to fetch
   * @param {FilterIssues} filters issue filter parameters
   * @returns {Observable<PageResult<MaintenanceIssue>>} An `Observable` of the paginated result of `MaintenanceIssue`s
   * @memberof RestService
   */
  public getAllMaintenanceIssues(params: FilterParams, limit: number = 10, filters: FilterIssues): Observable<PageResult<MaintenanceIssue>> {
    let filtering = "";
    if (filters.issueNum) {
      filtering += `&issueNum=${filters.issueNum}`;
    }
    if (filters.issueSourceType) {
      filtering += `&issueSourceType=${filters.issueSourceType}`;
    }
    if (filters.issueStatus) {
      filtering += `&issueStatus=${filters.issueStatus}`;
    }
    if (filters.vehicleId) {
      filtering += `&vehicleId=${filters.vehicleId}`;
    }
    if (filters.workOrderId) {
      filtering += `&workOrderId=${filters.workOrderId}`;
    }

    return this.http
      .get<PageResult<MaintenanceIssue>>(API_URL + `api/web/maintenance/issues?limit=${limit}&page=${params.page}&sort=${params.sort}${filtering}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<MaintenanceIssue>(MaintenanceIssue), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000MaintenanceIssues(vehicleId: string = null): Observable<MaintenanceIssue[]> {
    let vehiclePart = !!vehicleId ? `&vehicleId=${vehicleId}` : '';
    return this.http
      .get<MaintenanceIssue[]>(API_URL + `api/web/maintenance/issues?limit=1000&page=1&sort=number.ASC${vehiclePart}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let pageResult: PageResult<MaintenanceIssue> = plainToClassFromExist(new PageResult<MaintenanceIssue>(MaintenanceIssue), response);
          return pageResult.results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getMaintenanceIssue(id): Observable<MaintenanceIssue> {
    return this.http
      .get<MaintenanceIssue>(API_URL + `api/web/maintenance/issues/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(MaintenanceIssue, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public createMaintenanceIssue(data: any): Observable<MaintenanceIssue> {
    const body = {
      vehicle: {
        id: data.vehicleId
      },
      description: data.description
    }

    return this.http
      .post<MaintenanceIssue>(API_URL + "api/web/maintenance/issues", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Issue</b>: Created successfully");
          return plainToClass(MaintenanceIssue, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getMaintenanceIssueByNumber(number): Observable<MaintenanceIssue> {
    return this.http
      .get<MaintenanceIssue>(API_URL + `api/web/maintenance/issue-details/${number}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(MaintenanceIssue, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public setMaintenanceIssueStatus(id: string, status: IssueStatus): Observable<MaintenanceIssue> {
    return this.http
      .patch<MaintenanceIssue>(API_URL + `api/web/maintenance/issues/${id}/${status}`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Issue</b>: Status changed");
          return plainToClass(MaintenanceIssue, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateMaintenanceIssueComments(issueId: string, comments: string) {
    let body = {
      "comments": !!comments ? comments : ""
    };

    return this.http
      .patch<MaintenanceIssue>(API_URL + `api/web/maintenance/issues-attributes/${issueId}/comments`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Issue</b>: Comments updated");
          return plainToClass(MaintenanceIssue, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignIssueToWorkOrder(orderId: string, issueId: string): Observable<WorkOrder> {
    return this.http
      .request<WorkOrder>("LINK", API_URL + `api/web/maintenance/work-orders/${orderId}/attach/${issueId}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Work Order</b>: Issue assigned successfully");
          return plainToClass(WorkOrder, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignWorkOrderToUser(orderId: string, userId: string): Observable<WorkOrder> {
    return this.http
      .request<WorkOrder>("LINK", API_URL + `api/web/maintenance/work-orders/${orderId}/user/${userId}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Work Order</b>: User assigned successfully");
          return plainToClass(WorkOrder, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public unassignWorkOrderFromUser(orderId: string): Observable<WorkOrder> {
    return this.http
      .request<WorkOrder>("UNLINK", API_URL + `api/web/maintenance/work-orders/${orderId}/user`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Work Order</b>: User unassigned successfully");
          return plainToClass(WorkOrder, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * IMPORTANT: as default ordering utilized `firstName.asc` logic, which is utilized in the `MaintenanceWorkOrderViewComponent`.
   * In case of adjustments - need to refactor logic to avoid behavior change.
   */
  public get1000Users(): Observable<User[]> {
    return this.http
      .get<PageResult<User>>(API_URL + `api/web/users?limit=1000&page=1&sort=firstName.asc`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<User>(User), response).results
            .map(user => {
              user.searchAgainst = `${user.name()} (${user.email})`;
              return user;
            });
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * IMPORTANT: as default ordering utilized `firstName.asc` logic, which is utilized in the `AdminCompanyUsersComponent`.
   * In case of adjustments - need to refactor logic to avoid behavior change.
   */
  public get1000AdminUsersFor(companyId: string): Observable<User[]> {
    return this.http
      .get<PageResult<User>>(API_URL + `api/web/admin/users/list?limit=1000&page=1&sort=firstName.asc&companyId=${companyId}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<User>(User), response).results
            .map(user => {
              user.searchAgainst = `${user.name()} (${user.email})`;
              return user;
            });
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public unassignIssueFromWorkOrder(orderId: string, issueId: string): Observable<WorkOrder> {
    return this.http
      .request<WorkOrder>("UNLINK", API_URL + `api/web/maintenance/work-orders/${orderId}/attach/${issueId}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Work Order</b>: Issue unassigned successfully");
          return plainToClass(WorkOrder, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public downloadWorkOrderById(id: string, type: string): Observable<Blob> {
    return this.http
      .get(API_URL + `api/web/maintenance/work-orders/${id}/${type}`, { headers: tokenIntercepted(), responseType: 'blob' })
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `WorkOrder` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `number.DESC` or `status.ASC`
   * @param {number} [limit=10] amount of instances to fetch
   * @param {string} [vehicleId=null] vehicle based filter
   * @returns {Observable<PageResult<WorkOrder>>} An `Observable` of the paginated result of `WorkOrder`s
   * @memberof RestService
   */
  public getAllWorkOrders(params: FilterParams, limit: number = 10, vehicleId: string = null): Observable<PageResult<WorkOrder>> {
    let vehiclePart = !!vehicleId ? `&vehicleId=${vehicleId}` : '';
    return this.http
      .get<PageResult<WorkOrder>>(API_URL + `api/web/maintenance/work-orders?limit=${limit}&page=${params.page}&sort=${params.sort}${vehiclePart}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<WorkOrder>(WorkOrder), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000WorkOrdersByVehicle(vehicleId: string): Observable<WorkOrder[]> {
    let params: FilterParams = new FilterParams(1, `number.ASC`);
    return this.getAllWorkOrders(params, 1000, vehicleId).pipe(
      map(
        pageResult => {
          return pageResult.results;
        }
      )
    )
  }

  public getWorkOrder(id): Observable<WorkOrder> {
    return this.http
      .get<WorkOrder>(API_URL + `api/web/maintenance/work-orders/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(WorkOrder, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public createWorkOrder(vehicleId: string): Observable<WorkOrder> {
    const data = {
      vehicle: {
        id: vehicleId
      }
    }
    return this.http
      .post<WorkOrder>(API_URL + "api/web/maintenance/work-orders", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Work Order</b>: Created successfully");
          return plainToClass(WorkOrder, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public closeWorkOrder(id: string): Observable<WorkOrder> {
    const toStatus = RepairOrderStatus.CLOSED;
    return this.http
      .patch<WorkOrder>(API_URL + `api/web/maintenance/work-orders/${id}/${toStatus}`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Work Order</b>: Marked as closed");
          return plainToClass(WorkOrder, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public get1000WorkOrders(): Observable<WorkOrder[]> {
    return this.http
      .get<WorkOrder[]>(API_URL + `api/web/maintenance/work-orders?limit=1000&page=1&sort=number.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let pageResult: PageResult<WorkOrder> = plainToClassFromExist(new PageResult<WorkOrder>(WorkOrder), response);
          return pageResult.results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getMaintenanceStatistics(): Observable<MaintenanceStatisctics> {
    return this.http
      .get<MaintenanceStatisctics>(API_URL + `api/web/maintenance/statistics`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<MaintenanceStatisctics>(MaintenanceStatisctics), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `FaultRule` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `id.DESC` or `action.ASC`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<FaultRule>>} An `Observable` of the paginated result of `FaultRule`s
   * @memberof RestService
   */
  public getAllFaultRules(params: FilterParams, limit: number = 10): Observable<PageResult<FaultRule>> {
    return this.http
      .get<PageResult<FaultRule>>(API_URL + `api/web/maintenance/engine-fault-rules?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<FaultRule>(FaultRule), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * There is no API to fetch `FaultRule` by ID, workaround with `getAllFaultRules()`.
   *
   * @param {string} id Fault Rule's ID
   * @returns {Observable<FaultRule | null>}
   * @memberof RestService
   */
  public getFaultRule(id: string): Observable<FaultRule> {
    let params: FilterParams = new FilterParams(1, `id.ASC`);
    return this.getAllFaultRules(params, 1000).pipe(
      map(
        pageResult => {
          const rules: FaultRule[] = pageResult.results;
          return rules.find(function (next: FaultRule) {
            return next.id === id;
          });
        })
    )
  }

  public createFaultRule(data: any): Observable<FaultRule> {
    return this.http
      .post<FaultRule>(API_URL + "api/web/maintenance/engine-fault-rules", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Fault Rule</b>: Created successfully");
          return plainToClass(FaultRule, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public deleteFaultRule(id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/maintenance/engine-fault-rules/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Fault Rule</b>: Deleted successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getSPNs(): Observable<SPNDescription[]> {
    return this.http
      .get<SPNDescription[]>(API_URL + `api/web/maintenance/spns`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(SPNDescription, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `MaintenanceGroup` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `id.DESC` or `name.ASC`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<MaintenanceGroup>>} An `Observable` of the paginated result of `MaintenanceGroup`s
   * @memberof RestService
   */
  public getAllMaintenanceGroups(params: FilterParams, limit: number = 10): Observable<PageResult<MaintenanceGroup>> {
    return this.http
      .get<PageResult<MaintenanceGroup>>(API_URL + `api/web/maintenance/groups?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<MaintenanceGroup>(MaintenanceGroup), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000MaintenanceGroups(): Observable<MaintenanceGroup[]> {
    return this.http
      .get<MaintenanceGroup[]>(API_URL + `api/web/maintenance/groups?limit=1000&page=1&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let pageResult: PageResult<MaintenanceGroup> = plainToClassFromExist(new PageResult<MaintenanceGroup>(MaintenanceGroup), response);
          return pageResult.results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public createMaintenanceGroup(data: any): Observable<MaintenanceGroup> {
    return this.http
      .post<MaintenanceGroup>(API_URL + "api/web/maintenance/groups", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Maintenance Group</b>: Created successfully");
          return plainToClass(MaintenanceGroup, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateMaintenanceGroup(id: string, data: any): Observable<MaintenanceGroup> {
    return this.http
      .patch<MaintenanceGroup>(API_URL + `api/web/maintenance/groups/${id}`, data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Maintenance Group</b>: Updated successfully");
          return plainToClass(MaintenanceGroup, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public deleteMaintenanceGroup(id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/maintenance/groups/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Maintenance Group</b>: Deleted successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignMaintenanceGroupsToVehicle(vehicleId: string, groupIds: string[]): Observable<Vehicle> {
    let body = {
      "groups": groupIds.map(id => {
        return {
          "id": id
        }
      })
    };
    let options: any = getHttpInterceptedOptions;
    options.body = body;
    return this.http
      .request<Vehicle>("LINK", API_URL + `api/web/maintenance/groups/${vehicleId}/manygroups`, options)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Selected Maintenance Groups assigned successfully");
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public unassignMaintenanceGroupsFromVehicle(vehicleId: string, groupIds: string[]): Observable<Vehicle> {
    let body = {
      "groups": groupIds.map(id => {
        return {
          "id": id
        }
      })
    };
    let options: any = getHttpInterceptedOptions;
    options.body = body;
    return this.http
      .request<Vehicle>("UNLINK", API_URL + `api/web/maintenance/groups/${vehicleId}/manygroups`, options)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Vehicle</b>: Unselected Maintenance Groups unassigned successfully");
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignVehiclesToMaintenanceGroup(groupId: string, vehicleIds: string[]): Observable<MaintenanceGroup> {
    let body = {
      "vehicles": vehicleIds.map(id => {
        return {
          "id": id
        }
      })
    };
    let options: any = getHttpInterceptedOptions;
    options.body = body;
    return this.http
      .request<MaintenanceGroup>("LINK", API_URL + `api/web/maintenance/groups/${groupId}/manyvehicles`, options)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Maintenance Group</b>: Selected Vehicles assigned successfully");
          return plainToClass(MaintenanceGroup, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public unassignVehiclesFromMaintenanceGroup(groupId: string, vehicleIds: string[]): Observable<MaintenanceGroup> {
    let body = {
      "vehicles": vehicleIds.map(id => {
        return {
          "id": id
        }
      })
    };
    let options: any = getHttpInterceptedOptions;
    options.body = body;
    return this.http
      .request<MaintenanceGroup>("UNLINK", API_URL + `api/web/maintenance/groups/${groupId}/manyvehicles`, options)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Maintenance Group</b>: Unselected Vehicles unassigned successfully");
          return plainToClass(MaintenanceGroup, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `MaintenanceItem` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `name.DESC` or `type.ASC`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<MaintenanceItem>>} An `Observable` of the paginated result of `MaintenanceItem`s
   * @memberof RestService
   */
  public getAllMaintenanceItems(params: FilterParams, limit: number = 10): Observable<PageResult<MaintenanceItem>> {
    return this.http
      .get<PageResult<MaintenanceItem>>(API_URL + `api/web/maintenance/scheduled-maintenance-items?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<MaintenanceItem>(MaintenanceItem), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * There is no API to fetch `MaintenanceItem` by ID, workaround with `getAllMaintenanceItems()`.
   *
   * @param {string} id Maintenance Item's ID
   * @returns {Observable<MaintenanceItem | null>}
   * @memberof RestService
   */
  public getMaintenanceItem(id: string): Observable<MaintenanceItem> {
    let params: FilterParams = new FilterParams(1, `id.ASC`);
    return this.getAllMaintenanceItems(params, 1000).pipe(
      map(
        pageResult => {
          const items: MaintenanceItem[] = pageResult.results;
          return items.find(function (next: MaintenanceItem) {
            return next.id === id;
          });
        })
    )
  }

  public createMaintenanceItem(data: any): Observable<MaintenanceItem> {
    return this.http
      .post<MaintenanceItem>(API_URL + "api/web/maintenance/scheduled-maintenance-items", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Maintenance Item</b>: Created successfully");
          return plainToClass(MaintenanceItem, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public deleteMaintenanceItem(id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/maintenance/scheduled-maintenance-items/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Maintenance Item</b>: Deleted successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateMaintenanceItem(id: string, data: any): Observable<MaintenanceItem> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<MaintenanceItem>(API_URL + `api/web/maintenance/scheduled-maintenance-items/${id}`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Maintenance Item</b>: Updated successfully");
          return plainToClass(MaintenanceItem, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `MaintenanceItemProgress` instances.
   *
   * @param {number} page page number, which starts from `1`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<MaintenanceItemProgress>>} An `Observable` of the paginated result of `MaintenanceItemProgress`s
   * @memberof RestService
   */
  public getAllMaintenanceItemsProgress(vehicleId: string, page: number, limit: number = 10): Observable<PageResult<MaintenanceItemProgress>> {
    return this.http
      .get<PageResult<MaintenanceItemProgress>>(API_URL + `api/web/maintenance/scheduled-maintenance-items-progress/${vehicleId}?limit=${limit}&page=${page}&sort=createdAt.DESC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<MaintenanceItemProgress>(MaintenanceItemProgress), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public updateMaintenanceItemProgress(vehicleId: string, itemId: string, initialValueDateTime: string): Observable<MaintenanceItemProgress> {
    let body = {
      "scheduledMaintenanceItem": {
        "id": itemId
      },
      "initialValueDateTime": initialValueDateTime
    };
    return this.http
      .patch<MaintenanceItemProgress>(API_URL + `api/web/maintenance/scheduled-maintenance-items-progress/${vehicleId}`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Maintenance Progress</b>: Updated successfully");
          return plainToClass(MaintenanceItemProgress, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getScheduledMaintenanceDashboard() {
    return this.http
      .get<PageResult<ScheduledDashboardItem>>(API_URL + 'api/web/maintenance/scheduled-maintenance-dashboard?limit=1000', getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<ScheduledDashboardItem>(ScheduledDashboardItem), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `DriveAlert` instances based on provided filter options.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `createdAt.DESC` or `type.ASC`
   * @param {FilterAlertOption} filters  the filter options
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<DriveAlert>>} An `Observable` of the paginated result of `DriveAlert`s
   * @memberof RestService
   */
  public getAllDriveAlerts(params: FilterParams, filters: FilterAlertOption, limit: number = 10): Observable<PageResult<DriveAlert>> {
    let queryParams = "";
    if (filters.selectedVehicleId) {
      queryParams += `&vehicleId=${filters.selectedVehicleId}`;
    }
    if (filters.selectedDriverId) {
      queryParams += `&driverId=${filters.selectedDriverId}`;
    }
    if (filters.reviewed) {
      queryParams += `&reviewed=${filters.reviewed}`;
    }
    if (filters.status) {
      queryParams += `&status=${filters.status}`;
    }
    if (filters.sentToDriver) {
      queryParams += `&sentToDriver=${filters.sentToDriver}`;
    }
    if (filters.coachingCompleted) {
      queryParams += `&coachingCompleted=${filters.coachingCompleted}`;
    }

    return this.http
      .get<PageResult<DriveAlert>>(API_URL + `api/web/drive-alerts?limit=${limit}&page=${params.page}&sort=${params.sort}${queryParams}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<DriveAlert>(DriveAlert), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getDriveAlert(id: string): Observable<DriveAlert> {
    return this.http
      .get<DriveAlert>(API_URL + `api/web/drive-alerts/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(DriveAlert, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000DriveAlertComments(alertId: string): Observable<DriveAlertComment[]> {
    return this.http
      .get<DriveAlertComment[]>(API_URL + `api/web/drive-alerts/${alertId}/comments?limit=1000&page=1&sort=createdAt.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let pageResult: PageResult<DriveAlertComment> = plainToClassFromExist(new PageResult<DriveAlertComment>(DriveAlertComment), response);
          return pageResult.results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public deleteDriveAlertComment(alertId: string, id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/drive-alerts/${alertId}/comments/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Comment</b>: Comment deleted successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createDriveAlertComment(alertId: string, comment: string): Observable<DriveAlertComment> {
    let body = {
      "comment": comment
    }
    return this.http
      .post<DriveAlertComment>(API_URL + `api/web/drive-alerts/${alertId}/comments`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Comment</b>: Created successfully");
          return plainToClass(DriveAlertComment, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateDriveAlertComment(alertId: string, id: string, comment: string): Observable<DriveAlertComment> {
    let body = {
      "comment": comment
    };
    return this.http
      .patch<DriveAlertComment>(API_URL + `api/web/drive-alerts/${alertId}/comments/${id}`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Comment</b>: Updated successfully");
          return plainToClass(DriveAlertComment, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of ``Video Request` instances based on provided filter options.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `createdAt.DESC` or `type.ASC`
   * @param {RequestVideoOption} filters  the filter options
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<any>>} An `Observable` of the paginated result of `Video Request`s
   * @memberof RestService
   */

  //  TODO: change any
  public getRequiredVideo(params: FilterParams, filters: RequestVideoOption, limit: number = 10): Observable<DriveAlert> {
    let queryParams = "";
    if (filters.status !== 'all') {
      queryParams += `&status=${filters.status}`;
    }
    return this.http
      .get<DriveAlert>(API_URL + `api/web/vehicle-video-request?limit=${limit}&page=${params.page}${queryParams}`, getHttpInterceptedOptions)
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public requestVideo(data: any): Observable<DriveAlert> {
    return this.http
      .post<DriveAlert>(API_URL + `api/web/vehicle-video-request`, data, getHttpInterceptedOptions)
      .pipe(
        tap(() => {
          this.notifySuccess("<b>Video Request</b>: Created successfully");
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getVehicleVideoRequestPeriod(vehicleId: string): Observable<any> {
    return this.http.get<boolean>(API_URL + `api/web/vehicle-video-request/vehicle/${vehicleId}/period`, getHttpInterceptedOptions)
  }

  public markAlertReviewed(id: string): Observable<DriveAlert> {
    return this.http
      .patch<DriveAlert>(API_URL + `api/web/drive-alerts/${id}/reviewed`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Safety Alert</b>: Marked reviewed");
          return plainToClass(DriveAlert, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public markAlertNotReviewed(id: string): Observable<DriveAlert> {
    return this.http
      .delete<DriveAlert>(API_URL + `api/web/drive-alerts/${id}/reviewed`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Safety Alert</b>: Marked not reviewed");
          return plainToClass(DriveAlert, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignAlertDriver(alertId: string, driverId: string): Observable<DriveAlert> {
    let body = {
      "driver": {
        "id": driverId
      }
    };
    return this.http
      .patch<DriveAlert>(API_URL + `api/web/drive-alerts/${alertId}`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Safety Alert</b>: Assigned driver");
          return plainToClass(DriveAlert, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public markAlertCoachable(id: string): Observable<DriveAlert> {
    return this.http
      .patch<DriveAlert>(API_URL + `api/web/drive-alerts/${id}/coachable`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Safety Alert</b>: Marked coachable");
          return plainToClass(DriveAlert, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public markAlertNotCoachable(id: string): Observable<DriveAlert> {
    return this.http
      .delete<DriveAlert>(API_URL + `api/web/drive-alerts/${id}/coachable`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Safety Alert</b>: Marked not coachable");
          return plainToClass(DriveAlert, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public markAlertNotApplicable(id: string): Observable<DriveAlert> {
    let body = {
      "status": DriveAlertStatus.NOT_APPLICABLE
    };
    return this.http
      .patch<DriveAlert>(API_URL + `api/web/drive-alerts/${id}`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Safety Alert</b>: Marked not applicable");
          return plainToClass(DriveAlert, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  // request for creating a coachable event of alert
  public makeTraining(driverAlertId: string, data: any): Observable<any> {
    return this.http
      .post<any>(API_URL + `api/web/drive-alerts/${driverAlertId}/makeTraining`, data, getHttpInterceptedOptions)
      .pipe(
        tap(() => this.notifySuccess("<b>Safety Alert</b>: Training is made")),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  // request for creating a coachable event of alert
  public getDriverSignature(driveAlertId: string) {
    return this.http
      .get<Blob>(API_URL + `api/web/drive-alerts/${driveAlertId}/training-driver-signature`, {
        ...getHttpInterceptedOptions, responseType: 'blob' as 'json' })
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  // request for downloading pdf with coaching session
  public downloadCoachingSessionPdf(driveAlertId: string) {
    return this.http.get(API_URL + `api/web/drive-alerts/${driveAlertId}/coaching-session/PDF`, getReportOptions).pipe(
      catchError((response: HttpErrorResponse) => this.handleError(response))
    ).subscribe(res => this.handleAttachment(res, 'coaching-session.pdf'));
  }

  /**
   * Fetches `SafetyDashboard` data based on provided filter options.
   *
   * @param {FilterSafetyDashboard} filters the filter options
   * @returns {Observable<SafetyDashboard>} An `Observable` of `SafetyDashboard`
   * @memberof RestService
   */
  public getSafetyDashboard(filters: FilterSafetyDashboard): Observable<SafetyDashboard> {
    let queryParams = "";
    if (filters.reportingProfileId) {
      queryParams += `&reportingProfileId=${filters.reportingProfileId}`;
    }
    if (filters.dispatchGroupId) {
      queryParams += `&dispatchGroupId=${filters.dispatchGroupId}`;
    }

    return this.http
      .get<SafetyDashboard>(API_URL + `api/web/drive-alerts/dashboard?${queryParams}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let result: SafetyDashboard = plainToClass(SafetyDashboard, response);
          result.fillGaps();
          return result;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Fetches `DriveAlertHistogram` data for the specified `driverId`.
   *
   * @param driverId the driver ID
   * @returns {Observable<DriveAlertHistogram>} An `Observable` of `DriveAlertHistogram`
   * @memberof RestService
   */
  public getDriveAlertHistogram(driverId: string): Observable<DriveAlertHistogram> {
    return this.http
      .get<DriveAlertHistogram>(API_URL + `api/web/drivers/${driverId}/drive-alert-histogram`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let result: DriveAlertHistogram = plainToClass(DriveAlertHistogram, response);
          result.fillDisplayable();
          return result;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Device` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort query parameter, e.g. `iccid.ASC`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<Device>>} An `Observable` of the paginated result of `Device`s
   * @memberof RestService
   */
  public getAllDevices(params: FilterParams, limit: number = 10): Observable<PageResult<Device>> {
    return this.http
      .get<PageResult<Device>>(API_URL + `api/web/devices?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Device>(Device), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000DevicesForVehicle(vehicleId: string): Observable<Device[]> {
    return this.http
      .get<PageResult<Device>>(API_URL + `api/web/devices/vehicle/${vehicleId}?limit=1000&page=1&sort=iccid.DESC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let pageResult: PageResult<Device> = plainToClassFromExist(new PageResult<Device>(Device), response);
          return pageResult.results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000DevicesForDriver(driverId: string): Observable<Device[]> {
    return this.http
      .get<PageResult<Device>>(API_URL + `api/web/devices/driver/${driverId}?limit=1000&page=1&sort=iccid.DESC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let pageResult: PageResult<Device> = plainToClassFromExist(new PageResult<Device>(Device), response);
          return pageResult.results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000Devices(): Observable<Device[]> {
    return this.http
      .get<PageResult<Device>>(API_URL + `api/web/devices?limit=1000&page=1&sort=iccid.DESC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let pageResult: PageResult<Device> = plainToClassFromExist(new PageResult<Device>(Device), response);
          return pageResult.results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getDevice(id: string): Observable<Device> {
    return this.http
      .get<Device>(API_URL + `api/web/devices/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Device, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getDeviceValidOperationalStatuses(): Observable<string[]> {
    return this.http
      .get<string[]>(API_URL + "api/web/devices/valid-operational-statuses", getHttpInterceptedOptions)
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getAdminDevice(id: string): Observable<Device> {
    return this.http
      .get<Device>(API_URL + `api/web/admin/devices/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Device, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public deactivateAdminDevice(deviceId: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/admin/devices/${deviceId}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Device</b>: Deactivated successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public assignDeviceToReportingProfile(deviceId: string, assignData: any): Observable<Device> {
    return this.http
      .patch<Device>(API_URL + `api/web/devices/${deviceId}/assigntoreportingprofile`, assignData, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Device</b>: Assigned successfully");
          return plainToClass(Device, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public deactivateDevice(deviceId: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/devices/${deviceId}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Device</b>: Deactivated successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  // requests for device actions
  public wipeDevice(deviceId: string): Observable<boolean> {
    return this.http
      .patch<Device>(API_URL + `api/common/devices/${deviceId}/wipe`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Device</b>: Wiped successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public enableLostMode(deviceId: string): Observable<boolean> {
    return this.http.patch<Device>(API_URL + `api/common/devices/${deviceId}/enable-lost-mode`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Device</b>: Enabled lost mode successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public disableLostMode(deviceId: string): Observable<boolean> {
    return this.http.patch<Device>(API_URL + `api/common/devices/${deviceId}/disable-lost-mode`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Device</b>: Disabled lost mode successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public powerOff(deviceId: string): Observable<boolean> {
    return this.http.patch<Device>(API_URL + `api/common/devices/${deviceId}/power-off`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Device</b>: Powered off successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public restart(deviceId: string): Observable<boolean> {
    return this.http.patch<Device>(API_URL + `api/common/devices/${deviceId}/restart`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Device</b>: Restarted successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Creates `Device` based on the provided `data`.
   * `data.company` should contain `id` and `pricingScheme` fields.
   */
  public addDevice(data: any): Observable<Device> {
    let body = {
      iccid: data.iccid,
      type: data.type,
      company: data.company,

      token: {
        additionalData: "data",
        duration: "86400s",
        name: "enterprises/LC0117x993/enrollmentTokens/123456",
        oneTimeOnly: false,
        policyName: "enterprises/LC0117x993/policies/truckspymobile-dedicated",
        user: {
          accountIdentifier: "67e0c5af-0890-4b37-87da-9f7c00711769"
        }
      }
    };
    if (!!data.imei) {
      body["imei"] = data.imei;
    }
    if (!!data.serialNumber) {
      body["serialNumber"] = data.serialNumber;
    }

    return this.http
      .post<Device>(API_URL + "api/web/admin/devices", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Device</b>: Device added successfully");
          return plainToClass(Device, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public forceDeviceToVehicle(deviceId: string, vehicleId: string): Observable<Device> {
    return this.forceDeviceToVehiclePrivate(deviceId, vehicleId, false);
  }

  public forceDeviceToVehicleAdmin(deviceId: string, vehicleId: string): Observable<Device> {
    return this.forceDeviceToVehiclePrivate(deviceId, vehicleId);
  }

  private forceDeviceToVehiclePrivate(deviceId: string, vehicleId: string, adminCall: boolean = true): Observable<Device> {
    let body = {
      "forceToVehicle": !!vehicleId ? { "id": vehicleId } : null
    };

    const URI_BASE = adminCall ? "api/web/admin/devices" : "api/web/devices"
    return this.http
      .patch<Device>(API_URL + `${URI_BASE}/${deviceId}`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Device</b>: Device updated successfully");
          return plainToClass(Device, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getAllInvoices(params: FilterParams): Observable<PageResult<Invoice>> {
    return this.http
      .get<PageResult<Invoice>>(API_URL + `api/web/company/invoices?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Invoice>(Invoice), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Invoice` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `amount.DESC`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<Invoice>>} An `Observable` of the paginated result of `Invoice`s
   * @memberof RestService
   */
  public getAllAdminInvoices(params: FilterParams, limit: number = 10): Observable<PageResult<Invoice>> {
    return this.http
      .get<PageResult<Invoice>>(API_URL + `api/web/admin/invoices?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Invoice>(Invoice), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public markInvoiceAsPaid(invoiceId: string): Observable<boolean> {
    return this.http.patch<boolean>(API_URL + `api/web/admin/invoices/${invoiceId}/paid`, null, getHttpInterceptedOptions)
      .pipe(
        map(data => {
          this.notifySuccess("<b>Invoice</b>: Marked as paid");
          return true;
        }),
        catchError(function () {
          return of(false);
        })
      );
  }

  public deleteInvoice(invoiceId: string): Observable<boolean> {
    return this.http.delete<boolean>(API_URL + `api/web/admin/invoices/${invoiceId}`, getHttpInterceptedOptions)
      .pipe(
        map(data => {
          this.notifySuccess("<b>Invoice</b>: Deleted successfully");
          return true;
        }),
        catchError(function () {
          return of(false);
        })
      );
  }

  public chargeInvoice(invoiceId: string): Observable<boolean> {
    return this.http.post<boolean>(API_URL + `api/web/admin/invoices/${invoiceId}/charge`, null, getHttpInterceptedOptions)
      .pipe(
        map(data => {
          this.notifySuccess("<b>Invoice</b>: Charged successfully");
          return true;
        }),
        catchError(function () {
          return of(false);
        })
      );
  }

  public getAllInvoicesFor(companyId: string, params: FilterParams): Observable<PageResult<Invoice>> {
    return this.http
      .get<PageResult<Invoice>>(API_URL + `api/web/admin/companies/${companyId}/invoices?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Invoice>(Invoice), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getAllDiscountsFor(companyId: string, params: FilterParams): Observable<PageResult<Discount>> {
    return this.http
      .get<PageResult<Discount>>(API_URL + `api/web/admin/companies/${companyId}/discounts?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Discount>(Discount), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public deleteDiscount(companyId: string, id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/admin/companies/${companyId}/discounts/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Discount</b>: Discount canceled successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createDiscount(companyId: string, data: any): Observable<Discount> {
    return this.http
      .post<Discount>(API_URL + `api/web/admin/companies/${companyId}/discounts`, data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Discount</b>: Created successfully");
          return plainToClass(Discount, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public get1000AdminDevices(): Observable<Device[]> {
    return this.http
      .get<PageResult<Device>>(API_URL + `api/web/admin/devices?limit=1000&page=1&sort=iccid.DESC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let pageResult: PageResult<Device> = plainToClassFromExist(new PageResult<Device>(Device), response);
          return pageResult.results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public devicesEnable(companyId: string): Observable<boolean> {
    return this.http
      .post<boolean>(API_URL + `api/web/admin/companies/${companyId}/devicesEnabled`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Company</b>: Devices enabled successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public devicesDisable(companyId: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/admin/companies/${companyId}/devicesEnabled`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Company</b>: Devices disabled successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public doCreditAllow(companyId: string): Observable<Company> {
    return this.http
      .patch<Company>(API_URL + `api/web/admin/companies/${companyId}/credit`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Company</b>: Credit updated successfully");
          return plainToClass(Company, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateCompanyBilledOn(companyId: string, date: number): Observable<Company> {
    return this.http
      .patch<Company>(API_URL + `api/web/admin/companies/${companyId}/billed-on/${date}`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Company</b>: Billed on updated successfully");
          return plainToClass(Company, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Customer` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `name.DESC` or `createdAt.ASC`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<Customer>>} An `Observable` of the paginated result of `Customer`s
   * @memberof RestService
   */
  public getAllCustomers(params: FilterParams, limit: number = 10): Observable<PageResult<Customer>> {
    return this.http
      .get<PageResult<Customer>>(API_URL + `api/web/customers?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Customer>(Customer), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000Customers(): Observable<Customer[]> {
    return this.http
      .get<Customer[]>(API_URL + `api/web/customers?limit=1000&page=1&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Customer>(Customer), response).results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getCustomer(id: string): Observable<Customer> {
    return this.http
      .get<Customer>(API_URL + `api/web/customers/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Customer, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public createCustomer(data: any): Observable<Customer> {
    return this.http
      .post<Customer>(API_URL + `api/web/customers`, data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Customer</b>: Created successfully");
          return plainToClass(Customer, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateCustomer(id: string, data: any): Observable<Customer> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<Customer>(API_URL + `api/web/customers/${id}`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Customer</b>: Updated successfully");
          return plainToClass(Customer, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public setCustomerStatus(id: string, active: boolean): Observable<boolean> {
    return this.http
      .patch<boolean>(API_URL + `api/web/customers/${id}/${active ? "activate" : "deactivate"}`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess(`<b>Customer</b>: Made ${active ? "active" : "inactive"} successfully`);
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getAllUsers(params: FilterParams): Observable<PageResult<User>> {
    return this.http
      .get<PageResult<User>>(API_URL + `api/web/users?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<User>(User), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public createUser(data: any): Observable<User> {
    let body = {
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.email,
      email: data.email,
      roles: [data.role]
    };
    return this.http
      .post<User>(API_URL + "api/web/users", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>User</b>: Created successfully");
          return plainToClass(User, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getStatistics(entityId: string, isCompany: boolean, periodType: string, dataSet: string): Observable<Statistics> {
    let entityType = isCompany ? "App\\Entity\\Company" : "App\\Entity\\ReportingProfile";
    return this.http
      .get<Statistics>(API_URL + `api/web/statistics?entityId=${entityId}&entityType=${entityType}&reportPeriodType=${periodType}&dataSetName=${dataSet}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Statistics, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getReportPeriods(): Observable<any[]> {
    // we want to exclude custom
    const CUSTOM = "CUSTOM";
    // we want to exclude intradays as part of https://github.com/truckspy/truckspyui/issues/414
    const INTRADAYS = ["DAY_TO_DATE", "DAY"];

    return this.http
      .get<any[]>(API_URL + "api/web/statistics/reportperiods", getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let result = [];
          Object.keys(response).forEach(key => {
            if (key != CUSTOM && !INTRADAYS.includes(key)) {
              let value = response[key];
              result.push({
                "key": key,
                "value": value
              });
            }
          });
          return result;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getStatisticsDatasets(): Observable<string[]> {
    return this.http
      .get<string[]>(API_URL + "api/web/statistics/datasets", getHttpInterceptedOptions)
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getAllConnections(params: FilterParams): Observable<PageResult<Connection>> {
    return this.http
      .get<PageResult<Connection>>(API_URL + `api/web/connections?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Connection>(Connection), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000Connections(): Observable<Connection[]> {
    return this.http
      .get<Connection[]>(API_URL + `api/web/connections?limit=1000&page=1&sort=createdAt.DESC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let pageResult: PageResult<Connection> = plainToClassFromExist(new PageResult<Connection>(Connection), response);
          return pageResult.results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getConnection(id: string): Observable<Connection> {
    return this.http
      .get<Connection>(API_URL + `api/web/connections/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Connection, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createConnection(data: any): Observable<User> {
    return this.http
      .post<User>(API_URL + "api/web/connections", data, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Connection</b>: Created successfully");
          return plainToClass(User, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateConnection(id: string, data: any): Observable<Connection> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<Connection>(API_URL + "api/web/connections", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Connection</b>: Updated successfully");
          return plainToClass(Connection, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public toggleConnectionStatus(id: string, currentStatus: boolean): Observable<Connection> {
    let body = {
      "id": id,
      "enabled": !currentStatus
    };
    return this.http
      .patch<Connection>(API_URL + "api/web/connections", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Connection</b>: Status changed successfully");
          return plainToClass(Connection, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public testConnection(id: string): Observable<boolean> {
    return this.http.get<any>(API_URL + `api/web/connections/${id}/test`, authOptionsTokenized)
      .pipe(
        map(response => {
          this.notifySuccess(response.message);
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getAllOperationsFor(connectionId: string, params: FilterParams): Observable<PageResult<Operation>> {
    return this.http
      .get<PageResult<Operation>>(API_URL + `api/web/operations/${connectionId}?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Operation>(Operation), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getAllIssuesFor(connectionId: string, params: FilterParams): Observable<PageResult<ConnectionIssue>> {
    return this.http
      .get<PageResult<ConnectionIssue>>(API_URL + `api/web/connections/${connectionId}/issues?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<ConnectionIssue>(ConnectionIssue), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public markIssueSolved(connectionId: string, issueId: string) {
    return this.http.post<ConnectionIssue>(
      API_URL + `api/web/connections/${connectionId}/issues/${issueId}/mark-solved`, null, getHttpInterceptedOptions
    ).pipe(
      map(response => {
        this.notifySuccess("<b>Issue</b>: Marked solved");
        return plainToClass(ConnectionIssue, response);
      }),
      catchError((response: HttpErrorResponse) => this.handleError(response))
    )
  }

  public getAllAdminConnections(params: FilterParams): Observable<PageResult<Connection>> {
    return this.http
      .get<PageResult<Connection>>(API_URL + `api/web/admin/connections?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Connection>(Connection), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000AdminConnections(): Observable<Connection[]> {
    return this.http
      .get<Connection[]>(API_URL + `api/web/admin/connections?limit=1000&page=1&sort=createdAt.DESC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let pageResult: PageResult<Connection> = plainToClassFromExist(new PageResult<Connection>(Connection), response);
          return pageResult.results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getAdminConnection(id: string): Observable<Connection> {
    return this.http
      .get<Connection>(API_URL + `api/web/admin/connections/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Connection, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * We can bypass setting up `X-Auth-AsUser` header within `RestInterceptor` anytime since we will not
   * Login As admin from other users.
   */
  public getAdminVisTracksConnection(companyId: string): Observable<Connection> {
    const options = {
      headers: getHttpInterceptedOptions.headers.set('x-bypass-interceptor', 'true')
    }
    return this.http
      .get<Connection>(API_URL + `api/web/admin/connections/company/${companyId}/active/VisTracks/connection`, options)
      .pipe(
        map(response => {
          return plainToClass(Connection, response);
        }),
        catchError((response: HttpErrorResponse) => {
          // do nothing
          return of(null);
        })
      );
  }

  public updateAdminConnection(id: string, data: any): Observable<Connection> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<Connection>(API_URL + "api/web/admin/connections", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Connection</b>: Updated successfully");
          return plainToClass(Connection, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public toggleAdminConnectionStatus(id: string, currentStatus: boolean): Observable<Connection> {
    let body = {
      "id": id,
      "enabled": !currentStatus
    };
    return this.http
      .patch<Connection>(API_URL + "api/web/admin/connections", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Connection</b>: Status changed successfully");
          return plainToClass(Connection, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public testAdminConnection(id: string): Observable<boolean> {
    return this.http.get<any>(API_URL + `api/web/admin/connections/${id}/test`, authOptionsTokenized)
      .pipe(
        map(response => {
          this.notifySuccess(response.message);
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getAllAdminOperationsFor(connectionId: string, params: FilterParams): Observable<PageResult<Operation>> {
    return this.http
      .get<PageResult<Operation>>(API_URL + `api/web/admin/operations/${connectionId}?limit=10&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Operation>(Operation), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }


  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `User` instances.
   * 
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `name.DESC` or `firstName.ASC`
   * @param {number} limit amount of instances to fetch
   * @param {FilterUsers} filters filter query parameters
   * @returns {Observable<PageResult<User>>} An `Observable` of the paginated result of `User`s
   * @memberof RestService
   */
  public getAllUsersForAdmin(params: FilterParams, limit: number, filters?: FilterUsers): Observable<PageResult<User>> {
    let queryParams = '';
    if (filters.nameLike !== '') {
      queryParams += `&nameLike=${filters.nameLike}`;
    }
    if (filters.companyId !== '') {
      queryParams += `&companyId=${filters.companyId}`;
    }
    if (filters.role !== 'all') {
      queryParams += `&role=${filters.role}`;
    }

    return this.http
      .get<PageResult<User>>(API_URL + `api/web/admin/users?enabled=true&limit=${limit}&page=${params.page}&sort=${params.sort}${queryParams}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<User>(User), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getUserForAdmin(id: string): Observable<User> {
    return this.http
      .get<User>(API_URL + "api/web/admin/users/" + id, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(User, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateUserForAdmin(id: string, data: any): Observable<User> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<User>(API_URL + `api/web/admin/users/${id}`, body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>User</b>: Updated successfully");
          return plainToClass(User, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public create3rdPartyUserForAdmin(data: any): Observable<User> {
    let body = {
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.email,
      email: data.email,
      roles: [
        RoleType.THIRD_PARTY
      ],
      timezone: data.timezone
    };
    return this.http
      .post<User>(API_URL + "api/web/admin/users/3rdparty", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>User</b>: 3rd party created successfully");
          return plainToClass(User, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public deleteUserForAdmin(id: string) {
    return this.http
      .delete<boolean>(API_URL + `api/web/admin/users/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>User</b>: Disabled successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public resetUserPasswordForAdmin(userId: string, newPassword: string): Observable<boolean> {
    return this.http
      .post<boolean>(API_URL + `api/web/admin/users/${userId}/password/${newPassword}`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>User</b>: Password changed successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getConfigRolesForAdmin(): Observable<string[]> {
    return this.http
      .get<string[]>(API_URL + "api/web/admin/users/roles", getHttpInterceptedOptions)
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public addGrantLocation(userId: string, locationId: string) {
    return this.http
      .post<boolean>(API_URL + `api/web/admin/users/${userId}/grant/${locationId}`, null, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>User</b>: Location ungranted successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public deleteGrantLocation(userId: string, locationId: string) {
    return this.http
      .delete<boolean>(API_URL + `api/web/admin/users/${userId}/grant/${locationId}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>User</b>: Location granted successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getUser(id: string): Observable<User> {
    return this.http
      .get<User>(API_URL + "api/web/users/" + id, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(User, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Get current user information
   */
  public getCurrentUser(): Observable<User> {
    return this.http
      .get<User>(API_URL + "api/web/user", getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(User, response);
        })
      );
  }

  public updateUser(id: string, data: any): Observable<User> {
    let body = {
      ...data,
      "id": id
    };
    return this.http
      .patch<User>(API_URL + "api/web/users", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>User</b>: Updated successfully");
          return plainToClass(User, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public saveColumnSelection(tableName: string, data: ColumnSelector[]): void {
    const filteredData: any[] = data.map(next => ({
      index: next.index,
      visible: next.visible
    }));

    this.updateUserAttribute(tableName, JSON.stringify(filteredData)).subscribe(res => { });
  }

  public updateUserAttribute(name: string, value: string): Observable<boolean> {
    let body = {
      "name": name,
      "value": value
    };
    return this.http
      .patch<boolean>(API_URL + "api/web/user/attribute", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Preferences</b>: Updated preferences");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public updateUserAttributes(...attributes: Attribute[]): Observable<User> {
    let attributesArray = [];
    attributes.forEach(next => {
      attributesArray.push(
        {
          name: next.name,
          value: next.value
        }
      )
    });
    let body = {
      attributes: attributesArray
    };

    return this.http
      .patch<User>(API_URL + "api/web/user/attributes", body, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>Preferences</b>: Updated preferences");
          return plainToClass(User, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public deleteUser(id: string): Observable<boolean> {
    return this.http
      .delete<boolean>(API_URL + `api/web/users/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          this.notifySuccess("<b>User</b>: Access revoked successfully");
          return true;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public doSearch(query: string, isAdmin: boolean): Observable<SearchResult[]> {
    if (!query) {
      return of([]);
    }

    let searchURI = isAdmin ? "admin/search" : "search";
    return this.http
      .get<SearchResult[]>(API_URL + `api/web/${searchURI}/${query}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(SearchResult, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getConfigReportends(): Observable<string[]> {
    return this.http
      .get<string[]>(API_URL + "api/web/reportingprofiles/validreportend", getHttpInterceptedOptions)
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getConfigRoles(): Observable<string[]> {
    return this.http
      .get<string[]>(API_URL + "api/web/users/roles", getHttpInterceptedOptions)
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getConfigUnits(): Observable<string[]> {
    return this.http
      .get<string[]>(API_URL + "api/web/reportingprofiles/validunits", getHttpInterceptedOptions)
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getConfigStates(): Observable<Dictionary> {
    return this.http
      .get<Dictionary>(API_URL + "api/web/public/configuration/states", getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Dictionary, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getConfigTimezones(): Observable<Dictionary> {
    return this.http
      .get<Dictionary>(API_URL + "api/web/public/configuration/timezones", getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Dictionary, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getConfigConnectionTypes(): Observable<ConnectionType[]> {
    return this.http
      .get<ConnectionType[]>(API_URL + "api/web/connections/types", getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(ConnectionType, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getConfigLocalTime(timezone: string): Observable<LocalTime> {
    let timezoneEscaped = timezone.split("/").join("-");

    return this.http
      .get<LocalTime>(API_URL + `api/web/public/configuration/getlocaltime/${timezoneEscaped}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(LocalTime, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getDeviceTypes(): Observable<string[]> {
    return this.http
      .get<string[]>(API_URL + "api/web/devices/types", getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return response;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  eventSupportedTypes = [EntityType.DRIVER, EntityType.DEVICE, EntityType.VEHICLE];

  public getSearchResults(query: string): Observable<SearchResult[]> {
    if (!query) {
      return of([]);
    }

    return this.http.get<SearchResult[]>(API_URL + `api/web/search/${query}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let results: SearchResult[] = plainToClass(SearchResult, response);
          return results.filter(result =>
            this.eventSupportedTypes.includes(EntityTypeUtil.getEntityType(result.entityType))
          );
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getVehicleEventsType(): Observable<string[]> {
    return this.fetchStringArray("api/web/vehicleevents/types");
  }
  public getDriverEventsType(): Observable<string[]> {
    return this.fetchStringArray("api/web/driverevents/types");
  }
  public getDeviceEventsType(): Observable<string[]> {
    return this.fetchStringArray("api/web/deviceevents/types");
  }
  private fetchStringArray(uri: string): Observable<string[]> {
    return this.http.get<string[]>(API_URL + uri, authOptionsTokenized)
      .pipe(
        map(response => {
          return response;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public get500Events(item: SearchResult, filters: string[]): Observable<Event[]> {
    if (!this.eventSupportedTypes.includes(EntityTypeUtil.getEntityType(item.entityType))) {
      return of([]);
    }
    let eventsURL = EntityTypeUtil.getEventsAPI(item.entityType, item.entityId);

    const noFilters = !filters && filters.length === 0;
    const filtersPart = noFilters
      // ? "&events[]="
      ? ""
      : filters.map(filter => `&events[]=${filter}`).join("");

    return this.http
      .get<Event>(API_URL + `${eventsURL}?page=1&limit=1000&sort=datetime.DESC${filtersPart}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let pageResult: PageResult<Event> = plainToClassFromExist(new PageResult<Event>(Event), response);
          return pageResult.results.slice(0, 500);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getAllDriverEvents(params: FilterParams, driverId: string, events: string[] = [], limit: number = 10): Observable<PageResult<Event>> {
    return this.getAllEvents(params, EntityType.DRIVER, driverId, events, limit);
  }

  public getAllVehicleEvents(params: FilterParams, vehicleId: string, events: string[] = [], limit: number = 10): Observable<PageResult<Event>> {
    return this.getAllEvents(params, EntityType.VEHICLE, vehicleId, events, limit);
  }

  public getAllDeviceEvents(params: FilterParams, deviceId: string, events: string[] = [], limit: number = 10): Observable<PageResult<Event>> {
    return this.getAllEvents(params, EntityType.DEVICE, deviceId, events, limit);
  }

  private getAllEvents(params: FilterParams, entityType: EntityType, entityId: string, events: string[] = [], limit: number = 10): Observable<PageResult<Event>> {
    let eventsURL = EntityTypeUtil.getEventsAPI(entityType, entityId);
    return this.getAllEventsPrivate(eventsURL, params, events, limit);
  }

  public getAllAdminDeviceEvents(params: FilterParams, deviceId: string, events: string[] = [], limit: number = 10): Observable<PageResult<Event>> {
    return this.getAllAdminEvents(params, EntityType.DEVICE, deviceId, events, limit);
  }

  private getAllAdminEvents(params: FilterParams, entityType: EntityType, entityId: string, events: string[] = [], limit: number = 10): Observable<PageResult<Event>> {
    let eventsURL = EntityTypeUtil.getAdminEventsAPI(entityType, entityId);
    return this.getAllEventsPrivate(eventsURL, params, events, limit);
  }

  private getAllEventsPrivate(eventsURL: string, params: FilterParams, events: string[] = [], limit: number = 10): Observable<PageResult<Event>> {
    const noFilters = !events || events.length === 0;
    const filtersPart = noFilters ? "" : events.map(event => `&events[]=${event}`).join("");
    return this.http
      .get<Event>(API_URL + `${eventsURL}?limit=${limit}&page=${params.page}&sort=${params.sort}${filtersPart}`, getHttpInterceptedOptions)
      .pipe(
        map((response) => {
          return plainToClassFromExist(new PageResult<Event>(Event), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Oauth2Client` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort query parameter, e.g. `randomId.ASC`
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<Oauth2Client>>} An `Observable` of the paginated result of `Oauth2Client`s
   * @memberof RestService
   */
  public getAllClients(params: FilterParams, limit: number = 10): Observable<PageResult<Oauth2Client>> {
    return this.http
      .get<PageResult<Oauth2Client>>(
        API_URL + `api/web/oauth2/clients?limit=${limit}&page=${params.page}&sort=${params.sort}`, getHttpInterceptedOptions
      ).pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Oauth2Client>(Oauth2Client), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public createClient(redirectURIs: string[]): Observable<Oauth2Client> {
    const formData = new FormData();
    if (redirectURIs && redirectURIs.length > 0) {
      redirectURIs.forEach(uri => {
        formData.append('redirect_uris[]', uri);
      });
    }

    return this.http.post<Oauth2Client>(
      API_URL + `api/web/oauth2/clients`, formData, getHttpInterceptedOptions
    ).pipe(
      map(response => {
        this.notifySuccess("<b>API Token</b>: Created successfully");
        return plainToClass(User, response);
      }),
      catchError((response: HttpErrorResponse) => this.handleError(response))
    )
  }

  public deleteClient(id: string): Observable<any> {
    return this.http.delete<boolean>(
      API_URL + `api/web/oauth2/clients/${id}`, getHttpInterceptedOptions
    ).pipe(
      map(response => {
        this.notifySuccess("<b>API Token</b>: Deleted successfully");
        return true;
      }),
      catchError((response: HttpErrorResponse) => this.handleError(response))
    )
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `LinehaulTrip` instances.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `entityId.DESC` or `tripNum.ASC`
   * @param {number} limit amount of instances to fetch
   * @param {FilterLinehaulTrips} filters query parameter based filters
   * @returns {Observable<PageResult<LinehaulTrip>>} An `Observable` of the paginated result of `LinehaulTrip`s
   * @memberof RestService
   */
  public getAllLinehaulTrips(params: FilterParams, limit: number = 10, filters: FilterLinehaulTrips = null): Observable<PageResult<any>> {
    let idParams = "";
    if (filters && filters.entityId) {
      idParams += `&entityId=${filters.entityId}`;
    }
    if (filters && filters.vehicleRemoteId) {
      idParams += `&vehicleRemoteId=${filters.vehicleRemoteId}`;
    }
    if (filters && filters.driverRemoteId) {
      idParams += `&driverRemoteId=${filters.driverRemoteId}`;
    }
    if (filters && filters.beginDate) {
      idParams += `&beginDate=${filters.beginDate}`;
    }
    if (filters && filters.endDate) {
      idParams += `&endDate=${filters.endDate}`;
    }
    return this.http
      .get<PageResult<LinehaulTrip>>(API_URL + `api/web/linehaultrips?limit=${limit}&page=${params.page}&sort=${params.sort}${idParams}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<LinehaulTrip>(LinehaulTrip), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  /**
   * Based on VisTracks HOS API documentation `active` query parameter might be one of the following:
   *   - `true` - only active Drivers will be retrieved
   *   - `false` - only inactive Drivers will be retrieved
   *   - `null` (or parameter not included) - all Drivers will be retrieved
   *
   * @see [HOS API Documentation](http://developer.vistracks.com/index.php/drivers-1917/)
   */
  public getAllDriversForHOS(active: boolean = true): Observable<Driver[]> {
    return this.http
      .get<Driver[]>(
        VIS_API_BASE + `api/v2/drivers?active=${active}`
      )
      .pipe(
        map((response) => {
          return plainToClass(Driver, response).map(d => { d.fullName = d.name(); return d; });
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getAllTerminalForHOS(): Observable<Terminal[]> {
    return this.http
      .get<Terminal[]>(
        VIS_API_BASE + `api/v2/terminals`
      )
      .pipe(
        map((response) => {
          return plainToClass(Terminal, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getSubsetsByTerminalIdForHos(terminalId: number | string): Observable<Subset[]> {
    let queryParam = "";
    if (terminalId != 'all') {
      queryParam += `&terminal-id=${terminalId}`
    }

    return this.http
      .get<Subset[]>(
        VIS_API_BASE + `api/v2/subsets?sort=name` + queryParam
      )
      .pipe(
        map((response) => {
          return plainToClass(Subset, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getAllVehiclesForHOS(limit: number = 300, isActive: boolean = true): Observable<VehicleList[]> {
    return this.http
      .get<VehicleList[]>(
        VIS_API_BASE + `api/v2/equipment/meta/names?limit=${limit}&active=${isActive}&asset-type=Vehicle`
      )
      .pipe(
        map((response) => {
          return plainToClass(VehicleList, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getAllViolation(userId) {
    let params = '';
    if (userId) {
      params += `user-id=${userId}&`
    }

    params = params ? params.substring(0, params.length - 1) : '';
    return this.http
      .get<Violations>(
        VIS_API_BASE + `api/v2/driverViolations${params ? `?${params}` : ''}`
      )
      .pipe(
        map((response) => {
          return plainToClass(Violations, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public uploadDriverViolationDocuments(body) {
    // It is required to send boundary here, no need to define it explicitly to be multipart/form-data, Angular will do whatever required
    // let uploadHeader = {
    //   headers: { 'content-type': undefined }
    // }
    return this.http
      .post<DriverViolationDocument>(
        VIS_API_BASE + `api/v2/driverViolationDocuments`,
        body,
        // uploadHeader
      )
      .pipe(
        map((response) => {
          this.notifySuccess('<b>Document Violation</b>: Upload successfully');
          return plainToClass(DriverViolationDocument, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Driver Violations` instances.
   *
   * @param {FilterParams} params params for pagination
   * @param {FilterUnidentifiedDrivingOption} filterOption filter result
   * @param {number} limit limit paginated result 
   * @returns {Observable<PageResult<DriverViolations>>} An `Observable` of the paginated result
   * @memberof RestService
   */
  public getDriverViolationsForViolation(params: FilterParams, filterOption: FilterViolationOption, limit: number = 10, excelTable?: DriverViolations[]): Observable<PageResult<DriverViolations>> {
    const defaultQuantityItems = 100000;
    let queryParam = `&limit=${defaultQuantityItems}`;
    if (filterOption.selectedDriverIds && filterOption.selectedDriverIds.length) {
      // adding userIds for selected dispatch groups
      queryParam += "&user-id=";
      filterOption.selectedDriverIds.map((id, idx) => {
        queryParam += id;
        if (idx !== filterOption.selectedDriverIds.length - 1) {
          queryParam += ','
        }
      });
    }
    if (filterOption.selectedDriverId !== 'all') {
      queryParam += "&user-id=" + filterOption.selectedDriverId;
    }
    if (filterOption.selectedTerminalId !== 'all') {
      queryParam += "&terminal-id=" + filterOption.selectedTerminalId;
    }
    if (filterOption.selectedSubsetId !== 'all') {
      queryParam += "&subset-id=" + filterOption.selectedSubsetId;
    }
    if (filterOption.selectedViolationId !== 'all') {
      queryParam += "&violation-name=" + filterOption.selectedViolationId;
    }
    return this.http
      .get<PageResult<DriverViolations>>(
        VIS_API_BASE + `api/v2/driverViolations?from-change-timestamp=${filterOption.ISODateRange[0]}&to-change-timestamp=${filterOption.ISODateRange[1]}&sort=${params.sort}` + queryParam
      )
      .pipe(
        map((response: any) => {
          if (excelTable) {
            response.forEach(element => {
              excelTable.push(element);
            });
          }
          if (params) {
            let body = this.doClientSidePagination(params, response, limit);
            return plainToClassFromExist(new PageResult<DriverViolations>(DriverViolations), body);
          } else {
            return plainToClassFromExist(new PageResult<DriverViolations>(DriverViolations), response);
          }
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Driver History Unidentified Driving Events` instances.
   *
   * @param {FilterParams} params params for pagination
   * @param {FilterUnidentifiedDrivingOption} filterOption filter result
   * @param {number} limit limit paginated result
   * @returns {Observable<PageResult<DriverHistoriesUnidentifiedDrivingEvents>>} An `Observable` of the paginated result
   * @memberof RestService
   */
  public getDriverHistoriesMetaUnidentifiedDrivingEvents(params: FilterParams, filterOption: FilterUnidentifiedDrivingOption, limit: number = 10, excelTable?: DriverHistoriesUnidentifiedDrivingEvents[]): Observable<PageResult<DriverHistoriesUnidentifiedDrivingEvents>> {
    const defaultQuantityItems = 100000;
    let queryParam = `limit=${defaultQuantityItems}&event-type=Driving&record-status=Active&record-origin=Auto&offset=0`
    if (filterOption.selectedTerminalId !== 'all') {
      queryParam += `&home-terminal-id=${filterOption.selectedTerminalId}`;
    }
    if (filterOption.selectedVehicleId.length) {
      queryParam += `&asset-id=${filterOption.selectedVehicleId}`;
    }
    queryParam += `&from-event-time=${filterOption.ISODateRange[0]}`;
    queryParam += `&to-event-time=${filterOption.ISODateRange[1]}`;

    if (!filterOption.isClassified || !filterOption.isUnassigned) {
      queryParam += `&is-classified=${(filterOption.isClassified)}`;
    }
    // Remove pagination params from API as vis track API does not support pagination yet.
    return this.http
      .get<PageResult<DriverHistoriesUnidentifiedDrivingEvents>>(
        VIS_API_BASE + `api/v2/driverHistories/meta/unidentifiedDrivingEvents?` + queryParam
      )
      .pipe(
        map((response: any) => {
          if (excelTable) {
            response.forEach(element => {
              excelTable.push(element);
            });
          }
          if (params) {
            let body = this.doClientSidePagination(params, response, limit);
            return plainToClassFromExist(new PageResult<DriverHistoriesUnidentifiedDrivingEvents>(DriverHistoriesUnidentifiedDrivingEvents), body);
          } else {
            return plainToClassFromExist(new PageResult<DriverHistoriesUnidentifiedDrivingEvents>(DriverHistoriesUnidentifiedDrivingEvents), response);
          }
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Mal functions event` instances.
   *
   * @param {FilterParams} params params for pagination
   * @param {FilterMalfunctionsOption} filterOption filter result
   * @param {number} limit limit paginated result
   * @param {Array} vehicles all vehicle list
   * @returns {Observable<PageResult<EldMalfunction>>} An `Observable` of the paginated result
   * @memberof RestService
   */
  public getEldMalfunctions(params: FilterParams, filterOption: FilterMalfunctionsOption, limit: number = 10, vehicles, excelTable?: EldMalfunction[]): Observable<PageResult<EldMalfunction>> {
    const defaultQuantityItems = 100000;
    let queryParam = "";
    if (filterOption.eventType !== 'all') {
      if (filterOption.eventSpecificType !== 'all') {
        queryParam += "&event-type=" + filterOption.eventSpecificType;
      } else {
        queryParam += "&event-type=" + filterOption.eventType;
      }
    }
    if (filterOption.remarkDescription) {
      queryParam += "&description=" + filterOption.remarkDescription;
    }
    if (filterOption.isCleared !== "all") {
      queryParam += "&cleared=" + filterOption.isCleared;
    }
    if (filterOption.selectedDriverIds && filterOption.selectedDriverIds.length) {
      // adding userIds for selected dispatch groups
      queryParam += "&user-id=";
      filterOption.selectedDriverIds.map((id, idx) => {
        queryParam += id;
        if (idx !== filterOption.selectedDriverIds.length - 1) {
          queryParam += ','
        }
      });
    }
    if (filterOption.selectedDriverId !== "all") {
      queryParam += "&user-id=" + filterOption.selectedDriverId;
    }
    if (filterOption.selectedVehicleId.length) {
      queryParam += "&asset-id=" + filterOption.selectedVehicleId.toString();
    }

    let allVehiclesVinAPI = this.http.get(VIS_API_BASE + `api/v2/equipment/${vehicles.join('-')}`)
    let eldMafunctionsAPI = this.http.get<PageResult<EldMalfunction>>(
      VIS_API_BASE + `api/v2/eldMalfunctions?system=false&offset=0&limit=${defaultQuantityItems}&from-timestamp=${filterOption.ISODateRange[0]}&to-timestamp=${filterOption.ISODateRange[1]}&sort=${params.sort}` + queryParam
    )

    return forkJoin([allVehiclesVinAPI, eldMafunctionsAPI])
      .pipe(
        map((response: any) => {
          let allVehicleVins: any = response[0];
          let allEldMalfunctions: any = response[1];
          allEldMalfunctions = allEldMalfunctions.map(eld => {
            let findVin = allVehicleVins.find(vin => vin.id == eld.assetId)
            if (findVin) {
              eld.vin = findVin.vin;
            } else {
              eld.vin = '';
            }
            return eld;
          });
          if (excelTable) {
            allEldMalfunctions.forEach(element => {
              excelTable.push(element);
            });
          }
          if (params) {
            let body = this.doClientSidePagination(params, allEldMalfunctions, limit);
            return plainToClassFromExist(new PageResult<EldMalfunction>(EldMalfunction), body);
          } else {
            return plainToClassFromExist(new PageResult<EldMalfunction>(EldMalfunction), allEldMalfunctions);
          }
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }
  /**
   * Update driver history.
   *
   * @param {SingleAssignUnidentifiedDriving[]} data update driver history data
   * @memberof RestService
   */
  public updateDriverHistory(data: SingleAssignUnidentifiedDriving[]) {
    return this.http.put(
      VIS_API_BASE + `api/v2/driverHistories`,
      data
    ).pipe(
      map((response) => {
        this.notifySuccess('<b>Driver History</b>: Updated Successfully');
        return response;
      }),
      catchError((response: HttpErrorResponse) => this.handleError(response))
    )
  }

  /**
   * Fetches result for vehicles driven by driver.
   *
   * @param {number[]} userIdArr User id - driver id
   * @returns {Observable<Object>} An `Observable` of the paginated result
   * @memberof RestService
   */
  public getVehiclesDrivenByDriverId(userIdArr): Observable<Object> {
    return this.http.get(
      VIS_API_BASE + `api/v2/driverHistories/meta/vehiclesDriven?user-id=${userIdArr.join(',')}`
    )
  }

  /**
   * Driver histories export in CSV API
   * @param {FilterFmcsaDataTransferOption} filterOption filter data for post body
   * @memberof RestService
   */
  public driverHistoriesExport(filterOption: FilterFmcsaDataTransferOption) {
    let queryParam = '';

    if (filterOption.selectedDriverId.length > 0) {
      queryParam += `&driver-id=${filterOption.selectedDriverId.join(',')}`
    }

    if (filterOption.selectedVehicleId.length > 0) {
      queryParam += `&asset-id=${filterOption.selectedVehicleId.join(',')}`;
    } else {
      queryParam += '&asset-id=';
    }

    return this.http.get(
      VIS_API_BASE + `api/v2/driverHistory/export?from-timestamp=${filterOption.ISODateRange[0]}&to-timestamp=${filterOption.ISODateRange[1]}&encrypt=false` + queryParam,
      { responseType: 'blob' }
    ).pipe(
      catchError((response: HttpErrorResponse) => {
        return new Promise((resolve, reject) => {
          if (response instanceof HttpErrorResponse && response.error instanceof Blob && response.error.type === "application/json") {
            let reader = new FileReader();
            reader.onload = (e) => {
              try {
                const errmsg = JSON.parse((<any>e.target).result);
                reject(new HttpErrorResponse({
                  error: errmsg,
                  headers: response.headers,
                  status: response.status,
                  statusText: response.statusText,
                  url: response.url
                }));
              } catch (e) {
                reject(response);
              }
            };
            reader.onerror = (e) => {
              reject(response);
            };
            reader.readAsText(response.error);
          } else {
            reject(this.handleError(response))
          }
        })
      })
    );
  }

  /**
   * FMCSA Multiple Submit API
   * @param {FilterFmcsaDataTransferOption} filterOption filter data for post body
   * @memberof RestService
   */
  public fmcsaMultipleSubmit(filterOption: FilterFmcsaDataTransferOption) {
    let postBody = {
      assetIds: filterOption.selectedVehicleId,
      comment: filterOption.comment,
      driverIds: filterOption.selectedDriverId,
      fromDateTime: filterOption.ISODateRange[0],
      toDateTime: filterOption.ISODateRange[1]
    };

    return this.http.post(
      VIS_API_BASE + `api/v2/fmcsa/multipleSubmit`,
      postBody
    )
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Driver History` instances.
   *
   * @param {FilterParams} params params for pagination
   * @param {FilterLogEditsOption} filterOption filter result
   * @param {number} limit limit paginated result
   * @returns {Observable<PageResult<DriverHistory>>} An `Observable` of the paginated result
   * @memberof RestService
   */
  public getDriverHistoriesForLogEdits(params: FilterParams, filterOption: FilterLogEditsOption, limit: number = 10, excelTable?: DriverHistory[]): Observable<PageResult<DriverHistory>> {
    const defaultQuantityItems = 100000;
    let queryParam = `&limit=${defaultQuantityItems}`;

    if (filterOption.logType !== 'all') {
      queryParam += `&record-status=${filterOption.logType}`;
    } else {
      queryParam += `&record-status=InactiveChangeRejected,InactiveChangeRequested,Active`;
    }

    if (filterOption.selectedTerminalId !== 'all') {
      queryParam += `&home-terminal-id=${filterOption.selectedTerminalId}`
    }

    if (filterOption.selectedDriverIds && filterOption.selectedDriverIds.length) {
      // adding userIds for selected dispatch groups
      queryParam += "&user-id=";
      filterOption.selectedDriverIds.map((id, idx) => {
        queryParam += id;
        if (idx !== filterOption.selectedDriverIds.length - 1) {
          queryParam += ','
        }
      });
    }

    if (filterOption.selectedDriverId !== 'all') {
      queryParam += `&user-id=${filterOption.selectedDriverId}`;
    }
    return this.http
      .get<PageResult<DriverHistory>>(
        VIS_API_BASE + `api/v2/driverHistories?isUnidentified=true&event-type=OnDuty,OffDuty,Sleeper,Driving,ClearPU,ClearYM,YardMoves,PersonalUse,WaitingAtSite&driver-edit=true&driver.system=false&offset=0&sort=${params.sort}&from-event-time=${filterOption.ISODateRange[0]}&to-event-time=${filterOption.ISODateRange[1]}` + queryParam
      )
      .pipe(
        map((response: any) => {
          if (excelTable) {
            response.forEach(element => {
              excelTable.push(element);
            });
          }
          if (params) {
            let body = this.doClientSidePagination(params, response, limit);
            return plainToClassFromExist(new PageResult<DriverHistory>(DriverHistory), body);
          } else {
            return plainToClassFromExist(new PageResult<DriverHistory>(DriverHistory), response);
          }
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getDriverHistoriesByUuid(uuid: string) {
    return this.http.get<DriverHistory[]>(
      VIS_API_BASE + `api/v2/driverHistories?uuid=${uuid}`
    )
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Driver Dailies` instances.
   *
   * @param {FilterParams} params params for pagination
   * @param {FilterReportOption} filterOption filter result
   * @param {number} limit limit paginated result
   * @returns {Observable<PageResult<DriverDailies>>} An `Observable` of the paginated result
   * @memberof RestService
   */
  public getDriverDailies(params: FilterParams, filterOption: FilterReportOption, limit: number = 10): Observable<PageResult<DriverDailies>> {
    let queryParam = '';
    if (filterOption.userId && filterOption.userId !== 'all') {
      queryParam += `&user-id=${filterOption.userId}`;
    }

    if (filterOption.terminalId && filterOption.terminalId !== 'all') {
      queryParam += `&home-terminal-id=${filterOption.terminalId}`;
    }

    if (params) {
      queryParam += `&sort=${params.sort}`;
    } else {
      queryParam += `&sort=-date`;
    }

    return this.http
      .get<DriverDailies[]>(
        VIS_API_BASE + `api/v2/driverDailies?from-log-date=${filterOption.onlyDate[0]}&to-log-date=${filterOption.onlyDate[1]}` + queryParam
      )
      .pipe(
        map((response) => {
          let newReposnse: any;
          if (filterOption.isCertified) {
            newReposnse = response;
            newReposnse = newReposnse.filter(r => r.certified);
          } else if (filterOption.isCertified === false) {
            newReposnse = response;
            newReposnse = newReposnse.filter(r => r.certified === false);
          }
          if (params) {
            let body = this.doClientSidePagination(params, newReposnse ? newReposnse : response, limit);
            return plainToClassFromExist(new PageResult<DriverDailies>(DriverDailies), body);
          } else {
            let theResult: DriverDailies[] = plainToClass(DriverDailies, response as DriverDailies[]);
            let pageResult = {
              results: theResult,
              resultCount: -1
            }
            return pageResult;
          }
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getCertifiedLogPDF(logDate, userId, isChecking): Observable<any> {
    let url = VIS_API_BASE + `api/v2/certifiedLogs?log-date=${logDate}&user-id=${userId}`;
    if (isChecking) {
      return this.http.get(url, {}).pipe(
        take(1),
        map(data => data),
        catchError((err) => [err]));
    } else {
      return this.http.get(url, { responseType: 'arraybuffer' })
    }
  }

  public getCertifiedLogBulkExport(filterOption: FilterReportOption) {
    return this.http.get(
      VIS_API_BASE + `api/v2/certifiedLogExport?from-log-date=${filterOption.onlyDate[0]}&to-log-date=${filterOption.onlyDate[1]}`,
      { responseType: 'blob' }
    ).pipe(
      catchError((response: HttpErrorResponse) => this.handleError(response))
    );
  }

  public getMyAccount() {
    return this.http.get(VIS_API_BASE + `api/v2/myAccount`)
      .pipe(
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getRunCertifiedLogsReport(reportId, isCertifiedLogSummary: boolean = true, filterOption: FilterReportOption) {

    let queryParam = ''
    if (filterOption.userId !== 'all') {
      queryParam += `&Driver+ID=${filterOption.userId}`
    } else {
      queryParam += `&Driver+ID=0`
    }

    return this.getMyAccount()
      .pipe(
        switchMap((response: MyAccount) => {
          return this.http.get(
            VIS_API_BASE + `api/v2/runCertifiedLogsReport?reportId=${reportId}&certifiedLogsSummary=${isCertifiedLogSummary}&accountToken=${response.accountToken}&timeZone=%2B05&Start+Date=${filterOption.onlyDate[0]}&End+Date=${filterOption.onlyDate[1]}&exportType=${filterOption.exportType}` + queryParam,
            { responseType: 'blob' }
          ).pipe(
            catchError((response: HttpErrorResponse) => this.handleError(response))
          );
        })
      );
  }

  public getRunUncertifiedLogsReport(reportId, isCertifiedLogSummary: boolean = true, filterOption: FilterReportOption) {
    let queryParam = ''
    if (filterOption.userId !== 'all') {
      queryParam += `&Driver+ID=${filterOption.userId}`
    } else {
      queryParam += `&Driver+ID=0%27`
    }

    return this.getMyAccount()
      .pipe(
        switchMap((response: MyAccount) => {
          return this.http.get(
            VIS_API_BASE + `api/v2/runUncertifiedLogsReport?reportId=${reportId}&certifiedLogsSummary=${isCertifiedLogSummary}&accountToken=${response.accountToken}&timeZone=%2B05&Start+Date=${filterOption.onlyDate[0]}&End+Date=${filterOption.onlyDate[1]}&exportType=${filterOption.exportType}` + queryParam,
            { responseType: 'blob' }
          ).pipe(
            catchError((response: HttpErrorResponse) => this.handleError(response))
          );
        })
      );
  }

  public getRunCostEstimatorReport() {
    return this.http.get(
      VIS_API_BASE + `api/v2/runCostEstimatorReport?`,
      { responseType: 'blob' }
    ).pipe(
      catchError((response: HttpErrorResponse) => this.handleError(response))
    );
  }

  public getRunDriverAndVehicleInformationReport(reportId, filterOption: FilterReportOption) {
    let exportType = filterOption.exportType;
    if (filterOption.exportType === 'xls') {
      exportType = 'Excel';
    }

    return this.getMyAccount()
      .pipe(
        switchMap((response: MyAccount) => {
          return this.http.get(
            VIS_API_BASE + `api/v2/runDriverAndVehicleInformationReport?reportId=${reportId}&accountToken=${response.accountToken}&exportType=${exportType}&informationPer=${filterOption.informationType}&timeZone=%2B05&onePagePerSheet=false&collapseEmptySpaces=true&Start+Date=${filterOption.onlyDate[0]}&End+Date=${filterOption.onlyDate[1]}`,
            { responseType: 'blob' })
            .pipe(
              catchError((response: HttpErrorResponse) => this.handleError(response))
            );
        }), catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getRunLogEditsReport(reportId, filterOption: FilterReportOption) {
    let exportType = filterOption.exportType;
    let queryParam = '';
    if (filterOption.exportType === 'xls') {
      exportType = 'Excel';
    }

    if (filterOption.userId !== 'all') {
      queryParam += `&Driver+ID=${filterOption.userId}`;
    } else if (filterOption.selectedUserIdArr && filterOption.selectedUserIdArr.length > 0) {
      queryParam += `&Driver+ID=${filterOption.selectedUserIdArr.join(',')}`;
    } else {
      queryParam += `&Driver+ID=0`;
    }

    return this.getMyAccount()
      .pipe(
        switchMap((response: MyAccount) => {
          return this.http.get(
            VIS_API_BASE + `api/v2/runLogEditsReport?reportId=${reportId}&accountToken=${response.accountToken}&timeZone=%2B05&Start+Date=${filterOption.onlyDate[0]}&End+Date=${filterOption.onlyDate[1]}&exportType=${exportType}&Unit=${filterOption.driverVehicleUnitType}` + queryParam,
            { responseType: 'blob' }
          ).pipe(
            catchError((response: HttpErrorResponse) => this.handleError(response))
          );
        }), catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getRunCurrentLogVsEditLogReport(reportId, filterOption: FilterReportOption) {
    let exportType = filterOption.exportType;
    if (filterOption.exportType === 'xls') {
      exportType = 'Excel';
    }
    return this.getMyAccount()
      .pipe(
        switchMap((response: MyAccount) => {
          return this.http.get(
            VIS_API_BASE + `api/v2/runCurrentLogVsEditLogReport?reportId=${reportId}&accountToken=${response.accountToken}&timeZone=%2B05&Start+Date=${filterOption.onlyDate[0]}&End+Date=${filterOption.onlyDate[1]}&Driver+ID=${filterOption.selectedUserIdArr.join(',')}&exportType=${exportType}&Unit=${filterOption.driverVehicleUnitType}`,
            { responseType: 'blob' }
          ).pipe(
            catchError((response: HttpErrorResponse) => this.handleError(response))
          );
        }), catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getRunDriverLogsReport(reportId, filterOption: FilterReportOption) {
    let exportType = filterOption.exportType;
    if (filterOption.exportType === 'xls') {
      exportType = 'Excel';
    }
    return this.getMyAccount()
      .pipe(
        switchMap((response: MyAccount) => {
          return this.http.get(
            VIS_API_BASE + `api/v2/runDriverLogsReport?reportId=${reportId}&accountToken=${response.accountToken}&timeZone=%2B05&Start+Date=${filterOption.onlyDate[0]}&End+Date=${filterOption.onlyDate[1]}&Driver+ID=${filterOption.selectedUserIdArr.join(',')}&exportType=${exportType}&Unit=${filterOption.driverVehicleUnitType}`,
            { responseType: 'blob' }
          ).pipe(
            catchError((response: HttpErrorResponse) => this.handleError(response))
          );
        }), catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getRunOnDutyAndOffDutyReport(reportId, filterOption: FilterReportOption) {
    let exportType = filterOption.exportType;
    if (filterOption.exportType === 'xls') {
      exportType = 'excel';
    }
    let queryParam = ''
    if (filterOption.userId !== 'all') {
      queryParam += `&driverId=${filterOption.userId}`
    } else {
      queryParam += `&driverId=0`
    }

    return this.getMyAccount()
      .pipe(
        switchMap((response: MyAccount) => {
          return this.http.get(
            VIS_API_BASE + `api/v2/runOnDutyAndOffDutyReport?reportId=${reportId}&accountToken=${response.accountToken}&timeZone=%2B05&startDate=${filterOption.onlyDate[0]}&endDate=${filterOption.onlyDate[1]}&exportType=${exportType}` + queryParam,
            { responseType: 'blob' }
          ).pipe(
            catchError((response: HttpErrorResponse) => this.handleError(response))
          );
        }), catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getRunMobileAppVersionReport(reportId, filterOption: FilterReportOption) {
    let exportType = filterOption.exportType;
    if (filterOption.exportType === 'xls') {
      exportType = 'excel';
    }
    return this.getMyAccount()
      .pipe(
        switchMap((response: MyAccount) => {
          return this.http.get(
            VIS_API_BASE + `api/v2/runMobileAppVersionReport?reportId=${reportId}&accountToken=${response.accountToken}&timeZone=%2B05&exportType=${exportType}`,
            { responseType: 'blob' }
          ).pipe(
            catchError((response: HttpErrorResponse) => this.handleError(response))
          );
        }), catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getRunDrivingOnOpenDefectsReport(reportId, filterOption: FilterReportOption) {
    let exportType = filterOption.exportType;
    let queryParam = '';
    if (filterOption.exportType === 'xls') {
      exportType = 'excel';
    }

    if (Array.isArray(filterOption.assetIdArr) && filterOption.assetIdArr.length > 0) {
      queryParam += `&assetIds=${filterOption.assetIdArr.join(',')}`
    }

    if (filterOption.terminalId !== 'all') {
      queryParam += `&terminalIds=${filterOption.terminalId}`;
    }
    return this.getMyAccount()
      .pipe(
        switchMap((response: MyAccount) => {
          return this.http.get(
            VIS_API_BASE + `api/v2/runDrivingOnOpenDefectsReport?reportId=${reportId}&accountToken=${response.accountToken}&timeZone=%2B05&exportType=${exportType}&startDate=${filterOption.onlyDate[0]}&endDate=${filterOption.onlyDate[1]}` + queryParam,
            { responseType: 'blob' }
          ).pipe(
            catchError((response: HttpErrorResponse) => this.handleError(response))
          );
        }), catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getRunDrivingWithoutDvirReport(reportId, filterOption: FilterReportOption) {
    let exportType = filterOption.exportType;
    let queryParam = '';
    if (filterOption.exportType === 'xls') {
      exportType = 'excel';
    }

    if (Array.isArray(filterOption.assetIdArr) && filterOption.assetIdArr.length > 0) {
      console.log(filterOption.assetIdArr, "asset data");
      queryParam += `&assetIds=${filterOption.assetIdArr.join(',')}`
    }

    if (filterOption.terminalId !== 'all') {
      queryParam += `&terminalIds=${filterOption.terminalId}`;
    }
    return this.getMyAccount()
      .pipe(
        switchMap((response: MyAccount) => {
          return this.http.get(
            VIS_API_BASE + `api/v2/runDrivingWithoutDvirReport?reportId=${reportId}&accountToken=${response.accountToken}&timeZone=%2B05&exportType=${exportType}&startDate=${filterOption.onlyDate[0]}&endDate=${filterOption.onlyDate[1]}` + queryParam,
            { responseType: 'blob' }
          ).pipe(
            catchError((response: HttpErrorResponse) => this.handleError(response))
          );
        }), catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getRunReport(reportId, filterOption: FilterReportOption) {
    let exportType = filterOption.exportType;
    let queryParam = '';
    if (filterOption.exportType === 'xls') {
      exportType = 'excel';
    }

    if (filterOption.userId !== 'all') {
      queryParam += `&Driver+ID=${filterOption.userId}`
    } else {
      queryParam += `&Driver+ID=0`
    }

    if (filterOption.terminalId !== 'all') {
      queryParam += `&Terminal=${filterOption.terminalId}`
    }

    return this.getMyAccount()
      .pipe(
        switchMap((response: MyAccount) => {
          return this.http.get(
            VIS_API_BASE + `api/v2/runReport?reportId=${reportId}&accountToken=${response.accountToken}&timeZone=%2B05&exportType=${exportType}&Start+Date=${filterOption.onlyDate[0]}&End+Date=${filterOption.onlyDate[1]}&Unit=${filterOption.driverVehicleUnitType}` + queryParam,
            { responseType: 'blob' }
          ).pipe(
            catchError((response: HttpErrorResponse) => this.handleError(response))
          );
        }), catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getRunInvalidDataReport(reportId, filterOption: FilterReportOption) {
    let exportType = filterOption.exportType;
    if (filterOption.exportType === 'xls') {
      exportType = 'excel';
    }

    return this.getMyAccount()
      .pipe(
        switchMap((response: MyAccount) => {
          return this.http.get(
            VIS_API_BASE + `api/v2/runInvalidDataReport?reportId=${reportId}&accountToken=${response.accountToken}&timeZone=%2B05&exportType=${exportType}`,
            { responseType: 'blob' }
          ).pipe(
            catchError((response: HttpErrorResponse) => this.handleError(response))
          );
        }), catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getRunOdometerJumpsReport(reportId, filterOption: FilterReportOption) {
    let exportType = filterOption.exportType;
    let queryParam = '';
    if (filterOption.exportType === 'xls') {
      exportType = 'excel';
    }

    if (Array.isArray(filterOption.assetIdArr) && filterOption.assetIdArr.length > 0) {
      queryParam += `&assetId=${filterOption.assetIdArr.join(',')}`;
    } else {
      queryParam += '&assetId=0';
    }

    if (filterOption.driverVehicleUnitType) {
      queryParam += `&unit=${filterOption.driverVehicleUnitType === 'mi' ? 'miles' : 'kilometers'}`
    }

    return this.getMyAccount()
      .pipe(
        switchMap((response: MyAccount) => {
          return this.http.get(
            VIS_API_BASE + `api/v2/runOdometerJumpsReport?reportId=${reportId}&accountToken=${response.accountToken}&timeZone=%2B05&exportType=${exportType}&isUnidIncluded=${filterOption.isUnidIncluded}&startDate=${filterOption.onlyDate[0]}&endDate=${filterOption.onlyDate[1]}` + queryParam,
            { responseType: 'blob' }
          ).pipe(
            catchError((response: HttpErrorResponse) => this.handleError(response))
          );
        }), catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getRunRawPunchReport(reportId, filterOption: FilterReportOption) {
    let exportType = filterOption.exportType;
    let queryParam = '';
    if (filterOption.exportType === 'xls') {
      exportType = 'excel';
    }

    if (filterOption.userId !== 'all') {
      queryParam += `&driverIds=${filterOption.userId}`
    }

    return this.getMyAccount()
      .pipe(
        switchMap((response: MyAccount) => {
          return this.http.get(
            VIS_API_BASE + `api/v2/runRawPunchReport?reportId=${reportId}&accountToken=${response.accountToken}&timeZone=%2B05&exportType=${exportType}&startDate=${filterOption.onlyDate[0]}&endDate=${filterOption.onlyDate[1]}` + queryParam,
            { responseType: 'blob' }
          ).pipe(
            catchError((response: HttpErrorResponse) => this.handleError(response))
          );
        }), catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getRunRejectedEditsReport(reportId, filterOption: FilterReportOption) {
    let exportType = filterOption.exportType;
    let queryParam = '';
    if (filterOption.exportType === 'xls') {
      exportType = 'excel';
    }

    if (filterOption.userId !== 'all') {
      queryParam += `&driverId=${filterOption.userId}`
    } else {
      queryParam += `&driverId=0`
    }

    if (filterOption.driverVehicleUnitType) {
      queryParam += `&unit=${filterOption.driverVehicleUnitType}`
    } else {
      queryParam += `&unit=mi`;
    }

    return this.getMyAccount()
      .pipe(
        switchMap((response: MyAccount) => {
          return this.http.get(
            VIS_API_BASE + `api/v2/runRejectedEditsReport?reportId=${reportId}&accountToken=${response.accountToken}&timeZone=%2B05&exportType=${exportType}&startDate=${filterOption.onlyDate[0]}&endDate=${filterOption.onlyDate[1]}` + queryParam,
            { responseType: 'blob' }
          ).pipe(
            catchError((response: HttpErrorResponse) => this.handleError(response))
          );
        }), catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Driver History` instances.
   *
   * @param {FilterParams} params params for pagination
   * @param {FilterReportOption} filterOption filter result
   * @param {number} limit limit paginated result
   * @returns {Observable<PageResult<DriverHistory>>} An `Observable` of the paginated result
   * @memberof RestService
   */
  public getDriverHistoriesForSpecialMoves(params: FilterParams, filterOption: FilterReportOption, limit: number = 10): Observable<PageResult<DriverHistory>> {
    let queryParam = '';

    if (filterOption.eventType) {
      queryParam += `&event-type=${filterOption.eventType}`;
    } else {
      queryParam += `&event-type=PersonalUse,YardMoves`;
    }

    if (filterOption.driverVehicleUnitType) {
      queryParam += `&unit=${filterOption.driverVehicleUnitType}`;
    } else {
      queryParam += `&unit=mi`;
    }

    if (filterOption.userId !== 'all') {
      queryParam += `&user-id=${filterOption.userId}`;
    }

    return this.http
      .get<PageResult<DriverHistory>>(
        VIS_API_BASE + `api/v2/driverHistories?sort=${params.sort}&from-event-time=${filterOption.ISODateRange[0]}&to-event-time=${filterOption.ISODateRange[1]}` + queryParam
      )
      .pipe(
        map((response) => {
          if (params) {
            let body = this.doClientSidePagination(params, response, limit)
            return plainToClassFromExist(new PageResult<DriverHistory>(DriverHistory), body);
          } else {
            return plainToClassFromExist(new PageResult<DriverHistory>(DriverHistory), response);
          }
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Driver History` instances.
   *
   * @param {FilterParams} params params for pagination
   * @param {FilterReportOption} filterOption filter result
   * @param {number} limit limit paginated result
   * @returns {Observable<PageResult<DriverHistory>>} An `Observable` of the paginated result
   * @memberof RestService
   */
  public getDriverHistoriesForVehicleDailyUsage(params: FilterParams, filterOption: FilterReportOption, limit: number = 10): Observable<PageResult<DriverHistory>> {
    let queryParam = '';

    if (filterOption.assetId && filterOption.assetId !== 'all') {
      queryParam += `&asset-id=${filterOption.assetId}`;
    }

    if (filterOption.userId !== 'all') {
      queryParam += `&user-id=${filterOption.userId}`;
    }

    return this.http
      .get<PageResult<DriverHistory>>(
        VIS_API_BASE + `api/v2/driverHistories?record-status=Active&offset=0&sort=${params.sort}&note=Authenticate,Unauthenticate&from-event-time=${filterOption.ISODateRange[0]}&to-event-time=${filterOption.ISODateRange[1]}` + queryParam
      )
      .pipe(
        map((response) => {
          if (params) {
            let body = this.doClientSidePagination(params, response, limit)
            return plainToClassFromExist(new PageResult<DriverHistory>(DriverHistory), body);
          } else {
            return plainToClassFromExist(new PageResult<DriverHistory>(DriverHistory), response);
          }
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getRunSpecialMovesReport(reportId, filterOption: FilterReportOption) {
    let exportType = filterOption.exportType;
    let queryParam = '';
    if (filterOption.exportType === 'xls') {
      exportType = 'excel';
    }

    if (filterOption.userId !== 'all') {
      queryParam += `&driverId=${filterOption.userId}`
    } else {
      queryParam += `&driverId=0`
    }

    if (filterOption.driverVehicleUnitType) {
      queryParam += `&unit=${filterOption.driverVehicleUnitType}`
    } else {
      queryParam += `&unit=mi`;
    }

    if (filterOption.eventType !== 'all') {
      queryParam += `&eventType=${filterOption.eventType}`;
    } else {
      queryParam += `&eventType=PersonalUse,YardMoves`
    }


    return this.getMyAccount()
      .pipe(
        switchMap((response: MyAccount) => {
          return this.http.get(
            VIS_API_BASE + `api/v2/runSpecialMovesReport?reportId=${reportId}&accountToken=${response.accountToken}&timeZone=%2B05&exportType=${exportType}&startDate=${filterOption.onlyDate[0]}&endDate=${filterOption.onlyDate[1]}` + queryParam,
            { responseType: 'blob' }
          ).pipe(
            catchError((response: HttpErrorResponse) => this.handleError(response))
          );
        }), catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getRunUsageReport(reportId, filterOption: FilterReportOption) {
    let exportType = filterOption.exportType;
    let queryParam = '';
    if (filterOption.exportType === 'xls') {
      exportType = 'excel';
    }

    if (filterOption.usagePer) {
      queryParam += `&usagePer=${filterOption.usagePer}`;
    } else {
      queryParam += `&usagePer=Driver`;
    }

    if (filterOption.usageMonth) {
      queryParam += `&month=${filterOption.usageMonth}`
    } else {
      queryParam += `&month=6`;
    }

    return this.getMyAccount()
      .pipe(
        switchMap((response: MyAccount) => {
          return this.http.get(
            VIS_API_BASE + `api/v2/runUsageReport?reportId=${reportId}&accountToken=${response.accountToken}&timeZone=%2B05&exportType=${exportType}` + queryParam,
            { responseType: 'blob' }
          ).pipe(
            catchError((response: HttpErrorResponse) => this.handleError(response))
          );
        }), catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getRunDisconnectionReport(reportId, filterOption: FilterReportOption) {
    let exportType = filterOption.exportType;
    let queryParam = '';
    if (filterOption.exportType === 'xls') {
      exportType = 'excel';
    }

    if (Array.isArray(filterOption.assetIdArr) && filterOption.assetIdArr.length) {
      queryParam += `&assetId=${filterOption.assetIdArr.join(',')}`;
    } else {
      queryParam += `&assetId=0`;
    }

    if (filterOption.driverVehicleUnitType) {
      queryParam += `&unit=${filterOption.driverVehicleUnitType === 'mi' ? 'miles' : 'kilometers'}`;
    } else {
      queryParam += '&unit=miles';
    }

    return this.getMyAccount()
      .pipe(
        switchMap((response: MyAccount) => {
          return this.http.get(
            VIS_API_BASE + `api/v2/runDisconnectionReport?reportId=${reportId}&accountToken=${response.accountToken}&timeZone=%2B05&exportType=${exportType}&isUnidIncluded=false&startDate=${filterOption.onlyDate[0]}&endDate=${filterOption.onlyDate[1]}` + queryParam,
            { responseType: 'blob' }
          ).pipe(
            catchError((response: HttpErrorResponse) => this.handleError(response))
          );
        }), catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getAllReports() {
    return this.http.get(
      VIS_API_BASE + `api/v2/reports`
    )
  }

  public getUtilizationVehicleOptionsFor(driverId: string): Observable<VehicleOption[]> {
    return this.http
      .get<VehicleOption[]>(API_URL + `api/web/drivers/${driverId}/vehicle-utilization-vehicle-options`, getHttpInterceptedOptions)
      .pipe(
        map((response) => {
          return plainToClass(VehicleOption, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `VehicleUtilization` instances for the specified driver.
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `startedAt.DESC`
   * @param {string} driverId driver to fetch utilization info for
   * @param {string} vehicleId filter result based on vehicle
   * @param {number} limit amount of instances to fetch
   * @returns {Observable<PageResult<VehicleUtilization>>} An `Observable` of the paginated result of `VehicleUtilization`s
   * @memberof RestService
   */
  public getAllVehicleUtilizationsForDriver(params: FilterParams, driverId: string, vehicleId: string, limit: number = 10): Observable<PageResult<VehicleUtilization>> {
    let queryParams = '';
    if (vehicleId) {
      queryParams += `&vehicleId=${vehicleId}`;
    }

    return this.http
      .get<PageResult<VehicleUtilization>>(
        API_URL + `api/web/drivers/${driverId}/vehicle-utilization-list?limit=${limit}&page=${params.page}&sort=${params.sort}${queryParams}`,
        getHttpInterceptedOptions
      )
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<VehicleUtilization>(VehicleUtilization), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getUtilizationDriverOptionsFor(vehicleId: string): Observable<DriverOption[]> {
    return this.http
      .get<DriverOption[]>(API_URL + `api/web/vehicles/${vehicleId}/vehicle-utilization-driver-options`, getHttpInterceptedOptions)
      .pipe(
        map((response) => {
          return plainToClass(DriverOption, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getAllVehicleUtilizations(params: FilterParams, vehicleId: string, driverId: string, limit: number = 10): Observable<PageResult<VehicleUtilization>> {
    let queryParams = '';
    if (driverId) {
      queryParams += `&driverId=${driverId}`;
    }

    return this.http
      .get<PageResult<VehicleUtilization>>(
        API_URL + `api/web/vehicles/${vehicleId}/vehicle-utilization-list?limit=${limit}&page=${params.page}&sort=${params.sort}${queryParams}`,
        getHttpInterceptedOptions
      )
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<VehicleUtilization>(VehicleUtilization), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getDriverStatuses(hosDriverId: string): Observable<DriverStatuses> {
    return this.http
      .get<PageResult<DriverStatuses>>(
        VIS_API_BASE + `api/v2/driverStatuses?system=false&active=true&sort=user-id&user-id=${hosDriverId}`
      )
      .pipe(
        map((response: any) => {
          let statuses: DriverStatuses[] = plainToClass(DriverStatuses, response as DriverStatuses[]);
          if (statuses && statuses.length > 0) {
            return statuses[0];
          } else {
            return null;
          }
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getDriversStatuses(params: FilterParams, filterOption: FilterDriversOption, limit: number = 10, excelTable?: DriverStatuses[]): Observable<PageResult<DriverStatuses>> {
    let queryParam = "";
    if (filterOption.selectedDriverIds && filterOption.selectedDriverIds.length) {
      // adding userIds for selected dispatch groups
      queryParam += "&user-id=";
      filterOption.selectedDriverIds.map((id, idx) => {
        queryParam += id;
        if (idx !== filterOption.selectedDriverIds.length - 1) {
          queryParam += ','
        }
      });
    }
    if (filterOption.selectedDriverId !== 'all') {
      queryParam += "&user-id=" + filterOption.selectedDriverId;
    }
    if (filterOption.selectedTerminalId !== 'all') {
      queryParam += "&terminal-id=" + filterOption.selectedTerminalId;
    }
    if (filterOption.selectedSubsetId !== 'all') {
      queryParam += "&subset-id=" + filterOption.selectedSubsetId;
    }

    if (filterOption.selectedStatus) {
      queryParam += "&active=" + filterOption.selectedStatus;
    }

    // &limit=${limit} - remove limit as vis track does not support pagination
    return this.http
      .get<PageResult<DriverStatuses>>(
        VIS_API_BASE + `api/v2/driverStatuses?system=false&sort=${params.sort}` + queryParam
      )
      .pipe(
        map((response: any) => {
          if (excelTable) {
            response.forEach(element => {
              excelTable.push(element);
            });
          }
          if (params) {
            let body = this.doClientSidePagination(params, response, limit);
            return plainToClassFromExist(new PageResult<DriverStatuses>(DriverStatuses), body);
          } else {
            return plainToClassFromExist(new PageResult<DriverStatuses>(DriverStatuses), response);
          }
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getDriversMetaNames(): Observable<DriversMetaNames[]> {
    return this.http
      .get<DriversMetaNames[]>(
        VIS_API_BASE + `api/v2/drivers/meta/names?limit=300&system=false&active=true`
      ).pipe(
        map((response) => {
          return plainToClass(DriversMetaNames, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public getDriverMetaNames(hosDriverId: string): Observable<DriversMetaNames> {
    let body = {
      "ids": [`${hosDriverId}`]
    }
    return this.http
      .post<DriversMetaNames[]>(
        VIS_API_BASE + `api/v2/drivers/meta/names?limit=1&system=false&active=true`, body
      ).pipe(
        map((response) => {
          let names: DriversMetaNames[] = plainToClass(DriversMetaNames, response as DriversMetaNames[]);
          if (names && names.length > 0) {
            return names[0];
          } else {
            return null;
          }
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  private handleLoginError(error: HttpErrorResponse) {
    let message: string = '';

    if (error.status === 401) {
      message = "Incorrect user or password, please try again.";
    } else if (error && error.error && error.error.code === 400) {
      message = error.error.message;
    } else {
      message = "Something bad happened, please try again later.";
    }

    return throwError(message);
  }

  private handleError(error: HttpErrorResponse, notificationService: NotificationService = this.notificationService): ObservableInput<any> {
    function notifyFailure(messageHTML: string) {
      notificationService.smallBox({
        content: `<i class='fa fa-exclamation-triangle'></i>&nbsp;${messageHTML}`,
        color: "#a90329",
        timeout: 4000
      });
    }

    let clientError: boolean = error.error instanceof ErrorEvent;
    let message: string = error.error.message || error.error.error.message;
    notifyFailure(`<b>Error<b/>: ${message}`);

    let consoleMessage: string = `${clientError ? "Client-side" : "Backend"} error occurred: ${message}` +
      `${clientError ? "" : `, status code ${error.status}`}`;
    console.error(consoleMessage);
    return throwError(error);
  }

  public notifyError(messageHTML: string) {
    this.notificationService.smallBox({
      content: `<i class='fa fa-exclamation-triangle'></i>&nbsp;${messageHTML}`,
      color: '#a90329',
      timeout: 4000,
    });
  }

  private notifySuccess(messageHTML: string) {
    this.notificationService.smallBox({
      content: `<i class='fa fa-check-circle-o'></i>&nbsp;${messageHTML}`,
      color: "#739e73",
      timeout: 4000
    });
  }

  public doClientSidePagination(params, response, limit) {
    let data = { results: response };
    let length = data.results.length;

    let begin = (params.page - 1) * limit;
    let end = (params.page * limit);
    return {
      results: _.slice(data.results, begin, end),
      resultCount: length,
    };
  }

  /**
   * Fetches paginated result of the specified amount (`limit` parameter) of `Vehicle` instances (3rd Party Users functionality).
   *
   * @param {FilterParams} params filter params, i.e. page number, which starts from `1`, and sort querty parameter, e.g. `remoteId.DESC` or `status.ASC`
   * @param {number} limit amount of instances to fetch
   * @param {FilterVehiclesThirdParty} filters query parameter based filters
   * @returns {Observable<PageResult<Vehicle>>} An `Observable` of the paginated result of `Vehicle`s
   * @memberof RestService
   */
  getAllVehiclesForThirdParty(params: FilterParams, limit: number = 10, filters: FilterVehiclesThirdParty) {
    let filterParams = "";
    if (filters.remoteId) {
      filterParams += `&remoteId=${filters.remoteId}`;
    }
    if (filters.reportingProfileId) {
      filterParams += `&reportingProfileId=${filters.reportingProfileId}`;
    }
    if (filters.domicileLocationId) {
      filterParams += `&domicileLocationId=${filters.domicileLocationId}`;
    }
    if (filters.status) {
      filterParams += `&status=${filters.status}`;
    }

    return this.http
      .get<PageResult<Vehicle>>(API_URL + `api/web/thirdparty/vehicles?limit=${limit}&page=${params.page}&sort=${params.sort}${filterParams}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Vehicle>(Vehicle), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      );
  }

  public get1000ActiveVehiclesForThirdParty(): Observable<Vehicle[]> {
    return this.http
      .get<PageResult<Vehicle>>(API_URL + `api/web/thirdparty/vehicles?limit=1000&sort=remoteId.ASC&status=(active)`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<Vehicle>(Vehicle), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getVehicleForThirdParty(id: string): Observable<Vehicle> {
    return this.http
      .get<Vehicle>(API_URL + `api/web/thirdparty/vehicles/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(Vehicle, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getReportsForThirdParty(entityId: string, reportName: string, params: FilterParams): Observable<PageResult<Report>> {
    return this.http
      .get<PageResult<Report>>(API_URL + `api/web/thirdparty/reports/${reportName}/${entityId}?limit=10&page=${params.page}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<Report>(Report), response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000EntitiesForThirdParty(): Observable<EntityThirdParty[]> {
    return this.http
      .get<PageResult<EntityThirdParty>>(API_URL + `api/web/thirdparty/entities?limit=1000&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          let paginated = plainToClassFromExist(new PageResult<EntityThirdParty>(EntityThirdParty), response);
          return (paginated && paginated.results) || [];
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public getEntityForThirdParty(id: string): Observable<ReportingProfile> {
    return this.http
      .get<ReportingProfile>(API_URL + `api/web/thirdparty/entities/${id}`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClass(ReportingProfile, response);
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

  public get1000LocationsForThirdParty(): Observable<DomicileLocation[]> {
    return this.http
      .get<DomicileLocation[]>(API_URL + `api/web/thirdparty/locations?limit=1000&page=1&sort=name.ASC`, getHttpInterceptedOptions)
      .pipe(
        map(response => {
          return plainToClassFromExist(new PageResult<DomicileLocation>(DomicileLocation), response).results;
        }),
        catchError((response: HttpErrorResponse) => this.handleError(response))
      )
  }

}

@Injectable()
export class GlobalFunctionsService {

  /**
   * Helper method to encode object parameter: stringify, escape, encode.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/btoa
   */
  public encodeParam(param: any) {
    let str = JSON.stringify(param);
    return btoa(unescape(encodeURIComponent(str)));
  }

  public decodeParam(paramStr) {
    let decoded = decodeURIComponent(escape(atob(paramStr)));
    return JSON.parse(decoded);
  }
}

@Injectable()
export class DataTableService {

  /**
   * Preares filter parameters based on the provided `DataTable` event.
   *
   * @param {*} data `DataTable`'s event configuration
   * @param {string[]} columns array of column names of the `DataTable` instance
   * @returns {FilterParams} return `FilterParams` instance with pagination and sorting parameters
   * @memberof DataTableService
   */
  public calculateParams(data: any, columns: string[]): FilterParams {
    let order = data.order[0];
    let orderColumn: string = columns[order.column];
    let orderType: string = order.dir;
    let page: number = data.start / data.length + 1;

    return new FilterParams(page, `${orderColumn}.${orderType}`);
  }

  public calculateParamsForVis(data: any, columns: string[]): FilterParams {
    let order = data.order[0];
    let orderColumn: string = columns[order.column];
    let orderType: string = order.dir === "desc" ? '-' : '';
    let page: number = data.start / data.length + 1;

    return new FilterParams(page, `${orderType}${orderColumn}`);
  }
}


@Injectable()
export class HOSUtilService {

  public millisToTime(s, hideSeconds) {
    // If seconds contains a negative value then return it as zero.
    if (s < 0) {
      return (!hideSeconds) ? "00:00:00" : "00:00";
    }

    let addZ = function (n) {
      return (n < 10 ? "0" : "") + n;
    };

    let ms, sec, min, hr;
    ms = s % 1000;
    s = (s - ms) / 1000;
    sec = s % 60;
    s = (s - sec) / 60;
    min = s % 60;
    hr = (s - min) / 60;

    return (!hideSeconds) ? addZ(hr) + ':' + addZ(min) + ':' + addZ(sec) : addZ(hr) + ':' + addZ(min);
  }
}

export * from './rest.model';
