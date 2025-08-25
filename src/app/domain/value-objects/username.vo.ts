import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';

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
    const errors: Array<{
      field: string;
      value: unknown;
      message: string;
      code?: ValidationErrorCode;
    }> = [];

    if (!raw || typeof raw !== 'string') {
      errors.push({
        field: 'username',
        value: raw,
        message: 'Username is required',
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      });
    } else {
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
    }

    if (errors.length) {
      throw ValidationError.createFromFields(errors);
    }

    const normalized = raw.trim().toLowerCase();
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
   * Checks if the username is in the reserved username list.
   *
   * Reserved usernames are those that should not be used by regular users
   * due to system functionality, security concerns, or business requirements.
   *
   * @returns True if the username is reserved
   *
   * @example
   * ```typescript
   * const adminUsername = Username.create('admin');
   * console.log(adminUsername.isReserved()); // true
   *
   * const userUsername = Username.create('john_doe');
   * console.log(userUsername.isReserved()); // false
   * ```
   */
  isReserved(): boolean {
    return UsernameSpecs.RESERVED_USERNAMES.includes(this.value);
  }

  /**
   * Gets the length of the username.
   *
   * @returns The character count of the username
   *
   * @example
   * ```typescript
   * const username = Username.create('john_doe');
   * console.log(username.getLength()); // 8
   * ```
   */
  getLength(): number {
    return this.value.length;
  }

  /**
   * Checks if the username contains only letters (no numbers or underscores).
   *
   * Useful for business rules that prefer alphabetic usernames for certain
   * user types or contexts.
   *
   * @returns True if the username contains only alphabetic characters
   *
   * @example
   * ```typescript
   * const alphaUsername = Username.create('johndoe');
   * console.log(alphaUsername.isAlphaOnly()); // true
   *
   * const mixedUsername = Username.create('john_doe123');
   * console.log(mixedUsername.isAlphaOnly()); // false
   * ```
   */
  isAlphaOnly(): boolean {
    return /^[a-z]+$/.test(this.value);
  }

  /**
   * Checks if the username contains numeric characters.
   *
   * @returns True if the username contains at least one digit
   *
   * @example
   * ```typescript
   * const numericUsername = Username.create('user123');
   * console.log(numericUsername.hasNumbers()); // true
   *
   * const alphaUsername = Username.create('username');
   * console.log(alphaUsername.hasNumbers()); // false
   * ```
   */
  hasNumbers(): boolean {
    return /\d/.test(this.value);
  }

  /**
   * Checks if the username contains underscore characters.
   *
   * @returns True if the username contains at least one underscore
   *
   * @example
   * ```typescript
   * const underscoreUsername = Username.create('john_doe');
   * console.log(underscoreUsername.hasUnderscores()); // true
   *
   * const noUnderscoreUsername = Username.create('johndoe');
   * console.log(noUnderscoreUsername.hasUnderscores()); // false
   * ```
   */
  hasUnderscores(): boolean {
    return this.value.includes('_');
  }

  /**
   * Generates suggested username variations for cases where the username is taken.
   *
   * Creates variations by appending numbers, removing underscores, or adding
   * common suffixes. Useful for registration flows where users need alternatives.
   *
   * @param count - Number of suggestions to generate (default: 5)
   * @returns Array of suggested username variations
   *
   * @example
   * ```typescript
   * const username = Username.create('john_doe');
   * const suggestions = username.getSuggestedVariations(3);
   * console.log(suggestions); // ['john_doe1', 'john_doe2', 'johndoe']
   *
   * const shortUsername = Username.create('john');
   * const moreSuggestions = shortUsername.getSuggestedVariations();
   * console.log(moreSuggestions); // ['john1', 'john2', 'john_user', 'john_2024', 'john_dev']
   * ```
   */
  getSuggestedVariations(count: number = 5): string[] {
    const suggestions: string[] = [];
    const base = this.value;

    // Add numbered variations
    for (let i = 1; i <= Math.min(count, 3); i++) {
      suggestions.push(`${base}${i}`);
    }

    // Add variation without underscores
    if (this.hasUnderscores()) {
      suggestions.push(base.replace(/_/g, ''));
    }

    // Add variation with current year
    if (suggestions.length < count) {
      suggestions.push(`${base}_${new Date().getFullYear()}`);
    }

    // Add common suffixes
    const suffixes = ['_user', '_dev', '_pro', '_official'];
    for (const suffix of suffixes) {
      if (suggestions.length >= count) break;
      if ((base + suffix).length <= UsernameSpecs.MAX_LENGTH) {
        suggestions.push(base + suffix);
      }
    }

    return suggestions.slice(0, count);
  }

  /**
   * Creates a display version of the username for UI purposes.
   *
   * Converts to a more readable format by capitalizing first letters
   * and replacing underscores with spaces. Used for display names.
   *
   * @returns A formatted display version of the username
   *
   * @example
   * ```typescript
   * const username = Username.create('john_doe');
   * console.log(username.toDisplayName()); // 'John Doe'
   *
   * const singleWord = Username.create('admin');
   * console.log(singleWord.toDisplayName()); // 'Admin'
   * ```
   */
  toDisplayName(): string {
    return this.value
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Validates the username against security policies.
   *
   * Checks for common security concerns like sequential characters,
   * repeated patterns, or other potentially problematic formats.
   *
   * @returns Object containing security validation results
   *
   * @example
   * ```typescript
   * const username = Username.create('user123');
   * const security = username.validateSecurity();
   * console.log(security.hasSequentialChars); // true ('123')
   * console.log(security.isSecure); // false
   *
   * const secureUsername = Username.create('john_doe');
   * const secureCheck = secureUsername.validateSecurity();
   * console.log(secureCheck.isSecure); // true
   * ```
   */
  validateSecurity(): UsernameSecurityCheck {
    const hasSequentialChars =
      /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789)/.test(
        this.value
      );
    const hasRepeatedChars = /(.)\1{2,}/.test(this.value);
    const isCommonPattern = /^(user|test|temp|admin)\d*$/.test(this.value);

    return {
      hasSequentialChars,
      hasRepeatedChars,
      isCommonPattern,
      isSecure: !hasSequentialChars && !hasRepeatedChars && !isCommonPattern && !this.isReserved(),
    };
  }
}

/**
 * Username security validation result interface
 */
export interface UsernameSecurityCheck {
  hasSequentialChars: boolean;
  hasRepeatedChars: boolean;
  isCommonPattern: boolean;
  isSecure: boolean;
}

/**
 * Username Value Object Specifications
 *
 * Defines the business rules, validation constraints, and behavioral specifications
 * for the Username value object. Used for testing, documentation, and validation.
 */
export namespace UsernameSpecs {
  /**
   * Minimum allowed length for usernames
   */
  export const MIN_LENGTH = 3;

  /**
   * Maximum allowed length for usernames
   */
  export const MAX_LENGTH = 32;

  /**
   * Regular expression for username validation (alphanumeric and underscore only)
   */
  export const VALIDATION_REGEX = /^\w+$/;

  /**
   * Reserved usernames that cannot be used by regular users
   */
  export const RESERVED_USERNAMES: readonly string[] = [
    'admin',
    'administrator',
    'root',
    'superuser',
    'moderator',
    'api',
    'www',
    'mail',
    'email',
    'support',
    'help',
    'info',
    'contact',
    'sales',
    'marketing',
    'noreply',
    'postmaster',
    'hostmaster',
    'webmaster',
    'abuse',
    'security',
    'privacy',
    'legal',
    'terms',
    'service',
    'system',
    'daemon',
    'guest',
    'anonymous',
    'user',
    'test',
    'demo',
    'example',
    'sample',
    'null',
    'undefined',
    'void',
    'nobody',
    'noone',
  ];

  /**
   * Validation rules applied during username creation
   */
  export const VALIDATION_RULES = {
    REQUIRED: 'Username is required',
    MIN_LENGTH: `Username must be at least ${MIN_LENGTH} characters`,
    MAX_LENGTH: `Username must be at most ${MAX_LENGTH} characters`,
    VALID_FORMAT: 'Username must contain only alphanumeric characters and underscores',
    NOT_RESERVED: 'Username is reserved and cannot be used',
  } as const;

  /**
   * Business rules for username usage in the domain
   */
  export const BUSINESS_RULES = {
    UNIQUE_IDENTIFIER: 'Username serves as unique user identifier',
    CASE_INSENSITIVE: 'Username comparison is case-insensitive',
    NORMALIZED_STORAGE: 'Usernames are stored in normalized (lowercase) format',
    STABLE_IDENTITY: 'Usernames should remain stable for user recognition',
    PROFESSIONAL_APPROPRIATE: 'Usernames must be appropriate for professional use',
  } as const;
}

/**
 * Username utility functions for common operations
 */
export namespace UsernameUtils {
  /**
   * Validates if a string could be a valid username without creating the value object
   *
   * @param value - The string to validate
   * @returns True if the string appears to be a valid username format
   */
  export function isValidFormat(value: string): boolean {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return false;
    }

    const normalized = value.trim().toLowerCase();

    if (
      normalized.length < UsernameSpecs.MIN_LENGTH ||
      normalized.length > UsernameSpecs.MAX_LENGTH
    ) {
      return false;
    }

    if (!UsernameSpecs.VALIDATION_REGEX.test(normalized)) {
      return false;
    }

    return !UsernameSpecs.RESERVED_USERNAMES.includes(normalized);
  }

  /**
   * Normalizes a username string using the same rules as Username.create()
   *
   * @param value - The username string to normalize
   * @returns The normalized username string
   */
  export function normalize(value: string): string {
    return (typeof value === 'string' ? value : '').trim().toLowerCase();
  }

  /**
   * Generates a random username with specified length
   *
   * @param length - Desired length (between MIN_LENGTH and MAX_LENGTH)
   * @returns A randomly generated valid username
   */
  export function generateRandom(length: number = 8): string {
    const clampedLength = Math.max(
      UsernameSpecs.MIN_LENGTH,
      Math.min(UsernameSpecs.MAX_LENGTH, length)
    );
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    // Ensure first character is a letter
    result += chars.substring(0, 26).charAt(Math.floor(Math.random() * 26));

    // Fill the rest with letters, numbers, and occasional underscores
    for (let i = 1; i < clampedLength; i++) {
      if (i > 2 && Math.random() < 0.1) {
        result += '_';
      } else {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    return result;
  }

  /**
   * Suggests usernames based on a full name
   *
   * @param firstName - First name
   * @param lastName - Last name
   * @returns Array of username suggestions
   */
  export function suggestFromName(firstName: string, lastName: string): string[] {
    const first = normalize(firstName);
    const last = normalize(lastName);

    if (!first || !last) return [];

    const suggestions: string[] = [];

    // Full names with underscore
    suggestions.push(`${first}_${last}`);

    // Concatenated
    suggestions.push(`${first}${last}`);

    // First name + last initial
    suggestions.push(`${first}_${last.charAt(0)}`);
    suggestions.push(`${first}${last.charAt(0)}`);

    // First initial + last name
    suggestions.push(`${first.charAt(0)}_${last}`);
    suggestions.push(`${first.charAt(0)}${last}`);

    // Filter valid suggestions
    return suggestions.filter((s) => isValidFormat(s));
  }
}
