import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from "@angular/core";
import { LinehaulTripsComponent } from './linehaul-trips.component';

export const linehaulTripsRoutes: Routes = [
    {
        path: '',
        component: LinehaulTripsComponent,
        data: {
            pageTitle: 'Linehaul Trips'
        }
    }
];

export const linehaulTripsRouting: ModuleWithProviders = RouterModule.forChild(linehaulTripsRoutes);
