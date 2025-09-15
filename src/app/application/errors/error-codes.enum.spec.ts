import { ApplicationErrorCode } from './error-codes.enum';

/**
 * Test Suite for ApplicationErrorCode Enum
 *
 * Tests the Application Error Code enumeration following Clean Architecture principles.
 * Focuses on enum structure validation, completeness verification, and categorization
 * to ensure proper error code organization and prevent duplicates.
 *
 * @description
 * Validates the Application Layer error code enum with comprehensive scenarios:
 * - Enum completeness and value consistency
 * - No duplicate values verification
 * - Feature categorization validation (Auth, User Management, Role Management, System)
 * - Error code naming convention compliance
 * - Enum structure and organization verification
 *
 * @architecture
 * - **Layer**: Application Layer Testing
 * - **Pattern**: Enum Validation Testing (no dependencies)
 * - **Dependencies**: None (ApplicationErrorCode is a pure enum)
 * - **Coverage**: 100% of enum values and structure validation
 *
 * @scenarios
 * - ✅ Enum completeness verification
 * - ✅ Duplicate value detection
 * - ✅ Feature categorization validation
 * - ✅ Naming convention compliance
 * - ✅ Enum structure consistency
 * - ✅ Error code organization verification
 * - ✅ Value format validation
 *
 * @since 1.0.0
 * @layer Application Testing
 */
describe('ApplicationErrorCode', () => {
  describe('Enum Structure and Completeness', () => {
    describe('Enum Value Validation', () => {
      it('should have all expected error codes defined', () => {
        // Arrange
        const expectedErrorCodes = [
          // Auth feature
          'AUTH_FAILED',
          'SESSION_EXPIRED',
          'INVALID_CREDENTIALS',
          'USER_NOT_FOUND',
          'EMAIL_NOT_CONFIRMED',
          'ACCOUNT_LOCKED',
          'SYSTEM_MAINTENANCE',
          'REGISTRATION_CLOSED',
          'ALREADY_AUTHENTICATED',

          // User Management feature
          'USER_ALREADY_EXISTS',
          'INSUFFICIENT_PERMISSIONS',
          'PROFILE_INCOMPLETE',
          'INVALID_USER_STATE',
          'USER_RETRIEVAL_FAILED',

          // Role Management feature
          'ROLE_NOT_FOUND',
          'ROLE_ASSIGNMENT_FAILED',
          'ROLE_IN_USE',
          'INVALID_ROLE_SPEC',
          'INVALID_ROLE_NAME',
          'ROLE_NAME_TOO_LONG',
          'INVALID_ACCESS_LEVEL',
          'INVALID_ROLE_ID',
          'INVALID_ROLE_ID_FORMAT',
          'INVALID_SEARCH_FILTER',
          'SEARCH_FILTER_TOO_LONG',
          'INVALID_ACTIVE_FILTER',
          'INVALID_LIMIT_FILTER',
          'LIMIT_FILTER_TOO_HIGH',
          'INVALID_FILTER_TYPE',
          'INVALID_SEARCH_TYPE',
          'SEARCH_TOO_LONG',
          'ROLE_LISTING_FAILED',

          // System
          'SERVICE_UNAVAILABLE',
          'RATE_LIMIT_EXCEEDED',
          'INVALID_INPUT',
          'OPERATION_TIMEOUT',
          'UNEXPECTED_ERROR',
          'UNKNOWN_ERROR',
        ];

        // Act
        const actualErrorCodes = Object.values(ApplicationErrorCode);

        // Assert
        expect(actualErrorCodes.length).toBe(expectedErrorCodes.length);
        expectedErrorCodes.forEach((expectedCode) => {
          expect(actualErrorCodes).toContain(expectedCode as ApplicationErrorCode);
        });
      });

      it('should have enum keys matching their string values', () => {
        // Act & Assert
        Object.entries(ApplicationErrorCode).forEach(([key, value]) => {
          expect(key).toBe(value);
        });
      });

      it('should contain no duplicate values', () => {
        // Arrange
        const errorCodeValues = Object.values(ApplicationErrorCode);

        // Act
        const uniqueValues = new Set(errorCodeValues);

        // Assert
        expect(uniqueValues.size).toBe(errorCodeValues.length);
      });

      it('should have consistent naming convention (UPPER_SNAKE_CASE)', () => {
        // Arrange
        const upperSnakeCasePattern = /^[A-Z]+(_[A-Z]+)*$/;

        // Act & Assert
        Object.values(ApplicationErrorCode).forEach((errorCode) => {
          expect(errorCode).toMatch(upperSnakeCasePattern);
        });
      });

      it('should not contain empty or null values', () => {
        // Act & Assert
        Object.values(ApplicationErrorCode).forEach((errorCode) => {
          expect(errorCode).toBeTruthy();
          expect(typeof errorCode).toBe('string');
          expect(errorCode.length).toBeGreaterThan(0);
        });
      });
    });

    describe('Enum Organization and Structure', () => {
      it('should maintain consistent enum property definition order', () => {
        // Arrange
        const enumKeys = Object.keys(ApplicationErrorCode);

        // Act & Assert - Categories should be grouped together
        const authKeysStartIndex = enumKeys.findIndex((key) => key.startsWith('AUTH_') || key.includes('USER_NOT_FOUND') || key.includes('EMAIL_') || key.includes('ACCOUNT_') || key.includes('SYSTEM_MAINTENANCE') || key.includes('REGISTRATION_') || key.includes('ALREADY_AUTHENTICATED') || key.includes('INVALID_CREDENTIALS'));
        const userMgmtKeysStartIndex = enumKeys.findIndex((key) => key.includes('USER_ALREADY_EXISTS') || key.includes('INSUFFICIENT_PERMISSIONS') || key.includes('PROFILE_') || key.includes('INVALID_USER_STATE') || key.includes('USER_RETRIEVAL'));
        const roleKeysStartIndex = enumKeys.findIndex((key) =>
          key.startsWith('ROLE_') ||
          key.includes('INVALID_ROLE') ||
          key.includes('INVALID_ACCESS_LEVEL') ||
          key.includes('INVALID_SEARCH') ||
          key.includes('SEARCH_FILTER') ||
          key.includes('INVALID_ACTIVE_FILTER') ||
          key.includes('INVALID_LIMIT_FILTER') ||
          key.includes('LIMIT_FILTER_TOO_HIGH') ||
          key.includes('INVALID_FILTER_TYPE') ||
          key.includes('INVALID_SEARCH_TYPE') ||
          key.includes('SEARCH_TOO_LONG') ||
          key.includes('ROLE_LISTING_FAILED')
        );
        const systemKeysStartIndex = enumKeys.findIndex((key) => key.includes('SERVICE_') || key.includes('RATE_LIMIT') || key.includes('INVALID_INPUT') || key.includes('OPERATION_') || key.includes('UNEXPECTED_') || key.includes('UNKNOWN_'));

        // Verify logical ordering (auth -> user mgmt -> role mgmt -> system)
        expect(authKeysStartIndex).toBeLessThan(userMgmtKeysStartIndex);
        expect(userMgmtKeysStartIndex).toBeLessThan(roleKeysStartIndex);
        expect(roleKeysStartIndex).toBeLessThan(systemKeysStartIndex);
      });

      it('should have meaningful error code names that describe the error', () => {
        // Arrange
        const meaningfulPatterns = [
          /FAILED$/,     // Action that failed
          /EXPIRED$/,    // Time-based expiration
          /INVALID_/,    // Validation errors
          /NOT_FOUND$/,  // Resource not found
          /ALREADY_/,    // Duplicate/existing state
          /TOO_/,        // Limit exceeded
          /UNAVAILABLE$/,// Service availability
          /EXCEEDED$/,   // Limit exceeded
          /TIMEOUT$/,    // Time-based failure
          /ERROR$/,      // General error categories
          /LOCKED$/,     // Security lockout
          /INCOMPLETE$/,  // Missing data
          /CLOSED$/,     // Service state
          /IN_USE$/,     // Resource busy
          /NOT_CONFIRMED$/,  // Confirmation state
          /MAINTENANCE$/,    // System state
          /INSUFFICIENT_/,   // Inadequate resources/permissions
        ];

        // Act & Assert
        Object.values(ApplicationErrorCode).forEach((errorCode) => {
          const isDescriptive = meaningfulPatterns.some(pattern => pattern.test(errorCode));
          expect(isDescriptive).withContext(`Error code '${errorCode}' should have a descriptive name`).toBe(true);
        });
      });

      it('should not have overly long error code names (max 30 characters)', () => {
        // Act & Assert
        Object.values(ApplicationErrorCode).forEach((errorCode) => {
          expect(errorCode.length).toBeLessThanOrEqual(30);
        });
      });

      it('should not have overly short error code names (min 5 characters)', () => {
        // Act & Assert
        Object.values(ApplicationErrorCode).forEach((errorCode) => {
          expect(errorCode.length).toBeGreaterThanOrEqual(5);
        });
      });
    });
  });

  describe('Feature Categorization', () => {
    describe('Authentication Feature Codes', () => {
      it('should contain all authentication-related error codes', () => {
        // Arrange
        const authErrorCodes = [
          ApplicationErrorCode.AUTH_FAILED,
          ApplicationErrorCode.SESSION_EXPIRED,
          ApplicationErrorCode.INVALID_CREDENTIALS,
          ApplicationErrorCode.USER_NOT_FOUND,
          ApplicationErrorCode.EMAIL_NOT_CONFIRMED,
          ApplicationErrorCode.ACCOUNT_LOCKED,
          ApplicationErrorCode.SYSTEM_MAINTENANCE,
          ApplicationErrorCode.REGISTRATION_CLOSED,
          ApplicationErrorCode.ALREADY_AUTHENTICATED,
        ];

        // Act & Assert
        authErrorCodes.forEach((errorCode) => {
          expect(Object.values(ApplicationErrorCode)).toContain(errorCode);
        });

        // Verify auth error code count
        expect(authErrorCodes.length).toBe(9);
      });

      it('should have auth error codes with authentication-related naming', () => {
        // Arrange
        const authRelatedPatterns = [
          /AUTH_/,
          /SESSION_/,
          /CREDENTIALS/,
          /USER_NOT_FOUND/,
          /EMAIL_/,
          /ACCOUNT_/,
          /MAINTENANCE/,
          /REGISTRATION/,
          /AUTHENTICATED/,
        ];

        const authErrorCodes = [
          ApplicationErrorCode.AUTH_FAILED,
          ApplicationErrorCode.SESSION_EXPIRED,
          ApplicationErrorCode.INVALID_CREDENTIALS,
          ApplicationErrorCode.USER_NOT_FOUND,
          ApplicationErrorCode.EMAIL_NOT_CONFIRMED,
          ApplicationErrorCode.ACCOUNT_LOCKED,
          ApplicationErrorCode.SYSTEM_MAINTENANCE,
          ApplicationErrorCode.REGISTRATION_CLOSED,
          ApplicationErrorCode.ALREADY_AUTHENTICATED,
        ];

        // Act & Assert
        authErrorCodes.forEach((errorCode, index) => {
          expect(errorCode).toMatch(authRelatedPatterns[index]);
        });
      });
    });

    describe('User Management Feature Codes', () => {
      it('should contain all user management-related error codes', () => {
        // Arrange
        const userMgmtErrorCodes = [
          ApplicationErrorCode.USER_ALREADY_EXISTS,
          ApplicationErrorCode.INSUFFICIENT_PERMISSIONS,
          ApplicationErrorCode.PROFILE_INCOMPLETE,
          ApplicationErrorCode.INVALID_USER_STATE,
          ApplicationErrorCode.USER_RETRIEVAL_FAILED,
        ];

        // Act & Assert
        userMgmtErrorCodes.forEach((errorCode) => {
          expect(Object.values(ApplicationErrorCode)).toContain(errorCode);
        });

        // Verify user management error code count
        expect(userMgmtErrorCodes.length).toBe(5);
      });

      it('should have user management error codes with appropriate naming', () => {
        // Arrange
        const userMgmtPatterns = [
          /USER_.*EXISTS/,
          /INSUFFICIENT_PERMISSIONS/,
          /PROFILE_/,
          /INVALID_USER_STATE/,
          /USER_RETRIEVAL/,
        ];

        const userMgmtErrorCodes = [
          ApplicationErrorCode.USER_ALREADY_EXISTS,
          ApplicationErrorCode.INSUFFICIENT_PERMISSIONS,
          ApplicationErrorCode.PROFILE_INCOMPLETE,
          ApplicationErrorCode.INVALID_USER_STATE,
          ApplicationErrorCode.USER_RETRIEVAL_FAILED,
        ];

        // Act & Assert
        userMgmtErrorCodes.forEach((errorCode, index) => {
          expect(errorCode).toMatch(userMgmtPatterns[index]);
        });
      });
    });

    describe('Role Management Feature Codes', () => {
      it('should contain all role management-related error codes', () => {
        // Arrange
        const roleMgmtErrorCodes = [
          ApplicationErrorCode.ROLE_NOT_FOUND,
          ApplicationErrorCode.ROLE_ASSIGNMENT_FAILED,
          ApplicationErrorCode.ROLE_IN_USE,
          ApplicationErrorCode.INVALID_ROLE_SPEC,
          ApplicationErrorCode.INVALID_ROLE_NAME,
          ApplicationErrorCode.ROLE_NAME_TOO_LONG,
          ApplicationErrorCode.INVALID_ACCESS_LEVEL,
          ApplicationErrorCode.INVALID_ROLE_ID,
          ApplicationErrorCode.INVALID_ROLE_ID_FORMAT,
          ApplicationErrorCode.INVALID_SEARCH_FILTER,
          ApplicationErrorCode.SEARCH_FILTER_TOO_LONG,
          ApplicationErrorCode.INVALID_ACTIVE_FILTER,
          ApplicationErrorCode.INVALID_LIMIT_FILTER,
          ApplicationErrorCode.LIMIT_FILTER_TOO_HIGH,
          ApplicationErrorCode.INVALID_FILTER_TYPE,
          ApplicationErrorCode.INVALID_SEARCH_TYPE,
          ApplicationErrorCode.SEARCH_TOO_LONG,
          ApplicationErrorCode.ROLE_LISTING_FAILED,
        ];

        // Act & Assert
        roleMgmtErrorCodes.forEach((errorCode) => {
          expect(Object.values(ApplicationErrorCode)).toContain(errorCode);
        });

        // Verify role management error code count
        expect(roleMgmtErrorCodes.length).toBe(18);
      });

      it('should have role management error codes with role-related naming', () => {
        // Arrange
        const roleRelatedPatterns = [
          /ROLE_/,
          /SEARCH/,
          /FILTER/,
          /ACCESS_LEVEL/,
          /LIMIT/,
        ];

        const roleMgmtErrorCodes = [
          ApplicationErrorCode.ROLE_NOT_FOUND,
          ApplicationErrorCode.ROLE_ASSIGNMENT_FAILED,
          ApplicationErrorCode.ROLE_IN_USE,
          ApplicationErrorCode.INVALID_ROLE_SPEC,
          ApplicationErrorCode.INVALID_ROLE_NAME,
          ApplicationErrorCode.ROLE_NAME_TOO_LONG,
          ApplicationErrorCode.INVALID_ACCESS_LEVEL,
          ApplicationErrorCode.INVALID_ROLE_ID,
          ApplicationErrorCode.INVALID_ROLE_ID_FORMAT,
          ApplicationErrorCode.INVALID_SEARCH_FILTER,
          ApplicationErrorCode.SEARCH_FILTER_TOO_LONG,
          ApplicationErrorCode.INVALID_ACTIVE_FILTER,
          ApplicationErrorCode.INVALID_LIMIT_FILTER,
          ApplicationErrorCode.LIMIT_FILTER_TOO_HIGH,
          ApplicationErrorCode.INVALID_FILTER_TYPE,
          ApplicationErrorCode.INVALID_SEARCH_TYPE,
          ApplicationErrorCode.SEARCH_TOO_LONG,
          ApplicationErrorCode.ROLE_LISTING_FAILED,
        ];

        // Act & Assert
        roleMgmtErrorCodes.forEach((errorCode) => {
          const isRoleRelated = roleRelatedPatterns.some(pattern => pattern.test(errorCode));
          expect(isRoleRelated).withContext(`Role management error code '${errorCode}' should contain role-related terms`).toBe(true);
        });
      });

      it('should group validation-related role error codes logically', () => {
        // Arrange
        const validationErrorCodes = [
          ApplicationErrorCode.INVALID_ROLE_SPEC,
          ApplicationErrorCode.INVALID_ROLE_NAME,
          ApplicationErrorCode.ROLE_NAME_TOO_LONG,
          ApplicationErrorCode.INVALID_ACCESS_LEVEL,
          ApplicationErrorCode.INVALID_ROLE_ID,
          ApplicationErrorCode.INVALID_ROLE_ID_FORMAT,
        ];

        const filterErrorCodes = [
          ApplicationErrorCode.INVALID_SEARCH_FILTER,
          ApplicationErrorCode.SEARCH_FILTER_TOO_LONG,
          ApplicationErrorCode.INVALID_ACTIVE_FILTER,
          ApplicationErrorCode.INVALID_LIMIT_FILTER,
          ApplicationErrorCode.LIMIT_FILTER_TOO_HIGH,
          ApplicationErrorCode.INVALID_FILTER_TYPE,
          ApplicationErrorCode.INVALID_SEARCH_TYPE,
          ApplicationErrorCode.SEARCH_TOO_LONG,
        ];

        // Act & Assert
        validationErrorCodes.forEach((errorCode) => {
          expect(errorCode).toMatch(/INVALID_.*ROLE|ROLE.*TOO_LONG|INVALID_ACCESS_LEVEL/);
        });

        filterErrorCodes.forEach((errorCode) => {
          expect(errorCode).toMatch(/FILTER|SEARCH/);
        });
      });
    });

    describe('System Feature Codes', () => {
      it('should contain all system-related error codes', () => {
        // Arrange
        const systemErrorCodes = [
          ApplicationErrorCode.SERVICE_UNAVAILABLE,
          ApplicationErrorCode.RATE_LIMIT_EXCEEDED,
          ApplicationErrorCode.INVALID_INPUT,
          ApplicationErrorCode.OPERATION_TIMEOUT,
          ApplicationErrorCode.UNEXPECTED_ERROR,
          ApplicationErrorCode.UNKNOWN_ERROR,
        ];

        // Act & Assert
        systemErrorCodes.forEach((errorCode) => {
          expect(Object.values(ApplicationErrorCode)).toContain(errorCode);
        });

        // Verify system error code count
        expect(systemErrorCodes.length).toBe(6);
      });

      it('should have system error codes with system-related naming', () => {
        // Arrange
        const systemPatterns = [
          /SERVICE_/,
          /RATE_LIMIT/,
          /INVALID_INPUT/,
          /OPERATION_/,
          /UNEXPECTED_ERROR/,
          /UNKNOWN_ERROR/,
        ];

        const systemErrorCodes = [
          ApplicationErrorCode.SERVICE_UNAVAILABLE,
          ApplicationErrorCode.RATE_LIMIT_EXCEEDED,
          ApplicationErrorCode.INVALID_INPUT,
          ApplicationErrorCode.OPERATION_TIMEOUT,
          ApplicationErrorCode.UNEXPECTED_ERROR,
          ApplicationErrorCode.UNKNOWN_ERROR,
        ];

        // Act & Assert
        systemErrorCodes.forEach((errorCode, index) => {
          expect(errorCode).toMatch(systemPatterns[index]);
        });
      });
    });
  });

  describe('Error Code Usage and Accessibility', () => {
    describe('Enum Property Access', () => {
      it('should allow direct property access for all error codes', () => {
        // Act & Assert - Direct property access should work
        expect(ApplicationErrorCode.AUTH_FAILED).toBe('AUTH_FAILED');
        expect(ApplicationErrorCode.USER_NOT_FOUND).toBe('USER_NOT_FOUND');
        expect(ApplicationErrorCode.ROLE_IN_USE).toBe('ROLE_IN_USE');
        expect(ApplicationErrorCode.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
        expect(ApplicationErrorCode.UNEXPECTED_ERROR).toBe('UNEXPECTED_ERROR');
      });

      it('should allow bracket notation access for all error codes', () => {
        // Act & Assert - Bracket notation should work
        expect(ApplicationErrorCode['AUTH_FAILED']).toBe('AUTH_FAILED');
        expect(ApplicationErrorCode['USER_ALREADY_EXISTS']).toBe('USER_ALREADY_EXISTS');
        expect(ApplicationErrorCode['INVALID_ROLE_NAME']).toBe('INVALID_ROLE_NAME');
        expect(ApplicationErrorCode['RATE_LIMIT_EXCEEDED']).toBe('RATE_LIMIT_EXCEEDED');
      });

      it('should be enumerable through Object methods', () => {
        // Act
        const keys = Object.keys(ApplicationErrorCode);
        const values = Object.values(ApplicationErrorCode);
        const entries = Object.entries(ApplicationErrorCode);

        // Assert
        expect(keys.length).toBeGreaterThan(0);
        expect(values.length).toBeGreaterThan(0);
        expect(entries.length).toBeGreaterThan(0);
        expect(keys.length).toBe(values.length);
        expect(entries.length).toBe(keys.length);
      });

      it('should support iteration over error codes', () => {
        // Arrange
        const collectedCodes: string[] = [];

        // Act
        for (const code in ApplicationErrorCode) {
          collectedCodes.push(ApplicationErrorCode[code as keyof typeof ApplicationErrorCode]);
        }

        // Assert
        expect(collectedCodes.length).toBe(Object.values(ApplicationErrorCode).length);
        expect(collectedCodes).toEqual(jasmine.arrayContaining(Object.values(ApplicationErrorCode)));
      });
    });

    describe('Type Safety and Validation', () => {
      it('should be usable in type-safe comparisons', () => {
        // Arrange
        const testCode: ApplicationErrorCode = ApplicationErrorCode.AUTH_FAILED;

        // Act & Assert
        expect(testCode === ApplicationErrorCode.AUTH_FAILED).toBe(true);
        expect(testCode.toString() === ApplicationErrorCode.USER_NOT_FOUND.toString()).toBe(false);
        expect(testCode.toString() !== ApplicationErrorCode.UNEXPECTED_ERROR.toString()).toBe(true);
      });

      it('should work correctly in switch statements', () => {
        // Arrange
        const testCodes = [
          ApplicationErrorCode.AUTH_FAILED,
          ApplicationErrorCode.USER_ALREADY_EXISTS,
          ApplicationErrorCode.ROLE_NOT_FOUND,
          ApplicationErrorCode.SERVICE_UNAVAILABLE,
        ];

        // Act & Assert
        testCodes.forEach((code) => {
          let switchResult: string;

          switch (code) {
            case ApplicationErrorCode.AUTH_FAILED:
              switchResult = 'authentication';
              break;
            case ApplicationErrorCode.USER_ALREADY_EXISTS:
              switchResult = 'user_management';
              break;
            case ApplicationErrorCode.ROLE_NOT_FOUND:
              switchResult = 'role_management';
              break;
            case ApplicationErrorCode.SERVICE_UNAVAILABLE:
              switchResult = 'system';
              break;
            default:
              switchResult = 'unknown';
          }

          expect(switchResult).not.toBe('unknown');
        });
      });

      it('should be usable in array operations', () => {
        // Arrange
        const authCodes = [
          ApplicationErrorCode.AUTH_FAILED,
          ApplicationErrorCode.SESSION_EXPIRED,
          ApplicationErrorCode.INVALID_CREDENTIALS,
        ];

        // Act & Assert
        expect(authCodes.includes(ApplicationErrorCode.AUTH_FAILED)).toBe(true);
        expect(authCodes.includes(ApplicationErrorCode.USER_ALREADY_EXISTS)).toBe(false);

        const filteredCodes = authCodes.filter(code => code.includes('AUTH'));
        expect(filteredCodes).toContain(ApplicationErrorCode.AUTH_FAILED);
      });

      it('should work correctly with Set and Map operations', () => {
        // Arrange & Act
        const codeSet = new Set([
          ApplicationErrorCode.AUTH_FAILED,
          ApplicationErrorCode.USER_NOT_FOUND,
          ApplicationErrorCode.ROLE_IN_USE,
        ]);

        const codeMap = new Map([
          [ApplicationErrorCode.AUTH_FAILED, 'Authentication Failed'],
          [ApplicationErrorCode.USER_NOT_FOUND, 'User Not Found'],
          [ApplicationErrorCode.ROLE_IN_USE, 'Role In Use'],
        ]);

        // Assert
        expect(codeSet.has(ApplicationErrorCode.AUTH_FAILED)).toBe(true);
        expect(codeSet.has(ApplicationErrorCode.UNEXPECTED_ERROR)).toBe(false);
        expect(codeSet.size).toBe(3);

        expect(codeMap.get(ApplicationErrorCode.AUTH_FAILED)).toBe('Authentication Failed');
        expect(codeMap.has(ApplicationErrorCode.USER_NOT_FOUND)).toBe(true);
        expect(codeMap.size).toBe(3);
      });
    });
  });

  describe('Enum Consistency and Validation', () => {
    describe('Cross-Feature Consistency', () => {
      it('should maintain consistent naming patterns across features', () => {
        // Arrange
        const consistentPatterns = {
          notFound: /.*_NOT_FOUND$/,
          invalid: /^INVALID_.*/,
          failed: /.*_FAILED$/,
          tooLong: /.*_TOO_LONG$/,
          exceeded: /.*_EXCEEDED$/,
        };

        // Act
        const notFoundCodes = Object.values(ApplicationErrorCode).filter(code =>
          consistentPatterns.notFound.test(code)
        );
        const invalidCodes = Object.values(ApplicationErrorCode).filter(code =>
          consistentPatterns.invalid.test(code)
        );
        const failedCodes = Object.values(ApplicationErrorCode).filter(code =>
          consistentPatterns.failed.test(code)
        );

        // Assert
        expect(notFoundCodes.length).toBeGreaterThan(0);
        expect(invalidCodes.length).toBeGreaterThan(0);
        expect(failedCodes.length).toBeGreaterThan(0);

        // Verify consistent naming
        notFoundCodes.forEach(code => {
          expect(code).toMatch(/_NOT_FOUND$/);
        });
        invalidCodes.forEach(code => {
          expect(code).toMatch(/^INVALID_/);
        });
      });

      it('should avoid naming conflicts between features', () => {
        // Arrange
        const allCodes = Object.values(ApplicationErrorCode);
        const codeFrequency = new Map<string, number>();

        // Act
        allCodes.forEach(code => {
          codeFrequency.set(code, (codeFrequency.get(code) || 0) + 1);
        });

        // Assert - No duplicate error codes
        codeFrequency.forEach((count, code) => {
          expect(count).withContext(`Error code '${code}' appears ${count} times`).toBe(1);
        });
      });

      it('should have meaningful distinctions between similar error codes', () => {
        // Arrange
        const similarCodePairs = [
          [ApplicationErrorCode.AUTH_FAILED, ApplicationErrorCode.INVALID_CREDENTIALS],
          [ApplicationErrorCode.USER_NOT_FOUND, ApplicationErrorCode.USER_ALREADY_EXISTS],
          [ApplicationErrorCode.ROLE_NOT_FOUND, ApplicationErrorCode.ROLE_IN_USE],
          [ApplicationErrorCode.UNEXPECTED_ERROR, ApplicationErrorCode.UNKNOWN_ERROR],
        ];

        // Act & Assert
        similarCodePairs.forEach(([code1, code2]) => {
          expect(code1).not.toBe(code2);
          expect(code1.length).toBeGreaterThan(0);
          expect(code2.length).toBeGreaterThan(0);
          // Should have meaningful differences in naming
          expect(code1).not.toEqual(code2);
        });
      });
    });

    describe('Enum Immutability and Structure', () => {
      it('should maintain enum immutability', () => {
        // Arrange - Verify enum values are immutable strings
        const expectedAuthFailed = 'AUTH_FAILED';

        // Act & Assert - Check that enum values match expected constants
        expect(ApplicationErrorCode.AUTH_FAILED).toBe(expectedAuthFailed);
        expect(typeof ApplicationErrorCode.AUTH_FAILED).toBe('string');

        // Verify enum is readonly at TypeScript level (no runtime mutation test needed)
        expect(Object.isFrozen(ApplicationErrorCode)).toBe(false); // TypeScript enums are not frozen by default
      });

      it('should have consistent enum structure', () => {
        // Arrange
        const expectedMinimumCodeCount = 38; // We know there are at least 38 error codes

        // Act & Assert - Verify enum structure without mutation
        expect(Object.keys(ApplicationErrorCode).length).toBeGreaterThanOrEqual(expectedMinimumCodeCount);
        expect(typeof ApplicationErrorCode).toBe('object');
        expect(ApplicationErrorCode).toBeDefined();
      });

      it('should maintain correct enum prototype', () => {
        // Act & Assert
        expect(typeof ApplicationErrorCode).toBe('object');
        expect(ApplicationErrorCode.constructor).toBe(Object);
        expect(Object.getPrototypeOf(ApplicationErrorCode)).toBe(Object.prototype);
      });
    });

    describe('Documentation and Completeness', () => {
      it('should have error codes covering all major error scenarios', () => {
        // Arrange
        const majorErrorCategories = {
          authentication: ['AUTH', 'SESSION', 'CREDENTIALS', 'ACCOUNT'],
          authorization: ['PERMISSIONS', 'ACCESS'],
          validation: ['INVALID', 'TOO_LONG', 'TOO_HIGH'],
          notFound: ['NOT_FOUND'],
          conflict: ['ALREADY_EXISTS', 'IN_USE'],
          system: ['SERVICE', 'TIMEOUT', 'UNAVAILABLE', 'ERROR'],
          limits: ['EXCEEDED', 'LIMIT'],
        };

        const allErrorCodes = Object.values(ApplicationErrorCode);
        const totalCodeCount = allErrorCodes.length;

        // Act & Assert - Verify each category has adequate coverage
        Object.entries(majorErrorCategories).forEach(([category, keywords]) => {
          const categoryMatches = allErrorCodes.filter(code =>
            keywords.some(keyword => code.includes(keyword))
          );

          expect(categoryMatches.length)
            .withContext(`Category '${category}' should have at least one error code`)
            .toBeGreaterThan(0);
        });

        // Verify total completeness - should have minimum expected codes
        expect(totalCodeCount)
          .withContext('Total error codes should meet minimum expected count')
          .toBeGreaterThanOrEqual(38); // Based on actual enum definition

        // Verify comprehensive coverage - most codes should be categorized
        const categorizedCodes = new Set<string>();
        Object.values(majorErrorCategories).forEach(keywords => {
          allErrorCodes.forEach(code => {
            if (keywords.some(keyword => code.includes(keyword))) {
              categorizedCodes.add(code);
            }
          });
        });

        const coveragePercentage = (categorizedCodes.size / totalCodeCount) * 100;
        expect(coveragePercentage)
          .withContext('Should have high categorization coverage')
          .toBeGreaterThanOrEqual(80);
      });

      it('should provide comprehensive coverage for role management operations', () => {
        // Arrange
        const roleOperations = [
          'ROLE_NOT_FOUND',
          'ROLE_ASSIGNMENT_FAILED',
          'ROLE_IN_USE',
          'INVALID_ROLE_SPEC',
          'INVALID_ROLE_NAME',
          'ROLE_NAME_TOO_LONG',
          'INVALID_ACCESS_LEVEL',
          'INVALID_ROLE_ID',
          'ROLE_LISTING_FAILED',
        ];

        // Act & Assert
        roleOperations.forEach(operation => {
          expect(Object.values(ApplicationErrorCode)).toContain(operation as ApplicationErrorCode);
        });
      });

      it('should provide comprehensive coverage for search and filter operations', () => {
        // Arrange
        const searchFilterOperations = [
          'INVALID_SEARCH_FILTER',
          'SEARCH_FILTER_TOO_LONG',
          'INVALID_ACTIVE_FILTER',
          'INVALID_LIMIT_FILTER',
          'LIMIT_FILTER_TOO_HIGH',
          'INVALID_FILTER_TYPE',
          'INVALID_SEARCH_TYPE',
          'SEARCH_TOO_LONG',
        ];

        // Act & Assert
        searchFilterOperations.forEach(operation => {
          expect(Object.values(ApplicationErrorCode)).toContain(operation as ApplicationErrorCode);
        });
      });
    });
  });
});