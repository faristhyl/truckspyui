import { Injectable } from "@angular/core";

import * as Excel from "exceljs/dist/exceljs.js";
import * as fs from 'file-saver/dist/FileSaver.js';
import { DataTableService, FilterParams } from "./rest.service";

interface ExcelOptions<T> {
    title: string, 
    header: string[], 
    data: Partial<T>[],
    fileName: string,
}

@Injectable()
export class ExcelService<T> {

  tableData: T[] = [];

  constructor(private dataTableService: DataTableService) {}

  public generateExcel(options: ExcelOptions<T>) {
    const { title, header, data, fileName } = options;

    // create excel
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet(fileName);

    // Add new row
    let titleRow = worksheet.addRow([title]);
    // Set font, size and style in title row.
    titleRow.font = { name: 'Roboto', family: 4, size: 16, underline: 'double', bold: true };
    // Blank Row
    worksheet.addRow([]);

    // Add Header Row
    let headerRow = worksheet.addRow(header);
    // set column width
    worksheet.columns = header.map(() => {
        return { width: 20};
    })
    // Cell Style : Fill and Border
    headerRow.eachCell((cell, number) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' },
        bgColor: { argb: 'FF0000FF' },
      }
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' },  }
    });

    // Add Data and Conditional Formatting
    data.forEach(d => {
      worksheet.addRow(d);
    });
    
    // save excel
    workbook.xlsx.writeBuffer().then((data) => {
      let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, `${fileName}.xlsx`);
    });
  }


  public prepareParamsForRequest(table, orderColumns: string[]): FilterParams {
       // get sorting from table
    const order = table.options.order.map(item => {
        return {
          column: item[0],
          dir: item[1]
        }
      });
      // create params for request
      const params: FilterParams = this.dataTableService.calculateParamsForVis(
        { start: 0, length: 10, order }, 
        orderColumns
      );
      return params
  }
}
