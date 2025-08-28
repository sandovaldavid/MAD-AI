import { ValidationError } from '@domain/errors/validation-error.entity';
import {
  FirstnameMaxLength,
  FIRSTNAME_VALIDATION_REGEX,
  FirstnameValidationRule,
} from '../enums/firstname.enum';
import { FieldError } from '../errors/field-error.type';
import { ValidationErrorCode } from '../errors/validation-error-code.enum';

/**
 * Value Object: FirstName
 *
 * Represents a person's first name with domain-specific validation and formatting.
 * - Intrinsic validation: length, characters, normalization
 * - Domain behavior: initials, soundex, display helpers
 */
export class FirstName {
  private constructor(public readonly value: string) {}

  /**
   * Factory method
   */
  static create(raw: string): FirstName {
    const errors: FieldError[] = [];
    if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
      errors.push({
        field: 'firstName',
        value: raw,
        message: FirstnameValidationRule.REQUIRED,
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      });
    }
    const normalized = raw?.trim();
    if (normalized && normalized.length > FirstnameMaxLength.VALUE) {
      errors.push({
        field: 'firstName',
        value: normalized,
        message: FirstnameValidationRule.MAX_LENGTH,
        code: ValidationErrorCode.FIELD_TOO_LONG,
      });
    }
    if (normalized && !FIRSTNAME_VALIDATION_REGEX.test(normalized)) {
      errors.push({
        field: 'firstName',
        value: normalized,
        message: FirstnameValidationRule.VALID_FORMAT,
        code: ValidationErrorCode.FIELD_FORMAT_INVALID,
      });
    }
    if (errors.length > 0) {
      throw ValidationError.createFromFields(errors, ValidationErrorCode.VALIDATION_ERROR);
    }
    return new FirstName(FirstName.format(normalized));
  }

  /**
   * Formats firstname with proper capitalization (invariant formatting)
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

  equals(other: FirstName): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  /**
   * Gets the length of the firstname
   */
  getLength(): number {
    return this.value.length;
  }
}
