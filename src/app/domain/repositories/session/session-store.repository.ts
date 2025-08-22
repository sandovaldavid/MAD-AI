import type {
    AuthUserSnapshotContract,
    TokenSnapshotContract,
    SessionSnapshotContract,
} from '@domain/contracts/session-store.contract';

/**
 * @fileoverview Domain repository interfaces for session storage operations.
 *
 * @description Defines comprehensive contracts for session state persistence including
 * user data, authentication tokens, and complete session snapshots. These interfaces
 * follow Domain-Driven Design principles and provide clean abstractions for different
 * storage strategies (localStorage, sessionStorage, IndexedDB, etc.).
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @example Basic Session Storage
 * ```typescript
 * // In an infrastructure implementation
 * @Injectable({ providedIn: 'root' })
 * export class LocalStorageTokenStore implements TokenStorePort {
 *   async read(): Promise<TokenSnapshotContract | null> {
 *     const data = localStorage.getItem('auth_tokens');
 *     return data ? JSON.parse(data) : null;
 *   }
 * }
 * ```
 *
 * @example Session Persistence
 * ```typescript
 * // Save complete session
 * await sessionStore.writeAll({
 *   user: { id: 123, email: 'user@example.com' },
 *   tokens: { accessToken: '...', refreshToken: '...' },
 *   metadata: { loginTime: new Date().toISOString() }
 * });
 * ```
 *
 * @see {@link AuthUserSnapshotContract} - User data persistence contract
 * @see {@link TokenSnapshotContract} - Token persistence contract
 * @see {@link SessionSnapshotContract} - Complete session persistence contract
 */

/**
 * Repository port interface for authenticated user data persistence.
 *
 * @description Provides contracts for storing and retrieving user profile
 * information that should persist across browser sessions. This interface
 * abstracts the storage mechanism and provides consistent user data management.
 *
 * @interface AuthUserStorePort
 *
 * @businessRules
 * - User data must be encrypted when stored in persistent storage
 * - Sensitive information should be excluded from persistence
 * - User data should be validated on read operations
 * - Storage operations should be atomic to prevent corruption
 * - User data should have expiration policies for security
 *
 * @performanceConsiderations
 * - Read operations should be optimized for frequent access
 * - Write operations should be debounced to prevent excessive storage updates
 * - Large user profiles should support partial updates
 * - Storage quotas should be monitored and managed
 *
 * @securityNotes
 * - User data should be encrypted at rest when possible
 * - Sensitive fields should be excluded from persistence
 * - Storage access should be validated and logged
 * - Data integrity should be verified on read operations
 */
export interface AuthUserStorePort {
    /**
     * Retrieves stored user data from persistent storage.
     *
     * @description Reads the current user profile snapshot from storage.
     * Returns null if no user data is stored or if the stored data is invalid.
     * This operation should validate data integrity and handle corruption gracefully.
     *
     * @returns Promise resolving to user snapshot or null if not found
     *
     * @throws {StorageError} When storage access fails
     * @throws {DataCorruptionError} When stored data is corrupted
     * @throws {SecurityError} When stored data fails security validation
     *
     * @businessRules
     * - Must validate data integrity before returning
     * - Should handle storage format migrations
     * - Must exclude expired data from results
     * - Should log access attempts for security monitoring
     *
     * @example User Data Retrieval
     * ```typescript
     * try {
     *   const userData = await authUserStore.read();
     *   if (userData) {
     *     console.log(`Stored user: ${userData.email} (ID: ${userData.id})`);
     *     console.log(`Role: ${userData.roleName}`);
     *   } else {
     *     console.log('No user data found in storage');
     *   }
     * } catch (error) {
     *   if (error instanceof DataCorruptionError) {
     *     // Clear corrupted data and start fresh
     *     await authUserStore.clear();
     *   }
     * }
     * ```
     *
     * @example Data Validation
     * ```typescript
     * // Validate stored user data
     * const userData = await authUserStore.read();
     * if (userData) {
     *   const isValid = validateUserSnapshot(userData);
     *   if (!isValid) {
     *     console.warn('Invalid user data found, clearing storage');
     *     await authUserStore.clear();
     *     return null;
     *   }
     * }
     * ```
     */
    read(): Promise<AuthUserSnapshotContract | null>;

    /**
     * Stores user data to persistent storage.
     *
     * @description Persists the provided user snapshot to storage, replacing
     * any existing user data. Passing null will remove user data from storage.
     * This operation should be atomic and handle storage failures gracefully.
     *
     * @param snapshot - User data to store, or null to remove
     * @returns Promise that resolves when storage is complete
     *
     * @throws {StorageError} When storage write fails
     * @throws {QuotaExceededError} When storage quota is exceeded
     * @throws {ValidationError} When snapshot data is invalid
     * @throws {SecurityError} When snapshot fails security validation
     *
     * @businessRules
     * - Must validate snapshot data before storage
     * - Should encrypt sensitive data before persistence
     * - Must handle storage quota limitations
     * - Should implement atomic write operations
     * - Must update storage timestamps and metadata
     *
     * @example User Data Storage
     * ```typescript
     * const userSnapshot = {
     *   id: 123,
     *   email: 'user@example.com',
     *   username: 'johndoe',
     *   firstName: 'John',
     *   lastName: 'Doe',
     *   roleName: 'user',
     *   isActive: true
     * };
     *
     * try {
     *   await authUserStore.write(userSnapshot);
     *   console.log('User data stored successfully');
     * } catch (error) {
     *   if (error instanceof QuotaExceededError) {
     *     console.error('Storage quota exceeded');
     *     // Implement cleanup strategy
     *   }
     * }
     * ```
     *
     * @example Profile Update
     * ```typescript
     * // Update stored user profile
     * const currentUser = await authUserStore.read();
     * if (currentUser) {
     *   const updatedUser = {
     *     ...currentUser,
     *     firstName: 'Johnny',
     *     lastName: 'Smith'
     *   };
     *   await authUserStore.write(updatedUser);
     * }
     * ```
     *
     * @example Data Removal
     * ```typescript
     * // Remove user data on logout
     * try {
     *   await authUserStore.write(null);
     *   console.log('User data removed from storage');
     * } catch (error) {
     *   console.error('Failed to remove user data:', error.message);
     * }
     * ```
     */
    write(snapshot: AuthUserSnapshotContract | null): Promise<void>;

    /**
     * Clears all stored user data.
     *
     * @description Removes all user-related data from storage. This operation
     * should be atomic and idempotent, safe to call multiple times. This is
     * typically used during logout or account cleanup operations.
     *
     * @returns Promise that resolves when clearing is complete
     *
     * @throws {StorageError} When storage clear fails
     *
     * @businessRules
     * - Must remove all user-related data from storage
     * - Should be idempotent (safe to call multiple times)
     * - Must handle concurrent access appropriately
     * - Should log clear operations for audit purposes
     *
     * @example Logout Cleanup
     * ```typescript
     * // Clear user data during logout
     * try {
     *   await authUserStore.clear();
     *   console.log('User data cleared successfully');
     * } catch (error) {
     *   console.error('Failed to clear user data:', error.message);
     * }
     * ```
     *
     * @example Security Cleanup
     * ```typescript
     * // Clear data on security event
     * async function handleSecurityBreach(): Promise<void> {
     *   await Promise.all([
     *     authUserStore.clear(),
     *     tokenStore.clear(),
     *     sessionStore.clearAll()
     *   ]);
     *   console.log('All user data cleared for security');
     * }
     * ```
     */
    clear(): Promise<void>;
}

/**
 * Repository port interface for authentication token persistence.
 *
 * @description Provides contracts for storing and retrieving authentication
 * tokens including access tokens, refresh tokens, and token metadata. This
 * interface abstracts token storage mechanisms and provides secure token management.
 *
 * @interface TokenStorePort
 *
 * @businessRules
 * - Tokens must be encrypted when stored in persistent storage
 * - Token expiration must be validated on read operations
 * - Refresh tokens should have longer persistence than access tokens
 * - Storage operations should be atomic to prevent token corruption
 * - Token storage should support multiple concurrent sessions
 *
 * @performanceConsiderations
 * - Token reads should be optimized for authentication checks
 * - Token writes should be efficient for frequent refresh operations
 * - Expired tokens should be automatically cleaned up
 * - Token validation should be cached when appropriate
 *
 * @securityNotes
 * - Tokens must be encrypted at rest in persistent storage
 * - Token access should be logged for security monitoring
 * - Expired tokens should be securely removed from storage
 * - Token integrity should be verified on read operations
 */
export interface TokenStorePort {
    /**
     * Retrieves stored authentication tokens from persistent storage.
     *
     * @description Reads the current token snapshot from storage, including
     * access tokens, refresh tokens, and expiration information. Returns null
     * if no tokens are stored or if stored tokens are expired/invalid.
     *
     * @returns Promise resolving to token snapshot or null if not found
     *
     * @throws {StorageError} When storage access fails
     * @throws {TokenCorruptionError} When stored tokens are corrupted
     * @throws {SecurityError} When token validation fails
     *
     * @businessRules
     * - Must validate token expiration before returning
     * - Should verify token integrity and format
     * - Must handle token format migrations
     * - Should remove expired tokens automatically
     *
     * @example Token Retrieval
     * ```typescript
     * try {
     *   const tokens = await tokenStore.read();
     *   if (tokens) {
     *     console.log(`Access token expires: ${new Date(tokens.accessExp * 1000)}`);
     *
     *     // Check if access token is still valid
     *     const now = Math.floor(Date.now() / 1000);
     *     if (tokens.accessExp > now) {
     *       console.log('Access token is valid');
     *     } else {
     *       console.log('Access token expired, refresh needed');
     *     }
     *   } else {
     *     console.log('No tokens found in storage');
     *   }
     * } catch (error) {
     *   if (error instanceof TokenCorruptionError) {
     *     await tokenStore.clear();
     *   }
     * }
     * ```
     *
     * @example Automatic Token Validation
     * ```typescript
     * // Get tokens with automatic expiration check
     * async function getValidTokens(): Promise<TokenSnapshotContract | null> {
     *   const tokens = await tokenStore.read();
     *   if (!tokens) return null;
     *
     *   const now = Math.floor(Date.now() / 1000);
     *   if (tokens.accessExp <= now && tokens.refreshExp <= now) {
     *     // Both tokens expired, clear storage
     *     await tokenStore.clear();
     *     return null;
     *   }
     *
     *   return tokens;
     * }
     * ```
     */
    read(): Promise<TokenSnapshotContract | null>;

    /**
     * Stores authentication tokens to persistent storage.
     *
     * @description Persists the provided token snapshot to storage, replacing
     * any existing tokens. Passing null will remove tokens from storage.
     * This operation should encrypt sensitive token data before storage.
     *
     * @param snapshot - Token data to store, or null to remove
     * @returns Promise that resolves when storage is complete
     *
     * @throws {StorageError} When storage write fails
     * @throws {QuotaExceededError} When storage quota is exceeded
     * @throws {ValidationError} When token data is invalid
     * @throws {EncryptionError} When token encryption fails
     *
     * @businessRules
     * - Must validate token format and expiration before storage
     * - Should encrypt tokens before persistence
     * - Must handle storage quota limitations
     * - Should implement atomic write operations
     * - Must set appropriate storage metadata
     *
     * @example Token Storage
     * ```typescript
     * const tokenSnapshot = {
     *   accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
     *   refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
     *   accessExp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
     *   refreshExp: Math.floor(Date.now() / 1000) + 86400 // 24 hours
     * };
     *
     * try {
     *   await tokenStore.write(tokenSnapshot);
     *   console.log('Tokens stored successfully');
     * } catch (error) {
     *   if (error instanceof EncryptionError) {
     *     console.error('Failed to encrypt tokens');
     *   }
     * }
     * ```
     *
     * @example Token Refresh
     * ```typescript
     * // Update tokens after refresh
     * async function updateTokensAfterRefresh(newTokens: TokenSnapshot): Promise<void> {
     *   try {
     *     await tokenStore.write(newTokens);
     *     console.log('Tokens refreshed and stored');
     *   } catch (error) {
     *     console.error('Failed to store refreshed tokens:', error.message);
     *     throw error; // Re-throw to handle refresh failure
     *   }
     * }
     * ```
     *
     * @example Token Removal
     * ```typescript
     * // Remove tokens on logout
     * try {
     *   await tokenStore.write(null);
     *   console.log('Tokens removed from storage');
     * } catch (error) {
     *   console.error('Failed to remove tokens:', error.message);
     * }
     * ```
     */
    write(snapshot: TokenSnapshotContract | null): Promise<void>;

    /**
     * Clears all stored authentication tokens.
     *
     * @description Removes all token-related data from storage. This operation
     * should be atomic and idempotent, safe to call multiple times. This is
     * typically used during logout or security cleanup operations.
     *
     * @returns Promise that resolves when clearing is complete
     *
     * @throws {StorageError} When storage clear fails
     *
     * @businessRules
     * - Must remove all token-related data from storage
     * - Should be idempotent (safe to call multiple times)
     * - Must handle concurrent access appropriately
     * - Should securely overwrite token data
     *
     * @example Logout Token Cleanup
     * ```typescript
     * // Clear tokens during logout
     * try {
     *   await tokenStore.clear();
     *   console.log('Tokens cleared successfully');
     * } catch (error) {
     *   console.error('Failed to clear tokens:', error.message);
     * }
     * ```
     *
     * @example Security Token Revocation
     * ```typescript
     * // Clear tokens on security event
     * async function revokeAllTokens(): Promise<void> {
     *   try {
     *     await tokenStore.clear();
     *     console.log('All tokens revoked for security');
     *   } catch (error) {
     *     console.error('Failed to revoke tokens:', error.message);
     *   }
     * }
     * ```
     */
    clear(): Promise<void>;
}

/**
 * Repository port interface for complete session data persistence.
 *
 * @description Provides atomic operations for complete session snapshots
 * including user data, tokens, and session metadata. This interface enables
 * consistent session state management across application restarts.
 *
 * @interface SessionStorePort
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
export interface SessionStorePort {
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
