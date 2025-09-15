import { TestBed } from '@angular/core/testing';
import { RoleExportApplicationMapper } from './role-export.mapper';
import { Role } from '@domain/entities/role.entity';
import { ExportFormat } from '@domain/value-objects';
import type { RoleExportOptions } from './role-export.mapper';

describe('RoleExportApplicationMapper', () => {
  let mockRole: jasmine.SpyObj<Role>;
  let mockExportFormat: jasmine.SpyObj<ExportFormat>;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    // Create mock Role entity
    mockRole = jasmine.createSpyObj('Role', ['canLeadProjects', 'isUniqueForTeam'], {
      id: 1,
      name: 'Admin',
      accessLevel: 100,
      description: 'Administrator role',
      isActive: true,
      userCount: 5,
    });

    // Create mock ExportFormat value object
    mockExportFormat = jasmine.createSpyObj('ExportFormat', ['isSupported'], {
      value: 'csv',
    });
  });

  it('should be created', () => {
    expect(RoleExportApplicationMapper).toBeTruthy();
  });

  describe('toExportFormat', () => {
    it('should map Role entity to RoleExportData', () => {
      // Arrange
      mockRole.canLeadProjects.and.returnValue(true);
      mockRole.isUniqueForTeam.and.returnValue(false);

      // Act
      const result = RoleExportApplicationMapper.toExportFormat(mockRole);

      // Assert
      expect(result).toEqual({
        id: 1,
        name: 'Admin',
        accessLevel: 100,
        description: 'Administrator role',
        canLeadProjects: true,
        isUniquePerTeam: false,
        isActive: true,
        userCount: 5,
      });

      expect(mockRole.canLeadProjects).toHaveBeenCalled();
      expect(mockRole.isUniqueForTeam).toHaveBeenCalled();
    });

    it('should handle role with different property values', () => {
      // Arrange
      const differentRole = jasmine.createSpyObj('Role', ['canLeadProjects', 'isUniqueForTeam'], {
        id: 2,
        name: 'User',
        accessLevel: 10,
        description: 'Basic user role',
        isActive: false,
        userCount: 0,
      });
      differentRole.canLeadProjects.and.returnValue(false);
      differentRole.isUniqueForTeam.and.returnValue(true);

      // Act
      const result = RoleExportApplicationMapper.toExportFormat(differentRole);

      // Assert
      expect(result).toEqual({
        id: 2,
        name: 'User',
        accessLevel: 10,
        description: 'Basic user role',
        canLeadProjects: false,
        isUniquePerTeam: true,
        isActive: false,
        userCount: 0,
      });
    });

    it('should call role methods to get computed properties', () => {
      // Arrange
      mockRole.canLeadProjects.and.returnValue(true);
      mockRole.isUniqueForTeam.and.returnValue(false);

      // Act
      RoleExportApplicationMapper.toExportFormat(mockRole);

      // Assert
      expect(mockRole.canLeadProjects).toHaveBeenCalledTimes(1);
      expect(mockRole.isUniqueForTeam).toHaveBeenCalledTimes(1);
    });
  });

  describe('toExportFormats', () => {
    it('should map array of Role entities to RoleExportData array', () => {
      // Arrange
      const role1 = jasmine.createSpyObj('Role', ['canLeadProjects', 'isUniqueForTeam'], {
        id: 1,
        name: 'Admin',
        accessLevel: 100,
        description: 'Administrator',
        isActive: true,
        userCount: 3,
      });
      role1.canLeadProjects.and.returnValue(true);
      role1.isUniqueForTeam.and.returnValue(false);

      const role2 = jasmine.createSpyObj('Role', ['canLeadProjects', 'isUniqueForTeam'], {
        id: 2,
        name: 'User',
        accessLevel: 10,
        description: 'Basic user',
        isActive: true,
        userCount: 10,
      });
      role2.canLeadProjects.and.returnValue(false);
      role2.isUniqueForTeam.and.returnValue(true);

      const roles = [role1, role2];

      // Act
      const result = RoleExportApplicationMapper.toExportFormats(roles);

      // Assert
      expect(result).toEqual([
        {
          id: 1,
          name: 'Admin',
          accessLevel: 100,
          description: 'Administrator',
          canLeadProjects: true,
          isUniquePerTeam: false,
          isActive: true,
          userCount: 3,
        },
        {
          id: 2,
          name: 'User',
          accessLevel: 10,
          description: 'Basic user',
          canLeadProjects: false,
          isUniquePerTeam: true,
          isActive: true,
          userCount: 10,
        },
      ]);
    });

    it('should handle empty array', () => {
      // Arrange
      const roles: Role[] = [];

      // Act
      const result = RoleExportApplicationMapper.toExportFormats(roles);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle single role array', () => {
      // Arrange
      mockRole.canLeadProjects.and.returnValue(true);
      mockRole.isUniqueForTeam.and.returnValue(false);
      const roles = [mockRole];

      // Act
      const result = RoleExportApplicationMapper.toExportFormats(roles);

      // Assert
      expect(result).toHaveSize(1);
      expect(result[0]).toEqual({
        id: 1,
        name: 'Admin',
        accessLevel: 100,
        description: 'Administrator role',
        canLeadProjects: true,
        isUniquePerTeam: false,
        isActive: true,
        userCount: 5,
      });
    });
  });

  describe('createExportOptions', () => {
    let mockDefaultFormat: jasmine.SpyObj<ExportFormat>;
    let mockCustomFormat: jasmine.SpyObj<ExportFormat>;

    beforeEach(() => {
      mockDefaultFormat = jasmine.createSpyObj('ExportFormat', ['isSupported'], {
        value: 'json',
      });

      mockCustomFormat = jasmine.createSpyObj('ExportFormat', ['isSupported'], {
        value: 'pdf',
      });
    });

    it('should create export options with default values when no options provided', () => {
      // Arrange
      const defaultFormatSpy = spyOn(ExportFormat, 'default').and.returnValue(mockDefaultFormat);

      // Act
      const result = RoleExportApplicationMapper.createExportOptions();

      // Assert
      expect(result).toEqual({
        format: 'json',
        includeUsers: false,
        includePermissions: true,
        dateRange: undefined,
      });
      expect(defaultFormatSpy).toHaveBeenCalled();
    });

    it('should create export options with custom format', () => {
      // Arrange
      const options = { format: 'pdf' as const };
      const createFormatSpy = spyOn(ExportFormat, 'create').and.returnValue(mockCustomFormat);

      // Act
      const result = RoleExportApplicationMapper.createExportOptions(options);

      // Assert
      expect(result).toEqual({
        format: 'pdf',
        includeUsers: false,
        includePermissions: true,
        dateRange: undefined,
      });
      expect(createFormatSpy).toHaveBeenCalledWith('pdf');
    });

    it('should create export options with custom boolean options', () => {
      // Arrange
      const options = {
        includeUsers: true,
        includePermissions: false,
      };
      const defaultFormatSpy = spyOn(ExportFormat, 'default').and.returnValue(mockDefaultFormat);

      // Act
      const result = RoleExportApplicationMapper.createExportOptions(options);

      // Assert
      expect(result).toEqual({
        format: 'json',
        includeUsers: true,
        includePermissions: false,
        dateRange: undefined,
      });
    });

    it('should create export options with date range', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const options = {
        dateRange: {
          start: startDate,
          end: endDate,
        },
      };
      const defaultFormatSpy = spyOn(ExportFormat, 'default').and.returnValue(mockDefaultFormat);

      // Act
      const result = RoleExportApplicationMapper.createExportOptions(options);

      // Assert
      expect(result).toEqual({
        format: 'json',
        includeUsers: false,
        includePermissions: true,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      });
    });

    it('should handle all custom options together', () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const options = {
        format: 'pdf' as const,
        includeUsers: true,
        includePermissions: false,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      };

      // Mock the create method to return a proper ExportFormat object
      const pdfFormatMock = jasmine.createSpyObj('ExportFormat', ['isSupported'], {
        value: 'pdf',
      });
      const createFormatSpy = spyOn(ExportFormat, 'create').and.returnValue(pdfFormatMock);

      // Act
      const result = RoleExportApplicationMapper.createExportOptions(options);

      // Assert
      expect(result).toEqual({
        format: 'pdf',
        includeUsers: true,
        includePermissions: false,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      });
      expect(createFormatSpy).toHaveBeenCalledWith('pdf');
    });
  });

  describe('validateExportOptions', () => {
    it('should validate export options using Domain validation', () => {
      // Arrange
      const options: RoleExportOptions = {
        format: 'csv',
        includeUsers: false,
        includePermissions: true,
      };

      const isSupportedSpy = spyOn(ExportFormat, 'isSupported').and.returnValue(true);

      // Act
      const result = RoleExportApplicationMapper.validateExportOptions(options);

      // Assert
      expect(result).toBe(true);
      expect(isSupportedSpy).toHaveBeenCalledWith('csv');
    });

    it('should return false for unsupported format', () => {
      // Arrange
      const options: RoleExportOptions = {
        format: 'xml' as any, // Invalid format
        includeUsers: false,
        includePermissions: true,
      };

      const isSupportedSpy = spyOn(ExportFormat, 'isSupported').and.returnValue(false);

      // Act
      const result = RoleExportApplicationMapper.validateExportOptions(options);

      // Assert
      expect(result).toBe(false);
      expect(isSupportedSpy).toHaveBeenCalledWith('xml');
    });

    it('should validate csv format', () => {
      // Arrange
      const options: RoleExportOptions = {
        format: 'csv',
        includeUsers: false,
        includePermissions: true,
      };

      const isSupportedSpy = spyOn(ExportFormat, 'isSupported').and.returnValue(true);

      // Act
      const result = RoleExportApplicationMapper.validateExportOptions(options);

      // Assert
      expect(result).toBe(true);
      expect(isSupportedSpy).toHaveBeenCalledWith('csv');
    });

    it('should validate pdf format', () => {
      // Arrange
      const options: RoleExportOptions = {
        format: 'pdf',
        includeUsers: false,
        includePermissions: true,
      };

      const isSupportedSpy = spyOn(ExportFormat, 'isSupported').and.returnValue(true);

      // Act
      const result = RoleExportApplicationMapper.validateExportOptions(options);

      // Assert
      expect(result).toBe(true);
      expect(isSupportedSpy).toHaveBeenCalledWith('pdf');
    });

    it('should validate json format', () => {
      // Arrange
      const options: RoleExportOptions = {
        format: 'json',
        includeUsers: false,
        includePermissions: true,
      };

      const isSupportedSpy = spyOn(ExportFormat, 'isSupported').and.returnValue(true);

      // Act
      const result = RoleExportApplicationMapper.validateExportOptions(options);

      // Assert
      expect(result).toBe(true);
      expect(isSupportedSpy).toHaveBeenCalledWith('json');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete export workflow from roles to validated options', () => {
      // Arrange
      const roles = [mockRole];
      mockRole.canLeadProjects.and.returnValue(true);
      mockRole.isUniqueForTeam.and.returnValue(false);

      const exportOptions = {
        format: 'pdf' as const,
        includeUsers: true,
        includePermissions: false,
      };

      spyOn(ExportFormat, 'isSupported').and.returnValue(true);
      spyOn(ExportFormat, 'default').and.returnValue(mockExportFormat);
      spyOn(ExportFormat, 'create').and.returnValue(mockExportFormat);

      // Act
      const exportData = RoleExportApplicationMapper.toExportFormats(roles);
      const validatedOptions = RoleExportApplicationMapper.createExportOptions(exportOptions);
      const isValid = RoleExportApplicationMapper.validateExportOptions(validatedOptions);

      // Assert
      expect(exportData).toHaveSize(1);
      expect(validatedOptions.format).toBe('csv'); // Mock returns csv
      expect(isValid).toBe(true);
    });

    it('should handle edge case with inactive role', () => {
      // Arrange
      const inactiveRole = jasmine.createSpyObj('Role', ['canLeadProjects', 'isUniqueForTeam'], {
        id: 3,
        name: 'Inactive Role',
        accessLevel: 0,
        description: 'This role is inactive',
        isActive: false,
        userCount: 0,
      });
      inactiveRole.canLeadProjects.and.returnValue(false);
      inactiveRole.isUniqueForTeam.and.returnValue(false);

      // Act
      const result = RoleExportApplicationMapper.toExportFormat(inactiveRole);

      // Assert
      expect(result).toEqual({
        id: 3,
        name: 'Inactive Role',
        accessLevel: 0,
        description: 'This role is inactive',
        canLeadProjects: false,
        isUniquePerTeam: false,
        isActive: false,
        userCount: 0,
      });
    });
  });
});
