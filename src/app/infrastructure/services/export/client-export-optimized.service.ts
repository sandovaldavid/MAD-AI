import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async exportToPdf<T>(data: T[], config: PdfConfig): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    try {
      // Dynamic import with webpack chunk name for better splitting
      const [{ jsPDF }, { autoTable }] = await Promise.all([
        import(/* webpackChunkName: "jspdf" */ 'jspdf'),
        import(/* webpackChunkName: "jspdf-autotable" */ 'jspdf-autotable'),
      ]);

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
        if (config.columns) {
          config.columns.forEach((col) => {
            const value = (item as any)[col.dataKey];
            row.push(value ?? '');
          });
        }
        return row;
      });

      autoTable(doc, {
        head: config.columns ? [config.columns.map((col) => col.header)] : [],
        body: tableData,
        startY: config.title ? 30 : 20,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });

      doc.save(config.filename || 'export.pdf');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('Failed to export PDF');
    }
  }

  async exportToCsv<T>(data: T[], config: CsvConfig): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    try {
      // Dynamic import with webpack chunk name
      const Papa = await import(/* webpackChunkName: "papaparse" */ 'papaparse');

      // For CSV, we'll export all properties of the objects
      const csvData = data.map((item) => item as Record<string, any>);

      const csv = Papa.default.unparse(csvData, {
        delimiter: config.delimiter || ',',
        header: config.includeHeaders !== false,
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', config.filename || 'export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error('Failed to export CSV');
    }
  }

  async exportToJson<T>(data: T[], config: JsonConfig): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    try {
      // For JSON, we'll export the data as-is
      const jsonData = data;

      const jsonString = JSON.stringify(jsonData, null, config.prettify ? 2 : 0);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', config.filename || 'export.json');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      throw new Error('Failed to export JSON');
    }
  }
}
