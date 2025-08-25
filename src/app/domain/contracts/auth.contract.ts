/**
 * Polymorphic identifier for user authentication in the MAD-AI domain.
 * Represents the business concept that users can identify themselves using either
 * their email address or their username, reflecting real-world authentication patterns.
 *
 * @example Email identifier
 * ```typescript
 * const emailId: Identifier = { type: 'email', value: 'user@madai.com' };
 * ```
 *
 * @example Username identifier
 * ```typescript
 * const usernameId: Identifier = { type: 'username', value: 'john_doe' };
 * ```
 *
 * @since 1.0.0
 * @domain Authentication
 */
export type Identifier = { type: 'email'; value: string } | { type: 'username'; value: string };

/**
 * Contract for user authentication credentials in the MAD-AI system.
 * Encapsulates all necessary information for authenticating a user session,
 * including optional session persistence for enhanced user experience.
 *
 * @description This contract follows the principle of minimal required data
 * while allowing for optional enhancements like session persistence.
 *
 * @example Basic authentication
 * ```typescript
 * const credentials: CredentialsContract = {
 *   identifier: { type: 'email', value: 'user@madai.com' },
 *   password: 'securePassword123',
 *   rememberMe: false
 * };
 * ```
 *
 * @since 1.0.0
 * @domain Authentication
 */
export interface CredentialsContract {
  /** User identifier supporting both email and username authentication methods */
  identifier: Identifier;
  /** User password for authentication validation */
  password: string;
  /**
   * Optional flag to persist session across browser sessions.
   * When true, the session will survive browser restarts.
   * @default false
   */
  rememberMe?: boolean;
}

/**
 * Simple message result contract for operations that return textual feedback.
 * Used across the domain for operations that need to communicate results
 * to users in a human-readable format.
 *
 * @description This contract standardizes how the domain communicates
 * operation results, ensuring consistency across all business operations.
 *
 * @example Success message
 * ```typescript
 * const result: MessageResultContract = {
 *   message: 'Email confirmation sent successfully'
 * };
 * ```
 *
 * @since 1.0.0
 * @domain Core
 */
export interface MessageResultContract {
  /** Human-readable message describing the operation result */
  message: string;
}

/**
 * Contract for user registration data in the MAD-AI system.
 * Encapsulates all necessary information for creating a new user account,
 * including password confirmation for client-side validation.
 *
 * @description This contract follows the principle of capturing all required
 * registration data while maintaining type safety and validation support.
 * The password confirmation field enables client-side validation before
 * sending data to the domain layer.
 *
 * @example New user registration
 * ```typescript
 * const registration: RegisterUserContract = {
 *   username: 'john_doe',
 *   email: 'john@madai.com',
 *   password: 'SecurePassword123!',
 *   passwordConfirm: 'SecurePassword123!',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   roleId: 2 // Optional: default role will be assigned if omitted
 * };
 * ```
 *
 * @since 1.0.0
 * @domain Authentication
 */
export interface RegisterUserContract {
  /** Unique username for the new user account */
  username: string;
  /** Email address for the new user account */
  email: string;
  /** Password for the new user account */
  password: string;
  /** Password confirmation for client-side validation */
  passwordConfirm: string; // Renamed from password_confirm
  /** User's first name */
  firstName: string; // Renamed from first_name
  /** User's last name */
  lastName: string; // Renamed from last_name
  /**
   * Optional role ID to assign to the user.
   * If not provided, a default role will be assigned.
   * @default null
   */
  roleId?: number | null; // Renamed from role_id
}

/**
 * Contract for password reset operation in the MAD-AI system.
 * Encapsulates the token-based password reset flow with confirmation validation.
 *
 * @description This contract supports the secure password reset process
 * where users receive a token via email and use it to set a new password.
 * The password confirmation field ensures client-side validation.
 *
 * @example Password reset with token
 * ```typescript
 * const resetData: ResetPasswordContract = {
 *   token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   newPassword: 'NewSecurePassword123!',
 *   newPasswordConfirm: 'NewSecurePassword123!'
 * };
 * ```
 *
 * @since 1.0.0
 * @domain Authentication
 */
export interface ResetPasswordContract {
  /** Secure token received via email for password reset authorization */
  token: string;
  /** New password to set for the user account */
  newPassword: string;
  /** Confirmation of the new password for client-side validation */
  newPasswordConfirm: string;
}
