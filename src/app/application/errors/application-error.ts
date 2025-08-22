/**
 * Application Error Class
 * 
 * @description
 * Standardized error class for the Application Layer. This error type represents
 * normalized errors that have been processed by error handlers and are ready
 * for consumption by facades and UI components.
 * 
 * @responsibilities
 * - Carry normalized error information from use cases to facades
 * - Provide structured error data with operation context
 * - Support error code classification for UI handling
 * - Maintain error traceability from domain to application layer
 * 
 * @architecture
 * - Application Layer error type
 * - Used by use cases for error normalization
 * - Consumed by facades for UI error handling
 * - Bridges domain errors to user-facing messages
 * 
 * @since 1.0.0
 * @layer Application
 */
export class ApplicationError extends Error {
    /**
     * Creates a new Application Error instance
     * 
     * @param operation - The operation code that failed (e.g., 'USER_CREATION', 'LOGIN_FAILED')
     * @param message - User-friendly error message
     * @param code - Specific error code for programmatic handling
     * @param originalError - Original error that caused this application error
     */
    constructor(
        public readonly operation: string,
        message: string,
        public readonly code: string = 'UNKNOWN_ERROR',
        public readonly originalError?: unknown
    ) {
        super(message);
        this.name = 'ApplicationError';
        
        // Maintain proper stack trace for debugging
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApplicationError);
        }
    }

    /**
     * Factory method for creating application errors from domain errors
     * 
     * @param operation - The operation that failed
     * @param domainError - Original domain error
     * @param customMessage - Optional custom message override
     * @returns ApplicationError instance
     */
    static fromDomainError(
        operation: string,
        domainError: unknown,
        customMessage?: string
    ): ApplicationError {
        let message = customMessage || 'An error occurred';
        let code = 'UNKNOWN_ERROR';

        if (domainError instanceof Error) {
            message = customMessage || domainError.message;
            // Extract error code if available from domain error
            if ('code' in domainError && typeof domainError.code === 'string') {
                code = domainError.code;
            }
        }

        return new ApplicationError(operation, message, code, domainError);
    }

    /**
     * Factory method for creating application errors from HTTP errors
     * 
     * @param operation - The operation that failed
     * @param httpStatus - HTTP status code
     * @param message - Error message
     * @returns ApplicationError instance
     */
    static fromHttpError(
        operation: string,
        httpStatus: number,
        message?: string
    ): ApplicationError {
        const defaultMessage = message || `HTTP error: ${httpStatus}`;
        const code = `HTTP_${httpStatus}`;
        
        return new ApplicationError(operation, defaultMessage, code);
    }

    /**
     * Returns a JSON representation of the error
     */
    toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            operation: this.operation,
            message: this.message,
            code: this.code,
            stack: this.stack,
        };
    }
}
