import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { hoursRouting } from './hours.routing';
import { HoursComponent } from './hours.component';
import { LogsComponent } from './logs/logs.component';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';

import { ChartModule, HIGHCHARTS_MODULES } from 'angular-highcharts';
import stock from 'highcharts/modules/stock.src';
import more from 'highcharts/highcharts-more.src';
export function highchartsModules() {
  return [stock, more];
}

import { SharedModule } from '@app/shared/shared.module';
import { FeaturesSharedModule } from '../shared/features-shared.module';
import { OwlNativeDateTimeModule, OwlDateTimeModule } from 'ng-pick-datetime';
import { ViolationComponent } from './violation/violation.component';
import { UnidentifiedDrivingComponent } from './unidentified-driving/unidentified-driving.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { MalfunctionsComponent } from './malfunctions/malfunctions.component';
import { ReportComponent } from './report/report.component';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ReportModalComponent } from './report/report-modal/report-modal.component';
import { FmcsaDataTransferComponent } from './fmcsa-data-transfer/fmcsa-data-transfer.component';
import { LogEditsComponent } from './log-edits/log-edits.component';
import { AngularDualListBoxModule } from 'angular-dual-listbox';
import { DriversComponent } from './drivers/drivers.component';

@NgModule({
  declarations: [
    HoursComponent,
    LogsComponent,
    ViolationComponent,
    UnidentifiedDrivingComponent,
    ReportComponent,
    MalfunctionsComponent,
    ReportModalComponent,
    FmcsaDataTransferComponent,
    LogEditsComponent,
    DriversComponent
  ],
  imports: [
    ChartModule,
    CommonModule,
    hoursRouting,
    SmartadminDatatableModule,
    SharedModule,
    FeaturesSharedModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    NgSelectModule,
    NgbModalModule,
    AngularDualListBoxModule
  ],
  entryComponents: [],
  providers: [
    { provide: HIGHCHARTS_MODULES, useFactory: highchartsModules },
  ],
})
export class HoursModule { }
