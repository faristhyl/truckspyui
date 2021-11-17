import { Routes, RouterModule } from '@angular/router';
import { FuelComponent } from "./fuel.component";
import { FuelDashboardComponent } from './fuel-dashboard/fuel-dashboard.component';
import { ModuleWithProviders } from "@angular/core";

export const fuelRoutes: Routes = [
    {
        path: '',
        redirectTo: 'list'
    },
    {
        path: 'list',
        component: FuelComponent,
        data: {
            pageTitle: 'Fuel'
        }
    },
    {
        path: 'dashboard',
        component: FuelDashboardComponent,
        data: {
            pageTitle: 'Fuel Dashboard'
        }
    }
];

export const fuelRouting: ModuleWithProviders = RouterModule.forChild(fuelRoutes);
