import { Component, NgZone, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { combineLatest, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, take } from 'rxjs/operators';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { plainToClass } from 'class-transformer';

import {
  ColumnSelector, ColumnSelectorUtil, Company, DataTableService, FilterParams, FilterUsers, GlobalFunctionsService,
  LocalStorageService, LoginAsService, RestService, User
} from '@app/core/services';
import { DateService } from '@app/shared/pipes/timezone-handler.pipe';
import { ConfigState, getConfigTimezonesKeys } from '@app/core/store/config';
import { getTableLength } from '@app/core/store/auth';
import { CapitalizeAllPipe, ReplaceUnderscorePipe, RolePrefixRemoverPipe } from '@app/shared/pipes/utils.pipe';

@Component({
  selector: 'app-admin-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {

  @ViewChild("usersTable") usersTable: any;

  tableLength: number;
  tableColumns: ColumnSelector[] = [];
  tableName = 'table_admin_users';

  orderColumns = ['firstName', null, 'emailCanonical', 'lastLogin', 'roles'];
  valueColumns = [
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        var companyEncoded = this.gfService.encodeParam(full.company);
        var userEncoded = this.gfService.encodeParam(full);
        return `<a href="#/admin/users/${full.id}/view">${full.name()}</a> ` +
          `<a title='Login as ${full.name()}' onclick='truckspy.loginAs("${userEncoded}", "${companyEncoded}")'><i class='fa fa-eye'></i></a>`;
      }.bind(this)
    },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        if (!full.company) {
          return "";
        }
        var name = full.company.name || "(unspecified)";
        var id = full.company.id;
        return `<a href="#/admin/companies/${id}/view">${name}</a>`;
      }
    },
    {
      data: 'email',
      orderable: true
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        return this.dateService.transformDateTime(full.lastLogin);
      }.bind(this)
    },
    {
      data: null,
      orderable: true,
      render: function (data, type, full, meta) {
        let roles = full.roles;
        if (!roles) {
          roles = [];
        }
        return roles
          .map(role => {
            let noPrefix = this.rolePrefixRemover.transform(role);
            let noDash = this.replaceUnderscore.transform(noPrefix);
            return this.capitalizeAll.transform(noDash);
          })
          .join(", ");
      }.bind(this)
    }
  ];

  optionsUsers: any;
  defineOptions() {
    this.optionsUsers = {
      noToolbar: true,
      processing: true,
      serverSide: true,
      pageLength: this.tableLength,
      ajax: (data, callback, settings) => {
        let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
        this.restService.getAllUsersForAdmin(params, this.tableLength, this.filters)
          .subscribe(
            data => {
              callback({
                aaData: data.results,
                recordsTotal: data.resultCount,
                recordsFiltered: data.resultCount,
              });
            });
      },
      columns: this.valueColumns,
      order: [[0, 'asc']],
    }
  };

  filters: FilterUsers = {
    nameLike: '',
    companyId: '',
    role: ''
  }
  companies: Company[];
  roles: string[];
  private userNameSearchTerm$ = new Subject();

  /**
   * Add User modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addUserModal: BsModalRef;
  userData = {};
  timezones: string[];

  addUser(template: TemplateRef<any>) {
    this.userData = {
      firstName: "",
      lastName: "",
      email: "",
      timezone: (this.timezones && this.timezones.length >= 1 && this.timezones[0]) || ""
    };
    this._addUserModal = this.modalService.show(template, { class: "modal-sm" });
  }

  doCreateUser(): void {
    this.restService.create3rdPartyUserForAdmin(this.userData)
      .subscribe(
        data => {
          this._addUserModal.hide();
          this.usersTable.ajaxReload();
        }
      );
  }
  closeUserModal(): void {
    this._addUserModal.hide();
  }

  constructor(
    private loginAsService: LoginAsService,
    private restService: RestService,
    private store: Store<ConfigState>,
    private lsService: LocalStorageService,
    private dateService: DateService,
    private dataTableService: DataTableService,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService,
    private modalService: BsModalService,
    private rolePrefixRemover: RolePrefixRemoverPipe,
    private capitalizeAll: CapitalizeAllPipe,
    private replaceUnderscore: ReplaceUnderscorePipe) {
    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.defineOptions();
    });

    this.store.pipe(select(getConfigTimezonesKeys), take(1)).subscribe(val => this.timezones = val);

    // rxjs - searching filter by vehicle remoteId
    this.userNameSearchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.refreshDataTable();
    })
  }

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
    if (userObject.isThirdParty()) {
      this.loginAsService.loginAsThirdParty(userObject);
    } else {
      this.loginAsService.loginAsUser(companyObject.id, userObject);
    }
  }

  ngOnInit() {
    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.loginAs = this.loginAs.bind(this);

    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });
    this.loadAllData();
  }

  ngOnDestroy() {
    window.truckspy.loginAs = null;

    this.userNameSearchTerm$.complete();
  }

  refreshDataTable() {
    if (this.usersTable) {
      this.usersTable.ajaxReload();
    }
  }

  private defaultColumnNames = ['Name', 'Company', 'Email', 'Last Login', 'Roles'];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

  loadAllData() {
    combineLatest(
      this.restService.get1000Companies(),
      this.restService.getConfigRolesForAdmin()
    ).subscribe(data => {
      this.companies = data[0];
      this.roles = data[1];
    });
  }

  onNameChanged(event) {
    this.userNameSearchTerm$.next(event)
  }
  clearName() {
    this.filters.nameLike = '';
    this.refreshDataTable();
  }

  onCompanyChanged(companyId: string) {
    this.filters.companyId = companyId;
    this.refreshDataTable();
  }

  onRolesChanged(role: string) {
    this.filters.role = role;
    this.refreshDataTable();
  }

}
