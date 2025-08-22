/**
 * Enumeration of validation error codes used throughout the MAD-AI domain.
 * 
 * @description This enum provides a comprehensive set of validation error codes
 * that enable consistent error categorization, programmatic error handling,
 * and internationalization support. Each code represents a specific type of
 * validation failure with clear semantic meaning.
 * 
 * @example Basic usage in validation
 * ```typescript
 * if (email.length === 0) {
 *   throw new ValidationError([{
 *     field: 'email',
 *     value: email,
 *     message: 'Email is required',
 *     code: ValidationErrorCode.REQUIRED_FIELD_MISSING
 *   }]);
 * }
 * ```
 * 
 * @example Business rule validation
 * ```typescript
 * if (!user.hasRole('ADMIN')) {
 *   throw new ValidationError([{
 *     field: 'operation',
 *     value: 'delete_user',
 *     message: 'Only administrators can delete users',
 *     code: ValidationErrorCode.PERMISSION_DENIED
 *   }]);
 * }
 * ```
 * 
 * @since 1.0.0
 * @domain Error Handling
 */
export enum ValidationErrorCode {
    // ========== GENERAL VALIDATION ==========
    
    /**
     * Generic validation error when specific categorization is not needed.
     * Use sparingly; prefer specific error codes when possible.
     */
    VALIDATION_ERROR = 'VALIDATION_ERROR',

    // ========== FIELD PRESENCE & REQUIREMENTS ==========
    
    /**
     * Required field is missing or empty.
     * Used when mandatory fields are not provided.
     */
    REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
    
    /**
     * Field value contains only whitespace.
     * Typically used for string fields that cannot be blank.
     */
    FIELD_EMPTY = 'FIELD_EMPTY',

    // ========== LENGTH & FORMAT CONSTRAINTS ==========
    
    /**
     * Field value is shorter than the minimum required length.
     * Common for passwords, names, and descriptions.
     */
    FIELD_TOO_SHORT = 'FIELD_TOO_SHORT',
    
    /**
     * Alias for FIELD_TOO_SHORT with more semantic meaning.
     * Use when minimum length constraints are not met.
     */
    MIN_LENGTH_NOT_REACHED = 'MIN_LENGTH_NOT_REACHED',
    
    /**
     * Field value exceeds the maximum allowed length.
     * Used to enforce storage and UI constraints.
     */
    FIELD_TOO_LONG = 'FIELD_TOO_LONG',
    
    /**
     * Alias for FIELD_TOO_LONG with more semantic meaning.
     * Use when maximum length constraints are exceeded.
     */
    MAX_LENGTH_EXCEEDED = 'MAX_LENGTH_EXCEEDED',
    
    /**
     * Field value does not match the expected format or pattern.
     * Used for structured data like phone numbers, codes, etc.
     */
    FIELD_FORMAT_INVALID = 'FIELD_FORMAT_INVALID',
    
    /**
     * Alias for FIELD_FORMAT_INVALID with more semantic meaning.
     * Use when format validation fails.
     */
    INVALID_FORMAT = 'INVALID_FORMAT',

    // ========== SPECIFIC FORMAT VALIDATIONS ==========
    
    /**
     * Email address format is invalid.
     * Used specifically for email validation failures.
     */
    EMAIL_INVALID = 'EMAIL_INVALID',
    
    /**
     * Username format is invalid or contains forbidden characters.
     * Used for username validation in user registration/updates.
     */
    USERNAME_INVALID = 'USERNAME_INVALID',
    
    /**
     * Password does not meet security requirements.
     * Used when password complexity rules are not satisfied.
     */
    PASSWORD_INVALID = 'PASSWORD_INVALID',

    // ========== BUSINESS RULES & DOMAIN CONSTRAINTS ==========
    
    /**
     * Role assignment is invalid for the current context.
     * Used when role constraints are violated.
     */
    ROLE_INVALID = 'ROLE_INVALID',
    
    /**
     * Role is not allowed for the specific operation or user.
     * Used in role-based access control scenarios.
     */
    ROLE_NOT_ALLOWED = 'ROLE_NOT_ALLOWED',
    
    /**
     * User lacks permission to perform the requested operation.
     * Used in authorization and access control validations.
     */
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    
    /**
     * Access level is insufficient for the requested operation.
     * Used when hierarchical access control is enforced.
     */
    ACCESS_LEVEL_INSUFFICIENT = 'ACCESS_LEVEL_INSUFFICIENT',

    // ========== UNIQUENESS & CONFLICTS ==========
    
    /**
     * Field value must be unique but already exists.
     * Common for usernames, emails, and other unique identifiers.
     */
    FIELD_NOT_UNIQUE = 'FIELD_NOT_UNIQUE',
    
    /**
     * Username already exists in the system.
     * Specific case of uniqueness violation for usernames.
     */
    USERNAME_EXISTS = 'USERNAME_EXISTS',
    
    /**
     * Email address already exists in the system.
     * Specific case of uniqueness violation for emails.
     */
    EMAIL_EXISTS = 'EMAIL_EXISTS',

    // ========== ENTITY STATE & LIFECYCLE ==========
    
    /**
     * Entity is in an invalid state for the requested operation.
     * Used when entity state transitions are violated.
     */
    INVALID_STATE = 'INVALID_STATE',
    
    /**
     * Entity is inactive and cannot be used for the operation.
     * Used when operations require active entities.
     */
    ENTITY_INACTIVE = 'ENTITY_INACTIVE',
    
    /**
     * Entity is expired and no longer valid.
     * Used for time-sensitive entities like tokens or sessions.
     */
    ENTITY_EXPIRED = 'ENTITY_EXPIRED',

    // ========== REFERENCE & RELATIONSHIP ERRORS ==========
    
    /**
     * Referenced entity was not found.
     * Maps 404 errors to domain context without exposing HTTP details.
     */
    ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
    
    /**
     * Foreign key reference is invalid or does not exist.
     * Used when entity relationships cannot be established.
     */
    INVALID_REFERENCE = 'INVALID_REFERENCE',
    
    /**
     * Circular reference detected in entity relationships.
     * Used to prevent infinite loops in hierarchical structures.
     */
    CIRCULAR_REFERENCE = 'CIRCULAR_REFERENCE',

    // ========== VALUE CONSTRAINTS ==========
    
    /**
     * Numeric value is below the minimum allowed value.
     * Used for range validations on numeric fields.
     */
    VALUE_TOO_LOW = 'VALUE_TOO_LOW',
    
    /**
     * Numeric value exceeds the maximum allowed value.
     * Used for range validations on numeric fields.
     */
    VALUE_TOO_HIGH = 'VALUE_TOO_HIGH',
    
    /**
     * Value is not within the allowed set of options.
     * Used for enumeration and choice validations.
     */
    INVALID_CHOICE = 'INVALID_CHOICE',
}

/**
 * Utility functions for working with ValidationErrorCode enum.
 * Provides helper methods for error categorization and handling.
 */
export const ValidationErrorCodeUtils = {
    /**
     * Checks if the error code indicates a field formatting issue.
     * 
     * @param code - The validation error code to check
     * @returns True if the code represents a format-related error
     */
    isFormatError(code: ValidationErrorCode): boolean {
        return [
            ValidationErrorCode.FIELD_FORMAT_INVALID,
            ValidationErrorCode.INVALID_FORMAT,
            ValidationErrorCode.EMAIL_INVALID,
            ValidationErrorCode.USERNAME_INVALID,
            ValidationErrorCode.PASSWORD_INVALID,
        ].includes(code);
    },

    /**
     * Checks if the error code indicates a length constraint violation.
     * 
     * @param code - The validation error code to check
     * @returns True if the code represents a length-related error
     */
    isLengthError(code: ValidationErrorCode): boolean {
        return [
            ValidationErrorCode.FIELD_TOO_SHORT,
            ValidationErrorCode.MIN_LENGTH_NOT_REACHED,
            ValidationErrorCode.FIELD_TOO_LONG,
            ValidationErrorCode.MAX_LENGTH_EXCEEDED,
        ].includes(code);
    },

    /**
     * Checks if the error code indicates a business rule violation.
     * 
     * @param code - The validation error code to check
     * @returns True if the code represents a business rule error
     */
    isBusinessRuleError(code: ValidationErrorCode): boolean {
        return [
            ValidationErrorCode.ROLE_INVALID,
            ValidationErrorCode.ROLE_NOT_ALLOWED,
            ValidationErrorCode.PERMISSION_DENIED,
            ValidationErrorCode.ACCESS_LEVEL_INSUFFICIENT,
            ValidationErrorCode.INVALID_STATE,
            ValidationErrorCode.ENTITY_INACTIVE,
            ValidationErrorCode.ENTITY_EXPIRED,
        ].includes(code);
    },

    /**
     * Checks if the error code indicates a uniqueness constraint violation.
     * 
     * @param code - The validation error code to check
     * @returns True if the code represents a uniqueness error
     */
    isUniquenessError(code: ValidationErrorCode): boolean {
        return [
            ValidationErrorCode.FIELD_NOT_UNIQUE,
            ValidationErrorCode.USERNAME_EXISTS,
            ValidationErrorCode.EMAIL_EXISTS,
        ].includes(code);
    },

    /**
     * Gets the severity level for a validation error code.
     * 
     * @param code - The validation error code
     * @returns The severity level ('error', 'warning', or 'info')
     */
    getSeverity(code: ValidationErrorCode): 'error' | 'warning' | 'info' {
        // Critical business rule violations
        if (this.isBusinessRuleError(code)) {
            return 'error';
        }
        
        // Format and constraint violations
        if (this.isFormatError(code) || this.isLengthError(code) || this.isUniquenessError(code)) {
            return 'error';
        }
        
        // Entity state issues
        if ([ValidationErrorCode.ENTITY_INACTIVE, ValidationErrorCode.ENTITY_EXPIRED].includes(code)) {
            return 'warning';
        }
        
        // Default to error for safety
        return 'error';
    },

    /**
     * Gets a user-friendly category name for the error code.
     * Useful for grouping errors in UI or logs.
     * 
     * @param code - The validation error code
     * @returns Human-readable category name
     */
    getCategory(code: ValidationErrorCode): string {
        if (this.isFormatError(code)) return 'Format Error';
        if (this.isLengthError(code)) return 'Length Constraint';
        if (this.isBusinessRuleError(code)) return 'Business Rule';
        if (this.isUniquenessError(code)) return 'Uniqueness Constraint';
        if ([ValidationErrorCode.ENTITY_NOT_FOUND, ValidationErrorCode.INVALID_REFERENCE].includes(code)) {
            return 'Reference Error';
        }
        return 'Validation Error';
    }
};
