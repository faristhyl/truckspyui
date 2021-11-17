import { Component, OnInit } from '@angular/core';
import { Store } from "@ngrx/store";

import {
  RestService, DataTableService, FilterParams, LocalStorageService, LocationGroup, ColumnSelector, ColumnSelectorUtil
} from '@app/core/services/rest.service';
import { getTableLength, AuthState } from '@app/core/store/auth';

@Component({
  selector: 'app-admin-locations-list',
  templateUrl: './locations-list.component.html',
  styleUrls: ['./locations-list.component.css']
})
export class AdminLocationsListComponent implements OnInit {

  groups: LocationGroup[] = [];
  tableColumns: ColumnSelector[] = [];
  tableName: string = 'table_admin_location_list';

  tableLength: number;
  orderColumns = ["name", null, "city", "state", "zip", null];
  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        return `<a href="#/admin/location/list/${full.id}/view">${full.name}</a>`;
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
        if (!!full.locationGroupId) {
          let group = this.groups.find(function (g) {
            return g.id === full.locationGroupId;
          });
          if (!!group) {
            var groupName = group.name || "(unspecified)";
            return `<a href="#/admin/location/locations?groupId=${full.locationGroupId}">${groupName}</a>`;
          }
        }
        return "";
      }.bind(this)
    }
  ];

  options: any;
  defineOptions() {
    this.options = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
        this.restService.getAdminAllLocations(params, this.tableLength)
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
   * Constructor to instantiate an instance of AdminLocationsListComponent.
   */
  constructor(
    private restService: RestService,
    private dataTableService: DataTableService,
    private store: Store<AuthState>,
    private lsService: LocalStorageService) {
    this.restService.get1000AdminLocationGroups()
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

  private defaultColumnNames = ['Name', 'Address', 'City', 'State', 'Zip', 'Group'];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

}
