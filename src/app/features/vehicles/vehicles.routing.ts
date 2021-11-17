import { Routes, RouterModule } from '@angular/router';
import { VehiclesComponent } from "./vehicles.component";
import { ModuleWithProviders } from "@angular/core";
import { VehicleViewComponent } from './view/vehicle-view.component';
import { DataViewComponent } from './dataview/dataview.component';
import { VehicleGeneralComponent } from './view/general/vehicle-general.component';
import { VehicleFuelComponent } from './view/fuel/fuel.component';
import { VehicleAlertsComponent } from './view/alerts/alerts.component';
import { VehicleEventsComponent } from './view/events/events.component';
import { UtilizationComponent } from './view/utilization/utilization.component';
import { VehicleInspectionsComponent } from './view/vehicle-inspections/vehicle-inspections.component';
import { VehicleMaintenanceComponent } from './view/maintenance/vehicle-maintenance.component';

export const vehiclesRoutes: Routes = [
    {
        path: '',
        component: VehiclesComponent,
        data: {
            pageTitle: 'Vehicles'
        }
    },
    {
        path: ':id',
        children: [
            {
                path: '',
                redirectTo: 'view'
            },
            {
                path: 'view',
                component: VehicleGeneralComponent
            },
            {
                path: 'fuel',
                component: VehicleFuelComponent
            },
            {
                path: 'alerts',
                component: VehicleAlertsComponent
            },
            {
                path: 'maintenance',
                component: VehicleMaintenanceComponent
            },
            {
                path: 'inspections',
                component: VehicleInspectionsComponent
            },
            {
                path: 'utilization',
                component: UtilizationComponent
            },
            {
                path: 'events',
                component: VehicleEventsComponent
            }
        ],
        component: VehicleViewComponent,
        data: {
            pageTitle: 'Vehicle Details'
        }
    },
    {
        path: ':id/dataview',
        component: DataViewComponent,
        data: {
            pageTitle: 'Data View'
        }
    }
];

export const vehiclesRouting: ModuleWithProviders = RouterModule.forChild(vehiclesRoutes);
