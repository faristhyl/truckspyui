import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { Select2Module } from '@app/shared/forms/input/select2/select2.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { AddressInputComponent, AddressUtil } from './address-input.component';
import { CreateBokingComponent } from './create-booking.component';
import { DwellEventsComponent } from './dwellevents.component';
import { ReportsTableComponent } from './reports-table.component';
import { ReportsTableReportbasedComponent } from './reports-table-reportbased.component';
import { PasswordHiderComponent } from './password-hider.component';
import { LongActionLinkComponent } from './long-action-link.component';
import { InfoPanelComponent } from './info-panel.component';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { NgxMapboxGLModule } from "ngx-mapbox-gl";
import { MAPBOX_ACCESS_TOKEN } from "@app/core/smartadmin.config";
import { LocationMapComponent } from "./location-map.component";
import { VehicleMapComponent } from "./vehicle-map.component";
import { LocationMapModalComponent } from './location-map-modal.component';
import { VehicleMapModalComponent } from './vehicle-map-modal.component';
import { NgHighlightModule } from 'ngx-text-highlight';
import { GridChartComponent } from './gridchart.component';
import { NgSelectCustomTemplateComponent } from './ng-select-custom-template.component';
import { AlertViewModalComponent } from '../alerts/view/alert-view-modal.component';
import { LogsChartComponent } from './logs-chart.component';

import { NgxMaskModule, IConfig } from 'ngx-mask';
export const maskOptions: Partial<IConfig> | (() => Partial<IConfig>) = {};

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    NgSelectModule,
    Select2Module,
    SmartadminDatatableModule,
    OwlDateTimeModule, OwlNativeDateTimeModule,
    NgHighlightModule,
    NgxMapboxGLModule.withConfig({
      accessToken: MAPBOX_ACCESS_TOKEN
    }),
    NgxMaskModule.forRoot(maskOptions)
  ],
  providers: [AddressUtil],
  entryComponents: [AlertViewModalComponent],
  declarations: [
    AddressInputComponent, CreateBokingComponent, DwellEventsComponent,
    ReportsTableComponent,
    ReportsTableReportbasedComponent,
    PasswordHiderComponent,
    LongActionLinkComponent,
    InfoPanelComponent,
    LocationMapComponent,
    VehicleMapComponent,
    LocationMapModalComponent,
    VehicleMapModalComponent,
    GridChartComponent,
    NgSelectCustomTemplateComponent,
    AlertViewModalComponent,
    LogsChartComponent
  ],
  exports: [
    AddressInputComponent, CreateBokingComponent, DwellEventsComponent,
    ReportsTableComponent,
    ReportsTableReportbasedComponent,
    PasswordHiderComponent,
    LongActionLinkComponent,
    InfoPanelComponent,
    LocationMapComponent,
    VehicleMapComponent,
    LocationMapModalComponent,
    VehicleMapModalComponent,
    GridChartComponent,
    NgSelectCustomTemplateComponent,
    AlertViewModalComponent,
    LogsChartComponent
  ]
})
export class FeaturesSharedModule { }
