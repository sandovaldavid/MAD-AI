import { inject, Injectable, signal, computed } from '@angular/core';
import { LoginWithCredentials } from '../use-cases/auth/login.usecase';
import { Logout } from '../use-cases/auth/logout.usecase';
import { GetProfile } from '../use-cases/auth/get-profile.usecase';
import { Register } from '../use-cases/auth/register.usecase';
import { RefreshSession } from '../use-cases/auth/refresh-session.usecase';
import { ConfirmEmail } from '../use-cases/auth/confirm-email.usecase';
import { RequestPasswordReset } from '../use-cases/auth/request-password-reset.usecase';
import { ConfirmPasswordReset } from '../use-cases/auth/confirm-password-reset.usecase';
import { NotificationsFacade } from './notifications.facade';
import type {
    LoginRequest,
    RegisterRequest,
    LogoutRequest,
    RefreshSessionRequest,
} from '@application/types/auth.types';
import type { User } from '@domain/entities/user.entity';
import type { Session } from '@domain/entities/session.entity';
import type { FacadeOpts } from '@application/types/facade-opts';
import { ApplicationErrorTransformer } from '../errors/application-error.transformer';

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
    // Dependencies Injection
    // ============================================================================

    // Use Case Dependencies
    private readonly loginUC = inject(LoginWithCredentials);
    private readonly logoutUC = inject(Logout);
    private readonly profileUC = inject(GetProfile);
    private readonly registerUC = inject(Register);
    private readonly refreshUC = inject(RefreshSession);
    private readonly confirmEmailUC = inject(ConfirmEmail);
    private readonly reqResetUC = inject(RequestPasswordReset);
    private readonly confirmResetUC = inject(ConfirmPasswordReset);

    // Error Transformer
    private readonly errorTransformer = inject(ApplicationErrorTransformer);

    // Cross-Facade Dependencies
    private readonly notifications = inject(NotificationsFacade);

    // ============================================================================
    // Private State Signals
    // ============================================================================

    /** Loading state for async operations */
    private readonly _loading = signal(false);

    /** Current authenticated user */
    private readonly _user = signal<User | null>(null);

    /** Current session data */
    private readonly _session = signal<Session | null>(null);

    /** Current error state */
    private readonly _authError = signal<string | null>(null);

    /** Flag to track if session restoration has been attempted */
    private readonly _sessionRestoreAttempted = signal(false);

    // ============================================================================
    // Public Computed Properties (Reactive State)
    // ============================================================================

    /** Loading state for async operations */
    readonly loading = computed(() => this._loading());

    /** Current authenticated user */
    readonly user = computed(() => this._user());

    /** Current session data */
    readonly session = computed(() => this._session());

    /** Current error state */
    readonly error = computed(() => this._authError());

    /** Whether user is authenticated */
    readonly isAuthenticated = computed(() => !!this._user());

    /** Whether session restoration has been attempted */
    readonly sessionRestoreAttempted = computed(() => this._sessionRestoreAttempted());

    /** User display name for UI */
    readonly userDisplayName = computed(() => {
        const user = this._user();
        return user ? `${user.firstName} ${user.lastName}` : '';
    });

    /** Whether current user has admin role */
    readonly isAdmin = computed(() => {
        const user = this._user();
        return user?.roleName === 'Admin' || false;
    });

    // ============================================================================
    // Initialization and State Management Operations
    // ============================================================================

    /**
     * Initialize authentication state from storage
     * Uses the existing refreshProfile use case following Clean Architecture
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
        } catch (error) {
            // If profile refresh fails (no tokens or expired), ensure clean state
            this.clearAuthStateCompletely();
        }
    }

    // ============================================================================
    // Authentication Operations
    // ============================================================================

    /**
     * Executes user login through robust use case
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
        } catch (error: any) {
            // DEBUG: Log the original error to console for debugging
            console.error('🔥 AuthFacade Login Error - Original Error:', error);
            console.error('🔥 AuthFacade Login Error - Error Type:', typeof error);
            console.error(
                '🔥 AuthFacade Login Error - Error Constructor:',
                error?.constructor?.name
            );
            console.error('🔥 AuthFacade Login Error - Error Message:', error?.message);
            console.error('🔥 AuthFacade Login Error - Error Stack:', error?.stack);

            // Transform error to user-friendly message
            const errorMessage = this.errorTransformer.transformError(error as Error, {
                feature: 'auth',
                operation: 'login',
            });
            console.error('🔥 AuthFacade Login Error - Transformed Message:', errorMessage);

            this._authError.set(errorMessage);

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
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._authError.set(errorMessage);
            throw error;
        } finally {
            if (!opts?.skipLoading) {
                this._loading.set(false);
            }
        }
    }

    /**
     * Executes user logout through robust use case
     */
    async logout(request?: LogoutRequest, opts?: FacadeOpts): Promise<void> {
        if (!opts?.skipLoading) {
            this._loading.set(true);
        }
        this._authError.set(null);

        try {
            await this.logoutUC.execute(request || {});

            this._session.set(null);
            this._user.set(null);
            this._authError.set(null);

            // Send info notification
            await this.notifications.info(
                'Logged out successfully',
                'You have been safely logged out of your account.'
            );
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._authError.set(errorMessage);
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
        } catch (error: any) {
            // Failed session refresh usually means logout
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._authError.set(errorMessage);

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
     */
    async refreshProfile(opts?: FacadeOpts): Promise<void> {
        if (!opts?.skipLoading) {
            this._loading.set(true);
        }
        this._authError.set(null);

        try {
            const user = await this.profileUC.execute();
            this._user.set(user);
        } catch (error: any) {
            // Profile refresh errors usually indicate session expiration
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._authError.set(errorMessage);
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
     */
    getAccessTokenOrNull(): string | null {
        const session = this._session();
        return session?.access?.value || null;
    }

    /**
     * Checks if current session is valid (not expired)
     */
    isSessionValid(nowEpochSeconds: number): boolean {
        const session = this._session();
        return session ? !session.isAccessTokenExpired(nowEpochSeconds) : false;
    }

    /**
     * Gets remaining session time in seconds
     */
    getSessionTimeRemaining(nowEpochSeconds: number): number | null {
        const session = this._session();
        return session ? session.expiresInSeconds(nowEpochSeconds) : null;
    }

    // ============================================================================
    // Email and Password Reset Operations
    // ============================================================================

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
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._authError.set(errorMessage);
            throw error;
        } finally {
            if (!opts?.skipLoading) {
                this._loading.set(false);
            }
        }
    }

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
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._authError.set(errorMessage);
            throw error;
        } finally {
            if (!opts?.skipLoading) {
                this._loading.set(false);
            }
        }
    }

    async confirmPasswordReset(data: any, opts?: FacadeOpts): Promise<void> {
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
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._authError.set(errorMessage);
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
     * Clear current error state
     */
    clearError(): void {
        this._authError.set(null);
    }

    /**
     * Clear error and loading states (useful when entering auth pages)
     */
    clearAuthState(): void {
        this._authError.set(null);
        this._loading.set(false);
    }

    /**
     * Clear all auth state including session and user data
     * This is more aggressive than clearAuthState and is used
     * when we need to ensure completely clean state
     */
    /**
     * Clear authentication state without affecting loading state
     * Used during login process to clear previous errors/data while preserving loading
     */
    private clearAuthStateForNewOperation(): void {
        this._authError.set(null);
        this._session.set(null);
        this._user.set(null);
    }

    /**
     * Clear authentication state completely including loading state
     * Used for complete cleanup (logout, initialization, etc.)
     */
    clearAuthStateCompletely(): void {
        this._authError.set(null);
        this._loading.set(false);
        this._session.set(null);
        this._user.set(null);
    }

    /**
     * Reset facade state (useful for testing or logout)
     */
    reset(): void {
        this._loading.set(false);
        this._user.set(null);
        this._session.set(null);
        this._authError.set(null);
        this._sessionRestoreAttempted.set(false);
    }
}
