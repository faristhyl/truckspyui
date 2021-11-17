import {
  Component,
  Input,
  ElementRef,
  AfterContentInit,
  OnInit,
  HostListener,
  Output,
  EventEmitter,
  AfterViewInit
} from "@angular/core";

import "script-loader!smartadmin-plugins/datatables/datatables.min.js";
import { ColumnSelector } from "@app/core/services";

@Component({
  selector: "sa-datatable",
  template: `
      <table [id]="dataTableId" class="dataTable responsive {{tableClass}}" width="{{width}}">
        <ng-content></ng-content>
      </table>
      <div [id]="columnSelectorMenuId" class="column-selector-menu" *ngIf="showColumnSelector" [style.left.px]="columnSelectorMenuLeft" [style.top.px]="columnSelectorMenuTop">
        <div class="column-selector-menu-options">  
          <span>Select Columns</span>
          <br>
          <div id="checkboxes" *ngFor="let tableColumn of dataTableColumnsClone; let i = index">
            <input [attr.id]="checkboxText+i" type="checkbox" name="list" (change)="columnSelectionChange(tableColumn, i)"
              data-target ="1" [value]="tableColumn.index" [checked]="tableColumn.visible" [disabled]="isLastColumn && tableColumn.visible"
              class="column-selector-menu-option"> {{getName(tableColumn.name)}}
            <br>
          </div>
          <button class="btn btn-default pull-right column-select-button"
            (click)="applyColumnSelection()">
            Apply
          </button>
        </div>
      </div>
`,
  styles: [require("smartadmin-plugins/datatables/datatables.min.css")]
})
export class DatatableComponent implements OnInit, AfterViewInit {
  columnSelectorMenuId = '';
  columnSelectorMenuShowHideId = '';
  checkboxText = 'column';

  @Input() public options: any;
  @Input() public filter: any;
  @Input() public detailsFormat: any;

  @Input() public paginationLength: boolean;
  @Input() public columnsHide: boolean;
  @Input() public tableClass: string;
  @Input() public width: string = "100%";

  @Input() public dataTableColumns: ColumnSelector[];
  dataTableColumnsClone: ColumnSelector[];
  @Input() public dataTableId: string = 'mainDataTable';
  @Output() selectedColumnsToSave = new EventEmitter<ColumnSelector[]>();

  showColumnSelector = false;
  columnSelectorMenuLeft: number;
  columnSelectorMenuTop: number;
  private _dataTable: any;
  columnsVisible: ColumnSelector[];
  isLastColumn = false;

  constructor(private el: ElementRef) { }

  ngOnInit() {
    this.columnSelectorMenuId = this.dataTableId + 'Context';
    this.columnSelectorMenuShowHideId = this.dataTableId + 'ContextShowHide';
    this.render();
  }

  ngAfterViewInit() {
    this.columnSelectionsInit();
  }

  ajaxReload(resetPage: boolean = false) {
    this._dataTable.ajax.reload(null, resetPage);
  }
  getRow(tr) {
    return this._dataTable.row(tr);
  }
  dataReload(data: any[]) {
    const currentPage = this._dataTable.page();
    const tableLength = this._dataTable.page.len();
    const totalPages = data.length === 0 ? 0 : Math.ceil(data.length / tableLength) - 1;
    this._dataTable.clear().rows.add(data).draw(true);
    this._dataTable.page(currentPage < totalPages ? currentPage : totalPages).draw('page');
  }

  render() {
    let element = $(this.el.nativeElement.children[0]);
    let options = this.options || {};

    let toolbar = "";
    if (options.buttons) toolbar += "B";
    if (this.paginationLength) toolbar += "l";
    if (this.columnsHide) toolbar += "C";

    if (typeof options.ajax === "string") {
      let url = options.ajax;
      options.ajax = {
        url: url
        // complete: function (xhr) {
        //
        // }
      };
    }

    options = $.extend(options, {
      dom:
        (!options.noToolbar
          ? "<'dt-toolbar'<'col-xs-12 col-sm-6'f><'col-sm-6 col-xs-12 hidden-xs text-right'" + toolbar + ">r>"
          : "") +
        "t" +
        (!options.noToolbarFooter
          ? "<'dt-toolbar-footer'<'col-sm-6 col-xs-12 hidden-xs'i><'col-xs-12 col-sm-6'p>>"
          : ""),
      oLanguage: {
        sSearch:
          "<span class='input-group-addon'><i class='glyphicon glyphicon-search'></i></span> ",
        sLengthMenu: "_MENU_"
      },
      autoWidth: false,
      retrieve: true,
      responsive: options.breakResponsiveness ? false : true,
      initComplete: (settings, json) => {
        element
          .parent()
          .find(".input-sm")
          .removeClass("input-sm")
          .addClass("input-md");
      }
    });

    this._dataTable = element.DataTable(options);

    if (this.filter) {
      // Apply the filter
      element.on("keyup change", "thead th input[type=text]", function() {
        this._dataTable
          .column(
            $(this)
              .parent()
              .index() + ":visible"
          )
          .search(this.value)
          .draw();
      });
    }

    if (!toolbar) {
      element
        .parent()
        .find(".dt-toolbar")
        .append(
          '<div class="text-right"><img src="assets/img/logo.png" alt="SmartAdmin" style="width: 111px; margin-top: 3px; margin-right: 10px;"></div>'
        );
    }

    if (!!this.dataTableColumns) {
      element
        .parent().parent().parent()
        .find(".dataTables_paginate")
        .parent()
        .append(
          `<div class="column-selector-menu-show-hide hidden-xs">
            <a id="${this.columnSelectorMenuShowHideId}" class="action-link" title="Manage Columns">
              ${this.options.columnsManagementMinified ? `<i class="fa fa-table fa-2x"></i>` : "Manage Columns"}
            </a>
          </div>`
        );
    }

    if (this.detailsFormat) {
      let format = this.detailsFormat;
      element.on("click", "td.details-control", function() {
        var tr = $(this).closest("tr");
        var row = this._dataTable.row(tr);
        if (row.child.isShown()) {
          row.child.hide();
          tr.removeClass("shown");
        } else {
          row.child(format(row.data())).show();
          tr.addClass("shown");
        }
      });
    }
  }

  /**
   * Close column select menu on click outside
   */
  @HostListener('document:click', ['$event'])
  clickout(event) {
    const element = document.getElementById(this.columnSelectorMenuId);
    const showHideElement = document.getElementById(this.columnSelectorMenuShowHideId);
    if (!!showHideElement && showHideElement.contains(event.target) && !this.showColumnSelector) {
      this.showContextMenu(event);
    } else if (this.showColumnSelector) {
      if (!element.contains(event.target) && !showHideElement.contains(event.target)) {
        this.showColumnSelector = !this.showColumnSelector;
      }
    }
  }

  /**
   * Apply column selections
   */
  columnSelectionsInit() {
    if (!this.dataTableColumns) {
      return;
    }
    let tableId = 'mainDataTable';
    if (this.dataTableId) {
      tableId = this.dataTableId;
    }
    const table = $(`#${tableId}`).DataTable();

    this.dataTableColumnsClone = this.dataTableColumns.map(next => ({ ...next })); // deep copy
    this.dataTableColumns.forEach(item => {
      const column = table.column(item.index);
      column.visible(item.visible);
      $(`#${tableId} #filterHeader tr td:eq(${item.index})`).attr('hidden', !item.visible);
    })

    // Hide header filters if presented
    const filterPresented = $(`#${tableId} thead.filter-header`).length > 0;
    if (filterPresented) {
      this.dataTableColumns.forEach(item => {
        $(`#${tableId} thead.filter-header tr td:eq(${item.index})`).attr('hidden', !item.visible);
      })
      const valuableRemain = $(`#${tableId} thead.filter-header tr td.filter-valuable[hidden!="hidden"]`).length;
      $(`#${tableId} thead.filter-header`).attr('hidden', valuableRemain === 0);
    }
  }

  getName(name) {
    return name instanceof Function ? name() : name;
  }

  /**
   * Watch column selection checkboxes
   */
  columnSelectionChange(column, i) {
    const visible = !column.visible;
    const index = column.index;

    this.dataTableColumnsClone.forEach(item => {
      if (item.index === index) {
        item.visible = visible;
      }
    });

    this.checkLastColumn();
  }

  checkLastColumn() {
    this.columnsVisible = this.dataTableColumnsClone.filter(item => item.visible === true);
    this.isLastColumn = this.columnsVisible.length === 1;
  }

  /**
   * Apply column selections filter
   */
  applyColumnSelection() {
    this.dataTableColumns = this.dataTableColumnsClone.map(next => ({ ...next })); // deep copy
    this.columnSelectionsInit();
    this.selectedColumnsToSave.emit(this.dataTableColumns);
    this.showColumnSelector = !this.showColumnSelector;
  }

  /**
   * Show column select menu on right click
   * @param e 
   */
  showContextMenu(e) {
    if (!this.dataTableColumns) {
      return;
    }
    const columnsCount = this.dataTableColumns.length;
    const origin = {
      left: e.clientX + 10,
      top: e.clientY - (80 + columnsCount * 22)
    };
    e.preventDefault();
    this.setPosition(origin);
    this.dataTableColumnsClone = this.dataTableColumns.map(next => ({ ...next })); // deep copy
    this.checkLastColumn();
    this.showColumnSelector = !this.showColumnSelector;
  }

  /**
   * Set column select menu position to open next to the cursor
   */
  setPosition({ top, left }) {
    this.columnSelectorMenuLeft = left;
    this.columnSelectorMenuTop = top;
  }

}
