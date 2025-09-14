import { Role } from './role.entity';
import { ValidationError } from '@domain/errors/validation-error.entity';

/**
 * Role Entity - Simplified Domain Tests
 *
 * Tests for Role entity focusing on essential business logic.
 * Removed over-engineering tests for domain events and complex specifications.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
describe('Role Entity - Domain Tests', () => {
  let validRole: Role;
  let deactivatedRole: Role;

  beforeEach(() => {
    validRole = Role.create({
      id: 1,
      name: 'DEVELOPER',
      accessLevel: 3,
      isActive: true,
      description: 'Developer role',
      userCount: 5,
    });

    deactivatedRole = Role.create({
      id: 2,
      name: 'TESTER',
      accessLevel: 2,
      isActive: false,
      description: 'Tester role',
      userCount: 3,
    });
  });

  describe('Role Creation and Validation', () => {
    describe('Valid Role Creation', () => {
      it('should create role with all valid properties', () => {
        const role = Role.create({
          id: 1,
          name: 'MANAGER',
          accessLevel: 4,
          isActive: true,
          description: 'Manager role',
          userCount: 10,
        });

        expect(role.id).toBe(1);
        expect(role.name).toBe('MANAGER');
        expect(role.accessLevel).toBe(4);
        expect(role.isActive).toBe(true);
        expect(role.description).toBe('Manager role');
        expect(role.userCount).toBe(10);
      });

      it('should create role with minimum required properties', () => {
        const role = Role.create({
          id: 1,
          name: 'USER',
        });

        expect(role.id).toBe(1);
        expect(role.name).toBe('USER');
        expect(role.accessLevel).toBe(5); // default
        expect(role.isActive).toBe(false); // default
        expect(role.description).toBe('No hay descripción para este rol');
        expect(role.userCount).toBe(0);
      });

      it('should handle null description correctly', () => {
        const role = Role.create({
          id: 1,
          name: 'USER',
          description: null,
        });

        expect(role.description).toBe('No hay descripción para este rol');
      });
    });

    describe('ID Validation', () => {
      it('should reject non-integer id', () => {
        expect(() => {
          Role.create({
            id: 1.5,
            name: 'USER',
          });
        }).toThrow();
      });

      it('should reject negative id', () => {
        expect(() => {
          Role.create({
            id: -1,
            name: 'USER',
          });
        }).toThrow();
      });

      it('should reject zero id', () => {
        expect(() => {
          Role.create({
            id: 0,
            name: 'USER',
          });
        }).toThrow();
      });

      it('should reject id exceeding MAX_SAFE_INTEGER', () => {
        expect(() => {
          Role.create({
            id: Number.MAX_SAFE_INTEGER + 1,
            name: 'USER',
          });
        }).toThrow();
      });

      it('should reject non-number id type', () => {
        expect(() => {
          Role.create({
            id: '1' as any,
            name: 'USER',
          });
        }).toThrow();
      });

      it('should reject null id', () => {
        expect(() => {
          Role.create({
            id: null as any,
            name: 'USER',
          });
        }).toThrow();
      });

      it('should reject undefined id', () => {
        expect(() => {
          Role.create({
            id: undefined as any,
            name: 'USER',
          });
        }).toThrow();
      });

      it('should reject NaN id', () => {
        expect(() => {
          Role.create({
            id: NaN,
            name: 'USER',
          });
        }).toThrow();
      });

      it('should reject Infinity id', () => {
        expect(() => {
          Role.create({
            id: Infinity,
            name: 'USER',
          });
        }).toThrow();
      });

      it('should accept valid positive integer id', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: 'USER',
          });
        }).not.toThrow();
      });

      it('should accept MAX_SAFE_INTEGER id', () => {
        expect(() => {
          Role.create({
            id: Number.MAX_SAFE_INTEGER,
            name: 'USER',
          });
        }).not.toThrow();
      });
    });

    describe('Name Validation', () => {
      it('should reject empty role name', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: '',
          });
        }).toThrow();
      });

      it('should reject role name that is too long', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: 'A'.repeat(51), // Over 50 characters
          });
        }).toThrow();
      });

      it('should map field name correctly in validation errors', () => {
        try {
          Role.create({
            id: 1,
            name: '', // Empty name
          });
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          const validationError = error as ValidationError;
          expect(validationError.errors[0].field).toBe('name');
        }
      });

      it('should reject null name', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: null as any,
          });
        }).toThrow();
      });

      it('should reject undefined name', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: undefined as any,
          });
        }).toThrow();
      });

      it('should reject non-string name type', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: 123 as any,
          });
        }).toThrow();
      });

      it('should reject whitespace-only name', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: '   ',
          });
        }).toThrow();
      });

      it('should reject tab-only name', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: '\t\t\t',
          });
        }).toThrow();
      });

      it('should reject newline-only name', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: '\n\n',
          });
        }).toThrow();
      });

      it('should trim whitespace from valid name', () => {
        const role = Role.create({
          id: 1,
          name: '  TRIMMED  ',
        });

        expect(role.name).toBe('TRIMMED');
      });

      it('should accept name at 50 character limit', () => {
        const maxLengthName = 'A'.repeat(50);

        expect(() => {
          Role.create({
            id: 1,
            name: maxLengthName,
          });
        }).not.toThrow();

        const role = Role.create({
          id: 1,
          name: maxLengthName,
        });

        expect(role.name).toBe(maxLengthName);
      });

      it('should reject name with 51 characters', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: 'A'.repeat(51),
          });
        }).toThrow();
      });

      it('should handle name with special characters', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: 'USER_ROLE-2024!',
          });
        }).not.toThrow();
      });

      it('should handle name with unicode characters', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: 'РОЛЬ_ПОЛЬЗОВАТЕЛЯ',
          });
        }).not.toThrow();
      });
    });

    describe('Access Level Validation', () => {
      it('should reject invalid access level', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: 'USER',
            accessLevel: 999, // Invalid access level
          });
        }).toThrow();
      });

      it('should use default access level when not provided', () => {
        const role = Role.create({
          id: 1,
          name: 'USER',
        });

        expect(role.accessLevel).toBe(5);
      });

      it('should reject non-number access level type', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: 'USER',
            accessLevel: '5' as any,
          });
        }).toThrow();
      });

      it('should reject non-integer access level', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: 'USER',
            accessLevel: 2.5,
          });
        }).toThrow();
      });

      it('should reject access level below 1', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: 'USER',
            accessLevel: 0,
          });
        }).toThrow();
      });

      it('should reject negative access level', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: 'USER',
            accessLevel: -1,
          });
        }).toThrow();
      });

      it('should reject access level above 10', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: 'USER',
            accessLevel: 11,
          });
        }).toThrow();
      });

      it('should reject NaN access level', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: 'USER',
            accessLevel: NaN,
          });
        }).toThrow();
      });

      it('should reject Infinity access level', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: 'USER',
            accessLevel: Infinity,
          });
        }).toThrow();
      });

      it('should accept access level 1 (minimum)', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: 'USER',
            accessLevel: 1,
          });
        }).not.toThrow();

        const role = Role.create({
          id: 1,
          name: 'USER',
          accessLevel: 1,
        });

        expect(role.accessLevel).toBe(1);
      });

      it('should accept access level 10 (maximum)', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: 'USER',
            accessLevel: 10,
          });
        }).not.toThrow();

        const role = Role.create({
          id: 1,
          name: 'USER',
          accessLevel: 10,
        });

        expect(role.accessLevel).toBe(10);
      });

      it('should handle undefined access level with default', () => {
        const role = Role.create({
          id: 1,
          name: 'USER',
          accessLevel: undefined,
        });

        expect(role.accessLevel).toBe(5);
      });

      it('should use provided access level when valid', () => {
        const role = Role.create({
          id: 1,
          name: 'USER',
          accessLevel: 3,
        });

        expect(role.accessLevel).toBe(3);
      });
    });

    describe('Multiple Validation Errors', () => {
      it('should collect multiple validation errors', () => {
        try {
          Role.create({
            id: -1, // Invalid ID
            name: '', // Empty name
            accessLevel: 999, // Invalid access level
          });
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          const validationError = error as ValidationError;
          expect(validationError.errors.length).toBeGreaterThan(1);
        }
      });
    });
  });

  describe('Business Rules - Role Activation/Deactivation', () => {
    it('should activate inactive role', () => {
      const inactiveRole = Role.create({
        id: 3,
        name: 'ANALYST',
        isActive: false,
      });

      inactiveRole.activate();

      expect(inactiveRole.isActive).toBe(true);
    });

    it('should deactivate active role', () => {
      validRole.deactivate();

      expect(validRole.isActive).toBe(false);
    });

    it('should maintain role state after activation', () => {
      const role = Role.create({
        id: 4,
        name: 'DESIGNER',
        accessLevel: 3,
        isActive: false,
      });

      role.activate();

      expect(role.id).toBe(4);
      expect(role.name).toBe('DESIGNER');
      expect(role.accessLevel).toBe(3);
      expect(role.isActive).toBe(true);
    });
  });

  describe('Permission Checks', () => {
    it('should check user management permission based on access level', () => {
      const adminRole = Role.create({
        id: 1,
        name: 'ADMIN',
        accessLevel: 1,
      });
      const managerRole = Role.create({ id: 2, name: 'MANAGER', accessLevel: 2 });
      const userRole = Role.create({ id: 3, name: 'USER', accessLevel: 5 });

      expect(adminRole.canManageUsers()).toBe(true);
      expect(managerRole.canManageUsers()).toBe(true);
      expect(userRole.canManageUsers()).toBe(false);
    });

    it('should check admin access permission based on access level', () => {
      const adminRole = Role.create({
        id: 1,
        name: 'ADMIN',
        accessLevel: 1,
      });
      const moderatorRole = Role.create({ id: 2, name: 'MODERATOR', accessLevel: 3 });
      const userRole = Role.create({ id: 3, name: 'USER', accessLevel: 5 });

      expect(adminRole.canAccessAdmin()).toBe(true);
      expect(moderatorRole.canAccessAdmin()).toBe(true);
      expect(userRole.canAccessAdmin()).toBe(false);
    });

    it('should check project leadership permission based on access level', () => {
      const leadRole = Role.create({ id: 1, name: 'LEAD', accessLevel: 4 });
      const userRole = Role.create({ id: 2, name: 'USER', accessLevel: 5 });

      expect(leadRole.canLeadProjects()).toBe(true);
      expect(userRole.canLeadProjects()).toBe(false);
    });

    it('should return appropriate permissions array', () => {
      const adminRole = Role.create({
        id: 1,
        name: 'ADMIN',
        accessLevel: 1,
      });
      const userRole = Role.create({ id: 2, name: 'USER', accessLevel: 5 });

      const adminPermissions = adminRole.getPermissions();
      const userPermissions = userRole.getPermissions();

      expect(adminPermissions).toContain('SYSTEM_ADMIN');
      expect(adminPermissions).toContain('USER_MANAGEMENT');
      expect(userPermissions).toContain('READ_ALL');
      expect(userPermissions).not.toContain('SYSTEM_ADMIN');
    });

    it('should check if role is unique for team', () => {
      const adminRole = Role.create({
        id: 1,
        name: 'ADMIN',
        accessLevel: 1,
      });
      const userRole = Role.create({ id: 2, name: 'USER', accessLevel: 5 });

      expect(adminRole.isUniqueForTeam()).toBe(true);
      expect(userRole.isUniqueForTeam()).toBe(false);
    });

    it('should check user deletion permission based on access level', () => {
      const adminRole = Role.create({
        id: 1,
        name: 'ADMIN',
        accessLevel: 1,
      });
      const managerRole = Role.create({ id: 2, name: 'MANAGER', accessLevel: 2 });
      const moderatorRole = Role.create({ id: 3, name: 'MODERATOR', accessLevel: 3 });
      const userRole = Role.create({ id: 4, name: 'USER', accessLevel: 5 });

      expect(adminRole.canDeleteUsers()).toBe(true);
      expect(managerRole.canDeleteUsers()).toBe(true);
      expect(moderatorRole.canDeleteUsers()).toBe(false);
      expect(userRole.canDeleteUsers()).toBe(false);
    });

    it('should check canDeleteUsers permission boundary at level 2', () => {
      const level2Role = Role.create({ id: 1, name: 'LEVEL2', accessLevel: 2 });
      const level3Role = Role.create({ id: 2, name: 'LEVEL3', accessLevel: 3 });

      expect(level2Role.canDeleteUsers()).toBe(true);
      expect(level3Role.canDeleteUsers()).toBe(false);
    });

    describe('getPermissions() comprehensive coverage', () => {
      it('should return correct permissions for access level 1', () => {
        const level1Role = Role.create({
          id: 1,
          name: 'SUPER_ADMIN',
          accessLevel: 1,
        });

        const permissions = level1Role.getPermissions();

        expect(permissions).toEqual([
          'SYSTEM_ADMIN',
          'USER_MANAGEMENT',
          'PROJECT_MANAGEMENT',
          'READ_ALL',
        ]);
        expect(permissions).toContain('SYSTEM_ADMIN');
        expect(permissions).toContain('USER_MANAGEMENT');
        expect(permissions).toContain('PROJECT_MANAGEMENT');
        expect(permissions).toContain('READ_ALL');
        expect(permissions.length).toBe(4);
      });

      it('should return correct permissions for access level 2', () => {
        const level2Role = Role.create({ id: 1, name: 'MANAGER', accessLevel: 2 });

        const permissions = level2Role.getPermissions();

        expect(permissions).toEqual(['USER_MANAGEMENT', 'PROJECT_MANAGEMENT', 'READ_ALL']);
        expect(permissions).toContain('USER_MANAGEMENT');
        expect(permissions).toContain('PROJECT_MANAGEMENT');
        expect(permissions).toContain('READ_ALL');
        expect(permissions).not.toContain('SYSTEM_ADMIN');
        expect(permissions.length).toBe(3);
      });

      it('should return correct permissions for access level 3', () => {
        const level3Role = Role.create({ id: 1, name: 'MODERATOR', accessLevel: 3 });

        const permissions = level3Role.getPermissions();

        expect(permissions).toEqual(['PROJECT_MANAGEMENT', 'READ_ALL']);
        expect(permissions).toContain('PROJECT_MANAGEMENT');
        expect(permissions).toContain('READ_ALL');
        expect(permissions).not.toContain('SYSTEM_ADMIN');
        expect(permissions).not.toContain('USER_MANAGEMENT');
        expect(permissions.length).toBe(2);
      });

      it('should return correct permissions for access level 4', () => {
        const level4Role = Role.create({ id: 1, name: 'PROJECT_LEAD', accessLevel: 4 });

        const permissions = level4Role.getPermissions();

        expect(permissions).toEqual(['PROJECT_LEAD', 'READ_ALL']);
        expect(permissions).toContain('PROJECT_LEAD');
        expect(permissions).toContain('READ_ALL');
        expect(permissions).not.toContain('SYSTEM_ADMIN');
        expect(permissions).not.toContain('USER_MANAGEMENT');
        expect(permissions).not.toContain('PROJECT_MANAGEMENT');
        expect(permissions.length).toBe(2);
      });

      it('should return correct permissions for access level 5', () => {
        const level5Role = Role.create({ id: 1, name: 'USER', accessLevel: 5 });

        const permissions = level5Role.getPermissions();

        expect(permissions).toEqual(['READ_ALL']);
        expect(permissions).toContain('READ_ALL');
        expect(permissions).not.toContain('SYSTEM_ADMIN');
        expect(permissions).not.toContain('USER_MANAGEMENT');
        expect(permissions).not.toContain('PROJECT_MANAGEMENT');
        expect(permissions).not.toContain('PROJECT_LEAD');
        expect(permissions.length).toBe(1);
      });

      it('should return correct permissions for access level 6 and above', () => {
        const level6Role = Role.create({ id: 1, name: 'GUEST', accessLevel: 6 });
        const level10Role = Role.create({ id: 2, name: 'LIMITED', accessLevel: 10 });

        expect(level6Role.getPermissions()).toEqual(['READ_ALL']);
        expect(level10Role.getPermissions()).toEqual(['READ_ALL']);
      });

      it('should return permissions array that is not empty', () => {
        for (let level = 1; level <= 10; level++) {
          const role = Role.create({
            id: level,
            name: `LEVEL_${level}`,
            accessLevel: level,
          });

          const permissions = role.getPermissions();
          expect(permissions.length).toBeGreaterThan(0);
          expect(permissions).toContain('READ_ALL');
        }
      });

      it('should ensure permissions array contains unique values', () => {
        for (let level = 1; level <= 10; level++) {
          const role = Role.create({
            id: level,
            name: `LEVEL_${level}`,
            accessLevel: level,
          });

          const permissions = role.getPermissions();
          const uniquePermissions = [...new Set(permissions)];

          expect(permissions.length).toBe(uniquePermissions.length);
        }
      });
    });
  });

  describe('Entity Properties and Getters', () => {
    it('should expose all required properties', () => {
      expect(validRole.id).toBe(1);
      expect(validRole.name).toBe('DEVELOPER');
      expect(validRole.isActive).toBe(true);
      expect(validRole.description).toBe('Developer role');
      expect(validRole.userCount).toBe(5);
    });

    it('should provide access level through getter', () => {
      const accessLevel = validRole.accessLevel;
      expect(accessLevel).toBe(3);
    });

    it('should handle undefined user count', () => {
      const role = Role.create({
        id: 6,
        name: 'INTERN',
      });

      expect(role.userCount).toBe(0);
    });

    describe('description getter comprehensive coverage', () => {
      it('should return provided description when set', () => {
        const role = Role.create({
          id: 1,
          name: 'TEST_ROLE',
          description: 'Custom description',
        });

        expect(role.description).toBe('Custom description');
      });

      it('should return default description when description is null', () => {
        const role = Role.create({
          id: 1,
          name: 'TEST_ROLE',
          description: null,
        });

        expect(role.description).toBe('No hay descripción para este rol');
      });

      it('should return default description when description is undefined', () => {
        const role = Role.create({
          id: 1,
          name: 'TEST_ROLE',
          description: undefined,
        });

        expect(role.description).toBe('No hay descripción para este rol');
      });

      it('should return default description when description is not provided', () => {
        const role = Role.create({
          id: 1,
          name: 'TEST_ROLE',
        });

        expect(role.description).toBe('No hay descripción para este rol');
      });

      it('should handle empty string description', () => {
        const role = Role.create({
          id: 1,
          name: 'TEST_ROLE',
          description: '',
        });

        expect(role.description).toBe('');
      });

      it('should handle whitespace-only description', () => {
        const role = Role.create({
          id: 1,
          name: 'TEST_ROLE',
          description: '   ',
        });

        expect(role.description).toBe('   ');
      });

      it('should handle very long description', () => {
        const longDescription = 'A'.repeat(1000);
        const role = Role.create({
          id: 1,
          name: 'TEST_ROLE',
          description: longDescription,
        });

        expect(role.description).toBe(longDescription);
        expect(role.description.length).toBe(1000);
      });

      it('should handle description with special characters', () => {
        const specialDescription = 'Role with special chars: !@#$%^&*()[]{}|;:,.<>?/~`\'"\\';
        const role = Role.create({
          id: 1,
          name: 'TEST_ROLE',
          description: specialDescription,
        });

        expect(role.description).toBe(specialDescription);
      });

      it('should handle description with unicode characters', () => {
        const unicodeDescription = 'Роль с описанием на русском 中文 🚀 áéíóú ñ';
        const role = Role.create({
          id: 1,
          name: 'TEST_ROLE',
          description: unicodeDescription,
        });

        expect(role.description).toBe(unicodeDescription);
      });
    });

    describe('userCount getter comprehensive coverage', () => {
      it('should return provided userCount when set', () => {
        const role = Role.create({
          id: 1,
          name: 'TEST_ROLE',
          userCount: 42,
        });

        expect(role.userCount).toBe(42);
      });

      it('should return 0 when userCount is undefined', () => {
        const role = Role.create({
          id: 1,
          name: 'TEST_ROLE',
          userCount: undefined,
        });

        expect(role.userCount).toBe(0);
      });

      it('should return 0 when userCount is not provided', () => {
        const role = Role.create({
          id: 1,
          name: 'TEST_ROLE',
        });

        expect(role.userCount).toBe(0);
      });

      it('should handle userCount of 0 explicitly set', () => {
        const role = Role.create({
          id: 1,
          name: 'TEST_ROLE',
          userCount: 0,
        });

        expect(role.userCount).toBe(0);
      });

      it('should handle large userCount values', () => {
        const role = Role.create({
          id: 1,
          name: 'TEST_ROLE',
          userCount: Number.MAX_SAFE_INTEGER,
        });

        expect(role.userCount).toBe(Number.MAX_SAFE_INTEGER);
      });

      it('should handle negative userCount values', () => {
        const role = Role.create({
          id: 1,
          name: 'TEST_ROLE',
          userCount: -5,
        });

        expect(role.userCount).toBe(-5);
      });

      it('should handle decimal userCount values', () => {
        const role = Role.create({
          id: 1,
          name: 'TEST_ROLE',
          userCount: 3.14,
        });

        expect(role.userCount).toBe(3.14);
      });

      it('should handle NaN userCount', () => {
        const role = Role.create({
          id: 1,
          name: 'TEST_ROLE',
          userCount: NaN,
        });

        // NaN is coalesced to 0 by the constructor's || 0 logic
        expect(role.userCount).toBe(0);
      });

      it('should handle Infinity userCount', () => {
        const role = Role.create({
          id: 1,
          name: 'TEST_ROLE',
          userCount: Infinity,
        });

        expect(role.userCount).toBe(Infinity);
      });
    });

    describe('All getters immutability', () => {
      it('should return the same values on multiple accesses', () => {
        const role = Role.create({
          id: 123,
          name: 'IMMUTABLE_ROLE',
          accessLevel: 4,
          description: 'Test description',
          userCount: 10,
          isActive: true,
        });

        // Access multiple times
        expect(role.id).toBe(123);
        expect(role.id).toBe(123);
        expect(role.name).toBe('IMMUTABLE_ROLE');
        expect(role.name).toBe('IMMUTABLE_ROLE');
        expect(role.accessLevel).toBe(4);
        expect(role.accessLevel).toBe(4);
        expect(role.description).toBe('Test description');
        expect(role.description).toBe('Test description');
        expect(role.userCount).toBe(10);
        expect(role.userCount).toBe(10);
        expect(role.isActive).toBe(true);
        expect(role.isActive).toBe(true);
      });

      it('should maintain getter consistency after state changes', () => {
        const role = Role.create({
          id: 456,
          name: 'CHANGEABLE_ROLE',
          accessLevel: 2,
          isActive: false,
        });

        // Initial state
        expect(role.id).toBe(456);
        expect(role.name).toBe('CHANGEABLE_ROLE');
        expect(role.accessLevel).toBe(2);
        expect(role.isActive).toBe(false);

        // Change state
        role.activate();

        // Properties should remain consistent except isActive
        expect(role.id).toBe(456);
        expect(role.name).toBe('CHANGEABLE_ROLE');
        expect(role.accessLevel).toBe(2);
        expect(role.isActive).toBe(true);

        // Change state again
        role.deactivate();

        // Properties should remain consistent
        expect(role.id).toBe(456);
        expect(role.name).toBe('CHANGEABLE_ROLE');
        expect(role.accessLevel).toBe(2);
        expect(role.isActive).toBe(false);
      });
    });
  });

  describe('Entity Equality', () => {
    it('should be equal to itself', () => {
      expect(validRole.equals(validRole)).toBe(true);
    });

    it('should be equal to role with same id', () => {
      const sameRole = Role.create({
        id: 1,
        name: 'DIFFERENT-NAME',
      });

      expect(validRole.equals(sameRole)).toBe(true);
    });

    it('should not be equal to role with different id', () => {
      const differentRole = Role.create({
        id: 999,
        name: 'DEVELOPER',
      });

      expect(validRole.equals(differentRole)).toBe(false);
    });

    it('should not be equal to null or undefined', () => {
      expect(validRole.equals(null as any)).toBe(false);
      expect(validRole.equals(undefined as any)).toBe(false);
    });
  });

  describe('String Representation', () => {
    it('should provide meaningful string representation', () => {
      const str = validRole.toString();
      expect(str).toContain('Role');
      expect(str).toContain('1');
      expect(str).toContain('DEVELOPER');
      expect(str).toContain('L3');
      expect(str).toContain('active=true');
    });

    it('should include inactive status in string representation', () => {
      const str = deactivatedRole.toString();
      expect(str).toContain('active=false');
    });
  });

  describe('Complex Validation Scenarios and Integration Tests', () => {
    describe('Constructor parameter combinations', () => {
      it('should handle all optional parameters provided', () => {
        const role = Role.create({
          id: 999,
          name: 'FULL_PARAMS_ROLE',
          accessLevel: 7,
          isActive: true,
          description: 'Full parameter test',
          userCount: 25,
        });

        expect(role.id).toBe(999);
        expect(role.name).toBe('FULL_PARAMS_ROLE');
        expect(role.accessLevel).toBe(7);
        expect(role.isActive).toBe(true);
        expect(role.description).toBe('Full parameter test');
        expect(role.userCount).toBe(25);
      });

      it('should handle mix of provided and default parameters', () => {
        const role = Role.create({
          id: 888,
          name: 'MIXED_PARAMS_ROLE',
          description: 'Only some params provided',
        });

        expect(role.id).toBe(888);
        expect(role.name).toBe('MIXED_PARAMS_ROLE');
        expect(role.accessLevel).toBe(5); // default
        expect(role.isActive).toBe(false); // default
        expect(role.description).toBe('Only some params provided');
        expect(role.userCount).toBe(0); // default
      });

      it('should handle boolean coercion for isActive', () => {
        const truthyRole = Role.create({
          id: 1,
          name: 'TRUTHY_ROLE',
          isActive: 1 as any, // Truthy value
        });

        const falsyRole = Role.create({
          id: 2,
          name: 'FALSY_ROLE',
          isActive: 0 as any, // Falsy value
        });

        expect(truthyRole.isActive).toBe(true);
        expect(falsyRole.isActive).toBe(false);
      });
    });

    describe('Validation error aggregation', () => {
      it('should collect all validation errors in single call', () => {
        try {
          Role.create({
            id: 'invalid' as any, // Type error
            name: '', // Empty name error
            accessLevel: 'invalid' as any, // Type error
          });
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          const validationError = error as ValidationError;

          // Should have multiple errors
          expect(validationError.errors.length).toBeGreaterThanOrEqual(2);

          // Should have errors for different fields
          const errorFields = validationError.errors.map((e) => e.field);
          expect(errorFields).toContain('id');
          expect(errorFields).toContain('name');
        }
      });

      it('should handle complex validation scenario with all invalid fields', () => {
        try {
          Role.create({
            id: NaN, // Invalid ID
            name: '', // Empty name
            accessLevel: 99, // Out of range
          });
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          const validationError = error as ValidationError;
          expect(validationError.errors.length).toBe(3);
        }
      });

      it('should prioritize validation order correctly', () => {
        try {
          Role.create({
            id: -1, // Invalid first
            name: '', // Empty name
            accessLevel: -5, // Invalid range
          });
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          const validationError = error as ValidationError;

          // All errors should be collected
          expect(validationError.errors.length).toBe(3);

          // Verify error fields
          const fields = validationError.errors.map((e) => e.field);
          expect(fields).toContain('id');
          expect(fields).toContain('name');
          expect(fields).toContain('accessLevel');
        }
      });
    });

    describe('Property value normalization', () => {
      it('should normalize name trimming during creation', () => {
        const role = Role.create({
          id: 1,
          name: '   TRIMMED_NAME   ',
        });

        // Name should be trimmed in the entity
        expect(role.name).toBe('TRIMMED_NAME');
        expect(role.name.length).toBe(12);
      });

      it('should handle name trimming with validation', () => {
        // Name that becomes valid after trimming
        const role = Role.create({
          id: 1,
          name: '   VALID_ROLE   ',
        });

        expect(role.name).toBe('VALID_ROLE');
      });

      it('should handle name trimming that reveals empty string', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: '     ', // Only whitespace
          });
        }).toThrow();
      });

      it('should handle description vs null coalescing', () => {
        const nullDescRole = Role.create({
          id: 1,
          name: 'NULL_DESC',
          description: null,
        });

        const undefinedDescRole = Role.create({
          id: 2,
          name: 'UNDEFINED_DESC',
          description: undefined,
        });

        const noDescRole = Role.create({
          id: 3,
          name: 'NO_DESC',
        });

        // All should return the same default
        expect(nullDescRole.description).toBe('No hay descripción para este rol');
        expect(undefinedDescRole.description).toBe('No hay descripción para este rol');
        expect(noDescRole.description).toBe('No hay descripción para este rol');
      });

      it('should handle userCount defaulting logic', () => {
        const zeroUserRole = Role.create({
          id: 1,
          name: 'ZERO_USERS',
          userCount: 0,
        });

        const nullUserRole = Role.create({
          id: 2,
          name: 'NULL_USERS',
          userCount: null as any,
        });

        const undefinedUserRole = Role.create({
          id: 3,
          name: 'UNDEFINED_USERS',
          userCount: undefined,
        });

        const noUserCountRole = Role.create({
          id: 4,
          name: 'NO_USER_COUNT',
        });

        expect(zeroUserRole.userCount).toBe(0);
        expect(nullUserRole.userCount).toBe(0); // null coalesced to 0
        expect(undefinedUserRole.userCount).toBe(0);
        expect(noUserCountRole.userCount).toBe(0);
      });
    });

    describe('Business logic interactions', () => {
      it('should maintain business logic consistency across permission methods', () => {
        const adminRole = Role.create({
          id: 1,
          name: 'BUSINESS_ADMIN',
          accessLevel: 1,
        });

        // All admin capabilities should be consistent
        expect(adminRole.canManageUsers()).toBe(true);
        expect(adminRole.canAccessAdmin()).toBe(true);
        expect(adminRole.canLeadProjects()).toBe(true);
        expect(adminRole.canDeleteUsers()).toBe(true);
        expect(adminRole.isUniqueForTeam()).toBe(true);
        expect(adminRole.getPermissions()).toContain('SYSTEM_ADMIN');
      });

      it('should maintain business logic consistency for regular user', () => {
        const userRole = Role.create({
          id: 1,
          name: 'BUSINESS_USER',
          accessLevel: 8,
        });

        // Regular user should have limited capabilities
        expect(userRole.canManageUsers()).toBe(false);
        expect(userRole.canAccessAdmin()).toBe(false);
        expect(userRole.canLeadProjects()).toBe(false);
        expect(userRole.canDeleteUsers()).toBe(false);
        expect(userRole.isUniqueForTeam()).toBe(false);
        expect(userRole.getPermissions()).toEqual(['READ_ALL']);
      });

      it('should handle boundary conditions consistently', () => {
        // Level 2 is boundary for several permissions
        const level2Role = Role.create({
          id: 1,
          name: 'BOUNDARY_ROLE',
          accessLevel: 2,
        });

        expect(level2Role.canManageUsers()).toBe(true);
        expect(level2Role.canDeleteUsers()).toBe(true);
        expect(level2Role.isUniqueForTeam()).toBe(true);
        expect(level2Role.getPermissions()).toContain('USER_MANAGEMENT');
      });

      it('should maintain state consistency after activation/deactivation cycles', () => {
        const role = Role.create({
          id: 1,
          name: 'CYCLE_TEST',
          accessLevel: 3,
          isActive: false,
        });

        // Initial state
        expect(role.isActive).toBe(false);
        expect(role.canAccessAdmin()).toBe(true); // Access level should not change

        // Activation cycle
        role.activate();
        expect(role.isActive).toBe(true);
        expect(role.canAccessAdmin()).toBe(true);

        role.deactivate();
        expect(role.isActive).toBe(false);
        expect(role.canAccessAdmin()).toBe(true);

        // Multiple cycles
        for (let i = 0; i < 5; i++) {
          role.activate();
          role.deactivate();
        }

        expect(role.isActive).toBe(false);
        expect(role.accessLevel).toBe(3); // Should remain unchanged
        expect(role.name).toBe('CYCLE_TEST'); // Should remain unchanged
      });
    });

    describe('Error handling and edge interactions', () => {
      it('should handle complex error messages correctly', () => {
        try {
          Role.create({
            id: -999,
            name: '',
            accessLevel: 150,
          });
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          const validationError = error as ValidationError;

          // Should have specific error messages for each field
          const idError = validationError.errors.find((e) => e.field === 'id');
          const nameError = validationError.errors.find((e) => e.field === 'name');
          const accessLevelError = validationError.errors.find((e) => e.field === 'accessLevel');

          expect(idError?.message).toContain('positive integer');
          expect(nameError?.message).toContain('required');
          expect(accessLevelError?.message).toContain('between 1 and 10');
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should maintain consistent state after multiple operations', () => {
      const role = Role.create({
        id: 7,
        name: 'CONSISTENCY-TEST',
        isActive: false,
      });

      role.activate();
      role.deactivate();
      role.activate();

      expect(role.isActive).toBe(true);
      expect(role.id).toBe(7);
      expect(role.name).toBe('CONSISTENCY-TEST');
    });

    it('should handle role with maximum user count', () => {
      const role = Role.create({
        id: 8,
        name: 'POPULAR-ROLE',
        userCount: Number.MAX_SAFE_INTEGER,
      });

      expect(role.userCount).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle role with very long description', () => {
      const longDescription = 'A'.repeat(1000);
      const role = Role.create({
        id: 9,
        name: 'LONG-DESC-ROLE',
        description: longDescription,
      });

      expect(role.description).toBe(longDescription);
    });

    it('should handle boundary values correctly', () => {
      const role = Role.create({
        id: Number.MAX_SAFE_INTEGER,
        name: 'MAX-ID-ROLE',
      });

      expect(role.id).toBe(Number.MAX_SAFE_INTEGER);
    });
  });
});
