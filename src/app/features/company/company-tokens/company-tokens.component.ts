import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, NgZone } from '@angular/core';
import { BsModalService, BsModalRef, ModalDirective } from 'ngx-bootstrap/modal';

import {
  RestService, DataTableService, GlobalFunctionsService, ColumnSelector, ColumnSelectorUtil, FilterParams
} from '@app/core/services'

@Component({
  selector: 'app-company-tokens',
  templateUrl: './company-tokens.component.html',
  styleUrls: ['./company-tokens.component.css']
})
export class CompanyTokensComponent implements OnInit, OnDestroy {

  @ViewChild("clientsTable") clientsTable: any;
  tableColumns: ColumnSelector[] = [];
  tableName = 'table_company_apitokens';

  private defaultColumnNames = ['Client ID', 'Client Secret', 'Redirect URIs', 'Actions'];

  orderColumns = ["id", "secret", "redirectUris", null];

  valueColumns = [
    {
      data: null,
      render: (data, type, full, meta) => {
        return `<div class='client-id-col'>${full.clientId}</a>`;
      }
    },
    {
      data: null,
      render: (data, type, full, meta) => {
        return `<div class='client-id-col'>${full.clientSecret}</a>`;
      }
    },
    {
      data: null,
      render: (data, type, full, meta) => {
        return (full.redirectUris || [])
          .map(uri => `<a target="_blank" href="${uri}">${uri}</a>`)
          .join("<br/>");
      }
    },
    {
      data: null,
      orderable: false,
      render: (data, type, full, meta) => {
        var clientEncoded = this.gfService.encodeParam(full);
        return `<a onclick='truckspy.deleteClientModal("${clientEncoded}")'>Delete</a>`;
      }
    }
  ];

  options = {
    noToolbar: true,
    processing: true,
    serverSide: true,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
      this.restService.getAllClients(params).subscribe(data => {
        callback({
          aaData: data.results,
          recordsTotal: data.resultCount,
          recordsFiltered: data.resultCount
        })
      })
    },
    columns: this.valueColumns
  };

  /**
   * Constructor to instantiate an instance of CompanyTokensComponent.
   */
  constructor(
    private restService: RestService,
    private dataTableService: DataTableService,
    private modalService: BsModalService,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService
  ) { }

  ngOnInit() {
    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.deleteClientModal = this.deleteClientModal.bind(this);

    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });
  }

  ngOnDestroy() {
    window.truckspy.deleteClientModal = null;
  }

  /**
   * Add API Token modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addClientModal: BsModalRef;
  clientData: any[] = [];

  addClient(template: TemplateRef<any>) {
    this.clientData = [
      {
        redirectUri: ""
      }
    ];
    this._addClientModal = this.modalService.show(template, { class: "modal-400" });
  }

  deleteURI(order) {
    console.log(order);
    this.clientData.splice(order, 1);
  }
  addURI() {
    this.clientData.push({
      redirectUri: ""
    });
  }

  createClient(): void {
    let redirectURIs = this.clientData.map(next => next.redirectUri);
    this.restService.createClient(redirectURIs)
      .subscribe(
        data => {
          this._addClientModal.hide();
          this.clientsTable.ajaxReload();
        }
      );
  }
  closeClientModal(): void {
    this._addClientModal.hide();
  }

  /**
   * Delete API Token modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("deleteClientModal") _deleteClientModal: ModalDirective;
  forClient: any = {
    id: "",
    clientId: ""
  };

  deleteClientModal(clientEncoded: string) {
    this.ngZone.run(() => {
      var client = this.gfService.decodeParam(clientEncoded);
      this.deleteClientModalPrivate(client);
    });
  }
  deleteClientModalPrivate(client: any) {
    this.forClient = client;
    this._deleteClientModal.show();
  }

  closeDeleteClientModal() {
    this._deleteClientModal.hide();
  }
  deleteClient(client: any) {
    this.restService.deleteClient(client.id)
      .subscribe(
        success => {
          this._deleteClientModal.hide();
          this.clientsTable.ajaxReload()
        });
  }

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

}
