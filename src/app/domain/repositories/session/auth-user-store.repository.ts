import { AuthUserSnapshotContract } from './auth-user-store.contract';
/**
 * Repository port interface for authenticated user data persistence.
 *
 * @description Provides contracts for storing and retrieving user profile
 * information that should persist across browser sessions. This interface
 * abstracts the storage mechanism and provides consistent user data management.
 *
 * @interface AuthUserStoreRepository
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
export interface AuthUserStoreRepository {
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
