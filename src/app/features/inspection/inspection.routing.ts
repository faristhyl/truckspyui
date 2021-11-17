import { Routes, RouterModule } from '@angular/router';
import { ConfigurationComponent } from './configuration/configuration.component';
import { ConfigurationViewComponent } from './configuration/view/configuration-view.component';
import { ModuleWithProviders } from "@angular/core";
import { InspectionListingComponent } from './inspection-listing/inspection-listing.component';
import { InspectionViewComponent } from './inspection-listing/view/inspection-view.component';

export const inspectionRoutes: Routes = [
    {
        path: 'configuration',
        component: ConfigurationComponent,
        data: {
            pageTitle: 'Configuration'
        }
    },
    {
        path: 'configurations/:id/view',
        component: ConfigurationViewComponent,
        data: {
            pageTitle: 'Configuration Details'
        }
    },
    {
        path: 'list',
        component: InspectionListingComponent,
        data: {
            pageTitle: 'Vehicle Inspections'
        }
    },
    {
        path: 'list/:id/view',
        component: InspectionViewComponent,
        data: {
            pageTitle: 'Inspection Details'
        }
    },
];

export const inspectionRouting: ModuleWithProviders = RouterModule.forChild(inspectionRoutes);
