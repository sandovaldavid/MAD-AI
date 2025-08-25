import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';

/**
 * Email Value Object
 *
 * Represents a validated email address according to RFC 5322 standards (simplified).
 * Ensures immutability and provides domain-specific behavior for email operations.
 *
 * **Domain Rules:**
 * - Must be a valid email format according to RFC 5322 (simplified)
 * - Maximum length of 254 characters (RFC 5321 limit)
 * - Automatically normalized (trimmed and lowercased)
 * - No whitespace characters allowed
 * - Must contain @ symbol with valid domain
 *
 * **Business Rules:**
 * - Used for user identification and communication
 * - Serves as unique identifier in many business contexts
 * - Must be verifiable through external systems
 * - Subject to privacy and data protection regulations
 *
 * @example
 * ```typescript
 * // Valid creation
 * const email = Email.create('user@example.com');
 * console.log(email.getDomain()); // 'example.com'
 * console.log(email.isFromDomain('example.com')); // true
 *
 * // Invalid creation throws ValidationError
 * try {
 *   Email.create('invalid-email');
 * } catch (error) {
 *   console.log(error.message); // 'Formato de email inválido'
 * }
 *
 * // Business operations
 * const corporateEmail = Email.create('john.doe@company.com');
 * if (corporateEmail.isFromDomain('company.com')) {
 *   // Handle corporate user logic
 * }
 * ```
 *
 * @see {@link https://tools.ietf.org/html/rfc5322 | RFC 5322 - Internet Message Format}
 * @see {@link https://tools.ietf.org/html/rfc5321 | RFC 5321 - Simple Mail Transfer Protocol}
 */
export class Email {
  private constructor(public readonly value: string) {}

  /**
   * Creates a validated Email value object from a raw string.
   *
   * Performs comprehensive validation and normalization:
   * - Trims whitespace and converts to lowercase
   * - Validates maximum length (254 characters)
   * - Ensures RFC 5322 compliant format (simplified)
   * - Prohibits whitespace characters
   * - Validates presence of @ symbol and domain
   *
   * @param raw - The raw email string to validate
   * @returns A validated and normalized Email instance
   * @throws {ValidationError} When validation fails, containing all validation errors
   *
   * @example
   * ```typescript
   * // Successful creation with normalization
   * const email = Email.create('  USER@EXAMPLE.COM  ');
   * console.log(email.value); // 'user@example.com'
   *
   * // Validation error for invalid format
   * try {
   *   Email.create('invalid.email.format');
   * } catch (error) {
   *   console.log(error.errors.length); // Multiple validation errors
   * }
   *
   * // Business validation for length
   * const longEmail = 'a'.repeat(250) + '@example.com';
   * try {
   *   Email.create(longEmail); // Throws ValidationError
   * } catch (error) {
   *   console.log(error.code); // ValidationErrorCode.FIELD_TOO_LONG
   * }
   * ```
   */
  static create(raw: string): Email {
    const errors: Array<{
      field: string;
      value: unknown;
      message: string;
      code?: ValidationErrorCode;
    }> = [];

    if (typeof raw !== 'string' || raw.trim().length === 0) {
      errors.push({
        field: 'email',
        value: raw,
        message: 'Email requerido',
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      });
    }

    const normalized = (typeof raw === 'string' ? raw : '').trim().toLowerCase();

    // Máximo recomendado por estándares comunes
    if (normalized.length > 254) {
      errors.push({
        field: 'email',
        value: normalized,
        message: 'Email demasiado largo',
        code: ValidationErrorCode.FIELD_TOO_LONG,
      });
    }

    // No espacios en blanco
    if (/\s/.test(normalized)) {
      errors.push({
        field: 'email',
        value: normalized,
        message: 'El email no debe contener espacios',
        code: ValidationErrorCode.EMAIL_INVALID, // o FIELD_FORMAT_INVALID si prefieres
      });
    }

    // Regex RFC 5322 (simplificada, práctica para la mayoría de casos)
    const strictRegex =
      /^(?:[a-zA-Z0-9_'^&/+-]+(?:\.[a-zA-Z0-9_'^&/+-]+)*)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

    if (normalized.length > 0 && !strictRegex.test(normalized)) {
      errors.push({
        field: 'email',
        value: normalized,
        message: 'Formato de email inválido',
        code: ValidationErrorCode.EMAIL_INVALID, // específico de dominio
      });
    }

    if (errors.length) {
      throw ValidationError.createFromFields(errors);
    }

    return new Email(normalized);
  }

  /**
   * Checks value equality with another Email instance.
   *
   * Two Email instances are considered equal if their normalized values match.
   * This implements value object equality semantics where identity is based on value.
   *
   * @param other - The other Email instance to compare
   * @returns True if both emails have the same normalized value
   *
   * @example
   * ```typescript
   * const email1 = Email.create('user@example.com');
   * const email2 = Email.create('USER@EXAMPLE.COM');
   * console.log(email1.equals(email2)); // true (normalized values match)
   *
   * const email3 = Email.create('different@example.com');
   * console.log(email1.equals(email3)); // false
   * ```
   */
  equals(other: Email): boolean {
    return this.value === other.value;
  }

  /**
   * Returns the string representation of the email.
   *
   * @returns The normalized email string
   *
   * @example
   * ```typescript
   * const email = Email.create('user@example.com');
   * console.log(email.toString()); // 'user@example.com'
   * console.log(`Email: ${email}`); // 'Email: user@example.com'
   * ```
   */
  toString(): string {
    return this.value;
  }

  /**
   * Extracts the domain part from the email address.
   *
   * Returns the portion after the @ symbol, useful for domain-based
   * business logic such as corporate email detection or domain whitelisting.
   *
   * @returns The domain portion of the email address
   *
   * @example
   * ```typescript
   * const email = Email.create('john.doe@company.com');
   * console.log(email.getDomain()); // 'company.com'
   *
   * const personalEmail = Email.create('user@gmail.com');
   * console.log(personalEmail.getDomain()); // 'gmail.com'
   * ```
   */
  getDomain(): string {
    return this.value.split('@')[1];
  }

  /**
   * Checks if the email belongs to a specific domain.
   *
   * Performs case-insensitive comparison to determine if the email's
   * domain matches the provided domain string. Useful for implementing
   * business rules based on email domains.
   *
   * @param domain - The domain to check against (case-insensitive)
   * @returns True if the email belongs to the specified domain
   *
   * @example
   * ```typescript
   * const corporateEmail = Email.create('employee@company.com');
   * console.log(corporateEmail.isFromDomain('company.com')); // true
   * console.log(corporateEmail.isFromDomain('COMPANY.COM')); // true
   * console.log(corporateEmail.isFromDomain('other.com')); // false
   *
   * // Business logic example
   * if (corporateEmail.isFromDomain('company.com')) {
   *   // Apply corporate user privileges
   * }
   * ```
   */
  isFromDomain(domain: string): boolean {
    return this.getDomain().toLowerCase() === domain.toLowerCase();
  }

  /**
   * Gets the local part (username) of the email address.
   *
   * Returns the portion before the @ symbol, useful for user identification
   * and display purposes.
   *
   * @returns The local part of the email address
   *
   * @example
   * ```typescript
   * const email = Email.create('john.doe@company.com');
   * console.log(email.getLocalPart()); // 'john.doe'
   *
   * const email2 = Email.create('user+tag@example.com');
   * console.log(email2.getLocalPart()); // 'user+tag'
   * ```
   */
  getLocalPart(): string {
    return this.value.split('@')[0];
  }

  /**
   * Checks if the email uses a common public email provider.
   *
   * Useful for distinguishing between corporate and personal email addresses
   * in business logic. Checks against a list of well-known public providers.
   *
   * @returns True if the email uses a public email provider
   *
   * @example
   * ```typescript
   * const personalEmail = Email.create('user@gmail.com');
   * console.log(personalEmail.isFromPublicProvider()); // true
   *
   * const corporateEmail = Email.create('employee@company.com');
   * console.log(corporateEmail.isFromPublicProvider()); // false
   * ```
   */
  isFromPublicProvider(): boolean {
    const publicProviders = [
      'gmail.com',
      'yahoo.com',
      'outlook.com',
      'hotmail.com',
      'icloud.com',
      'aol.com',
      'protonmail.com',
      'yandex.com',
    ];

    const domain = this.getDomain();
    return publicProviders.includes(domain);
  }

  /**
   * Creates a masked version of the email for display purposes.
   *
   * Useful for privacy protection when displaying emails in UI components
   * or logs. Shows first character, asterisks, and the domain.
   *
   * @param showDomain - Whether to show the full domain (default: true)
   * @returns A masked version of the email
   *
   * @example
   * ```typescript
   * const email = Email.create('john.doe@company.com');
   * console.log(email.getMasked()); // 'j*****@company.com'
   * console.log(email.getMasked(false)); // 'j*****@c******.com'
   *
   * const shortEmail = Email.create('a@b.com');
   * console.log(shortEmail.getMasked()); // '*@b.com'
   * ```
   */
  getMasked(showDomain: boolean = true): string {
    const localPart = this.getLocalPart();
    const domain = this.getDomain();

    let maskedLocal: string;
    if (localPart.length <= 1) {
      maskedLocal = '*';
    } else {
      maskedLocal = localPart[0] + '*'.repeat(Math.min(5, localPart.length - 1));
    }

    if (showDomain) {
      return `${maskedLocal}@${domain}`;
    } else {
      const maskedDomain =
        domain.length <= 1 ? '*' : domain[0] + '*'.repeat(Math.min(6, domain.length - 1)) + '.com';
      return `${maskedLocal}@${maskedDomain}`;
    }
  }
}

/**
 * Email Value Object Specifications
 *
 * Defines the business rules, validation constraints, and behavioral specifications
 * for the Email value object. Used for testing, documentation, and validation.
 */
export namespace EmailSpecs {
  /**
   * Maximum allowed length for email addresses according to RFC 5321
   */
  export const MAX_LENGTH = 254;

  /**
   * Regular expression for email validation (RFC 5322 simplified)
   */
  export const VALIDATION_REGEX =
    /^(?:[a-zA-Z0-9_'^&/+-]+(?:\.[a-zA-Z0-9_'^&/+-]+)*)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

  /**
   * Common public email providers for business logic
   */
  export const PUBLIC_PROVIDERS = [
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'icloud.com',
    'aol.com',
    'protonmail.com',
    'yandex.com',
  ] as const;

  /**
   * Validation rules applied during email creation
   */
  export const VALIDATION_RULES = {
    REQUIRED: 'Email address is required',
    MAX_LENGTH: `Email cannot exceed ${MAX_LENGTH} characters`,
    NO_WHITESPACE: 'Email cannot contain whitespace characters',
    VALID_FORMAT: 'Email must be in valid format (user@domain.com)',
    VALID_DOMAIN: 'Email must contain a valid domain part',
  } as const;

  /**
   * Business rules for email usage in the domain
   */
  export const BUSINESS_RULES = {
    UNIQUE_IDENTIFIER: 'Email serves as unique user identifier',
    VERIFICATION_REQUIRED: 'Email must be verified before account activation',
    CASE_INSENSITIVE: 'Email comparison is case-insensitive',
    NORMALIZED_STORAGE: 'Emails are stored in normalized (lowercase) format',
  } as const;
}

/**
 * Email utility functions for common operations
 */
export namespace EmailUtils {
  /**
   * Validates if a string could be a valid email without creating the value object
   *
   * @param value - The string to validate
   * @returns True if the string appears to be a valid email format
   */
  export function isValidFormat(value: string): boolean {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return false;
    }

    const normalized = value.trim().toLowerCase();

    if (normalized.length > EmailSpecs.MAX_LENGTH) {
      return false;
    }

    if (/\s/.test(normalized)) {
      return false;
    }

    return EmailSpecs.VALIDATION_REGEX.test(normalized);
  }

  /**
   * Normalizes an email string using the same rules as Email.create()
   *
   * @param value - The email string to normalize
   * @returns The normalized email string
   */
  export function normalize(value: string): string {
    return (typeof value === 'string' ? value : '').trim().toLowerCase();
  }

  /**
   * Extracts domain from email string without validation
   *
   * @param email - The email string
   * @returns The domain part or empty string if invalid
   */
  export function extractDomain(email: string): string {
    const parts = email.split('@');
    return parts.length === 2 ? parts[1] : '';
  }
}
