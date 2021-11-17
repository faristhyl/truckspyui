import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from "@angular/core";
import { ThirdPartyVehiclesComponent } from './vehicles/vehicles.component';
import { ThirdPartyVehicleViewComponent } from './vehicles/view/vehicle-view.component';
import { ThirdPartyCompaniesComponent } from './companies/companies.component';
import { ThirdPartyCompanyComponent } from './companies/view/company.component';

export const thirdPartyRoutes: Routes = [
    {
        path: "",
        redirectTo: "vehicles",
        pathMatch: "full"
    },
    {
        path: 'vehicles',
        component: ThirdPartyVehiclesComponent,
        data: {
            pageTitle: 'Vehicles'
        }
    },
    {
        path: 'vehicles/:id/view',
        component: ThirdPartyVehicleViewComponent,
        data: {
            pageTitle: 'Vehicle Details'
        }
    },
    {
        path: "companies",
        component: ThirdPartyCompaniesComponent,
        data: {
            pageTitle: 'Companies'
        }
    },
    {
        path: 'companies/:id/view',
        component: ThirdPartyCompanyComponent,
        data: {
            pageTitle: 'Company Details'
        }
    }

];

export const thirdPartyRouting: ModuleWithProviders = RouterModule.forChild(thirdPartyRoutes);
