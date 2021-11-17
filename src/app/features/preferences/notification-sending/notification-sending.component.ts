import { Component, OnInit, ViewChild } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { take } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

import { DataTableService, FilterParams, LocalStorageService, RestService } from '@app/core/services';
import { AuthState, getTableLength } from '@app/core/store/auth';
import { getProfileModel } from '@app/core/store/profile';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { ReplaceUnderscorePipe } from '@app/shared/pipes/utils.pipe';

@Component({
  selector: 'app-notification-sending',
  templateUrl: './notification-sending.component.html',
})
export class NotificationSendingComponent implements OnInit {

  @ViewChild('notificationSendingTable') notificationSendingTable: any;

  tableLength: number;
  userId: string;

  orderColumns = ['createdAt', null, 'subject', 'sendingMethod'];
  valueColumns = [
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.dateService.transformDateTime(full.createdAt);
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let notification = full.notification;
        return !!notification ? this.replaceUnderscore.transform(notification.type) : "";
      }.bind(this)
    },
    {
      data: 'subject',
      orderable: true
    },
    {
      data: 'sendingMethod',
      orderable: true
    }
  ];

  notificationSendingOption: any;
  defineOptions() {
    this.notificationSendingOption = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
        this.restService.getAllNotificationSendings(params, this.tableLength)
          .subscribe(data => {
            callback({
              aaData: data.results,
              recordsTotal: data.resultCount,
              recordsFiltered: data.resultCount,
            });
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
    private dateService: DateService,
    private replaceUnderscore: ReplaceUnderscorePipe) {
    let loggedInAs = this.lsService.getLoginAs();
    combineLatest(
      this.store.pipe(select(getProfileModel), take(1)),
      this.store.pipe(select(getTableLength))
    ).subscribe(([currentUser, length]) => {
      this.userId = !loggedInAs ? currentUser.id : loggedInAs.id;
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.defineOptions();
      this.refreshData();
    });
  }

  ngOnInit() {
  }

  refreshData() {
    if (this.notificationSendingTable) {
      this.notificationSendingTable.ajaxReload()
    }
  }

}
