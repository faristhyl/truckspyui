import { DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { combineLatest, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

import { DispatchGroup, FilterParams, FilterScheduledDashboard, MaintenanceGroup, MaintenanceIssue, MaintenanceItem, MaintenanceItemType, ReportingProfile, RestService, ScheduledDashboardItem, ScheduledMaintenanceItem, Vehicle } from '@app/core/services';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';

enum Colors {
  RED = '#ffd9d9',
  YELLOW = '#fff8db',
  GREEN = '#e5fae5'
};

enum ShowingFilter {
  ALL = 'Show All',
  YELLOW = 'Show Only Near Due',
  RED = 'Show Only Overdue'
};

@Component({
  selector: 'app-scheduled-dashboard',
  templateUrl: './scheduled-dashboard.component.html',
  styleUrls: ['./scheduled-dashboard.component.css']
})
export class ScheduledDashboardComponent implements OnInit {

  @ViewChild('tableHeader') public tableHeader: ElementRef;
  @ViewChild('tableBodyOverflow') public tableBodyOverflow: ElementRef;

  isGenerateTableBodyContent: boolean = false;

  maintenanceType = MaintenanceItemType;

  _maintenanceGroups: MaintenanceGroup[] = [];  // it is used for default values without using filters on them
  maintenanceGroups: MaintenanceGroup[] = [];
  maintenanceItems: MaintenanceItem[] = [];

  private _defaultDashboardItems: ScheduledDashboardItem[] = [];  // it is used for default values without using filters on them
  dashboardItems: ScheduledDashboardItem[] = [];

  // filters
  filters: FilterScheduledDashboard = {
    dispatchGroupId: '',
    reportingProfileId: '',
    maintenanceGroupId: '',
    showingFilterItem: ShowingFilter.ALL
  };
  private _vehicles: Vehicle[] = [];
  dispatchGroups: DispatchGroup[] = [];
  reportingProfiles: ReportingProfile[] = [];
  readonly showingFilterItems = Object.values(ShowingFilter);
  // ***

  sort: { field: string, order: 'asc' | 'desc', maintenanceItemName?: string } = { field: null, order: 'asc' };

  private tableStructure: {
    rows: Array<{
      item: any,
      groups: Array<{
        id: string,
        maintenanceItems: Array<{
          name: string
        }>
      }>
    }>
  } = {
    rows: []
  };

  private onDestroy$ = new Subject();
  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  constructor(
    private restService: RestService,
    private dateService: DateService,
    private numberPipe: DecimalPipe,
    private renderer: Renderer2,
    private elRef: ElementRef,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    // table
    this.loadData();

    // filters
    this.get1000ActiveVehicles();
    this.get1000DispatchGroupsLight();
    this.get1000ReportingProfileLights();
  }

  ngAfterViewChecked() {
    // generate table
    if (this.isGenerateTableBodyContent) {
      this.isGenerateTableBodyContent = false;
      this.fillTableStructure();
      this.generateContentForBodyTable();
      this.cdRef.detectChanges();
    }
  }

  ngAfterViewInit() {
    this.scrollHeaderAfterTableScroll();
  }

  // request methods
  private loadData() {
    let params: FilterParams = new FilterParams(1, `id.ASC`);
    combineLatest(
      // table header
      this.restService.get1000MaintenanceGroups(),  // it's also used for filter
      this.restService.getAllMaintenanceItems(params, 1000).pipe(map(res => res.results)),
      // table body
      this.restService.getScheduledMaintenanceDashboard().pipe(map(res => res.results))
    ).pipe(
      takeUntil(this.onDestroy$)
    ).subscribe(([groups, maintenanceItems, dashboardItems]) => {
      this._maintenanceGroups = this.maintenanceGroups = groups;

      this.maintenanceItems = maintenanceItems;

      this._defaultDashboardItems = this.dashboardItems = dashboardItems;

      this.isGenerateTableBodyContent = true;
    })
  }

  private get1000ActiveVehicles() {
    this.restService.get1000ActiveVehiclesLight(this.filters.dispatchGroupId, {
      reportingProfile: true, type: false, dispatchGroup: true
    })
      .pipe(
        takeUntil(this.onDestroy$)
      )
      .subscribe(result => this._vehicles = result);
  }

  private get1000DispatchGroupsLight() {
    this.restService.get1000DispatchGroupsLight().pipe(
      takeUntil(this.onDestroy$)
    ).subscribe(result => this.dispatchGroups = result)
  }

  private get1000ReportingProfileLights() {
    this.restService.get1000ReportingProfileLights().pipe(
      takeUntil(this.onDestroy$)
    ).subscribe(result => this.reportingProfiles = result)
  }
  // ***

  // table generating methods
  filterMaintenanceItemsByGroupId(groupId: string) {
    return this.maintenanceItems.filter(item => item.group.id === groupId)
  }

  private getValueForCell(
    item: ScheduledDashboardItem,
    groupId: string,
    maintenanceItemName: string,
    dashboardItemIdx?: number,
    groupIdx?: number,
    itemIdx?: number
  ) {
    const foundMaintenanceItem = item.scheduledMaintenanceItems.find((item: ScheduledMaintenanceItem) => {
      const maintenanceItem = item.scheduledMaintenanceItem;
      return maintenanceItem.group.id === groupId && maintenanceItem.name === maintenanceItemName;
    })
    if (foundMaintenanceItem) {
      let text = '';
      const numberOf = foundMaintenanceItem.scheduledMaintenanceItem.numberOf;

      // get td element of current cell
      const cell = this.elRef.nativeElement.querySelector(
        `.row-idx-${dashboardItemIdx}.group-idx-${groupIdx}.item-idx-${itemIdx}`
      );
      // ***
      if (!cell) return;

      // generate text for cell
      const typeOfValue = this.getTypeOfValue(foundMaintenanceItem.scheduledMaintenanceItem.type);
      const dueAt = foundMaintenanceItem.initialValue + numberOf;
      let remaining: string | number = dueAt - foundMaintenanceItem.currentValueOf;
      foundMaintenanceItem.remaining = remaining;
      const asOf = this.dateService.transformDate(foundMaintenanceItem.lastUpdate);

      let dueAtDueAtValue: string | number = dueAt;
      // change dueAt on date if type is "PeriodicBased"
      if (foundMaintenanceItem.scheduledMaintenanceItem.type === this.maintenanceType.PERIODIC_BASED) {
        dueAtDueAtValue = this.dateService.transformDate(foundMaintenanceItem.initialValueDateTime);
      } else {
        dueAtDueAtValue = this.numberPipe.transform(dueAtDueAtValue, '1.0', 'en-US');
        remaining = this.numberPipe.transform(remaining, '1.0', 'en-US');
      }

      text = `Due At: ${dueAtDueAtValue} ${typeOfValue} <br/> Remaining: ${remaining}`;
      cell.innerHTML = text;

      // add update date span
      this.addUpdateDateSpanToCell(cell, asOf)
      // ***

      // background for cell
      const backgroundColor = this.getBackgroundOfCell(foundMaintenanceItem.remaining, numberOf);
      this.renderer.setStyle(cell, 'background-color', backgroundColor);
      foundMaintenanceItem.backgroundColor = backgroundColor;
      // ***

      // add link for issue if it exists
      if (foundMaintenanceItem.issue) {
        this.addIssueLinkToCell(cell, foundMaintenanceItem.issue);
      }
      // ***
    }
  }

  private getTypeOfValue(type: string): string {
    let typeOfValue;
    switch (type) {
      case this.maintenanceType.MILEAGE_BASED:
        typeOfValue = 'miles';
        break;
      case this.maintenanceType.PERIODIC_BASED:
        typeOfValue = 'date';
        break;
      case this.maintenanceType.ENGINE_HOURS_BASED:
        typeOfValue = 'hours';
        break;
      default: break;
    }
    return typeOfValue
  }

  private addUpdateDateSpanToCell(parentEl: ElementRef, text: string) {
    const updateDateSpan = this.renderer.createElement('span');
    this.renderer.addClass(updateDateSpan, 'update-date');
    updateDateSpan.innerHTML = `Updated at ${text}`
    this.renderer.appendChild(parentEl, updateDateSpan);
  }

  private addIssueLinkToCell(parentEl: ElementRef, issue: MaintenanceIssue) {
    const brElement = this.renderer.createElement('br');
    const aElement = this.renderer.createElement('a');
    aElement.innerHTML = '#' + issue.number;

    this.renderer.setAttribute(aElement, 'href', `/#/maintenance/issues/` + issue.id + '/view');
    this.renderer.setAttribute(aElement, 'target', '_blank');

    this.renderer.appendChild(parentEl, brElement);
    this.renderer.appendChild(parentEl, aElement);
  }

  private fillTableStructure() {
    // add vehicles (all rows)
    this.tableStructure.rows = this.dashboardItems.map(dashboardItem => {
      return {
        item: dashboardItem,
        groups: []
      }
    });
    // add groups and maintenance items (all columns)
    this.tableStructure.rows.forEach(row => {
      row.groups = this.maintenanceGroups.map(group => {
        return {
          id: group.id,
          maintenanceItems: this.filterMaintenanceItemsByGroupId(group.id).map(item => {
            return {
              name: item.name
            }
          })
        }
      });
    });
  }

  private generateContentForBodyTable() {
    this.tableStructure.rows.forEach((row, rowIdx) => {
      row.groups.forEach((group, groupIdx) => {
        group.maintenanceItems.forEach((item, itemIdx) => {
          this.getValueForCell(row.item, group.id, item.name, rowIdx, groupIdx, itemIdx);
        })
      })
    });
  }

  private getBackgroundOfCell(remaining: number, numberOf: number) {
    if (remaining < 0) {
      return Colors.RED;
    } else if (remaining / numberOf < 0.05) {
      return Colors.YELLOW;
    } else {
      return Colors.GREEN;
    }
  }
  // ***

  // filtering methods
  private filterDashboard() {
    this.dashboardItems = this._defaultDashboardItems;
    this.maintenanceGroups = this._maintenanceGroups;
    let vehicles = this._vehicles;

    const { dispatchGroupId, reportingProfileId, maintenanceGroupId, showingFilterItem } = this.filters;

    if (dispatchGroupId) {
      vehicles = vehicles.filter(vehicle => vehicle.dispatchGroup && vehicle.dispatchGroup.id === dispatchGroupId);
    }
    if (reportingProfileId) {
      vehicles = vehicles.filter(vehicle => vehicle.reportingProfile && vehicle.reportingProfile.id === reportingProfileId);
    }
    if (dispatchGroupId || reportingProfileId) {
      this.dashboardItems = this.dashboardItems.filter(item => vehicles.find(vehicle => vehicle.remoteId === item.remoteId));
    }

    if (maintenanceGroupId) {
      this.maintenanceGroups = this.maintenanceGroups.filter(group => group.id === maintenanceGroupId);
      this.dashboardItems = this.dashboardItems.filter(dashboardItem => dashboardItem.scheduledMaintenanceItems.find(scheduledMaintenanceItem => {
        return scheduledMaintenanceItem.scheduledMaintenanceItem.group.id === maintenanceGroupId
      }));
    }

    if (showingFilterItem !== ShowingFilter.ALL) {
      let filterColor;
      if (showingFilterItem === ShowingFilter.RED) {
        filterColor = Colors.RED;
      } else if (showingFilterItem === ShowingFilter.YELLOW) {
        filterColor = Colors.YELLOW;
      }
      if (filterColor) {
        this.dashboardItems = this.dashboardItems.map(dashboardItem => {
          return {
            ...dashboardItem,
            scheduledMaintenanceItems: dashboardItem.scheduledMaintenanceItems.filter(
              scheduledMaintenanceItem => scheduledMaintenanceItem.backgroundColor === filterColor
            )
          };
        });
        this.dashboardItems = this.dashboardItems.filter(dashboardItem => dashboardItem.scheduledMaintenanceItems.length)
      }
    }
  }

  onDispatchGroupIdChanged(event) {
    this.filters.dispatchGroupId = event;
    this.filterDashboard();
    this.sortDashboard();
  }

  onReportingProfileIdChanged(event) {
    this.filters.reportingProfileId = event;
    this.filterDashboard();
    this.sortDashboard();
  }

  onMaintenanceGroupIdChanged(event) {
    this.filters.maintenanceGroupId = event;
    this.filterDashboard();
    this.sortDashboard();
  }

  onShowingFilterItemChanged(event) {
    this.filters.showingFilterItem = event;
    this.filterDashboard();
    this.sortDashboard();
  }
  // ***

  // sorting methods
  sortDashboard(field: string = this.sort.field, maintenanceItemName: string = this.sort.maintenanceItemName) {
    if (field) {
      this.sort.field = field;

      if (field === 'remaining' && maintenanceItemName) {
        this.sort.maintenanceItemName = maintenanceItemName;
        this.addFieldForSortingByRemaining(maintenanceItemName);
        this.dashboardItems = this.dashboardItems.sort((a, b) => {
          return this.sortMethod(+a.remainingForSort, +b.remainingForSort, this.sort.order);
        })
      } else {
        this.dashboardItems = this.dashboardItems.sort((a, b) => {
          return this.sortMethod(+a[field], +b[field], this.sort.order);
        })
      }
      if (this.sort.order === 'asc') {
        this.sort.order = 'desc';
      } else if (this.sort.order === 'desc') {
        this.sort.order = 'asc';
      }
    }
    this.isGenerateTableBodyContent = true;
  }

  private addFieldForSortingByRemaining(maintenanceItemName: string) {  // adding extra field with remaining for sorting in scheduled dashboard items
    this.dashboardItems = this.dashboardItems.map(dashboardItem => {
      const scheduledMaintenanceItem = dashboardItem.scheduledMaintenanceItems.find(
        maintenanceItem => maintenanceItem && maintenanceItem.scheduledMaintenanceItem.name === maintenanceItemName
      );
      return {
        ...dashboardItem,
        remainingForSort: scheduledMaintenanceItem ? scheduledMaintenanceItem.remaining : null
      }
    })
  }

  private sortMethod(a: string | number, b: string | number, order: 'asc' | 'desc'): number {
    if (a === b || !order) {
      return (0);
    }
    if (order === 'asc') {
      return ((a < b) ? -1 : 1);
    }
    if (order === 'desc') {
      return ((a > b) ? -1 : 1);
    }
  }
  // ***


  // scrolling header horizontally
  public scrollHeaderAfterTableScroll(): void {
    this.renderer.listen(this.tableBodyOverflow.nativeElement, 'scroll', () => {
      if (this.tableHeader) {
        this.renderer.setStyle(this.tableHeader.nativeElement, 'left', -this.tableBodyOverflow.nativeElement.scrollLeft + 'px');
      }
    });
  }
  // ***

}
