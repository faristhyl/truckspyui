import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import _filter from 'lodash/filter';
import _find from 'lodash/find';

import { RestService, LocalStorageService, EntityThirdParty } from '@app/core/services'
import { ConfigState } from '@app/core/store/config';
import { getTableLength } from '@app/core/store/auth';

@Component({
  selector: 'app-thirdparty-companies',
  templateUrl: './companies.component.html',
  styleUrls: ['./companies.component.css']
})
export class ThirdPartyCompaniesComponent implements OnInit {

  @ViewChild("companiesTable") companiesTable: any;

  companies: EntityThirdParty[];

  tableLength: number;
  orderColumns = ["entityName", "entityIdentifier", null, null];
  valueColumns = [
    {
      data: null,
      render: function (data, type, full, meta) {
        var name = full.name || "(unspecified)";
        var id = full.id;
        return `<a href="#/third-party/companies/${id}/view">${name}</a>`;
      }
    },
    {
      data: 'identifier',
      orderable: true
    },
    {
      data: 'vehicleCount',
      orderable: false
    },
    {
      data: 'periodWeekEnd',
      orderable: false
    }
  ];
  options: any;
  defineOptions() {
    this.options = {
      noToolbar: true,
      processing: true,
      serverSide: false,
      pageLength: this.tableLength,
      data: [],
      columns: this.valueColumns
    };
  }

  /**
   * Constructor to instantiate an instance of ThirdPartyCompaniesComponent.
   */
  constructor(
    private router: Router,
    private restService: RestService,
    private store: Store<ConfigState>,
    private lsService: LocalStorageService) {
    let loggedInAs = this.lsService.getLoginAs();
    this.store.select(getTableLength).subscribe((length: number) => {
      this.tableLength = !!loggedInAs ? loggedInAs.getTableLength() : length;
      this.defineOptions();
    });

    this.loadData();
  }

  ngOnInit() { }

  loadData() {
    this.restService.get1000EntitiesForThirdParty()
      .subscribe(
        data => {
          this.companies = data;
          this.doFilter();
        });
  }

  /**
   * Filtering logic.
   */
  filters = {
    name: ""
  };

  onNameChanged() {
    this.doFilter();
  }

  clearName() {
    this.filters.name = "";
    this.doFilter();
  }

  doFilter() {
    let filtered = [...this.companies];
    if (this.filters.name) { // filter data based on company's name
      filtered = _filter(filtered, (company: EntityThirdParty) => {
        return company.name.toLowerCase().includes(this.filters.name.toLowerCase());
      })
    }

    this.companiesTable.dataReload(filtered);
  }

}
