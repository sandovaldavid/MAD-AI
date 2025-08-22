import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { HttpErrorClassifier } from '../cross-cutting/http/http-error-classifier';
import { HttpErrorLogger } from '../cross-cutting/http/http-error-logger';

/**
 * Pure Technical HTTP Error Interceptor - Core Layer
 *
 * @description Purely technical HTTP error processing interceptor.
 * Contains NO business logic, NO feature-specific knowledge.
 * Only performs technical error classification and logging.
 *
 * @architecturalNotes
 * - Core Layer: Pure technical processing only
 * - NO feature knowledge (auth, roles, etc.)
 * - NO business logic
 * - NO Application layer dependencies
 * - Attaches only technical classification to error
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
    const classifier = inject(HttpErrorClassifier);
    const logger = inject(HttpErrorLogger);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Pure technical classification
            const classification = classifier.classify(error);

            // Pure technical logging
            logger.logHttpError(error, classification, {
                method: req.method,
                operation: 'http_request',
                component: 'http_interceptor',
            });

            // Attach only technical classification to error
            // Application layer will handle feature-specific processing
            (error as any).technicalClassification = classification;

            console.log(`[Core HTTP Interceptor] Technical classification:`, {
                url: req.url,
                method: req.method,
                status: error.status,
                category: classification.category,
                severity: classification.severity,
                isRetryable: classification.isRetryable,
            });

            return throwError(() => error);
        })
    );
};
