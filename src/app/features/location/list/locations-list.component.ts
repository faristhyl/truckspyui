import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Store } from "@ngrx/store";
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import {
  RestService, DataTableService, FilterParams, LocalStorageService, LocationGroup, ColumnSelector, ColumnSelectorUtil,
  FilterLocations
} from '@app/core/services/rest.service';
import { getTableLength, AuthState } from '@app/core/store/auth';

@Component({
  selector: 'app-locations-list',
  templateUrl: './locations-list.component.html',
  styleUrls: ['./locations-list.component.css']
})
export class LocationsListComponent implements OnInit, OnDestroy {

  @ViewChild("locationsTable") locationsTable: any;

  groups: LocationGroup[] = [];
  tableColumns: ColumnSelector[] = [];
  tableName: string = 'table_location_list';

  tableLength: number;
  orderColumns = ["name", null, "city", "state", "zip", null, null];
  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        return `<a href="#/location/list/${full.id}/view">${full.name}</a>`;
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        let address = (full.address1 ? full.address1 + " " : "") +
          (full.address2 ? full.address2 + " " : "");
        return address;
      }
    },
    { data: "city" },
    { data: "state" },
    { data: "zip" },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (!full.connectionBindList || full.connectionBindList.length === 0) {
          return "";
        }
        return full.connectionBindList
          .filter(bind => !!bind.connection)
          .map(function (bind: any) {
            return `<a href="#/company/connections/${bind.connection.id}/view">${bind.connection.name}</a>`;
          })
          .join(", ");
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (!!full.locationGroupId) {
          let group = this.groups.find(function (g) {
            return g.id === full.locationGroupId;
          });
          if (!!group) {
            var groupName = group.name || "(unspecified)";
            return `<a href="#/location/locations?groupId=${full.locationGroupId}">${groupName}</a>`;
          }
        }
        return "";
      }.bind(this)
    }
  ];

  filters: FilterLocations = {
    name: ""
  };
  private nameSearchTerm$ = new Subject();

  onNameChanged(event) {
    this.nameSearchTerm$.next(event)
  }

  clearName() {
    this.filters.name = "";
    this.refreshDataTable();
  }

  options: any;
  defineOptions() {
    this.options = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
        this.restService.getAllLocations(params, this.tableLength, this.filters)
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
      columns: this.valueColumns
    };
  }

  /**
   * Constructor to instantiate an instance of LocationsListComponent.
   */
  constructor(
    private restService: RestService,
    private dataTableService: DataTableService,
    private store: Store<AuthState>,
    private lsService: LocalStorageService) {
    this.restService.get1000LocationGroups()
      .subscribe(
        data => {
          this.groups = data;

          let loggedInAs = this.lsService.getLoginAs();
          this.store.select(getTableLength).subscribe((length: number) => {
            this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
            this.defineOptions();
          });
        }
      );

    // rxjs - searching filter by name 
    this.nameSearchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.refreshDataTable();
    })
  }

  ngOnDestroy() {
    this.nameSearchTerm$.complete();
  }

  refreshDataTable() {
    if (this.locationsTable) {
      this.locationsTable.ajaxReload();
    }
  }

  ngOnInit() {
    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });
  }

  private defaultColumnNames = ['Name', 'Address', 'City', 'State', 'Zip', 'Connection', 'Group'];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

}
