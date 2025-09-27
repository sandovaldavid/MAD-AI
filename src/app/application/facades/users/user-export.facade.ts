import { Injectable, inject } from '@angular/core';
import { BaseUserFacade } from './base-user.facade';
import { USER_EXPORT_SERVICE_PORT, LOGGER_PORT } from '@di/tokens';
import type { User } from '@domain/entities/user.entity';
import type { UserExportConfig } from '@application/types/user-export.types';
import type { Message } from '@application/types/message.type';
import type { FacadeOpts } from '@application/types/facade-opts';

/**
 * Export facade for users
 *
 * @description
 * Application Layer Facade following MAD-AI Clean Architecture principles.
 * Manages export state and coordinates with export use cases.
 *
 * @responsibilities
 * - Manage export operation state (loading, error, success)
 * - Coordinate with export use cases
 * - Provide reactive state for UI components
 * - Handle user feedback and notifications
 *
 * @architecture
 * Facade Layer responsibilities:
 * - State management using Angular Signals
 * - Use case coordination (no business logic)
 * - Error handling and user feedback
 * - No data transformation (delegated to Application services)
 *
 * @layer Application - Facade
 */
@Injectable({ providedIn: 'root' })
export class UserExportFacade extends BaseUserFacade {
  private readonly userExportService = inject(USER_EXPORT_SERVICE_PORT);
  private readonly logger = inject(LOGGER_PORT);

  constructor() {
    super();
  }

  /**
   * Execute operation with standardized error handling
   */
  private async executeOperation<T>(
    operation: () => Promise<T | Message>,
    opts: FacadeOpts = {}
  ): Promise<T | Message> {
    try {
      if (!opts.skipLoading) {
        this.setLoading(true);
      }
      this.setError(null);
      return await operation();
    } catch (error) {
      this.handleError(error);
      throw error;
    } finally {
      if (!opts.skipLoading) {
        this.setLoading(false);
      }
    }
  }

  /**
   * Export users by IDs with specified options (with provided user data)
   *
   * @description
   * Facade method that coordinates export operation using provided user entities.
   * Delegates data transformation and export logic to Application service.
   *
   * @param userIds Array of user IDs to export
   * @param allUsers Array of user entities to filter from
   * @param options Export configuration options
   * @param opts Facade execution options
   * @returns Promise with operation result
   */
  async exportUsersWithData(
    userIds: number[],
    allUsers: User[],
    options: Partial<UserExportConfig> = {},
    opts: FacadeOpts = {}
  ): Promise<Message> {
    return this.executeOperation(async () => {
      // Validate input at facade level
      if (!userIds || userIds.length === 0) {
        throw new Error('No user IDs provided for export');
      }

      if (!allUsers || allUsers.length === 0) {
        throw new Error('No user data provided for export');
      }

      // Filter users to export (facade-level filtering)
      const usersToExport = allUsers.filter((user) => userIds.includes(user.id));

      if (usersToExport.length === 0) {
        throw new Error('No users found for the provided IDs');
      }

      // Prepare export options with defaults
      const exportOptions: UserExportConfig = {
        includeId: true,
        includeEmail: true,
        includeUsername: true,
        includeRole: true,
        includeStatus: true,
        includeLastActivity: true,
        includeCreatedAt: true,
        customTitle: 'Users Export',
        format: 'pdf',
        ...options,
      };

      // Delegate to Application service (no data transformation in facade)
      await this.userExportService.exportUsers(usersToExport, exportOptions);

      this.logger.info('Export completed successfully');

      return {
        success: true,
        message: `Successfully exported ${usersToExport.length} users`,
        type: 'success',
        title: 'Export Successful',
      };
    }, opts);
  }

  /**
   * Export users by IDs with specified options (main export method)
   *
   * @description
   * Main export method that delegates to Application service. Uses current users state
   * from the inherited BaseUserFacade.
   *
   * @param userIds Array of user IDs to export
   * @param options Export configuration options
   * @param opts Facade execution options
   * @returns Promise with operation result
   */
  async exportUsers(
    userIds: number[],
    options: Partial<UserExportConfig> = {},
    opts: FacadeOpts = {}
  ): Promise<Message> {
    return this.executeOperation(async () => {
      // Validate input at facade level
      if (!userIds || userIds.length === 0) {
        throw new Error('No user IDs provided for export');
      }

      // Get users from inherited state (populated by main UsersFacade)
      const allUsers = this.users();

      if (allUsers.length === 0) {
        throw new Error('No user data available. Please load users first.');
      }

      // Filter users to export
      const usersToExport = allUsers.filter((user) => userIds.includes(user.id));

      if (usersToExport.length === 0) {
        throw new Error('No users found for the provided IDs');
      }

      // Prepare export options with defaults
      const exportOptions: UserExportConfig = {
        includeId: true,
        includeEmail: true,
        includeUsername: true,
        includeRole: true,
        includeStatus: true,
        includeLastActivity: true,
        includeCreatedAt: true,
        customTitle: 'Users Export',
        format: 'pdf',
        ...options,
      };

      // Delegate to Application service
      await this.userExportService.exportUsers(usersToExport, exportOptions);

      this.logger.info('Export completed successfully');

      return {
        success: true,
        message: `Successfully exported ${usersToExport.length} users`,
        type: 'success',
        title: 'Export Successful',
      };
    }, opts);
  }

  /**
   * Export all active users
   *
   * @param options Export configuration options
   * @param opts Facade execution options
   * @returns Promise with operation result
   */
  async exportActiveUsers(
    options: Partial<UserExportConfig> = {},
    opts: FacadeOpts = {}
  ): Promise<Message> {
    return this.executeOperation(async () => {
      const allUsers = this.users();
      const activeUsers = allUsers.filter((user) => user.active);
      const userIds = activeUsers.map((user) => user.id);

      if (userIds.length === 0) {
        throw new Error('No active users found to export');
      }

      return this.exportUsers(userIds, options, { ...opts, skipLoading: true });
    }, opts);
  }

  /**
   * Export all inactive users
   *
   * @param options Export configuration options
   * @param opts Facade execution options
   * @returns Promise with operation result
   */
  async exportInactiveUsers(
    options: Partial<UserExportConfig> = {},
    opts: FacadeOpts = {}
  ): Promise<Message> {
    return this.executeOperation(async () => {
      const allUsers = this.users();
      const inactiveUsers = allUsers.filter((user) => !user.active);
      const userIds = inactiveUsers.map((user) => user.id);

      if (userIds.length === 0) {
        throw new Error('No inactive users found to export');
      }

      return this.exportUsers(userIds, options, { ...opts, skipLoading: true });
    }, opts);
  }

  /**
   * Export users by role
   *
   * @param roleName Name of the role to filter users
   * @param options Export configuration options
   * @param opts Facade execution options
   * @returns Promise with operation result
   */
  async exportUsersByRole(
    roleName: string,
    options: Partial<UserExportConfig> = {},
    opts: FacadeOpts = {}
  ): Promise<Message> {
    return this.executeOperation(async () => {
      const allUsers = this.users();
      const roleUsers = allUsers.filter(
        (user) => user.role?.name?.toLowerCase() === roleName.toLowerCase()
      );
      const userIds = roleUsers.map((user) => user.id);

      if (userIds.length === 0) {
        throw new Error(`No users found with role: ${roleName}`);
      }

      return this.exportUsers(userIds, options, { ...opts, skipLoading: true });
    }, opts);
  }

  /**
   * Quick export to CSV format
   */
  async exportToCsv(userIds: number[], opts: FacadeOpts = {}): Promise<Message> {
    return this.exportUsers(userIds, { format: 'csv' }, opts);
  }

  /**
   * Quick export to JSON format
   */
  async exportToJson(userIds: number[], opts: FacadeOpts = {}): Promise<Message> {
    return this.exportUsers(userIds, { format: 'json' }, opts);
  }

  /**
   * Comprehensive PDF export with all fields
   */
  async exportComprehensivePdf(
    userIds: number[],
    customTitle?: string,
    opts: FacadeOpts = {}
  ): Promise<Message> {
    return this.exportUsers(
      userIds,
      {
        format: 'pdf',
        includeId: true,
        includeEmail: true,
        includeUsername: true,
        includeRole: true,
        includeStatus: true,
        includeLastActivity: true,
        includeCreatedAt: true,
        customTitle: customTitle || 'Comprehensive Users Report',
      },
      opts
    );
  }

  /**
   * Minimal CSV export with essential fields only
   */
  async exportMinimalCsv(userIds: number[], opts: FacadeOpts = {}): Promise<Message> {
    return this.exportUsers(
      userIds,
      {
        format: 'csv',
        includeId: false,
        includeEmail: true,
        includeUsername: false,
        includeRole: true,
        includeStatus: true,
        includeLastActivity: false,
        includeCreatedAt: false,
        customTitle: 'Essential Users Export',
      },
      opts
    );
  }
}
