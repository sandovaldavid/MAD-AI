import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { CellHookData } from 'jspdf-autotable';
import type {
  ExportRepository,
  PdfConfig,
  CsvConfig,
  JsonConfig,
  ExcelConfig,
} from '@domain/repositories/system/export.repository';

@Injectable({
  providedIn: 'root',
})
export class ClientExportService implements ExportRepository {
  private isBrowser: boolean;

  // Properties to hold dynamically imported libraries for testing purposes
  private papa: any;
  private jspdf: any;
  private jspdfAutoTable: any;
  private xlsx: any;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async exportToPdf<T>(data: T[], config: PdfConfig): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    this.jspdf = this.jspdf || (await import('jspdf'));
    this.jspdfAutoTable = this.jspdfAutoTable || (await import('jspdf-autotable'));

    const { jsPDF } = this.jspdf;
    const { autoTable } = this.jspdfAutoTable;

    const doc = new jsPDF({
      orientation: config.orientation || 'portrait',
      unit: 'mm',
      format: config.pageSize || 'a4',
    });

    if (config.title) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(config.title, 14, 20);
    }

    const tableData: (string | number | boolean | null)[][] = data.map((item) => {
      const row: (string | number | boolean | null)[] = [];
      config.columns.forEach((column) => {
        const value = this.getNestedProperty(item, column.dataKey);
        const cellValue: string | number | boolean | null =
          typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
            ? value
            : value === null || value === undefined
              ? null
              : String(value);
        row.push(cellValue);
      });
      return row;
    });

    autoTable(doc, {
      head: [config.columns.map((col) => col.header)],
      body: tableData,
      startY: config.title ? 30 : 20,
      theme: 'striped',
      headStyles: {
        fillColor: config.headerColor ? this.hexToRgb(config.headerColor) : [71, 85, 105],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
      },
      bodyStyles: {
        fontSize: 10,
      },
      alternateRowStyles: config.alternateRowColors
        ? {
            fillColor: [248, 250, 252],
          }
        : undefined,
      columnStyles: this.buildColumnStyles(config.columns),
      margin: { top: 20, right: 14, bottom: 20, left: 14 },
      didParseCell: (cellData: CellHookData) => {
        if (cellData.section === 'body') {
          cellData.cell.styles.textColor = [51, 65, 85];
        }
      },
    });

    doc.save(config.filename);
  }

  async exportToCsv<T>(data: T[], config: CsvConfig): Promise<void> {
    if (!this.isBrowser) {
      return;
    }
    this.papa = this.papa || (await import('papaparse'));

    const csvOptions: any = {
      delimiter: config.delimiter || ',',
      header: config.includeHeaders !== false,
      skipEmptyLines: true,
    };

    let csvData: Record<string, unknown>[] | unknown[] = data;
    if (config.headers && config.includeHeaders !== false) {
      csvData = data.map((item) => {
        const row: Record<string, unknown> = {};
        config.headers!.forEach((header) => {
          row[header] = this.getNestedProperty(item, header);
        });
        return row;
      });
    }

    const csv = this.papa.unparse(csvData, csvOptions);
    this.downloadFile(csv, config.filename, 'text/csv');
  }

  exportToJson<T>(data: T[], config: JsonConfig): Promise<void> {
    const jsonContent = config.prettify ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    this.downloadFile(jsonContent, config.filename, 'application/json');
    return Promise.resolve();
  }

  async exportToExcel<T>(data: T[], config: ExcelConfig): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    const xlsxLib = await this.getXlsxLibrary();

    const headers =
      config.headers && config.headers.length > 0
        ? config.headers
        : this.inferHeadersFromData(data);

    const effectiveHeaders = headers.length > 0 ? headers : ['value'];

    const rows = data.map((item) => this.buildExcelRow(item, effectiveHeaders));

    const worksheet = xlsxLib.utils.json_to_sheet(rows, {
      header: effectiveHeaders,
    });

    if (config.autoFitColumns) {
      worksheet['!cols'] = this.buildWorksheetColumnMetadata(
        rows,
        effectiveHeaders,
        config.maxColumnWidth
      );
    }

    const workbook = xlsxLib.utils.book_new();
    const sheetName = this.sanitizeSheetName(config.sheetName ?? 'Sheet1');
    xlsxLib.utils.book_append_sheet(workbook, worksheet, sheetName);

    const workbookData: ArrayBuffer = xlsxLib.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      compression: true,
    });

    this.downloadFile(
      workbookData,
      config.filename.endsWith('.xlsx') ? config.filename : `${config.filename}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  }

  private getNestedProperty(obj: unknown, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' && current !== null && key in current
        ? (current as Record<string, unknown>)[key]
        : null;
    }, obj);
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [71, 85, 105];
  }

  private buildColumnStyles(columns: { width?: number }[]): Record<number, { cellWidth?: number }> {
    const styles: Record<number, { cellWidth?: number }> = {};
    columns.forEach((column, index) => {
      if (column.width) {
        styles[index] = { cellWidth: column.width };
      }
    });
    return styles;
  }

  downloadFile(
    content: string | ArrayBuffer | Uint8Array,
    filename: string,
    mimeType: string
  ): void {
    if (!this.isBrowser) {
      return;
    }

    let blobPart: BlobPart;
    if (typeof content === 'string') {
      blobPart = content;
    } else if (content instanceof ArrayBuffer) {
      blobPart = content;
    } else if (content instanceof Uint8Array) {
      blobPart = content.slice().buffer;
    } else {
      blobPart = String(content);
    }

    const blob = new Blob([blobPart], { type: mimeType });
    this.triggerDownload(blob, filename);
  }

  private async getXlsxLibrary(): Promise<any> {
    if (!this.xlsx) {
      const module = await import('xlsx');
      this.xlsx = (module as any).default ?? module;
    }

    return this.xlsx;
  }

  private buildExcelRow<T>(item: T, headers: string[]): Record<string, unknown> {
    return headers.reduce<Record<string, unknown>>((row, header) => {
      const value = this.getNestedProperty(item, header);
      row[header] = this.formatExcelValue(value);
      return row;
    }, {});
  }

  private inferHeadersFromData<T>(data: T[]): string[] {
    if (!data || data.length === 0) {
      return [];
    }

    const firstRow = data.find((item) => item && typeof item === 'object');
    if (!firstRow || typeof firstRow !== 'object') {
      return [];
    }

    return Object.keys(firstRow as Record<string, unknown>);
  }

  private formatExcelValue(value: unknown): string | number | boolean | Date | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    const valueType = typeof value;
    if (valueType === 'number' || valueType === 'boolean' || valueType === 'string') {
      return value as number | boolean | string;
    }

    if (valueType === 'object' && 'value' in (value as Record<string, unknown>)) {
      const nested = (value as Record<string, unknown>)['value'];
      return this.formatExcelValue(nested);
    }

    return JSON.stringify(value);
  }

  private buildWorksheetColumnMetadata(
    rows: Array<Record<string, unknown>>,
    headers: string[],
    maxColumnWidth?: number
  ): Array<{ wch: number }> {
    return headers.map((header) => {
      const headerLength = header.length;
      const maxContentLength = rows.reduce((maxLength, row) => {
        const cell = row[header];
        if (cell === null || cell === undefined) {
          return maxLength;
        }
        const cellString = typeof cell === 'string' ? cell : JSON.stringify(cell);
        return Math.max(maxLength, cellString.length);
      }, headerLength);

      const desiredWidth = Math.max(headerLength, maxContentLength) + 2;
      const constrainedWidth = maxColumnWidth
        ? Math.min(desiredWidth, maxColumnWidth)
        : desiredWidth;
      return { wch: constrainedWidth };
    });
  }

  private sanitizeSheetName(sheetName: string): string {
    const sanitized = sheetName.replace(/[\[\]\*\?/\\:]/g, '').trim();
    if (!sanitized) {
      return 'Sheet1';
    }
    return sanitized.length > 31 ? sanitized.slice(0, 31) : sanitized;
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
