import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { Select2Module } from '@app/shared/forms/input/select2/select2.module';

import { FeaturesSharedModule } from '../shared/features-shared.module';
import { linehaulTripsRouting } from './linehaul-trips.routing';
import { LinehaulTripsComponent } from './linehaul-trips.component';

@NgModule({
  declarations: [LinehaulTripsComponent],
  imports: [
    NgSelectModule,
    CommonModule,
    linehaulTripsRouting,
    SmartadminDatatableModule,
    SharedModule,
    Select2Module,
    OwlDateTimeModule, OwlNativeDateTimeModule,
    FeaturesSharedModule
  ]
})
export class LinehaulTripsModule { }
