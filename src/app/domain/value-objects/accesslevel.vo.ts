import { ValidationErrorCode } from '../errors/validation-error-code.enum';
import { ValidationError } from '../errors/validation-error.entity';

export class AccessLevel {
  private constructor(private readonly value: number) {}

  static readonly MIN = 1;
  static readonly MAX = 5;

  static readonly LEVEL_NAMES: Record<number, string> = {
    1: 'Super Administrador',
    2: 'Administrador',
    3: 'Jefe de Proyecto',
    4: 'Analista de Datos',
    5: 'Usuario Estándar',
  };

  static create(value: number): AccessLevel {
    if (value < this.MIN || value > this.MAX) {
      throw ValidationError.create({
        field: 'accessLevel',
        value,
        message: `Invalid AccessLevel: ${value}. Must be between ${this.MIN} and ${this.MAX}.`,
        code: ValidationErrorCode.VALIDATION_ERROR,
      });
    }
    return new AccessLevel(value);
  }

  getValue(): number {
    return this.value;
  }

  getName(): string {
    return AccessLevel.LEVEL_NAMES[this.value];
  }

  compareTo(other: AccessLevel): number {
    return this.value - other.value;
  }

  isEqual(other: AccessLevel): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.getName();
  }
}
