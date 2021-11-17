import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { preferencesRouting } from './preferences.routing';
import { PreferencesComponent } from './preferences.component';
import { NotificationSettingsComponent } from './notification-settings/notification-settings.component';
import { NotificationSendingComponent } from './notification-sending/notification-sending.component';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '@app/shared/shared.module';

@NgModule({
  declarations: [PreferencesComponent, NotificationSettingsComponent, NotificationSendingComponent],
  imports: [
    NgSelectModule,
    CommonModule,
    preferencesRouting,
    SharedModule,
    SmartadminDatatableModule,
  ]
})
export class PreferencesModule { }
