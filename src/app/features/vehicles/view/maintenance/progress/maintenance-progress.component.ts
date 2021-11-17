import { Component, NgZone, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { plainToClass } from 'class-transformer';

import {
  RestService, DataTableService, LocalStorageService, ColumnSelector, ColumnSelectorUtil, MaintenanceItemType, GlobalFunctionsService,
  MaintenanceItemProgress, Vehicle
} from '@app/core/services';
import { DateService, TimezoneHandlerPipe } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
  selector: 'app-vehicle-maintenance-progress',
  templateUrl: './maintenance-progress.component.html',
  styleUrls: ['./maintenance-progress.component.css']
})
export class VehicleMaintenanceProgressComponent implements OnInit, OnDestroy {

  @ViewChild("progressTable") progressTable: any;

  vehicleId: string;

  tableColumns: ColumnSelector[] = [];
  tableName = 'table_vehicle_maintenance_progress';

  valueColumns = [
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        var progressEncoded = this.gfService.encodeParam(full);
        return `<a onclick='truckspy.editProgress("${progressEncoded}")'>${full.name()}</a>`;
      }.bind(this)
    },
    {
      data: 'frequency',
      orderable: false
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let theType = full.theType();
        if (!theType) {
          return "";
        }

        let initialValueDatetime = this.dateService.transformDateTime(full.initialValueDateTime);
        if (theType == MaintenanceItemType.PERIODIC_BASED) {
          return initialValueDatetime;
        }
        return `${full.initialValue} (${initialValueDatetime})`;
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let theType = full.theType();
        if (!theType) {
          return "";
        }

        let lastUpdateDatetime = this.dateService.transformDateTime(full.lastUpdate);
        if (theType == MaintenanceItemType.PERIODIC_BASED) {
          return lastUpdateDatetime;
        }
        return (full.currentValueOf == 0) ? 'Unknown' : `${full.currentValueOf} (${lastUpdateDatetime})`;
      }.bind(this)
    },
    {
      data: 'remaining',
      orderable: false
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let issue = full.issue;
        if (!issue) {
          return "";
        }

        var issueDetails = `${issue.number} (${issue.status})`;
        var id = issue.id;
        return `<a href="#/maintenance/issues/${id}/view">${issueDetails}</a>`;
      }.bind(this)
    }
  ];

  options: any;
  vehicle: Vehicle = null;
  defineOptions() {
    this.options = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: 10,
      ajax: (data, callback, settings) => {
        let page: number = data.start / data.length + 1;
        this.restService.getAllMaintenanceItemsProgress(this.vehicleId, page)
          .subscribe(
            data => {
              callback({
                aaData: data ? data.results : [],
                recordsTotal: data ? data.resultCount : 0,
                recordsFiltered: data ? data.resultCount : 0
              })
            }
          );
      },
      columns: this.valueColumns,
      ordering: false
    }
  };

  /**
   * Edit Maintenance Progress functionality.
   */
  editProgress(progressEncoded: string) {
    this.ngZone.run(() => {
      var progress = this.gfService.decodeParam(progressEncoded);
      this.editProgressPrivate(progress);
    });
  }
  editProgressPrivate(progress: any) {
    let progressObject: MaintenanceItemProgress = plainToClass(MaintenanceItemProgress, progress as MaintenanceItemProgress);
    let theDateTime = progressObject.initialValueDateTime ? this.timezoneHandler.transform(progressObject.initialValueDateTime) : this.dateService.getCurrentTime();

    this.progressData = {
      progress: progressObject,
      initialValueDateTime: theDateTime
    }

    this._editProgressModal = this.modalService.show(this.editProgressModal, { class: "modal-400" });
  }

  @ViewChild('editProgressModal') editProgressModal: TemplateRef<any>;
  _editProgressModal: BsModalRef;
  progressData = {
    progress: null,
    initialValueDateTime: this.dateService.getCurrentTime(),
  }

  doUpdate(): void {
    let initialValueDateTime = this.dateService.transform4Backend(this.progressData.initialValueDateTime);
    this.restService.updateMaintenanceItemProgress(this.vehicleId, this.progressData.progress.scheduledMaintenanceItem.id, initialValueDateTime)
      .subscribe(
        data => {
          this._editProgressModal.hide();
          this.progressTable.ajaxReload();
        });
  }
  closeEditProgressModal(): void {
    this._editProgressModal.hide();
  }

  constructor(
    private route: ActivatedRoute,
    private restService: RestService,
    private modalService: BsModalService,
    private dataTableService: DataTableService,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService,
    private dateService: DateService,
    private timezoneHandler: TimezoneHandlerPipe,
    private lsService: LocalStorageService) { }

  ngOnInit() {
    this.vehicleId = this.route.snapshot.parent.paramMap.get('id');

    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.editProgress = this.editProgress.bind(this);

    this.restService.getVehicle(this.vehicleId)
      .subscribe(result => {
        this.vehicle = result;
      });

    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });

    this.defineOptions();
  }

  ngOnDestroy() {
    window.truckspy.editProgress = null;
  }

  private defaultColumnNames = [
    "Name", "Frequency", "Initial Value (as Of)", "Current Value (as Of)", "Remaining", "Linked Issue (Status)"];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

}
