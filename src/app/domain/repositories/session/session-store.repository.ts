import type { SessionSnapshotContract } from '@domain/repositories/session/session-store.contract';

/**
 * Repository port interface for complete session data persistence.
 *
 * @description Provides atomic operations for complete session snapshots
 * including user data, tokens, and session metadata. This interface enables
 * consistent session state management across application restarts.
 *
 * @interface SessionStoreRepository
 *
 * @businessRules
 * - Session operations must be atomic to prevent partial state corruption
 * - Session data must include version information for migration support
 * - Session expiration must be validated on read operations
 * - Multiple concurrent sessions should be supported when applicable
 * - Session data should include security metadata for validation
 *
 * @performanceConsiderations
 * - Session reads should be optimized for application startup
 * - Session writes should be efficient for frequent state updates
 * - Large session data should support partial updates when possible
 * - Session cleanup should be automated for expired sessions
 *
 * @securityNotes
 * - Complete session data must be encrypted at rest
 * - Session integrity should be verified on read operations
 * - Session access should be logged for security monitoring
 * - Session data should include tamper detection mechanisms
 */
export interface SessionStoreRepository {
  /**
   * Retrieves complete session data from persistent storage.
   *
   * @description Reads the complete session snapshot including user data,
   * tokens, and metadata. Returns null if no session is stored or if the
   * stored session is expired/invalid. This operation validates session integrity.
   *
   * @returns Promise resolving to session snapshot or null if not found
   *
   * @throws {StorageError} When storage access fails
   * @throws {SessionCorruptionError} When stored session is corrupted
   * @throws {SecurityError} When session validation fails
   * @throws {VersionMismatchError} When session format is incompatible
   *
   * @businessRules
   * - Must validate complete session integrity
   * - Should handle session format migrations
   * - Must verify session expiration
   * - Should validate session security metadata
   *
   * @example Session Restoration
   * ```typescript
   * try {
   *   const session = await sessionStore.readAll();
   *   if (session) {
   *     console.log(`Restoring session for user: ${session.user.email}`);
   *     console.log(`Session created: ${new Date(session.metadata.createdAt)}`);
   *
   *     // Validate session is still valid
   *     if (session.metadata.expiresAt &&
   *         new Date(session.metadata.expiresAt) < new Date()) {
   *       console.log('Session expired, clearing storage');
   *       await sessionStore.clearAll();
   *       return null;
   *     }
   *
   *     return session;
   *   } else {
   *     console.log('No stored session found');
   *   }
   * } catch (error) {
   *   if (error instanceof SessionCorruptionError) {
   *     await sessionStore.clearAll();
   *   }
   * }
   * ```
   *
   * @example Application Startup
   * ```typescript
   * // Restore session on application startup
   * async function initializeSession(): Promise<void> {
   *   const storedSession = await sessionStore.readAll();
   *   if (storedSession) {
   *     // Validate tokens are still valid
   *     const now = Math.floor(Date.now() / 1000);
   *     if (storedSession.tokens.refreshExp > now) {
   *       // Session is recoverable
   *       await restoreUserSession(storedSession);
   *     } else {
   *       // Session expired, start fresh
   *       await sessionStore.clearAll();
   *     }
   *   }
   * }
   * ```
   */
  readAll(): Promise<SessionSnapshotContract | null>;

  /**
   * Stores complete session data to persistent storage.
   *
   * @description Atomically persists the complete session snapshot including
   * user data, tokens, and metadata. Passing null will remove the session
   * from storage. This operation ensures session consistency.
   *
   * @param snapshot - Complete session data to store, or null to remove
   * @returns Promise that resolves when storage is complete
   *
   * @throws {StorageError} When storage write fails
   * @throws {QuotaExceededError} When storage quota is exceeded
   * @throws {ValidationError} When session data is invalid
   * @throws {EncryptionError} When session encryption fails
   *
   * @businessRules
   * - Must validate complete session data before storage
   * - Should encrypt entire session before persistence
   * - Must ensure atomic write operations
   * - Should include session metadata and versioning
   * - Must handle storage quota limitations
   *
   * @example Complete Session Storage
   * ```typescript
   * const sessionSnapshot = {
   *   user: {
   *     id: 123,
   *     email: 'user@example.com',
   *     username: 'johndoe',
   *     firstName: 'John',
   *     lastName: 'Doe',
   *     roleName: 'user',
   *     isActive: true
   *   },
   *   tokens: {
   *     accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
   *     refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
   *     accessExp: Math.floor(Date.now() / 1000) + 3600,
   *     refreshExp: Math.floor(Date.now() / 1000) + 86400
   *   },
   *   metadata: {
   *     version: '1.0',
   *     createdAt: new Date().toISOString(),
   *     lastAccessAt: new Date().toISOString(),
   *     deviceId: 'device-123',
   *     userAgent: navigator.userAgent
   *   }
   * };
   *
   * try {
   *   await sessionStore.writeAll(sessionSnapshot);
   *   console.log('Complete session stored successfully');
   * } catch (error) {
   *   if (error instanceof QuotaExceededError) {
   *     // Implement session cleanup strategy
   *     await cleanupOldSessions();
   *   }
   * }
   * ```
   *
   * @example Session Update
   * ```typescript
   * // Update session with new token information
   * async function updateSessionTokens(newTokens: TokenSnapshot): Promise<void> {
   *   const currentSession = await sessionStore.readAll();
   *   if (currentSession) {
   *     const updatedSession = {
   *       ...currentSession,
   *       tokens: newTokens,
   *       metadata: {
   *         ...currentSession.metadata,
   *         lastAccessAt: new Date().toISOString()
   *       }
   *     };
   *     await sessionStore.writeAll(updatedSession);
   *   }
   * }
   * ```
   */
  writeAll(snapshot: SessionSnapshotContract | null): Promise<void>;

  /**
   * Clears all stored session data.
   *
   * @description Atomically removes all session-related data from storage.
   * This operation should be atomic and idempotent, safe to call multiple times.
   * This is the primary method for session cleanup during logout or security events.
   *
   * @returns Promise that resolves when clearing is complete
   *
   * @throws {StorageError} When storage clear fails
   *
   * @businessRules
   * - Must remove all session-related data atomically
   * - Should be idempotent (safe to call multiple times)
   * - Must handle concurrent access appropriately
   * - Should securely overwrite sensitive session data
   * - Must clean up all related storage keys and metadata
   *
   * @example Logout Session Cleanup
   * ```typescript
   * // Complete session cleanup during logout
   * async function handleLogout(): Promise<void> {
   *   try {
   *     await sessionStore.clearAll();
   *     console.log('Session cleared successfully');
   *
   *     // Redirect to login page
   *     window.location.href = '/login';
   *   } catch (error) {
   *     console.error('Failed to clear session:', error.message);
   *   }
   * }
   * ```
   *
   * @example Security Event Cleanup
   * ```typescript
   * // Clear session on security breach
   * async function handleSecurityBreach(): Promise<void> {
   *   try {
   *     await sessionStore.clearAll();
   *     console.log('Session cleared for security');
   *
   *     // Show security notification
   *     showSecurityAlert('Session cleared for your protection');
   *   } catch (error) {
   *     console.error('Failed to clear session during security event');
   *   }
   * }
   * ```
   *
   * @example Application Reset
   * ```typescript
   * // Clear session during application reset
   * async function resetApplication(): Promise<void> {
   *   await Promise.all([
   *     sessionStore.clearAll(),
   *     // Clear other application state
   *     cacheStore.clear(),
   *     userPreferencesStore.clear()
   *   ]);
   *
   *   console.log('Application reset complete');
   * }
   * ```
   */
  clearAll(): Promise<void>;
}
