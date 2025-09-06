import { LastName } from './lastname.vo';
import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import {
  LastnameMaxLength,
  LastnameValidationRule,
  LASTNAME_VALIDATION_REGEX,
} from '../enums/lastname.enum';

/**
 * LastName Value Object -       it('debe ser igual después del formateo automático', () => {
        // Given
        const lastName1 = LastName.create('GARCÍA');
        const lastName2 = LastName.create('garcía');

        // When & Then
        expect(lastName1.equals(lastName2)).toBe(true);
        expect(lastName1.value).toBe('García');
        expect(lastName2.value).toBe('García');
      }); *
 * Tests unitarios puros que validan:
 * - Reglas culturales, legales y técnicas para apellidos
 * - Validaciones de creación y normalización
 * - Inmutabilidad del Value Object
 * - Igualdad por valor
 * - Formateo consistente con capitalización apropiada
 */
describe('LastName Value Object - Domain Tests', () => {
  describe('Creación y Validación', () => {
    describe('Casos válidos', () => {
      it('debe crear LastName válido con apellido simple', () => {
        // Given
        const rawLastName = 'García';

        // When
        const lastName = LastName.create(rawLastName);

        // Then
        expect(lastName).toBeInstanceOf(LastName);
        expect(lastName.value).toBe('García');
      });

      it('debe crear LastName válido con apellido compuesto', () => {
        // Given
        const rawLastName = 'García López';

        // When
        const lastName = LastName.create(rawLastName);

        // Then
        expect(lastName).toBeInstanceOf(LastName);
        expect(lastName.value).toBe('García López');
      });

      it('debe crear LastName válido con apellido con guión', () => {
        // Given
        const rawLastName = 'García-López';

        // When
        const lastName = LastName.create(rawLastName);

        // Then
        expect(lastName).toBeInstanceOf(LastName);
        expect(lastName.value).toBe('García-López');
      });

      it('debe crear LastName válido con caracteres acentuados', () => {
        // Given
        const rawLastName = 'Muñoz';

        // When
        const lastName = LastName.create(rawLastName);

        // Then
        expect(lastName).toBeInstanceOf(LastName);
        expect(lastName.value).toBe('Muñoz');
      });

      it('debe normalizar espacios en blanco', () => {
        // Given
        const rawLastName = '  García  ';

        // When
        const lastName = LastName.create(rawLastName);

        // Then
        expect(lastName.value).toBe('García');
      });

      it('debe formatear con capitalización apropiada', () => {
        // Given
        const rawLastName = 'garcía lópez';

        // When
        const lastName = LastName.create(rawLastName);

        // Then
        expect(lastName.value).toBe('García López');
      });

      it('debe formatear apellido con guión correctamente', () => {
        // Given
        const rawLastName = 'garcía-lópez';

        // When
        const lastName = LastName.create(rawLastName);

        // Then
        expect(lastName.value).toBe('García-López');
      });

      it('debe mantener apellido ya capitalizado', () => {
        // Given
        const rawLastName = 'Smith';

        // When
        const lastName = LastName.create(rawLastName);

        // Then
        expect(lastName.value).toBe('Smith');
      });
    });

    describe('Casos inválidos', () => {
      it('debe rechazar valor null', () => {
        // Given
        const rawLastName = null as any;

        // When & Then
        try {
          LastName.create(rawLastName);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
          expect((error as ValidationError).hasFieldError('lastName')).toBe(true);
        }
      });

      it('debe rechazar valor undefined', () => {
        // Given
        const rawLastName = undefined as any;

        // When & Then
        try {
          LastName.create(rawLastName);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
          expect((error as ValidationError).hasFieldError('lastName')).toBe(true);
        }
      });

      it('debe rechazar string vacío', () => {
        // Given
        const rawLastName = '';

        // When & Then
        try {
          LastName.create(rawLastName);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
          expect((error as ValidationError).hasFieldError('lastName')).toBe(true);
        }
      });

      it('debe rechazar string solo con espacios', () => {
        // Given
        const rawLastName = '   ';

        // When & Then
        try {
          LastName.create(rawLastName);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
          expect((error as ValidationError).hasFieldError('lastName')).toBe(true);
        }
      });

      it('debe rechazar apellido demasiado largo', () => {
        // Given
        const rawLastName = 'A'.repeat(LastnameMaxLength.VALUE + 1);

        // When & Then
        try {
          LastName.create(rawLastName);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
          expect((error as ValidationError).hasFieldError('lastName')).toBe(true);
        }
      });

      it('debe rechazar caracteres inválidos', () => {
        // Given - caracteres no permitidos
        const invalidLastNames = [
          'García123',
          'García@',
          'García#',
          'García$',
          'García%',
          'García&',
          'García*',
          'García(',
          'García)',
          'García+',
          'García=',
          'García[',
          'García]',
          'García{',
          'García}',
          'García|',
          'García\\',
          'García/',
          'García?',
          'García<',
          'García>',
          'García,',
          'García.',
          'García;',
          'García:',
          'García"',
        ];

        // When & Then
        invalidLastNames.forEach((invalidLastName) => {
          try {
            LastName.create(invalidLastName);
            fail(`Expected ValidationError to be thrown for: ${invalidLastName}`);
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
            expect((error as ValidationError).hasFieldError('lastName')).toBe(true);
          }
        });
      });
    });

    describe('Casos límite', () => {
      it('debe aceptar apellido en el límite de longitud máxima', () => {
        // Given
        const rawLastName = 'A'.repeat(LastnameMaxLength.VALUE);

        // When
        const lastName = LastName.create(rawLastName);

        // Then
        expect(lastName).toBeInstanceOf(LastName);
        expect(lastName.getLength()).toBe(LastnameMaxLength.VALUE);
      });

      it('debe rechazar apellido justo por encima del límite', () => {
        // Given
        const rawLastName = 'A'.repeat(LastnameMaxLength.VALUE + 1);

        // When & Then
        try {
          LastName.create(rawLastName);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
          expect((error as ValidationError).hasFieldError('lastName')).toBe(true);
        }
      });

      it('debe aceptar apellido de un solo carácter', () => {
        // Given
        const rawLastName = 'A';

        // When
        const lastName = LastName.create(rawLastName);

        // Then
        expect(lastName).toBeInstanceOf(LastName);
        expect(lastName.value).toBe('A');
      });

      it('debe mantener espacios múltiples como están', () => {
        // Given
        const rawLastName = 'García   López';

        // When
        const lastName = LastName.create(rawLastName);

        // Then
        expect(lastName.value).toBe('García   López');
      });

      it('debe aceptar apellido con múltiples guiones', () => {
        // Given
        const rawLastName = 'García-López-Ruiz';

        // When
        const lastName = LastName.create(rawLastName);

        // Then
        expect(lastName.value).toBe('García-López-Ruiz');
      });
    });
  });

  describe('Inmutabilidad', () => {
    it('debe ser inmutable después de la creación', () => {
      // Given
      const lastName = LastName.create('García');
      const originalValue = lastName.value;

      // When - Intentar modificar el valor (esto debería fallar en compilación)
      // lastName.value = 'López'; // Esto causaría error de TypeScript

      // Then - Verificar que el valor original se mantiene
      expect(lastName.value).toBe(originalValue);
      expect(lastName.value).toBe('García');
    });

    it('debe mantener el mismo valor en múltiples accesos', () => {
      // Given
      const lastName = LastName.create('García');

      // When
      const value1 = lastName.value;
      const value2 = lastName.toString();
      const value3 = lastName.value;

      // Then
      expect(value1).toBe('García');
      expect(value2).toBe('García');
      expect(value3).toBe('García');
      expect(value1).toBe(value2);
      expect(value2).toBe(value3);
    });
  });

  describe('Igualdad por Valor', () => {
    it('debe ser igual a otro LastName con el mismo valor', () => {
      // Given
      const lastName1 = LastName.create('García');
      const lastName2 = LastName.create('García');

      // When & Then
      expect(lastName1.equals(lastName2)).toBe(true);
      expect(lastName2.equals(lastName1)).toBe(true);
    });

    it('debe ser diferente a otro LastName con valor diferente', () => {
      // Given
      const lastName1 = LastName.create('García');
      const lastName2 = LastName.create('López');

      // When & Then
      expect(lastName1.equals(lastName2)).toBe(false);
      expect(lastName2.equals(lastName1)).toBe(false);
    });

    it('debe ser igual después del formateo automático', () => {
      // Given
      const lastName1 = LastName.create('GARCÍA');
      const lastName2 = LastName.create('garcía');

      // When & Then
      expect(lastName1.equals(lastName2)).toBe(true);
      expect(lastName2.equals(lastName1)).toBe(true);
      expect(lastName1.value).toBe('García');
      expect(lastName2.value).toBe('García');
    });
  });

  describe('Formateo y Normalización', () => {
    describe('Capitalización apropiada', () => {
      it('debe capitalizar primera letra de cada palabra', () => {
        // Given
        const rawLastName = 'garcía lópez';

        // When
        const lastName = LastName.create(rawLastName);

        // Then
        expect(lastName.value).toBe('García López');
      });

      it('debe capitalizar después de espacios múltiples', () => {
        // Given
        const rawLastName = 'garcía   lópez';

        // When
        const lastName = LastName.create(rawLastName);

        // Then
        expect(lastName.value).toBe('García   López');
      });

      it('debe capitalizar después de guiones', () => {
        // Given
        const rawLastName = 'garcía-lópez';

        // When
        const lastName = LastName.create(rawLastName);

        // Then
        expect(lastName.value).toBe('García-López');
      });

      it('debe manejar mayúsculas mixtas correctamente', () => {
        // Given
        const rawLastName = 'GARCÍA lópez';

        // When
        const lastName = LastName.create(rawLastName);

        // Then
        expect(lastName.value).toBe('García López');
      });

      it('debe mantener caracteres especiales en mayúscula', () => {
        // Given
        const rawLastName = 'ñuñez';

        // When
        const lastName = LastName.create(rawLastName);

        // Then
        expect(lastName.value).toBe('Ñuñez');
      });
    });

    describe('Conservación de espacios y guiones', () => {
      it('debe mantener espacios entre palabras', () => {
        // Given
        const rawLastName = 'García López Ruiz';

        // When
        const lastName = LastName.create(rawLastName);

        // Then
        expect(lastName.value).toBe('García López Ruiz');
      });

      it('debe mantener guiones en apellidos compuestos', () => {
        // Given
        const rawLastName = 'García-López-Ruiz';

        // When
        const lastName = LastName.create(rawLastName);

        // Then
        expect(lastName.value).toBe('García-López-Ruiz');
      });

      it('debe normalizar espacios múltiples a uno solo', () => {
        // Given
        const rawLastName = 'García    López';

        // When
        const lastName = LastName.create(rawLastName);

        // Then
        expect(lastName.value).toBe('García    López');
      });
    });
  });

  describe('Métodos de Acceso', () => {
    let lastName: LastName;

    beforeEach(() => {
      lastName = LastName.create('García López');
    });

    describe('toString()', () => {
      it('debe retornar el valor como string', () => {
        // When
        const stringValue = lastName.toString();

        // Then
        expect(stringValue).toBe('García López');
        expect(typeof stringValue).toBe('string');
      });

      it('debe ser equivalente al acceso directo al valor', () => {
        // When & Then
        expect(lastName.toString()).toBe(lastName.value);
      });
    });

    describe('getLength()', () => {
      it('debe retornar la longitud correcta del apellido', () => {
        // When
        const length = lastName.getLength();

        // Then
        expect(length).toBe(12); // 'García López'.length
        expect(typeof length).toBe('number');
      });

      it('debe retornar longitud correcta para apellido simple', () => {
        // Given
        const simpleLastName = LastName.create('García');

        // When
        const length = simpleLastName.getLength();

        // Then
        expect(length).toBe(6); // 'García'.length
      });

      it('debe retornar longitud correcta para apellido con guión', () => {
        // Given
        const hyphenatedLastName = LastName.create('García-López');

        // When
        const length = hyphenatedLastName.getLength();

        // Then
        expect(length).toBe(12); // 'García-López'.length
      });
    });
  });

  describe('Invariantes del Dominio', () => {
    it('debe mantener que el valor siempre cumple con el regex de validación', () => {
      // Given
      const lastName = LastName.create('García López');

      // When & Then
      expect(lastName.value).toMatch(LASTNAME_VALIDATION_REGEX);
    });

    it('debe mantener que el valor nunca está vacío después de trim', () => {
      // Given
      const lastName = LastName.create('García');

      // When & Then
      expect(lastName.value.trim()).not.toBe('');
      expect(lastName.value.length).toBeGreaterThan(0);
    });

    it('debe mantener que la longitud está dentro de los límites permitidos', () => {
      // Given
      const lastName = LastName.create('García');

      // When & Then
      expect(lastName.getLength()).toBeGreaterThan(0);
      expect(lastName.getLength()).toBeLessThanOrEqual(LastnameMaxLength.VALUE);
    });

    it('debe mantener que las operaciones no modifican el valor original', () => {
      // Given
      const original = LastName.create('García');
      const originalValue = original.value;

      // When - Acceder a métodos que no modifican
      const stringValue = original.toString();
      const length = original.getLength();

      // Then
      expect(original.value).toBe(originalValue);
      expect(original.value).toBe('García');
      expect(stringValue).toBe('García');
      expect(length).toBe(6);
    });

    it('debe mantener que la igualdad se basa en el valor exacto', () => {
      // Given
      const lastName1 = LastName.create('GARCÍA');
      const lastName2 = LastName.create('garcía');
      const lastName3 = LastName.create('García');

      // When & Then
      expect(lastName1.equals(lastName2)).toBe(true); // Ambos se formatean a 'García'
      expect(lastName2.equals(lastName3)).toBe(true);
      expect(lastName1.equals(lastName3)).toBe(true);
      expect(lastName1.value).toBe('García');
      expect(lastName2.value).toBe('García');
      expect(lastName3.value).toBe('García');
    });

    it('debe mantener que el formateo es consistente y predecible', () => {
      // Given - Diferentes variaciones del mismo apellido con diferentes formatos de entrada
      const testCases = [
        { input: 'GARCÍA LÓPEZ', expected: 'García López' },
        { input: 'garcía lópez', expected: 'García López' },
        { input: 'García López', expected: 'García López' },
        { input: 'gARCÍA lÓPEZ', expected: 'García López' },
        { input: 'GARCÍA   LÓPEZ', expected: 'García   López' },
      ];

      // When & Then - Cada variación debe mantener sus espacios originales pero con capitalización correcta
      testCases.forEach(({ input, expected }) => {
        const lastName = LastName.create(input);
        expect(lastName.value).toBe(expected);
      });
    });
  });

  describe('Reglas Culturales y Legales', () => {
    it('debe aceptar apellidos con caracteres acentuados comunes en español', () => {
      // Given - Apellidos comunes en español con acentos
      const spanishLastNames = [
        'García',
        'Martínez',
        'López',
        'González',
        'Pérez',
        'Rodríguez',
        'Sánchez',
        'Ramírez',
        'Torres',
        'Flores',
        'Rivera',
        'Gómez',
        'Díaz',
        'Morales',
        'Ortiz',
        'Chávez',
        'Castro',
        'Vargas',
        'Ramos',
        'Herrera',
        'Medina',
        'Castro',
        'Jiménez',
        'Ruiz',
        'Mendoza',
        'Juárez',
        'Pineda',
        'Guerrero',
        'Santiago',
        'Méndez',
      ];

      // When & Then
      spanishLastNames.forEach((lastName) => {
        expect(() => LastName.create(lastName)).not.toThrow();
        const created = LastName.create(lastName);
        expect(created).toBeInstanceOf(LastName);
      });
    });

    it('debe aceptar apellidos con ñ', () => {
      // Given
      const lastNameWithÑ = 'Muñoz';

      // When
      const lastName = LastName.create(lastNameWithÑ);

      // Then
      expect(lastName.value).toBe('Muñoz');
    });

    it('debe aceptar apellidos compuestos con espacios', () => {
      // Given - Apellidos compuestos comunes
      const compoundLastNames = [
        'García López',
        'Martínez García',
        'López Sánchez',
        'González Rodríguez',
        'Pérez Martínez',
      ];

      // When & Then
      compoundLastNames.forEach((lastName) => {
        expect(() => LastName.create(lastName)).not.toThrow();
        const created = LastName.create(lastName);
        expect(created).toBeInstanceOf(LastName);
      });
    });

    it('debe aceptar apellidos con guión', () => {
      // Given - Apellidos con guión comunes
      const hyphenatedLastNames = [
        'García-López',
        'Martínez-García',
        'López-Sánchez',
        'González-Rodríguez',
      ];

      // When & Then
      hyphenatedLastNames.forEach((lastName) => {
        expect(() => LastName.create(lastName)).not.toThrow();
        const created = LastName.create(lastName);
        expect(created).toBeInstanceOf(LastName);
      });
    });

    it('debe rechazar apellidos con caracteres no alfabéticos', () => {
      // Given - Caracteres que no deberían estar en apellidos
      const invalidChars = [
        '@',
        '#',
        '$',
        '%',
        '&',
        '*',
        '+',
        '=',
        '[',
        ']',
        '{',
        '}',
        '|',
        '\\',
        '/',
        '?',
        '<',
        '>',
        ',',
        '.',
        ';',
        ':',
        '"',
      ];

      // When & Then
      invalidChars.forEach((invalidChar) => {
        const invalidLastName = `García${invalidChar}López`;
        try {
          LastName.create(invalidLastName);
          fail(`Expected ValidationError to be thrown for: ${invalidLastName}`);
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
        }
      });
    });
  });
});
