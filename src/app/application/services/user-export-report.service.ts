import { Injectable, inject } from '@angular/core';
import { EXPORT_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import type {
  ExportRepository,
  PdfConfig,
  CsvConfig,
  JsonConfig,
  ExcelConfig,
} from '@domain/repositories/system/export.repository';
import type { UserExportData, UserExportConfig } from '@application/types/user-export.types';
import type { User } from '@domain/entities/user.entity';
import type { Logger } from '@core/interfaces/logger.interface';

/**
 * Application Layer Service for User Export Operations
 *
 * @description
 * Coordinates user export operations by orchestrating domain entities
 * and infrastructure export services. Handles data transformation from
 * Domain entities to export-friendly formats.
 *
 * @responsibilities
 * - Transform domain entities to export data structures
 * - Coordinate with infrastructure export repository
 * - Handle export configuration and format selection
 * - Provide error handling for export operations
 *
 * @architecture
 * Application Service responsibilities:
 * - Use case orchestration (no business logic)
 * - Data transformation between layers
 * - Infrastructure service coordination
 * - Error handling and logging
 *
 * @layer Application - Service
 */
@Injectable({
  providedIn: 'root',
})
export class UserExportService {
  private readonly exportPort = inject<ExportRepository>(EXPORT_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  /**
   * Export users to specified format
   *
   * @param users Array of User domain entities
   * @param options Export configuration options
   */
  async exportUsers(users: User[], options: UserExportConfig = {}): Promise<void> {
    try {
      this.logger.info('Starting user export operation');

      // Apply default configuration
      const config = this.buildExportConfig(options);

      // Validate input
      this.validateExportInput(users, config);

      // Transform domain entities to export data
      const exportData = this.transformUsersToExportData(users, config);

      // Generate timestamp for file naming
      const timestamp = this.generateTimestamp();

      // Delegate to infrastructure based on format
      await this.executeExportByFormat(exportData, config, timestamp);

      this.logger.info('User export completed successfully');
    } catch (error) {
      this.logger.error('User export operation failed', { operation: 'exportUsers' });
      throw this.handleExportError(error);
    }
  }

  private async exportToPdf(
    data: Partial<UserExportData>[],
    title: string,
    timestamp: string,
    options: UserExportConfig
  ): Promise<void> {
    const columns: { header: string; dataKey: keyof UserExportData; width: number }[] = [];

    if (options.includeId) {
      columns.push({ header: 'ID', dataKey: 'id', width: 15 });
    }
    columns.push({ header: 'Nombre', dataKey: 'displayName', width: 40 });

    if (options.includeEmail) {
      columns.push({ header: 'Email', dataKey: 'email', width: 45 });
    }
    if (options.includeUsername) {
      columns.push({ header: 'Usuario', dataKey: 'username', width: 30 });
    }
    if (options.includeRole) {
      columns.push({ header: 'Rol', dataKey: 'role', width: 25 });
    }
    if (options.includeStatus) {
      columns.push({ header: 'Estado', dataKey: 'status', width: 20 });
    }
    if (options.includeLastActivity) {
      columns.push({ header: 'Última Actividad', dataKey: 'lastActivity', width: 35 });
    }
    if (options.includeCreatedAt) {
      columns.push({ header: 'Fecha Creación', dataKey: 'createdAt', width: 35 });
    }

    const config: PdfConfig = {
      title: `${title} - ${timestamp}`,
      filename: `users-${timestamp}.pdf`,
      columns,
      orientation: 'landscape',
      headerColor: '#475569', // slate-600
      alternateRowColors: true,
    };

    await this.exportPort.exportToPdf(data, config);
  }

  private async exportToCsv(
    data: Partial<UserExportData>[],
    timestamp: string,
    options: UserExportConfig
  ): Promise<void> {
    const headers: (keyof UserExportData)[] = [];

    if (options.includeId) headers.push('id');
    headers.push('displayName');
    if (options.includeEmail) headers.push('email');
    if (options.includeUsername) headers.push('username');
    if (options.includeRole) headers.push('role');
    if (options.includeStatus) headers.push('status');
    if (options.includeLastActivity) headers.push('lastActivity');
    if (options.includeCreatedAt) headers.push('createdAt');

    const config: CsvConfig = {
      filename: `users-${timestamp}.csv`,
      headers,
      includeHeaders: true,
      delimiter: ',',
    };

    await this.exportPort.exportToCsv(data, config);
  }

  private async exportToJson(data: Partial<UserExportData>[], timestamp: string): Promise<void> {
    const config: JsonConfig = {
      filename: `users-${timestamp}.json`,
      prettify: true,
    };

    await this.exportPort.exportToJson(data, config);
  }

  private async exportToExcel(
    data: Partial<UserExportData>[],
    timestamp: string,
    options: UserExportConfig
  ): Promise<void> {
    const headers: (keyof UserExportData)[] = [];

    if (options.includeId) headers.push('id');
    headers.push('displayName');
    if (options.includeEmail) headers.push('email');
    if (options.includeUsername) headers.push('username');
    if (options.includeRole) headers.push('role');
    if (options.includeStatus) headers.push('status');
    if (options.includeLastActivity) headers.push('lastActivity');
    if (options.includeCreatedAt) headers.push('createdAt');

    const config: ExcelConfig = {
      filename: `users-${timestamp}.xlsx`,
      sheetName: this.sanitizeSheetName(options.customTitle ?? 'Users Report'),
      headers: headers.map((header) => header.toString()),
      autoFitColumns: true,
      maxColumnWidth: 60,
    };

    await this.exportPort.exportToExcel(data, config);
  }

  /**
   * Build export configuration with defaults
   */
  private buildExportConfig(options: UserExportConfig): Required<UserExportConfig> {
    return {
      includeId: true,
      includeEmail: true,
      includeUsername: true,
      includeRole: true,
      includeStatus: true,
      includeLastActivity: true,
      includeCreatedAt: true,
      customTitle: 'Users Report',
      format: 'pdf',
      ...options,
    };
  }

  /**
   * Validate export input
   */
  private validateExportInput(users: User[], config: Required<UserExportConfig>): void {
    if (!users || users.length === 0) {
      throw ApplicationError.invalidInput('No users provided for export');
    }

    if (!config.format || !['pdf', 'csv', 'json', 'excel'].includes(config.format)) {
      throw ApplicationError.invalidInput(`Invalid export format: ${config.format}`);
    }
  }

  /**
   * Transform domain entities to export data structure
   */
  private transformUsersToExportData(
    users: User[],
    config: Required<UserExportConfig>
  ): Partial<UserExportData>[] {
    return users.map((user, index) => {
      try {
        return this.transformSingleUser(user, config);
      } catch {
        this.logger.error(`Failed to transform user ${index + 1}`, {
          operation: 'transformUsersToExportData',
          userId: user?.id?.toString(),
        });
        return this.createFallbackUserData(user, index);
      }
    });
  }

  /**
   * Transform a single user entity to export data
   */
  private transformSingleUser(
    user: User,
    config: Required<UserExportConfig>
  ): Partial<UserExportData> {
    const data: Partial<UserExportData> = {};

    // Build display name
    const firstName = this.extractStringValue(user.firstName) || '';
    const lastName = this.extractStringValue(user.lastName) || '';
    data.displayName = `${firstName} ${lastName}`.trim() || `User ${user.id}`;

    // Add fields based on configuration
    if (config.includeId) {
      data.id = user.id?.toString() || 'N/A';
    }
    if (config.includeEmail) {
      data.email = this.extractStringValue(user.email) || 'N/A';
    }
    if (config.includeUsername) {
      data.username = this.extractStringValue(user.username) || 'N/A';
    }
    if (config.includeRole) {
      data.role = user.role?.name || 'Sin rol';
    }
    if (config.includeStatus) {
      data.status = user.active ? 'Activo' : 'Inactivo';
      data.isActive = user.active;
    }
    if (config.includeLastActivity) {
      data.lastActivity = this.extractStringValue(user.lastActivityAt) || 'N/A';
    }
    if (config.includeCreatedAt) {
      data.createdAt = this.extractStringValue(user.createdAt) || 'N/A';
    }

    return data;
  }

  /**
   * Safely extract string value from value objects or primitives
   * Formats dates to be user-friendly
   */
  private extractStringValue(value: unknown): string | null {
    if (!value) return null;

    // Handle string values that might be dates
    if (typeof value === 'string') {
      // Check if it's a date string (ISO format)
      if (this.isDateString(value)) {
        return this.formatDateForUser(value);
      }
      return value;
    }

    // Handle Date objects
    if (value instanceof Date) {
      return this.formatDateForUser(value.toISOString());
    }

    // Handle value objects with toString method
    if (typeof value === 'object' && 'toString' in value) {
      const stringValue = value.toString();
      // Check if the toString result is a date
      if (this.isDateString(stringValue)) {
        return this.formatDateForUser(stringValue);
      }
      return stringValue;
    }

    // Handle value objects with value property
    if (typeof value === 'object' && 'value' in value) {
      const extractedValue = String(value.value);
      // Check if the value property is a date
      if (this.isDateString(extractedValue)) {
        return this.formatDateForUser(extractedValue);
      }
      return extractedValue;
    }

    const stringValue = String(value);
    // Final check for date strings
    if (this.isDateString(stringValue)) {
      return this.formatDateForUser(stringValue);
    }

    return stringValue;
  }

  /**
   * Check if a string represents a date in ISO format
   */
  private isDateString(value: string): boolean {
    // Check for ISO date format with microseconds: YYYY-MM-DDTHH:mm:ss.ffffffZ
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?Z?$/;
    return isoDateRegex.test(value) && !isNaN(Date.parse(value));
  }

  /**
   * Format date string to user-friendly format
   */
  private formatDateForUser(dateString: string): string {
    try {
      const date = new Date(dateString);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original if invalid
      }

      // Format as DD/MM/YYYY HH:mm
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');

      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      // If formatting fails, return the original string
      return dateString;
    }
  }

  /**
   * Create fallback data for users that failed transformation
   */
  private createFallbackUserData(user: User, index: number): Partial<UserExportData> {
    return {
      displayName: `User ${user?.id || index + 1} (Error)`,
      id: user?.id?.toString() || (index + 1).toString(),
      email: 'Error extracting data',
      username: 'Error extracting data',
      role: 'Error extracting data',
      status: 'Error',
      isActive: false,
      lastActivity: 'N/A',
      createdAt: 'N/A',
    };
  }

  /**
   * Execute export based on format
   */
  private async executeExportByFormat(
    exportData: Partial<UserExportData>[],
    config: Required<UserExportConfig>,
    timestamp: string
  ): Promise<void> {
    switch (config.format) {
      case 'pdf':
        await this.exportToPdf(exportData, config.customTitle, timestamp, config);
        break;
      case 'csv':
        await this.exportToCsv(exportData, timestamp, config);
        break;
      case 'excel':
        await this.exportToExcel(exportData, timestamp, config);
        break;
      case 'json':
        await this.exportToJson(exportData, timestamp);
        break;
      default:
        throw ApplicationError.invalidInput(`Unsupported export format: ${config.format}`);
    }
  }

  /**
   * Handle export errors
   */
  private handleExportError(error: unknown): Error {
    if (error instanceof ApplicationError) {
      return error;
    }

    return ApplicationError.serviceUnavailable('export', 300); // 5 minutes retry
  }

  private generateTimestamp(): string {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace(/:/g, '-').replace('T', '_');
  }

  private sanitizeSheetName(title: string): string {
    const sanitized = title.replace(/[[\]*?/\\:]/g, '').trim();
    if (!sanitized) {
      return 'Sheet1';
    }
    return sanitized.length > 31 ? sanitized.slice(0, 31) : sanitized;
  }
}
