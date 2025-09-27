import { Injectable, inject } from '@angular/core';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { RoleStateFacade } from './role-state.facade';
import { ROLE_EXPORT_SERVICE_PORT } from '@di/tokens';
import { Role } from '@domain/entities/role.entity';
import type { RoleExportConfig } from '@application/types/role-export.types';
import type { FacadeOpts } from './role.types';
import type { Message } from '@application/types/message.type';

/**
 * Export facade for roles
 *
 * Handles export operations including:
 * - CSV export with customizable columns
 * - Excel export with formatting
 * - PDF report generation
 * - Filtered export based on search criteria
 *
 * Responsibilities:
 * - Export selected roles to various formats
 * - Apply export configuration and options
 * - Handle file generation and download
 * - Provide user feedback for export operations
 */
@Injectable({ providedIn: 'root' })
export class RoleExportFacade {
  private readonly roleExportService = inject(ROLE_EXPORT_SERVICE_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  // Dependencies on other role facades
  private readonly roleState = inject(RoleStateFacade);

  /**
   * Execute operation with standardized error handling
   */
  private async executeOperation<T>(
    operation: () => Promise<T | Message>,
    opts: FacadeOpts = {}
  ): Promise<T | Message> {
    try {
      if (!opts.skipLoading) {
        this.roleState.setLoading(true);
      }
      this.roleState.clearError();
      return await operation();
    } catch (error) {
      const applicationError = this.errorTransformer.transform(error);
      this.roleState.setError(applicationError.message);
      return {
        success: false,
        error: `Error: ${applicationError.message}`,
        message: 'Ocurrió un error al exportar los roles.',
      };
    } finally {
      if (!opts.skipLoading) {
        this.roleState.setLoading(false);
      }
    }
  }

  /**
   * Export selected roles to specified format
   */
  async exportRoles(
    roleIds: number[],
    options: Partial<RoleExportConfig>,
    opts: FacadeOpts = {}
  ): Promise<Message> {
    return this.executeOperation(async () => {
      const selectedRoleSummaries = this.roleState
        .roles()
        .filter((roleModel) => roleIds.includes(roleModel.id));

      if (selectedRoleSummaries.length === 0) {
        return {
          success: false,
          error: 'No se seleccionaron roles para exportar.',
          message: 'Debe seleccionar al menos un rol para exportar.',
        };
      }

      // Convierte RoleSummary a entidades de dominio
      const domainRoles = selectedRoleSummaries.map((summary) =>
        Role.create({
          id: summary.id,
          name: summary.name,
          accessLevel: summary.accessLevel,
          isActive: summary.isActive,
          description: summary.description || null,
          userCount: summary.userCount || 0,
        })
      );

      const exportOptions: RoleExportConfig = {
        format: 'csv',
        includeId: true,
        includeAccessLevel: true,
        includeStatus: true,
        includeDescription: true,
        includeUserCount: true,
        ...options,
      };

      await this.roleExportService.exportRoles(domainRoles, exportOptions);

      return {
        success: true,
        message: `Exportación completada: ${selectedRoleSummaries.length} roles exportados como ${(exportOptions.format || 'CSV').toUpperCase()}.`,
      };
    }, opts);
  }

  /**
   * Export all visible roles (applies current filters)
   */
  async exportAllVisibleRoles(
    options: Partial<RoleExportConfig>,
    opts: FacadeOpts = {}
  ): Promise<Message> {
    return this.executeOperation(async () => {
      const visibleRoles = this.roleState.roles();

      if (visibleRoles.length === 0) {
        return {
          success: false,
          error: 'No hay roles disponibles para exportar.',
          message: 'No se encontraron roles visibles para exportar.',
        };
      }

      const roleIds = visibleRoles.map((role) => role.id);

      return this.exportRoles(roleIds, options, { ...opts, skipLoading: true });
    }, opts);
  }

  /**
   * Export only active roles
   */
  async exportActiveRoles(
    options: Partial<RoleExportConfig>,
    opts: FacadeOpts = {}
  ): Promise<Message> {
    return this.executeOperation(async () => {
      const activeRoles = this.roleState.roles().filter((role) => role.isActive);

      if (activeRoles.length === 0) {
        return {
          success: false,
          error: 'No hay roles activos disponibles para exportar.',
          message: 'No se encontraron roles activos para exportar.',
        };
      }

      const roleIds = activeRoles.map((role) => role.id);

      return this.exportRoles(roleIds, options, { ...opts, skipLoading: true });
    }, opts);
  }

  /**
   * Export roles with specific access level
   */
  async exportRolesByAccessLevel(
    accessLevel: number,
    options: Partial<RoleExportConfig>,
    opts: FacadeOpts = {}
  ): Promise<Message> {
    return this.executeOperation(async () => {
      const filteredRoles = this.roleState
        .roles()
        .filter((role) => role.accessLevel === accessLevel);

      if (filteredRoles.length === 0) {
        return {
          success: false,
          error: `No se encontraron roles con nivel de acceso ${accessLevel}.`,
          message: 'No se encontraron roles para exportar con el nivel de acceso especificado.',
        };
      }

      const roleIds = filteredRoles.map((role) => role.id);

      return this.exportRoles(roleIds, options, { ...opts, skipLoading: true });
    }, opts);
  }

  /**
   * Quick CSV export with default options
   */
  async quickCSVExport(roleIds: number[], opts: FacadeOpts = {}): Promise<Message> {
    return this.exportRoles(roleIds, { format: 'csv' }, opts);
  }

  /**
   * Quick JSON export with default options
   */
  async quickJSONExport(roleIds: number[], opts: FacadeOpts = {}): Promise<Message> {
    return this.exportRoles(roleIds, { format: 'json' }, opts);
  }

  /**
   * Export detailed report (includes all available columns)
   */
  async exportDetailedReport(
    roleIds: number[],
    format: 'csv' | 'json' | 'pdf' = 'pdf',
    opts: FacadeOpts = {}
  ): Promise<Message> {
    return this.exportRoles(
      roleIds,
      {
        format,
        includeId: true,
        includeAccessLevel: true,
        includeStatus: true,
        includeDescription: true,
        includeUserCount: true,
      },
      opts
    );
  }

  /**
   * Export summary report (basic columns only)
   */
  async exportSummaryReport(
    roleIds: number[],
    format: 'csv' | 'json' = 'csv',
    opts: FacadeOpts = {}
  ): Promise<Message> {
    return this.exportRoles(
      roleIds,
      {
        format,
        includeId: false,
        includeAccessLevel: true,
        includeStatus: true,
        includeDescription: false,
        includeUserCount: true,
      },
      opts
    );
  }

  /**
   * Get export preview (returns role data that would be exported)
   */
  async getExportPreview(
    roleIds: number[],
    options: Partial<RoleExportConfig>,
    opts: FacadeOpts = {}
  ): Promise<unknown[] | Message> {
    return this.executeOperation(async () => {
      const selectedRoleSummaries = this.roleState
        .roles()
        .filter((roleModel) => roleIds.includes(roleModel.id));

      if (selectedRoleSummaries.length === 0) {
        return {
          success: false,
          error: 'No se seleccionaron roles para previsualizar.',
          message: 'Debe seleccionar al menos un rol para previsualizar.',
        };
      }

      // Crear datos de previsualización según las opciones
      const exportOptions: RoleExportConfig = {
        includeId: true,
        includeAccessLevel: true,
        includeStatus: true,
        includeDescription: true,
        includeUserCount: true,
        ...options,
      };

      const previewData = selectedRoleSummaries.map((role) => {
        const data: Record<string, unknown> = {};

        if (exportOptions.includeId) data['id'] = role.id;
        data['name'] = role.name;
        if (exportOptions.includeAccessLevel) data['accessLevel'] = role.accessLevel;
        if (exportOptions.includeStatus) data['status'] = role.isActive ? 'Activo' : 'Inactivo';
        if (exportOptions.includeDescription) data['description'] = role.description || '';
        if (exportOptions.includeUserCount) data['userCount'] = role.userCount || 0;

        return data;
      });

      return previewData;
    }, opts);
  }
}
