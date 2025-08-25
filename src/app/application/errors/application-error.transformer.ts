import { Injectable } from '@angular/core';
import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import { ApplicationError } from './application-error';

/**
 * Application Error Transformer for Use Cases
 *
 * @description
 * Specialized utility for transforming domain errors into user-friendly messages
 * within use cases. This transformer focuses on application-specific error handling
 * while maintaining clean separation from the domain layer.
 *
 * @responsibilities
 * - Transform domain ValidationError instances to user messages
 * - Provide specialized messages for different error scenarios
 * - Handle authentication and user management specific errors
 * - Maintain consistent error messaging across use cases
 *
 * @architecture
 * - Application Layer utility
 * - Works with domain error entities
 * - Provides feature-specific error transformations
 * - Integrates with existing error handling system
 *
 * @usage
 * ```typescript
 * // In a use case
 * @Injectable({ providedIn: 'root' })
 * export class SomeUseCase {
 *   private errorTransformer = inject(ApplicationErrorTransformer);
 *
 *   async execute(): Promise<Result> {
 *     try {
 *       // ... use case logic
 *     } catch (error) {
 *       const message = this.errorTransformer.transformError(error);
 *       return Result.failure(message);
 *     }
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class ApplicationErrorTransformer {
  /**
   * Transforms any error into a user-friendly message
   */
  transformError(error: unknown, context?: { feature?: string; operation?: string }): string {
    // If it's an ApplicationError, just return its message (already user-friendly)
    if (error instanceof ApplicationError) {
      return error.message;
    }

    if (error instanceof ValidationError) {
      return this.transformValidationError(error);
    }

    if (error instanceof Error) {
      return this.transformGenericError(error, context);
    }

    return this.transformUnknownError(error);
  }

  /**
   * Transforms ValidationError instances with specific messaging
   */
  private transformValidationError(error: ValidationError): string {
    // If the error already has a user-friendly message, use it
    if (error.message && this.isUserFriendlyMessage(error.message)) {
      return error.message;
    }

    // Transform based on validation code
    switch (error.code) {
      case ValidationErrorCode.REQUIRED_FIELD_MISSING:
        return this.getRequiredFieldMessage(error);

      case ValidationErrorCode.INVALID_FORMAT:
        return this.getFormatErrorMessage(error);

      case ValidationErrorCode.MIN_LENGTH_NOT_REACHED:
        return this.getMinLengthMessage(error);

      case ValidationErrorCode.MAX_LENGTH_EXCEEDED:
        return this.getMaxLengthMessage(error);

      case ValidationErrorCode.ENTITY_EXPIRED:
        return 'The session or token has expired. Please try again.';

      case ValidationErrorCode.ENTITY_NOT_FOUND:
        return 'Required information not found. Please verify and try again.';

      case ValidationErrorCode.INVALID_STATE:
        return 'The current state is invalid for this operation. Please refresh and try again.';

      case ValidationErrorCode.VALUE_TOO_HIGH:
        return 'Too many attempts. Please wait before trying again.';

      case ValidationErrorCode.EMAIL_INVALID:
        return 'Please enter a valid email address.';

      case ValidationErrorCode.PASSWORD_INVALID:
        return 'Password does not meet security requirements.';

      case ValidationErrorCode.USERNAME_INVALID:
        return 'Username format is invalid. Please use letters, numbers, and underscores only.';

      case ValidationErrorCode.FIELD_NOT_UNIQUE:
        return this.getUniqueFieldMessage(error);

      case ValidationErrorCode.USERNAME_EXISTS:
        return 'This username is already taken. Please choose a different one.';

      case ValidationErrorCode.EMAIL_EXISTS:
        return 'This email address is already registered. Please use a different email or try logging in.';

      default:
        return error.message || 'Please check your input and try again.';
    }
  }

  /**
   * Transforms generic Error instances with context awareness
   */
  private transformGenericError(
    error: Error,
    context?: { feature?: string; operation?: string }
  ): string {
    const message = error.message.toLowerCase();

    // Network and connection errors
    if (message.includes('network') || message.includes('connection')) {
      return 'Network error occurred. Please check your internet connection and try again.';
    }

    // Timeout errors
    if (message.includes('timeout')) {
      return 'The request timed out. Please try again.';
    }

    // Authentication errors
    if (message.includes('unauthorized') || message.includes('401')) {
      return 'Authentication required. Please log in to continue.';
    }

    if (message.includes('forbidden') || message.includes('403')) {
      return 'Access denied. You do not have permission to perform this action.';
    }

    // Not found errors
    if (message.includes('not found') || message.includes('404')) {
      return context?.operation
        ? `The requested ${context.operation} was not found.`
        : 'The requested resource was not found.';
    }

    // Server errors
    if (message.includes('server') || message.includes('internal') || message.includes('500')) {
      return 'Server error occurred. Please try again later or contact support if the issue persists.';
    }

    // Authentication specific errors
    if (context?.feature === 'auth') {
      return this.transformAuthError(error);
    }

    // Generic fallback
    return this.getGenericErrorMessage(context);
  }

  /**
   * Transforms authentication-specific errors
   */
  private transformAuthError(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('expired')) {
      return 'Your session has expired. Please log in again.';
    }

    if (
      message.includes('invalid') &&
      (message.includes('credential') || message.includes('password'))
    ) {
      return 'Invalid credentials. Please check your email/username and password.';
    }

    if (message.includes('token')) {
      return 'Authentication token is invalid. Please log in again.';
    }

    if (message.includes('already') && message.includes('confirmed')) {
      return 'This email address has already been confirmed.';
    }

    if (message.includes('already') && message.includes('used')) {
      return 'This reset token has already been used. Please request a new one if needed.';
    }

    return 'Authentication failed. Please try again or contact support.';
  }

  /**
   * Transforms unknown error types
   */
  private transformUnknownError(error: unknown): string {
    console.warn('Unknown error type encountered:', error);
    return 'An unexpected error occurred. Please try again or contact support if the issue persists.';
  }

  /**
   * Gets required field specific message
   */
  private getRequiredFieldMessage(error: ValidationError): string {
    const field = this.extractFieldName(error);

    switch (field.toLowerCase()) {
      case 'email':
        return 'Email address is required.';
      case 'password':
        return 'Password is required.';
      case 'username':
        return 'Username is required.';
      case 'firstname':
        return 'First name is required.';
      case 'lastname':
        return 'Last name is required.';
      case 'token':
        return 'Token is required.';
      default:
        return `${field} is required.`;
    }
  }

  /**
   * Gets format error specific message
   */
  private getFormatErrorMessage(error: ValidationError): string {
    const field = this.extractFieldName(error);

    switch (field.toLowerCase()) {
      case 'email':
        return 'Please enter a valid email address.';
      case 'password':
        return 'Password format is invalid. Please check the requirements.';
      case 'passwordconfirm':
        return 'Password confirmation does not match.';
      case 'token':
        return 'Token format is invalid.';
      default:
        return `${field} format is invalid.`;
    }
  }

  /**
   * Gets minimum length specific message
   */
  private getMinLengthMessage(error: ValidationError): string {
    const field = this.extractFieldName(error);

    switch (field.toLowerCase()) {
      case 'password':
        return 'Password must be at least 8 characters long.';
      case 'username':
        return 'Username must be at least 3 characters long.';
      default:
        return `${field} is too short.`;
    }
  }

  /**
   * Gets maximum length specific message
   */
  private getMaxLengthMessage(error: ValidationError): string {
    const field = this.extractFieldName(error);

    switch (field.toLowerCase()) {
      case 'password':
        return 'Password cannot exceed 128 characters.';
      case 'username':
        return 'Username cannot exceed 50 characters.';
      case 'email':
        return 'Email address is too long.';
      default:
        return `${field} is too long.`;
    }
  }

  /**
   * Gets unique field specific message
   */
  private getUniqueFieldMessage(error: ValidationError): string {
    const field = this.extractFieldName(error);

    switch (field.toLowerCase()) {
      case 'email':
        return 'This email address is already registered.';
      case 'username':
        return 'This username is already taken.';
      default:
        return `This ${field} is already in use.`;
    }
  }

  /**
   * Gets generic error message with context
   */
  private getGenericErrorMessage(context?: { feature?: string; operation?: string }): string {
    if (context?.operation) {
      return `An error occurred during ${context.operation}. Please try again.`;
    }

    if (context?.feature) {
      return `An error occurred in ${context.feature}. Please try again or contact support.`;
    }

    return 'An error occurred. Please try again or contact support if the issue persists.';
  }

  /**
   * Extracts field name from validation error
   */
  private extractFieldName(error: ValidationError): string {
    // Check if error has field information
    if ('field' in error && error.field && typeof error.field === 'string') {
      return this.formatFieldName(error.field);
    }

    // Try to extract from message
    const message = error.message || '';
    if (message.includes('email')) return 'Email';
    if (message.includes('password')) return 'Password';
    if (message.includes('username')) return 'Username';
    if (message.includes('token')) return 'Token';

    return 'Field';
  }

  /**
   * Formats field name for user display
   */
  private formatFieldName(field: string): string {
    return field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
  }

  /**
   * Checks if a message is already user-friendly
   */
  private isUserFriendlyMessage(message: string): boolean {
    // Check if message contains technical terms that should be transformed
    const technicalTerms = [
      'validation',
      'constraint',
      'violation',
      'exception',
      'null',
      'undefined',
      'object',
      'property',
      'method',
    ];

    return !technicalTerms.some((term) => message.toLowerCase().includes(term));
  }
}
