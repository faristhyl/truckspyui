import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { fuelRouting } from './fuel.routing';
import { FuelComponent } from './fuel.component';
import { FuelDashboardComponent } from './fuel-dashboard/fuel-dashboard.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { FeaturesSharedModule } from '../shared/features-shared.module';
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';
import { MAPBOX_ACCESS_TOKEN } from '@app/core/smartadmin.config';
import { NgbPaginationModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [FuelComponent, FuelDashboardComponent],
  imports: [
    NgSelectModule,
    CommonModule,
    fuelRouting,
    SmartadminDatatableModule,
    SharedModule,
    FeaturesSharedModule,
    NgxMapboxGLModule.withConfig({
      accessToken: MAPBOX_ACCESS_TOKEN
    }),
    NgbPaginationModule,
    NgbTypeaheadModule
  ]
})
export class FuelModule { }
