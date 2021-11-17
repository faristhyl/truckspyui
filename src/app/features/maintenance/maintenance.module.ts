import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { maintenanceRouting } from './maintenance.routing';
import { SharedModule } from '@app/shared/shared.module';
import { SmartadminDatatableModule } from '@app/shared/ui/datatable/smartadmin-datatable.module';
import { FeaturesSharedModule } from '../shared/features-shared.module';
import { OnOffSwitchModule } from '../../shared/forms/input/on-off-switch/on-off-switch.module';
import { NgDragDropModule } from 'ng-drag-drop';
import { NgHighlightModule } from 'ngx-text-highlight';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { Select2Module } from '@app/shared/forms/input/select2/select2.module';
import { MaintenanceIssuesComponent } from './issues/maintenance-issues.component';
import { MaintenanceIssueViewComponent } from './issues/view/maintenance-issue-view.component';
import { MaintenanceIssuePositionComponent } from './issues/view/position/maintenance-issue-position.component';
import { MaintenanceWorkOrdersComponent } from './workorders/maintenance-workorders.component';
import { MaintenanceWorkOrderViewComponent } from './workorders/view/maintenance-workorder-view.component';
import { MaintenanceConfigurationComponent } from './configuration/maintenance-configuration.component';
import { FaultRulesComponent } from './configuration/fault-rules/fault-rules.component';
import { MaintenanceGroupsComponent } from './configuration/maintenance-groups/maintenance-groups.component';
import { MaintenanceItemsComponent } from './configuration/maintenance-items/maintenance-items.component';
import { ScheduledDashboardComponent } from './scheduled-dashboard/scheduled-dashboard.component';

@NgModule({
  declarations: [MaintenanceIssuesComponent, MaintenanceWorkOrdersComponent, MaintenanceConfigurationComponent,
    MaintenanceIssueViewComponent, FaultRulesComponent, MaintenanceGroupsComponent, MaintenanceItemsComponent,
    MaintenanceWorkOrderViewComponent, MaintenanceIssuePositionComponent, ScheduledDashboardComponent],
  providers: [DecimalPipe],
  imports: [
    NgSelectModule,
    NgbPaginationModule,
    CommonModule,
    maintenanceRouting,
    SmartadminDatatableModule,
    SharedModule,
    FeaturesSharedModule,
    Select2Module,
    OnOffSwitchModule,
    NgHighlightModule,
    OwlDateTimeModule, OwlNativeDateTimeModule,
    NgDragDropModule.forRoot()
  ]
})
export class MaintenanceModule { }
