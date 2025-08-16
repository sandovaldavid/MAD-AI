import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Feature identifier for error handling strategies
 */
export type FeatureIdentifier =
    | 'auth'
    | 'users'
    | 'roles'
    | 'notifications'
    | 'dashboard'
    | 'global';

/**
 * Error severity levels for different handling approaches
 */
export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

/**
 * Error categories for better classification
 */
export enum ErrorCategory {
    VALIDATION = 'validation',
    AUTHENTICATION = 'authentication',
    AUTHORIZATION = 'authorization',
    NETWORK = 'network',
    SERVER = 'server',
    CLIENT = 'client',
    BUSINESS = 'business',
    UNKNOWN = 'unknown',
}

/**
 * Error handling context for rich error information
 */
export interface ErrorContext {
    /** Feature where the error occurred */
    feature: FeatureIdentifier;
    /** Operation that caused the error */
    operation: string;
    /** User-friendly description */
    userMessage: string;
    /** Technical error details */
    technicalDetails: string;
    /** Error severity level */
    severity: ErrorSeverity;
    /** Error category */
    category: ErrorCategory;
    /** Whether error should be logged */
    shouldLog: boolean;
    /** Whether to show notification to user */
    showNotification: boolean;
    /** Custom retry configuration */
    retryConfig?: RetryConfig;
    /** Custom recovery actions */
    recoveryActions?: RecoveryAction[];
}

/**
 * Retry configuration for error recovery
 */
export interface RetryConfig {
    /** Maximum number of retry attempts */
    maxAttempts: number;
    /** Delay between retries in milliseconds */
    delayMs: number;
    /** Whether to use exponential backoff */
    exponentialBackoff: boolean;
    /** Conditions under which to retry */
    retryCondition: (error: HttpErrorResponse) => boolean;
}

/**
 * Recovery action for error handling
 */
export interface RecoveryAction {
    /** Display label for the action */
    label: string;
    /** Action handler function */
    handler: () => void | Observable<any>;
    /** Whether this is the primary action */
    isPrimary: boolean;
}

/**
 * Processed error information for uniform handling
 */
export interface ProcessedError {
    /** Original HTTP error */
    originalError: HttpErrorResponse;
    /** Error context with feature-specific information */
    context: ErrorContext;
    /** Whether error has been handled */
    isHandled: boolean;
    /** Timestamp when error occurred */
    timestamp: Date;
    /** Unique error identifier */
    errorId: string;
}

/**
 * Interface for feature-specific error handling strategies
 */
export interface ErrorStrategy {
    /**
     * Determines if this strategy can handle the given error
     */
    canHandle(error: HttpErrorResponse, feature: FeatureIdentifier): boolean;

    /**
     * Processes the error and returns enriched error context
     */
    process(
        error: HttpErrorResponse,
        feature: FeatureIdentifier,
        operation: string
    ): ProcessedError;

    /**
     * Gets user-friendly error message for the given error
     */
    getUserMessage(error: HttpErrorResponse, operation: string): string;

    /**
     * Gets recovery actions for the error
     */
    getRecoveryActions(error: HttpErrorResponse): RecoveryAction[];

    /**
     * Determines if the error should be retried
     */
    shouldRetry(error: HttpErrorResponse): boolean;

    /**
     * Gets retry configuration for the error
     */
    getRetryConfig(error: HttpErrorResponse): RetryConfig | null;
}
