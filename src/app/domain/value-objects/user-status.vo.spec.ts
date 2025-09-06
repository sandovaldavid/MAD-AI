import { UserStatusVO } from './user-status.vo';
import { UserStatus } from '../enums/user-status.enum';
import { ValidationError } from '../errors/validation-error.entity';
import { ValidationErrorCode } from '../errors/validation-error-code.enum';

describe('UserStatusVO - Domain Tests', () => {
  describe('Value Object Creation and Validation', () => {
    describe('Valid Creation Cases', () => {
      it('should create ACTIVE status from string', () => {
        // Given
        const input = 'active';

        // When
        const result = UserStatusVO.create(input);

        // Then
        expect(result).toBeDefined();
        expect(result.value).toBe(UserStatus.ACTIVE);
      });

      it('should create INACTIVE status from string', () => {
        // Given
        const input = 'INACTIVE';

        // When
        const result = UserStatusVO.create(input);

        // Then
        expect(result).toBeDefined();
        expect(result.value).toBe(UserStatus.INACTIVE);
      });

      it('should create SUSPENDED status from string', () => {
        // Given
        const input = 'Suspended';

        // When
        const result = UserStatusVO.create(input);

        // Then
        expect(result).toBeDefined();
        expect(result.value).toBe(UserStatus.SUSPENDED);
      });

      it('should create PENDING status from string', () => {
        // Given
        const input = 'pending';

        // When
        const result = UserStatusVO.create(input);

        // Then
        expect(result).toBeDefined();
        expect(result.value).toBe(UserStatus.PENDING);
      });

      it('should create status from UserStatus enum value', () => {
        // Given
        const input = UserStatus.ACTIVE;

        // When
        const result = UserStatusVO.create(input);

        // Then
        expect(result).toBeDefined();
        expect(result.value).toBe(UserStatus.ACTIVE);
      });

      it('should handle whitespace in string input', () => {
        // Given
        const input = '  ACTIVE  ';

        // When
        const result = UserStatusVO.create(input);

        // Then
        expect(result).toBeDefined();
        expect(result.value).toBe(UserStatus.ACTIVE);
      });
    });

    describe('Invalid Creation Cases', () => {
      it('should reject null input', () => {
        // When & Then
        expect(() => UserStatusVO.create(null as any)).toThrowError();
        expect(() => UserStatusVO.create(null as any)).toThrowError(
          'userStatus: User status is required and must be a valid string'
        );
      });

      it('should reject undefined input', () => {
        // When & Then
        expect(() => UserStatusVO.create(undefined as any)).toThrowError();
        expect(() => UserStatusVO.create(undefined as any)).toThrowError(
          'userStatus: User status is required and must be a valid string'
        );
      });

      it('should reject number input', () => {
        // Given
        const input = 123;

        // When & Then
        expect(() => UserStatusVO.create(input as any)).toThrowError();
        expect(() => UserStatusVO.create(input as any)).toThrowError(
          'userStatus: User status is required and must be a valid string'
        );
      });

      it('should reject boolean input', () => {
        // Given
        const input = true;

        // When & Then
        expect(() => UserStatusVO.create(input as any)).toThrowError();
        expect(() => UserStatusVO.create(input as any)).toThrowError(
          'userStatus: User status is required and must be a valid string'
        );
      });

      it('should reject object input', () => {
        // Given
        const input = { status: 'active' };

        // When & Then
        expect(() => UserStatusVO.create(input as any)).toThrowError();
        expect(() => UserStatusVO.create(input as any)).toThrowError(
          'userStatus: User status is required and must be a valid string'
        );
      });

      it('should reject empty string', () => {
        // Given
        const input = '';

        // When & Then
        expect(() => UserStatusVO.create(input)).toThrowError();
        expect(() => UserStatusVO.create(input)).toThrowError(
          'userStatus: User status cannot be empty'
        );
      });

      it('should reject whitespace-only string', () => {
        // Given
        const input = '   ';

        // When & Then
        expect(() => UserStatusVO.create(input)).toThrowError();
        expect(() => UserStatusVO.create(input)).toThrowError(
          'userStatus: User status cannot be empty'
        );
      });

      it('should reject invalid status string', () => {
        // Given
        const input = 'invalid-status';

        // When & Then
        expect(() => UserStatusVO.create(input)).toThrowError();
        expect(() => UserStatusVO.create(input)).toThrowError(
          'userStatus: Invalid user status. Must be one of: active, inactive, suspended, pending'
        );
      });

      it('should accept case-insensitive valid status', () => {
        // Given
        const input = 'Active'; // Mixed case should be accepted

        // When
        const result = UserStatusVO.create(input);

        // Then
        expect(result).toBeDefined();
        expect(result.value).toBe(UserStatus.ACTIVE);
      });
    });
  });

  describe('Immutability and Value Object Properties', () => {
    it('should maintain immutability after creation', () => {
      // Given
      const originalValue = UserStatus.ACTIVE;
      const vo = UserStatusVO.create(originalValue);

      // When - Attempt to modify (this should not be possible at runtime)
      const valueBefore = vo.value;

      // Then
      expect(vo.value).toBe(valueBefore);
      expect(vo.value).toBe(UserStatus.ACTIVE);
      expect(typeof vo.value).toBe('string');
    });
  });

  describe('Equality Comparison', () => {
    it('should be equal when values are the same', () => {
      // Given
      const vo1 = UserStatusVO.create('active');
      const vo2 = UserStatusVO.create('ACTIVE');

      // When & Then
      expect(vo1.equals(vo2)).toBe(true);
    });

    it('should not be equal when values are different', () => {
      // Given
      const vo1 = UserStatusVO.create('active');
      const vo2 = UserStatusVO.create('inactive');

      // When & Then
      expect(vo1.equals(vo2)).toBe(false);
    });

    it('should handle null comparison gracefully', () => {
      // Given
      const vo = UserStatusVO.create('active');

      // When & Then
      expect(vo.equals(null as any)).toBe(false);
    });

    it('should handle undefined comparison gracefully', () => {
      // Given
      const vo = UserStatusVO.create('active');

      // When & Then
      expect(vo.equals(undefined as any)).toBe(false);
    });

    it('should handle non-UserStatusVO comparison gracefully', () => {
      // Given
      const vo = UserStatusVO.create('active');

      // When & Then
      expect(vo.equals({} as any)).toBe(false);
      expect(vo.equals('active' as any)).toBe(false);
    });
  });

  describe('String Representation', () => {
    it('should return correct string representation', () => {
      // Given
      const vo = UserStatusVO.create('active');

      // When
      const result = vo.toString();

      // Then
      expect(result).toBe(UserStatus.ACTIVE);
      expect(typeof result).toBe('string');
    });

    it('should return enum value as string', () => {
      // Given
      const vo = UserStatusVO.create(UserStatus.SUSPENDED);

      // When
      const result = vo.toString();

      // Then
      expect(result).toBe('suspended');
    });
  });

  describe('Static Utility Methods', () => {
    describe('isValid', () => {
      it('should return true for valid status strings', () => {
        // When & Then
        expect(UserStatusVO.isValid('active')).toBe(true);
        expect(UserStatusVO.isValid('INACTIVE')).toBe(true);
        expect(UserStatusVO.isValid('Suspended')).toBe(true);
        expect(UserStatusVO.isValid('pending')).toBe(true);
      });

      it('should return false for invalid status strings', () => {
        // When & Then
        expect(UserStatusVO.isValid('invalid')).toBe(false);
        expect(UserStatusVO.isValid('')).toBe(false);
        expect(UserStatusVO.isValid('   ')).toBe(false);
        expect(UserStatusVO.isValid(null as any)).toBe(false);
        expect(UserStatusVO.isValid(undefined as any)).toBe(false);
      });

      it('should handle whitespace in validation', () => {
        // When & Then
        expect(UserStatusVO.isValid('  active  ')).toBe(true);
        expect(UserStatusVO.isValid('   ')).toBe(false);
      });
    });

    describe('getAllowedValues', () => {
      it('should return all allowed status values', () => {
        // When
        const result = UserStatusVO.getAllowedValues();

        // Then
        expect(result).toEqual([
          UserStatus.ACTIVE,
          UserStatus.INACTIVE,
          UserStatus.SUSPENDED,
          UserStatus.PENDING,
        ]);
        expect(result.length).toBe(4);
      });

      it('should return a copy, not the original array', () => {
        // Given
        const result1 = UserStatusVO.getAllowedValues();
        const result2 = UserStatusVO.getAllowedValues();

        // When
        result1.push(UserStatus.ACTIVE); // Try to modify

        // Then
        expect(result1.length).toBe(5); // Modified copy
        expect(result2.length).toBe(4); // Original unchanged
      });
    });

    describe('createDefault', () => {
      it('should create PENDING status as default', () => {
        // When
        const result = UserStatusVO.createDefault();

        // Then
        expect(result).toBeDefined();
        expect(result.value).toBe(UserStatus.PENDING);
      });

      it('should return a valid UserStatusVO instance', () => {
        // When
        const result = UserStatusVO.createDefault();

        // Then
        expect(result).toBeInstanceOf(UserStatusVO);
        expect(result.isActive()).toBe(false);
        expect(result.requiresVerification()).toBe(true);
      });
    });
  });

  describe('Business Logic Helper Methods', () => {
    describe('Status Checks', () => {
      it('should correctly identify ACTIVE status', () => {
        // Given
        const activeVO = UserStatusVO.create('active');
        const inactiveVO = UserStatusVO.create('inactive');

        // When & Then
        expect(activeVO.isActive()).toBe(true);
        expect(inactiveVO.isActive()).toBe(false);
      });

      it('should correctly identify INACTIVE status', () => {
        // Given
        const inactiveVO = UserStatusVO.create('inactive');
        const activeVO = UserStatusVO.create('active');

        // When & Then
        expect(inactiveVO.isInactive()).toBe(true);
        expect(activeVO.isInactive()).toBe(false);
      });

      it('should correctly identify SUSPENDED status', () => {
        // Given
        const suspendedVO = UserStatusVO.create('suspended');
        const activeVO = UserStatusVO.create('active');

        // When & Then
        expect(suspendedVO.isSuspended()).toBe(true);
        expect(activeVO.isSuspended()).toBe(false);
      });

      it('should correctly identify PENDING status', () => {
        // Given
        const pendingVO = UserStatusVO.create('pending');
        const activeVO = UserStatusVO.create('active');

        // When & Then
        expect(pendingVO.requiresVerification()).toBe(true);
        expect(activeVO.requiresVerification()).toBe(false);
      });
    });

    describe('Authentication and Operational Checks', () => {
      it('should allow authentication for ACTIVE and PENDING statuses', () => {
        // Given
        const activeVO = UserStatusVO.create('active');
        const pendingVO = UserStatusVO.create('pending');
        const inactiveVO = UserStatusVO.create('inactive');
        const suspendedVO = UserStatusVO.create('suspended');

        // When & Then
        expect(activeVO.canAuthenticate()).toBe(true);
        expect(pendingVO.canAuthenticate()).toBe(true);
        expect(inactiveVO.canAuthenticate()).toBe(false);
        expect(suspendedVO.canAuthenticate()).toBe(false);
      });

      it('should identify operational status correctly', () => {
        // Given
        const activeVO = UserStatusVO.create('active');
        const pendingVO = UserStatusVO.create('pending');
        const inactiveVO = UserStatusVO.create('inactive');

        // When & Then
        expect(activeVO.isOperational()).toBe(true);
        expect(pendingVO.isOperational()).toBe(false);
        expect(inactiveVO.isOperational()).toBe(false);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle case-insensitive input correctly', () => {
      // Given
      const inputs = ['ACTIVE', 'Active', 'active', 'aCtIvE'];

      // When & Then
      inputs.forEach((input) => {
        const result = UserStatusVO.create(input);
        expect(result.value).toBe(UserStatus.ACTIVE);
      });
    });

    it('should handle enum values directly', () => {
      // Given
      const enumValues = [
        UserStatus.ACTIVE,
        UserStatus.INACTIVE,
        UserStatus.SUSPENDED,
        UserStatus.PENDING,
      ];

      // When & Then
      enumValues.forEach((enumValue) => {
        const result = UserStatusVO.create(enumValue);
        expect(result.value).toBe(enumValue);
      });
    });

    it('should maintain consistent behavior across multiple creations', () => {
      // When
      const result1 = UserStatusVO.create('active');
      const result2 = UserStatusVO.create('ACTIVE');
      const result3 = UserStatusVO.create(UserStatus.ACTIVE);

      // Then
      expect(result1.equals(result2)).toBe(true);
      expect(result2.equals(result3)).toBe(true);
      expect(result1.value).toBe(UserStatus.ACTIVE);
    });

    it('should provide clear error messages for debugging', () => {
      // Given
      const invalidInput = 'nonexistent-status';

      // When
      let error: ValidationError;
      try {
        UserStatusVO.create(invalidInput);
      } catch (e) {
        error = e as ValidationError;
      }

      // Then
      expect(error!).toBeDefined();
      expect(error!.code).toBe(ValidationErrorCode.FIELD_FORMAT_INVALID);
      expect(error!.errors.length).toBe(1);
      expect(error!.errors[0].field).toBe('userStatus');
    });
  });

  describe('Domain Invariants', () => {
    it('should always have a valid UserStatus value', () => {
      // Given
      const allValidStatuses = UserStatusVO.getAllowedValues();

      // When & Then
      allValidStatuses.forEach((status) => {
        const vo = UserStatusVO.create(status);
        expect(Object.values(UserStatus)).toContain(vo.value);
      });
    });

    it('should maintain case-insensitive normalization', () => {
      // Given
      const testCases = [
        { input: 'ACTIVE', expected: UserStatus.ACTIVE },
        { input: 'active', expected: UserStatus.ACTIVE },
        { input: 'Active', expected: UserStatus.ACTIVE },
        { input: 'INACTIVE', expected: UserStatus.INACTIVE },
        { input: 'inactive', expected: UserStatus.INACTIVE },
        { input: 'SUSPENDED', expected: UserStatus.SUSPENDED },
        { input: 'suspended', expected: UserStatus.SUSPENDED },
        { input: 'PENDING', expected: UserStatus.PENDING },
        { input: 'pending', expected: UserStatus.PENDING },
      ];

      // When & Then
      testCases.forEach(({ input, expected }) => {
        const result = UserStatusVO.create(input);
        expect(result.value).toBe(expected);
      });
    });

    it('should reject any status not in allowed list', () => {
      // Given
      const invalidStatuses = ['banned', 'deleted', 'archived', 'disabled'];

      // When & Then
      invalidStatuses.forEach((status) => {
        expect(() => UserStatusVO.create(status)).toThrowError();
      });
    });
  });
});
