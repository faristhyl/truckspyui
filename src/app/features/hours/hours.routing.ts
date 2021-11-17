import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { HoursComponent } from './hours.component';
import { LogsComponent } from './logs/logs.component';
import { ViolationComponent } from './violation/violation.component';
import { UnidentifiedDrivingComponent } from './unidentified-driving/unidentified-driving.component';
import { MalfunctionsComponent } from './malfunctions/malfunctions.component';
import { ReportComponent } from './report/report.component';
import { FmcsaDataTransferComponent } from './fmcsa-data-transfer/fmcsa-data-transfer.component';
import { LogEditsComponent } from './log-edits/log-edits.component';
import { DriversComponent } from './drivers/drivers.component';

export const hoursRoutes: Routes = [
  {
    path: '',
    component: HoursComponent,
    data: {
      pageTitle: 'Hours of Service',
    },
    children: [
      {
        path: '',
        redirectTo: 'drivers',
        pathMatch: 'full',
      },
      {
        path: 'drivers',
        component: DriversComponent
      },
      {
        path: 'logs',
        component: LogsComponent
      },
      {
        path: 'violation',
        component: ViolationComponent,
      },
      {
        path: 'unindentified-driving',
        component: UnidentifiedDrivingComponent,
      },
      {
        path: 'reports',
        component: ReportComponent,
      },
      {
        path: 'malfunctions',
        component: MalfunctionsComponent,
      },
      {
        path: 'log-edits',
        component: LogEditsComponent,
      },
      {
        path: 'fmcsa-data-transfer',
        component: FmcsaDataTransferComponent,
      },
    ],
  },
];

export const hoursRouting: ModuleWithProviders = RouterModule.forChild(hoursRoutes);
