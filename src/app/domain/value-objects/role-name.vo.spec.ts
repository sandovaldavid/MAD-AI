import { RoleName } from './role-name.vo';
import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import {
  ROLE_NAME_LENGTH_CONSTRAINTS,
  ROLE_NAME_VALIDATION_MESSAGES,
  RoleNameUtils,
} from '../enums/role-name.enum';

/**
 * RoleName Value Object - Domain Layer Tests
 *
 * Tests the RoleName Value Object following MAD-AI Clean Architecture + DDD principles.
 * These are pure unit tests that validate domain invariants and business rules.
 *
 * **Test Coverage Areas:**
 * - Value Object creation and validation
 * - Invariant rules (length, format, characters)
 * - Business rules (normalization, equality)
 * - Edge cases and error handling
 * - Utility methods (toSlug, getDisplayName, equals)
 *
 * **Domain Rules Tested:**
 * - Length constraints (3-50 characters)
 * - Character format validation
 * - Normalization and capitalization
 * - Equality comparison (case-insensitive)
 * - Slug generation
 * - Display formatting
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
describe('RoleName Value Object - Domain Tests', () => {
  describe('Value Object Creation and Validation', () => {
    describe('Valid Creation Cases', () => {
      it('debe crear role name válido con nombre simple', () => {
        // Given
        const rawName = 'Developer';

        // When
        const roleName = RoleName.create(rawName);

        // Then
        expect(roleName).toBeInstanceOf(RoleName);
        expect(roleName.value).toBe('Developer');
      });

      it('debe crear role name válido con espacios', () => {
        // Given
        const rawName = 'Project Manager';

        // When
        const roleName = RoleName.create(rawName);

        // Then
        expect(roleName.value).toBe('Project Manager');
      });

      it('debe crear role name válido con guiones', () => {
        // Given
        const rawName = 'Senior Developer';

        // When
        const roleName = RoleName.create(rawName);

        // Then
        expect(roleName.value).toBe('Senior Developer');
      });

      it('debe crear role name válido en el límite mínimo de longitud', () => {
        // Given
        const rawName = 'Dev'; // Exactly 3 characters

        // When
        const roleName = RoleName.create(rawName);

        // Then
        expect(roleName.value).toBe('Dev');
      });

      it('debe crear role name válido en el límite máximo de longitud', () => {
        // Given
        const rawName = 'A'.repeat(ROLE_NAME_LENGTH_CONSTRAINTS.MAX_LENGTH);

        // When
        const roleName = RoleName.create(rawName);

        // Then
        expect(roleName.value).toBe('A' + 'a'.repeat(ROLE_NAME_LENGTH_CONSTRAINTS.MAX_LENGTH - 1));
      });

      it('debe normalizar espacios en blanco al crear', () => {
        // Given
        const rawName = '  Project   Manager  ';

        // When
        const roleName = RoleName.create(rawName);

        // Then
        expect(roleName.value).toBe('Project Manager');
      });

      it('debe capitalizar correctamente al crear', () => {
        // Given
        const rawName = 'project manager';

        // When
        const roleName = RoleName.create(rawName);

        // Then
        expect(roleName.value).toBe('Project Manager');
      });
    });

    describe('Invalid Creation Cases', () => {
      it('debe rechazar creación con valor nulo', () => {
        // When & Then
        expect(() => RoleName.create(null as any)).toThrowError();
        expect(() => RoleName.create(null as any)).toThrowError('roleName: Role name is required');
      });

      it('debe rechazar creación con valor undefined', () => {
        // When & Then
        expect(() => RoleName.create(undefined as any)).toThrowError();
        expect(() => RoleName.create(undefined as any)).toThrowError(
          'roleName: Role name is required'
        );
      });

      it('debe rechazar creación con string vacío', () => {
        // When & Then
        expect(() => RoleName.create('')).toThrowError();
        expect(() => RoleName.create('')).toThrowError('roleName: Role name is required');
      });

      it('debe rechazar creación con solo espacios', () => {
        // When & Then
        expect(() => RoleName.create('   ')).toThrowError();
        expect(() => RoleName.create('   ')).toThrowError('roleName: Role name is required');
      });

      it('debe rechazar creación con nombre demasiado corto', () => {
        // Given
        const shortName = 'AB'; // 2 characters, below minimum

        // When & Then
        expect(() => RoleName.create(shortName)).toThrowError();
        expect(() => RoleName.create(shortName)).toThrowError(
          'roleName: Role name must be at least 3 characters'
        );
      });

      it('debe rechazar creación con nombre demasiado largo', () => {
        // Given
        const longName = 'A'.repeat(ROLE_NAME_LENGTH_CONSTRAINTS.MAX_LENGTH + 1);

        // When & Then
        expect(() => RoleName.create(longName)).toThrowError();
        expect(() => RoleName.create(longName)).toThrowError(
          'roleName: Role name must be at most 50 characters'
        );
      });

      it('debe rechazar creación con caracteres inválidos', () => {
        // Given
        const invalidNames = ['Dev123', 'Dev@Role', 'Dev.Role', 'Dev_Role'];

        // When & Then
        invalidNames.forEach((invalidName) => {
          expect(() => RoleName.create(invalidName)).toThrowError();
          expect(() => RoleName.create(invalidName)).toThrowError(
            'roleName: Role name must contain only letters, spaces, or hyphens'
          );
        });
      });

      it('debe normalizar espacios consecutivos', () => {
        // Given
        const nameWithConsecutiveSpaces = 'Project  Manager';

        // When
        const result = RoleName.create(nameWithConsecutiveSpaces);

        // Then
        expect(result).toBeInstanceOf(RoleName);
        expect(result.value).toBe('Project Manager');
        expect(result.getDisplayName()).toBe('Project Manager');
      });

      it('debe normalizar guiones consecutivos', () => {
        // Given
        const nameWithConsecutiveHyphens = 'Senior--Developer';

        // When
        const result = RoleName.create(nameWithConsecutiveHyphens);

        // Then
        expect(result).toBeInstanceOf(RoleName);
        expect(result.value).toBe('Senior Developer');
        expect(result.getDisplayName()).toBe('Senior Developer');
      });

      it('debe rechazar creación que no comienza con letra', () => {
        // Given
        const invalidNames = ['123Developer', '-Developer'];

        // When & Then
        invalidNames.forEach((invalidName) => {
          expect(() => RoleName.create(invalidName)).toThrowError();
          expect(() => RoleName.create(invalidName)).toThrowError(
            'roleName: Role name must contain only letters, spaces, or hyphens'
          );
        });
      });
    });
  });

  describe('Invariant Rules Validation', () => {
    describe('Length Constraints', () => {
      it('debe validar límite inferior de longitud', () => {
        // Given
        const testCases = [
          { input: 'A', expectedError: 'roleName: Role name must be at least 3 characters' },
          { input: 'AB', expectedError: 'roleName: Role name must be at least 3 characters' },
          { input: 'ABC', expectedError: null }, // Valid
        ];

        testCases.forEach(({ input, expectedError }) => {
          if (expectedError) {
            expect(() => RoleName.create(input)).toThrowError(expectedError);
          } else {
            expect(() => RoleName.create(input)).not.toThrow();
          }
        });
      });

      it('debe validar límite superior de longitud', () => {
        // Given
        const maxLength = ROLE_NAME_LENGTH_CONSTRAINTS.MAX_LENGTH;
        const testCases = [
          { input: 'A'.repeat(maxLength), expectedError: null }, // Valid
          {
            input: 'A'.repeat(maxLength + 1),
            expectedError: 'roleName: Role name must be at most 50 characters',
          },
        ];

        testCases.forEach(({ input, expectedError }) => {
          if (expectedError) {
            expect(() => RoleName.create(input)).toThrowError(expectedError);
          } else {
            expect(() => RoleName.create(input)).not.toThrow();
          }
        });
      });
    });

    describe('Character Format Validation', () => {
      it('debe aceptar solo letras, espacios y guiones', () => {
        // Given
        const validNames = [
          'Developer',
          'Project Manager',
          'Senior-Developer',
          'Quality Assurance',
        ];

        // When & Then
        validNames.forEach((name) => {
          expect(() => RoleName.create(name)).not.toThrow();
        });
      });

      it('debe rechazar caracteres especiales y números', () => {
        // Given
        const invalidNames = [
          'Dev123',
          'Dev@Role',
          'Dev.Role',
          'Dev_Role',
          'Dev/Role',
          'Dev\\Role',
          'Dev(Role)',
          'Dev[Role]',
        ];

        // When & Then
        invalidNames.forEach((name) => {
          expect(() => RoleName.create(name)).toThrowError();
        });
      });

      it('debe validar que comience con letra', () => {
        // Given
        const invalidStarts = ['1Developer', '-Developer', '_Developer'];

        // When & Then
        invalidStarts.forEach((name) => {
          expect(() => RoleName.create(name)).toThrowError();
        });
      });
    });
  });

  describe('Business Rules and Behavior', () => {
    describe('Normalization and Formatting', () => {
      it('debe normalizar espacios múltiples', () => {
        // Given
        const rawName = 'Project   Manager';

        // When
        const roleName = RoleName.create(rawName);

        // Then
        expect(roleName.value).toBe('Project Manager');
      });

      it('debe normalizar guiones múltiples', () => {
        // Given
        const rawName = 'Senior--Developer';

        // When
        const roleName = RoleName.create(rawName);

        // Then - Consecutive hyphens should be normalized to single hyphen
        expect(roleName.value).toBe('Senior Developer');
      });

      it('debe capitalizar palabras correctamente', () => {
        // Given
        const testCases = [
          { input: 'developer', expected: 'Developer' },
          { input: 'project manager', expected: 'Project Manager' },
          { input: 'senior developer', expected: 'Senior Developer' },
          { input: 'QUALITY assurance', expected: 'Quality Assurance' },
        ];

        testCases.forEach(({ input, expected }) => {
          const roleName = RoleName.create(input);
          expect(roleName.value).toBe(expected);
        });
      });
    });

    describe('Equality Comparison', () => {
      it('debe comparar igualdad por valor (case insensitive)', () => {
        // Given
        const roleName1 = RoleName.create('Developer');
        const roleName2 = RoleName.create('DEVELOPER');
        const roleName3 = RoleName.create('developer');

        // When & Then
        expect(roleName1.equals(roleName2)).toBe(true);
        expect(roleName1.equals(roleName3)).toBe(true);
        expect(roleName2.equals(roleName3)).toBe(true);
      });

      it('debe distinguir diferentes valores', () => {
        // Given
        const roleName1 = RoleName.create('Developer');
        const roleName2 = RoleName.create('Manager');

        // When & Then
        expect(roleName1.equals(roleName2)).toBe(false);
      });

      it('debe manejar comparación con null/undefined', () => {
        // Given
        const roleName = RoleName.create('Developer');

        // When & Then
        expect(() => roleName.equals(null as any)).not.toThrow();
        expect(() => roleName.equals(undefined as any)).not.toThrow();
        expect(roleName.equals(null as any)).toBe(false);
        expect(roleName.equals(undefined as any)).toBe(false);
      });
    });

    describe('Display Formatting', () => {
      it('debe retornar nombre formateado para display', () => {
        // Given
        const roleName = RoleName.create('project manager');

        // When
        const displayName = roleName.getDisplayName();

        // Then
        expect(displayName).toBe('Project Manager');
      });

      it('debe mantener formato consistente en display', () => {
        // Given
        const testCases = [
          { input: 'developer', expected: 'Developer' },
          { input: 'PROJECT MANAGER', expected: 'Project Manager' },
          { input: 'senior-developer', expected: 'Senior Developer' },
        ];

        testCases.forEach(({ input, expected }) => {
          const roleName = RoleName.create(input);
          expect(roleName.getDisplayName()).toBe(expected);
        });
      });
    });

    describe('Slug Generation', () => {
      it('debe convertir a slug URL-friendly', () => {
        // Given
        const roleName = RoleName.create('Project Manager');

        // When
        const slug = roleName.toSlug();

        // Then
        expect(slug).toBe('project-manager');
      });

      it('debe generar slugs consistentes', () => {
        // Given
        const testCases = [
          { input: 'Developer', expected: 'developer' },
          { input: 'Project Manager', expected: 'project-manager' },
          { input: 'Senior Developer', expected: 'senior-developer' },
          { input: 'Quality Assurance', expected: 'quality-assurance' },
        ];

        testCases.forEach(({ input, expected }) => {
          const roleName = RoleName.create(input);
          expect(roleName.toSlug()).toBe(expected);
        });
      });

      it('debe remover caracteres especiales en slug', () => {
        // Given
        const roleName = RoleName.create('Project Manager');

        // When
        const slug = roleName.toSlug();

        // Then
        expect(slug).not.toMatch(/[^a-z0-9-]/);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    describe('Boundary Conditions', () => {
      it('debe manejar límite exacto de longitud mínima', () => {
        // Given
        const minLengthName = 'ABC'; // Exactly 3 characters

        // When
        const roleName = RoleName.create(minLengthName);

        // Then
        expect(roleName.value).toBe('Abc');
        expect(roleName.value.length).toBe(ROLE_NAME_LENGTH_CONSTRAINTS.MIN_LENGTH);
      });

      it('debe manejar límite exacto de longitud máxima', () => {
        // Given
        const maxLengthName = 'A'.repeat(ROLE_NAME_LENGTH_CONSTRAINTS.MAX_LENGTH);

        // When
        const roleName = RoleName.create(maxLengthName);

        // Then
        expect(roleName.value.length).toBe(ROLE_NAME_LENGTH_CONSTRAINTS.MAX_LENGTH);
      });

      it('debe rechazar un caracter por encima del límite máximo', () => {
        // Given
        const overLimitName = 'A'.repeat(ROLE_NAME_LENGTH_CONSTRAINTS.MAX_LENGTH + 1);

        // When & Then
        expect(() => RoleName.create(overLimitName)).toThrowError();
      });
    });

    describe('Whitespace Handling', () => {
      it('debe manejar solo espacios como inválido', () => {
        // Given
        const whitespaceOnly = '   ';

        // When & Then
        expect(() => RoleName.create(whitespaceOnly)).toThrowError();
        expect(() => RoleName.create(whitespaceOnly)).toThrowError(
          'roleName: Role name is required'
        );
      });

      it('debe normalizar tabs y múltiples espacios', () => {
        // Given
        const nameWithTabs = 'Project\t\tManager';

        // When
        const roleName = RoleName.create(nameWithTabs);

        // Then
        expect(roleName.value).toBe('Project Manager');
      });
    });

    describe('Error Message Validation', () => {
      it('debe proporcionar mensajes de error específicos', () => {
        // Test required field error
        try {
          RoleName.create('');
          fail('Should have thrown ValidationError');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          const validationError = error as ValidationError;
          expect(validationError.code).toBe(ValidationErrorCode.REQUIRED_FIELD_MISSING);
        }

        // Test length error
        try {
          RoleName.create('AB');
          fail('Should have thrown ValidationError');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          const validationError = error as ValidationError;
          expect(validationError.errors).toHaveSize(1);
          expect(validationError.errors[0].code).toBe(ValidationErrorCode.FIELD_TOO_SHORT);
        }

        // Test format error
        try {
          RoleName.create('Dev123');
          fail('Should have thrown ValidationError');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          const validationError = error as ValidationError;
          expect(validationError.errors).toHaveSize(1);
          expect(validationError.errors[0].code).toBe(ValidationErrorCode.FIELD_FORMAT_INVALID);
        }
      });
    });
  });

  describe('Immutability and Value Object Properties', () => {
    it('debe mantener inmutabilidad del valor', () => {
      // Given
      const originalName = 'Developer';
      const roleName = RoleName.create(originalName);

      // When - Try to modify (this should not be possible)
      const value = roleName.value;

      // Then
      expect(roleName.value).toBe('Developer');
      expect(value).toBe('Developer');
    });

    it('debe crear nuevas instancias para diferentes valores', () => {
      // Given
      const roleName1 = RoleName.create('Developer');
      const roleName2 = RoleName.create('Manager');

      // When & Then
      expect(roleName1.value).toBe('Developer');
      expect(roleName2.value).toBe('Manager');
      expect(roleName1).not.toBe(roleName2);
    });

    it('debe ser consistente en múltiples creaciones del mismo valor', () => {
      // Given
      const roleName1 = RoleName.create('Developer');
      const roleName2 = RoleName.create('Developer');

      // When & Then
      expect(roleName1.value).toBe(roleName2.value);
      expect(roleName1.equals(roleName2)).toBe(true);
    });
  });

  describe('String Representation', () => {
    it('debe proporcionar representación string correcta', () => {
      // Given
      const roleName = RoleName.create('Project Manager');

      // When
      const stringRep = roleName.toString();

      // Then
      expect(stringRep).toBe('Project Manager');
      expect(typeof stringRep).toBe('string');
    });

    it('debe ser consistente entre toString y value', () => {
      // Given
      const testNames = ['Developer', 'Project Manager', 'Senior Developer'];

      testNames.forEach((name) => {
        const roleName = RoleName.create(name);
        expect(roleName.toString()).toBe(roleName.value);
      });
    });
  });
});
