/**
 * @fileoverview Domain repository interface for system clock operations.
 *
 * @description Defines contracts for time-related operations that abstract
 * system time dependencies. This interface follows Domain-Driven Design
 * principles and enables testable time operations through dependency injection.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @example Basic Time Operations
 * ```typescript
 * // In a use case
 * @Injectable({ providedIn: 'root' })
 * export class TokenValidationUseCase {
 *   constructor(@Inject(CLOCK_PORT) private clock: ClockPort) {}
 *
 *   isTokenExpired(expirationTime: number): boolean {
 *     return this.clock.nowEpochSeconds() >= expirationTime;
 *   }
 * }
 * ```
 *
 * @example Testing with Mock Clock
 * ```typescript
 * // Mock implementation for testing
 * class MockClock implements ClockPort {
 *   private currentTime = Math.floor(Date.now() / 1000);
 *
 *   nowEpochSeconds(): number {
 *     return this.currentTime;
 *   }
 *
 *   setTime(epochSeconds: number): void {
 *     this.currentTime = epochSeconds;
 *   }
 * }
 * ```
 *
 * @see {@link Date} - JavaScript Date object for time operations
 */

/**
 * Repository port interface for system clock operations.
 *
 * @description Provides contracts for time-related operations that enable
 * deterministic and testable time handling in domain logic. This abstraction
 * allows for easy mocking in tests and provides consistent time operations.
 *
 * @interface ClockPort
 *
 * @businessRules
 * - Time operations must be consistent within a single transaction
 * - Time values should be returned in UTC to avoid timezone issues
 * - Epoch time should be used for precise timestamp comparisons
 * - Time precision should be appropriate for the business domain
 *
 * @performanceConsiderations
 * - Time operations should be lightweight and fast
 * - Time caching should be considered for high-frequency operations
 * - System clock access should be minimized in tight loops
 * - Time operations should not block application execution
 *
 * @testingBenefits
 * - Enables deterministic testing with fixed time values
 * - Allows testing of time-sensitive business logic
 * - Supports time travel scenarios in tests
 * - Facilitates testing of timeout and expiration logic
 */
export interface ClockPort {
  /**
   * Returns the current time as Unix epoch seconds.
   *
   * @description Provides the current system time as the number of seconds
   * since Unix epoch (January 1, 1970, 00:00:00 UTC). This is the primary
   * method for getting precise timestamps for business operations.
   *
   * @returns Current time in Unix epoch seconds (integer)
   *
   * @businessRules
   * - Must return UTC time to avoid timezone inconsistencies
   * - Should return integer seconds (not milliseconds) for consistency
   * - Must be monotonic within reasonable system clock adjustments
   * - Should be consistent across all application components
   *
   * @example Token Expiration Check
   * ```typescript
   * // Check if JWT token is expired
   * function isTokenExpired(tokenExp: number): boolean {
   *   const currentTime = clock.nowEpochSeconds();
   *   return currentTime >= tokenExp;
   * }
   *
   * // Usage
   * const isExpired = isTokenExpired(1640995200); // Jan 1, 2022
   * console.log(`Token expired: ${isExpired}`);
   * ```
   *
   * @example Session Timeout Calculation
   * ```typescript
   * // Calculate session timeout
   * function calculateSessionTimeout(durationSeconds: number): number {
   *   const currentTime = clock.nowEpochSeconds();
   *   return currentTime + durationSeconds;
   * }
   *
   * // Create session with 1 hour timeout
   * const sessionExpiry = calculateSessionTimeout(3600);
   * console.log(`Session expires at: ${new Date(sessionExpiry * 1000)}`);
   * ```
   *
   * @example Rate Limiting Window
   * ```typescript
   * // Implement rate limiting with time windows
   * class RateLimiter {
   *   private requests = new Map<string, number[]>();
   *
   *   isAllowed(clientId: string, maxRequests: number, windowSeconds: number): boolean {
   *     const now = this.clock.nowEpochSeconds();
   *     const windowStart = now - windowSeconds;
   *
   *     // Get existing requests for client
   *     const clientRequests = this.requests.get(clientId) || [];
   *
   *     // Filter requests within current window
   *     const recentRequests = clientRequests.filter(time => time > windowStart);
   *
   *     // Check if under limit
   *     if (recentRequests.length < maxRequests) {
   *       recentRequests.push(now);
   *       this.requests.set(clientId, recentRequests);
   *       return true;
   *     }
   *
   *     return false;
   *   }
   * }
   * ```
   *
   * @example Audit Timestamp
   * ```typescript
   * // Add timestamp to audit events
   * function createAuditEvent(action: string, userId: number): AuditEvent {
   *   return {
   *     id: generateId(),
   *     action,
   *     userId,
   *     timestamp: clock.nowEpochSeconds(),
   *     metadata: {
   *       userAgent: navigator.userAgent,
   *       ipAddress: getUserIpAddress()
   *     }
   *   };
   * }
   * ```
   *
   * @example Cache Expiration
   * ```typescript
   * // Implement cache with time-based expiration
   * class TimedCache<T> {
   *   private cache = new Map<string, { value: T; expires: number }>();
   *
   *   set(key: string, value: T, ttlSeconds: number): void {
   *     const expires = this.clock.nowEpochSeconds() + ttlSeconds;
   *     this.cache.set(key, { value, expires });
   *   }
   *
   *   get(key: string): T | null {
   *     const entry = this.cache.get(key);
   *     if (!entry) return null;
   *
   *     const now = this.clock.nowEpochSeconds();
   *     if (now >= entry.expires) {
   *       this.cache.delete(key);
   *       return null;
   *     }
   *
   *     return entry.value;
   *   }
   * }
   * ```
   *
   * @example Testing Time-Sensitive Logic
   * ```typescript
   * // Test token validation with mock clock
   * describe('TokenValidationUseCase', () => {
   *   let useCase: TokenValidationUseCase;
   *   let mockClock: MockClock;
   *
   *   beforeEach(() => {
   *     mockClock = new MockClock();
   *     useCase = new TokenValidationUseCase(mockClock);
   *   });
   *
   *   it('should detect expired tokens', () => {
   *     // Set current time to January 1, 2022
   *     mockClock.setTime(1640995200);
   *
   *     // Token expired on December 31, 2021
   *     const expiredToken = { exp: 1640908800 };
   *
   *     expect(useCase.isTokenExpired(expiredToken.exp)).toBe(true);
   *   });
   *
   *   it('should detect valid tokens', () => {
   *     // Set current time to January 1, 2022
   *     mockClock.setTime(1640995200);
   *
   *     // Token expires on January 2, 2022
   *     const validToken = { exp: 1641081600 };
   *
   *     expect(useCase.isTokenExpired(validToken.exp)).toBe(false);
   *   });
   * });
   * ```
   */
  nowEpochSeconds(): number;

  /**
   * Returns the current time as a JavaScript Date object.
   *
   * @description Provides the current system time as a Date object for
   * operations that require date formatting, manipulation, or timezone
   * handling. This is a convenience method built on top of nowEpochSeconds().
   *
   * @returns Current time as JavaScript Date object
   *
   * @businessRules
   * - Must return Date object in UTC timezone
   * - Should be consistent with nowEpochSeconds() method
   * - Must handle Date object creation edge cases
   * - Should provide millisecond precision when available
   *
   * @example Date Formatting
   * ```typescript
   * // Format current date for display
   * function getCurrentDateString(): string {
   *   const now = clock.nowDate();
   *   return now.toISOString().split('T')[0]; // YYYY-MM-DD format
   * }
   *
   * console.log(`Today is: ${getCurrentDateString()}`);
   * ```
   *
   * @example Relative Time Calculation
   * ```typescript
   * // Calculate time ago string
   * function getTimeAgo(pastDate: Date): string {
   *   const now = clock.nowDate();
   *   const diffMs = now.getTime() - pastDate.getTime();
   *   const diffSeconds = Math.floor(diffMs / 1000);
   *
   *   if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
   *   if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;
   *   if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
   *   return `${Math.floor(diffSeconds / 86400)} days ago`;
   * }
   * ```
   */
  nowDate(): Date;

  /**
   * Returns the current time as Unix epoch milliseconds.
   *
   * @description Provides the current system time as the number of milliseconds
   * since Unix epoch. This method offers higher precision than nowEpochSeconds()
   * for operations that require millisecond accuracy.
   *
   * @returns Current time in Unix epoch milliseconds (integer)
   *
   * @businessRules
   * - Must return UTC time in milliseconds
   * - Should provide millisecond precision when available
   * - Must be consistent with other time methods
   * - Should handle system clock precision limitations
   *
   * @example High-Precision Timing
   * ```typescript
   * // Measure operation duration
   * function measureExecutionTime<T>(operation: () => T): { result: T; durationMs: number } {
   *   const startTime = clock.nowEpochMilliseconds();
   *   const result = operation();
   *   const endTime = clock.nowEpochMilliseconds();
   *
   *   return {
   *     result,
   *     durationMs: endTime - startTime
   *   };
   * }
   *
   * // Usage
   * const { result, durationMs } = measureExecutionTime(() => {
   *   return heavyComputation();
   * });
   * console.log(`Operation completed in ${durationMs}ms`);
   * ```
   *
   * @example Request Tracking
   * ```typescript
   * // Track request processing time
   * function logRequestDuration(requestId: string, startTime: number): void {
   *   const endTime = clock.nowEpochMilliseconds();
   *   const duration = endTime - startTime;
   *
   *   console.log(`Request ${requestId} processed in ${duration}ms`);
   *
   *   // Log slow requests
   *   if (duration > 1000) {
   *     console.warn(`Slow request detected: ${requestId} took ${duration}ms`);
   *   }
   * }
   * ```
   */
  nowEpochMilliseconds(): number;

  /**
   * Returns the current time formatted as ISO 8601 string.
   *
   * @description Provides the current system time as a standardized
   * ISO 8601 formatted string in UTC timezone. This is useful for
   * logging, API communication, and data serialization.
   *
   * @returns Current time as ISO 8601 string (YYYY-MM-DDTHH:mm:ss.sssZ)
   *
   * @businessRules
   * - Must return time in UTC timezone (Z suffix)
   * - Should follow ISO 8601 format precisely
   * - Must include millisecond precision when available
   * - Should be consistent with other time methods
   *
   * @example Structured Logging
   * ```typescript
   * // Add timestamp to log entries
   * function logEvent(level: string, message: string, metadata?: any): void {
   *   const logEntry = {
   *     timestamp: clock.nowISOString(),
   *     level,
   *     message,
   *     metadata
   *   };
   *
   *   console.log(JSON.stringify(logEntry));
   * }
   *
   * // Usage
   * logEvent('INFO', 'User login successful', { userId: 123 });
   * ```
   *
   * @example API Response Timestamp
   * ```typescript
   * // Add timestamp to API responses
   * function createApiResponse<T>(data: T, status: number): ApiResponse<T> {
   *   return {
   *     data,
   *     status,
   *     timestamp: clock.nowISOString(),
   *     success: status >= 200 && status < 300
   *   };
   * }
   * ```
   */
  nowISOString(): string;
}
