import { Injectable, inject } from '@angular/core';
import type {
  ExportRepository,
  PdfConfig,
  CsvConfig,
  JsonConfig,
} from '@domain/repositories/system/export.repository';
import { EXPORT_PORT, LOGGER_PORT } from '@di/tokens';
import type { Role } from '@domain/entities/role.entity';
import type { Logger } from '@core/interfaces/logger.interface';
import { ApplicationError } from '@application/errors/application-error';
import type {
  RoleExportData,
  RoleExportConfig,
  ExportFormat,
} from '@application/types/role-export.types';
import { DEFAULT_ROLE_EXPORT_CONFIG } from '@application/types/role-export.types';

@Injectable({
  providedIn: 'root',
})
export class RoleExportService {
  private exportPort = inject<ExportRepository>(EXPORT_PORT);
  private logger = inject<Logger>(LOGGER_PORT);

  async exportRoles(roles: Role[], options: RoleExportConfig = {}): Promise<void> {
    try {
      this.logger.info('Starting role export', {
        operation: 'role_export',
        correlationId: `export-${Date.now()}`,
      });

      // Merge with default configuration
      const config = { ...DEFAULT_ROLE_EXPORT_CONFIG, ...options };
      const {
        includeId,
        includeAccessLevel,
        includeStatus,
        includeDescription,
        includeUserCount,
        customTitle,
        format,
      } = config;

      // Validar que hay roles para exportar
      if (!roles || roles.length === 0) {
        throw ApplicationError.invalidInput('No roles provided for export');
      }

      // Preparar los datos planos para exportación
      const exportData: RoleExportData[] = roles.map((role) => {
        const data: RoleExportData = {
          name: role.name,
        };

        if (includeId) data.id = role.id.toString();
        if (includeAccessLevel) {
          try {
            const accessLevel = role.getAccessLevel();
            data.accessLevel = accessLevel.getName();
          } catch (error) {
            this.logger.warn('Failed to get access level for role', {
              operation: 'role_export',
              correlationId: `export-${Date.now()}`,
            });
            data.accessLevel = `Level ${role.getAccessLevel().getValue()}`;
          }
        }
        if (includeStatus) data.status = role.isActive ? 'Activo' : 'Inactivo';
        if (includeDescription) data.description = role.description || 'N/A';
        if (includeUserCount) data.userCount = role.userCount;

        return data;
      });

      const timestamp = this.generateTimestamp();

      this.logger.info('Role data prepared for export', {
        operation: 'role_export',
        correlationId: `export-${Date.now()}`,
      });

      switch (format) {
        case 'pdf':
          await this.exportToPdf(exportData, customTitle, timestamp, config);
          break;
        case 'csv':
          await this.exportToCsv(exportData, timestamp, config);
          break;
        case 'json':
          await this.exportToJson(exportData, timestamp);
          break;
        default:
          throw ApplicationError.invalidInput(`Unsupported export format: ${format}`);
      }

      this.logger.info('Role export completed successfully', {
        operation: 'role_export',
        correlationId: `export-${Date.now()}`,
      });
    } catch (error) {
      this.logger.error('Role export failed', {
        operation: 'role_export',
        correlationId: `export-${Date.now()}`,
      });

      // Re-throw ApplicationError as-is, wrap others
      if (error instanceof ApplicationError) {
        throw error;
      }

      throw ApplicationError.serviceUnavailable(
        'export',
        300 // 5 minutes retry
      );
    }
  }

  private async exportToPdf(
    data: RoleExportData[],
    title: string,
    timestamp: string,
    options: RoleExportConfig
  ): Promise<void> {
    const columns: { header: string; dataKey: keyof RoleExportData; width: number }[] = [];

    if (options.includeId) {
      columns.push({ header: 'ID', dataKey: 'id', width: 15 });
    }
    columns.push({ header: 'Nombre', dataKey: 'name', width: 40 });

    if (options.includeAccessLevel) {
      columns.push({ header: 'Nivel de Acceso', dataKey: 'accessLevel', width: 35 });
    }
    if (options.includeStatus) {
      columns.push({ header: 'Estado', dataKey: 'status', width: 25 });
    }
    if (options.includeDescription) {
      columns.push({ header: 'Descripción', dataKey: 'description', width: 50 });
    }
    if (options.includeUserCount) {
      columns.push({ header: 'Usuarios', dataKey: 'userCount', width: 30 });
    }

    const config: PdfConfig = {
      title: `${title} - ${timestamp}`,
      filename: `roles-${timestamp}.pdf`,
      columns,
      orientation: 'landscape',
      headerColor: '#475569', // slate-600
      alternateRowColors: true,
    };

    await this.exportPort.exportToPdf(data, config);
  }

  private async exportToCsv(
    data: RoleExportData[],
    timestamp: string,
    options: RoleExportConfig
  ): Promise<void> {
    const headers: (keyof RoleExportData)[] = [];

    if (options.includeId) headers.push('id');
    headers.push('name');
    if (options.includeAccessLevel) headers.push('accessLevel');
    if (options.includeStatus) headers.push('status');
    if (options.includeDescription) headers.push('description');
    if (options.includeUserCount) headers.push('userCount');

    const config: CsvConfig = {
      filename: `roles-${timestamp}.csv`,
      headers,
      includeHeaders: true,
      delimiter: ',',
    };

    await this.exportPort.exportToCsv(data, config);
  }

  private async exportToJson(data: RoleExportData[], timestamp: string): Promise<void> {
    const config: JsonConfig = {
      filename: `roles-${timestamp}.json`,
      prettify: true,
    };

    await this.exportPort.exportToJson(data, config);
  }

  private generateTimestamp(): string {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace(/:/g, '-').replace('T', '_');
  }
}
