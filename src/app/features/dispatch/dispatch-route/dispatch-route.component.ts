import { Component, Input, OnInit } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { Map } from 'mapbox-gl';

import { mapConfig } from '@app/core/smartadmin.config';
import { Stop, RestService, DispatchRoute, MapBoxUtil } from '@app/core/services/rest.service';
import { MapboxHelperService } from '@app/core/services';
import { MinifyMenu } from '@app/core/store/layout';

@Component({
    selector: 'app-dispatch-route',
    templateUrl: './dispatch-route.component.html'
})
export class DispatchRouteComponent implements OnInit {

    @Input() stop: Stop;
    @Input() isNext: boolean;
    dispatchRoute: DispatchRoute;
    loaded: boolean = false;
    actualLayer: any;
    plannedLayer: any;

    constructor(
        private restService: RestService,
        private mbHelper: MapboxHelperService,
        private actions$: Actions) { }

    ngOnInit() {
        let plannedPoints = this.stop.plannedRoute && this.stop.plannedRoute.points || [];
        this.plannedLayer = MapBoxUtil.prepareLineLayerFor(plannedPoints);

        if (this.isNext) {
            this.restService.getDispatchRoute(this.stop.id)
                .subscribe(result => {
                    this.dispatchRoute = result;
                    if (!!this.dispatchRoute) {
                        let actualPoints = this.dispatchRoute.polyline && this.dispatchRoute.polyline.points || [];
                        let points = [...actualPoints, ...plannedPoints]
                        this.fitBounds = this.mbHelper.calculateRouteBounds(points);

                        this.actualLayer = MapBoxUtil.prepareLineLayerFor(actualPoints);
                    }
                    this.loaded = true;
                });
        } else {
            this.fitBounds = this.mbHelper.calculateRouteBounds(plannedPoints);
            this.loaded = true;
        }
    }

    /**
     * Workaround for the map auto-resize issue.
     */
    theMapInstance: Map;
    imageLoaded: boolean = false;
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
     * Bounds definition for the map to fit.
     */
    fitBounds: number[][] = this.mbHelper.calculateBounds(null);
    fitBoundsOptions = {
        padding: { top: 25, bottom: 25, left: 25, right: 25 }
    }

}
