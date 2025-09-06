import { UserNotificationPreferencesVO } from './user-notification-preferences.vo';
import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';

/**
 * UserNotificationPreferencesVO - Domain Layer Tests
 *
 * Tests the UserNotificationPreferencesVO Value Object following MAD-AI Clean Architecture + DDD principles.
 * These are pure unit tests that validate domain invariants and business rules.
 *
 * **Test Coverage Areas:**
 * - Value Object creation and validation
 * - Invariant rules (required fields, data types)
 * - Immutability and equality comparison
 * - Edge cases and error handling
 * - Data transformation methods
 *
 * **Domain Rules Tested:**
 * - All three preferences (email, system, task) are required
 * - All preferences must be boolean values
 * - Input must be a valid object
 * - Value Object is immutable after creation
 * - Equality comparison works correctly
 * - Data transformation preserves integrity
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
describe('UserNotificationPreferencesVO - Domain Tests', () => {
  describe('Value Object Creation and Validation', () => {
    describe('Valid Creation Cases', () => {
      it('debe crear VO válido con todas las preferencias true', () => {
        // Given
        const validData = {
          email: true,
          system: true,
          task: true,
        };

        // When
        const preferences = UserNotificationPreferencesVO.create(validData);

        // Then
        expect(preferences).toBeInstanceOf(UserNotificationPreferencesVO);
        expect(preferences.email).toBe(true);
        expect(preferences.system).toBe(true);
        expect(preferences.task).toBe(true);
      });

      it('debe crear VO válido con todas las preferencias false', () => {
        // Given
        const validData = {
          email: false,
          system: false,
          task: false,
        };

        // When
        const preferences = UserNotificationPreferencesVO.create(validData);

        // Then
        expect(preferences).toBeInstanceOf(UserNotificationPreferencesVO);
        expect(preferences.email).toBe(false);
        expect(preferences.system).toBe(false);
        expect(preferences.task).toBe(false);
      });

      it('debe crear VO válido con preferencias mixtas', () => {
        // Given
        const validData = {
          email: true,
          system: false,
          task: true,
        };

        // When
        const preferences = UserNotificationPreferencesVO.create(validData);

        // Then
        expect(preferences).toBeInstanceOf(UserNotificationPreferencesVO);
        expect(preferences.email).toBe(true);
        expect(preferences.system).toBe(false);
        expect(preferences.task).toBe(true);
      });
    });

    describe('Invalid Creation Cases', () => {
      it('debe rechazar creación con input null', () => {
        // When & Then
        expect(() => UserNotificationPreferencesVO.create(null)).toThrowError();
        expect(() => UserNotificationPreferencesVO.create(null)).toThrowError(
          'Preferences must be an object'
        );
      });

      it('debe rechazar creación con input undefined', () => {
        // When & Then
        expect(() => UserNotificationPreferencesVO.create(undefined)).toThrowError();
        expect(() => UserNotificationPreferencesVO.create(undefined)).toThrowError(
          'Preferences must be an object'
        );
      });

      it('debe rechazar creación con input no objeto', () => {
        // Given
        const invalidInputs = ['string', 123, true];

        // When & Then
        invalidInputs.forEach((input) => {
          expect(() => UserNotificationPreferencesVO.create(input)).toThrowError();
          expect(() => UserNotificationPreferencesVO.create(input)).toThrowError(
            'Preferences must be an object'
          );
        });
      });

      it('debe rechazar creación sin campo email', () => {
        // Given
        const invalidData = {
          system: true,
          task: false,
        };

        // When & Then
        expect(() => UserNotificationPreferencesVO.create(invalidData)).toThrowError();
        expect(() => UserNotificationPreferencesVO.create(invalidData)).toThrowError(
          'email: email is required'
        );
      });

      it('debe rechazar creación sin campo system', () => {
        // Given
        const invalidData = {
          email: true,
          task: false,
        };

        // When & Then
        expect(() => UserNotificationPreferencesVO.create(invalidData)).toThrowError();
        expect(() => UserNotificationPreferencesVO.create(invalidData)).toThrowError(
          'system: system is required'
        );
      });

      it('debe rechazar creación sin campo task', () => {
        // Given
        const invalidData = {
          email: true,
          system: false,
        };

        // When & Then
        expect(() => UserNotificationPreferencesVO.create(invalidData)).toThrowError();
        expect(() => UserNotificationPreferencesVO.create(invalidData)).toThrowError(
          'task: task is required'
        );
      });

      it('debe rechazar creación con email no boolean', () => {
        // Given
        const invalidData = {
          email: 'true',
          system: true,
          task: false,
        };

        // When & Then
        expect(() => UserNotificationPreferencesVO.create(invalidData)).toThrowError();
        expect(() => UserNotificationPreferencesVO.create(invalidData)).toThrowError(
          'email: email must be a boolean'
        );
      });

      it('debe rechazar creación con system no boolean', () => {
        // Given
        const invalidData = {
          email: true,
          system: 1,
          task: false,
        };

        // When & Then
        expect(() => UserNotificationPreferencesVO.create(invalidData)).toThrowError();
        expect(() => UserNotificationPreferencesVO.create(invalidData)).toThrowError(
          'system: system must be a boolean'
        );
      });

      it('debe rechazar creación con task no boolean', () => {
        // Given
        const invalidData = {
          email: true,
          system: true,
          task: null,
        };

        // When & Then
        expect(() => UserNotificationPreferencesVO.create(invalidData)).toThrowError();
        expect(() => UserNotificationPreferencesVO.create(invalidData)).toThrowError(
          'task: task must be a boolean'
        );
      });

      it('debe rechazar creación con múltiples errores de validación', () => {
        // Given
        const invalidData = {
          email: 'invalid',
          system: 'also invalid',
          task: 123,
        };

        // When & Then
        expect(() => UserNotificationPreferencesVO.create(invalidData)).toThrowError();
        try {
          UserNotificationPreferencesVO.create(invalidData);
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).errors.length).toBe(3);
        }
      });
    });
  });

  describe('Immutability and Value Object Properties', () => {
    it('debe mantener inmutabilidad después de creación', () => {
      // Given
      const originalData = {
        email: true,
        system: false,
        task: true,
      };
      const preferences = UserNotificationPreferencesVO.create(originalData);

      // When - Intentar modificar (esto no debería ser posible)
      const emailValue = preferences.email;
      const systemValue = preferences.system;
      const taskValue = preferences.task;

      // Then
      expect(preferences.email).toBe(true);
      expect(preferences.system).toBe(false);
      expect(preferences.task).toBe(true);
      expect(emailValue).toBe(true);
      expect(systemValue).toBe(false);
      expect(taskValue).toBe(true);
    });

    it('debe crear nuevas instancias para diferentes valores', () => {
      // Given
      const preferences1 = UserNotificationPreferencesVO.create({
        email: true,
        system: true,
        task: true,
      });
      const preferences2 = UserNotificationPreferencesVO.create({
        email: false,
        system: false,
        task: false,
      });

      // When & Then
      expect(preferences1.email).toBe(true);
      expect(preferences2.email).toBe(false);
      expect(preferences1).not.toBe(preferences2);
    });

    it('debe ser consistente en múltiples creaciones del mismo valor', () => {
      // Given
      const data = {
        email: true,
        system: false,
        task: true,
      };
      const preferences1 = UserNotificationPreferencesVO.create(data);
      const preferences2 = UserNotificationPreferencesVO.create(data);

      // When & Then
      expect(preferences1.email).toBe(preferences2.email);
      expect(preferences1.system).toBe(preferences2.system);
      expect(preferences1.task).toBe(preferences2.task);
      expect(preferences1.equals(preferences2)).toBe(true);
    });
  });

  describe('Equality Comparison', () => {
    it('debe comparar igualdad correctamente cuando todos los valores son iguales', () => {
      // Given
      const preferences1 = UserNotificationPreferencesVO.create({
        email: true,
        system: false,
        task: true,
      });
      const preferences2 = UserNotificationPreferencesVO.create({
        email: true,
        system: false,
        task: true,
      });

      // When & Then
      expect(preferences1.equals(preferences2)).toBe(true);
      expect(preferences2.equals(preferences1)).toBe(true);
    });

    it('debe distinguir cuando email es diferente', () => {
      // Given
      const preferences1 = UserNotificationPreferencesVO.create({
        email: true,
        system: false,
        task: true,
      });
      const preferences2 = UserNotificationPreferencesVO.create({
        email: false,
        system: false,
        task: true,
      });

      // When & Then
      expect(preferences1.equals(preferences2)).toBe(false);
    });

    it('debe distinguir cuando system es diferente', () => {
      // Given
      const preferences1 = UserNotificationPreferencesVO.create({
        email: true,
        system: false,
        task: true,
      });
      const preferences2 = UserNotificationPreferencesVO.create({
        email: true,
        system: true,
        task: true,
      });

      // When & Then
      expect(preferences1.equals(preferences2)).toBe(false);
    });

    it('debe distinguir cuando task es diferente', () => {
      // Given
      const preferences1 = UserNotificationPreferencesVO.create({
        email: true,
        system: false,
        task: true,
      });
      const preferences2 = UserNotificationPreferencesVO.create({
        email: true,
        system: false,
        task: false,
      });

      // When & Then
      expect(preferences1.equals(preferences2)).toBe(false);
    });

    it('debe manejar comparación con null/undefined', () => {
      // Given
      const preferences = UserNotificationPreferencesVO.create({
        email: true,
        system: false,
        task: true,
      });

      // When & Then
      expect(() => preferences.equals(null as any)).not.toThrow();
      expect(() => preferences.equals(undefined as any)).not.toThrow();
      expect(preferences.equals(null as any)).toBe(false);
      expect(preferences.equals(undefined as any)).toBe(false);
    });
  });

  describe('Data Transformation', () => {
    it('debe convertir a objeto plano correctamente', () => {
      // Given
      const originalData = {
        email: true,
        system: false,
        task: true,
      };
      const preferences = UserNotificationPreferencesVO.create(originalData);

      // When
      const result = preferences.toObject();

      // Then
      expect(result).toEqual(originalData);
      expect(result.email).toBe(true);
      expect(result.system).toBe(false);
      expect(result.task).toBe(true);
    });

    it('debe preservar integridad de datos en transformación', () => {
      // Given
      const preferences = UserNotificationPreferencesVO.create({
        email: false,
        system: true,
        task: false,
      });

      // When
      const result = preferences.toObject();

      // Then
      expect(result.email).toBe(false);
      expect(result.system).toBe(true);
      expect(result.task).toBe(false);
      expect(Object.keys(result).length).toBe(3);
      expect(result.email).toBeDefined();
      expect(result.system).toBeDefined();
      expect(result.task).toBeDefined();
    });

    it('debe retornar nuevo objeto en cada llamada a toObject', () => {
      // Given
      const preferences = UserNotificationPreferencesVO.create({
        email: true,
        system: true,
        task: true,
      });

      // When
      const result1 = preferences.toObject();
      const result2 = preferences.toObject();

      // Then
      expect(result1).toEqual(result2);
      expect(result1).not.toBe(result2); // Different object references
    });
  });

  describe('Edge Cases and Error Handling', () => {
    describe('Boundary Conditions', () => {
      it('debe manejar objetos vacíos correctamente', () => {
        // Given
        const emptyObject = {};

        // When & Then
        expect(() => UserNotificationPreferencesVO.create(emptyObject)).toThrowError();
        expect(() => UserNotificationPreferencesVO.create(emptyObject)).toThrowError(
          'email: email is required; system: system is required; task: task is required'
        );
      });

      it('debe manejar objetos con campos adicionales', () => {
        // Given
        const dataWithExtras = {
          email: true,
          system: false,
          task: true,
          extraField: 'ignored',
          anotherField: 123,
        };

        // When
        const preferences = UserNotificationPreferencesVO.create(dataWithExtras);

        // Then
        expect(preferences.email).toBe(true);
        expect(preferences.system).toBe(false);
        expect(preferences.task).toBe(true);
        // Extra fields should be ignored
        expect((preferences as any).extraField).toBeUndefined();
      });
    });

    describe('Type Validation', () => {
      it('debe rechazar valores truthy no boolean', () => {
        // Given
        const truthyValues = [1, 'true', {}, []];

        // When & Then
        truthyValues.forEach((value) => {
          const invalidData = {
            email: value,
            system: true,
            task: false,
          };
          expect(() => UserNotificationPreferencesVO.create(invalidData)).toThrowError();
        });
      });

      it('debe rechazar valores falsy no boolean', () => {
        // Given
        const falsyValues = [0, '', NaN];

        // When & Then
        falsyValues.forEach((value) => {
          const invalidData = {
            email: value,
            system: true,
            task: false,
          };
          expect(() => UserNotificationPreferencesVO.create(invalidData)).toThrowError();
        });
      });
    });

    describe('Error Message Validation', () => {
      it('debe proporcionar mensajes de error específicos y útiles', () => {
        // Test null input error
        try {
          UserNotificationPreferencesVO.create(null);
          fail('Should have thrown ValidationError');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          const validationError = error as ValidationError;
          expect(validationError.code).toBe(ValidationErrorCode.FIELD_FORMAT_INVALID);
          expect(validationError.errors).toHaveSize(1);
          expect(validationError.errors[0].message).toContain('Preferences must be an object');
        }

        // Test missing field error
        try {
          UserNotificationPreferencesVO.create({ email: true, system: false });
          fail('Should have thrown ValidationError');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          const validationError = error as ValidationError;
          expect(validationError.errors.some((e) => e.message.includes('task is required'))).toBe(
            true
          );
        }

        // Test type error
        try {
          UserNotificationPreferencesVO.create({
            email: 'true',
            system: true,
            task: false,
          });
          fail('Should have thrown ValidationError');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          const validationError = error as ValidationError;
          expect(
            validationError.errors.some((e) => e.message.includes('email must be a boolean'))
          ).toBe(true);
        }
      });
    });
  });
});
