import { TestBed } from '@angular/core/testing';
import { RoleExportService } from './role-export-report.service';
import type { ExportRepository } from '@domain/repositories/system/export.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import { EXPORT_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { Role } from '@domain/entities/role.entity';
import type { RoleExportData, RoleExportConfig } from '@application/types/role-export.types';

/**
 * Test Suite for RoleExportService
 *
 * @description Comprehensive tests for Application Layer role export orchestration service.
 * Validates data transformation, export coordination, error handling, and infrastructure integration.
 *
 * @coverage Target: 95% for Application Layer orchestration services
 * @layer Application
 */
describe('RoleExportService', () => {
  let service: RoleExportService;
  let mockExportRepository: jasmine.SpyObj<ExportRepository>;
  let mockLogger: jasmine.SpyObj<Logger>;

  // Test data setup
  let mockRoles: Role[];
  let mockRoleExportData: RoleExportData[];

  beforeEach(() => {
    // Create mocks
    mockExportRepository = jasmine.createSpyObj('ExportRepository', [
      'exportToPdf',
      'exportToCsv',
      'exportToJson',
    ]);

    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error', 'warn', 'debug']);

    // Setup test data
    setupTestData();

    TestBed.configureTestingModule({
      providers: [
        RoleExportService,
        { provide: EXPORT_PORT, useValue: mockExportRepository },
        { provide: LOGGER_PORT, useValue: mockLogger },
      ],
    });

    service = TestBed.inject(RoleExportService);
  });

  /**
   * Setup test data for all test scenarios
   */
  function setupTestData(): void {
    // Create mock Role entities using factory method
    mockRoles = [
      Role.create({
        id: 1,
        name: 'Administrator',
        accessLevel: 1,
        isActive: true,
        description: 'Full system access',
        userCount: 5,
      }),
      Role.create({
        id: 2,
        name: 'Manager',
        accessLevel: 3,
        isActive: true,
        description: 'Project management access',
        userCount: 12,
      }),
      Role.create({
        id: 3,
        name: 'User',
        accessLevel: 5,
        isActive: false,
        description: null,
        userCount: 25,
      }),
    ];

    // Expected export data after transformation
    mockRoleExportData = [
      {
        id: '1',
        name: 'Administrator',
        accessLevel: 'Level 1',
        status: 'Active',
        description: 'Full system access',
        userCount: 5,
      },
      {
        id: '2',
        name: 'Manager',
        accessLevel: 'Level 3',
        status: 'Active',
        description: 'Project management access',
        userCount: 12,
      },
      {
        id: '3',
        name: 'User',
        accessLevel: 'Level 5',
        status: 'Inactive',
        description: 'N/A',
        userCount: 25,
      },
    ];
  }

  describe('Service Initialization', () => {
    it('should be created successfully', () => {
      expect(service).toBeTruthy();
    });

    it('should inject dependencies correctly', () => {
      expect(service).toBeDefined();
      // Dependencies are injected via Angular DI, validated by successful creation
    });
  });

  describe('Data Transformation', () => {
    it('should transform Role entities to RoleExportData correctly', async () => {
      // Setup mocks for successful export
      mockExportRepository.exportToPdf.and.resolveTo();

      // Execute export
      await service.exportRoles(mockRoles);

      // Verify transformation by checking what was passed to export
      expect(mockExportRepository.exportToPdf).toHaveBeenCalledWith(
        jasmine.arrayContaining([
          jasmine.objectContaining({
            id: '1',
            name: 'Administrator',
            accessLevel: 'Level 1',
            status: 'Active',
            description: 'Full system access',
            userCount: 5,
          }),
        ]),
        jasmine.any(Object)
      );
    });

    it('should handle roles without description correctly', async () => {
      const rolesWithoutDescription = [
        Role.create({
          id: 4,
          name: 'Basic User',
          accessLevel: 5,
          isActive: true,
          description: null,
          userCount: 10,
        }),
      ];

      mockExportRepository.exportToPdf.and.resolveTo();

      await service.exportRoles(rolesWithoutDescription);

      expect(mockExportRepository.exportToPdf).toHaveBeenCalledWith(
        jasmine.arrayContaining([
          jasmine.objectContaining({
            description: 'No hay descripción para este rol',
          }),
        ]),
        jasmine.any(Object)
      );
    });
  });

  describe('Export Formats', () => {
    beforeEach(() => {
      mockExportRepository.exportToPdf.and.resolveTo();
      mockExportRepository.exportToCsv.and.resolveTo();
      mockExportRepository.exportToJson.and.resolveTo();
    });

    it('should export to PDF format by default', async () => {
      await service.exportRoles(mockRoles);

      expect(mockExportRepository.exportToPdf).toHaveBeenCalled();
      expect(mockExportRepository.exportToCsv).not.toHaveBeenCalled();
      expect(mockExportRepository.exportToJson).not.toHaveBeenCalled();
    });

    it('should export to CSV format when specified', async () => {
      const config: RoleExportConfig = { format: 'csv' };

      await service.exportRoles(mockRoles, config);

      expect(mockExportRepository.exportToCsv).toHaveBeenCalled();
      expect(mockExportRepository.exportToPdf).not.toHaveBeenCalled();
      expect(mockExportRepository.exportToJson).not.toHaveBeenCalled();
    });

    it('should export to JSON format when specified', async () => {
      const config: RoleExportConfig = { format: 'json' };

      await service.exportRoles(mockRoles, config);

      expect(mockExportRepository.exportToJson).toHaveBeenCalled();
      expect(mockExportRepository.exportToPdf).not.toHaveBeenCalled();
      expect(mockExportRepository.exportToCsv).not.toHaveBeenCalled();
    });
  });

  describe('Configuration Options', () => {
    beforeEach(() => {
      mockExportRepository.exportToPdf.and.resolveTo();
    });

    it('should include all fields by default', async () => {
      await service.exportRoles(mockRoles);

      const callArgs = mockExportRepository.exportToPdf.calls.mostRecent().args;
      const exportData = callArgs[0] as RoleExportData[];

      expect(exportData[0]).toEqual(
        jasmine.objectContaining({
          id: '1',
          name: 'Administrator',
          accessLevel: 'Level 1',
          status: 'Active',
          description: 'Full system access',
          userCount: 5,
        })
      );
    });

    it('should exclude ID when includeId is false', async () => {
      const config: RoleExportConfig = { includeId: false };

      await service.exportRoles(mockRoles, config);

      const callArgs = mockExportRepository.exportToPdf.calls.mostRecent().args;
      const exportData = callArgs[0] as RoleExportData[];

      expect(exportData[0].id).toBeUndefined();
    });

    it('should exclude access level when includeAccessLevel is false', async () => {
      const config: RoleExportConfig = { includeAccessLevel: false };

      await service.exportRoles(mockRoles, config);

      const callArgs = mockExportRepository.exportToPdf.calls.mostRecent().args;
      const exportData = callArgs[0] as RoleExportData[];

      expect(exportData[0].accessLevel).toBeUndefined();
    });

    it('should use custom title when provided', async () => {
      const customTitle = 'Custom Roles Report';
      const config: RoleExportConfig = { customTitle };

      await service.exportRoles(mockRoles, config);

      const callArgs = mockExportRepository.exportToPdf.calls.mostRecent().args;
      const pdfConfig = callArgs[1];

      expect(pdfConfig.title).toContain(customTitle);
    });
  });

  describe('Input Validation', () => {
    it('should throw ApplicationError for empty roles array', async () => {
      await expectAsync(service.exportRoles([])).toBeRejectedWith(jasmine.any(ApplicationError));

      await expectAsync(service.exportRoles([])).toBeRejectedWith(
        jasmine.stringMatching('No roles provided for export')
      );
    });

    it('should throw ApplicationError for null roles', async () => {
      await expectAsync(service.exportRoles(null as any)).toBeRejectedWith(
        jasmine.any(ApplicationError)
      );
    });

    it('should throw ApplicationError for undefined roles', async () => {
      await expectAsync(service.exportRoles(undefined as any)).toBeRejectedWith(
        jasmine.any(ApplicationError)
      );
    });

    it('should throw ApplicationError for unsupported format', async () => {
      const config: RoleExportConfig = { format: 'xml' as any };

      await expectAsync(service.exportRoles(mockRoles, config)).toBeRejectedWith(
        jasmine.any(ApplicationError)
      );

      await expectAsync(service.exportRoles(mockRoles, config)).toBeRejectedWith(
        jasmine.stringMatching('Unsupported export format')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle export repository errors gracefully', async () => {
      const exportError = new Error('Export service unavailable');
      mockExportRepository.exportToPdf.and.rejectWith(exportError);

      await expectAsync(service.exportRoles(mockRoles)).toBeRejectedWith(
        jasmine.any(ApplicationError)
      );

      await expectAsync(service.exportRoles(mockRoles)).toBeRejectedWith(
        jasmine.stringMatching('export')
      );
    });

    it('should re-throw ApplicationError as-is', async () => {
      const appError = ApplicationError.invalidInput('Test error');
      mockExportRepository.exportToPdf.and.rejectWith(appError);

      await expectAsync(service.exportRoles(mockRoles)).toBeRejectedWith(appError);
    });

    it('should log errors appropriately', async () => {
      const exportError = new Error('Export failed');
      mockExportRepository.exportToPdf.and.rejectWith(exportError);

      try {
        await service.exportRoles(mockRoles);
      } catch (error) {
        // Expected to throw
      }

      expect(mockLogger.error).toHaveBeenCalledWith('Role export failed', jasmine.any(Object));
    });
  });

  describe('Logging', () => {
    beforeEach(() => {
      mockExportRepository.exportToPdf.and.resolveTo();
    });

    it('should log export start', async () => {
      await service.exportRoles(mockRoles);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting role export',
        jasmine.objectContaining({
          operation: 'role_export',
          correlationId: jasmine.stringMatching(/^export-\d+$/),
        })
      );
    });

    it('should log successful export completion', async () => {
      await service.exportRoles(mockRoles);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Role export completed successfully',
        jasmine.objectContaining({
          operation: 'role_export',
          correlationId: jasmine.stringMatching(/^export-\d+$/),
        })
      );
    });

    it('should log data preparation', async () => {
      await service.exportRoles(mockRoles);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Role data prepared for export',
        jasmine.objectContaining({
          operation: 'role_export',
          correlationId: jasmine.stringMatching(/^export-\d+$/),
        })
      );
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete export workflow with all options', async () => {
      const config: RoleExportConfig = {
        includeId: true,
        includeAccessLevel: true,
        includeStatus: true,
        includeDescription: true,
        includeUserCount: true,
        customTitle: 'Complete Roles Export',
        format: 'pdf',
      };

      mockExportRepository.exportToPdf.and.resolveTo();

      await service.exportRoles(mockRoles, config);

      expect(mockExportRepository.exportToPdf).toHaveBeenCalledWith(
        jasmine.arrayContaining([
          jasmine.objectContaining({
            id: '1',
            name: 'Administrator',
            accessLevel: 'Level 1',
            status: 'Active',
            description: 'Full system access',
            userCount: 5,
          }),
        ]),
        jasmine.objectContaining({
          title: jasmine.stringMatching(/^Complete Roles Export/),
          filename: jasmine.stringMatching(/^roles-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.pdf$/),
          columns: jasmine.arrayContaining([
            jasmine.objectContaining({ header: 'ID', dataKey: 'id' }),
            jasmine.objectContaining({ header: 'Nombre', dataKey: 'name' }),
            jasmine.objectContaining({ header: 'Nivel de Acceso', dataKey: 'accessLevel' }),
            jasmine.objectContaining({ header: 'Estado', dataKey: 'status' }),
            jasmine.objectContaining({ header: 'Descripción', dataKey: 'description' }),
            jasmine.objectContaining({ header: 'Usuarios', dataKey: 'userCount' }),
          ]),
        })
      );
    });

    it('should handle minimal configuration export', async () => {
      const config: RoleExportConfig = {
        includeId: false,
        includeAccessLevel: false,
        includeStatus: false,
        includeDescription: false,
        includeUserCount: false,
        format: 'json',
      };

      mockExportRepository.exportToJson.and.resolveTo();

      await service.exportRoles(mockRoles, config);

      expect(mockExportRepository.exportToJson).toHaveBeenCalledWith(
        jasmine.arrayContaining([
          jasmine.objectContaining({
            name: 'Administrator',
            // Other fields should be undefined
          }),
        ]),
        jasmine.objectContaining({
          filename: jasmine.stringMatching(/^roles-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json$/),
          prettify: true,
        })
      );
    });
  });
});
