import { Session } from '@domain/entities/session.entity';
import { User } from '@domain/entities/user.entity';
import {
  CredentialsContract,
  RegisterUserContract,
  ResetPasswordContract,
  MessageResultContract,
} from '@domain/repositories/business/auth.contract';

/**
 * @fileoverview Domain repository interface for authentication operations.
 *
 * @description Defines the contract for authentication services following Domain-Driven Design
 * principles. This interface establishes the boundary between the domain layer and infrastructure
 * layer, ensuring that domain logic remains independent of external implementations.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @example Basic Usage
 * ```typescript
 * // In a use case
 * @Injectable({ providedIn: 'root' })
 * export class LoginUseCase {
 *   constructor(@Inject(AUTH_REPOSITORY) private authRepo: AuthRepository) {}
 *
 *   async execute(credentials: CredentialsContract): Promise<Session> {
 *     return this.authRepo.login(credentials);
 *   }
 * }
 * ```
 *
 * @example Error Handling
 * ```typescript
 * try {
 *   const session = await authRepository.login(credentials);
 *   // Handle successful login
 * } catch (error) {
 *   if (error instanceof UnauthorizedError) {
 *     // Handle invalid credentials
 *   } else if (error instanceof AccountLockedError) {
 *     // Handle locked account
 *   }
 * }
 * ```
 *
 * @see {@link Session} - Session entity returned by authentication operations
 * @see {@link User} - User entity returned by profile operations
 * @see {@link CredentialsContract} - Login credentials structure
 * @see {@link RegisterUserContract} - Registration data structure
 */

/**
 * Repository interface for authentication operations.
 *
 * @description Provides contracts for all authentication-related operations including
 * login, logout, registration, password management, and email verification. All methods
 * return domain entities or contracts, maintaining domain integrity.
 *
 * @interface AuthRepository
 *
 * @businessRules
 * - All authentication operations must validate input data
 * - Session tokens must be securely generated and managed
 * - Password operations must follow security best practices
 * - Email verification must be time-limited and single-use
 * - User registration must validate uniqueness constraints
 *
 * @securityConsiderations
 * - Rate limiting should be implemented for security-sensitive operations
 * - Failed login attempts should be logged and monitored
 * - Password reset tokens must expire after a reasonable time
 * - Email verification tokens must be cryptographically secure
 *
 * @performanceNotes
 * - Authentication operations should complete within 3 seconds under normal load
 * - Session validation should be optimized for frequent calls
 * - Email operations may have longer latency due to external dependencies
 */
export interface AuthRepository {
  /**
   * Authenticates a user with provided credentials.
   *
   * @description Validates user credentials and creates an authenticated session.
   * This is the primary entry point for user authentication and should handle
   * various credential types (username/email + password).
   *
   * @param creds - User credentials including identifier and password
   * @returns Promise resolving to an authenticated Session entity
   *
   * @throws {UnauthorizedError} When credentials are invalid
   * @throws {AccountLockedError} When account is temporarily locked
   * @throws {AccountDisabledError} When account is permanently disabled
   * @throws {EmailNotConfirmedError} When email verification is required
   * @throws {NetworkError} When authentication service is unavailable
   *
   * @businessRules
   * - Must validate both identifier and password
   * - Should enforce rate limiting for failed attempts
   * - Must check account status before authentication
   * - Should log successful and failed authentication attempts
   *
   * @example Successful Login
   * ```typescript
   * const credentials = {
   *   identifier: 'user@example.com',
   *   password: 'SecurePassword123!',
   *   rememberMe: true
   * };
   *
   * try {
   *   const session = await authRepository.login(credentials);
   *   console.log(`User ${session.user.email.value} logged in successfully`);
   *   // Store session for subsequent requests
   * } catch (error) {
   *   console.error('Login failed:', error.message);
   * }
   * ```
   *
   * @example Rate Limiting Handling
   * ```typescript
   * try {
   *   const session = await authRepository.login(credentials);
   * } catch (error) {
   *   if (error instanceof TooManyAttemptsError) {
   *     const retryAfter = error.retryAfterSeconds;
   *     console.log(`Too many attempts. Try again in ${retryAfter} seconds`);
   *   }
   * }
   * ```
   */
  login(creds: CredentialsContract): Promise<Session>;

  /**
   * Logs out the current user session.
   *
   * @description Invalidates the current session and cleans up authentication state.
   * This operation should be idempotent and safe to call multiple times.
   *
   * @returns Promise that resolves when logout is complete
   *
   * @throws {NetworkError} When logout service is unavailable
   * @throws {InvalidSessionError} When session is already invalid (should be handled gracefully)
   *
   * @businessRules
   * - Must invalidate session tokens on the server
   * - Should clear client-side authentication state
   * - Must be idempotent (safe to call multiple times)
   * - Should log logout events for audit purposes
   *
   * @example Basic Logout
   * ```typescript
   * try {
   *   await authRepository.logout();
   *   console.log('User logged out successfully');
   *   // Redirect to login page
   * } catch (error) {
   *   console.warn('Logout failed, but proceeding with client cleanup');
   *   // Clear local session anyway
   * }
   * ```
   *
   * @example Graceful Logout
   * ```typescript
   * // Always attempt logout, but don't fail if session is already invalid
   * try {
   *   await authRepository.logout();
   * } catch (error) {
   *   if (!(error instanceof InvalidSessionError)) {
   *     console.error('Unexpected logout error:', error);
   *   }
   * } finally {
   *   // Always clear local state
   *   localSessionStore.clear();
   * }
   * ```
   */
  logout(refresh_token: string): Promise<MessageResultContract>;

  /**
   * Refreshes the current session with new tokens.
   *
   * @description Exchanges a refresh token for new access and refresh tokens,
   * extending the user's authenticated session without requiring re-login.
   *
   * @returns Promise resolving to a new Session entity with fresh tokens
   *
   * @throws {UnauthorizedError} When refresh token is invalid or expired
   * @throws {InvalidSessionError} When session cannot be refreshed
   * @throws {NetworkError} When refresh service is unavailable
   *
   * @businessRules
   * - Must validate refresh token before issuing new tokens
   * - Should invalidate the old refresh token when issuing new ones
   * - Must preserve user context and permissions
   * - Should extend session lifetime appropriately
   *
   * @example Automatic Token Refresh
   * ```typescript
   * try {
   *   const newSession = await authRepository.refresh();
   *   // Update stored tokens
   *   tokenStore.updateTokens({
   *     accessToken: newSession.access.value,
   *     refreshToken: newSession.refresh.value
   *   });
   * } catch (error) {
   *   if (error instanceof UnauthorizedError) {
   *     // Refresh token expired, require re-login
   *     redirectToLogin();
   *   }
   * }
   * ```
   */
  refresh(token_refresh: string): Promise<Session>;

  /**
   * Retrieves the current authenticated user's profile.
   *
   * @description Fetches complete user profile information for the currently
   * authenticated session. This operation requires a valid session token.
   *
   * @returns Promise resolving to the current User entity
   *
   * @throws {UnauthorizedError} When session is invalid or expired
   * @throws {UserNotFoundError} When user account no longer exists
   * @throws {NetworkError} When profile service is unavailable
   *
   * @businessRules
   * - Must validate session token before returning user data
   * - Should return current user state (including any recent changes)
   * - Must include complete user profile with role information
   * - Should be optimized for frequent calls
   *
   * @example Profile Retrieval
   * ```typescript
   * try {
   *   const currentUser = await authRepository.me();
   *   console.log(`Current user: ${currentUser.fullName}`);
   *   console.log(`Role: ${currentUser.role.name}`);
   * } catch (error) {
   *   if (error instanceof UnauthorizedError) {
   *     // Session expired, prompt for re-authentication
   *     promptReAuth();
   *   }
   * }
   * ```
   */
  me(): Promise<User>;

  /**
   * Registers a new user account.
   *
   * @description Creates a new user account with the provided registration data.
   * This typically includes email verification as part of the registration flow.
   *
   * @param data - Complete user registration information
   * @returns Promise that resolves when registration is complete
   *
   * @throws {ValidationError} When registration data is invalid
   * @throws {ConflictError} When username or email already exists
   * @throws {WeakPasswordError} When password doesn't meet security requirements
   * @throws {NetworkError} When registration service is unavailable
   *
   * @businessRules
   * - Must validate all registration data before processing
   * - Should enforce unique username and email constraints
   * - Must apply password complexity requirements
   * - Should send email verification after successful registration
   * - Must create user with appropriate default role
   *
   * @example User Registration
   * ```typescript
   * const registrationData = {
   *   username: 'newuser',
   *   email: 'user@example.com',
   *   password: 'SecurePassword123!',
   *   firstName: 'John',
   *   lastName: 'Doe'
   * };
   *
   * try {
   *   await authRepository.register(registrationData);
   *   console.log('Registration successful. Please check email for verification.');
   * } catch (error) {
   *   if (error instanceof ConflictError) {
   *     console.error('Username or email already exists');
   *   } else if (error instanceof WeakPasswordError) {
   *     console.error('Password does not meet requirements');
   *   }
   * }
   * ```
   */
  register(data: RegisterUserContract): Promise<void>;

  /**
   * Confirms user email address with verification token.
   *
   * @description Validates an email verification token and marks the user's
   * email as confirmed, typically completing the registration process.
   *
   * @param token - Email verification token from confirmation email
   * @returns Promise resolving to operation result message
   *
   * @throws {InvalidTokenError} When verification token is invalid or expired
   * @throws {AlreadyConfirmedError} When email is already confirmed
   * @throws {NetworkError} When verification service is unavailable
   *
   * @businessRules
   * - Must validate token authenticity and expiration
   * - Should be idempotent for already confirmed emails
   * - Must update user's email confirmation status
   * - Should log successful confirmations for audit purposes
   *
   * @example Email Confirmation
   * ```typescript
   * // Token typically comes from URL parameter
   * const verificationToken = new URLSearchParams(window.location.search).get('token');
   *
   * try {
   *   const result = await authRepository.confirmEmail(verificationToken);
   *   console.log(result.message); // "Email confirmed successfully"
   * } catch (error) {
   *   if (error instanceof InvalidTokenError) {
   *     console.error('Invalid or expired verification link');
   *   } else if (error instanceof AlreadyConfirmedError) {
   *     console.info('Email already confirmed');
   *   }
   * }
   * ```
   */
  confirmEmail(token: string): Promise<MessageResultContract>;

  /**
   * Initiates password reset process for a user.
   *
   * @description Sends a password reset email to the specified address if
   * a user account exists with that email. This operation should be safe
   * to call even with non-existent emails to prevent email enumeration.
   *
   * @param email - Email address to send password reset link
   * @returns Promise resolving to operation result message
   *
   * @throws {ValidationError} When email format is invalid
   * @throws {NetworkError} When password reset service is unavailable
   * @throws {RateLimitError} When too many reset requests have been made
   *
   * @businessRules
   * - Must validate email format before processing
   * - Should implement rate limiting to prevent abuse
   * - Must not reveal whether email exists in system
   * - Should generate secure, time-limited reset tokens
   * - Must send reset email to specified address if account exists
   *
   * @example Password Reset Request
   * ```typescript
   * try {
   *   const result = await authRepository.requestPasswordReset('user@example.com');
   *   console.log(result.message); // "If account exists, reset email sent"
   * } catch (error) {
   *   if (error instanceof RateLimitError) {
   *     console.error('Too many reset attempts. Please try again later.');
   *   }
   * }
   * ```
   */
  requestPasswordReset(email: string): Promise<MessageResultContract>;

  /**
   * Completes password reset with token and new password.
   *
   * @description Validates a password reset token and updates the user's
   * password with the provided new password. The token is consumed upon
   * successful password update.
   *
   * @param data - Password reset data including token and new password
   * @returns Promise resolving to operation result message
   *
   * @throws {InvalidTokenError} When reset token is invalid or expired
   * @throws {WeakPasswordError} When new password doesn't meet requirements
   * @throws {ValidationError} When password confirmation doesn't match
   * @throws {NetworkError} When password reset service is unavailable
   *
   * @businessRules
   * - Must validate token authenticity and expiration
   * - Should enforce password complexity requirements
   * - Must ensure password and confirmation match
   * - Should invalidate token after successful use
   * - Must update user's password securely
   * - Should log password change events for audit purposes
   *
   * @example Password Reset Completion
   * ```typescript
   * const resetData = {
   *   token: 'reset-token-from-email',
   *   password: 'NewSecurePassword123!',
   *   passwordConfirmation: 'NewSecurePassword123!'
   * };
   *
   * try {
   *   const result = await authRepository.confirmPasswordReset(resetData);
   *   console.log(result.message); // "Password updated successfully"
   *   // Redirect to login page
   * } catch (error) {
   *   if (error instanceof InvalidTokenError) {
   *     console.error('Invalid or expired reset link');
   *   } else if (error instanceof WeakPasswordError) {
   *     console.error('Password does not meet security requirements');
   *   }
   * }
   * ```
   */
  confirmPasswordReset(data: ResetPasswordContract): Promise<MessageResultContract>;
}
