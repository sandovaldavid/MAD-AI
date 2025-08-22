import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import type { HttpErrorClassification } from './http-error-classifier';

/**
 * Pure HTTP Error Logger - Core Layer
 *
 * @description Purely technical HTTP error logging service.
 * Contains NO business logic, NO feature-specific knowledge.
 * Only logs technical HTTP error information for debugging and monitoring.
 *
 * @architecturalNotes
 * - Core Layer: Pure technical logging only
 * - NO feature knowledge
 * - NO business logic
 * - NO sensitive data logging
 * - Structured logging format for technical analysis
 */
@Injectable({
    providedIn: 'root',
})
export class HttpErrorLogger {
    /**
     * Logs HTTP error with technical information only
     */
    logHttpError(
        error: HttpErrorResponse,
        classification: HttpErrorClassification,
        context?: HttpErrorLogContext
    ): void {
        const logData = this.createLogData(error, classification, context);

        const logLevel = this.getLogLevel(classification.severity);
        console[logLevel]('[HTTP Error]', logData);
    }

    /**
     * Creates structured log data for technical analysis
     */
    private createLogData(
        error: HttpErrorResponse,
        classification: HttpErrorClassification,
        context?: HttpErrorLogContext
    ): HttpErrorLogData {
        return {
            // Technical HTTP information
            timestamp: new Date().toISOString(),
            status: error.status,
            statusText: error.statusText,
            url: this.sanitizeUrl(error.url),
            method: context?.method || 'unknown',

            // Classification data
            category: classification.category,
            severity: classification.severity,
            isRetryable: classification.isRetryable,

            // Technical context
            userAgent: navigator.userAgent,
            connectionType: this.getConnectionType(),

            // Error details (sanitized)
            errorMessage: classification.technicalMessage,
            errorId: this.generateErrorId(),

            // Request context (if provided)
            requestContext: context
                ? {
                      operation: context.operation,
                      component: context.component,
                      attemptNumber: context.attemptNumber,
                  }
                : undefined,
        };
    }

    /**
     * Determines console log level based on technical severity
     */
    private getLogLevel(severity: string): 'error' | 'warn' | 'info' {
        switch (severity) {
            case 'high':
                return 'error';
            case 'medium':
                return 'warn';
            case 'low':
            default:
                return 'info';
        }
    }

    /**
     * Sanitizes URL for logging (removes sensitive parameters)
     */
    private sanitizeUrl(url: string | null): string {
        if (!url) return 'unknown';

        try {
            const urlObj = new URL(url);
            // Remove potentially sensitive query parameters
            const sensitiveParams = ['token', 'key', 'secret', 'password', 'auth'];
            sensitiveParams.forEach((param) => {
                if (urlObj.searchParams.has(param)) {
                    urlObj.searchParams.set(param, '[REDACTED]');
                }
            });
            return urlObj.toString();
        } catch {
            return url;
        }
    }

    /**
     * Gets technical connection information
     */
    private getConnectionType(): string {
        const connection = (navigator as any).connection;
        return connection?.effectiveType || 'unknown';
    }

    /**
     * Generates unique error ID for tracking
     */
    private generateErrorId(): string {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Logs general application errors (non-HTTP)
     * Used by GlobalErrorHandler for technical error logging
     */
    logGeneralError(message: string, error: unknown): void {
        const errorData = {
            timestamp: new Date().toISOString(),
            message,
            error: this.extractErrorInfo(error),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
            url: typeof window !== 'undefined' ? window.location?.href : 'unknown',
        };

        console.error('[General Error]', errorData);
    }

    private extractErrorInfo(error: unknown): any {
        if (error instanceof Error) {
            return {
                name: error.name,
                message: error.message,
                stack: error.stack,
            };
        }
        return { raw: error };
    }
}

/**
 * Context information for HTTP error logging
 */
export interface HttpErrorLogContext {
    method?: string;
    operation?: string;
    component?: string;
    attemptNumber?: number;
}

/**
 * Structured HTTP error log data
 */
export interface HttpErrorLogData {
    timestamp: string;
    status: number;
    statusText: string;
    url: string;
    method: string;
    category: string;
    severity: string;
    isRetryable: boolean;
    userAgent: string;
    connectionType: string;
    errorMessage: string;
    errorId: string;
    requestContext?: {
        operation?: string;
        component?: string;
        attemptNumber?: number;
    };
}
