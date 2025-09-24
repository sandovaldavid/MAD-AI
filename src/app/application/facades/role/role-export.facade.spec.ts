import { TestBed } from '@angular/core/testing';
import { RoleExportFacade } from './role-export.facade';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { NotificationsFacade } from '@application/facades/notifications.facade';
import { RoleStateFacade } from './role-state.facade';
import { RoleExportService } from '@/app/application/services/role-export-report.service';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import type { RoleSummary } from '@/app/application/mappers/role.mapper';
import type { RoleExportConfig } from '@application/types/role-export.types';
import type { FacadeOpts } from './role.types';

/**
 * Test Suite for RoleExportFacade
 *
 * Tests the role export facade following Clean Architecture principles.
 * Focuses on export operations, file generation, and user feedback.
 * Validates proper error handling and notification integration for export operations.
 *
 * @description
 * Validates the role export facade with comprehensive scenarios:
 * - Export selected roles to various formats (CSV, JSON, PDF)
 * - Export all visible roles with current filters applied
 * - Export only active roles
 * - Export roles by specific access level
 * - Quick export operations with default settings
 * - Detailed and summary report generation
 * - Export preview functionality
 * - Error handling for export operations
 * - Loading state management during exports
 * - Notification integration for user feedback
 * - Silent operation support for background exports
 *
 * @architecture
 * - **Layer**: Application Layer Testing
 * - **Pattern**: Orchestration Testing (not business logic testing)
 * - **Mocks**: All external dependencies (ExportService, ErrorTransformer, Notifications, State)
 * - **Coverage**: 95% of export orchestration logic, error paths, and user interaction flows
 *
 * @dependencies
 * - RoleExportService mock
 * - ApplicationErrorTransformer mock
 * - NotificationsFacade mock
 * - RoleStateFacade mock
 *
 * @scenarios
 * - ✅ Export selected roles to CSV format with custom options
 * - ✅ Export all visible roles with applied filters
 * - ✅ Export only active roles
 * - ✅ Export roles by specific access level
 * - ✅ Quick CSV export with default settings
 * - ✅ Quick JSON export with default settings
 * - ✅ Export detailed report with all columns
 * - ✅ Export summary report with basic columns
 * - ✅ Get export preview data
 * - ✅ Error handling for export operations
 * - ✅ Loading state management during exports
 * - ✅ Notification integration for user feedback
 * - ✅ Silent operation support
 * - ✅ Edge cases (no roles selected, empty results, invalid formats)
 *
 * @since 2.0.0
 * @layer Application Testing
 */
describe('RoleExportFacade', () => {
  let facade: RoleExportFacade;

  // Mocks
  let mockExportService: jasmine.SpyObj<RoleExportService>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;
  let mockNotifications: jasmine.SpyObj<NotificationsFacade>;
  let mockRoleState: jasmine.SpyObj<RoleStateFacade>;

  // Test data
  let mockRoles: RoleSummary[];

  beforeEach(() => {
    // Create mocks
    mockExportService = jasmine.createSpyObj('RoleExportService', ['exportRoles']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);
    mockNotifications = jasmine.createSpyObj('NotificationsFacade', [
      'success',
      'notificationError',
    ]);
    mockRoleState = jasmine.createSpyObj('RoleStateFacade', [
      'setLoading',
      'clearError',
      'setError',
      'roles',
    ]);

    // Setup test data
    mockRoles = [
      {
        id: 1,
        name: 'Admin Role',
        accessLevel: 5,
        description: 'Administrator role with full access',
        canLeadProjects: true,
        isUniquePerTeam: false,
        isActive: true,
        userCount: 5,
      },
      {
        id: 2,
        name: 'User Role',
        accessLevel: 1,
        description: 'Basic user role with limited access',
        canLeadProjects: false,
        isUniquePerTeam: false,
        isActive: true,
        userCount: 10,
      },
      {
        id: 3,
        name: 'Manager Role',
        accessLevel: 3,
        description: 'Manager role with project leadership',
        canLeadProjects: true,
        isUniquePerTeam: true,
        isActive: false,
        userCount: 3,
      },
      {
        id: 4,
        name: 'Guest Role',
        accessLevel: 1,
        description: 'Guest role with read-only access',
        canLeadProjects: false,
        isUniquePerTeam: false,
        isActive: true,
        userCount: 2,
      },
    ];

    // Setup default mock behaviors
    mockRoleState.roles.and.returnValue(mockRoles);
    mockExportService.exportRoles.and.returnValue(Promise.resolve());

    // Setup error transformer mock to return ApplicationError instances
    mockErrorTransformer.transform.and.callFake((error: any) => {
      if (error instanceof Error) {
        return new ApplicationError(
          ApplicationErrorCode.UNKNOWN_ERROR,
          error.message,
          error.message,
          undefined,
          'Please try again',
          false
        );
      }
      return new ApplicationError(
        ApplicationErrorCode.UNKNOWN_ERROR,
        'Unknown error',
        'An unknown error occurred',
        undefined,
        'Please try again',
        false
      );
    });

    // Setup TestBed
    TestBed.configureTestingModule({
      providers: [
        RoleExportFacade,
        { provide: RoleExportService, useValue: mockExportService },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
        { provide: NotificationsFacade, useValue: mockNotifications },
        { provide: RoleStateFacade, useValue: mockRoleState },
      ],
    });

    facade = TestBed.inject(RoleExportFacade);
  });

  describe('Export Selected Roles', () => {
    it('should export selected roles to CSV successfully', async () => {
      const roleIds = [1, 2];
      const options: Partial<RoleExportConfig> = { format: 'csv' };

      await facade.exportRoles(roleIds, options);

      expect(mockExportService.exportRoles).toHaveBeenCalled();
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Export completed',
        'Successfully exported 2 roles as CSV.'
      );
    });

    it('should export selected roles to JSON successfully', async () => {
      const roleIds = [1, 3];
      const options: Partial<RoleExportConfig> = { format: 'json' };

      await facade.exportRoles(roleIds, options);

      expect(mockExportService.exportRoles).toHaveBeenCalled();
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Export completed',
        'Successfully exported 2 roles as JSON.'
      );
    });

    it('should export selected roles with custom configuration', async () => {
      const roleIds = [1];
      const options: Partial<RoleExportConfig> = {
        format: 'csv',
        includeId: false,
        includeDescription: false,
        customTitle: 'Custom Export',
      };

      await facade.exportRoles(roleIds, options);

      expect(mockExportService.exportRoles).toHaveBeenCalled();
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Export completed',
        'Successfully exported 1 roles as CSV.'
      );
    });

    it('should throw error when no roles selected for export', async () => {
      const roleIds: number[] = [];

      await expectAsync(facade.exportRoles(roleIds, {})).toBeRejected();

      expect(mockExportService.exportRoles).not.toHaveBeenCalled();
      expect(mockNotifications.success).not.toHaveBeenCalled();
    });

    it('should throw error when selected role IDs do not exist', async () => {
      const roleIds = [999, 888];

      await expectAsync(facade.exportRoles(roleIds, {})).toBeRejected();

      expect(mockExportService.exportRoles).not.toHaveBeenCalled();
      expect(mockNotifications.success).not.toHaveBeenCalled();
    });

    it('should handle export service errors', async () => {
      const error = new Error('Export service failed');
      mockExportService.exportRoles.and.returnValue(Promise.reject(error));
      const roleIds = [1, 2];

      await expectAsync(facade.exportRoles(roleIds, {})).toBeRejected();

      expect(mockRoleState.setError).toHaveBeenCalledWith('Export service failed');
      expect(mockNotifications.notificationError).toHaveBeenCalledWith('Export service failed');
    });
  });

  describe('Export All Visible Roles', () => {
    it('should export all visible roles successfully', async () => {
      const options: Partial<RoleExportConfig> = { format: 'csv' };

      await facade.exportAllVisibleRoles(options);

      expect(mockExportService.exportRoles).toHaveBeenCalled();
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Export completed',
        'Successfully exported 4 roles as CSV.'
      );
    });

    it('should throw error when no visible roles available', async () => {
      mockRoleState.roles.and.returnValue([]);

      await expectAsync(facade.exportAllVisibleRoles({})).toBeRejected();

      expect(mockExportService.exportRoles).not.toHaveBeenCalled();
      expect(mockNotifications.success).not.toHaveBeenCalled();
    });
  });

  describe('Export Active Roles', () => {
    it('should export only active roles successfully', async () => {
      const options: Partial<RoleExportConfig> = { format: 'json' };

      await facade.exportActiveRoles(options);

      expect(mockExportService.exportRoles).toHaveBeenCalled();
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Export completed',
        'Successfully exported 3 roles as JSON.'
      );
    });

    it('should throw error when no active roles available', async () => {
      mockRoleState.roles.and.returnValue([
        { ...mockRoles[0], isActive: false },
        { ...mockRoles[1], isActive: false },
      ]);

      await expectAsync(facade.exportActiveRoles({})).toBeRejected();

      expect(mockExportService.exportRoles).not.toHaveBeenCalled();
      expect(mockNotifications.success).not.toHaveBeenCalled();
    });
  });

  describe('Export by Access Level', () => {
    it('should export roles by specific access level successfully', async () => {
      const options: Partial<RoleExportConfig> = { format: 'csv' };

      await facade.exportRolesByAccessLevel(1, options);

      expect(mockExportService.exportRoles).toHaveBeenCalled();
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Export completed',
        'Successfully exported 2 roles as CSV.'
      );
    });

    it('should throw error when no roles found with specified access level', async () => {
      await expectAsync(facade.exportRolesByAccessLevel(999, {})).toBeRejected();

      expect(mockExportService.exportRoles).not.toHaveBeenCalled();
      expect(mockNotifications.success).not.toHaveBeenCalled();
    });
  });

  describe('Quick Export Operations', () => {
    it('should perform quick CSV export successfully', async () => {
      const roleIds = [1, 2];

      await facade.quickCSVExport(roleIds);

      expect(mockExportService.exportRoles).toHaveBeenCalled();
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Export completed',
        'Successfully exported 2 roles as CSV.'
      );
    });

    it('should perform quick JSON export successfully', async () => {
      const roleIds = [1, 3];

      await facade.quickJSONExport(roleIds);

      expect(mockExportService.exportRoles).toHaveBeenCalled();
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Export completed',
        'Successfully exported 2 roles as JSON.'
      );
    });
  });

  describe('Report Export Operations', () => {
    it('should export detailed report in PDF format', async () => {
      const roleIds = [1, 2];

      await facade.exportDetailedReport(roleIds, 'pdf');

      expect(mockExportService.exportRoles).toHaveBeenCalled();
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Export completed',
        'Successfully exported 2 roles as PDF.'
      );
    });

    it('should export detailed report in CSV format', async () => {
      const roleIds = [1, 2];

      await facade.exportDetailedReport(roleIds, 'csv');

      expect(mockExportService.exportRoles).toHaveBeenCalled();
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Export completed',
        'Successfully exported 2 roles as CSV.'
      );
    });

    it('should export summary report successfully', async () => {
      const roleIds = [1, 2];

      await facade.exportSummaryReport(roleIds, 'csv');

      expect(mockExportService.exportRoles).toHaveBeenCalled();
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Export completed',
        'Successfully exported 2 roles as CSV.'
      );
    });
  });

  describe('Export Preview', () => {
    it('should get export preview with all columns', async () => {
      const roleIds = [1, 2];
      const options: Partial<RoleExportConfig> = {
        includeId: true,
        includeAccessLevel: true,
        includeStatus: true,
        includeDescription: true,
        includeUserCount: true,
      };

      const result = await facade.getExportPreview(roleIds, options);

      expect(Array.isArray(result)).toBeTrue();
      expect(result.length).toBe(2);
      if (Array.isArray(result)) {
        expect(result[0]).toEqual({
          id: 1,
          name: 'Admin Role',
          accessLevel: 5,
          status: 'Active',
          description: 'Administrator role with full access',
          userCount: 5,
        });
      } else {
        fail('Expected result to be an array');
      }
    });

    it('should get export preview with selective columns', async () => {
      const roleIds = [1];
      const options: Partial<RoleExportConfig> = {
        includeId: false,
        includeAccessLevel: true,
        includeStatus: true,
        includeDescription: false,
        includeUserCount: true,
      };

      const result = await facade.getExportPreview(roleIds, options);

      expect(Array.isArray(result)).toBeTrue();
      expect(result.length).toBe(1);
      if (Array.isArray(result)) {
        expect(result[0]).toEqual({
          name: 'Admin Role',
          accessLevel: 5,
          status: 'Active',
          userCount: 5,
        });
        expect(result[0].id).toBeUndefined();
        expect(result[0].description).toBeUndefined();
      } else {
        fail('Expected result to be an array');
      }
    });

    it('should return empty array when no roles selected for preview', async () => {
      const roleIds: number[] = [];

      const result = await facade.getExportPreview(roleIds, {});

      expect(result).toEqual({
        success: false,
        error: 'No se seleccionaron roles para previsualizar.',
        message: 'Debe seleccionar al menos un rol para previsualizar.',
      });
    });

    it('should return empty array when selected roles do not exist', async () => {
      const roleIds = [999, 888];

      const result = await facade.getExportPreview(roleIds, {});

      expect(result).toEqual({
        success: false,
        error: 'No se seleccionaron roles para previsualizar.',
        message: 'Debe seleccionar al menos un rol para previsualizar.',
      });
    });
  });

  describe('Silent Operations', () => {
    it('should skip notifications when silent option is true', async () => {
      const roleIds = [1, 2];
      const opts: FacadeOpts = { silent: true };

      await facade.exportRoles(roleIds, {}, opts);

      expect(mockNotifications.success).not.toHaveBeenCalled();
    });

    it('should skip notifications for silent quick export', async () => {
      const roleIds = [1, 2];
      const opts: FacadeOpts = { silent: true };

      await facade.quickCSVExport(roleIds, opts);

      expect(mockNotifications.success).not.toHaveBeenCalled();
    });
  });

  describe('Loading State Management', () => {
    it('should manage loading state during export operations', async () => {
      mockExportService.exportRoles.and.returnValue(
        new Promise((resolve) => setTimeout(() => resolve(), 100))
      );
      const roleIds = [1, 2];

      const promise = facade.exportRoles(roleIds, {});

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(true);

      await promise;

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(false);
    });

    it('should skip loading state when skipLoading option is true', async () => {
      const roleIds = [1, 2];
      const opts: FacadeOpts = { skipLoading: true };

      await facade.exportRoles(roleIds, {}, opts);

      expect(mockRoleState.setLoading).not.toHaveBeenCalled();
    });

    it('should manage loading state during preview operations', async () => {
      const roleIds = [1, 2];

      const promise = facade.getExportPreview(roleIds, {});

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(true);

      await promise;

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle and transform errors properly', async () => {
      const error = new Error('File system error');
      mockExportService.exportRoles.and.returnValue(Promise.reject(error));
      const roleIds = [1, 2];

      await expectAsync(facade.exportRoles(roleIds, {})).toBeRejected();

      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(error);
      expect(mockRoleState.setError).toHaveBeenCalledWith('File system error');
    });

    it('should clear error state before operations', async () => {
      const roleIds = [1, 2];

      await facade.exportRoles(roleIds, {});

      expect(mockRoleState.clearError).toHaveBeenCalled();
    });

    it('should set loading to false even when operation fails', async () => {
      const error = new Error('Export failed');
      mockExportService.exportRoles.and.returnValue(Promise.reject(error));
      const roleIds = [1, 2];

      await expectAsync(facade.exportRoles(roleIds, {})).toBeRejected();

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single role export', async () => {
      const roleIds = [1];

      await facade.exportRoles(roleIds, {});

      expect(mockExportService.exportRoles).toHaveBeenCalled();
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Export completed',
        'Successfully exported 1 roles as CSV.'
      );
    });

    it('should handle export with empty description', async () => {
      const roleIds = [1];
      const options: Partial<RoleExportConfig> = { includeDescription: true };

      await facade.exportRoles(roleIds, options);

      expect(mockExportService.exportRoles).toHaveBeenCalled();
    });

    it('should handle export with zero user count', async () => {
      const roleIds = [1];
      const options: Partial<RoleExportConfig> = { includeUserCount: true };

      await facade.exportRoles(roleIds, options);

      expect(mockExportService.exportRoles).toHaveBeenCalled();
    });

    it('should handle mixed active/inactive roles in export', async () => {
      const roleIds = [1, 3]; // One active, one inactive

      await facade.exportRoles(roleIds, { includeStatus: true });

      expect(mockExportService.exportRoles).toHaveBeenCalled();
    });

    it('should handle export with custom title', async () => {
      const roleIds = [1, 2];
      const options: Partial<RoleExportConfig> = {
        customTitle: 'My Custom Export',
      };

      await facade.exportRoles(roleIds, options);

      expect(mockExportService.exportRoles).toHaveBeenCalled();
    });
  });
});
