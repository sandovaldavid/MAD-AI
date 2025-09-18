import { Injectable, inject } from '@angular/core';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { NotificationsFacade } from '@application/facades/notifications.facade';
import { RoleStateFacade } from './role-state.facade';
import { ROLE_EXPORT_SERVICE_PORT } from '@di/tokens';
import { Role } from '@domain/entities/role.entity';
import type { RoleExportConfig } from '@application/types/role-export.types';
import type { FacadeOpts } from './role.types';

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
  private readonly notifications = inject(NotificationsFacade);

  // Dependencies on other role facades
  private readonly roleState = inject(RoleStateFacade);

  constructor() {}

  /**
   * Execute operation with standardized error handling
   */
  private async executeOperation<T>(
    operation: () => Promise<T>,
    opts: FacadeOpts = {}
  ): Promise<T> {
    try {
      if (!opts.skipLoading) {
        this.roleState.setLoading(true);
      }
      this.roleState.clearError();
      return await operation();
    } catch (error) {
      const applicationError = this.errorTransformer.transform(error);
      this.roleState.setError(applicationError.message);

      if (!opts.silent) {
        this.notifications.notificationError(applicationError.message);
      }

      throw applicationError;
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
  ): Promise<void> {
    return this.executeOperation(async () => {
      const selectedRoleSummaries = this.roleState
        .roles()
        .filter((roleModel) => roleIds.includes(roleModel.id));

      if (selectedRoleSummaries.length === 0) {
        throw new Error('No roles selected for export');
      }

      // Convert RoleSummary to Domain Role entities for export service
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

      if (!opts.silent) {
        this.notifications.success(
          'Export completed',
          `Successfully exported ${
            selectedRoleSummaries.length
          } roles as ${(exportOptions.format || 'CSV').toUpperCase()}.`
        );
      }
    }, opts);
  }

  /**
   * Export all visible roles (applies current filters)
   */
  async exportAllVisibleRoles(
    options: Partial<RoleExportConfig>,
    opts: FacadeOpts = {}
  ): Promise<void> {
    return this.executeOperation(async () => {
      const visibleRoles = this.roleState.roles();

      if (visibleRoles.length === 0) {
        throw new Error('No roles available for export');
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
  ): Promise<void> {
    return this.executeOperation(async () => {
      const activeRoles = this.roleState.roles().filter((role) => role.isActive);

      if (activeRoles.length === 0) {
        throw new Error('No active roles available for export');
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
  ): Promise<void> {
    return this.executeOperation(async () => {
      const filteredRoles = this.roleState
        .roles()
        .filter((role) => role.accessLevel === accessLevel);

      if (filteredRoles.length === 0) {
        throw new Error(`No roles found with access level ${accessLevel}`);
      }

      const roleIds = filteredRoles.map((role) => role.id);

      return this.exportRoles(roleIds, options, { ...opts, skipLoading: true });
    }, opts);
  }

  /**
   * Quick CSV export with default options
   */
  async quickCSVExport(roleIds: number[], opts: FacadeOpts = {}): Promise<void> {
    return this.exportRoles(roleIds, { format: 'csv' }, opts);
  }

  /**
   * Quick JSON export with default options
   */
  async quickJSONExport(roleIds: number[], opts: FacadeOpts = {}): Promise<void> {
    return this.exportRoles(roleIds, { format: 'json' }, opts);
  }

  /**
   * Export detailed report (includes all available columns)
   */
  async exportDetailedReport(
    roleIds: number[],
    format: 'csv' | 'json' | 'pdf' = 'pdf',
    opts: FacadeOpts = {}
  ): Promise<void> {
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
  ): Promise<void> {
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
  ): Promise<any[]> {
    return this.executeOperation(async () => {
      const selectedRoleSummaries = this.roleState
        .roles()
        .filter((roleModel) => roleIds.includes(roleModel.id));

      if (selectedRoleSummaries.length === 0) {
        return [];
      }

      // Create preview data based on export options
      const exportOptions: RoleExportConfig = {
        includeId: true,
        includeAccessLevel: true,
        includeStatus: true,
        includeDescription: true,
        includeUserCount: true,
        ...options,
      };

      const previewData = selectedRoleSummaries.map((role) => {
        const data: any = {};

        if (exportOptions.includeId) data.id = role.id;
        data.name = role.name;
        if (exportOptions.includeAccessLevel) data.accessLevel = role.accessLevel;
        if (exportOptions.includeStatus) data.status = role.isActive ? 'Active' : 'Inactive';
        if (exportOptions.includeDescription) data.description = role.description || '';
        if (exportOptions.includeUserCount) data.userCount = role.userCount || 0;

        return data;
      });

      return previewData;
    }, opts);
  }
}
