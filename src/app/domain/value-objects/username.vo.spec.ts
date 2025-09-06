import { Username } from './username.vo';
import { ValidationError } from '../errors/validation-error.entity';
import { ValidationErrorCode } from '../errors/validation-error-code.enum';

describe('Username - Domain Tests', () => {
  describe('Value Object Creation and Validation', () => {
    describe('Valid Creation Cases', () => {
      it('should create username with minimum length', () => {
        // Given
        const input = 'abc';

        // When
        const result = Username.create(input);

        // Then
        expect(result).toBeDefined();
        expect(result.value).toBe('abc');
      });

      it('should create username with maximum length', () => {
        // Given
        const input = 'a'.repeat(32);

        // When
        const result = Username.create(input);

        // Then
        expect(result).toBeDefined();
        expect(result.value).toBe('a'.repeat(32));
        expect(result.getLength()).toBe(32);
      });

      it('should create username with alphanumeric characters', () => {
        // Given
        const input = 'john_doe123';

        // When
        const result = Username.create(input);

        // Then
        expect(result).toBeDefined();
        expect(result.value).toBe('john_doe123');
      });

      it('should create username with underscores', () => {
        // Given
        const input = 'user_name';

        // When
        const result = Username.create(input);

        // Then
        expect(result).toBeDefined();
        expect(result.value).toBe('user_name');
      });

      it('should normalize input by trimming whitespace', () => {
        // Given
        const input = '  john_doe  ';

        // When
        const result = Username.create(input);

        // Then
        expect(result).toBeDefined();
        expect(result.value).toBe('john_doe');
      });

      it('should normalize input to lowercase', () => {
        // Given
        const input = 'JOHN_DOE';

        // When
        const result = Username.create(input);

        // Then
        expect(result).toBeDefined();
        expect(result.value).toBe('john_doe');
      });

      it('should handle mixed case and whitespace normalization', () => {
        // Given
        const input = '  John_Doe  ';

        // When
        const result = Username.create(input);

        // Then
        expect(result).toBeDefined();
        expect(result.value).toBe('john_doe');
      });
    });

    describe('Invalid Creation Cases', () => {
      it('should reject null input', () => {
        // When & Then
        expect(() => Username.create(null as any)).toThrowError();
        expect(() => Username.create(null as any)).toThrowError('username: username is required');
      });

      it('should reject undefined input', () => {
        // When & Then
        expect(() => Username.create(undefined as any)).toThrowError();
        expect(() => Username.create(undefined as any)).toThrowError(
          'username: username is required'
        );
      });

      it('should reject non-string input', () => {
        // Given
        const inputs = [123, {}, [], true];

        // When & Then
        inputs.forEach((input) => {
          expect(() => Username.create(input as any)).toThrowError();
          expect(() => Username.create(input as any)).toThrowError(
            'username: username is required'
          );
        });
      });

      it('should reject empty string', () => {
        // Given
        const input = '';

        // When & Then
        expect(() => Username.create(input)).toThrowError();
        expect(() => Username.create(input)).toThrowError('username: username is required');
      });

      it('should reject whitespace-only string', () => {
        // Given
        const input = '   ';

        // When & Then
        expect(() => Username.create(input)).toThrowError();
        expect(() => Username.create(input)).toThrowError(
          'username: Username must be at least 3 characters; username: Username must be alphanumeric or underscore'
        );
      });

      it('should reject username too short', () => {
        // Given
        const inputs = ['a', 'ab', 'x', '1'];

        // When & Then
        inputs.forEach((input) => {
          expect(() => Username.create(input)).toThrowError();
          expect(() => Username.create(input)).toThrowError(
            'username: Username must be at least 3 characters'
          );
        });
      });

      it('should reject username too long', () => {
        // Given
        const input = 'a'.repeat(33);

        // When & Then
        expect(() => Username.create(input)).toThrowError();
        expect(() => Username.create(input)).toThrowError(
          'username: Username must be at most 32 characters'
        );
      });

      it('should reject username with invalid characters', () => {
        // Given
        const inputs = ['john-doe', 'john.doe', 'john@doe', 'john doe', 'john!doe'];

        // When & Then
        inputs.forEach((input) => {
          expect(() => Username.create(input)).toThrowError();
          expect(() => Username.create(input)).toThrowError(
            'username: Username must be alphanumeric or underscore'
          );
        });
      });

      it('should handle multiple validation errors', () => {
        // Given
        const input = 'a!'; // Too short + invalid character

        // When & Then
        expect(() => Username.create(input)).toThrowError();
        try {
          Username.create(input);
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).errors.length).toBe(2);
          expect((error as ValidationError).errors[0].field).toBe('username');
          expect((error as ValidationError).errors[1].field).toBe('username');
        }
      });
    });
  });

  describe('Equality Comparison', () => {
    it('should be equal when values are the same', () => {
      // Given
      const username1 = Username.create('john_doe');
      const username2 = Username.create('JOHN_DOE');

      // When & Then
      expect(username1.equals(username2)).toBe(true);
    });

    it('should not be equal when values are different', () => {
      // Given
      const username1 = Username.create('john_doe');
      const username2 = Username.create('jane_doe');

      // When & Then
      expect(username1.equals(username2)).toBe(false);
    });

    it('should handle null comparison gracefully', () => {
      // Given
      const username = Username.create('john_doe');

      // When & Then
      expect(username.equals(null as any)).toBe(false);
    });

    it('should handle undefined comparison gracefully', () => {
      // Given
      const username = Username.create('john_doe');

      // When & Then
      expect(username.equals(undefined as any)).toBe(false);
    });

    it('should handle non-Username comparison gracefully', () => {
      // Given
      const username = Username.create('john_doe');

      // When & Then
      expect(username.equals({} as any)).toBe(false);
      expect(username.equals('john_doe' as any)).toBe(false);
      expect(username.equals(123 as any)).toBe(false);
    });
  });

  describe('String Representation', () => {
    it('should return correct string representation', () => {
      // Given
      const username = Username.create('john_doe');

      // When
      const result = username.toString();

      // Then
      expect(result).toBe('john_doe');
      expect(typeof result).toBe('string');
    });

    it('should return normalized value in toString', () => {
      // Given
      const username = Username.create('  JOHN_DOE  ');

      // When
      const result = username.toString();

      // Then
      expect(result).toBe('john_doe');
    });
  });

  describe('Length Operations', () => {
    it('should return correct length for various usernames', () => {
      // Given
      const testCases = [
        { input: 'abc', expected: 3 },
        { input: 'john_doe', expected: 8 },
        { input: 'a'.repeat(32), expected: 32 },
        { input: 'user_123', expected: 8 },
      ];

      // When & Then
      testCases.forEach(({ input, expected }) => {
        const username = Username.create(input);
        expect(username.getLength()).toBe(expected);
      });
    });
  });

  describe('Domain Invariants', () => {
    it('should always have a valid normalized string value', () => {
      // Given
      const testInputs = ['john_doe', 'user123', 'test_user', 'a'.repeat(32), 'ABC123'];

      // When & Then
      testInputs.forEach((input) => {
        const username = Username.create(input);
        expect(typeof username.value).toBe('string');
        expect(username.value).toBe(input.trim().toLowerCase());
        expect(username.value.length).toBeGreaterThanOrEqual(3);
        expect(username.value.length).toBeLessThanOrEqual(32);
        expect(/^\w+$/.test(username.value)).toBe(true);
      });
    });

    it('should reject any input that violates domain rules', () => {
      // Given
      const invalidInputs = [
        '', // Empty
        '   ', // Whitespace only
        'ab', // Too short
        'a'.repeat(33), // Too long
        'john-doe', // Invalid character
        null, // Null
        undefined, // Undefined
        123, // Number
        {}, // Object
        [], // Array
        true, // Boolean
      ];

      // When & Then
      invalidInputs.forEach((input) => {
        expect(() => Username.create(input as any)).toThrow();
      });
    });
  });
});
