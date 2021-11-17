import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { RestService, FilterParams, DataTableService, ConnectionType, ColumnSelector, ColumnSelectorUtil } from '@app/core/services'
import { ReplaceUnderscorePipe, CapitalizeAllPipe } from '@app/shared/pipes/utils.pipe';

@Component({
  selector: 'app-company-connections',
  templateUrl: './company-connections.component.html',
  styleUrls: ['./company-connections.component.css']
})
export class CompanyConnectionsComponent implements OnInit {

  @ViewChild("connectionsTable") connectionsTable: any;
  tableColumns: ColumnSelector[] = [];
  tableName = 'table_company_connections';

  orderColumnsConnections = ["name", "type", "enabled"];
  valueColumnsConnections = [
    {
      data: null,
      render: function (data, type, full, meta) {
        return `<a href="#/company/connections/${full.id}/view">${full.name}</a>`;
      }
    },
    { data: "type" },
    { data: "status" }
  ];
  optionsConnections = {
    noToolbar: true,
    processing: true,
    serverSide: true,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumnsConnections);
      this.restService.getAllConnections(params)
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
    columns: this.valueColumnsConnections
  };

  /**
   * Add Connection modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addConnectionModal: BsModalRef;
  connectionData = {
    name: "",
    type: "",
    auth: {},
    allowedCapabilities: []
  };
  connectionTypes: ConnectionType[] = [];
  connectionTypesLoaded: boolean = false;
  authFields: string[] = [];
  capabilities: string[] = [];

  addConnection(template: TemplateRef<any>) {
    this.connectionData = {
      name: "",
      type: (this.connectionTypes && this.connectionTypes.length >= 1 && this.connectionTypes[0].type) || "",
      auth: (this.connectionTypes && this.connectionTypes.length >= 1 && this.connectionTypes[0].initAuth()) || {},
      allowedCapabilities: []
    };
    this.authFields = (this.connectionTypes && this.connectionTypes.length >= 1 && this.connectionTypes[0].auth) || [];
    this.capabilities = (this.connectionTypes && this.connectionTypes.length >= 1 && this.connectionTypes[0].capabilities) || [];
    this.displayCapabilityPrivate = this.displayCapability.bind(this);
    this._addConnectionModal = this.modalService.show(template, { class: "" });
  }

  onTypeChange(value): void {
    let connectionType = this.connectionTypes.find(function (element) {
      return element.type === value;
    });

    this.connectionData.type = (connectionType && connectionType.type) || "";
    this.connectionData.auth = (connectionType && connectionType.initAuth()) || {};
    this.connectionData.allowedCapabilities = [];
    this.authFields = (connectionType && connectionType.auth) || [];
    this.capabilities = (connectionType && connectionType.capabilities) || [];
  }

  displayCapabilityPrivate: any;
  displayCapability(item: string) {
    let noUnderscore = this.replaceUnderscore.transform(item);
    let result = this.capitalizeAll.transform(noUnderscore);
    return result;
  }

  createConnection(): void {
    this.restService.createConnection(this.connectionData)
      .subscribe(
        data => {
          this._addConnectionModal.hide();
          this.connectionsTable.ajaxReload();
        }
      );
  }
  closeConnectionModal(): void {
    this._addConnectionModal.hide();
  }

  /**
   * Constructor to instantiate an instance of CompanyConnectionsComponent.
   */
  constructor(
    private restService: RestService,
    private replaceUnderscore: ReplaceUnderscorePipe,
    private capitalizeAll: CapitalizeAllPipe,
    private dataTableService: DataTableService,
    private modalService: BsModalService) { }

  ngOnInit() {
    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });

    this.restService.getConfigConnectionTypes().subscribe(val => {
      this.connectionTypes = val;
      this.connectionTypesLoaded = true;
    });
  }

  private defaultColumnNames = ['Name', 'Type', 'Status'];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

}
