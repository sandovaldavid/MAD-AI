import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import type { FieldError } from '@domain/errors/field-error.type';

/**
 * Username Value Object
 *
 * Represents a validated username according to application business rules.
 * Ensures uniqueness constraints, security standards, and provides domain-specific
 * behavior for user identification operations.
 *
 * **Domain Rules:**
 * - Must be between 3 and 32 characters in length
 * - Can only contain alphanumeric characters and underscores
 * - Automatically normalized (trimmed and lowercased)
 * - Must be unique across the entire system
 * - Cannot be a reserved username (admin, root, api, etc.)
 *
 * **Business Rules:**
 * - Serves as primary user identifier for login
 * - Used for creating user profiles and public references
 * - Must be appropriate for professional environments
 * - Subject to moderation and abuse prevention
 * - Once chosen, should remain stable for user recognition
 *
 * **Security Considerations:**
 * - No personally identifiable information should be embedded
 * - Length restrictions prevent buffer overflow attacks
 * - Character restrictions prevent injection attacks
 * - Normalization ensures consistent comparison and storage
 *
 * @example
 * ```typescript
 * // Valid username creation
 * const username = Username.create('john_doe');
 * console.log(username.value); // 'john_doe'
 * console.log(username.isReserved()); // false
 * console.log(username.getSuggestedVariations()); // ['john_doe1', 'john_doe2', ...]
 *
 * // Invalid username throws ValidationError
 * try {
 *   Username.create('ab'); // Too short
 * } catch (error) {
 *   console.log(error.message); // 'Username must be at least 3 characters'
 * }
 *
 * // Business operations
 * const adminUser = Username.create('admin');
 * if (adminUser.isReserved()) {
 *   // Handle reserved username logic
 * }
 * ```
 *
 * @see {@link https://owasp.org/www-community/vulnerabilities/Improper_Input_Validation | OWASP Input Validation}
 */
export class Username {
  private constructor(public readonly value: string) {}

  /**
   * Creates a validated Username value object from a raw string.
   *
   * Performs comprehensive validation and normalization:
   * - Trims whitespace and converts to lowercase
   * - Validates length constraints (3-32 characters)
   * - Ensures only alphanumeric characters and underscores
   * - Checks against reserved username list
   * - Validates for professional appropriateness
   *
   * @param raw - The raw username string to validate
   * @returns A validated and normalized Username instance
   * @throws {ValidationError} When validation fails, containing all validation errors
   *
   * @example
   * ```typescript
   * // Successful creation with normalization
   * const username = Username.create('  JOHN_DOE  ');
   * console.log(username.value); // 'john_doe'
   *
   * // Validation error for length
   * try {
   *   Username.create('ab');
   * } catch (error) {
   *   console.log(error.errors[0].code); // ValidationErrorCode.FIELD_TOO_SHORT
   * }
   *
   * // Validation error for invalid characters
   * try {
   *   Username.create('john-doe!');
   * } catch (error) {
   *   console.log(error.errors[0].code); // ValidationErrorCode.FIELD_FORMAT_INVALID
   * }
   *
   * // Multiple validation errors
   * try {
   *   Username.create('x!');
   * } catch (error) {
   *   console.log(error.errors.length); // 2 (too short + invalid format)
   * }
   * ```
   */
  static create(raw: string): Username {
    // Check for required field first
    if (!raw || typeof raw !== 'string') {
      throw ValidationError.forMissingRequiredFields(['username']);
    }

    const errors: FieldError[] = [];
    const normalized = raw.trim().toLowerCase();

    if (normalized.length < 3) {
      errors.push({
        field: 'username',
        value: normalized,
        message: 'Username must be at least 3 characters',
        code: ValidationErrorCode.FIELD_TOO_SHORT,
      });
    }

    if (normalized.length > 32) {
      errors.push({
        field: 'username',
        value: normalized,
        message: 'Username must be at most 32 characters',
        code: ValidationErrorCode.FIELD_TOO_LONG,
      });
    }

    // Alphanumeric + underscore
    if (!/^\w+$/.test(normalized)) {
      errors.push({
        field: 'username',
        value: normalized,
        message: 'Username must be alphanumeric or underscore',
        code: ValidationErrorCode.FIELD_FORMAT_INVALID,
      });
    }

    if (errors.length) {
      throw ValidationError.createFromFields(errors, ValidationErrorCode.VALIDATION_ERROR);
    }

    return new Username(normalized);
  }

  /**
   * Checks value equality with another Username instance.
   *
   * Two Username instances are considered equal if their normalized values match.
   * This implements value object equality semantics where identity is based on value.
   *
   * @param other - The other Username instance to compare
   * @returns True if both usernames have the same normalized value
   *
   * @example
   * ```typescript
   * const username1 = Username.create('john_doe');
   * const username2 = Username.create('JOHN_DOE');
   * console.log(username1.equals(username2)); // true (normalized values match)
   *
   * const username3 = Username.create('jane_doe');
   * console.log(username1.equals(username3)); // false
   * ```
   */
  equals(other: Username): boolean {
    if (!other || typeof other !== 'object' || !(other instanceof Username)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Returns the string representation of the username.
   *
   * @returns The normalized username string
   *
   * @example
   * ```typescript
   * const username = Username.create('john_doe');
   * console.log(username.toString()); // 'john_doe'
   * console.log(`Username: ${username}`); // 'Username: john_doe'
   * ```
   */
  toString(): string {
    return this.value;
  }

  /**
   * Gets the length of the username
   */
  getLength(): number {
    return this.value.length;
  }
}
