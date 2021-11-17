import { Component, OnInit, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

import {
  RestService, FilterParams, DataTableService, ReportingProfile, Company, GlobalFunctionsService, Invoice
} from '@app/core/services'

@Component({
  selector: 'app-admin-company-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.css']
})
export class AdminCompanyInvoicesComponent implements OnInit, OnDestroy {

  @ViewChild("invoicesTable") invoicesTable: any;

  orderColumnsInvoices = ["periodEndedAt", "paid", "amount", 'discountAmount', 'chargeFailedAttempts', null];
  valueColumnsInvoices = [
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
          // const chargeable = full.company && full.company.stripeCustomer && !!full.company.stripeCustomer.id;
          const chargeable = full.company && !!full.company.stripeCustomerId;
          if (chargeable) {
            result += `<a onclick='truckspy.charge("${invoiceEncoded}", this)'><i class="fa fa-bell-o"></i>charge</a>&nbsp;&nbsp;&nbsp;`;
          }
          result += `<a onclick='truckspy.markAsPaid("${invoiceEncoded}", this)'><i class="fa fa-check-square-o"></i>mark&nbsp;paid</a>&nbsp;&nbsp;&nbsp;`;
          result += `<a onclick='truckspy.deleteInvoice("${invoiceEncoded}", this)'><i class="fa fa-trash-o"></i>delete</a>`
        }
        return result;
      }.bind(this)
    }
  ];
  optionsInvoices = {
    noToolbar: true,
    processing: true,
    serverSide: true,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumnsInvoices);
      this.restService.getAllInvoicesFor(this.companyId, params)
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
    columns: this.valueColumnsInvoices,
    order: [[0, 'desc']]
  };

  downloadInvoice(invoiceEncoded: string) {
    this.ngZone.run(() => {
      var invoice = this.gfService.decodeParam(invoiceEncoded);
      this.downloadInvoicePrivate(invoice);
    });
  }
  downloadInvoicePrivate(invoice) {
    this.restService.doReportDownload(`/api/web/admin/invoices/${invoice.id}`, 'invoice');
  }

  companyId: string;
  company: Company = new Company();
  subscriptionProfiles: ReportingProfile[];

  constructor(
    private route: ActivatedRoute,
    private restService: RestService,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService,
    private dataTableService: DataTableService,
    private datepipe: DatePipe,
    private currencyPipe: CurrencyPipe) { }

  ngOnInit() {
    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.downloadInvoice = this.downloadInvoice.bind(this);
    window.truckspy.charge = this.charge.bind(this);
    window.truckspy.markAsPaid = this.markAsPaid.bind(this);
    window.truckspy.deleteInvoice = this.deleteInvoice.bind(this);

    this.companyId = this.route.snapshot.paramMap.get("id");
    this.restService.getCompanyBy(this.companyId)
      .subscribe(
        data => {
          this.company = data;
          this.subscriptionProfiles = data.getProfilesWithActiveSubscription();
        }
      );
  }

  ngOnDestroy() {
    window.truckspy.downloadInvoice = null;
    window.truckspy.charge = null;
    window.truckspy.markAsPaid = null;
    window.truckspy.deleteInvoice = null;
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

}
