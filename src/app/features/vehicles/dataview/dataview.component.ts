import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, ViewChild, ElementRef, Renderer2, OnDestroy, HostListener } from '@angular/core';
import { Map, LngLatBounds } from 'mapbox-gl';
import { Observable, Subject, merge } from 'rxjs';
import { distinctUntilChanged, debounceTime, switchMap, tap, map, filter, take } from 'rxjs/operators'
import { Actions } from "@ngrx/effects";
import { LngLat, MapLayerMouseEvent } from 'mapbox-gl';
import { GeoJsonProperties } from 'geojson';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { BsModalService, BsModalRef, ModalDirective } from 'ngx-bootstrap/modal';

import {
  RestService, Vehicle, DomicileLocation, MapboxHelperService, PositionsData, Position, PointFeature,
  ColumnSelector, ColumnSelectorUtil
} from '@app/core/services';
import { MinifyMenu } from '@app/core/store/layout';
import { mapConfig } from '@app/core/smartadmin.config';
import { DateService, TimezoneHandlerPipe } from '@app/shared/pipes/timezone-handler.pipe';
import { ExitEditMode } from '@app/core/store/shortcuts';
import { IgnoreErrorModalComponent } from '../ignore-error/ignore-error-modal.component';
import * as moment from 'moment';

const IGNORE: string = "Ignore Position(s)";
const IGNORE_ODOMETER: string = "Ignore Odometer";
const REASSIGN: string = "Reassign";

@Component({
  selector: 'app-dataview',
  templateUrl: './dataview.component.html',
  styleUrls: ['./dataview.component.css']
})
export class DataViewComponent implements OnInit {

  vehicle: Vehicle;
  profileId: string;
  locations: DomicileLocation[];

  private savedPositionData = null;
  private targetLocationInput = null;

  @ViewChild('columnSelectorContext', { read: ElementRef }) columnSelectorContext: ElementRef;
  showColumnSelector = false;
  columnSelectorMenuLeft: number;
  columnSelectorMenuTop: number;

  tableName = 'table_dataview_positions';
  tableColumns: ColumnSelector[] = [];
  tableColumnsClone: ColumnSelector[] = [];

  /**
   * Bounds definition for the map to fit.
   */
  fitBounds: number[][] = this.mbHelper.calculatePositionsBounds(null);
  fitBoundsOptions = {
    padding: { top: 25, bottom: 25, left: 25, right: 25 }
  }

  /**
   * Workaround for the map auto-resize issue.
   */
  theMapInstance: Map;
  onLoad(mapInstance: Map) {
    this.theMapInstance = mapInstance;
  }
  onMinifyMenu = this.actions$.subscribe(action => {
    if (action instanceof MinifyMenu) {
      this.theMapInstance.resize();
    }
  });

  /**
   * Map styling logic.
   */
  style: string = mapConfig.STREETS;
  isDefault: boolean = true;
  toggleStyle() {
    this.style = this.isDefault ? mapConfig.SATELLITE : mapConfig.STREETS;
    this.isDefault = !this.isDefault;
  }

  /**
   * Show/hide lines logic.
   */
  isShowLine: boolean = true;
  showHideLines() {
    this.isShowLine = !this.isShowLine;
  }

  /**
   * Show/hide locations logic.
   */
  isShow: boolean = false;
  @ViewChild("thePopup") thePopup: any;
  showHideLocations() {
    this.isShow = !this.isShow;
    this.loadLocations();
    if (!this.isShow) {
      this.locations = null;
      if (this.thePopup && this.thePopup.popupInstance) {
        this.thePopup.popupInstance.remove();
      }
    }
  }

  selectedElement: GeoJsonProperties;
  selectedLngLat: LngLat;
  cursorStyle: string;

  onClick(evt: MapLayerMouseEvent) {
    this.selectedLngLat = evt.lngLat;
    this.selectedElement = JSON.parse(evt.features![0].properties.asString);
  }

  /**
   * Position finder logic.
   */
  perPageOptions = ["100", "250", "500", "1000"];
  perPage = "500";
  perPageFixed: string = this.perPage;

  queryParams: {
    positions?: string,
    before?: string,
    hopToErrors?: boolean
  } = null;

  findData = {
    vehicle: null,
    before: this.dateService.getCurrentTime(),
    hopToErrors: false
  }
  vehicles: Vehicle[] = [];
  vehiclesLoaded: boolean = false;
  positions: PositionsData;
  pointFeatures: PointFeature[] = [];
  lineFeatures = {
    dotted: [],
    solid: []
  };
  positionsLoaded: boolean = false;
  isPositionsTableDisabled: boolean = false;

  page: number = 1;
  goToPageInitValue: number;
  selectedDataViewPage;
  maxPageView: number;
  goToPageArr: number[];

  changePage(newPage) {
    newPage = newPage ? newPage : this.selectedDataViewPage;
    this.selectedDataViewPage = newPage;
    this.page = newPage;
    this.doSearch(this.vehicle, newPage);
  }

  doSearchPositions() {
    this.positionsLoaded = false;
    this.page = 1;

    // set params from routing if they are existed
    if (this.queryParams && this.queryParams.positions) {
      this.perPage = this.queryParams.positions
    }
    if (this.queryParams && this.queryParams.before) {
      this.findData.before = new Date(this.queryParams.before);
    }

    this.perPageFixed = this.perPage;

    this.doSearch(this.findData.vehicle, this.page);
  }

  doSearch(vehicle: Vehicle, page: number) {
    let before = this.dateService.transform4Backend(this.findData.before);

    // add query params to routing
    this.router.navigate([this.router.url.split('?')[0]], {
      queryParams: {
        positions: this.perPageFixed,
        before,
        hopToErrors: this.findData.hopToErrors
      },
      replaceUrl: true
    });

    this.restService.getPositionsFor(vehicle.id, this.findData.hopToErrors, before, page, this.perPageFixed)
      .subscribe(
        data => {
          this.edit = false;
          this.positions = data;
          this.positionsLoaded = true;
          this.fitBounds = this.mbHelper.calculatePositionsBounds(this.positions.mapPositions);
          this.lineFeatures = this.positions.prepareLineFeatures();
          this.pointFeatures = this.positions.preparePointFeatures();

          this.vehicle = vehicle;
          this.setDropdownPagination();

          this.queryParams = null;
        }
      );
  }

  setDropdownPagination() {
    this.goToPageArr = [];
    this.maxPageView = Math.round(this.positions.resultCount / Number(this.perPageFixed)) + 1;
    this.goToPageArr = Array.from(Array(this.maxPageView - 1).keys()).map(value => value + 1);
    this.selectedDataViewPage = !this.selectedDataViewPage ? 1 : this.selectedDataViewPage;
  }

  seeErrors() {
    this.findData.vehicle = this.vehicle;
    this.findData.hopToErrors = true;
    this.doSearchPositions();
  }

  /**
   * Mouse enter/leave logic.
   */
  @ViewChild("scrollableDiv") scrollableDiv: ElementRef;

  iconEntered(iconFeature) {
    if (!this.isPositionsTableDisabled) {
      iconFeature.hover = true;
      let point: any = this.positions.tablePositions.find(function (p) {
        return iconFeature.positionId === p.id;
      });
      point.hover = true;

      // scroll to that element
      let index = this.positions.tablePositions.indexOf(point);
      this.scrollableDiv.nativeElement.scrollTop = index * 16.8 + (34 /* div header */ + 16.8 /* table header */)
        - this.scrollableDiv.nativeElement.clientHeight / 2 /* middle of the div */;
    }
  }

  iconLeaved(iconFeature: PointFeature) {
    if (!this.isPositionsTableDisabled) {
      iconFeature.hover = false;
      let point: any = this.positions.tablePositions.find(function (p) {
        return iconFeature.positionId === p.id;
      });
      point.hover = false;
    }
  }

  rowEntered(p) {
    p.hover = true;
    let feature = this.pointFeatures.find(function (f: PointFeature) {
      return f.positionId === p.id;
    });
    feature.hover = true;
  }

  rowLeaved(p) {
    p.hover = false;
    let feature = this.pointFeatures.find(function (f: PointFeature) {
      return f.positionId === p.id;
    });
    feature.hover = false;
  }

  /**
   * Add Position modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addPositionModal: BsModalRef;

  addPosition(position: Position) {
    let savedPositionData;
    if (this.targetLocationInput && this.targetLocationInput.forPosition && position.id === this.targetLocationInput.forPosition.id) {
      savedPositionData = this.savedPositionData;
    } else {
      savedPositionData = null;
    }
    let modalState = {
      profileId: this.profileId,
      forPosition: position,
      savedPositionData,
      callbackFunction: this.createPositions.bind(this)
    }
    this._addPositionModal = this.modalService.show(AddPositionModalComponent, {
      class: 'modal-lg modal-bottom',
      backdrop: false,
      initialState: modalState
    });
    this.switchCursorForMap(false);

    this.modalService.onHide
      .pipe(take(1))
      .subscribe((stringEvent) => {
        if (stringEvent === 'close') {
          this.savedPositionData = null;
          this.isPositionsTableDisabled = false;
        } else if (stringEvent === 'target') {
          this.savedPositionData = this._addPositionModal.content.positionsData;
          this.targetLocationInput = this._addPositionModal.content.targetLocationInput;
          this.isPositionsTableDisabled = true;
          this.switchCursorForMap(true);
        } else {
          this.savedPositionData = this._addPositionModal.content.positionsData;
          this.isPositionsTableDisabled = false;
        }
      });
  }

  createPositions(positionsData: any[]): void {
    let dateService = this.dateService;
    let vehicleid = this.vehicle.id;

    const positionDataForRequest = this.convertPositionsDataForRequest(positionsData);

    let body = {
      "createPositionRequests": positionDataForRequest.map((nextData: any, index: number) => {
        let isLocation = nextData.lastSelected.isLocation;
        let requestEntry = {
          vehicleId: vehicleid,
          datetime: dateService.transform4Backend(nextData.datetime),
        }
        if (isLocation) {
          requestEntry["locationId"] = nextData.lastSelected.entry.id;
        } else {
          let placeCenter = nextData.lastSelected.entry.center;
          requestEntry["lon"] = placeCenter[0];
          requestEntry["lat"] = placeCenter[1];
        }
        return requestEntry;
      })
    };

    this.restService.createManyPositions(body)
      .subscribe(
        success => {
          this._addPositionModal.hide();
          this.doSearch(this.vehicle, this.page);
        }
      );
  }

  /**
   * Positions edit logic.
   */
  edit = false;
  all: boolean = false;
  selectedOne: boolean = false;
  selectedTwo: boolean = false;
  action: string = "";

  beginEdit() {
    this.all = false;
    this.selectedOne = false;
    this.selectedTwo = false;
    this.action = "";
    this.positions.tablePositions.forEach(function (p: any) {
      p.checked = false;
    });
    this.edit = true;
  }

  cancelEdit() {
    this.edit = false;
  }

  /** Shortcuts logic */
  onExitEditMode = this.actions$.subscribe(action => {
    if (action instanceof ExitEditMode) {
      this.cancelEdit();
    }
  });

  checkSelectedOneTwo() {
    let count = 0;
    this.positions.tablePositions.map((p: any) => {
      if (p.checked) {
        count++;
      }
    });
    this.selectedOne = count >= 1;
    this.selectedTwo = count >= 2;
  }

  selectSingle(newValue, p) {
    p.checked = newValue;
    let notChecked = this.positions.tablePositions.find(function (p: any) {
      return !p.checked;
    });
    this.all = !notChecked;
    this.checkSelectedOneTwo();
  }

  selectAll(newValue) {
    this.positions.tablePositions.forEach(function (p: any) {
      p.checked = newValue;
    }.bind(this));
    this.all = newValue;
    this.checkSelectedOneTwo();
  }

  getCheckedPositions(): string[] {
    let result = [];
    this.positions.tablePositions.forEach(function (p: any) {
      if (p.checked) {
        result.push(p.id);
      }
    });
    return result;
  }

  /**
   * Position Edit Confirmation modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("reassignModal") _reassignModal: ModalDirective;
  reassign: any = {};

  performReassign() {
    this.reassign = {
      positionIds: this.getCheckedPositions()
    };
    this.restService.getVehiclesToAssignFor(this.vehicle.id, this.reassign.positionIds)
      .subscribe(
        success => {
          this.reassign.vehicles = success;
          this.reassign.toVehicle = (this.reassign.vehicles && this.reassign.vehicles.length >= 1 && this.reassign.vehicles[0]) || null;
          this._reassignModal.show();
        }
      );
  }

  closeReassignModal() {
    this._reassignModal.hide();
  }

  doReassign() {
    let data = {
      action: REASSIGN,
      assignToVehicleId: this.reassign.toVehicle.id
    }
    this.actionInProgress = true;
    this.restService.updatePositionsFor(this.vehicle.id, this.reassign.positionIds, data)
      .subscribe(
        success => {
          this.restService.getVehicle(this.vehicle.id)
            .subscribe(result => {
              this.vehicle = result;

              this.actionInProgress = false;
              this._reassignModal.hide();
              this.doSearch(this.vehicle, this.page);
            });
        },
        error => {
          this.actionInProgress = false;
        }
      );
  }

  /**
   * Position Edit Confirmation modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("regularEditModal") _regularEditModal: ModalDirective;
  regularEdit: any = {};

  performIgnore() {
    this.performRegularEdit(IGNORE);
  }

  performIgnoreOdometer() {
    this.performRegularEdit(IGNORE_ODOMETER);
  }

  performRegularEdit(action) {
    let firstChecked = this.positions.tablePositions.find(function (p: any) {
      return p.checked && !!p.datetime;
    });
    let positionIds = this.getCheckedPositions();

    this.regularEdit = {
      from: firstChecked.datetime,
      action: action,
      positionIds: positionIds
    }
    this._regularEditModal.show();
  }

  actionInProgress: boolean = false;
  closeRegularEditModal() {
    this._regularEditModal.hide();
  }

  doRegularEdit() {
    let data = {
      action: this.regularEdit.action
    }
    this.actionInProgress = true;
    this.restService.updatePositionsFor(this.vehicle.id, this.regularEdit.positionIds, data)
      .subscribe(
        success => {
          this.restService.getVehicle(this.vehicle.id)
            .subscribe(result => {
              this.vehicle = result;

              this.actionInProgress = false;
              this._regularEditModal.hide();
              this.doSearch(this.vehicle, this.page);
            });
        },
        error => {
          this.actionInProgress = false;
        }
      );
  }

  /**
   * Ignore Error callback
   */
  afterIgnoreError(vehicle: Vehicle, ignoreError: IgnoreErrorModalComponent) {
    this.vehicle = vehicle;
    ignoreError.closeIngoreErrorModal();
    if (this.positionsLoaded) {
      this.findData.vehicle = vehicle;
      this.doSearchPositions();
    }
  }

  /**
   * Constructor to instantiate an instance of DataViewComponent.
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private actions$: Actions,
    private restService: RestService,
    private modalService: BsModalService,
    private mbHelper: MapboxHelperService,
    private dateService: DateService,
    private render: Renderer2) { }

  private defaultColumnNames = [
    "Date", "Odometer", "Speed", "Road", "State", "Loc"
  ];

  saveSelectedColumns(columns: ColumnSelector[], tableName: string) {
    this.restService.saveColumnSelection(tableName, columns);
  }

  /**
   * Close column select menu on click outside
   */
  @HostListener('document:click', ['$event'])
  clickout(event) {
    const showHideElement = document.getElementById("contextShowHide");
    if (!!showHideElement && showHideElement.contains(event.target) && !this.showColumnSelector) {
      this.showContextMenu(event);
    } else if (this.showColumnSelector) {
      if (!this.columnSelectorContext.nativeElement.contains(event.target) && !showHideElement.contains(event.target)) {
        this.showColumnSelector = !this.showColumnSelector;
      }
    }
  }

  getColumnVisible(id) {
    return this.tableColumns.find(item => item.index === id).visible;
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
    this.isLastColumn = isLastColumn.length === 1;
  }
  isLastColumn: boolean;

  getName(name) {
    return name instanceof Function ? name() : name;
  }

  applyColumnSelection(tableName: string, tableColumns: ColumnSelector[]) {
    this.tableColumns = this.tableColumnsClone.map(next => ({ ...next })); // deep copy
    this.saveSelectedColumns(tableColumns, tableName);

    this.showColumnSelector = !this.showColumnSelector;
  }

  showContextMenu(e) {
    e.preventDefault();
    const columnsCount = this.tableColumns.length;
    const origin = {
      left: 240,
      top: -(60 + columnsCount * 22)
    };
    this.setPosition(origin);
    this.tableColumnsClone = this.tableColumns.map(next => ({ ...next })); // deep copy
    this.isLastColumn = this.tableColumnsClone.filter(item => item.visible === true).length === 1;
    this.showColumnSelector = !this.showColumnSelector;
  }
  setPosition({ top, left }) {
    this.columnSelectorMenuLeft = left;
    this.columnSelectorMenuTop = top;
  }

  ngOnInit() {
    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });

    let vehicleId = this.route.snapshot.paramMap.get("id");
    let hopToErrors = "true" == this.route.snapshot.queryParamMap.get('hopToErrors');

    // get query params from routing
    this.queryParams = this.route.snapshot.queryParams;

    this.findData.hopToErrors = hopToErrors;

    this.restService.getVehicle(vehicleId).subscribe(result => {
      this.vehicle = result;

      this.findData.vehicle = this.vehicle;
      this.profileId = (this.vehicle && this.vehicle.reportingProfile && this.vehicle.reportingProfile.id) || null;
      this.loadLocations();

      this.doSearchPositions();

    });

    this.restService.get1000VehiclesLight().subscribe(result => {
      this.vehicles = result;
      this.vehiclesLoaded = true;
    });
  }

  loadLocations() {
    if (this.isShow) {
      this.restService.getValidLocationsFor(this.profileId, null)
        .subscribe(result => {
          this.locations = result;
          // this.fitBounds = this.mbHelper.calculateBounds(this.locations);  
        });
    }
  }

  convertPositionsDataForRequest(positionsData) {
    const positionDataForRequest = [];

    // separate general object on origin and dest
    positionsData.map(data => {
      const { datetimeFrom, datetimeTo, lastSelectedFrom, lastSelectedTo } = data;

      const originObj = {
        datetime: datetimeFrom,
        lastSelected: lastSelectedFrom
      }
      positionDataForRequest.push(originObj);

      const destObj = {
        datetime: datetimeTo,
        lastSelected: lastSelectedTo
      }
      positionDataForRequest.push(destObj);
    });

    return positionDataForRequest;
  }

  switchCursorForMap(bool: boolean) {
    // crosshair
    if (bool) {
      this.render.addClass(document.body, 'map-target-cursor');
    } else {
      this.render.removeClass(document.body, 'map-target-cursor');
    }
  }

  setLocation(event) {
    if (this.targetLocationInput && event.lngLat) {
      const { order, direction } = this.targetLocationInput;

      const directionTypeString = direction.charAt(0).toUpperCase() + direction.slice(1);
      const lastSelectedOptionName = 'lastSelected' + directionTypeString;
      const theNameOptionName = 'theName' + directionTypeString;

      const { lng, lat } = event.lngLat;

      this.restService.searchPlaceByCoordinates(lng + ',' + lat).subscribe(result => {
        this.savedPositionData[order][lastSelectedOptionName] = {
          entry: result
        };
        this.savedPositionData[order][theNameOptionName] = result.place_name;
        this.addPosition(this.targetLocationInput.forPosition);
      })
    }
  }
}

@Component({
  selector: 'add-position-modal',
  templateUrl: './add-position-modal.component.html',
  styleUrls: ['./add-position-modal.component.css']
})
export class AddPositionModalComponent implements OnInit, OnDestroy {

  /** Initial state */
  profileId: string;
  forPosition: Position;
  callbackFunction;
  savedPositionData;

  /**
   * ISO8601 formatted datetime
   */
  beginDate: string;
  positionsData: any[];

  allSelected: boolean = false;
  searching: boolean; // not currently utilized

  // information for setting location to input
  targetLocationInput: { order: number, direction: 'from' | 'to', forPosition: Position } = null;

  searchPlaces = (input: NgbTypeahead, order: number, direction?: 'from' | 'to') => {
    const clickOption = this.changeOptionName('click', direction); // get 'clickFrom' or 'clickTo'
    let click$ = this.positionsData[order][`${clickOption}$`];
    let focus$ = this.positionsData[order].focus$;

    return (text$: Observable<string>) => {
      const debouncedText$ = text$.pipe(debounceTime(300), distinctUntilChanged());
      const clicksWithClosedPopup$ = click$.pipe(filter(() => !input.isPopupOpen()));
      const inputFocus$ = focus$;

      return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
        tap(() => this.searching = true),
        switchMap(term =>
          this.restService.doMixedProfileSearch(this.profileId, term).pipe(
            map(list => list.slice(0, 15))
          )
        ),
        tap(() => this.searching = false)
      );
    }
  }

  focusOut(index, direction?: 'from' | 'to') {
    let positionData = this.positionsData[index];
    let lastSelected = positionData.lastSelected;
    let isLocation = lastSelected && lastSelected.isLocation;

    let theNameOption = this.changeOptionName('theName', direction);

    if (!!lastSelected) {
      positionData[theNameOption] = isLocation ? lastSelected.entry.name : lastSelected.entry.place_name;
    }

    this.calculateConditions();
  }

  clickSelected(item, index, direction?: 'from' | 'to') {
    item.preventDefault();
    let positionData = this.positionsData[index];
    let lastSelectedOption = this.changeOptionName('lastSelected', direction);

    positionData[lastSelectedOption] = item.item;

    let isLocation = item.item.isLocation;
    let entry: any = item.item.entry;

    let theNameOption = this.changeOptionName('theName', direction);
    positionData[theNameOption] = isLocation ? entry.name : entry.place_name;

    this.calculateConditions();
  }

  createPositions(): void {
    this.callbackFunction(this.positionsData);
  }

  closeModal(): void {
    this.modalService.setDismissReason('close');
    this.bsModalRef.hide();
  }

  constructor(
    private bsModalRef: BsModalRef,
    private modalService: BsModalService,
    private restService: RestService,
    private tzHandler: TimezoneHandlerPipe) { }

  ngOnInit() {
    this.positionsData = [];
    if (this.savedPositionData) {
      this.positionsData = this.savedPositionData;
      this.calculateConditions()
    } else {
      this.beginDate = this.forPosition.datetime;
      this.addPosition();
    }
  }

  ngOnDestroy() {
    this.modalService.setDismissReason('rollup');
  }

  calculateConditions() {
    let notSelected = this.positionsData.find(function (positionData) {
      return !positionData.lastSelectedTo || !positionData.lastSelectedFrom || !positionData.datetimeFrom || !positionData.datetimeTo;
    });
    this.allSelected = !notSelected;
  }

  private calculateDateForNextPosition(): Date {
    if (this.positionsData.length === 0) {
      return this.tzHandler.transform(this.beginDate)
    }
    const previousDate = this.positionsData[this.positionsData.length - 1].datetimeTo;
    return moment(previousDate).add(3, 'hours').toDate();
  }

  /**
   * Unique ID holder to utilize within view for name/id fields (avoiding view mixed up for input values).
   */
  UNIQUE_ID: number = 1;
  addPosition() {
    let positionData = {
      id: this.UNIQUE_ID++,
      datetimeFrom: this.getDatetimeFromForNewPosition(),
      datetimeTo: this.calculateDateForNextPosition(),
      lastSelectedFrom: this.getLastLocationTo(),
      lastSelectedTo: null,
      /** Helper variable to hold last selected element */
      theNameFrom: this.getLastLocationTo() ? this.getLastLocationTo().entry.place_name : null,
      theNameTo: null,
      /** ngbTypeahead specific values */
      focus$: new Subject<string>(),
      clickFrom$: new Subject<string>(),
      clickTo$: new Subject<string>()
    };
    this.positionsData.push(positionData);
    this.allSelected = false; // no need in #calculateConditions()
  }

  deletePosition(index: number) {
    this.positionsData.splice(index, 1);
    this.calculateConditions();
  }

  changeOptionName(option: string, direction: 'from' | 'to') {
    let optionName = option;
    if (direction === 'from') {
      optionName += 'From';
    } else if (direction === 'to') {
      optionName += 'To'
    }
    return optionName;
  }

  target(order: number, direction: 'from' | 'to') {
    this.targetLocationInput = { order, direction, forPosition: this.forPosition };
    this.modalService.setDismissReason('target');
    this.bsModalRef.hide();
  }

  private getLastLocationTo() {
    const lastPosition = this.positionsData[this.positionsData.length - 1];
    if (lastPosition) {
      return lastPosition.lastSelectedTo;
    }
    return null;
  }

  private getDatetimeFromForNewPosition() {
    const lastPosition = this.positionsData[this.positionsData.length - 1];
    if (lastPosition) {
      return moment(lastPosition.datetimeTo).add(1, 'seconds').toDate();
    }
    return this.calculateDateForNextPosition();
  }

}
