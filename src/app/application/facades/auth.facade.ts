import { inject, Injectable, signal, computed } from '@angular/core';
import { LoginUseCase } from '../use-cases/auth/login.usecase';
import { LogoutUseCase } from '../use-cases/auth/logout.usecase';
import { GetProfileUseCase } from '../use-cases/auth/get-profile.usecase';
import { RegisterUseCase } from '../use-cases/auth/register.usecase';
import { RefreshSessionUseCase } from '../use-cases/auth/refresh-session.usecase';
import { ConfirmEmailUseCase } from '../use-cases/auth/confirm-email.usecase';
import { RequestPasswordResetUseCase } from '../use-cases/auth/request-password-reset.usecase';
import { ConfirmPasswordResetUseCase } from '../use-cases/auth/confirm-password-reset.usecase';
import { NotificationsFacade } from './notifications.facade';
import type {
  LoginRequest,
  RegisterRequest,
  LogoutRequest,
  PasswordResetConfirmRequest,
} from '@application/types/auth.types';
import type { User } from '@domain/entities/user.entity';
import type { Session } from '@domain/entities/session.entity';
import type { FacadeOpts } from '@application/types/facade-opts';
import { ApplicationErrorTransformer } from '../errors/application-error.transformer';
import { LoggerService } from '@core/services/logger.service';
import type { NavSection } from '@presentation/navigation/types';

/**
 * Authentication Facade - Clean Orchestrator Following MAD-AI Patterns
 *
 * @description
 * Pure orchestrator that delegates all business logic to robust use cases.
 * This facade focuses solely on:
 * - Coordinating between use cases
 * - Managing reactive application state (loading, user, errors)
 * - Providing a clean API for the presentation layer
 *
 * All error handling, validation, and business logic is delegated to use cases.
 * Follows the same patterns established in NotificationsFacade and UsersFacade.
 *
 * @responsibilities
 * - Reactive state management for authentication UI
 * - Use case orchestration and coordination
 * - Session state synchronization
 * - Cross-facade integration with NotificationsFacade
 *
 * @architecture
 * - No direct business logic or error handling
 * - Uses robust use cases for all operations
 * - Manages reactive state with Angular signals
 * - Provides computed properties for UI binding
 * - Integrates with NotificationsFacade for user feedback
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  // ============================================================================
  // Dependencies
  // ============================================================================

  private readonly loginUC = inject(LoginUseCase);
  private readonly logoutUC = inject(LogoutUseCase);
  private readonly getProfileUC = inject(GetProfileUseCase);
  private readonly registerUC = inject(RegisterUseCase);
  private readonly refreshUC = inject(RefreshSessionUseCase);
  private readonly confirmEmailUC = inject(ConfirmEmailUseCase);
  private readonly reqResetUC = inject(RequestPasswordResetUseCase);
  private readonly confirmResetUC = inject(ConfirmPasswordResetUseCase);

  private readonly notifications = inject(NotificationsFacade);
  private readonly logger = inject(LoggerService);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  // ============================================================================
  // Private State Signals
  // ============================================================================

  /**
   * Loading state signal for async operations
   * @private
   * @type {Signal<boolean>}
   * @default false
   */
  private readonly _loading = signal(false);

  /**
   * Current authenticated user signal
   * @private
   * @type {Signal<User | null>}
   * @default null
   */
  private readonly _user = signal<User | null>(null);

  /**
   * Current session data signal
   * @private
   * @type {Signal<Session | null>}
   * @default null
   */
  private readonly _session = signal<Session | null>(null);

  /**
   * Current authentication error state signal
   * @private
   * @type {Signal<string | null>}
   * @default null
   */
  private readonly _authError = signal<string | null>(null);

  /**
   * Flag to track if session restoration has been attempted
   * Prevents multiple initialization attempts
   * @private
   * @type {Signal<boolean>}
   * @default false
   */
  private readonly _sessionRestoreAttempted = signal(false);

  // ============================================================================
  // Public Computed Properties (Reactive State)
  // ============================================================================

  /**
   * Loading state for async operations
   * Reactive computed property that updates when _loading signal changes
   * @type {Signal<boolean>}
   * @readonly
   */
  readonly loading = computed(() => this._loading());

  /**
   * Current authenticated user
   * Reactive computed property that updates when _user signal changes
   * @type {Signal<User | null>}
   * @readonly
   */
  readonly user = computed(() => this._user());

  /**
   * Current session data
   * Reactive computed property that updates when _session signal changes
   * @type {Signal<Session | null>}
   * @readonly
   */
  readonly session = computed(() => this._session());

  /**
   * Current error state
   * Reactive computed property that updates when _authError signal changes
   * @type {Signal<string | null>}
   * @readonly
   */
  readonly error = computed(() => this._authError());

  /**
   * Whether user is authenticated
   * Reactive computed property based on user presence
   * @type {Signal<boolean>}
   * @readonly
   */
  readonly isAuthenticated = computed(() => !!this._user());

  /**
   * Whether session restoration has been attempted
   * Reactive computed property that updates when _sessionRestoreAttempted signal changes
   * @type {Signal<boolean>}
   * @readonly
   */
  readonly sessionRestoreAttempted = computed(() => this._sessionRestoreAttempted());

  /**
   * User display name for UI components
   * Combines first and last name, returns empty string if no user
   * @type {Signal<string>}
   * @readonly
   */
  readonly userDisplayName = computed(() => {
    const user = this._user();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  /**
   * Whether current user has admin role
   * Reactive computed property that checks user role permissions
   * @type {Signal<boolean>}
   * @readonly
   */
  readonly isAdmin = computed(() => {
    const user = this._user();
    return user ? user.role.canAccessAdmin() : false;
  });

  // ============================================================================
  // Initialization and State Management Operations
  // ============================================================================

  /**
   * Initialize authentication state from storage
   * Uses the existing refreshProfile use case following Clean Architecture
   *
   * This method attempts to restore the user's session on application startup.
   * It prevents multiple initialization attempts and handles token expiration gracefully.
   *
   * @async
   * @returns {Promise<void>} Promise that resolves when initialization is complete
   * @throws {ApplicationError} When initialization fails due to network or authentication issues
   *
   * @since 1.0.0
   * @application AuthFacade
   * @example
   * ```typescript
   * await authFacade.initializeAuth();
   * ```
   */
  async initializeAuth(): Promise<void> {
    if (this._sessionRestoreAttempted()) {
      return; // Already attempted
    }

    this._sessionRestoreAttempted.set(true);

    try {
      // Use existing use case instead of accessing storage directly
      // This follows Clean Architecture by delegating to use cases
      await this.refreshProfile({ skipLoading: true });
    } catch {
      // If profile refresh fails (no tokens or expired), ensure clean state
      this.clearAuthStateCompletely();
    }
  }

  // ============================================================================
  // Authentication Operations
  // ============================================================================

  /**
   * Executes user login through robust use case
   *
   * @param request - User login credentials
   * @param opts - Optional facade execution options
   * @returns Promise that resolves when login is complete
   * @throws ApplicationError when login fails
   *
   * @since 1.0.0
   * @application AuthFacade
   */
  async login(request: LoginRequest, opts?: FacadeOpts): Promise<void> {
    if (!opts?.skipLoading) {
      this._loading.set(true);
    }

    // Clear any previous auth state but preserve loading state during operation
    this.clearAuthStateForNewOperation();

    try {
      const session = await this.loginUC.execute(request);

      this._session.set(session);
      this._user.set(session.user);

      // Send success notification
      await this.notifications.success(
        'Welcome back!',
        `Hello ${session.user.firstName}, you've successfully logged in.`
      );
    } catch (error: unknown) {
      // Log error details for debugging
      this.logger.error('Login failed', {
        operation: 'login',
        userId: this._user()?.id?.toString(),
      });

      // Transform error to user-friendly message
      const errorMessage = this.errorTransformer.transform(error as Error, {
        operation: 'login',
      });

      this.logger.debug('Login error transformed', {
        operation: 'login',
      });

      this._authError.set(errorMessage.userMessage);

      // Clear session state on login failure to ensure clean state
      this._session.set(null);
      this._user.set(null);

      // Don't re-throw - the error message is already set for the UI
      // The UI will display the error through the error signal
    } finally {
      if (!opts?.skipLoading) {
        this._loading.set(false);
      }
    }
  }

  /**
   * Executes user registration through robust use case
   *
   * @param request - User registration data
   * @param opts - Optional facade execution options
   * @returns Promise that resolves when registration is complete
   * @throws ApplicationError when registration fails
   *
   * @since 1.0.0
   * @application AuthFacade
   */
  async register(request: RegisterRequest, opts?: FacadeOpts): Promise<void> {
    if (!opts?.skipLoading) {
      this._loading.set(true);
    }
    this._authError.set(null);

    try {
      await this.registerUC.execute(request);

      // Send success notification
      await this.notifications.success(
        'Registration successful!',
        'Please check your email to confirm your account.'
      );
    } catch (error: unknown) {
      const errorMessage = this.errorTransformer.transform(error as Error);
      this._authError.set(errorMessage.userMessage);
      throw error;
    } finally {
      if (!opts?.skipLoading) {
        this._loading.set(false);
      }
    }
  }

  /**
   * Executes user logout through robust use case
   *
   * @param request - Optional logout request data
   * @param opts - Optional facade execution options
   * @returns Promise that resolves when logout is complete
   * @throws ApplicationError when logout fails
   *
   * @since 1.0.0
   * @application AuthFacade
   */
  async logout(request?: LogoutRequest, opts?: FacadeOpts): Promise<void> {
    if (!opts?.skipLoading) {
      this._loading.set(true);
    }
    this._authError.set(null);

    try {
      await this.logoutUC.execute();

      this._session.set(null);
      this._user.set(null);
      this._authError.set(null);

      // Send info notification
      await this.notifications.info(
        'Logged out successfully',
        'You have been safely logged out of your account.'
      );
    } catch (error: unknown) {
      const errorMessage = this.errorTransformer.transform(error as Error);
      this._authError.set(errorMessage.userMessage);
      // Don't throw on logout errors - still clear session
      this._session.set(null);
      this._user.set(null);
    } finally {
      if (!opts?.skipLoading) {
        this._loading.set(false);
      }
    }
  }

  /**
   * Executes session refresh through robust use case
   *
   * @param opts - Optional facade execution options
   * @returns Promise that resolves when session refresh is complete
   * @throws ApplicationError when session refresh fails
   *
   * @since 1.0.0
   * @application AuthFacade
   */
  async refreshSession(opts?: FacadeOpts): Promise<void> {
    // Session refresh is typically silent
    const showLoading = opts?.skipLoading === false;

    if (showLoading) {
      this._loading.set(true);
    }
    this._authError.set(null);

    try {
      const session = await this.refreshUC.execute();

      this._session.set(session);
      this._user.set(session.user);
    } catch (error: unknown) {
      // Failed session refresh usually means logout
      const errorMessage = this.errorTransformer.transform(error as Error);
      this._authError.set(errorMessage.userMessage);

      this._session.set(null);
      this._user.set(null);

      if (showLoading) {
        throw error;
      }
    } finally {
      if (showLoading) {
        this._loading.set(false);
      }
    }
  }

  /**
   * Refreshes user profile data
   *
   * @param opts - Optional facade execution options
   * @returns Promise that resolves when profile refresh is complete
   * @throws ApplicationError when profile refresh fails
   *
   * @since 1.0.0
   * @application AuthFacade
   */
  async refreshProfile(opts?: FacadeOpts): Promise<void> {
    if (!opts?.skipLoading) {
      this._loading.set(true);
    }
    this._authError.set(null);

    try {
      const user = await this.getProfileUC.execute();
      this._user.set(user);
    } catch (error: unknown) {
      // Profile refresh errors usually indicate session expiration
      const errorMessage = this.errorTransformer.transform(error as Error);
      this._authError.set(errorMessage.userMessage);
      this._user.set(null);
      this._session.set(null);
      throw error;
    } finally {
      if (!opts?.skipLoading) {
        this._loading.set(false);
      }
    }
  }

  // ============================================================================
  // Session Utility Methods
  // ============================================================================

  /**
   * Gets authentication token for manual API calls
   *
   * Returns the access token from the current session if available.
   * Useful for making authenticated API calls outside of the facade.
   *
   * @returns {string | null} The access token value or null if no session exists
   *
   * @since 1.0.0
   * @application AuthFacade
   * @example
   * ```typescript
   * const token = authFacade.getAccessTokenOrNull();
   * if (token) {
   *   // Make authenticated API call
   * }
   * ```
   */
  getAccessTokenOrNull(): string | null {
    const session = this._session();
    return session?.accessToken?.getValue() || null;
  }

  /**
   * Checks if current session is valid (not expired)
   *
   * Validates whether the current session's access token is still valid
   * by comparing against the provided timestamp.
   *
   * @param {number} nowEpochSeconds - Current timestamp in epoch seconds
   * @returns {boolean} True if session exists and is not expired, false otherwise
   *
   * @since 1.0.0
   * @application AuthFacade
   * @example
   * ```typescript
   * const isValid = authFacade.isSessionValid(Date.now() / 1000);
   * if (!isValid) {
   *   // Handle expired session
   * }
   * ```
   */
  isSessionValid(nowEpochSeconds: number): boolean {
    const session = this._session();
    return session ? session.isValid(nowEpochSeconds) : false;
  }

  /**
   * Gets remaining session time in seconds
   *
   * Calculates how many seconds remain until the current session expires.
   * Returns null if no session exists.
   *
   * @param {number} nowEpochSeconds - Current timestamp in epoch seconds
   * @returns {number | null} Remaining seconds until expiration, or null if no session
   *
   * @since 1.0.0
   * @application AuthFacade
   * @example
   * ```typescript
   * const remaining = authFacade.getSessionTimeRemaining(Date.now() / 1000);
   * if (remaining && remaining < 300) { // Less than 5 minutes
   *   // Warn user about impending expiration
   * }
   * ```
   */
  getSessionTimeRemaining(nowEpochSeconds: number): number | null {
    const session = this._session();
    if (!session || !session.accessToken.expSeconds) {
      return null;
    }
    const remaining = session.accessToken.expSeconds - nowEpochSeconds;
    return remaining > 0 ? remaining : 0;
  }

  // ============================================================================
  // Email and Password Reset Operations
  // ============================================================================

  /**
   * Confirms user email address
   *
   * @param token - Email confirmation token
   * @param opts - Optional facade execution options
   * @returns Promise that resolves when email confirmation is complete
   * @throws ApplicationError when email confirmation fails
   *
   * @since 1.0.0
   * @application AuthFacade
   */
  async confirmEmail(token: string, opts?: FacadeOpts): Promise<void> {
    if (!opts?.skipLoading) {
      this._loading.set(true);
    }
    this._authError.set(null);

    try {
      await this.confirmEmailUC.execute({ token });
      await this.refreshProfile({ skipLoading: true });

      // Send success notification
      await this.notifications.success(
        'Email confirmed!',
        'Your email address has been successfully confirmed.'
      );
    } catch (error: unknown) {
      const errorMessage = this.errorTransformer.transform(error as Error);
      this._authError.set(errorMessage.userMessage);
      throw error;
    } finally {
      if (!opts?.skipLoading) {
        this._loading.set(false);
      }
    }
  }

  /**
   * Requests password reset for user
   *
   * @param email - User email address
   * @param opts - Optional facade execution options
   * @returns Promise that resolves when password reset request is complete
   * @throws ApplicationError when password reset request fails
   *
   * @since 1.0.0
   * @application AuthFacade
   */
  async requestPasswordReset(email: string, opts?: FacadeOpts): Promise<void> {
    if (!opts?.skipLoading) {
      this._loading.set(true);
    }
    this._authError.set(null);

    try {
      await this.reqResetUC.execute({ email });

      // Send success notification
      await this.notifications.info(
        'Password reset requested',
        'Please check your email for password reset instructions.'
      );
    } catch (error: unknown) {
      const errorMessage = this.errorTransformer.transform(error as Error);
      this._authError.set(errorMessage.userMessage);
      throw error;
    } finally {
      if (!opts?.skipLoading) {
        this._loading.set(false);
      }
    }
  }

  /**
   * Confirms password reset with new password
   *
   * @param data - Password reset confirmation data
   * @param opts - Optional facade execution options
   * @returns Promise that resolves when password reset confirmation is complete
   * @throws ApplicationError when password reset confirmation fails
   *
   * @since 1.0.0
   * @application AuthFacade
   */
  async confirmPasswordReset(data: PasswordResetConfirmRequest, opts?: FacadeOpts): Promise<void> {
    if (!opts?.skipLoading) {
      this._loading.set(true);
    }
    this._authError.set(null);

    try {
      await this.confirmResetUC.execute(data);

      // Send success notification
      await this.notifications.success(
        'Password reset successful!',
        'Your password has been updated. Please log in with your new password.'
      );
    } catch (error: unknown) {
      const errorMessage = this.errorTransformer.transform(error as Error);
      this._authError.set(errorMessage.userMessage);
      throw error;
    } finally {
      if (!opts?.skipLoading) {
        this._loading.set(false);
      }
    }
  }

  // ============================================================================
  // State Management Operations
  // ============================================================================

  /**
   * Clears the current authentication error state
   *
   * This method resets the error signal to null, effectively clearing any
   * authentication-related error messages that may be displayed to the user.
   * Useful when transitioning between authentication states or when starting
   * new authentication operations.
   *
   * @returns {void}
   *
   * @since 1.0.0
   * @application AuthFacade
   * @example
   * ```typescript
   * // Clear error when user starts typing in login form
   * authFacade.clearError();
   * ```
   */
  clearError(): void {
    this._authError.set(null);
  }

  /**
   * Clears authentication error and loading states for UI transitions
   *
   * This method is specifically designed for use when entering authentication
   * pages or forms. It clears both error messages and loading states to ensure
   * a clean slate for user interaction, while preserving other authentication
   * state like user session data.
   *
   * @returns {void}
   *
   * @since 1.0.0
   * @application AuthFacade
   * @example
   * ```typescript
   * // Clear state when navigating to login page
   * authFacade.clearAuthState();
   * ```
   */
  clearAuthState(): void {
    this._authError.set(null);
    this._loading.set(false);
  }

  /**
   * Clears authentication state for new operations while preserving loading
   *
   * Internal method used during authentication operations (login, registration)
   * to clear previous authentication data and errors, but preserve the loading
   * state to maintain proper UI feedback during the operation.
   *
   * @private
   * @returns {void}
   *
   * @since 1.0.0
   * @application AuthFacade
   */
  private clearAuthStateForNewOperation(): void {
    this._authError.set(null);
    this._session.set(null);
    this._user.set(null);
  }

  /**
   * Performs complete authentication state cleanup
   *
   * This method clears all authentication-related state including user data,
   * session information, error messages, and loading states. Used for complete
   * cleanup scenarios like logout, initialization failures, or when a fresh
   * authentication state is required.
   *
   * @returns {void}
   *
   * @since 1.0.0
   * @application AuthFacade
   * @example
   * ```typescript
   * // Complete cleanup on logout
   * authFacade.clearAuthStateCompletely();
   * ```
   */
  clearAuthStateCompletely(): void {
    this._authError.set(null);
    this._loading.set(false);
    this._session.set(null);
    this._user.set(null);
  }

  /**
   * Resets the entire authentication facade to its initial state
   *
   * This method performs a complete reset of all authentication state,
   * including user data, session information, error messages, loading states,
   * and session restoration flags. Useful for testing scenarios, complete
   * logout operations, or when a fresh start is required.
   *
   * @returns {void}
   *
   * @since 1.0.0
   * @application AuthFacade
   * @example
   * ```typescript
   * // Complete reset for testing or logout
   * authFacade.reset();
   * ```
   */
  /**
   * Filter navigation sections based on user roles and permissions
   * Business logic for role-based access control to navigation items
   *
   * @param sections - Raw navigation sections from configuration
   * @returns Filtered navigation sections accessible to current user
   */
  filterNavigationSections(sections: NavSection[]): NavSection[] {
    const user = this._user();

    if (!user) {
      // If no user, only show items without role requirements
      return sections.map((section) => ({
        ...section,
        items: section.items.filter((item) => !item.requireRoles || item.requireRoles.length === 0),
      })).filter((section) => section.items.length > 0);
    }

    const userRoleName = user.role.name;
    const isAdmin = user.role.canAccessAdmin();

    return sections.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          !item.requireRoles ||
          item.requireRoles.length === 0 ||
          isAdmin ||
          item.requireRoles.some((role) => userRoleName === role)
      ),
    })).filter((section) => section.items.length > 0);
  }

  reset(): void {
    this._loading.set(false);
    this._user.set(null);
    this._session.set(null);
    this._authError.set(null);
    this._sessionRestoreAttempted.set(false);
  }
}
