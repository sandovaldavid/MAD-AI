import { HttpErrorResponse } from '@angular/common/http';

/**
 * Repository port interface for security event logging.
 *
 * @description Provides contracts for logging and classifying security-related
 * events in HTTP communications. This interface abstracts security event
 * logging mechanisms and provides standardized security monitoring.
 *
 * @interface SecurityEventRepository
 *
 * @businessRules
 * - Security events must be logged for audit and monitoring purposes
 * - Events should include relevant context information
 * - Event classification should be consistent and standardized
 * - Logging should not block critical application flows
 *
 * @performanceConsiderations
 * - Security event logging should be asynchronous and non-blocking
 * - Event classification should be lightweight and fast
 * - Logging operations should have minimal impact on application performance
 *
 * @securityNotes
 * - Security events should be logged securely and reliably
 * - Sensitive information should be sanitized before logging
 * - Event logs should be protected from unauthorized access
 * - Event classification should help identify security threats
 */
export interface SecurityEventRepository {
  /**
   * Logs a security event for monitoring and audit purposes.
   *
   * @description Records security-related events with relevant context
   * information. This method should be non-blocking and handle failures
   * gracefully to avoid impacting application functionality.
   *
   * @param event - The security event to log
   * @returns Promise that resolves when logging is complete
   *
   * @throws {SecurityLoggingError} When logging fails critically
   *
   * @businessRules
   * - Must include timestamp for event ordering
   * - Should sanitize sensitive information
   * - Must handle logging failures gracefully
   * - Should provide meaningful event context
   */
  logSecurityEvent(event: SecurityEvent): Promise<void>;

  /**
   * Classifies HTTP errors into security event types.
   *
   * @description Analyzes HTTP error responses and classifies them into
   * standardized security event types for consistent monitoring and alerting.
   *
   * @param error - The HTTP error response to classify
   * @returns The classified security event type
   *
   * @businessRules
   * - Must handle all relevant HTTP status codes
   * - Should provide consistent classification
   * - Must be fast and lightweight
   * - Should support future security event types
   */
  classifyHttpError(error: HttpErrorResponse): SecurityEventType;
}

/**
 * Represents a security event with context information.
 *
 * @interface SecurityEvent
 */
export interface SecurityEvent {
  /**
   * The type of security event
   */
  type: SecurityEventType;

  /**
   * Additional details about the event
   */
  details: Record<string, unknown>;

  /**
   * When the event occurred
   */
  timestamp: Date;
}

/**
 * Standardized security event types for consistent classification.
 *
 * @type SecurityEventType
 */
export type SecurityEventType =
  | 'UNAUTHORIZED' // 401 - Authentication required
  | 'FORBIDDEN' // 403 - Authorization failed
  | 'TOKEN_EXPIRED' // Token expiration detected
  | 'RATE_LIMIT' // 429 - Rate limiting triggered
  | 'INVALID_TOKEN' // Token format/validation failed
  | 'SUSPICIOUS_ACTIVITY'; // Other security-related events
