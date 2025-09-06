import { RoleName } from '../value-objects/role-name.vo';
import { BusinessRuleError } from '../errors/business-rule-error.entity';
import { RoleNameReservedSpec } from './role-name-reserved.specs';

/**
 * Role Name Reserved Specification - Domain Layer Tests
 *
 * Tests for RoleNameReservedSpec specification class that contains
 * business rules for validating role names against reserved system names.
 * These are pure unit tests without any external dependencies or mocks.
 *
 * Business Rules Tested:
 * - Role names cannot use reserved system names
 * - Role names cannot use predefined system role categories
 * - Alternative name suggestions for reserved names
 * - Case-insensitive validation of reserved names
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
describe('RoleNameReservedSpec - Domain Tests', () => {
  let validRoleName: RoleName;
  let reservedRoleName: RoleName;

  beforeEach(() => {
    // Setup test data - pure domain objects, no external dependencies
    validRoleName = RoleName.create('DEVELOPER');
    reservedRoleName = RoleName.create('ADMIN');
  });

  describe('Business Rules - Reserved Name Validation', () => {
    describe('Valid Role Names', () => {
      it('should pass when role name is not in reserved list', () => {
        const customRoleName = RoleName.create('DEVELOPER');

        expect(() => {
          RoleNameReservedSpec.isSatisfiedBy(customRoleName);
        }).not.toThrow();
      });

      it('should return true for valid role names', () => {
        const result = RoleNameReservedSpec.isSatisfiedByString('MANAGER');

        expect(result).toBe(true);
      });

      it('should allow role names with numbers and special characters', () => {
        const result = RoleNameReservedSpec.isSatisfiedByString('PROJECT_MANAGER_2024');

        expect(result).toBe(true);
      });
    });

    describe('Reserved Name Rejection', () => {
      it('should throw BusinessRuleError when role name is reserved', () => {
        expect(() => {
          RoleNameReservedSpec.isSatisfiedBy(reservedRoleName);
        }).toThrowError(BusinessRuleError);
      });

      it('should throw BusinessRuleError for reserved system names', () => {
        const reservedNames = ['admin', 'root', 'system', 'api', 'service'];

        reservedNames.forEach((name) => {
          expect(() => {
            RoleNameReservedSpec.isSatisfiedByString(name);
          }).toThrowError(BusinessRuleError);
        });
      });

      it('should include correct error details for reserved name violation', () => {
        let caughtError: BusinessRuleError | undefined;

        try {
          RoleNameReservedSpec.isSatisfiedByString('admin');
          fail('Expected BusinessRuleError to be thrown');
        } catch (error) {
          caughtError = error as BusinessRuleError;
        }

        expect(caughtError).toBeDefined();
        expect(caughtError!.message).toContain("Role name 'admin' is reserved and cannot be used");
        expect(caughtError!.code).toBe('ROLE_NAME_RESERVED');
      });
    });

    describe('Case Insensitive Validation', () => {
      it('should reject reserved names regardless of case', () => {
        const caseVariations = ['Admin', 'ADMIN', 'admin', 'Root', 'ROOT', 'root'];

        caseVariations.forEach((name) => {
          expect(() => {
            RoleNameReservedSpec.isSatisfiedByString(name);
          }).toThrowError(BusinessRuleError);
        });
      });

      it('should accept valid names with different cases', () => {
        const validVariations = ['Manager', 'DEVELOPER', 'ProjectLead'];

        validVariations.forEach((name) => {
          expect(() => {
            RoleNameReservedSpec.isSatisfiedByString(name);
          }).not.toThrow();
        });
      });
    });
  });

  describe('Business Rules - System Role Categories', () => {
    describe('Administrator Category', () => {
      it('should reject all administrator role variations', () => {
        const adminVariations = ['admin', 'root', 'superuser'];

        adminVariations.forEach((name) => {
          expect(() => {
            RoleNameReservedSpec.isSatisfiedByString(name);
          }).toThrowError(BusinessRuleError);
        });
      });
    });

    describe('Moderator Category', () => {
      it('should reject all moderator role variations', () => {
        const moderatorVariations = ['moderator', 'mod', 'moderador'];

        moderatorVariations.forEach((name) => {
          expect(() => {
            RoleNameReservedSpec.isSatisfiedByString(name);
          }).toThrowError(BusinessRuleError);
        });
      });
    });

    describe('User Category', () => {
      it('should reject all user role variations', () => {
        const userVariations = ['user', 'member', 'usuario'];

        userVariations.forEach((name) => {
          expect(() => {
            RoleNameReservedSpec.isSatisfiedByString(name);
          }).toThrowError(BusinessRuleError);
        });
      });
    });
  });

  describe('Alternative Name Suggestions', () => {
    describe('Suggestion Generation', () => {
      it('should provide alternative suggestions for reserved names', () => {
        const suggestions = RoleNameReservedSpec.suggestAlternatives('admin');

        expect(suggestions).toBeDefined();
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions).toContain('adminRole');
        expect(suggestions).toContain('adminUser');
      });

      it('should generate consistent suggestions for same input', () => {
        const suggestions1 = RoleNameReservedSpec.suggestAlternatives('admin');
        const suggestions2 = RoleNameReservedSpec.suggestAlternatives('admin');

        expect(suggestions1).toEqual(suggestions2);
      });

      it('should handle case variations in suggestions', () => {
        const suggestions = RoleNameReservedSpec.suggestAlternatives('ADMIN');

        expect(suggestions).toContain('adminRole');
        expect(suggestions).toContain('adminUser');
      });
    });

    describe('Suggestion Quality', () => {
      it('should not suggest reserved names as alternatives', () => {
        const suggestions = RoleNameReservedSpec.suggestAlternatives('admin');
        const reservedNames = RoleNameReservedSpec.getReservedNames();

        suggestions.forEach((suggestion) => {
          expect(reservedNames).not.toContain(suggestion.toLowerCase());
        });
      });

      it('should provide exactly 5 alternative suggestions', () => {
        const suggestions = RoleNameReservedSpec.suggestAlternatives('admin');

        expect(suggestions.length).toBe(5);
      });
    });
  });

  describe('Reserved Names List', () => {
    describe('List Retrieval', () => {
      it('should return all reserved names', () => {
        const reservedNames = RoleNameReservedSpec.getReservedNames();

        expect(reservedNames).toBeDefined();
        expect(reservedNames.length).toBeGreaterThan(0);
        expect(reservedNames).toContain('admin');
        expect(reservedNames).toContain('root');
        expect(reservedNames).toContain('system');
      });

      it('should include both specific reserved names and system categories', () => {
        const reservedNames = RoleNameReservedSpec.getReservedNames();

        // Specific reserved names
        expect(reservedNames).toContain('admin');
        expect(reservedNames).toContain('root');
        expect(reservedNames).toContain('system');

        // System category names
        expect(reservedNames).toContain('user');
        expect(reservedNames).toContain('moderator');
        expect(reservedNames).toContain('member');
      });
    });
  });

  describe('Domain Invariants and Edge Cases', () => {
    it('should maintain business rule consistency across different inputs', () => {
      // Same logical name should behave consistently
      expect(() => RoleNameReservedSpec.isSatisfiedByString('admin')).toThrow();
      expect(() => RoleNameReservedSpec.isSatisfiedByString('ADMIN')).toThrow();
      expect(() => RoleNameReservedSpec.isSatisfiedByString('Admin')).toThrow();
    });

    it('should handle empty and whitespace-only names', () => {
      // These should be handled by RoleName VO validation, not this spec
      expect(() => RoleNameReservedSpec.isSatisfiedByString('')).not.toThrow();
      expect(() => RoleNameReservedSpec.isSatisfiedByString('   ')).not.toThrow();
    });

    it('should handle special characters and numbers in names', () => {
      const specialNames = ['user123', 'admin_special', 'root-user'];

      specialNames.forEach((name) => {
        // These should pass reserved check but may fail VO validation
        // Test through public interface only
        if (!RoleNameReservedSpec.getReservedNames().includes(name.toLowerCase())) {
          expect(() => RoleNameReservedSpec.isSatisfiedByString(name)).not.toThrow();
        }
      });
    });

    it('should handle very long role names', () => {
      const longName = 'a'.repeat(40);

      // Test through public interface - if it's not in reserved list, it should pass
      if (!RoleNameReservedSpec.getReservedNames().includes(longName.toLowerCase())) {
        expect(() => RoleNameReservedSpec.isSatisfiedByString(longName)).not.toThrow();
      }
    });
  });

  describe('Business Constants Validation', () => {
    it('should define comprehensive reserved names list', () => {
      const reservedNames = RoleNameReservedSpec.getReservedNames();

      expect(reservedNames.length).toBeGreaterThan(10);
      expect(reservedNames).toContain('admin');
      expect(reservedNames).toContain('root');
      expect(reservedNames).toContain('system');
      expect(reservedNames).toContain('api');
    });

    it('should include all system role categories', () => {
      const reservedNames = RoleNameReservedSpec.getReservedNames();

      // Administrator category
      expect(reservedNames).toContain('admin');
      expect(reservedNames).toContain('root');
      expect(reservedNames).toContain('superuser');

      // Moderator category
      expect(reservedNames).toContain('moderator');
      expect(reservedNames).toContain('mod');

      // User category
      expect(reservedNames).toContain('user');
      expect(reservedNames).toContain('member');
    });
  });
});
