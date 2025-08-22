import { ValidationErrorCode, ValidationErrorCodeUtils } from '../errors/validation-error-code.enum';
import type { FieldError } from './field-error.type';

/**
 * Domain validation error entity for the MAD-AI system.
 * 
 * @description This entity represents validation errors that occur during
 * domain operations. It supports multiple field errors, structured error
 * information, and seamless integration with error handling infrastructure.
 * The class follows DDD principles by encapsulating error behavior and providing
 * rich domain-specific error information.
 * 
 * @example Single field validation error
 * ```typescript
 * const error = ValidationError.create({
 *   field: 'email',
 *   value: 'invalid-email',
 *   message: 'Invalid email format',
 *   code: ValidationErrorCode.EMAIL_INVALID
 * });
 * ```
 * 
 * @example Multiple field validation errors
 * ```typescript
 * const errors = ValidationError.createFromFields([
 *   {
 *     field: 'email',
 *     value: '',
 *     message: 'Email is required',
 *     code: ValidationErrorCode.REQUIRED_FIELD_MISSING
 *   },
 *   {
 *     field: 'password',
 *     value: '123',
 *     message: 'Password too short',
 *     code: ValidationErrorCode.MIN_LENGTH_NOT_REACHED,
 *     context: { minLength: 8 }
 *   }
 * ]);
 * ```
 * 
 * @example Business rule validation
 * ```typescript
 * const error = ValidationError.forBusinessRule(
 *   'operation',
 *   'delete_user',
 *   'Only administrators can delete users',
 *   ValidationErrorCode.PERMISSION_DENIED
 * );
 * ```
 * 
 * @since 1.0.0
 * @domain Error Handling
 */
export class ValidationError extends Error {
    /**
     * Array of field-specific errors contained in this validation error.
     * Each error provides detailed information about what went wrong.
     */
    public readonly errors: readonly FieldError[];
    
    /**
     * Primary validation error code for programmatic error handling.
     * When multiple errors exist, this represents the most significant one.
     */
    public readonly code: ValidationErrorCode;
    
    /**
     * Unique identifier for this validation error instance.
     * Useful for tracking and debugging purposes.
     */
    public readonly errorId: string;
    
    /**
     * Timestamp when the validation error was created.
     * Provides temporal context for error analysis.
     */
    public readonly timestamp: Date;
    
    /**
     * Context information about where or why the validation failed.
     * Can include entity names, operation types, or other relevant data.
     */
    public readonly context?: Record<string, any>;

    private constructor(
        errors: FieldError[],
        code: ValidationErrorCode = ValidationErrorCode.VALIDATION_ERROR,
        context?: Record<string, any>
    ) {
        // Create a comprehensive error message from all field errors
        const messages = errors.map(e => 
            e.field ? `${e.field}: ${e.message}` : e.message
        );
        super(messages.join('; '));
        
        this.name = 'ValidationError';
        this.errors = Object.freeze([...errors]);
        this.code = code;
        this.errorId = ValidationError.generateErrorId();
        this.timestamp = new Date();
        this.context = context ? Object.freeze({ ...context }) : undefined;
        
        // Ensure the stack trace points to the actual error location
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ValidationError);
        }
    }

    /**
     * Factory method for creating ValidationError from a single field error.
     * 
     * @param fieldError - The field error information
     * @param context - Optional context information
     * @returns New ValidationError instance
     */
    static create(fieldError: FieldError, context?: Record<string, any>): ValidationError {
        return new ValidationError([fieldError], fieldError.code, context);
    }

    /**
     * Factory method for creating ValidationError from multiple field errors.
     * 
     * @param fieldErrors - Array of field errors
     * @param primaryCode - Primary error code (defaults to first error's code)
     * @param context - Optional context information
     * @returns New ValidationError instance
     */
    static createFromFields(
        fieldErrors: FieldError[], 
        primaryCode?: ValidationErrorCode,
        context?: Record<string, any>
    ): ValidationError {
        if (fieldErrors.length === 0) {
            throw new Error('ValidationError requires at least one field error');
        }
        
        const code = primaryCode ?? fieldErrors[0].code ?? ValidationErrorCode.VALIDATION_ERROR;
        return new ValidationError(fieldErrors, code, context);
    }

    /**
     * Factory method for creating ValidationError from a simple string message.
     * 
     * @param message - Error message
     * @param field - Optional field name
     * @param code - Validation error code
     * @param context - Optional context information
     * @returns New ValidationError instance
     */
    static fromMessage(
        message: string,
        field: string = '',
        code: ValidationErrorCode = ValidationErrorCode.VALIDATION_ERROR,
        context?: Record<string, any>
    ): ValidationError {
        const fieldError: FieldError = {
            field,
            value: undefined,
            message,
            code,
            severity: 'error'
        };
        return new ValidationError([fieldError], code, context);
    }

    /**
     * Factory method for creating business rule validation errors.
     * 
     * @param field - Field name related to the business rule
     * @param value - Value that violated the business rule
     * @param message - Business rule violation message
     * @param code - Specific business rule error code
     * @param context - Optional business context
     * @returns New ValidationError instance
     */
    static forBusinessRule(
        field: string,
        value: any,
        message: string,
        code: ValidationErrorCode,
        context?: Record<string, any>
    ): ValidationError {
        const fieldError: FieldError = {
            field,
            value,
            message,
            code,
            severity: 'error',
            context
        };
        return new ValidationError([fieldError], code, context);
    }

    /**
     * Factory method for creating uniqueness constraint validation errors.
     * 
     * @param field - Field name that must be unique
     * @param value - Value that already exists
     * @param entityType - Type of entity for context
     * @returns New ValidationError instance
     */
    static forUniqueConstraint(
        field: string,
        value: any,
        entityType?: string
    ): ValidationError {
        const message = `${field} '${value}' already exists`;
        const context = entityType ? { entityType, conflictingValue: value } : { conflictingValue: value };
        
        const fieldError: FieldError = {
            field,
            value,
            message,
            code: ValidationErrorCode.FIELD_NOT_UNIQUE,
            severity: 'error',
            context
        };
        
        return new ValidationError([fieldError], ValidationErrorCode.FIELD_NOT_UNIQUE, context);
    }

    /**
     * Factory method for creating required field validation errors.
     * 
     * @param fields - Array of missing required field names
     * @returns New ValidationError instance
     */
    static forMissingRequiredFields(fields: string[]): ValidationError {
        const fieldErrors: FieldError[] = fields.map(field => ({
            field,
            value: undefined,
            message: `${field} is required`,
            code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            severity: 'error' as const
        }));
        
        return new ValidationError(fieldErrors, ValidationErrorCode.REQUIRED_FIELD_MISSING);
    }

    /**
     * Checks if this validation error contains errors for a specific field.
     * 
     * @param fieldName - Name of the field to check
     * @returns True if the field has validation errors
     */
    hasFieldError(fieldName: string): boolean {
        return this.errors.some(error => error.field === fieldName);
    }

    /**
     * Gets all validation errors for a specific field.
     * 
     * @param fieldName - Name of the field
     * @returns Array of field errors for the specified field
     */
    getFieldErrors(fieldName: string): FieldError[] {
        return this.errors.filter(error => error.field === fieldName);
    }

    /**
     * Gets the first validation error for a specific field.
     * 
     * @param fieldName - Name of the field
     * @returns First field error or undefined if not found
     */
    getFirstFieldError(fieldName: string): FieldError | undefined {
        return this.errors.find(error => error.field === fieldName);
    }

    /**
     * Checks if this validation error contains any business rule violations.
     * 
     * @returns True if any error is a business rule violation
     */
    hasBusinessRuleViolations(): boolean {
        return this.errors.some(error => 
            error.code && ValidationErrorCodeUtils.isBusinessRuleError(error.code)
        );
    }

    /**
     * Checks if this validation error contains any format-related errors.
     * 
     * @returns True if any error is format-related
     */
    hasFormatErrors(): boolean {
        return this.errors.some(error => 
            error.code && ValidationErrorCodeUtils.isFormatError(error.code)
        );
    }

    /**
     * Gets the most severe error level in this validation error.
     * 
     * @returns The highest severity level among all field errors
     */
    getMaxSeverity(): 'error' | 'warning' | 'info' {
        if (this.errors.some(e => e.severity === 'error')) return 'error';
        if (this.errors.some(e => e.severity === 'warning')) return 'warning';
        return 'info';
    }

    /**
     * Groups field errors by their error codes.
     * 
     * @returns Map of error codes to arrays of field errors
     */
    groupByErrorCode(): Map<ValidationErrorCode, FieldError[]> {
        const groups = new Map<ValidationErrorCode, FieldError[]>();
        
        for (const error of this.errors) {
            const code = error.code ?? ValidationErrorCode.VALIDATION_ERROR;
            const existing = groups.get(code) ?? [];
            groups.set(code, [...existing, error]);
        }
        
        return groups;
    }

    /**
     * Combines this validation error with another validation error.
     * 
     * @param other - Another ValidationError to combine with
     * @returns New ValidationError containing errors from both instances
     */
    combine(other: ValidationError): ValidationError {
        const combinedErrors = [...this.errors, ...other.errors];
        const combinedContext = { ...this.context, ...other.context };
        
        // Use the more specific error code if one is generic
        const primaryCode = this.code === ValidationErrorCode.VALIDATION_ERROR 
            ? other.code 
            : this.code;
        
        return ValidationError.createFromFields(combinedErrors, primaryCode, combinedContext);
    }

    /**
     * Converts the validation error to a JSON-serializable object.
     * Useful for API responses and logging.
     * 
     * @returns Serializable representation of the validation error
     */
    toJSON(): {
        name: string;
        code: ValidationErrorCode;
        errorId: string;
        timestamp: string;
        errors: FieldError[];
        message: string;
        context?: Record<string, any>;
    } {
        return {
            name: this.name,
            code: this.code,
            errorId: this.errorId,
            timestamp: this.timestamp.toISOString(),
            errors: [...this.errors],
            message: this.message,
            context: this.context
        };
    }

    /**
     * Creates a user-friendly summary of all validation errors.
     * Suitable for displaying to end users.
     * 
     * @returns Human-readable error summary
     */
    toUserFriendlyMessage(): string {
        const errorsByField = this.errors.reduce((acc, error) => {
            const field = error.field || 'General';
            if (!acc[field]) acc[field] = [];
            acc[field].push(error.message);
            return acc;
        }, {} as Record<string, string[]>);

        return Object.entries(errorsByField)
            .map(([field, messages]) => 
                field === 'General' 
                    ? messages.join(', ')
                    : `${field}: ${messages.join(', ')}`
            )
            .join('; ');
    }

    /**
     * Generates a unique identifier for tracking validation errors.
     * 
     * @returns Unique error identifier
     */
    private static generateErrorId(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `ve_${timestamp}_${random}`;
    }
}
