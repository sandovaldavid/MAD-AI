import { ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpErrorLogger } from '../http/http-error-logger';

/**
 * Global Error Handler - Core Layer
 *
 * Pure technical error handler that catches unhandled errors.
 * This is a cross-cutting concern that belongs in Core layer.
 *
 * @responsibility Technical error logging and basic error processing
 * @architecture Core Layer - Technical Cross-cutting Concern
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = inject(HttpErrorLogger);

  handleError(error: unknown): void {
    // Log technical error details
    this.logger.logGeneralError('Global unhandled error', error);

    // In development, also log to console
    if (typeof window !== 'undefined' && (window as any)['ng']) {
      console.error('🚨 Global Error Handler:', error);
    }

    // Could emit to monitoring service here
    // this.monitoringService.reportError(error);
  }
}
