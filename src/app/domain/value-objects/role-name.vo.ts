import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import { FieldError } from '@domain/errors/field-error.type';
import {
  ROLE_NAME_LENGTH_CONSTRAINTS,
  ROLE_NAME_VALIDATION_MESSAGES,
  RoleNameUtils,
} from '../enums/role-name.enum';

/**
 * RoleName Value Object
 *
 * Represents a validated role name with proper formatting and invariant constraints.
 * This VO only validates technical invariants (format, length, characters).
 * Business rules (like reserved names) are handled by Specifications.
 *
 * **Invariant Rules:**
 * - Between 3 and 50 characters (technical constraint)
 * - Only letters, spaces and hyphens (format constraint)
 * - Must start with a letter (format constraint)
 * - No consecutive spaces or hyphens (format constraint)
 * - Automatically normalized and capitalized
 *
 * **Business Rules (handled elsewhere):**
 * - Reserved names → RoleNameReservedSpec
 * - System role conflicts → Domain Services
 * - Uniqueness constraints → Repository layer
 *
 * @example
 * ```typescript
 * // Valid creation
 * const roleName = RoleName.create('Project Manager');
 * console.log(roleName.value); // 'Project Manager'
 * console.log(roleName.toSlug()); // 'project-manager'
 *
 * // Invalid creation throws ValidationError
 * try {
 *   RoleName.create('xy'); // Too short
 * } catch (error) {
 *   console.log(error.message); // 'Role name must be at least 3 characters'
 * }
 * ```
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
export class RoleName {
  private constructor(public readonly value: string) {}

  /**
   * Creates a validated RoleName value object from a raw string.
   *
   * Performs comprehensive validation and normalization:
   * - Validates required field
   * - Validates length constraints (3-50 characters)
   * - Validates character format (letters, spaces, hyphens only)
   * - Validates format rules (must start with letter, no consecutive chars)
   * - Automatically normalizes and capitalizes
   *
   * @param raw - The raw role name string to validate
   * @returns A validated and normalized RoleName instance
   * @throws {ValidationError} When validation fails, containing all validation errors
   */
  static create(raw: string): RoleName {
    const errors: FieldError[] = [];

    // Required field validation
    if (!raw || typeof raw !== 'string') {
      errors.push({
        field: 'roleName',
        value: raw,
        message: ROLE_NAME_VALIDATION_MESSAGES.REQUIRED,
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      });

      // Early return if no valid string to work with
      if (errors.length) {
        throw ValidationError.createFromFields(errors, ValidationErrorCode.REQUIRED_FIELD_MISSING);
      }
    }

    const normalized = raw.trim();

    // Length constraints (invariants)
    if (normalized.length < ROLE_NAME_LENGTH_CONSTRAINTS.MIN_LENGTH) {
      errors.push({
        field: 'roleName',
        value: normalized,
        message: `Role name must be at least ${ROLE_NAME_LENGTH_CONSTRAINTS.MIN_LENGTH} characters`,
        code: ValidationErrorCode.FIELD_TOO_SHORT,
      });
    }

    if (normalized.length > ROLE_NAME_LENGTH_CONSTRAINTS.MAX_LENGTH) {
      errors.push({
        field: 'roleName',
        value: normalized,
        message: `Role name must be at most ${ROLE_NAME_LENGTH_CONSTRAINTS.MAX_LENGTH} characters`,
        code: ValidationErrorCode.FIELD_TOO_LONG,
      });
    }

    // Format validation (invariants)
    if (!RoleNameUtils.isValidFormat(normalized)) {
      errors.push({
        field: 'roleName',
        value: normalized,
        message: ROLE_NAME_VALIDATION_MESSAGES.INVALID_FORMAT,
        code: ValidationErrorCode.FIELD_FORMAT_INVALID,
      });
    }

    if (errors.length) {
      throw ValidationError.createFromFields(errors, ValidationErrorCode.VALIDATION_ERROR);
    }

    return new RoleName(RoleNameUtils.normalize(raw.trim()));
  }

  /**
   * Checks value equality with another RoleName instance.
   *
   * Comparison is case-insensitive as role names are treated as
   * semantically equivalent regardless of casing.
   *
   * @param other - The other RoleName instance to compare
   * @returns True if both role names have the same normalized value
   */
  equals(other: RoleName): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  /**
   * Gets the display-formatted version of the role name.
   *
   * @returns The role name formatted for display (normalized)
   */
  getDisplayName(): string {
    return RoleNameUtils.formatForDisplay(this.value);
  }

  /**
   * Converts the role name to a URL-friendly slug.
   *
   * @returns The role name as a lowercase slug with hyphens
   *
   * @example
   * ```typescript
   * const roleName = RoleName.create('Project Manager');
   * console.log(roleName.toSlug()); // 'project-manager'
   * ```
   */
  toSlug(): string {
    return RoleNameUtils.toSlug(this.value);
  }

  /**
   * Returns the string representation of the role name.
   *
   * @returns The normalized role name string
   */
  toString(): string {
    return this.value;
  }
}
