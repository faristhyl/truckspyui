import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from "@angular/core";

import { CompaniesComponent } from "./companies/companies.component";
import { AdminCompanyComponent } from './companies/view/company.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UsersComponent } from './users/users.component';
import { SystemComponent } from './system/system.component';
import { AdminInvoicesComponent } from './invoices/invoices.component';
import { AdminDevicesComponent } from "./devices/devices.component";
import { AdminDeviceComponent } from "./devices/view/device.component";
import { AdminConnectionsComponent } from './connections/connections.component';
import { AdminConnectionViewComponent } from './connections/view/connection-view.component';
import { AdminGroupsComponent } from './location/groups/groups.component';
import { AdminLocationsListComponent } from './location/list/locations-list.component';
import { AdminLocationViewComponent } from './location/list/view/location-view.component';
import { AdminLocationsComponent } from './location/locations/locations.component';
import { UserViewComponent } from './users/view/user-view.component';

export const adminRoutes: Routes = [
    {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full"
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
        data: {
            pageTitle: 'Dashboard'
        }
    },
    {
        path: 'companies',
        component: CompaniesComponent,
        data: {
            pageTitle: 'Companies'
        }
    },
    {
        path: 'companies/:id/view',
        component: AdminCompanyComponent,
        data: {
            pageTitle: 'Company Details'
        }
    },
    {
        path: 'users',
        component: UsersComponent,
        data: {
            pageTitle: 'Users'
        }
    },
    {
        path: 'users/:id/view',
        component: UserViewComponent,
        data: {
            pageTitle: 'User Details'
        }
    },
    {
        path: 'system',
        component: SystemComponent,
        data: {
            pageTitle: 'System'
        }
    },
    {
        path: 'invoices',
        component: AdminInvoicesComponent,
        data: {
            pageTitle: 'Invoices'
        }
    },
    {
        path: 'connections',
        component: AdminConnectionsComponent,
        data: {
            pageTitle: 'Connections'
        }
    },
    {
        path: 'connections/:id/view',
        component: AdminConnectionViewComponent,
        data: {
            pageTitle: 'Connection Details'
        }
    },
    {
        path: 'devices',
        component: AdminDevicesComponent,
        data: {
            pageTitle: 'Devices'
        }
    },
    {
        path: 'devices/:id/view',
        component: AdminDeviceComponent,
        data: {
            pageTitle: 'Device Details'
        }
    },
    {
        path: 'location/groups',
        component: AdminGroupsComponent,
        data: {
            pageTitle: 'Groups'
        }
    },
    {
        path: 'location/locations',
        component: AdminLocationsComponent,
        data: {
            pageTitle: 'Locations Map'
        }
    },
    {
        path: 'location/list',
        component: AdminLocationsListComponent,
        data: {
            pageTitle: 'Locations List'
        }
    },
    {
        path: 'location/list/:id/view',
        component: AdminLocationViewComponent,
        data: {
            pageTitle: 'Location Details'
        }
    }
];

export const adminRouting: ModuleWithProviders = RouterModule.forChild(adminRoutes);
