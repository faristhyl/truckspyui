import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { dispatchRouting } from './dispatch.routing';
import { DispatchComponent } from './dispatch.component';
import { TripAuditModalComponent } from './trip-audit/trip-audit-modal.component';
import { StopFeedbackModalComponent } from './stop-feedback/stop-feedback-modal.component';
import { DispatchRouteComponent } from './dispatch-route/dispatch-route.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { FeaturesSharedModule } from '../shared/features-shared.module';
import { NgDragDropModule } from 'ng-drag-drop';
import { Select2Module } from '@app/shared/forms/input/select2/select2.module';
import { NgHighlightModule } from 'ngx-text-highlight';
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';
import { MAPBOX_ACCESS_TOKEN } from '@app/core/smartadmin.config';

import { NgxMaskModule, IConfig } from 'ngx-mask';
import { DispatchHOSComponent } from './dispatch-hos/dispatch-hos.component';
export const maskOptions: Partial<IConfig> | (() => Partial<IConfig>) = {};

@NgModule({
  declarations: [DispatchComponent, TripAuditModalComponent, StopFeedbackModalComponent, DispatchRouteComponent,
    DispatchHOSComponent],
  imports: [
    NgSelectModule,
    NgbPaginationModule,
    CommonModule,
    dispatchRouting,
    SmartadminDatatableModule,
    SharedModule,
    OwlDateTimeModule, OwlNativeDateTimeModule,
    FeaturesSharedModule,
    Select2Module,
    NgHighlightModule,
    NgDragDropModule.forRoot(),
    NgxMapboxGLModule.withConfig({
      accessToken: MAPBOX_ACCESS_TOKEN
    }),
    NgxMaskModule.forRoot(maskOptions)
  ]
})
export class DispatchModule { }
