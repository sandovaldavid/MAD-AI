import { ValidationErrorCode } from './validation-error-code.enum';

/**
 * Represents a field-specific validation error in the MAD-AI domain.
 *
 * @description This type defines the structure for field-level validation errors,
 * providing detailed information about what went wrong, where, and why.
 * It supports multi-field validation scenarios and enables precise error reporting.
 *
 * @example Basic field error
 * ```typescript
 * const emailError: FieldError = {
 *   field: 'email',
 *   value: 'invalid-email',
 *   message: 'Invalid email format',
 *   code: ValidationErrorCode.INVALID_FORMAT,
 *   context: { expectedFormat: 'user@domain.com' }
 * };
 * ```
 *
 * @example Password validation error
 * ```typescript
 * const passwordError: FieldError = {
 *   field: 'password',
 *   value: '123',
 *   message: 'Password must be at least 8 characters long',
 *   code: ValidationErrorCode.MIN_LENGTH_NOT_REACHED,
 *   context: { minLength: 8, actualLength: 3 }
 * };
 * ```
 *
 * @since 1.0.0
 * @domain Error Handling
 */
export interface FieldError {
  /**
   * The field name that contains the validation error.
   * Should correspond to the property name in the entity or value object.
   */
  readonly field: string;

  /**
   * The actual value that caused the validation error.
   * Preserved for debugging and error context purposes.
   */
  readonly value: any;

  /**
   * Human-readable error message explaining what went wrong.
   * Should be clear and actionable for end users.
   */
  readonly message: string;

  /**
   * Specific validation error code for programmatic error handling.
   * Enables consistent error categorization and automated processing.
   */
  readonly code?: ValidationErrorCode;

  /**
   * Additional context information about the validation error.
   * Can include expected values, constraints, or related data.
   *
   * @example
   * ```typescript
   * context: {
   *   minLength: 8,
   *   maxLength: 50,
   *   allowedCharacters: 'alphanumeric and special characters'
   * }
   * ```
   */
  readonly context?: Record<string, any>;

  /**
   * Severity level of the validation error.
   * Determines how the error should be handled and presented.
   *
   * - 'error': Critical validation failure that prevents operation
   * - 'warning': Non-critical issue that should be addressed
   * - 'info': Informational message about validation constraints
   */
  readonly severity?: 'error' | 'warning' | 'info';
}
