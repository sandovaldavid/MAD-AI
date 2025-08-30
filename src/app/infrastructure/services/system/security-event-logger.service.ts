import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { LoggerService } from '@core/services/logger.service';
import {
  SecurityEventRepository,
  SecurityEvent,
  SecurityEventType,
} from '@domain/repositories/system/security-event.repository';

/**
 * Infrastructure implementation of SecurityEventRepository.
 *
 * @description Provides concrete implementation for security event logging
 * using the Core LoggerService. This service handles the technical aspects
 * of logging security events and classifying HTTP errors.
 *
 * @class SecurityEventLogger
 * @implements {SecurityEventRepository}
 *
 * @architecture Infrastructure Layer - Implements Domain contracts
 * - Uses Core LoggerService for actual logging
 * - Provides technical implementation details
 * - Independent of Application and Presentation layers
 */
@Injectable({ providedIn: 'root' })
export class SecurityEventLogger implements SecurityEventRepository {
  private logger = inject(LoggerService);

  /**
   * Logs a security event using the Core LoggerService.
   *
   * @description Records security events with appropriate log levels
   * and context information. Uses warn level for security events
   * to ensure visibility in production environments.
   *
   * @param event - The security event to log
   * @returns Promise that resolves when logging is complete
   *
   * @implementationDetails
   * - Uses LoggerService.warn() for security events
   * - Includes structured context for monitoring
   * - Non-blocking operation to avoid impacting application flow
   * - Sanitizes sensitive information before logging
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Sanitize sensitive information from event details
      const sanitizedDetails = this.sanitizeEventDetails(event.details);

      // Log with appropriate level based on event type
      const logLevel = this.getLogLevelForEventType(event.type);

      this.logger[logLevel](`Security Event: ${event.type}`, {
        operation: `security_event_${event.type.toLowerCase()}`,
        correlationId: `sec_${Date.now()}`,
        userId:
          typeof sanitizedDetails['userId'] === 'string' ? sanitizedDetails['userId'] : 'anonymous',
      });
    } catch (error) {
      // Log the logging failure but don't throw to avoid breaking the app
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Classifies HTTP errors into standardized security event types.
   *
   * @description Analyzes HTTP error responses and maps them to
   * predefined security event types for consistent monitoring.
   *
   * @param error - The HTTP error response to classify
   * @returns The classified security event type
   *
   * @implementationDetails
   * - Maps HTTP status codes to security event types
   * - Handles common authentication/authorization errors
   * - Provides fallback for unknown error types
   * - Fast and lightweight classification
   */
  classifyHttpError(error: HttpErrorResponse): SecurityEventType {
    switch (error.status) {
      case 401:
        // Check if it's token expiration vs general unauthorized
        return this.isTokenExpiredError(error) ? 'TOKEN_EXPIRED' : 'UNAUTHORIZED';

      case 403:
        return 'FORBIDDEN';

      case 429:
        return 'RATE_LIMIT';

      default:
        // For other errors, check if they might be security-related
        return this.classifyOtherError(error);
    }
  }

  /**
   * Determines the appropriate log level for a security event type.
   *
   * @private
   * @param eventType - The security event type
   * @returns The log level method name ('warn' | 'error')
   */
  private getLogLevelForEventType(eventType: SecurityEventType): 'warn' | 'error' {
    switch (eventType) {
      case 'UNAUTHORIZED':
      case 'FORBIDDEN':
      case 'TOKEN_EXPIRED':
        return 'warn'; // Standard security events

      case 'RATE_LIMIT':
      case 'INVALID_TOKEN':
      case 'SUSPICIOUS_ACTIVITY':
        return 'error'; // More serious security events

      default:
        return 'warn';
    }
  }

  /**
   * Sanitizes sensitive information from event details.
   *
   * @private
   * @param details - The raw event details
   * @returns Sanitized details safe for logging
   */
  private sanitizeEventDetails(details: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...details };

    // Remove or mask sensitive fields
    const sensitiveFields = ['password', 'token', 'authorization', 'cookie', 'secret'];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Determines if an unauthorized error is due to token expiration.
   *
   * @private
   * @param error - The HTTP error response
   * @returns True if the error appears to be token expiration
   */
  private isTokenExpiredError(error: HttpErrorResponse): boolean {
    // Check error message or response body for token expiration indicators
    const errorMessage = error.error?.message || error.message || '';
    const lowerMessage = errorMessage.toLowerCase();

    return (
      lowerMessage.includes('token') &&
      (lowerMessage.includes('expired') ||
        lowerMessage.includes('invalid') ||
        lowerMessage.includes('expired'))
    );
  }

  /**
   * Classifies other HTTP errors that might be security-related.
   *
   * @private
   * @param error - The HTTP error response
   * @returns The classified security event type
   */
  private classifyOtherError(error: HttpErrorResponse): SecurityEventType {
    // Check for suspicious patterns in the error
    const errorMessage = error.error?.message || error.message || '';
    const lowerMessage = errorMessage.toLowerCase();

    // Check for token-related errors
    if (lowerMessage.includes('token') && lowerMessage.includes('invalid')) {
      return 'INVALID_TOKEN';
    }

    // Check for other security-related patterns
    if (
      lowerMessage.includes('suspicious') ||
      lowerMessage.includes('blocked') ||
      lowerMessage.includes('denied')
    ) {
      return 'SUSPICIOUS_ACTIVITY';
    }

    // Default to unauthorized for unknown security-related errors
    return 'UNAUTHORIZED';
  }
}
