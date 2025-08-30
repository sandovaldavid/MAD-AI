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
