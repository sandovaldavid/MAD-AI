import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { ErrorHandlerService } from '../errors/error-handler.service';
import { FeatureIdentifier } from '../errors/error-strategy.interface';

/**
 * Enhanced error handling utilities for facades
 */
export class FacadeErrorHandler {
    private errorHandler = inject(ErrorHandlerService);

    constructor(private feature: FeatureIdentifier) {}

    /**
     * Handles errors in facade methods with feature-specific processing
     */
    handleError<T>(operation: string = 'unknown') {
        return (error: any): Observable<T> => {
            const errorMessage = this.errorHandler.transformErrorForFacade(
                error,
                this.feature,
                operation
            );

            // Log the error with context
            console.error(`[${this.feature.toUpperCase()}] Error in ${operation}:`, error);

            return throwError(() => new Error(errorMessage));
        };
    }

    /**
     * Transforms error for signal-based facades
     */
    transformError(error: any, operation: string = 'unknown'): string {
        // Check if the enhanced error interceptor already processed this error
        if (error?.customMessage) {
            console.log(
                `[Facade Error Handler] Using custom message from interceptor: ${error.customMessage}`
            );
            return error.customMessage;
        }

        return this.errorHandler.transformErrorForFacade(error, this.feature, operation);
    }

    /**
     * Creates an async error handler for facade methods
     */
    async handleAsyncError(error: any, operation: string = 'unknown'): Promise<never> {
        const errorMessage = this.transformError(error, operation);
        throw new Error(errorMessage);
    }

    /**
     * Gets recovery actions for display in UI
     */
    getRecoveryActions(error: HttpErrorResponse) {
        return this.errorHandler.getRecoveryActions(error, this.feature);
    }

    /**
     * Creates a retry operator for the feature
     */
    createRetryOperator() {
        return this.errorHandler.createRetryOperator(this.feature);
    }
}

/**
 * Factory function to create feature-specific error handlers
 */
export function createFacadeErrorHandler(feature: FeatureIdentifier): FacadeErrorHandler {
    return new FacadeErrorHandler(feature);
}

/**
 * Decorator for automatic error handling in facade methods
 */
export function HandleErrors(feature: FeatureIdentifier, operation?: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            try {
                return await originalMethod.apply(this, args);
            } catch (error) {
                const errorHandler = new FacadeErrorHandler(feature);
                const errorMessage = errorHandler.transformError(error, operation || propertyKey);
                throw new Error(errorMessage);
            }
        };

        return descriptor;
    };
}
