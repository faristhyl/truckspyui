import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { alertsRouting } from './alerts.routing';
import { AlertsComponent } from './alerts.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { FeaturesSharedModule } from '../shared/features-shared.module';
import { Select2Module } from '@app/shared/forms/input/select2/select2.module';
import { RequestedVideoComponent } from './requested-video/requested-video.component';
import { RequestVideoComponent } from './requested-video/request-video/request-video.component';
import { DateTimeWidgetModule } from '@app/shared/date-time-widget/date-time-widget.module';
import { VideosViewComponent } from './requested-video/videos-view/videos-view.component';
import { SafetyDashboardComponent } from './dashboard/safety-dashboard.component';

@NgModule({
  declarations: [
    AlertsComponent,
    SafetyDashboardComponent,
    RequestedVideoComponent,
    RequestVideoComponent,
    VideosViewComponent
  ],
  entryComponents: [RequestVideoComponent, VideosViewComponent],
  imports: [
    NgSelectModule,
    CommonModule,
    alertsRouting,
    SmartadminDatatableModule,
    SharedModule,
    OwlDateTimeModule, OwlNativeDateTimeModule,
    FeaturesSharedModule,
    Select2Module,
    DateTimeWidgetModule
  ]
})
export class AlertsModule { }
