import { Injectable } from '@angular/core';
import { Role } from '@domain/entities/role.entity';
import { ExportFormat } from '@domain/value-objects';

/**
 * Role Export Application Mapper
 *
 * Handles data transformation for role export operations following Clean Architecture.
 * This mapper is responsible for preparing role data for various export formats
 * while maintaining separation of concerns.
 *
 * @layer Application
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root',
})
export class RoleExportApplicationMapper {
  /**
   * Maps Domain Role entity to export data format
   */
  static toExportFormat(role: Role): RoleExportData {
    return {
      id: role.id,
      name: role.name,
      accessLevel: role.accessLevel,
      description: role.description,
      canLeadProjects: role.canLeadProjects(),
      isUniquePerTeam: role.isUniqueForTeam(),
      isActive: role.isActive,
      userCount: role.userCount,
    };
  }

  /**
   * Maps array of Domain Role entities to export data format
   */
  static toExportFormats(roles: Role[]): RoleExportData[] {
    return roles.map((role) => this.toExportFormat(role));
  }

  /**
   * Creates export options with defaults using Domain validation
   */
  static createExportOptions(options?: Partial<RoleExportOptions>): RoleExportOptions {
    // Use Domain value object for format validation and defaults
    const defaultFormat = ExportFormat.default();
    const format = options?.format
      ? ExportFormat.create(options.format).value
      : defaultFormat.value;

    return {
      format: format as 'csv' | 'pdf' | 'json',
      includeUsers: options?.includeUsers ?? false,
      includePermissions: options?.includePermissions ?? true,
      dateRange: options?.dateRange,
    };
  }

  /**
   * Validates export options using Domain business rules
   */
  static validateExportOptions(options: RoleExportOptions): boolean {
    // Delegate validation to Domain value object
    return ExportFormat.isSupported(options.format);
  }
}

// ============================================================================
// Export Types
// ============================================================================

export interface RoleExportOptions {
  readonly format: 'csv' | 'pdf' | 'json';
  readonly includeUsers: boolean;
  readonly includePermissions: boolean;
  readonly dateRange?: {
    readonly start: Date;
    readonly end: Date;
  };
}

export interface RoleExportData {
  readonly id: number;
  readonly name: string;
  readonly accessLevel: number;
  readonly description: string;
  readonly canLeadProjects: boolean;
  readonly isUniquePerTeam: boolean;
  readonly isActive: boolean;
  readonly userCount: number;
}
