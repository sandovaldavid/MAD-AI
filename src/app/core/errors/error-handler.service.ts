import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { mergeMap, retryWhen, take } from 'rxjs/operators';

import { ErrorStrategy, ProcessedError, FeatureIdentifier } from './error-strategy.interface';
import { AuthErrorStrategy } from './strategies/auth-error.strategy';
import { RolesErrorStrategy } from './strategies/roles-error.strategy';
import { DefaultErrorStrategy } from './strategies/default-error.strategy';
import { NotificationsFacade } from '@application/facades/notifications.facade';

/**
 * Central error handling service that orchestrates feature-specific error strategies
 */
@Injectable({
    providedIn: 'root',
})
export class ErrorHandlerService {
    private notifications = inject(NotificationsFacade);

    private strategies: ErrorStrategy[] = [
        new AuthErrorStrategy(),
        new RolesErrorStrategy(),
        new DefaultErrorStrategy(), // Always last as fallback
    ];

    /**
     * Processes an HTTP error using appropriate feature strategy
     */
    handleError(
        error: HttpErrorResponse,
        feature: FeatureIdentifier,
        operation: string = 'unknown',
        options: { autoNotify?: boolean } = {}
    ): ProcessedError {
        const strategy = this.findStrategy(error, feature);
        const processedError = strategy.process(error, feature, operation);

        this.logError(processedError);

        // Only auto-notify if explicitly requested (default false for interceptor usage)
        if (options.autoNotify) {
            this.notifyUser(processedError);
        }

        return {
            ...processedError,
            isHandled: true,
        };
    }

    /**
     * Creates a retry operator for HTTP requests based on error strategy
     */
    createRetryOperator(feature: FeatureIdentifier) {
        return (source: Observable<any>) =>
            source.pipe(
                retryWhen((errors) =>
                    errors.pipe(
                        mergeMap((error: HttpErrorResponse, index: number) => {
                            const strategy = this.findStrategy(error, feature);
                            const retryConfig = strategy.getRetryConfig(error);

                            if (!retryConfig || index >= retryConfig.maxAttempts) {
                                return throwError(() => error);
                            }

                            if (!retryConfig.retryCondition(error)) {
                                return throwError(() => error);
                            }

                            const delayMs = retryConfig.exponentialBackoff
                                ? retryConfig.delayMs * Math.pow(2, index)
                                : retryConfig.delayMs;

                            console.log(
                                `Retrying request (attempt ${index + 1}/${
                                    retryConfig.maxAttempts
                                }) after ${delayMs}ms`
                            );

                            return timer(delayMs);
                        }),
                        take(3) // Safety limit
                    )
                )
            );
    }

    /**
     * Gets user-friendly error message for display
     */
    getUserMessage(
        error: HttpErrorResponse,
        feature: FeatureIdentifier,
        operation: string = 'unknown'
    ): string {
        const strategy = this.findStrategy(error, feature);
        return strategy.getUserMessage(error, operation);
    }

    /**
     * Gets recovery actions for an error
     */
    getRecoveryActions(error: HttpErrorResponse, feature: FeatureIdentifier) {
        const strategy = this.findStrategy(error, feature);
        return strategy.getRecoveryActions(error);
    }

    /**
     * Transforms error for facade consumption
     */
    transformErrorForFacade(
        error: any,
        feature: FeatureIdentifier,
        operation: string = 'unknown'
    ): string {
        if (error instanceof HttpErrorResponse) {
            return this.getUserMessage(error, feature, operation);
        }

        if (error?.message) {
            return error.message;
        }

        return 'Error inesperado. Intenta de nuevo';
    }

    /**
     * Registers a new error strategy
     */
    registerStrategy(strategy: ErrorStrategy): void {
        // Insert before the default strategy (which should always be last)
        const defaultIndex = this.strategies.findIndex((s) => s instanceof DefaultErrorStrategy);
        if (defaultIndex > -1) {
            this.strategies.splice(defaultIndex, 0, strategy);
        } else {
            this.strategies.push(strategy);
        }
    }

    /**
     * Finds the appropriate strategy for handling an error
     */
    private findStrategy(error: HttpErrorResponse, feature: FeatureIdentifier): ErrorStrategy {
        return (
            this.strategies.find((strategy) => strategy.canHandle(error, feature)) ||
            this.strategies[this.strategies.length - 1]
        ); // Fallback to default
    }

    /**
     * Logs error information for debugging and monitoring
     */
    private logError(processedError: ProcessedError): void {
        if (!processedError.context.shouldLog) return;

        const logData = {
            errorId: processedError.errorId,
            timestamp: processedError.timestamp,
            feature: processedError.context.feature,
            operation: processedError.context.operation,
            status: processedError.originalError.status,
            url: processedError.originalError.url,
            message: processedError.context.userMessage,
            technical: processedError.context.technicalDetails,
            severity: processedError.context.severity,
            category: processedError.context.category,
        };

        switch (processedError.context.severity) {
            case 'critical':
                console.error('[ERROR-CRITICAL]', logData);
                break;
            case 'high':
                console.error('[ERROR-HIGH]', logData);
                break;
            case 'medium':
                console.warn('[ERROR-MEDIUM]', logData);
                break;
            default:
                console.log('[ERROR-LOW]', logData);
        }
    }

    /**
     * Shows notification to user if configured
     */
    private notifyUser(processedError: ProcessedError): void {
        if (!processedError.context.showNotification) return;

        const context = processedError.context;

        switch (context.severity) {
            case 'critical':
            case 'high':
                this.notifications.error(context.userMessage);
                break;
            case 'medium':
                this.notifications.warning(context.userMessage);
                break;
            case 'low':
                this.notifications.info(context.userMessage);
                break;
        }
    }
}
