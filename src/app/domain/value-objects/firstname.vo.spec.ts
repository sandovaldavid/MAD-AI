import { FirstName } from './firstname.vo';
import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';

/**
 * FirstName Value Object - Domain Layer Tests
 *
 * Tests unitarios puros que validan:
 * - Reglas de negocio para nombres propios
 * - Inmutabilidad del Value Object
 * - Validaciones de creación y formato
 * - Comportamiento de comparación por valor
 */
describe('FirstName Value Object - Domain Tests', () => {
  describe('Creación y Validación', () => {
    describe('Casos válidos', () => {
      it('debe crear FirstName válido con nombre simple', () => {
        // Given
        const rawName = 'Juan';

        // When
        const firstName = FirstName.create(rawName);

        // Then
        expect(firstName).toBeInstanceOf(FirstName);
        expect(firstName.value).toBe('Juan');
      });

      it('debe crear FirstName válido con nombre compuesto', () => {
        // Given
        const rawName = 'María José';

        // When
        const firstName = FirstName.create(rawName);

        // Then
        expect(firstName.value).toBe('María José');
      });

      it('debe crear FirstName válido con nombre con guión', () => {
        // Given
        const rawName = 'Jean-Pierre';

        // When
        const firstName = FirstName.create(rawName);

        // Then
        expect(firstName.value).toBe('Jean-Pierre');
      });

      it('debe normalizar espacios en blanco', () => {
        // Given
        const rawName = '  Juan  ';

        // When
        const firstName = FirstName.create(rawName);

        // Then
        expect(firstName.value).toBe('Juan');
      });

      it('debe aplicar capitalización correcta', () => {
        // Given
        const rawName = 'juan carlos';

        // When
        const firstName = FirstName.create(rawName);

        // Then
        expect(firstName.value).toBe('Juan Carlos');
      });

      it('debe manejar nombres con mayúsculas mixtas', () => {
        // Given
        const rawName = 'mARÍA dEL cARMEN';

        // When
        const firstName = FirstName.create(rawName);

        // Then
        expect(firstName.value).toBe('María Del Carmen');
      });
    });

    describe('Casos inválidos', () => {
      it('debe rechazar valor nulo', () => {
        // Given
        const rawName = null as any;

        // When & Then
        try {
          FirstName.create(rawName);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.REQUIRED_FIELD_MISSING);
          expect((error as ValidationError).hasFieldError('firstName')).toBe(true);
        }
      });

      it('debe rechazar valor undefined', () => {
        // Given
        const rawName = undefined as any;

        // When & Then
        try {
          FirstName.create(rawName);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.REQUIRED_FIELD_MISSING);
          expect((error as ValidationError).hasFieldError('firstName')).toBe(true);
        }
      });

      it('debe rechazar string vacío', () => {
        // Given
        const rawName = '';

        // When & Then
        try {
          FirstName.create(rawName);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.REQUIRED_FIELD_MISSING);
          expect((error as ValidationError).hasFieldError('firstName')).toBe(true);
        }
      });

      it('debe rechazar solo espacios en blanco', () => {
        // Given
        const rawName = '   ';

        // When & Then
        try {
          FirstName.create(rawName);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.REQUIRED_FIELD_MISSING);
          expect((error as ValidationError).hasFieldError('firstName')).toBe(true);
        }
      });

      it('debe rechazar nombre demasiado largo', () => {
        // Given
        const rawName = 'a'.repeat(51); // Más de 50 caracteres

        // When & Then
        try {
          FirstName.create(rawName);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.FIELD_TOO_LONG);
          expect((error as ValidationError).hasFieldError('firstName')).toBe(true);
        }
      });

      it('debe rechazar caracteres especiales', () => {
        // Given - caracteres especiales que NO están permitidos
        const specialChars = ['Juan$%', 'María&', 'José*', 'Ana+', 'Pedro='];

        // When & Then
        specialChars.forEach((specialChar) => {
          try {
            FirstName.create(specialChar);
            fail(`Expected ValidationError to be thrown for: ${specialChar}`);
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).code).toBe(ValidationErrorCode.FIELD_FORMAT_INVALID);
            expect((error as ValidationError).hasFieldError('firstName')).toBe(true);
          }
        });
      });

      it('debe rechazar números', () => {
        // Given
        const rawName = 'Juan2';

        // When & Then
        try {
          FirstName.create(rawName);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.FIELD_FORMAT_INVALID);
          expect((error as ValidationError).hasFieldError('firstName')).toBe(true);
        }
      });

      it('debe rechazar caracteres especiales no permitidos', () => {
        // Given
        const invalidNames = ['Juan_Pérez', 'María.González', 'José/Pérez'];

        // When & Then
        invalidNames.forEach((invalidName) => {
          try {
            FirstName.create(invalidName);
            fail(`Expected ValidationError to be thrown for: ${invalidName}`);
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).code).toBe(ValidationErrorCode.FIELD_FORMAT_INVALID);
            expect((error as ValidationError).hasFieldError('firstName')).toBe(true);
          }
        });
      });
    });

    describe('Casos límite', () => {
      it('debe aceptar nombre con exactamente 50 caracteres', () => {
        // Given
        const rawName = 'a'.repeat(50);

        // When
        const firstName = FirstName.create(rawName);

        // Then
        expect(firstName.value).toBe('A' + 'a'.repeat(49)); // First letter capitalized
        expect(firstName.getLength()).toBe(50);
      });

      it('debe rechazar nombre con 51 caracteres', () => {
        // Given
        const rawName = 'a'.repeat(51);

        // When & Then
        try {
          FirstName.create(rawName);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.FIELD_TOO_LONG);
          expect((error as ValidationError).hasFieldError('firstName')).toBe(true);
        }
      });

      it('debe aceptar nombre con un solo carácter válido', () => {
        // Given
        const rawName = 'A';

        // When
        const firstName = FirstName.create(rawName);

        // Then
        expect(firstName.value).toBe('A');
      });

      it('debe manejar nombres con múltiples espacios consecutivos', () => {
        // Given
        const rawName = 'María    José';

        // When
        const firstName = FirstName.create(rawName);

        // Then
        expect(firstName.value).toBe('María José');
      });
    });
  });

  describe('Inmutabilidad', () => {
    it('debe ser inmutable después de la creación', () => {
      // Given
      const firstName = FirstName.create('Juan');

      // When & Then - TypeScript getter prevents assignment
      expect(() => {
        (firstName as any).value = 'Pedro';
      }).toThrow(); // Assignment to getter should fail

      // Verify value didn't change
      expect(firstName.value).toBe('Juan');
    });

    it('debe mantener el mismo valor en múltiples accesos', () => {
      // Given
      const firstName = FirstName.create('María');

      // When
      const value1 = firstName.value;
      const value2 = firstName.value;
      const value3 = firstName.toString();

      // Then
      expect(value1).toBe('María');
      expect(value2).toBe('María');
      expect(value3).toBe('María');
      expect(value1).toBe(value2);
      expect(value2).toBe(value3);
    });
  });

  describe('Comparación por Valor', () => {
    it('debe ser igual a otro FirstName con el mismo valor', () => {
      // Given
      const firstName1 = FirstName.create('Juan');
      const firstName2 = FirstName.create('Juan');

      // When & Then
      expect(firstName1.equals(firstName2)).toBe(true);
      expect(firstName2.equals(firstName1)).toBe(true);
    });

    it('debe ser diferente a otro FirstName con valor diferente', () => {
      // Given
      const firstName1 = FirstName.create('Juan');
      const firstName2 = FirstName.create('Pedro');

      // When & Then
      expect(firstName1.equals(firstName2)).toBe(false);
      expect(firstName2.equals(firstName1)).toBe(false);
    });

    it('debe ser igual cuando la capitalización normalizada es la misma', () => {
      // Given
      const firstName1 = FirstName.create('Juan');
      const firstName2 = FirstName.create('JUAN');

      // When & Then
      expect(firstName1.equals(firstName2)).toBe(true); // Both become 'Juan'
    });

    it('debe manejar comparación con null', () => {
      // Given
      const firstName = FirstName.create('Juan');

      // When & Then
      expect(firstName.equals(null as any)).toBe(false);
    });

    it('debe manejar comparación con undefined', () => {
      // Given
      const firstName = FirstName.create('Juan');

      // When & Then
      expect(firstName.equals(undefined as any)).toBe(false);
    });

    it('debe manejar comparación con objeto que no es FirstName', () => {
      // Given
      const firstName = FirstName.create('Juan');

      // When & Then
      expect(firstName.equals({ value: 'Juan' } as any)).toBe(false);
    });
  });

  describe('Métodos de Utilidad', () => {
    describe('getLength()', () => {
      it('debe retornar la longitud correcta del nombre', () => {
        // Given
        const firstName = FirstName.create('María');

        // When
        const length = firstName.getLength();

        // Then
        expect(length).toBe(5);
      });

      it('debe retornar longitud correcta para nombres compuestos', () => {
        // Given
        const firstName = FirstName.create('María José');

        // When
        const length = firstName.getLength();

        // Then
        expect(length).toBe(10);
      });

      it('debe retornar longitud correcta para nombres con guión', () => {
        // Given
        const firstName = FirstName.create('Jean-Pierre');

        // When
        const length = firstName.getLength();

        // Then
        expect(length).toBe(11);
      });
    });

    describe('toString()', () => {
      it('debe retornar el valor como string', () => {
        // Given
        const firstName = FirstName.create('Juan');

        // When
        const stringValue = firstName.toString();

        // Then
        expect(stringValue).toBe('Juan');
        expect(typeof stringValue).toBe('string');
      });

      it('debe ser equivalente al acceso directo al valor', () => {
        // Given
        const firstName = FirstName.create('María');

        // When & Then
        expect(firstName.toString()).toBe(firstName.value);
      });
    });
  });

  describe('Formateo Invariante', () => {
    it('debe mantener formateo consistente en múltiples creaciones', () => {
      // Given
      const inputs = ['juan', 'JUAN', 'JuAn', '  juan  '];
      const expected = 'Juan';

      // When & Then
      inputs.forEach((input) => {
        const firstName = FirstName.create(input);
        expect(firstName.value).toBe(expected);
      });
    });

    it('debe formatear correctamente nombres compuestos', () => {
      // Given
      const testCases = [
        { input: 'maría josé', expected: 'María José' },
        { input: 'jean-pierre', expected: 'Jean-Pierre' },
        { input: 'ANA MARÍA', expected: 'Ana María' },
        { input: 'luis alberto', expected: 'Luis Alberto' },
      ];

      // When & Then
      testCases.forEach(({ input, expected }) => {
        const firstName = FirstName.create(input);
        expect(firstName.value).toBe(expected);
      });
    });

    it('debe preservar espacios y guiones en posiciones correctas', () => {
      // Given
      const input = 'maría-josé ana';
      const expected = 'María-José Ana';

      // When
      const firstName = FirstName.create(input);

      // Then
      expect(firstName.value).toBe(expected);
    });
  });

  describe('Invariantes del Dominio', () => {
    it('debe mantener que el valor nunca es vacío después de creación', () => {
      // Given
      const firstName = FirstName.create('Juan');

      // When & Then
      expect(firstName.value.length).toBeGreaterThan(0);
      expect(firstName.value.trim()).toBe(firstName.value);
    });

    it('debe mantener que el valor tiene formato válido', () => {
      // Given
      const firstName = FirstName.create('María José');

      // When & Then
      expect(firstName.value).toMatch(/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]*(?:[- ][A-ZÁÉÍÓÚÑ][a-záéíóúñ]*)*$/);
    });

    it('debe mantener que la longitud está dentro de límites', () => {
      // Given
      const firstName = FirstName.create('Juan');

      // When & Then
      expect(firstName.getLength()).toBeGreaterThan(0);
      expect(firstName.getLength()).toBeLessThanOrEqual(50);
    });
  });
});
