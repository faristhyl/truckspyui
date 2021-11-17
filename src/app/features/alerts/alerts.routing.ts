import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from "@angular/core";
import { AlertsComponent } from "./alerts.component";
import { RequestedVideoComponent } from './requested-video/requested-video.component';
import { SafetyDashboardComponent } from './dashboard/safety-dashboard.component';

export const alertsRoutes: Routes = [
    {
        path: '',
        component: AlertsComponent,
        data: {
            pageTitle: 'Video Alerts'
        }
    },
    {
        path: 'dashboard',
        component: SafetyDashboardComponent,
        data: {
            pageTitle: 'Safety Dashboard'
        }
    },
    {
        path: 'video',
        component: RequestedVideoComponent,
        data: {
            pageTitle: 'Requested Video'
        }
    },
    {
        path: ':id',
        component: AlertsComponent,
        data: {
            pageTitle: 'Safety Alerts'
        }
    }
];

export const alertsRouting: ModuleWithProviders = RouterModule.forChild(alertsRoutes);
