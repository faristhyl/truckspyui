import { Component, OnInit, OnDestroy, NgZone, ViewChild } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import {
  FilterParams, RestService, GlobalFunctionsService, DataTableService, Invoice, ColumnSelector, ColumnSelectorUtil, LocalStorageService
} from '@app/core/services';
import { ConfigState } from '@app/core/store/config';
import { getTableLength } from '@app/core/store/auth';

@Component({
  selector: 'app-admin-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.css']
})
export class AdminInvoicesComponent implements OnInit, OnDestroy {

  @ViewChild("invoicesTable") invoicesTable: any;

  tableLength: number;
  tableColumns: ColumnSelector[] = [];
  tableName = 'table_admin_invoices';

  orderColumnsInvoices = [
    'invoiceNumber', null, 'periodEndedAt', 'paid', 'amount', 'discountAmount', null, 'chargeFailedAttempts', null];

  valueColumnsInvoices = [
    {
      data: null,
      render: function (data, type, full, meta) {
        return full.invoiceNumber;
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        const company = full.company;
        var name = company.name || "(unspecified)";
        var id = company.id;
        return `<a href="#/admin/companies/${id}/view">${name}</a>`;
      }
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        let date = full.periodEndedAt;
        // Looks like no need in time part: 'yyyy-MM-dd, HH:mm:ss'
        return !!date ? this.datepipe.transform(date, 'yyyy-MM-dd') : "N/A";
      }.bind(this)
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return !!full.paid ? 'Yes' : 'No';
      }
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return full.amount ? this.currencyPipe.transform(full.amount / 100) : '';
      }.bind(this)
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return full.discountAmount ? this.currencyPipe.transform(full.discountAmount / 100) : '';
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return full.amountTotal ? this.currencyPipe.transform(full.amountTotal / 100) : '';
      }.bind(this)
    },
    {
      data: null,
      render: function (data, type, full, meta) {
        return !!full.chargeFailedAttempts ? full.chargeFailedAttempts : '';
      }
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        var invoiceEncoded = this.gfService.encodeParam(full);
        var result = `<a onclick='truckspy.downloadInvoice("${invoiceEncoded}")'><i class="fa fa-file-pdf-o"></i>pdf</a>&nbsp;&nbsp;&nbsp;`;

        if (!full.paid) {
          const chargeable = full.company && !!full.company.stripeCustomerId;
          if (chargeable) {
            result += `<a onclick='truckspy.charge("${invoiceEncoded}", this)'><i class="fa fa-bell-o"></i>charge</a>&nbsp;&nbsp;&nbsp;`;
          }
          result += `<a onclick='truckspy.markAsPaid("${invoiceEncoded}", this)'><i class="fa fa-check-square-o"></i>mark&nbsp;paid</a>&nbsp;&nbsp;&nbsp;`;
          result += `<a onclick='truckspy.deleteInvoice("${invoiceEncoded}", this)'><i class="fa fa-trash-o"></i>delete</a>`
        }
        return result;
      }.bind(this),
    },
  ];
  optionsInvoices: any;
  defineOptions() {
    this.optionsInvoices = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumnsInvoices);
        this.restService.getAllAdminInvoices(params, this.tableLength)
          .subscribe(
            data => {
              callback({
                aaData: data.results,
                recordsTotal: data.resultCount,
                recordsFiltered: data.resultCount,
              });
            });
      },
      columns: this.valueColumnsInvoices,
    }
  };

  downloadExcelReport() {
    this.restService.downloadAdminInvoicesExcelReport();
  }

  constructor(
    private restService: RestService,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService,
    private dataTableService: DataTableService,
    private store: Store<ConfigState>,
    private lsService: LocalStorageService,
    private datepipe: DatePipe,
    private currencyPipe: CurrencyPipe) {
    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.defineOptions();
    });
  }

  ngOnInit() {
    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });

    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.downloadInvoice = this.downloadInvoice.bind(this);
    window.truckspy.charge = this.charge.bind(this);
    window.truckspy.markAsPaid = this.markAsPaid.bind(this);
    window.truckspy.deleteInvoice = this.deleteInvoice.bind(this);
  }

  ngOnDestroy() {
    window.truckspy.downloadInvoice = null;
    window.truckspy.charge = null;
    window.truckspy.markAsPaid = null;
    window.truckspy.deleteInvoice = null;
  }

  downloadInvoice(invoiceEncoded: string) {
    this.ngZone.run(() => {
      var invoice = this.gfService.decodeParam(invoiceEncoded);
      this.downloadInvoicePrivate(invoice);
    });
  }
  downloadInvoicePrivate(invoice) {
    this.restService.doReportDownload(`/api/web/admin/invoices/${invoice.id}`, 'invoice');
  }

  charge(invoiceEncoded: string, element: any) {
    this.ngZone.run(() => {
      var invoice = this.gfService.decodeParam(invoiceEncoded);
      this.chargePrivate(invoice, element);
    });
  }
  chargePrivate(invoice: Invoice, element: any) {
    let observable = this.restService.chargeInvoice(invoice.id);
    this.callInvoiceAction(observable, element);
  }

  markAsPaid(invoiceEncoded: string, element: any) {
    this.ngZone.run(() => {
      var invoice = this.gfService.decodeParam(invoiceEncoded);
      this.markAsPaidPrivate(invoice, element);
    });
  }
  markAsPaidPrivate(invoice: Invoice, element: any) {
    let observable = this.restService.markInvoiceAsPaid(invoice.id);
    this.callInvoiceAction(observable, element);
  }

  deleteInvoice(invoiceEncoded: string, element: any) {
    this.ngZone.run(() => {
      var invoice = this.gfService.decodeParam(invoiceEncoded);
      this.deleteInvoicePrivate(invoice, element);
    });
  }
  deleteInvoicePrivate(invoice: Invoice, element: any) {
    let observable = this.restService.deleteInvoice(invoice.id);
    this.callInvoiceAction(observable, element);
  }

  callInvoiceAction(observable: Observable<boolean>, element: any) {
    var waitElement = document.createElement('span');
    waitElement.innerHTML = 'wait...';
    element.parentNode.replaceChild(waitElement, element);

    observable.subscribe(
      good => {
        this.invoicesTable.ajaxReload();
      },
      error => {
        waitElement.parentNode.replaceChild(element, waitElement);
      }
    );
  }

  private defaultColumnNames = [
    'Invoice Number', 'Company', 'Date', 'Paid', 'Amount', 'Discount Amount', 'Amount Total', 'Charge Failed Attempts'];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

}
