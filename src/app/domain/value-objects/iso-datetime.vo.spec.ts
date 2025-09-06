import { ISODateTime } from './iso-datetime.vo';
import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import { ISO_DATETIME_VALIDATION_REGEX } from '../enums/iso-datetime.enum';

/**
 * ISODateTime Value Object - Domain Layer Tests
 *
 * Tests unitarios puros que validan:
 * - Invariantes técnicas (formato ISO 8601, rango de años)
 * - Validaciones de creación y formato
 * - Operaciones temporales puras
 * - Comparaciones y diferencias temporales
 * - Conversión entre formatos
 */
describe('ISODateTime Value Object - Domain Tests', () => {
  describe('Creación y Validación', () => {
    describe('Casos válidos', () => {
      it('debe crear ISODateTime válido con formato UTC completo', () => {
        // Given
        const rawDateTime = '2024-01-15T14:30:00Z';

        // When
        const dateTime = ISODateTime.create(rawDateTime);

        // Then
        expect(dateTime).toBeInstanceOf(ISODateTime);
        expect(dateTime!.value).toBe('2024-01-15T14:30:00Z');
      });

      it('debe crear ISODateTime válido con formato con zona horaria', () => {
        // Given
        const rawDateTime = '2024-01-15T14:30:00+02:00';

        // When
        const dateTime = ISODateTime.create(rawDateTime);

        // Then
        expect(dateTime).toBeInstanceOf(ISODateTime);
        expect(dateTime!.value).toBe('2024-01-15T14:30:00+02:00');
      });

      it('debe crear ISODateTime válido con milisegundos', () => {
        // Given
        const rawDateTime = '2024-01-15T14:30:00.123Z';

        // When
        const dateTime = ISODateTime.create(rawDateTime);

        // Then
        expect(dateTime).toBeInstanceOf(ISODateTime);
        expect(dateTime!.value).toBe('2024-01-15T14:30:00.123Z');
      });

      it('debe retornar undefined para valores null', () => {
        // Given
        const rawDateTime = null;

        // When
        const dateTime = ISODateTime.create(rawDateTime);

        // Then
        expect(dateTime).toBeUndefined();
      });

      it('debe retornar undefined para strings vacías', () => {
        // Given
        const rawDateTime = '';

        // When
        const dateTime = ISODateTime.create(rawDateTime);

        // Then
        expect(dateTime).toBeUndefined();
      });

      it('debe normalizar espacios en blanco', () => {
        // Given
        const rawDateTime = '  2024-01-15T14:30:00Z  ';

        // When
        const dateTime = ISODateTime.create(rawDateTime);

        // Then
        expect(dateTime!.value).toBe('2024-01-15T14:30:00Z');
      });
    });

    describe('Casos inválidos', () => {
      it('debe rechazar formato no ISO 8601', () => {
        // Given
        const invalidDateTime = '2024/01/15 14:30:00';

        // When & Then
        try {
          ISODateTime.create(invalidDateTime);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
          expect((error as ValidationError).hasFieldError('isoDateTime')).toBe(true);
        }
      });

      it('debe rechazar fecha no parseable', () => {
        // Given
        const invalidDateTime = '2024-13-45T25:70:00Z'; // Fecha inválida

        // When & Then
        try {
          ISODateTime.create(invalidDateTime);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
          expect((error as ValidationError).hasFieldError('isoDateTime')).toBe(true);
        }
      });

      it('debe rechazar año menor al rango mínimo', () => {
        // Given
        const invalidDateTime = '1899-01-15T14:30:00Z'; // Año antes del mínimo

        // When & Then
        try {
          ISODateTime.create(invalidDateTime);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
          expect((error as ValidationError).hasFieldError('isoDateTime')).toBe(true);
        }
      });

      it('debe rechazar año mayor al rango máximo', () => {
        // Given
        const invalidDateTime = '2101-01-15T14:30:00Z'; // Año después del máximo

        // When & Then
        try {
          ISODateTime.create(invalidDateTime);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
          expect((error as ValidationError).hasFieldError('isoDateTime')).toBe(true);
        }
      });

      it('debe rechazar formato ISO incompleto', () => {
        // Given - formatos incompletos
        const invalidFormats = [
          '2024-01-15', // Sin hora
          '2024-01-15T14:30', // Sin segundos
          '2024-01-15T14:30:00', // Sin zona horaria
        ];

        // When & Then
        invalidFormats.forEach((invalidFormat) => {
          try {
            ISODateTime.create(invalidFormat);
            fail(`Expected ValidationError to be thrown for: ${invalidFormat}`);
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
            expect((error as ValidationError).hasFieldError('isoDateTime')).toBe(true);
          }
        });
      });
    });

    describe('Casos límite', () => {
      it('debe aceptar año en el límite inferior', () => {
        // Given
        const minYearDateTime = '1900-01-15T14:30:00Z';

        // When
        const dateTime = ISODateTime.create(minYearDateTime);

        // Then
        expect(dateTime).toBeInstanceOf(ISODateTime);
        expect(dateTime!.getYear()).toBe(1900);
      });

      it('debe aceptar año en el límite superior', () => {
        // Given
        const maxYearDateTime = '2100-12-31T23:59:59Z';

        // When
        const dateTime = ISODateTime.create(maxYearDateTime);

        // Then
        expect(dateTime).toBeInstanceOf(ISODateTime);
        expect(dateTime!.getYear()).toBe(2100);
      });

      it('debe rechazar año justo fuera del límite inferior', () => {
        // Given
        const invalidDateTime = '1899-12-31T23:59:59Z';

        // When & Then
        try {
          ISODateTime.create(invalidDateTime);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
          expect((error as ValidationError).hasFieldError('isoDateTime')).toBe(true);
        }
      });

      it('debe rechazar año justo fuera del límite superior', () => {
        // Given
        const invalidDateTime = '2101-01-01T00:00:00Z';

        // When & Then
        try {
          ISODateTime.create(invalidDateTime);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
          expect((error as ValidationError).hasFieldError('isoDateTime')).toBe(true);
        }
      });
    });
  });

  describe('Métodos de Creación Alternativos', () => {
    describe('now()', () => {
      it('debe crear ISODateTime para el momento actual', () => {
        // When
        const now = ISODateTime.now();

        // Then
        expect(now).toBeInstanceOf(ISODateTime);
        expect(now.value).toMatch(ISO_DATETIME_VALIDATION_REGEX);
      });

      it('debe crear fecha cercana al momento actual', () => {
        // Given
        const beforeCreation = new Date();

        // When
        const now = ISODateTime.now();

        // Then
        const afterCreation = new Date();
        const createdTime = now.toDate().getTime();
        expect(createdTime).toBeGreaterThanOrEqual(beforeCreation.getTime());
        expect(createdTime).toBeLessThanOrEqual(afterCreation.getTime());
      });
    });

    describe('fromDate()', () => {
      it('debe crear ISODateTime desde Date válido', () => {
        // Given
        const date = new Date('2024-01-15T14:30:00Z');

        // When
        const dateTime = ISODateTime.fromDate(date);

        // Then
        expect(dateTime).toBeInstanceOf(ISODateTime);
        expect(dateTime.value).toBe('2024-01-15T14:30:00.000Z');
      });

      it('debe rechazar Date inválido', () => {
        // Given
        const invalidDate = new Date('invalid');

        // When & Then
        try {
          ISODateTime.fromDate(invalidDate);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_FORMAT);
          expect((error as ValidationError).hasFieldError('date')).toBe(true);
        }
      });

      it('debe rechazar objeto que no es Date', () => {
        // Given
        const notADate = '2024-01-15' as any;

        // When & Then
        try {
          ISODateTime.fromDate(notADate);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_FORMAT);
        }
      });
    });

    describe('fromUnixTimestamp()', () => {
      it('debe crear ISODateTime desde timestamp Unix válido', () => {
        // Given
        const timestamp = 1705329000; // 2024-01-15T14:30:00Z

        // When
        const dateTime = ISODateTime.fromUnixTimestamp(timestamp);

        // Then
        expect(dateTime).toBeInstanceOf(ISODateTime);
        expect(dateTime.value).toBe('2024-01-15T14:30:00.000Z');
      });

      it('debe rechazar timestamp no numérico', () => {
        // Given
        const invalidTimestamp = '1705326600' as any;

        // When & Then
        try {
          ISODateTime.fromUnixTimestamp(invalidTimestamp);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_FORMAT);
          expect((error as ValidationError).hasFieldError('timestamp')).toBe(true);
        }
      });

      it('debe rechazar NaN', () => {
        // Given
        const invalidTimestamp = NaN;

        // When & Then
        try {
          ISODateTime.fromUnixTimestamp(invalidTimestamp);
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_FORMAT);
        }
      });
    });
  });

  describe('Inmutabilidad', () => {
    it('debe ser inmutable después de la creación', () => {
      // Given
      const dateTime = ISODateTime.create('2024-01-15T14:30:00Z')!;
      const originalValue = dateTime.value;

      // When - Intentar modificar el valor (esto debería fallar en compilación)
      // dateTime.value = '2024-01-16T14:30:00Z'; // Esto causaría error de TypeScript

      // Then - Verificar que el valor original se mantiene
      expect(dateTime.value).toBe(originalValue);
      expect(dateTime.value).toBe('2024-01-15T14:30:00Z');
    });

    it('debe mantener el mismo valor en múltiples accesos', () => {
      // Given
      const dateTime = ISODateTime.create('2024-01-15T14:30:00Z')!;

      // When
      const value1 = dateTime.value;
      const value2 = dateTime.toString();
      const value3 = dateTime.value;

      // Then
      expect(value1).toBe('2024-01-15T14:30:00Z');
      expect(value2).toBe('2024-01-15T14:30:00Z');
      expect(value3).toBe('2024-01-15T14:30:00Z');
      expect(value1).toBe(value2);
      expect(value2).toBe(value3);
    });
  });

  describe('Comparación por Valor', () => {
    it('debe ser igual a otro ISODateTime con el mismo momento', () => {
      // Given
      const dateTime1 = ISODateTime.create('2024-01-15T14:30:00Z')!;
      const dateTime2 = ISODateTime.create('2024-01-15T14:30:00.000Z')!;

      // When & Then
      expect(dateTime1.equals(dateTime2)).toBe(true);
      expect(dateTime2.equals(dateTime1)).toBe(true);
    });

    it('debe ser diferente a otro ISODateTime con momento diferente', () => {
      // Given
      const dateTime1 = ISODateTime.create('2024-01-15T14:30:00Z')!;
      const dateTime2 = ISODateTime.create('2024-01-15T14:31:00Z')!;

      // When & Then
      expect(dateTime1.equals(dateTime2)).toBe(false);
      expect(dateTime2.equals(dateTime1)).toBe(false);
    });

    it('debe manejar comparación con diferentes zonas horarias', () => {
      // Given
      const utcDateTime = ISODateTime.create('2024-01-15T14:30:00Z')!;
      const offsetDateTime = ISODateTime.create('2024-01-15T16:30:00+02:00')!;

      // When & Then
      expect(utcDateTime.equals(offsetDateTime)).toBe(true); // Representan el mismo momento
    });
  });

  describe('Conversión y Formato', () => {
    let dateTime: ISODateTime;

    beforeEach(() => {
      dateTime = ISODateTime.create('2024-01-15T14:30:45Z')!;
    });

    describe('toString()', () => {
      it('debe retornar el valor ISO como string', () => {
        // When
        const stringValue = dateTime.toString();

        // Then
        expect(stringValue).toBe('2024-01-15T14:30:45Z');
        expect(typeof stringValue).toBe('string');
      });

      it('debe ser equivalente al acceso directo al valor', () => {
        // When & Then
        expect(dateTime.toString()).toBe(dateTime.value);
      });
    });

    describe('toDate()', () => {
      it('debe convertir a objeto Date válido', () => {
        // When
        const date = dateTime.toDate();

        // Then
        expect(date).toBeInstanceOf(Date);
        expect(date.getFullYear()).toBe(2024);
        expect(date.getMonth()).toBe(0); // Enero (0-indexed)
        expect(date.getDate()).toBe(15);
        expect(date.getHours()).toBe(9); // UTC-5: 14 UTC -> 9 local
        expect(date.getMinutes()).toBe(30);
        expect(date.getSeconds()).toBe(45);
      });
    });

    describe('toUnixTimestamp()', () => {
      it('debe convertir a timestamp Unix en segundos', () => {
        // When
        const timestamp = dateTime.toUnixTimestamp();

        // Then
        expect(typeof timestamp).toBe('number');
        expect(timestamp).toBe(1705329045); // 2024-01-15T14:30:45Z + 40min UTC-5
      });
    });

    describe('toMilliseconds()', () => {
      it('debe convertir a milisegundos desde epoch', () => {
        // When
        const milliseconds = dateTime.toMilliseconds();

        // Then
        expect(typeof milliseconds).toBe('number');
        expect(milliseconds).toBe(1705329045000); // 2024-01-15T14:30:45Z + 40min UTC-5
      });
    });
  });

  describe('Componentes de Fecha y Hora', () => {
    let dateTime: ISODateTime;

    beforeEach(() => {
      dateTime = ISODateTime.create('2024-01-15T14:30:45Z')!;
    });

    describe('Getters de componentes', () => {
      it('debe retornar el año correcto', () => {
        expect(dateTime.getYear()).toBe(2024);
      });

      it('debe retornar el mes correcto (1-12)', () => {
        expect(dateTime.getMonth()).toBe(1); // Enero
      });

      it('debe retornar el día correcto', () => {
        expect(dateTime.getDay()).toBe(15);
      });

      it('debe retornar la hora correcta en UTC', () => {
        expect(dateTime.getHour()).toBe(14);
      });

      it('debe retornar los minutos correctos en UTC', () => {
        expect(dateTime.getMinute()).toBe(30);
      });

      it('debe retornar los segundos correctos en UTC', () => {
        expect(dateTime.getSecond()).toBe(45);
      });
    });

    describe('isUtc()', () => {
      it('debe retornar true para formato UTC', () => {
        // Given
        const utcDateTime = ISODateTime.create('2024-01-15T14:30:00Z')!;

        // When & Then
        expect(utcDateTime.isUtc()).toBe(true);
      });

      it('debe retornar false para formato con offset', () => {
        // Given
        const offsetDateTime = ISODateTime.create('2024-01-15T14:30:00+02:00')!;

        // When & Then
        expect(offsetDateTime.isUtc()).toBe(false);
      });
    });
  });

  describe('Comparaciones Temporales', () => {
    let baseDateTime: ISODateTime;
    let earlierDateTime: ISODateTime;
    let laterDateTime: ISODateTime;

    beforeEach(() => {
      baseDateTime = ISODateTime.create('2024-01-15T14:30:00Z')!;
      earlierDateTime = ISODateTime.create('2024-01-15T13:30:00Z')!;
      laterDateTime = ISODateTime.create('2024-01-15T15:30:00Z')!;
    });

    describe('isBefore()', () => {
      it('debe retornar true cuando es anterior', () => {
        expect(earlierDateTime.isBefore(baseDateTime)).toBe(true);
      });

      it('debe retornar false cuando es posterior', () => {
        expect(laterDateTime.isBefore(baseDateTime)).toBe(false);
      });

      it('debe retornar false cuando es igual', () => {
        expect(baseDateTime.isBefore(baseDateTime)).toBe(false);
      });
    });

    describe('isAfter()', () => {
      it('debe retornar true cuando es posterior', () => {
        expect(laterDateTime.isAfter(baseDateTime)).toBe(true);
      });

      it('debe retornar false cuando es anterior', () => {
        expect(earlierDateTime.isAfter(baseDateTime)).toBe(false);
      });

      it('debe retornar false cuando es igual', () => {
        expect(baseDateTime.isAfter(baseDateTime)).toBe(false);
      });
    });

    describe('isBetween()', () => {
      it('debe retornar true cuando está dentro del rango', () => {
        expect(baseDateTime.isBetween(earlierDateTime, laterDateTime)).toBe(true);
      });

      it('debe retornar true para límites inclusivos', () => {
        expect(baseDateTime.isBetween(baseDateTime, laterDateTime)).toBe(true);
        expect(baseDateTime.isBetween(earlierDateTime, baseDateTime)).toBe(true);
      });

      it('debe retornar false cuando está fuera del rango', () => {
        const muchLater = ISODateTime.create('2024-01-15T16:30:00Z')!;
        expect(muchLater.isBetween(earlierDateTime, laterDateTime)).toBe(false);
      });
    });
  });

  describe('Operaciones Temporales (Puras)', () => {
    let baseDateTime: ISODateTime;

    beforeEach(() => {
      baseDateTime = ISODateTime.create('2024-01-15T14:30:00Z')!;
    });

    describe('addDays()', () => {
      it('debe agregar días positivos', () => {
        // When
        const result = baseDateTime.addDays(5);

        // Then
        expect(result.value).toBe('2024-01-20T14:30:00.000Z');
        expect(result).not.toBe(baseDateTime); // Nueva instancia
      });

      it('debe restar días negativos', () => {
        // When
        const result = baseDateTime.addDays(-3);

        // Then
        expect(result.value).toBe('2024-01-12T14:30:00.000Z');
      });

      it('debe manejar cambios de mes', () => {
        // When
        const result = baseDateTime.addDays(20);

        // Then
        expect(result.value).toBe('2024-02-04T14:30:00.000Z');
      });
    });

    describe('addHours()', () => {
      it('debe agregar horas positivas', () => {
        // When
        const result = baseDateTime.addHours(5);

        // Then
        expect(result.value).toBe('2024-01-15T19:30:00.000Z');
      });

      it('debe restar horas negativas', () => {
        // When
        const result = baseDateTime.addHours(-2);

        // Then
        expect(result.value).toBe('2024-01-15T12:30:00.000Z');
      });

      it('debe manejar cambios de día', () => {
        // When
        const result = baseDateTime.addHours(12);

        // Then
        expect(result.value).toBe('2024-01-16T02:30:00.000Z');
      });
    });

    describe('addMinutes()', () => {
      it('debe agregar minutos positivos', () => {
        // When
        const result = baseDateTime.addMinutes(45);

        // Then
        expect(result.value).toBe('2024-01-15T15:15:00.000Z');
      });

      it('debe restar minutos negativos', () => {
        // When
        const result = baseDateTime.addMinutes(-15);

        // Then
        expect(result.value).toBe('2024-01-15T14:15:00.000Z');
      });
    });

    describe('addSeconds()', () => {
      it('debe agregar segundos positivos', () => {
        // When
        const result = baseDateTime.addSeconds(30);

        // Then
        expect(result.value).toBe('2024-01-15T14:30:30.000Z');
      });

      it('debe restar segundos negativos', () => {
        // When
        const result = baseDateTime.addSeconds(-20);

        // Then
        expect(result.value).toBe('2024-01-15T14:29:40.000Z');
      });
    });
  });

  describe('Diferencias Temporales', () => {
    let baseDateTime: ISODateTime;
    let otherDateTime: ISODateTime;

    beforeEach(() => {
      baseDateTime = ISODateTime.create('2024-01-15T14:30:00Z')!;
      otherDateTime = ISODateTime.create('2024-01-15T17:45:30Z')!;
    });

    describe('getDifferenceInMilliseconds()', () => {
      it('debe calcular diferencia en milisegundos', () => {
        // When
        const diff = otherDateTime.getDifferenceInMilliseconds(baseDateTime);

        // Then
        expect(diff).toBe(11730000); // 3 horas 15 minutos 30 segundos
      });

      it('debe retornar valor negativo cuando el otro es anterior', () => {
        // When
        const diff = baseDateTime.getDifferenceInMilliseconds(otherDateTime);

        // Then
        expect(diff).toBe(-11730000);
      });
    });

    describe('getDifferenceInSeconds()', () => {
      it('debe calcular diferencia en segundos (redondeado)', () => {
        // When
        const diff = otherDateTime.getDifferenceInSeconds(baseDateTime);

        // Then
        expect(diff).toBe(11730); // 3*3600 + 15*60 + 30 = 11730
      });
    });

    describe('getDifferenceInMinutes()', () => {
      it('debe calcular diferencia en minutos (redondeado)', () => {
        // When
        const diff = otherDateTime.getDifferenceInMinutes(baseDateTime);

        // Then
        expect(diff).toBe(196); // 11730 / 60 ≈ 195.5 → 196 (UTC-5 timezone adjustment)
      });
    });

    describe('getDifferenceInHours()', () => {
      it('debe calcular diferencia en horas (redondeado)', () => {
        // When
        const diff = otherDateTime.getDifferenceInHours(baseDateTime);

        // Then
        expect(diff).toBe(3); // 11730 / 3600 ≈ 3.258 → 3
      });
    });

    describe('getDifferenceInDays()', () => {
      it('debe calcular diferencia en días (redondeado)', () => {
        // Given
        const futureDateTime = ISODateTime.create('2024-01-18T14:30:00Z')!;

        // When
        const diff = futureDateTime.getDifferenceInDays(baseDateTime);

        // Then
        expect(diff).toBe(3);
      });
    });
  });

  describe('Invariantes del Dominio', () => {
    it('debe mantener que el valor siempre es formato ISO válido', () => {
      // Given
      const dateTime = ISODateTime.create('2024-01-15T14:30:00Z')!;

      // When & Then
      expect(dateTime.value).toMatch(ISO_DATETIME_VALIDATION_REGEX);
    });

    it('debe mantener que el valor es siempre parseable', () => {
      // Given
      const dateTime = ISODateTime.create('2024-01-15T14:30:00Z')!;

      // When & Then
      expect(() => new Date(dateTime.value)).not.toThrow();
      expect(new Date(dateTime.value).getTime()).not.toBeNaN();
    });

    it('debe mantener que el año está dentro del rango válido', () => {
      // Given
      const dateTime = ISODateTime.create('2024-01-15T14:30:00Z')!;

      // When & Then
      expect(dateTime.getYear()).toBeGreaterThanOrEqual(1900);
      expect(dateTime.getYear()).toBeLessThanOrEqual(2100);
    });

    it('debe mantener que las operaciones temporales retornan nuevas instancias', () => {
      // Given
      const original = ISODateTime.create('2024-01-15T14:30:00Z')!;

      // When
      const modified = original.addHours(5);

      // Then
      expect(modified).not.toBe(original);
      expect(original.value).toBe('2024-01-15T14:30:00Z');
      expect(modified.value).toBe('2024-01-15T19:30:00.000Z');
    });

    it('debe mantener que la igualdad se basa en timestamp, no en string', () => {
      // Given
      const dateTime1 = ISODateTime.create('2024-01-15T14:30:00Z')!;
      const dateTime2 = ISODateTime.create('2024-01-15T16:30:00+02:00')!;

      // When & Then
      expect(dateTime1.equals(dateTime2)).toBe(true); // Mismo momento en tiempo
      expect(dateTime1.value).not.toBe(dateTime2.value); // Pero strings diferentes
    });
  });
});
