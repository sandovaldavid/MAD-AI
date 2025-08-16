import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ErrorHandlerService } from '../errors/error-handler.service';
import { FeatureIdentifier } from '../errors/error-strategy.interface';

/**
 * Enhanced error interceptor that uses feature-based error handling
 */
export const enhancedErrorInterceptor: HttpInterceptorFn = (req, next) => {
    const errorHandler = inject(ErrorHandlerService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Determine feature from URL or headers
            const feature = determineFeature(req.url, req.headers);

            // Determine operation from request
            const operation = determineOperation(req.method, req.url);

            // Process error through our enhanced system (without auto-notification)
            const processedError = errorHandler.handleError(error, feature, operation, {
                autoNotify: false, // Let facades handle notifications
            });

            // Attach processed message to error for facade consumption
            (error as any).customMessage = processedError.context.userMessage;
            (error as any).processedError = processedError;

            // Log additional context for debugging
            console.log(
                `[Enhanced Error Interceptor] Feature: ${feature}, Operation: ${operation}`,
                {
                    url: req.url,
                    method: req.method,
                    status: error.status,
                    customMessage: processedError.context.userMessage,
                    processedError,
                }
            );

            return throwError(() => error);
        })
    );
};

/**
 * Determines the feature from request URL and headers
 */
function determineFeature(url: string, headers: any): FeatureIdentifier {
    const urlLower = url.toLowerCase();

    // Check for explicit feature header
    const featureHeader = headers.get('X-Feature-Context');
    if (featureHeader) {
        return featureHeader as FeatureIdentifier;
    }

    // Determine from URL patterns
    if (
        urlLower.includes('/auth/') ||
        urlLower.includes('/login') ||
        urlLower.includes('/register')
    ) {
        return 'auth';
    }

    if (urlLower.includes('/roles/') || urlLower.includes('/permissions/')) {
        return 'roles';
    }

    if (urlLower.includes('/users/')) {
        return 'users';
    }

    if (urlLower.includes('/notifications/')) {
        return 'notifications';
    }

    if (urlLower.includes('/dashboard/')) {
        return 'dashboard';
    }

    return 'global';
}

/**
 * Determines the operation from HTTP method and URL
 */
function determineOperation(method: string, url: string): string {
    const urlLower = url.toLowerCase();
    const methodLower = method.toLowerCase();

    // Auth operations
    if (urlLower.includes('/login')) return 'login';
    if (urlLower.includes('/register')) return 'register';
    if (urlLower.includes('/logout')) return 'logout';
    if (urlLower.includes('/refresh')) return 'refresh';
    if (urlLower.includes('/confirm-email')) return 'confirm-email';
    if (urlLower.includes('/reset-password')) return 'reset-password';

    // Role operations
    if (urlLower.includes('/roles')) {
        switch (methodLower) {
            case 'get':
                return urlLower.includes('/roles/') && !urlLower.endsWith('/roles')
                    ? 'get-role'
                    : 'get-roles';
            case 'post':
                return 'create-role';
            case 'put':
            case 'patch':
                return 'update-role';
            case 'delete':
                return 'delete-role';
        }
    }

    // User operations
    if (urlLower.includes('/users')) {
        switch (methodLower) {
            case 'get':
                return urlLower.includes('/users/') && !urlLower.endsWith('/users')
                    ? 'get-user'
                    : 'get-users';
            case 'post':
                return 'create-user';
            case 'put':
            case 'patch':
                return 'update-user';
            case 'delete':
                return 'delete-user';
        }
    }

    // Generic operation based on HTTP method
    switch (methodLower) {
        case 'get':
            return 'fetch-data';
        case 'post':
            return 'create-data';
        case 'put':
        case 'patch':
            return 'update-data';
        case 'delete':
            return 'delete-data';
        default:
            return 'unknown-operation';
    }
}
