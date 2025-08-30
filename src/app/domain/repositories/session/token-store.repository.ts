import { TokenSnapshotContract } from './token-store.contract';

/**
 * Repository port interface for authentication token persistence.
 *
 * @description Provides contracts for storing and retrieving authentication
 * tokens including access tokens, refresh tokens, and token metadata. This
 * interface abstracts token storage mechanisms and provides secure token management.
 *
 * @interface TokenStoreRepository
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
export interface TokenStoreRepository {
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
