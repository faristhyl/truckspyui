import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import _filter from 'lodash/filter';

import {
  LocalStorageService, RestService, Company, Connection, ColumnSelector, ColumnSelectorUtil, ConnectionType
} from '@app/core/services';
import { ConfigState } from '@app/core/store/config';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { getTableLength } from '@app/core/store/auth';

@Component({
  selector: 'app-admin-connections',
  templateUrl: './connections.component.html',
  styleUrls: ['./connections.component.css']
})
export class AdminConnectionsComponent implements OnInit, OnDestroy {

  @ViewChild("connectionsTable") connectionsTable: any;

  tableLength: number;
  tableColumns: ColumnSelector[] = [];
  tableName = 'table_admin_connections';
  optionsConnections: any;

  private defaultColumnNames = ['Connection Name', "Connection Type", "Last Sync", "Company"];

  orderColumns = ["name", "type", "enabled", "lastSync", null];
  valueColumns = [
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return `<a href="#/admin/connections/${full.id}/view">${full.name}</a>`;
      },
    },
    {
      data: 'type',
      orderable: true,
    },
    {
      data: 'status',
      orderable: true,
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return this.dateService.transformDateTime(full.lastSync);
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        const company = full.company;
        if (!company || !company.id) {
          return "";
        }

        var name = company.name || "(unspecified)";
        var id = company.id;
        return `<a href="#/admin/companies/${id}/view">${name}</a>`;
      }
    }
  ];

  defineOptions() {
    this.optionsConnections = {
      noToolbar: true,
      processing: true,
      serverSide: false,
      pageLength: this.tableLength,
      data: [],
      columns: this.valueColumns,
      order: [[0, 'asc']],
    }
  };

  filters = {
    name: "",
    connectionType: "",
    companyName: ""
  };

  companies: Company[];
  connections: Connection[];
  connectionTypes: ConnectionType[];

  constructor(
    private restService: RestService,
    private store: Store<ConfigState>,
    private lsService: LocalStorageService,
    private dateService: DateService) { }

  ngOnInit() {
    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });

    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.defineOptions();
    });

    this.loadAllData();
  }

  ngOnDestroy() { }

  loadAllData() {
    combineLatest(
      this.restService.get1000Companies(),
      this.restService.getConfigConnectionTypes(),
      this.restService.get1000AdminConnections()
    ).subscribe(data => {
      this.companies = data[0];
      this.connectionTypes = data[1];
      this.connections = data[2];
      this.doFilter();
    });
  }

  onNameChanged() {
    this.doFilter();
  }

  onConnectionTypeChanged(connectionType) {
    this.filters.connectionType = connectionType;
    this.doFilter();
  }

  onCompanyChanged(companyName) {
    this.filters.companyName = companyName;
    this.doFilter();
  }

  clearName() {
    this.filters.name = "";
    this.doFilter();
  }

  doFilter() {
    let filtered = [...this.connections];
    if (this.filters.name) { //filter data based on name
      filtered = _filter(filtered, (connection: Connection) => {
        return connection.name.toLowerCase().includes(this.filters.name.toLowerCase());
      })
    }

    if (this.filters.companyName) { //filter data based on company name
      filtered = _filter(filtered, (connection: Connection) => {
        return !!connection.company && connection.company.name === this.filters.companyName;
      })
    }

    if (this.filters.connectionType) { //filter data based on connection type
      filtered = _filter(filtered, (connection: Connection) => {
        return connection.type === this.filters.connectionType;
      })
    }

    this.connectionsTable.dataReload(filtered);
  }

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

}
