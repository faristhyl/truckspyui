import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';
import { MaintenanceIssuesComponent } from './issues/maintenance-issues.component';
import { MaintenanceIssueViewComponent } from './issues/view/maintenance-issue-view.component';
import { MaintenanceWorkOrdersComponent } from './workorders/maintenance-workorders.component';
import { MaintenanceWorkOrderViewComponent } from './workorders/view/maintenance-workorder-view.component';
import { MaintenanceConfigurationComponent } from './configuration/maintenance-configuration.component';
import { ScheduledDashboardComponent } from './scheduled-dashboard/scheduled-dashboard.component';

export const maintenanceRoutes: Routes = [
    {
        path: 'issues',
        component: MaintenanceIssuesComponent,
        data: {
            pageTitle: 'Maintenance Issues',
        },
    },
    {
        path: 'issues/:id/view',
        component: MaintenanceIssueViewComponent,
        data: {
            pageTitle: 'Issue Details'
        }
    },
    {
        path: 'workorders',
        component: MaintenanceWorkOrdersComponent,
        data: {
            pageTitle: 'Maintenance Work Orders',
        },
    },
    {
        path: 'workorders/:id/view',
        component: MaintenanceWorkOrderViewComponent,
        data: {
            pageTitle: 'Work Order Details'
        }
    },
    {
        path: 'configuration',
        component: MaintenanceConfigurationComponent,
        data: {
            pageTitle: 'Maintenance Configuration',
        },
    },
    {
        path: 'scheduled-dashboard',
        component: ScheduledDashboardComponent,
        data: {
            pageTitle: 'Scheduled Dashboard',
        },
    },
];

export const maintenanceRouting: ModuleWithProviders = RouterModule.forChild(maintenanceRoutes);
