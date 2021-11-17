import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { driversRouting } from './drivers.routing';
import { DriversComponent } from './drivers.component';
import { DriverViewComponent } from './driver-details/view/driver-view.component';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { FeaturesSharedModule } from '../shared/features-shared.module';
import { DriverDetailsComponent } from './driver-details/driver-details.component';
import { VehicleUtilizationComponent } from './driver-details/vehicle-utilization/vehicle-utilization.component';
import { DriverAlertsComponent } from './driver-details/alerts/alerts.component';
import { AlertViewModalComponent } from '../alerts/view/alert-view-modal.component';
import { EventsComponent } from './driver-details/events/events.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { DriverReportsComponent } from './driver-details/reports/reports.component';
import { DriverLogsComponent } from './driver-details/logs/logs.component';
import { DriverDevicesComponent } from './driver-details/devices/driver-devices.component';
import { Select2Module } from '@app/shared/forms/input/select2/select2.module';

@NgModule({
  declarations: [
    DriversComponent, DriverDetailsComponent, DriverViewComponent, VehicleUtilizationComponent, DriverAlertsComponent,
    EventsComponent, DriverReportsComponent, DriverLogsComponent, DriverDevicesComponent],
  entryComponents: [AlertViewModalComponent],
  imports: [
    CommonModule,
    driversRouting,
    SmartadminDatatableModule,
    SharedModule,
    OwlDateTimeModule, OwlNativeDateTimeModule,
    FeaturesSharedModule,
    NgSelectModule,
    Select2Module
  ]
})
export class DriversModule { }
