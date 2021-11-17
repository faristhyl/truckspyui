import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from "@angular/core";
import { DriversComponent } from "./drivers.component";
import { DriverViewComponent } from './driver-details/view/driver-view.component';
import { DriverDetailsComponent } from './driver-details/driver-details.component';
import { VehicleUtilizationComponent } from './driver-details/vehicle-utilization/vehicle-utilization.component';
import { DriverAlertsComponent } from './driver-details/alerts/alerts.component';
import { EventsComponent } from './driver-details/events/events.component';
import { DriverLogsComponent } from './driver-details/logs/logs.component';

export const driversRoutes: Routes = [
  {
    path: '',
    component: DriversComponent,
    data: {
      pageTitle: 'Drivers'
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
        component: DriverViewComponent
      },
      {
        path: 'logs',
        component: DriverLogsComponent
      },
      {
        path: 'safety-alerts',
        component: DriverAlertsComponent
      },
      {
        path: 'vehicle-utilization',
        component: VehicleUtilizationComponent
      },
      {
        path: 'events',
        component: EventsComponent
      }
    ],
    component: DriverDetailsComponent,
    data: {
      pageTitle: 'Driver Details'
    }
  }
];

export const driversRouting: ModuleWithProviders = RouterModule.forChild(driversRoutes);
