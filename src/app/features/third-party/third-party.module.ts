import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe, TitleCasePipe } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { thirdPartyRouting } from './third-party.routing';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { Select2Module } from '@app/shared/forms/input/select2/select2.module';
import { NgxMaskModule, IConfig } from 'ngx-mask'
export const maskOptions: Partial<IConfig> | (() => Partial<IConfig>) = {};
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';
import { MAPBOX_ACCESS_TOKEN } from '@app/core/smartadmin.config';
import { NgbPaginationModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { DateTimeWidgetModule } from '@app/shared/date-time-widget/date-time-widget.module';
import { FeaturesSharedModule } from '../shared/features-shared.module';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { ThirdPartyVehiclesComponent } from './vehicles/vehicles.component';
import { ThirdPartyVehicleViewComponent } from './vehicles/view/vehicle-view.component';
import { ThirdPartyCompaniesComponent } from './companies/companies.component';
import { ThirdPartyCompanyComponent } from './companies/view/company.component';

@NgModule({
  declarations: [
    ThirdPartyVehiclesComponent, ThirdPartyVehicleViewComponent,
    ThirdPartyCompaniesComponent, ThirdPartyCompanyComponent
  ],
  providers: [DecimalPipe, TitleCasePipe],
  imports: [
    NgSelectModule,
    NgbPaginationModule,
    CommonModule,
    thirdPartyRouting,
    SmartadminDatatableModule,
    SharedModule,
    Select2Module,
    OwlDateTimeModule, OwlNativeDateTimeModule,
    FeaturesSharedModule,
    NgxMaskModule.forRoot(maskOptions),
    NgbTypeaheadModule,
    NgxMapboxGLModule.withConfig({
      accessToken: MAPBOX_ACCESS_TOKEN
    }),
    DateTimeWidgetModule
  ]
})
export class ThirdPartyModule { }
