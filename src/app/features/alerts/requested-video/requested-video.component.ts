import { Component, OnInit, OnDestroy, ViewChild, NgZone } from '@angular/core';
import { AlertVideo, ColumnSelector, ColumnSelectorUtil, DataTableService, FilterParams, GlobalFunctionsService, RequestVideoOption, RestService } from '@app/core/services';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { BsModalService } from 'ngx-bootstrap';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RequestVideoComponent } from './request-video/request-video.component';
import { VideosViewComponent } from './videos-view/videos-view.component';

@Component({
    selector: 'app-requested-video',
    templateUrl: './requested-video.component.html',
    styleUrls: ['./requested-video.component.css']
})
export class RequestedVideoComponent implements OnInit, OnDestroy {

  @ViewChild("alertsTable") alertsTable: any;

  tableColumns: ColumnSelector[] = [];
  tableName = 'table_alerts';
  tableLength: number;
  filters: RequestVideoOption;

  public statuses: string[] = ['pending', 'failed', 'fullfilled'];

  private defaultColumnNames = ["Request ID", "Vehicle", "Created By", "Start", "Status", "Created At"];

  private onDestroy$ = new Subject();

  valueColumns = [
    {
      data: 'requestId',
      orderable: false,
      render: (data, type, full) => {
        const videos = this.gfService.encodeParam(full.videos);
        return `<a class="action-link" onclick='truckspy.viewVideos("${videos}")'>${full.id}</a>`;
      }
    },
    {
      data: 'vehicle',
      orderable: false,
      render: (data, type, full, meta) => {
        return full.vehicle.remoteId
      }
    },
    {
      data: 'createdBy',
      orderable: false,
      render: (data, type, full, meta) => {
        return full.createdBy.firstName + ' ' + full.createdBy.lastName
      }
    },
    {
      data: 'start',
      orderable: false,
      render: (data, type, full, meta) => {
        return this.dateService.transformDateTime(full.startDateTime);
      }
    },
    {
      data: 'status',
      orderable: false,
      render: (data, type, full, meta) => {
        return full.status;
      }
    },
    {
      data: 'createdAt',
      orderable: false,
      render: (data, type, full, meta) => {
        return this.dateService.transformDateTime(full.createdAt);
      }
    },
  ];

  options: any;
  defineOptions() {
    this.options = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        let params: FilterParams = this.dataTableService.calculateParams(data, []);
        this.restService.getRequiredVideo(params, this.filters).pipe(takeUntil(this.onDestroy$)).subscribe((data: any) => {
          callback({
            aaData: data.results,
            recordsTotal: data.resultCount,
            recordsFiltered: data.resultCount
          })
        });
      },
      columns: this.valueColumns,
      order: [[1, 'desc']]
    };
  }

  constructor(
    private restService: RestService,
    private dateService: DateService,
    private modalService: BsModalService,
    private dataTableService: DataTableService,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService
  ) {
    this.filters = { status: 'all'}
    this.defineOptions();
  }

  ngOnInit() {
    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.viewVideos = this.viewVideos.bind(this);

    this.restService.getCurrentUser().pipe(takeUntil(this.onDestroy$)).subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });

    this.modalService.onHide.pipe(takeUntil(this.onDestroy$)).subscribe( () => this.reloadTable() );
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

  reloadTable() {
    this.alertsTable.ajaxReload();
  }

  showRequestVideoModal() {
    this.modalService.show(RequestVideoComponent, { class: "modal-450" });
  }

  onStatusChanged(value) {
    this.filters.status = value;
    this.reloadTable();
  }

  viewVideos(videosEncoded: string) {
    this.ngZone.run(() => {
      const videos = this.gfService.decodeParam(videosEncoded);
      this.viewVideosPrivate(videos);
    });
  }
  viewVideosPrivate(videos: AlertVideo[][]) {
    this.modalService.show(VideosViewComponent, {
      class: "modal-md",
      initialState: { videos }
    });
  }

}
