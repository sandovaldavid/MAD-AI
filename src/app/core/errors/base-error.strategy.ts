import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
    ErrorStrategy,
    ErrorCategory,
    ErrorSeverity,
    FeatureIdentifier,
    ProcessedError,
    ErrorContext,
    RecoveryAction,
    RetryConfig,
} from './error-strategy.interface';

/**
 * Base implementation of error strategy with common functionality
 */
@Injectable()
export abstract class BaseErrorStrategy implements ErrorStrategy {
    protected feature: FeatureIdentifier;

    constructor(feature: FeatureIdentifier) {
        this.feature = feature;
    }

    abstract canHandle(error: HttpErrorResponse, feature: FeatureIdentifier): boolean;

    process(
        error: HttpErrorResponse,
        feature: FeatureIdentifier,
        operation: string
    ): ProcessedError {
        const context = this.createErrorContext(error, feature, operation);

        return {
            originalError: error,
            context,
            isHandled: false,
            timestamp: new Date(),
            errorId: this.generateErrorId(),
        };
    }

    protected createErrorContext(
        error: HttpErrorResponse,
        feature: FeatureIdentifier,
        operation: string
    ): ErrorContext {
        const retryConfig = this.getRetryConfig(error);
        return {
            feature,
            operation,
            userMessage: this.getUserMessage(error, operation),
            technicalDetails: this.getTechnicalDetails(error),
            severity: this.getErrorSeverity(error),
            category: this.getErrorCategory(error),
            shouldLog: this.shouldLog(error),
            showNotification: this.shouldShowNotification(error),
            retryConfig: retryConfig || undefined,
            recoveryActions: this.getRecoveryActions(error),
        };
    }

    abstract getUserMessage(error: HttpErrorResponse, operation: string): string;

    protected getTechnicalDetails(error: HttpErrorResponse): string {
        const details = [
            `Status: ${error.status}`,
            `URL: ${error.url}`,
            `Message: ${error.message}`,
        ];

        if (error.error) {
            details.push(`Error Body: ${JSON.stringify(error.error)}`);
        }

        return details.join(' | ');
    }

    protected getErrorSeverity(error: HttpErrorResponse): ErrorSeverity {
        if (error.status >= 500) return ErrorSeverity.CRITICAL;
        if (error.status === 401 || error.status === 403) return ErrorSeverity.HIGH;
        if (error.status >= 400) return ErrorSeverity.MEDIUM;
        return ErrorSeverity.LOW;
    }

    protected getErrorCategory(error: HttpErrorResponse): ErrorCategory {
        switch (error.status) {
            case 400:
                return ErrorCategory.VALIDATION;
            case 401:
                return ErrorCategory.AUTHENTICATION;
            case 403:
                return ErrorCategory.AUTHORIZATION;
            case 404:
                return ErrorCategory.CLIENT;
            case 422:
                return ErrorCategory.BUSINESS;
            case 0:
                return ErrorCategory.NETWORK;
            default:
                if (error.status >= 500) return ErrorCategory.SERVER;
                return ErrorCategory.UNKNOWN;
        }
    }

    protected shouldLog(error: HttpErrorResponse): boolean {
        return error.status >= 400;
    }

    protected shouldShowNotification(error: HttpErrorResponse): boolean {
        return error.status !== 401; // Auth errors are handled by interceptor
    }

    getRecoveryActions(error: HttpErrorResponse): RecoveryAction[] {
        return [];
    }

    shouldRetry(error: HttpErrorResponse): boolean {
        // Retry for network errors and server errors
        return error.status === 0 || error.status >= 500;
    }

    getRetryConfig(error: HttpErrorResponse): RetryConfig | null {
        if (!this.shouldRetry(error)) return null;

        return {
            maxAttempts: 3,
            delayMs: 1000,
            exponentialBackoff: true,
            retryCondition: (err) => err.status === 0 || err.status >= 500,
        };
    }

    private generateErrorId(): string {
        return `${this.feature}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
