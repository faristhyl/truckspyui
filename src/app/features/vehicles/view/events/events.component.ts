import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { select, Store } from '@ngrx/store';
import * as moment from "moment";

import { DataTableService, DisplayEvent, FilterParams, LocalStorageService, RestService } from '@app/core/services';
import { AuthState, getTableLength } from '@app/core/store/auth';
import { CapitalizeAllPipe, ReplaceUnderscorePipe } from '@app/shared/pipes/utils.pipe';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

@Component({
  selector: 'app-vehicle-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class VehicleEventsComponent implements OnInit {

  @ViewChild('eventsTable') eventsTable: any;

  vehicleId: string;
  tableLength: number;
  events: string[];
  displayEvents: DisplayEvent[];
  selectedEvents: string[];

  orderColumns = ['datetime', 'event', 'textualLocation', null];
  valueColumns = [
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
        return this.displayCapability(full.event);
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

  eventsOption: any;
  defineOptions() {
    this.eventsOption = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
        this.restService.getAllVehicleEvents(params, this.vehicleId, this.selectedEvents, this.tableLength)
          .subscribe(data => {
            callback({
              aaData: data ? data.results : [],
              recordsTotal: data ? data.resultCount : 0,
              recordsFiltered: data ? data.resultCount : 0
            })
          });
      },
      columns: this.valueColumns,
      order: [[0, 'desc']],
    };
  }

  constructor(
    private restService: RestService,
    private store: Store<AuthState>,
    private lsService: LocalStorageService,
    private dataTableService: DataTableService,
    private route: ActivatedRoute,
    private replaceUnderscore: ReplaceUnderscorePipe,
    private capitalizeAll: CapitalizeAllPipe,
    private dateService: DateService) { }

  ngOnInit() {
    this.selectedEvents = [];
    this.vehicleId = this.route.snapshot.parent.paramMap.get('id');
    let loggedInAs = this.lsService.getLoginAs();
    this.store.pipe(select(getTableLength)).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.defineOptions();
    });

    this.restService.getVehicleEventsType()
      .subscribe(events => {
        // bind value and name for ng-select
        this.displayEvents = events.map(e => new DisplayEvent(this.displayCapability(e), e))
      })
  }

  onSelectAllEvents() {
    this.selectedEvents = this.displayEvents.map(e => e.event);
    this.refreshData();
  }

  displayCapability(item: string) {
    let noUnderscore = this.replaceUnderscore.transform(item);
    return this.capitalizeAll.transform(noUnderscore);
  }

  refreshData() {
    if (this.eventsTable) {
      this.eventsTable.ajaxReload();
    }
  }

  downloadExcelReport() {
    this.restService.downloadVehicleEventsExcelReport(this.vehicleId);
  }

}
