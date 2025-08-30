import { AuthUserSnapshotContract } from './auth-user-store.contract';
import { TokenSnapshotContract } from './token-store.contract';

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
