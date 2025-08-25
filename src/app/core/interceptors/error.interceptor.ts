import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { DomainEventProcessor } from '../../application/services/domain-event-processor.service';

/**
 * Enhanced Error Interceptor
 *
 * @description
 * HTTP interceptor that handles security-related errors and processes
 * domain events for authentication and authorization failures.
 *
 * @responsibilities
 * - Intercept HTTP errors related to authentication and authorization
 * - Process security domain events for audit logging
 * - Enhance error information for better debugging
 * - Handle token expiration and unauthorized access
 *
 * @since 1.0.0
 * @layer Infrastructure/Core
 */
export const enhancedErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const eventProcessor = inject(DomainEventProcessor);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Process security-related events for certain error types
      if (isSecurityError(error)) {
        // Fire and forget - don't await to avoid blocking the error chain
        processSecurityEvent(error, eventProcessor).catch((eventError) => {
          console.warn('Failed to process security event:', eventError);
        });
      }

      // Re-throw the error to continue the error handling chain
      return throwError(() => error);
    })
  );
};

/**
 * Determines if an HTTP error is security-related
 */
function isSecurityError(error: HttpErrorResponse): boolean {
  return error.status === 401 || error.status === 403 || error.status === 419;
}

/**
 * Processes security domain events for audit logging
 */
async function processSecurityEvent(
  error: HttpErrorResponse,
  eventProcessor: DomainEventProcessor
): Promise<void> {
  try {
    // Create a mock security event entity for processing
    // In a real implementation, this would be a proper domain entity
    const securityEvent = {
      eventType: 'SECURITY_VIOLATION_DETECTED',
      statusCode: error.status,
      url: error.url,
      timestamp: new Date(),
      getUncommittedEvents: () => [
        {
          eventType: 'SECURITY_VIOLATION_DETECTED',
          aggregateId: 'security',
          eventId: crypto.randomUUID(),
          eventData: {
            statusCode: error.status,
            url: error.url,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
          occurredOn: new Date(),
        },
      ],
      markEventsAsCommitted: () => {},
    };

    // Process the security event
    await eventProcessor.processEntityEvents(securityEvent as any);
  } catch (eventError) {
    // Log but don't throw - we don't want to break the error handling chain
    console.warn('Failed to process security event:', eventError);
  }
}
