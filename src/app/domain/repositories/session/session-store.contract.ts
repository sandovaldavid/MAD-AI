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

/**
 * Snapshot representation of authentication tokens for storage in the MAD-AI system.
 * Used for token persistence, automatic refresh operations, and session management.
 *
 * @description This contract provides a secure storage format for authentication
 * tokens, supporting both access and refresh token scenarios. It includes
 * expiration data for intelligent token management and refresh strategies.
 *
 * @example Complete token snapshot
 * ```typescript
 * const tokenSnapshot: TokenSnapshotContract = {
 *   accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   accessExp: 1692180600,
 *   refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 * };
 * ```
 *
 * @example Access token only (refresh not available)
 * ```typescript
 * const accessOnlySnapshot: TokenSnapshotContract = {
 *   accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   accessExp: 1692180600,
 *   refreshToken: null
 * };
 * ```
 *
 * @since 1.0.0
 * @domain Session Management
 */
export interface TokenSnapshotContract {
  /**
   * JWT access token for API authentication.
   * Null if no active session or token has been cleared.
   */
  accessToken?: string | null;
  /**
   * Unix timestamp for access token expiration.
   * Used for automatic token refresh before expiration.
   * Null if expiration is unknown.
   */
  accessExp?: number | null;
  refreshToken?: string | null;
}

/**
 * Complete session snapshot for persistence in the MAD-AI system.
 * Includes versioning for schema evolution and comprehensive state management.
 *
 * @description This contract represents a complete session state that can be
 * persisted, restored, and migrated across application versions. It combines
 * user data and tokens with metadata for robust session management.
 *
 * @example Complete session with user and tokens
 * ```typescript
 * const sessionSnapshot: SessionSnapshotContract = {
 *   user: {
 *     id: 123,
 *     username: 'john_doe',
 *     email: 'john@madai.com',
 *     roleId: 456,
 *     roleName: 'Developer',
 *     accessLevel: 50,
 *     isEmailConfirmed: true,
 *     status: UserStatus.ACTIVE,
 *     updatedAt: '2025-08-16T10:30:00Z'
 *   },
 *   tokens: {
 *     accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *     accessExp: 1692180600,
 *     refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *   },
 *   version: 1,
 *   updatedAt: 1692173400000
 * };
 * ```
 *
 * @example Empty session (logged out state)
 * ```typescript
 * const emptySession: SessionSnapshotContract = {
 *   user: null,
 *   tokens: null,
 *   version: 1,
 *   updatedAt: 1692173400000
 * };
 * ```
 *
 * @since 1.0.0
 * @domain Session Management
 */
export type SessionSnapshotContract = Readonly<{
  /**
   * Authenticated user data snapshot.
   * Null when no user is authenticated or session is cleared.
   */
  user: AuthUserSnapshotContract | null;
  /**
   * Authentication tokens snapshot.
   * Null when no tokens are available or session is cleared.
   */
  tokens: TokenSnapshotContract | null;
  /**
   * Schema version for migration support.
   * Enables backward compatibility when session structure evolves.
   * @minimum 1
   */
  version: number;
  /**
   * Timestamp when the session was last updated.
   * Unix timestamp in milliseconds for precise ordering.
   */
  updatedAt: number;
}>;
