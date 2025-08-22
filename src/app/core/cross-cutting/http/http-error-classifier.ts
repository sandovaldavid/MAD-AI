import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Pure HTTP Error Classifier - Core Layer
 * 
 * @description Purely technical HTTP status code classification service.
 * Contains NO business logic, NO feature-specific knowledge, NO domain concepts.
 * Only classifies HTTP errors by technical characteristics (status codes, error types).
 * 
 * @architecturalNotes
 * - Core Layer: Pure technical processing only
 * - NO feature knowledge (auth, roles, etc.)
 * - NO business logic
 * - NO Application layer dependencies
 * - Returns only technical classification data
 */
@Injectable({
    providedIn: 'root',
})
export class HttpErrorClassifier {
    /**
     * Classifies HTTP error by technical characteristics only
     */
    classify(error: HttpErrorResponse): HttpErrorClassification {
        return {
            status: error.status,
            category: this.getErrorCategory(error.status),
            severity: this.getErrorSeverity(error.status),
            isRetryable: this.isRetryableError(error.status),
            isClientError: this.isClientError(error.status),
            isServerError: this.isServerError(error.status),
            isNetworkError: this.isNetworkError(error),
            technicalMessage: this.getTechnicalMessage(error.status),
        };
    }

    /**
     * Pure technical categorization based on HTTP status codes
     */
    private getErrorCategory(status: number): HttpErrorCategory {
        if (status >= 400 && status < 500) {
            return HttpErrorCategory.CLIENT_ERROR;
        }
        if (status >= 500 && status < 600) {
            return HttpErrorCategory.SERVER_ERROR;
        }
        if (status === 0) {
            return HttpErrorCategory.NETWORK_ERROR;
        }
        return HttpErrorCategory.UNKNOWN;
    }

    /**
     * Technical severity based on HTTP standards
     */
    private getErrorSeverity(status: number): HttpErrorSeverity {
        switch (status) {
            case 0:
            case 500:
            case 502:
            case 503:
            case 504:
                return HttpErrorSeverity.HIGH;
            case 401:
            case 403:
            case 422:
            case 429:
                return HttpErrorSeverity.MEDIUM;
            case 400:
            case 404:
            case 409:
                return HttpErrorSeverity.LOW;
            default:
                return HttpErrorSeverity.LOW;
        }
    }

    /**
     * Determines if error is technically retryable
     */
    private isRetryableError(status: number): boolean {
        // Only technical determination - no business logic
        return status >= 500 || status === 429 || status === 0;
    }

    /**
     * HTTP 4xx classification
     */
    private isClientError(status: number): boolean {
        return status >= 400 && status < 500;
    }

    /**
     * HTTP 5xx classification
     */
    private isServerError(status: number): boolean {
        return status >= 500 && status < 600;
    }

    /**
     * Network connectivity error detection
     */
    private isNetworkError(error: HttpErrorResponse): boolean {
        return error.status === 0 || !error.status;
    }

    /**
     * Pure technical message based on HTTP standards
     */
    private getTechnicalMessage(status: number): string {
        switch (status) {
            case 0:
                return 'Network connectivity error';
            case 400:
                return 'Bad request - invalid syntax';
            case 401:
                return 'Authentication required';
            case 403:
                return 'Access forbidden';
            case 404:
                return 'Resource not found';
            case 409:
                return 'Resource conflict';
            case 422:
                return 'Request validation failed';
            case 429:
                return 'Rate limit exceeded';
            case 500:
                return 'Internal server error';
            case 502:
                return 'Bad gateway';
            case 503:
                return 'Service unavailable';
            case 504:
                return 'Gateway timeout';
            default:
                return `HTTP error ${status}`;
        }
    }
}

/**
 * Pure technical HTTP error classification result
 */
export interface HttpErrorClassification {
    status: number;
    category: HttpErrorCategory;
    severity: HttpErrorSeverity;
    isRetryable: boolean;
    isClientError: boolean;
    isServerError: boolean;
    isNetworkError: boolean;
    technicalMessage: string;
}

/**
 * Technical HTTP error categories
 */
export enum HttpErrorCategory {
    CLIENT_ERROR = 'client_error',
    SERVER_ERROR = 'server_error',
    NETWORK_ERROR = 'network_error',
    UNKNOWN = 'unknown',
}

/**
 * Technical severity levels
 */
export enum HttpErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}
