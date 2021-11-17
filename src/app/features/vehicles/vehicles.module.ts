import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbPaginationModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { vehiclesRouting } from './vehicles.routing';
import { OdometerComponent } from './view/odometer/odometer.component';
import { VehicleFuelComponent } from './view/fuel/fuel.component';
import { VehiclePositionComponent } from './view/position/position.component';
import { VehiclesComponent } from './vehicles.component';
import { VehicleViewComponent } from './view/vehicle-view.component';
import { VehicleGeneralComponent } from './view/general/vehicle-general.component';
import { VehicleDevicesComponent } from './view/devices/vehicle-devices.component';
import { VehicleAlertsComponent } from './view/alerts/alerts.component';
import { VehicleEventsComponent } from './view/events/events.component';
import { UtilizationComponent } from './view/utilization/utilization.component';
import { VehicleInspectionsComponent } from './view/vehicle-inspections/vehicle-inspections.component';
import { VehicleMaintenanceComponent } from './view/maintenance/vehicle-maintenance.component';
import { VehicleMaintenanceIssuesComponent } from './view/maintenance/issues/maintenance-issues.component';
import { VehicleMaintenanceWorkOrdersComponent } from './view/maintenance/workorders/maintenance-workorders.component';
import { VehicleMaintenanceProgressComponent } from './view/maintenance/progress/maintenance-progress.component';
import { AddPositionModalComponent, DataViewComponent } from './dataview/dataview.component';
import { IgnoreErrorModalComponent } from './ignore-error/ignore-error-modal.component';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { FeaturesSharedModule } from '../shared/features-shared.module';
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';
import { MAPBOX_ACCESS_TOKEN } from '@app/core/smartadmin.config';
import { DateTimeWidgetModule } from "@app/shared/date-time-widget/date-time-widget.module";
import { Select2Module } from '@app/shared/forms/input/select2/select2.module';

@NgModule({
  declarations: [OdometerComponent, VehicleFuelComponent, VehiclePositionComponent, VehiclesComponent,
    VehicleViewComponent, DataViewComponent, AddPositionModalComponent, IgnoreErrorModalComponent,
    VehicleDevicesComponent, VehicleGeneralComponent, VehicleAlertsComponent, VehicleEventsComponent,
    UtilizationComponent, VehicleInspectionsComponent, VehicleMaintenanceComponent, VehicleMaintenanceIssuesComponent,
    VehicleMaintenanceWorkOrdersComponent, VehicleMaintenanceProgressComponent],
  imports: [
    NgSelectModule,
    NgbPaginationModule,
    CommonModule,
    vehiclesRouting,
    SmartadminDatatableModule,
    SharedModule,
    OwlDateTimeModule, OwlNativeDateTimeModule,
    FeaturesSharedModule,
    NgbTypeaheadModule,
    NgxMapboxGLModule.withConfig({
      accessToken: MAPBOX_ACCESS_TOKEN
    }),
    DateTimeWidgetModule,
    Select2Module
  ],
  entryComponents: [AddPositionModalComponent],
})
export class VehiclesModule { }
