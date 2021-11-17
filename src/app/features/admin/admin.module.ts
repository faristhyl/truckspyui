import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe, TitleCasePipe } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { QRCodeModule } from 'angularx-qrcode';
import { adminRouting } from './admin.routing';
import { CompaniesComponent } from './companies/companies.component';
import { AdminCompanyComponent } from './companies/view/company.component';
import { AdminCompanyInvoicesComponent } from './companies/view/invoices/invoices.component';
import { AdminCompanyUsersComponent } from './companies/view/company-users/company-users.component';
import { AdminDiscountsComponent } from './companies/view/discounts/discounts.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UsersComponent } from './users/users.component';
import { SystemComponent } from './system/system.component';
import { AdminInvoicesComponent } from './invoices/invoices.component';
import { AdminDevicesComponent } from './devices/devices.component';
import { AdminDeviceComponent } from './devices/view/device.component';
import { AdminDeviceEventsComponent } from './devices/view/device-events/device-events.component';
import { AdminConnectionsComponent } from './connections/connections.component';
import { AdminConnectionViewComponent } from './connections/view/connection-view.component';
import { AdminGroupsComponent } from './location/groups/groups.component';
import { AdminLocationsListComponent } from './location/list/locations-list.component';
import { AdminLocationViewComponent } from './location/list/view/location-view.component';
import { AdminLocationPositionComponent } from './location/list/view/position/location-position.component';
import { AdminLocationsComponent } from './location/locations/locations.component';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { FeaturesSharedModule } from '../shared/features-shared.module';
import { AngularDualListBoxModule } from 'angular-dual-listbox';
import { Select2Module } from '@app/shared/forms/input/select2/select2.module';
import { NgxMaskModule, IConfig } from 'ngx-mask'
export const maskOptions: Partial<IConfig> | (() => Partial<IConfig>) = {};
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';
import { MAPBOX_ACCESS_TOKEN } from '@app/core/smartadmin.config';
import { NgbPaginationModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { UserViewComponent } from './users/view/user-view.component';
import { SmartadminValidationModule } from '@app/shared/forms/validation/smartadmin-validation.module';

@NgModule({
  declarations: [DashboardComponent, CompaniesComponent, AdminCompanyComponent, AdminCompanyInvoicesComponent,
    AdminDiscountsComponent, UsersComponent, UserViewComponent, SystemComponent, AdminInvoicesComponent, AdminDevicesComponent,
    AdminDeviceComponent, AdminDeviceEventsComponent, AdminConnectionsComponent, AdminConnectionViewComponent,
    AdminCompanyUsersComponent, AdminGroupsComponent, AdminLocationsListComponent, AdminLocationViewComponent,
    AdminLocationPositionComponent, AdminLocationsComponent],
  providers: [DecimalPipe, TitleCasePipe],
  imports: [
    NgSelectModule,
    NgbPaginationModule,
    QRCodeModule,
    CommonModule,
    adminRouting,
    SmartadminDatatableModule,
    SharedModule,
    FeaturesSharedModule,
    AngularDualListBoxModule,
    Select2Module,
    NgxMaskModule.forRoot(maskOptions),
    NgbTypeaheadModule,
    NgxMapboxGLModule.withConfig({
      accessToken: MAPBOX_ACCESS_TOKEN
    }),
    SmartadminValidationModule
  ]
})
export class AdminModule { }
