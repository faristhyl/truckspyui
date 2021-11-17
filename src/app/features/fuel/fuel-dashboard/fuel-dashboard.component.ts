import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { Map, LngLat, LngLatBounds, MapLayerMouseEvent } from 'mapbox-gl';
import { PopupComponent } from 'ngx-mapbox-gl/lib/popup/popup.component';
import { merge, Observable, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import * as _ from 'lodash';

import { FuelStation, MapboxHelperService, MapboxPlace, RestService } from '@app/core/services';
import { mapConfig } from '@app/core/smartadmin.config';

@Component({
    selector: 'app-fuel-dashboard',
    templateUrl: './fuel-dashboard.component.html',
    styleUrls: ['./fuel-dashboard.component.css']
})
export class FuelDashboardComponent implements OnInit {

    @ViewChild("thePopup") thePopup: any;

    stations: FuelStation[] = [];
    displayStations: FuelStation[] = [];
    stationsCoordinates: number[] = null;
    radiuses: number[] = [25, 50, 100, 250, 500];
    radiusToZoom = { 25: 8, 50: 7, 100: 6, 250: 5, 500: 4 };
    radius: number = this.radiuses[0];

    fitBoundsOptions = {
        padding: { top: 25, bottom: 25, left: 25, right: 25 }
    }
    fitBounds: number[][] = this.mbHelper.calculateBounds(null);
    theMapInstance: Map;
    thePopupInstance: PopupComponent;

    searching: boolean;
    @ViewChild('searchInput') _searchInput: NgbTypeahead;
    focus$ = new Subject<string>();
    click$ = new Subject<string>();

    onDestroy$: Subject<any> = new Subject();

    model: any;
    searchPlaces = (text$: Observable<string>) => {
        const debouncedText$ = text$.pipe(debounceTime(300), distinctUntilChanged());
        const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this._searchInput.isPopupOpen()));
        const inputFocus$ = this.focus$;

        return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
            tap(() => this.searching = true),
            switchMap(term => {
                if (term) {
                    return this.restService.searchPlacesByCoordinates(term);
                }
                this.stationsCoordinates = null;
                this.closePopup();
            }),
        );
    }

    onRadiusChange(value): void {
        this.radius = value;
        if (!!this.stationsCoordinates) {
            this.loadStations$().subscribe(res => {
                if (!!this.stationsCoordinates) {
                    this.showPlace({ center: this.stationsCoordinates });
                }
            });
        }
    }
    clickSelected(item) {
        item.preventDefault();
        const entry: any = item.item;
        this.stationsCoordinates = entry.center;

        this.closePopup();
        this.loadStations$().subscribe(res => {
            const firstItem = res.results[0]
            if (firstItem && firstItem.address1 === entry.place_name) {
                const lngLat = new LngLat(firstItem.longitude, firstItem.latitude);
                this.displayModal(firstItem, lngLat)
            }
            this.showPlace(entry);
        });
    }

    constructor(
        private mbHelper: MapboxHelperService,
        private restService: RestService) { }

    ngOnInit() {
        this.loadStations$().subscribe();
    }

    ngOnDestroy() {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    loadStations$() {
        return this.restService.get10000FuelStations(this.stationsCoordinates, this.radius).pipe(
            map((res) => {
                this.stations = res.results;
                this.stationsLength = res.resultCount;
                this.changePage(1);
                return res;
            }),
            takeUntil(this.onDestroy$)
        );
    }

    /**
     * Map styling logic.
     */
    style: string = mapConfig.STREETS;
    isDefault: boolean = true;
    toggleStyle() {
        this.style = this.isDefault ? mapConfig.SATELLITE : mapConfig.STREETS;
        this.isDefault = !this.isDefault;
    }

    showPlace(place: MapboxPlace | { center }) {
        let point = place.center;
        let lngLat = new LngLat(point[0], point[1]);
        this.theMapInstance.setCenter(lngLat);

        let theZoom = this.radiusToZoom[this.radius] || 4;
        // fly to exact location
        this.theMapInstance.flyTo({
            center: lngLat,
            zoom: theZoom
        });
    }

    /**
     * Workaround for the map auto-resize issue.
     */
    imageLoaded: boolean = false;
    onLoad(mapInstance: Map) {
        this.theMapInstance = mapInstance;
    }

    onClick(evt: MapLayerMouseEvent) {
        let properties = JSON.parse(evt.features![0].properties.asString);
        let location = properties;
        this.displayModal(location, evt.lngLat);
    }

    selectedLngLat;
    selectedElement;
    displayModal(location: FuelStation, lngLat: LngLat = null) {
        if (!lngLat) {
            lngLat = new LngLat(location.longitude, location.latitude);
        }
        // Display modal
        this.selectedLngLat = lngLat;
        this.selectedElement = location;
    }

    closePopup() {
        this.selectedLngLat = this.selectedElement = null;
    }

    /**
     * Pagination logic.
     */
    page = 1;
    perPage = 10;
    stationsLength = 0;
    changePage(event) {
        if (this.thePopup && this.thePopup.popupInstance) {
            this.thePopup.popupInstance.remove();
        }

        this.page = event;
        let begin = (this.page - 1) * this.perPage;
        let end = (this.page * this.perPage);
        this.displayStations = _.slice(this.stations, begin, end);
    }

}
