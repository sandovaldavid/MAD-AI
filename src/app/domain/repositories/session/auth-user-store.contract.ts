import { UserStatus } from '@domain/enums/user-status.enum';

/**
 * Snapshot representation of authenticated user data for storage in the MAD-AI system.
 * Used for session persistence, hydration, and offline user state management.
 *
 * @description This contract represents a flattened, storage-friendly version
 * of the authenticated user's essential data. It's designed for efficient
 * serialization/deserialization and includes all necessary information
 * for maintaining user context across sessions.
 *
 * @example Active authenticated user snapshot
 * ```typescript
 * const userSnapshot: AuthUserSnapshotContract = {
 *   id: 123,
 *   username: 'john_doe',
 *   email: 'john@madai.com',
 *   roleId: 456,
 *   roleName: 'Developer',
 *   accessLevel: 50,
 *   isEmailConfirmed: true,
 *   status: UserStatus.ACTIVE,
 *   updatedAt: '2025-08-16T10:30:00Z'
 * };
 * ```
 *
 * @since 1.0.0
 * @domain Session Management
 */
export interface AuthUserSnapshotContract {
  /** Unique identifier of the authenticated user */
  id: number;
  /** Username of the authenticated user */
  username: string;
  /** Email address of the authenticated user */
  email: string;
  /**
   * ID of the user's assigned role.
   * Null if no role is assigned or role data is unavailable.
   */
  roleId?: number | null;
  /**
   * Name of the user's assigned role.
   * Null if no role is assigned or role data is unavailable.
   */
  roleName?: string | null;
  /**
   * Access level derived from the user's role.
   * Used for quick permission checks without role lookups.
   * Null if role data is unavailable.
   */
  accessLevel?: number | null;
  /**
   * Email confirmation status of the user.
   * Critical for feature access and security verification.
   * Null if confirmation status is unknown.
   */
  isEmailConfirmed?: boolean | null;
  /**
   * Current status of the user account.
   * Used for account state management and access control.
   * Null if status is unknown.
   */
  status?: UserStatus | null;
  /**
   * Timestamp of the last user data update.
   * Used for cache invalidation and data freshness checks.
   * ISO 8601 format string or null if unknown.
   */
  updatedAt?: string | null;
}
