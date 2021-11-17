import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as moment from "moment";

import { RestService, FilterParams, DataTableService, ColumnSelector, ColumnSelectorUtil } from '@app/core/services'
import { CapitalizeAllPipe, ReplaceUnderscorePipe } from '@app/shared/pipes/utils.pipe';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
  selector: 'app-admin-device-events',
  templateUrl: './device-events.component.html',
  styleUrls: ['./device-events.component.css']
})
export class AdminDeviceEventsComponent implements OnInit {

  deviceId: string;

  @ViewChild("eventsTable") eventsTable: any;

  tableColumns: ColumnSelector[] = [];
  tableName = 'table_admin_device_events';

  orderColumnsEvents = ['datetime', 'event', 'textualLocation', null];
  valueColumnsEvents = [
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return `${this.dateService.transformDateTime(full.datetime)} (${moment.utc(full.datetime).fromNow()})`;
      }.bind(this)
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        let noUnderscore = this.replaceUnderscore.transform(full.event);
        return this.capitalizeAll.transform(noUnderscore);
      }.bind(this)
    },
    {
      data: 'textualLocation',
      orderable: true
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return (full.context && full.context.description) || '';
      }
    },
  ];
  optionsEvents = {
    columnsManagementMinified: true,
    noToolbar: true,
    processing: true,
    serverSide: true,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumnsEvents);
      this.restService.getAllAdminDeviceEvents(params, this.deviceId)
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
    columns: this.valueColumnsEvents,
    order: [[0, 'desc']]
  };

  /**
   * Constructor to instantiate an instance of AdminDeviceEventsComponent.
   */
  constructor(
    private route: ActivatedRoute,
    private replaceUnderscore: ReplaceUnderscorePipe,
    private capitalizeAll: CapitalizeAllPipe,
    private restService: RestService,
    private dataTableService: DataTableService,
    private dateService: DateService) { }

  ngOnInit() {
    this.deviceId = this.route.snapshot.paramMap.get("id");

    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });
  }

  private defaultColumnNames = ['Datetime', 'Event Type', 'Location', 'Context'];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

}
