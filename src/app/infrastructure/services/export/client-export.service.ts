import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { CellHookData } from 'jspdf-autotable';
import type {
  ExportRepository,
  PdfConfig,
  CsvConfig,
  JsonConfig,
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

  downloadFile(content: string, filename: string, mimeType: string): void {
    if (this.isBrowser) {
      const blob = new Blob([content], { type: mimeType });
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
}
