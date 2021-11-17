import { Component, OnInit, ViewChild, OnDestroy, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import _filter from 'lodash/filter';

import {
  RestService, ColumnSelector, User, GlobalFunctionsService, LocalStorageService, Company, LoginAsService
} from '@app/core/services';
import { ConfigState } from '@app/core/store/config';
import { plainToClass } from 'class-transformer';

@Component({
  selector: 'app-admin-company-users',
  templateUrl: './company-users.component.html',
  styleUrls: ['./company-users.component.css']
})
export class AdminCompanyUsersComponent implements OnInit, OnDestroy {

  @ViewChild("companyUsersTable") companyUsersTable: any;
  companyId: string;

  tableLength: number = 10;
  tableColumns: ColumnSelector[] = [];
  tableName = 'table_admin_company_users';
  optionsCompanyUsers: any;

  orderColumns = ["firstName", "email", "phone"];
  valueColumns = [
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        var userEncoded = this.gfService.encodeParam(full);
        var companyEncoded = this.gfService.encodeParam(full.company);
        return `<a onclick='truckspy.loginAs("${userEncoded}", "${companyEncoded}")'>${full.name()}</a>`;
      }.bind(this)
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        var email = full.email;
        return `<a href="mailto:${email}">${email}</a>`;
      }
    },
    {
      data: 'phone'
    }
  ];

  defineOptions() {
    this.optionsCompanyUsers = {
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
    email: ""
  };

  users: User[];

  /**
   * Login as functionality.
   */
  loginAs(userEncoded: string, companyEncoded: string) {
    this.ngZone.run(() => {
      var user = this.gfService.decodeParam(userEncoded);
      var company = this.gfService.decodeParam(companyEncoded);
      this.loginAsPrivate(user, company);
    });
  }
  loginAsPrivate(user: any, company: any) {
    let companyObject: Company = plainToClass(Company, company as Company);
    let userObject: User = plainToClass(User, user as User);
    this.loginAsService.loginAsUser(companyObject.id, userObject);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loginAsService: LoginAsService,
    private restService: RestService,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService,
    private store: Store<ConfigState>,
    private lsService: LocalStorageService) { }

  ngOnInit() {
    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.loginAs = this.loginAs.bind(this);

    this.companyId = this.route.snapshot.paramMap.get("id");

    this.defineOptions();
    this.loadData();
  }

  ngOnDestroy() {
    window.truckspy.loginAs = null;
  }

  loadData() {
    this.restService.get1000AdminUsersFor(this.companyId)
      .subscribe(result => {
        this.users = result;
        this.doFilter();
      });
  }

  onNameChanged() {
    this.doFilter();
  }

  onEmailChanged() {
    this.doFilter();
  }

  clearName() {
    this.filters.name = "";
    this.doFilter();
  }

  clearEmail() {
    this.filters.email = "";
    this.doFilter();
  }

  doFilter() {
    let filtered = [...this.users];
    if (this.filters.name) { // filter data based on the user's name
      filtered = _filter(filtered, (user: User) => {
        return !!user.name() && user.name().toLowerCase().includes(this.filters.name.toLowerCase());
      })
    }

    if (this.filters.email) { // filter data based on the user's email
      filtered = _filter(filtered, (user: User) => {
        return !!user.email && user.email.toLowerCase().includes(this.filters.email.toLowerCase());
      })
    }

    this.companyUsersTable.dataReload(filtered);
  }

}
