import { ValidationError } from '@domain/errors/validation-error.entity';
import {
  LastnameMaxLength,
  LASTNAME_VALIDATION_REGEX,
  LastnameValidationRule,
} from '../enums/lastname.enum';
import { FieldError } from '../errors/field-error.type';
import { ValidationErrorCode } from '../errors/validation-error-code.enum';

/**
 * LastName Value Object
 *
 * Enforces cultural, legal and technical rules for surnames.
 */
export class LastName {
  private constructor(public readonly value: string) {}

  /**
   * Factory method with validation + normalization
   */
  static create(raw: string): LastName {
    const errors: FieldError[] = [];
    if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
      errors.push({
        field: 'lastName',
        value: raw,
        message: LastnameValidationRule.REQUIRED,
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      });
    }
    const normalized = raw?.trim();
    if (normalized && normalized.length > LastnameMaxLength.VALUE) {
      errors.push({
        field: 'lastName',
        value: normalized,
        message: LastnameValidationRule.MAX_LENGTH,
        code: ValidationErrorCode.FIELD_TOO_LONG,
      });
    }
    if (normalized && !LASTNAME_VALIDATION_REGEX.test(normalized)) {
      errors.push({
        field: 'lastName',
        value: normalized,
        message: LastnameValidationRule.VALID_FORMAT,
        code: ValidationErrorCode.FIELD_FORMAT_INVALID,
      });
    }
    if (errors.length > 0) {
      throw ValidationError.createFromFields(errors, ValidationErrorCode.VALIDATION_ERROR);
    }
    return new LastName(LastName.format(normalized));
  }

  /**
   * Formats lastname with proper capitalization (invariant formatting)
   */
  private static format(value: string): string {
    return value
      .trim()
      .split(/(\s+|\-+)/)
      .map((part) =>
        /^\s|\-$/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      )
      .join('');
  }

  equals(other: LastName): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  /**
   * Gets the length of the lastname
   */
  getLength(): number {
    return this.value.length;
  }
}
