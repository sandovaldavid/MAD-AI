import { ValidationErrorCode } from '../errors/validation-error-code.enum';
import { ValidationError } from '../errors/validation-error.entity';

export class AccessLevel {
  private constructor(private readonly value: number) {}

  static readonly MIN = 1;
  static readonly MAX = 5;

  static create(value: number): AccessLevel {
    if (!Number.isInteger(value)) {
      throw ValidationError.fromMessage(
        `Invalid AccessLevel: ${value}. Must be an integer.`,
        'accessLevel',
        ValidationErrorCode.INVALID_FORMAT
      );
    }
    if (value < this.MIN || value > this.MAX) {
      throw ValidationError.fromMessage(
        `Invalid AccessLevel: ${value}. Must be between ${this.MIN} and ${this.MAX}.`,
        'accessLevel',
        ValidationErrorCode.FIELD_OUT_OF_RANGE
      );
    }
    return new AccessLevel(value);
  }

  getValue(): number {
    return this.value;
  }

  compareTo(other: AccessLevel): number {
    return this.value - other.value;
  }

  isEqual(other: AccessLevel): boolean {
    return this.value === other.value;
  }

  isHigherThan(other: AccessLevel): boolean {
    return this.compareTo(other) < 0;
  }

  isAtLeast(other: AccessLevel): boolean {
    return this.compareTo(other) <= 0;
  }

  toString(): string {
    return `AccessLevel(${this.value})`;
  }
}
