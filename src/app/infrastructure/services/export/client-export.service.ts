import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import Papa from 'papaparse';
import type { ExportPort, PdfConfig, CsvConfig, JsonConfig } from '@domain/contracts/export.port';

@Injectable({
  providedIn: 'root',
})
export class ClientExportService implements ExportPort {
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
    const tableData = data.map((item) => {
      const row: any[] = [];
      config.columns.forEach((column) => {
        const value = this.getNestedProperty(item, column.dataKey);
        row.push(value ?? '');
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
    let csvData: any[] = data;
    if (config.headers && config.includeHeaders !== false) {
      // Mapear los datos para usar solo las columnas especificadas
      csvData = data.map((item) => {
        const row: any = {};
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
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
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
  private buildColumnStyles(columns: any[]): Record<number, any> {
    const styles: Record<number, any> = {};
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
