import { TestBed } from '@angular/core/testing';
import { RoleApplicationMapper } from './role.mapper';
import { Role } from '@domain/entities/role.entity';

/**
 * Test suite for RoleApplicationMapper
 *
 * Tests the mapping functionality between Domain Role entities
 * and Application layer types following Clean Architecture principles.
 *
 * @layer Application
 * @since 1.0.0
 */
describe('RoleApplicationMapper', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(RoleApplicationMapper).toBeTruthy();
  });

  describe('toRoleSummary', () => {
    it('should map Domain Role entity to Application RoleSummary', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj('Role', ['canLeadProjects', 'isUniqueForTeam'], {
        id: 1,
        name: 'Administrator',
        accessLevel: 1,
        description: 'System administrator role',
        isActive: true,
        userCount: 5,
      });

      mockRole.canLeadProjects.and.returnValue(true);
      mockRole.isUniqueForTeam.and.returnValue(true);

      // Act
      const result = RoleApplicationMapper.toRoleSummary(mockRole);

      // Assert
      expect(result).toEqual({
        id: 1,
        name: 'Administrator',
        accessLevel: 1,
        description: 'System administrator role',
        canLeadProjects: true,
        isUniquePerTeam: true,
        isActive: true,
        userCount: 5,
      });

      expect(mockRole.canLeadProjects).toHaveBeenCalled();
      expect(mockRole.isUniqueForTeam).toHaveBeenCalled();
    });

    it('should map inactive role with zero user count', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj('Role', ['canLeadProjects', 'isUniqueForTeam'], {
        id: 2,
        name: 'Viewer',
        accessLevel: 8,
        description: 'Read-only access role',
        isActive: false,
        userCount: 0,
      });

      mockRole.canLeadProjects.and.returnValue(false);
      mockRole.isUniqueForTeam.and.returnValue(false);

      // Act
      const result = RoleApplicationMapper.toRoleSummary(mockRole);

      // Assert
      expect(result).toEqual({
        id: 2,
        name: 'Viewer',
        accessLevel: 8,
        description: 'Read-only access role',
        canLeadProjects: false,
        isUniquePerTeam: false,
        isActive: false,
        userCount: 0,
      });
    });

    it('should map role with high access level and many users', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj('Role', ['canLeadProjects', 'isUniqueForTeam'], {
        id: 3,
        name: 'Project Manager',
        accessLevel: 3,
        description: 'Manages project teams and resources',
        isActive: true,
        userCount: 25,
      });

      mockRole.canLeadProjects.and.returnValue(true);
      mockRole.isUniqueForTeam.and.returnValue(false);

      // Act
      const result = RoleApplicationMapper.toRoleSummary(mockRole);

      // Assert
      expect(result).toEqual({
        id: 3,
        name: 'Project Manager',
        accessLevel: 3,
        description: 'Manages project teams and resources',
        canLeadProjects: true,
        isUniquePerTeam: false,
        isActive: true,
        userCount: 25,
      });
    });
  });

  describe('toRoleSummaries', () => {
    it('should map array of Domain Role entities to Application RoleSummary array', () => {
      // Arrange
      const mockRole1 = jasmine.createSpyObj('Role', ['canLeadProjects', 'isUniqueForTeam'], {
        id: 1,
        name: 'Admin',
        accessLevel: 1,
        description: 'Administrator',
        isActive: true,
        userCount: 3,
      });
      mockRole1.canLeadProjects.and.returnValue(true);
      mockRole1.isUniqueForTeam.and.returnValue(true);

      const mockRole2 = jasmine.createSpyObj('Role', ['canLeadProjects', 'isUniqueForTeam'], {
        id: 2,
        name: 'User',
        accessLevel: 5,
        description: 'Regular user',
        isActive: true,
        userCount: 15,
      });
      mockRole2.canLeadProjects.and.returnValue(false);
      mockRole2.isUniqueForTeam.and.returnValue(false);

      const roles = [mockRole1, mockRole2];

      // Act
      const result = RoleApplicationMapper.toRoleSummaries(roles);

      // Assert
      expect(result).toEqual([
        {
          id: 1,
          name: 'Admin',
          accessLevel: 1,
          description: 'Administrator',
          canLeadProjects: true,
          isUniquePerTeam: true,
          isActive: true,
          userCount: 3,
        },
        {
          id: 2,
          name: 'User',
          accessLevel: 5,
          description: 'Regular user',
          canLeadProjects: false,
          isUniquePerTeam: false,
          isActive: true,
          userCount: 15,
        },
      ]);

      expect(mockRole1.canLeadProjects).toHaveBeenCalled();
      expect(mockRole1.isUniqueForTeam).toHaveBeenCalled();
      expect(mockRole2.canLeadProjects).toHaveBeenCalled();
      expect(mockRole2.isUniqueForTeam).toHaveBeenCalled();
    });

    it('should handle empty array', () => {
      // Arrange
      const roles: Role[] = [];

      // Act
      const result = RoleApplicationMapper.toRoleSummaries(roles);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle single role array', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj('Role', ['canLeadProjects', 'isUniqueForTeam'], {
        id: 1,
        name: 'Single Role',
        accessLevel: 4,
        description: 'Single test role',
        isActive: true,
        userCount: 1,
      });
      mockRole.canLeadProjects.and.returnValue(true);
      mockRole.isUniqueForTeam.and.returnValue(false);

      // Act
      const result = RoleApplicationMapper.toRoleSummaries([mockRole]);

      // Assert
      expect(result).toEqual([
        {
          id: 1,
          name: 'Single Role',
          accessLevel: 4,
          description: 'Single test role',
          canLeadProjects: true,
          isUniquePerTeam: false,
          isActive: true,
          userCount: 1,
        },
      ]);
    });
  });

  describe('toRoleDetail', () => {
    it('should map Domain Role entity to Application RoleDetail with permissions and metadata', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj(
        'Role',
        [
          'canLeadProjects',
          'isUniqueForTeam',
          'getPermissions',
          'canManageUsers',
          'canAccessAdmin',
        ],
        {
          id: 1,
          name: 'System Admin',
          accessLevel: 1,
          description: 'Full system access',
          isActive: true,
          userCount: 2,
        }
      );

      mockRole.canLeadProjects.and.returnValue(true);
      mockRole.isUniqueForTeam.and.returnValue(true);
      mockRole.getPermissions.and.returnValue([
        'SYSTEM_ADMIN',
        'USER_MANAGEMENT',
        'PROJECT_MANAGEMENT',
        'READ_ALL',
      ]);
      mockRole.canManageUsers.and.returnValue(true);
      mockRole.canAccessAdmin.and.returnValue(true);

      // Act
      const result = RoleApplicationMapper.toRoleDetail(mockRole);

      // Assert
      expect(result).toEqual({
        id: 1,
        name: 'System Admin',
        accessLevel: 1,
        description: 'Full system access',
        canLeadProjects: true,
        isUniquePerTeam: true,
        isActive: true,
        userCount: 2,
        permissions: ['SYSTEM_ADMIN', 'USER_MANAGEMENT', 'PROJECT_MANAGEMENT', 'READ_ALL'],
        metadata: {
          totalUsers: 2,
          canManageUsers: true,
          canAccessAdmin: true,
        },
      });

      expect(mockRole.canLeadProjects).toHaveBeenCalled();
      expect(mockRole.isUniqueForTeam).toHaveBeenCalled();
      expect(mockRole.getPermissions).toHaveBeenCalled();
      expect(mockRole.canManageUsers).toHaveBeenCalled();
      expect(mockRole.canAccessAdmin).toHaveBeenCalled();
    });

    it('should map role with limited permissions (access level 5)', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj(
        'Role',
        [
          'canLeadProjects',
          'isUniqueForTeam',
          'getPermissions',
          'canManageUsers',
          'canAccessAdmin',
        ],
        {
          id: 5,
          name: 'Basic User',
          accessLevel: 5,
          description: 'Basic user access',
          isActive: true,
          userCount: 10,
        }
      );

      mockRole.canLeadProjects.and.returnValue(false);
      mockRole.isUniqueForTeam.and.returnValue(false);
      mockRole.getPermissions.and.returnValue(['READ_ALL']);
      mockRole.canManageUsers.and.returnValue(false);
      mockRole.canAccessAdmin.and.returnValue(false);

      // Act
      const result = RoleApplicationMapper.toRoleDetail(mockRole);

      // Assert
      expect(result).toEqual({
        id: 5,
        name: 'Basic User',
        accessLevel: 5,
        description: 'Basic user access',
        canLeadProjects: false,
        isUniquePerTeam: false,
        isActive: true,
        userCount: 10,
        permissions: ['READ_ALL'],
        metadata: {
          totalUsers: 10,
          canManageUsers: false,
          canAccessAdmin: false,
        },
      });
    });

    it('should map inactive role with detailed information', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj(
        'Role',
        [
          'canLeadProjects',
          'isUniqueForTeam',
          'getPermissions',
          'canManageUsers',
          'canAccessAdmin',
        ],
        {
          id: 3,
          name: 'Inactive Role',
          accessLevel: 3,
          description: 'This role is currently inactive',
          isActive: false,
          userCount: 0,
        }
      );

      mockRole.canLeadProjects.and.returnValue(true);
      mockRole.isUniqueForTeam.and.returnValue(false);
      mockRole.getPermissions.and.returnValue(['PROJECT_MANAGEMENT', 'READ_ALL']);
      mockRole.canManageUsers.and.returnValue(false);
      mockRole.canAccessAdmin.and.returnValue(true);

      // Act
      const result = RoleApplicationMapper.toRoleDetail(mockRole);

      // Assert
      expect(result).toEqual({
        id: 3,
        name: 'Inactive Role',
        accessLevel: 3,
        description: 'This role is currently inactive',
        canLeadProjects: true,
        isUniquePerTeam: false,
        isActive: false,
        userCount: 0,
        permissions: ['PROJECT_MANAGEMENT', 'READ_ALL'],
        metadata: {
          totalUsers: 0,
          canManageUsers: false,
          canAccessAdmin: true,
        },
      });
    });
  });

  describe('Integration and Edge Cases', () => {
    it('should handle role with maximum access level (10)', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj(
        'Role',
        [
          'canLeadProjects',
          'isUniqueForTeam',
          'getPermissions',
          'canManageUsers',
          'canAccessAdmin',
        ],
        {
          id: 10,
          name: 'Max Level Role',
          accessLevel: 10,
          description: 'Maximum access level role',
          isActive: true,
          userCount: 100,
        }
      );

      mockRole.canLeadProjects.and.returnValue(false);
      mockRole.isUniqueForTeam.and.returnValue(false);
      mockRole.getPermissions.and.returnValue(['READ_ALL']);
      mockRole.canManageUsers.and.returnValue(false);
      mockRole.canAccessAdmin.and.returnValue(false);

      // Act
      const summary = RoleApplicationMapper.toRoleSummary(mockRole);
      const detail = RoleApplicationMapper.toRoleDetail(mockRole);

      // Assert
      expect(summary.accessLevel).toBe(10);
      expect(summary.canLeadProjects).toBe(false);
      expect(summary.isUniquePerTeam).toBe(false);

      expect(detail.permissions).toEqual(['READ_ALL']);
      expect(detail.metadata.canManageUsers).toBe(false);
      expect(detail.metadata.canAccessAdmin).toBe(false);
    });

    it('should handle role with minimum access level (1)', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj(
        'Role',
        [
          'canLeadProjects',
          'isUniqueForTeam',
          'getPermissions',
          'canManageUsers',
          'canAccessAdmin',
        ],
        {
          id: 1,
          name: 'Min Level Role',
          accessLevel: 1,
          description: 'Minimum access level role',
          isActive: true,
          userCount: 1,
        }
      );

      mockRole.canLeadProjects.and.returnValue(true);
      mockRole.isUniqueForTeam.and.returnValue(true);
      mockRole.getPermissions.and.returnValue([
        'SYSTEM_ADMIN',
        'USER_MANAGEMENT',
        'PROJECT_MANAGEMENT',
        'READ_ALL',
      ]);
      mockRole.canManageUsers.and.returnValue(true);
      mockRole.canAccessAdmin.and.returnValue(true);

      // Act
      const summary = RoleApplicationMapper.toRoleSummary(mockRole);
      const detail = RoleApplicationMapper.toRoleDetail(mockRole);

      // Assert
      expect(summary.accessLevel).toBe(1);
      expect(summary.canLeadProjects).toBe(true);
      expect(summary.isUniquePerTeam).toBe(true);

      expect(detail.permissions).toEqual([
        'SYSTEM_ADMIN',
        'USER_MANAGEMENT',
        'PROJECT_MANAGEMENT',
        'READ_ALL',
      ]);
      expect(detail.metadata.canManageUsers).toBe(true);
      expect(detail.metadata.canAccessAdmin).toBe(true);
    });

    it('should handle roles with various user counts', () => {
      // Arrange
      const testCases = [
        { userCount: 0, expected: 0 },
        { userCount: 1, expected: 1 },
        { userCount: 50, expected: 50 },
        { userCount: 1000, expected: 1000 },
      ];

      testCases.forEach(({ userCount, expected }) => {
        const mockRole = jasmine.createSpyObj('Role', ['canLeadProjects', 'isUniqueForTeam'], {
          id: 1,
          name: 'Test Role',
          accessLevel: 5,
          description: 'Test description',
          isActive: true,
          userCount,
        });

        mockRole.canLeadProjects.and.returnValue(false);
        mockRole.isUniqueForTeam.and.returnValue(false);

        // Act
        const result = RoleApplicationMapper.toRoleSummary(mockRole);

        // Assert
        expect(result.userCount).toBe(expected);
      });
    });
  });

  describe('Type Safety and Interface Compliance', () => {
    it('should return objects that conform to RoleSummary interface', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj('Role', ['canLeadProjects', 'isUniqueForTeam'], {
        id: 1,
        name: 'Test Role',
        accessLevel: 5,
        description: 'Test description',
        isActive: true,
        userCount: 10,
      });

      mockRole.canLeadProjects.and.returnValue(true);
      mockRole.isUniqueForTeam.and.returnValue(false);

      // Act
      const result = RoleApplicationMapper.toRoleSummary(mockRole);

      // Assert - Check all required properties exist and have correct types
      expect(typeof result.id).toBe('number');
      expect(typeof result.name).toBe('string');
      expect(typeof result.accessLevel).toBe('number');
      expect(typeof result.description).toBe('string');
      expect(typeof result.canLeadProjects).toBe('boolean');
      expect(typeof result.isUniquePerTeam).toBe('boolean');
      expect(typeof result.isActive).toBe('boolean');
      expect(typeof result.userCount).toBe('number');
    });

    it('should return objects that conform to RoleDetail interface', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj(
        'Role',
        [
          'canLeadProjects',
          'isUniqueForTeam',
          'getPermissions',
          'canManageUsers',
          'canAccessAdmin',
        ],
        {
          id: 1,
          name: 'Test Role',
          accessLevel: 5,
          description: 'Test description',
          isActive: true,
          userCount: 10,
        }
      );

      mockRole.canLeadProjects.and.returnValue(true);
      mockRole.isUniqueForTeam.and.returnValue(false);
      mockRole.getPermissions.and.returnValue(['READ_ALL']);
      mockRole.canManageUsers.and.returnValue(false);
      mockRole.canAccessAdmin.and.returnValue(false);

      // Act
      const result = RoleApplicationMapper.toRoleDetail(mockRole);

      // Assert - Check all required properties exist and have correct types
      expect(typeof result.id).toBe('number');
      expect(typeof result.name).toBe('string');
      expect(typeof result.accessLevel).toBe('number');
      expect(typeof result.description).toBe('string');
      expect(typeof result.canLeadProjects).toBe('boolean');
      expect(typeof result.isUniquePerTeam).toBe('boolean');
      expect(typeof result.isActive).toBe('boolean');
      expect(typeof result.userCount).toBe('number');

      // RoleDetail specific properties
      expect(Array.isArray(result.permissions)).toBe(true);
      expect(typeof result.metadata).toBe('object');
      expect(typeof result.metadata.totalUsers).toBe('number');
      expect(typeof result.metadata.canManageUsers).toBe('boolean');
      expect(typeof result.metadata.canAccessAdmin).toBe('boolean');
    });
  });
});
