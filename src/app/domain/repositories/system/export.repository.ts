// Importación de tipos para PDF
export interface PdfColumn {
  header: string;
  dataKey: string;
  width?: number;
}

export interface PdfConfig {
  title: string;
  filename: string;
  columns: PdfColumn[];
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter';
  headerColor?: string;
  alternateRowColors?: boolean;
}

export interface CsvConfig {
  filename: string;
  delimiter?: string;
  headers?: string[];
  includeHeaders?: boolean;
}

export interface JsonConfig {
  filename: string;
  prettify?: boolean;
}

export interface ExcelConfig {
  filename: string;
  sheetName?: string;
  headers?: string[];
  autoFitColumns?: boolean;
  maxColumnWidth?: number;
}

// Puerto principal para exportación
export interface ExportRepository {
  exportToPdf<T>(data: T[], config: PdfConfig): Promise<void>;
  exportToCsv<T>(data: T[], config: CsvConfig): Promise<void>;
  exportToJson<T>(data: T[], config: JsonConfig): Promise<void>;
  exportToExcel<T>(data: T[], config: ExcelConfig): Promise<void>;
}
