import { Component, OnInit, ViewChild, Input, NgZone } from '@angular/core';
import { Router } from '@angular/router';

import {
  RestService, ColumnSelector, ColumnSelectorUtil, FilterParams, DataTableService, Vehicle, GlobalFunctionsService
} from '@app/core/services';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
  selector: 'app-inspections-for',
  templateUrl: './inspections-for.component.html',
  styleUrls: ['./inspections-for.component.css']
})
export class InspectionListingForComponent implements OnInit {

  @Input() theVehicle: Vehicle;
  @ViewChild("inspectionsForTable") inspectionsForTable: any;

  tableLength: number;
  tableColumns: ColumnSelector[] = [];
  tableName = 'table_inspection_inspections_for';

  orderColumns = ['inspectionNum', null, 'createdAt', null, "type"];

  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        var inspectionNum = full.getNum();
        var inspectionEncoded = this.gfService.encodeParam(full);
        return `<a onclick='truckspy.openInspection("${inspectionEncoded}")'>${inspectionNum}</a>`;
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        const driver = full.driver;
        if (!driver) {
          return '';
        }
        var remoteId = driver.remoteId || "(unspecified)";
        var name = driver.name();
        var id = driver.id;
        return `<a href="#/drivers/${id}/view">${remoteId} ${name}</a>`;
      }
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return this.dateService.transformDateTime(full.createdAt);
      }.bind(this)
    },
    {
      data: "defectCount",
      orderable: false,
    },
    {
      data: "type"
    }
  ];
  options = {
    noToolbar: true,
    processing: true,
    serverSide: true,
    pageLength: 5,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
      this.restService.getAllInspections(params, 5, this.theVehicle.id)
        .subscribe(
          data => {
            callback({
              aaData: data.results,
              recordsTotal: data.resultCount,
              recordsFiltered: data.resultCount
            })
          }
        );
    },
    columns: this.valueColumns,
    order: [[2, 'desc']]
  }

  openInspection(inspectionEncoded: string) {
    this.ngZone.run(() => {
      var inspection = this.gfService.decodeParam(inspectionEncoded);
      this.openInspectionPrivate(inspection);
    });
  }
  openInspectionPrivate(inspection: any) {
    this.router.navigateByUrl('/empty', { skipLocationChange: true })
      .then(() =>
        this.router.navigate([`/inspection/list/${inspection.id}/view`])
      );
  }

  constructor(
    private router: Router,
    private restService: RestService,
    private dataTableService: DataTableService,
    private dateService: DateService,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService) { }

  ngOnInit() {
    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });

    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.openInspection = this.openInspection.bind(this);
  }

  ngOnDestroy(): void {
    window.truckspy.openInspection = null;
  }

  private defaultColumnNames = [
    'Inspection Num', "Driver", "Created At", "Defects", "Type"];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

}
