import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import Papa from 'papaparse';
import type {
  ExportRepository,
  PdfConfig,
  CsvConfig,
  JsonConfig,
} from '@/app/domain/repositories/system/export.repository';

@Injectable({
  providedIn: 'root',
})
export class ClientExportService implements ExportRepository {
  async exportToPdf<T>(data: T[], config: PdfConfig): Promise<void> {
    const doc = new jsPDF({
      orientation: config.orientation || 'portrait',
      unit: 'mm',
      format: config.pageSize || 'a4',
    });

    // Agregar título si se proporciona
    if (config.title) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(config.title, 14, 20);
    }

    // Preparar los datos para la tabla
    const tableData: (string | number | boolean | null)[][] = data.map((item) => {
      const row: (string | number | boolean | null)[] = [];
      config.columns.forEach((column) => {
        const value = this.getNestedProperty(item, column.dataKey);
        // Convert unknown to acceptable CellInput types
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

    // Configurar la tabla
    autoTable(doc, {
      head: [config.columns.map((col) => col.header)],
      body: tableData,
      startY: config.title ? 30 : 20,
      theme: 'striped',
      headStyles: {
        fillColor: config.headerColor ? this.hexToRgb(config.headerColor) : [71, 85, 105], // slate-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
      },
      bodyStyles: {
        fontSize: 10,
      },
      alternateRowStyles: config.alternateRowColors
        ? {
            fillColor: [248, 250, 252], // slate-50
          }
        : undefined,
      columnStyles: this.buildColumnStyles(config.columns),
      margin: { top: 20, right: 14, bottom: 20, left: 14 },
      didParseCell: (data) => {
        // Asegurar que el texto sea legible
        if (data.section === 'body') {
          data.cell.styles.textColor = [51, 65, 85]; // slate-700
        }
      },
    });

    // Descargar el PDF
    doc.save(config.filename);
  }

  async exportToCsv<T>(data: T[], config: CsvConfig): Promise<void> {
    const csvOptions: Papa.UnparseConfig = {
      delimiter: config.delimiter || ',',
      header: config.includeHeaders !== false,
      skipEmptyLines: true,
    };

    // Si se proporcionan headers específicos, los usamos
    let csvData: Record<string, unknown>[] | unknown[] = data;
    if (config.headers && config.includeHeaders !== false) {
      // Mapear los datos para usar solo las columnas especificadas
      csvData = data.map((item) => {
        const row: Record<string, unknown> = {};
        config.headers!.forEach((header) => {
          row[header] = this.getNestedProperty(item, header);
        });
        return row;
      });
    }

    const csv = Papa.unparse(csvData, csvOptions);
    this.downloadFile(csv, config.filename, 'text/csv');
  }

  async exportToJson<T>(data: T[], config: JsonConfig): Promise<void> {
    const jsonContent = config.prettify ? JSON.stringify(data, null, 2) : JSON.stringify(data);

    this.downloadFile(jsonContent, config.filename, 'application/json');
  }

  // Método helper para obtener propiedades anidadas
  private getNestedProperty(obj: unknown, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' && current !== null && key in current
        ? (current as Record<string, unknown>)[key]
        : null;
    }, obj);
  }

  // Método helper para convertir hex a RGB
  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [71, 85, 105];
  }

  // Método helper para construir estilos de columnas
  private buildColumnStyles(columns: { width?: number }[]): Record<number, { cellWidth?: number }> {
    const styles: Record<number, { cellWidth?: number }> = {};
    columns.forEach((column, index) => {
      if (column.width) {
        styles[index] = { cellWidth: column.width };
      }
    });
    return styles;
  }

  // Método helper para descargar archivos
  private downloadFile(content: string, filename: string, mimeType: string): void {
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
