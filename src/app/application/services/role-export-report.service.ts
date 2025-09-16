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
import type { RoleExportData, RoleExportConfig } from '@application/types/role-export.types';

/**
 * Application Layer Service for Role Export Operations
 *
 * @description
 * Coordinates role export operations by orchestrating domain entities
 * and infrastructure export services. Focuses on technical coordination
 * without containing business logic or UI presentation concerns.
 *
 * @responsibilities
 * - Coordinate role data extraction and export format generation
 * - Transform domain entities to export-appropriate data structures
 * - Delegate to infrastructure layer for actual file generation
 * - Handle export operation errors and logging
 *
 * @architecture
 * - Uses dependency injection for all external dependencies
 * - Stateless service focused on single responsibility
 * - No business logic - delegates to Domain layer
 * - No UI concerns - technical data transformation only
 *
 * @layer Application
 */
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

      // Apply default configuration for technical concerns only
      const config: Required<RoleExportConfig> = {
        includeId: true,
        includeAccessLevel: true,
        includeStatus: true,
        includeDescription: true,
        includeUserCount: true,
        customTitle: 'Roles Report',
        format: 'pdf',
        ...options,
      };

      const {
        includeId,
        includeAccessLevel,
        includeStatus,
        includeDescription,
        includeUserCount,
        customTitle,
        format,
      } = config;

      // Validate input
      if (!roles || roles.length === 0) {
        throw ApplicationError.invalidInput('No roles provided for export');
      }

      // Transform domain entities to export data structure
      const exportData: RoleExportData[] = roles.map((role) => {
        const data: RoleExportData = {
          name: role.name,
        };

        if (includeId) data.id = role.id.toString();
        if (includeAccessLevel) {
          // Application layer should not contain business display logic
          // This should be handled by Domain entity methods or Presentation layer
          data.accessLevel = `Level ${role.accessLevel}`;
        }
        if (includeStatus) {
          // Simple technical status representation - no business rules
          data.status = role.isActive ? 'Active' : 'Inactive';
        }
        if (includeDescription) data.description = role.description;
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
