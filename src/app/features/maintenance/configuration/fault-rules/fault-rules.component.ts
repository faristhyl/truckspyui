import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, NgZone } from '@angular/core';
import { BsModalService, BsModalRef, ModalDirective } from 'ngx-bootstrap/modal';

import {
  RestService, FilterParams, DataTableService, ColumnSelector, ColumnSelectorUtil, GlobalFunctionsService, FaultRuleAction,
  SPNDescription
} from '@app/core/services'

@Component({
  selector: 'app-maintenance-fault-rules',
  templateUrl: './fault-rules.component.html',
  styleUrls: ['./fault-rules.component.css']
})
export class FaultRulesComponent implements OnInit, OnDestroy {

  @ViewChild("faultRulesTable") faultRulesTable: any;
  tableColumns: ColumnSelector[] = [];
  tableName = 'table_maintenance_configuration_rules';

  orderColumns = [null, "description", "action", null];
  valueColumns = [
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        return full.mask && full.mask.formatted || "(unspecified)";
      }
    },
    { data: "description" },
    { data: "action" },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        var ruleEncoded = this.gfService.encodeParam(full);
        return `<a onclick='truckspy.deleteRuleModal("${ruleEncoded}")'>Delete</a>`;
      }.bind(this)
    }
  ];
  options = {
    noToolbar: true,
    processing: true,
    serverSide: true,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
      this.restService.getAllFaultRules(params)
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
    columns: this.valueColumns,
    order: [[1, 'asc']],
  };

  /**
   * Add Fault Rule modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addRuleModal: BsModalRef;
  actions = [FaultRuleAction.CREATE_ISSUE];
  ruleData = {
    action: this.actions[0],
    description: "",
    mask: ""
  };

  submitted: boolean = false;
  maskMessage = "";
  maskRegexp = new RegExp("^\\d{1,9}(-\\d{1,9})? \\d{1,9}(-\\d{1,9})? \\d{1,9}(-\\d{1,9})?$");

  addRule(template: TemplateRef<any>) {
    this.ruleData = {
      action: this.actions[0],
      description: "",
      mask: ""
    };
    this.submitted = false;
    this.maskMessage = "";

    this._addRuleModal = this.modalService.show(template, { class: "modal-400" });
  }

  maskChanged(value) {
    this.ruleData.mask = value;
    this.validateRule();
  }

  validateRule() {
    if (!this.ruleData.mask) {
      this.maskMessage = "Please enter mask";
    } else if (!this.maskRegexp.test(this.ruleData.mask)) {
      this.maskMessage = "Valid mask is: num[-num] num[-num] num[-num]";
    } else {
      this.maskMessage = "";
    }
    return !!this.ruleData.description && !this.maskMessage;
  }

  createRule(): void {
    this.submitted = true;
    const valid: boolean = this.validateRule();
    if (!valid) {
      return;
    }

    this.restService.createFaultRule(this.ruleData)
      .subscribe(
        data => {
          this._addRuleModal.hide();
          this.faultRulesTable.ajaxReload();
        }
      );
  }
  closeRuleModal(): void {
    this._addRuleModal.hide();
  }

  /**
   * Delete Fault Rule modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("deleteRuleModal") _deleteRuleModal: ModalDirective;
  forRule: any = {};

  deleteRuleModal(ruleEncoded: string) {
    this.ngZone.run(() => {
      var rule = this.gfService.decodeParam(ruleEncoded);
      this.deleteRuleModalPrivate(rule);
    });
  }
  deleteRuleModalPrivate(rule: any) {
    this.forRule = rule;
    this._deleteRuleModal.show();
  }

  closeDeleteRuleModal() {
    this._deleteRuleModal.hide();
  }
  deleteRule(rule: any) {
    this.restService.deleteFaultRule(rule.id)
      .subscribe(
        success => {
          this._deleteRuleModal.hide();
          this.faultRulesTable.ajaxReload();
        }
      );
  }

  /**
   * Show list of possible SPN values modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _showSPNsModal: BsModalRef;

  spnList: SPNDescription[] = [];
  spnListLoaded: boolean = false;
  spnsFilter: {
    filteredSpns: SPNDescription[],
    paginatedSpns: {
      array: SPNDescription[],
      begin: number,
      end: number
    }
  } = {
      filteredSpns: [],
      paginatedSpns: {
        array: [],
        begin: 0,
        end: 0
      }
    };
  search: string = "";

  spnsPage: number = 1;
  spnsPageSize: number = 15;
  changeSpnsPage(newPage) {
    this.spnsPage = newPage;
  }

  showSPNs(template: TemplateRef<any>) {
    this.search = "";
    this.spnsPage = 1;
    this._showSPNsModal = this.modalService.show(template, { class: "modal-600" });
  }

  closeShowSPNsModal() {
    this._showSPNsModal.hide();
  }

  /**
   * Constructor to instantiate an instance of FaultRulesComponent.
   */
  constructor(
    private restService: RestService,
    private dataTableService: DataTableService,
    private modalService: BsModalService,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService) { }

  ngOnInit() {
    this.restService.getCurrentUser().subscribe(user => {
      const attributes = user.attributes;
      const tableAttribute = attributes.find(item => item.name === this.tableName);
      this.tableColumns = !!tableAttribute
        ? ColumnSelectorUtil.applyProperties(this.defaultColumnNames, JSON.parse(tableAttribute.value))
        : ColumnSelectorUtil.allColumnsVisible(this.defaultColumnNames);
    });

    this.restService.getSPNs()
      .subscribe(list => {
        this.spnList = list;
        this.spnListLoaded = true;
      });

    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.deleteRuleModal = this.deleteRuleModal.bind(this);
  }

  ngOnDestroy(): void {
    window.truckspy.deleteRuleModal = null;
  }

  private defaultColumnNames = ['Code', 'Description', 'Rule', 'Actions'];

  saveSelectedColumns(columns: ColumnSelector[]) {
    this.restService.saveColumnSelection(this.tableName, columns);
  }

}
