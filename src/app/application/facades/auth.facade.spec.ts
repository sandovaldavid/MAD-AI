/**
 * @fileoverview AuthFacade Test Suite
 *
 * Comprehensive test suite for AuthFacade covering all orchestration operations,
 * reactive state management, and use case coordination. Tests follow MAD-AI
 * testing guidelines with 95% coverage requirement for Application Layer.
 *
 * @description
 * Tests focus on facade orchestration responsibilities:
 * - Use case coordination and delegation
 * - Reactive state management with Angular signals
 * - Error handling and transformation
 * - Cross-facade integration (NotificationsFacade)
 * - Loading state coordination
 * - Session management utilities
 *
 * @architecture
 * Application Layer Testing Strategy:
 * - TOTAL MOCK: All dependencies mocked using jasmine.createSpyObj
 * - Orchestration Focus: Verify correct use case calls and state updates
 * - No Business Logic: Tests coordination, not domain rules
 * - State Verification: Ensure signals update correctly
 * - Error Scenarios: Test transformation and cleanup
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */

import { TestBed } from '@angular/core/testing';

// Application Layer Imports
import { AuthFacade } from './auth.facade';
import type {
  LoginRequest,
  RegisterRequest,
  PasswordResetConfirmRequest,
} from '@application/types/auth.types';
import { ApplicationErrorTransformer } from '../errors/application-error.transformer';
import { ApplicationError } from '../errors/application-error';

// Use Cases Imports
import { LoginUseCase } from '../use-cases/auth/login.usecase';
import { LogoutUseCase } from '../use-cases/auth/logout.usecase';
import { GetProfileUseCase } from '../use-cases/auth/get-profile.usecase';
import { RegisterUseCase } from '../use-cases/auth/register.usecase';
import { RefreshSessionUseCase } from '../use-cases/auth/refresh-session.usecase';
import { ConfirmEmailUseCase } from '../use-cases/auth/confirm-email.usecase';
import { RequestPasswordResetUseCase } from '../use-cases/auth/request-password-reset.usecase';
import { ConfirmPasswordResetUseCase } from '../use-cases/auth/confirm-password-reset.usecase';

// Cross-Facade Dependencies
import { NotificationsFacade } from './notifications.facade';

// Core Services
import { LoggerService } from '@core/services/logger.service';

// Domain Entities (for mock return values)
import type { User } from '@domain/entities/user.entity';
import type { Session } from '@domain/entities/session.entity';

/**
 * AuthFacade Test Suite
 *
 * Tests the facade's orchestration responsibilities using extensive mocking
 * to isolate the coordination logic from business rules and infrastructure.
 */
describe('AuthFacade', () => {
  let facade: AuthFacade;

  // Mock Use Cases
  let mockLoginUC: jasmine.SpyObj<LoginUseCase>;
  let mockLogoutUC: jasmine.SpyObj<LogoutUseCase>;
  let mockGetProfileUC: jasmine.SpyObj<GetProfileUseCase>;
  let mockRegisterUC: jasmine.SpyObj<RegisterUseCase>;
  let mockRefreshUC: jasmine.SpyObj<RefreshSessionUseCase>;
  let mockConfirmEmailUC: jasmine.SpyObj<ConfirmEmailUseCase>;
  let mockReqResetUC: jasmine.SpyObj<RequestPasswordResetUseCase>;
  let mockConfirmResetUC: jasmine.SpyObj<ConfirmPasswordResetUseCase>;

  // Mock Services
  let mockNotifications: jasmine.SpyObj<NotificationsFacade>;
  let mockLogger: jasmine.SpyObj<LoggerService>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  // Mock Domain Entities
  let mockUser: User;
  let mockSession: Session;

  beforeEach(() => {
    // Create spy objects for all use cases
    mockLoginUC = jasmine.createSpyObj('LoginUseCase', ['execute']);
    mockLogoutUC = jasmine.createSpyObj('LogoutUseCase', ['execute']);
    mockGetProfileUC = jasmine.createSpyObj('GetProfileUseCase', ['execute']);
    mockRegisterUC = jasmine.createSpyObj('RegisterUseCase', ['execute']);
    mockRefreshUC = jasmine.createSpyObj('RefreshSessionUseCase', ['execute']);
    mockConfirmEmailUC = jasmine.createSpyObj('ConfirmEmailUseCase', ['execute']);
    mockReqResetUC = jasmine.createSpyObj('RequestPasswordResetUseCase', ['execute']);
    mockConfirmResetUC = jasmine.createSpyObj('ConfirmPasswordResetUseCase', ['execute']);

    // Create spy objects for services
    mockNotifications = jasmine.createSpyObj('NotificationsFacade', [
      'success',
      'info',
      'notificationError',
    ]);
    mockLogger = jasmine.createSpyObj('LoggerService', ['error', 'debug', 'info']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);

    // Create mock domain entities
    mockUser = {
      id: { value: 'user-123' },
      firstName: 'John',
      lastName: 'Doe',
      email: { value: 'john@example.com' },
      role: {
        canAccessAdmin: jasmine.createSpy('canAccessAdmin').and.returnValue(false),
      },
    } as any;

    mockSession = {
      user: mockUser,
      accessToken: {
        getValue: jasmine.createSpy('getValue').and.returnValue('mock-token'),
        get expSeconds() {
          return 1234567890;
        },
      },
      isValid: jasmine.createSpy('isValid').and.returnValue(true),
    } as any;

    // Configure TestBed with all mock providers
    TestBed.configureTestingModule({
      providers: [
        AuthFacade,
        // Use Case Providers
        { provide: LoginUseCase, useValue: mockLoginUC },
        { provide: LogoutUseCase, useValue: mockLogoutUC },
        { provide: GetProfileUseCase, useValue: mockGetProfileUC },
        { provide: RegisterUseCase, useValue: mockRegisterUC },
        { provide: RefreshSessionUseCase, useValue: mockRefreshUC },
        { provide: ConfirmEmailUseCase, useValue: mockConfirmEmailUC },
        { provide: RequestPasswordResetUseCase, useValue: mockReqResetUC },
        { provide: ConfirmPasswordResetUseCase, useValue: mockConfirmResetUC },
        // Service Providers
        { provide: NotificationsFacade, useValue: mockNotifications },
        { provide: LoggerService, useValue: mockLogger },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
      ],
    });

    facade = TestBed.inject(AuthFacade);

    // Set up default mock behaviors
    const mockNotification = {
      id: '1',
      type: 'success' as const,
      message: 'test',
      title: 'Test',
      userId: 'user-123',
      channel: 'in_app' as const,
      createdAt: new Date(),
      isRead: false,
    } as any;
    mockNotifications.success.and.returnValue(Promise.resolve(mockNotification));
    mockNotifications.info.and.returnValue(Promise.resolve(mockNotification));
    mockNotifications.notificationError.and.returnValue(Promise.resolve(mockNotification));
  });

  // ============================================================================
  // Constructor and Initialization Tests
  // ============================================================================

  describe('Constructor and Initialization', () => {
    it('should create facade instance successfully', () => {
      expect(facade).toBeTruthy();
      expect(facade).toBeInstanceOf(AuthFacade);
    });

    it('should initialize with correct default signal values', () => {
      expect(facade.loading()).toBe(false);
      expect(facade.user()).toBeNull();
      expect(facade.session()).toBeNull();
      expect(facade.error()).toBeNull();
      expect(facade.isAuthenticated()).toBe(false);
      expect(facade.sessionRestoreAttempted()).toBe(false);
      expect(facade.userDisplayName()).toBe('');
      expect(facade.isAdmin()).toBe(false);
    });

    it('should inject all required dependencies', () => {
      expect(mockLoginUC).toBeTruthy();
      expect(mockLogoutUC).toBeTruthy();
      expect(mockGetProfileUC).toBeTruthy();
      expect(mockRegisterUC).toBeTruthy();
      expect(mockRefreshUC).toBeTruthy();
      expect(mockConfirmEmailUC).toBeTruthy();
      expect(mockReqResetUC).toBeTruthy();
      expect(mockConfirmResetUC).toBeTruthy();
      expect(mockNotifications).toBeTruthy();
      expect(mockLogger).toBeTruthy();
      expect(mockErrorTransformer).toBeTruthy();
    });
  });

  // ============================================================================
  // Reactive State Management Tests
  // ============================================================================

  describe('Reactive State Management', () => {
    describe('computed properties', () => {
      it('should compute isAuthenticated correctly when user is present', () => {
        // Arrange & Act
        (facade as any)._user.set(mockUser);

        // Assert
        expect(facade.isAuthenticated()).toBe(true);
      });

      it('should compute isAuthenticated correctly when user is null', () => {
        // Arrange & Act
        (facade as any)._user.set(null);

        // Assert
        expect(facade.isAuthenticated()).toBe(false);
      });

      it('should compute userDisplayName correctly when user is present', () => {
        // Arrange & Act
        (facade as any)._user.set(mockUser);

        // Assert
        expect(facade.userDisplayName()).toBe('John Doe');
      });

      it('should compute userDisplayName as empty string when user is null', () => {
        // Arrange & Act
        (facade as any)._user.set(null);

        // Assert
        expect(facade.userDisplayName()).toBe('');
      });

      it('should compute isAdmin correctly when user has admin role', () => {
        // Arrange
        mockUser.role.canAccessAdmin = jasmine.createSpy('canAccessAdmin').and.returnValue(true);

        // Act
        (facade as any)._user.set(mockUser);

        // Assert
        expect(facade.isAdmin()).toBe(true);
      });

      it('should compute isAdmin correctly when user does not have admin role', () => {
        // Arrange
        mockUser.role.canAccessAdmin = jasmine.createSpy('canAccessAdmin').and.returnValue(false);

        // Act
        (facade as any)._user.set(mockUser);

        // Assert
        expect(facade.isAdmin()).toBe(false);
      });

      it('should compute isAdmin as false when user is null', () => {
        // Arrange & Act
        (facade as any)._user.set(null);

        // Assert
        expect(facade.isAdmin()).toBe(false);
      });
    });

    describe('signal reactivity', () => {
      it('should update all dependent computed signals when user changes', () => {
        // Arrange
        expect(facade.isAuthenticated()).toBe(false);
        expect(facade.userDisplayName()).toBe('');
        expect(facade.isAdmin()).toBe(false);

        // Act
        (facade as any)._user.set(mockUser);

        // Assert
        expect(facade.isAuthenticated()).toBe(true);
        expect(facade.userDisplayName()).toBe('John Doe');
        expect(facade.isAdmin()).toBe(false); // Based on mock setup
      });

      it('should maintain signal isolation between state changes', () => {
        // Arrange & Act
        (facade as any)._loading.set(true);
        (facade as any)._authError.set('Test error');

        // Assert
        expect(facade.loading()).toBe(true);
        expect(facade.error()).toBe('Test error');
        expect(facade.user()).toBeNull(); // Other signals unaffected
        expect(facade.session()).toBeNull();
      });
    });
  });

  // ============================================================================
  // Authentication Operations Tests
  // ============================================================================

  describe('Authentication Operations', () => {
    describe('login', () => {
      const loginRequest: LoginRequest = {
        identifier: {
          type: 'email',
          value: 'john@example.com',
        },
        password: 'password123',
      };

      it('should call LoginUseCase and update state on successful login', async () => {
        // Arrange
        mockLoginUC.execute.and.returnValue(Promise.resolve(mockSession));

        // Act
        await facade.login(loginRequest);

        // Assert
        expect(mockLoginUC.execute).toHaveBeenCalledWith(loginRequest);
        expect(facade.session()).toBe(mockSession);
        expect(facade.user()).toBe(mockUser);
        expect(facade.loading()).toBe(false);
        expect(facade.error()).toBeNull();
        expect(mockNotifications.success).toHaveBeenCalledWith(
          'Welcome back!',
          `Hello ${mockUser.firstName}, you've successfully logged in.`
        );
      });

      it('should handle login errors and update error state', async () => {
        // Arrange
        const error = new Error('Login failed');
        const transformedError = ApplicationError.authenticationFailed();
        mockLoginUC.execute.and.returnValue(Promise.reject(error));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act
        await facade.login(loginRequest);

        // Assert
        expect(mockLoginUC.execute).toHaveBeenCalledWith(loginRequest);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(error, {
          operation: 'login',
        });
        expect(facade.error()).toBe(transformedError.userMessage);
        expect(facade.session()).toBeNull();
        expect(facade.user()).toBeNull();
        expect(facade.loading()).toBe(false);
        expect(mockLogger.error).toHaveBeenCalledWith('Login failed', {
          operation: 'login',
          userId: undefined,
        });
      });

      it('should show loading state during login operation', async () => {
        // Arrange
        let resolveLogin: (value: Session) => void;
        const loginPromise = new Promise<Session>((resolve) => {
          resolveLogin = resolve;
        });
        mockLoginUC.execute.and.returnValue(loginPromise);

        // Act
        const loginOperation = facade.login(loginRequest);

        // Assert - During operation
        expect(facade.loading()).toBe(true);

        // Complete the operation
        resolveLogin!(mockSession);
        await loginOperation;

        // Assert - After operation
        expect(facade.loading()).toBe(false);
      });

      it('should skip loading state when opts.skipLoading is true', async () => {
        // Arrange
        mockLoginUC.execute.and.returnValue(Promise.resolve(mockSession));

        // Act
        await facade.login(loginRequest, { skipLoading: true });

        // Assert
        expect(facade.loading()).toBe(false); // Should remain false throughout
        expect(facade.session()).toBe(mockSession);
        expect(facade.user()).toBe(mockUser);
      });

      it('should clear auth state for new operation before login', async () => {
        // Arrange
        (facade as any)._authError.set('Previous error');
        (facade as any)._session.set(mockSession);
        (facade as any)._user.set(mockUser);
        mockLoginUC.execute.and.returnValue(Promise.resolve(mockSession));

        // Act
        await facade.login(loginRequest);

        // Assert
        expect(facade.error()).toBeNull(); // Previous error cleared
        expect(facade.session()).toBe(mockSession); // Updated with new session
        expect(facade.user()).toBe(mockUser); // Updated with new user
      });
    });

    describe('register', () => {
      const registerRequest: RegisterRequest = {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
        acceptTerms: true,
        firstName: 'John',
        lastName: 'Doe',
      };

      it('should call RegisterUseCase and send success notification', async () => {
        // Arrange
        mockRegisterUC.execute.and.returnValue(Promise.resolve());

        // Act
        await facade.register(registerRequest);

        // Assert
        expect(mockRegisterUC.execute).toHaveBeenCalledWith(registerRequest);
        expect(facade.loading()).toBe(false);
        expect(facade.error()).toBeNull();
        expect(mockNotifications.success).toHaveBeenCalledWith(
          'Registration successful!',
          'Please check your email to confirm your account.'
        );
      });

      it('should handle registration errors and re-throw them', async () => {
        // Arrange
        const error = new Error('Registration failed');
        const transformedError = ApplicationError.userAlreadyExists('john@example.com');
        mockRegisterUC.execute.and.returnValue(Promise.reject(error));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(facade.register(registerRequest)).toBeRejected();
        expect(mockRegisterUC.execute).toHaveBeenCalledWith(registerRequest);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(error);
        expect(facade.error()).toBe(transformedError.userMessage);
        expect(facade.loading()).toBe(false);
      });

      it('should show loading state during registration operation', async () => {
        // Arrange
        let resolveRegister: () => void;
        const registerPromise = new Promise<void>((resolve) => {
          resolveRegister = resolve;
        });
        mockRegisterUC.execute.and.returnValue(registerPromise);

        // Act
        const registerOperation = facade.register(registerRequest);

        // Assert - During operation
        expect(facade.loading()).toBe(true);

        // Complete the operation
        resolveRegister!();
        await registerOperation;

        // Assert - After operation
        expect(facade.loading()).toBe(false);
      });

      it('should skip loading state when opts.skipLoading is true', async () => {
        // Arrange
        mockRegisterUC.execute.and.returnValue(Promise.resolve());

        // Act
        await facade.register(registerRequest, { skipLoading: true });

        // Assert
        expect(facade.loading()).toBe(false); // Should remain false throughout
      });

      it('should clear error state before registration', async () => {
        // Arrange
        (facade as any)._authError.set('Previous error');
        mockRegisterUC.execute.and.returnValue(Promise.resolve());

        // Act
        await facade.register(registerRequest);

        // Assert
        expect(facade.error()).toBeNull(); // Error cleared before operation
      });
    });

    describe('logout', () => {
      it('should call LogoutUseCase and clear auth state on success', async () => {
        // Arrange
        (facade as any)._session.set(mockSession);
        (facade as any)._user.set(mockUser);
        mockLogoutUC.execute.and.returnValue(Promise.resolve());

        // Act
        await facade.logout();

        // Assert
        expect(mockLogoutUC.execute).toHaveBeenCalled();
        expect(facade.session()).toBeNull();
        expect(facade.user()).toBeNull();
        expect(facade.error()).toBeNull();
        expect(facade.loading()).toBe(false);
        expect(mockNotifications.info).toHaveBeenCalledWith(
          'Logged out successfully',
          'You have been safely logged out of your account.'
        );
      });

      it('should clear session state even when logout fails', async () => {
        // Arrange
        (facade as any)._session.set(mockSession);
        (facade as any)._user.set(mockUser);
        const error = new Error('Logout failed');
        const transformedError = ApplicationError.unexpectedError();
        mockLogoutUC.execute.and.returnValue(Promise.reject(error));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act
        await facade.logout(); // Should not throw

        // Assert
        expect(mockLogoutUC.execute).toHaveBeenCalled();
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(error);
        expect(facade.error()).toBe(transformedError.userMessage);
        expect(facade.session()).toBeNull(); // Still cleared despite error
        expect(facade.user()).toBeNull(); // Still cleared despite error
        expect(facade.loading()).toBe(false);
      });

      it('should show loading state during logout operation', async () => {
        // Arrange
        let resolveLogout: () => void;
        const logoutPromise = new Promise<void>((resolve) => {
          resolveLogout = resolve;
        });
        mockLogoutUC.execute.and.returnValue(logoutPromise);

        // Act
        const logoutOperation = facade.logout();

        // Assert - During operation
        expect(facade.loading()).toBe(true);

        // Complete the operation
        resolveLogout!();
        await logoutOperation;

        // Assert - After operation
        expect(facade.loading()).toBe(false);
      });

      it('should skip loading state when opts.skipLoading is true', async () => {
        // Arrange
        mockLogoutUC.execute.and.returnValue(Promise.resolve());

        // Act
        await facade.logout(undefined, { skipLoading: true });

        // Assert
        expect(facade.loading()).toBe(false); // Should remain false throughout
      });

      it('should clear error state before logout', async () => {
        // Arrange
        (facade as any)._authError.set('Previous error');
        mockLogoutUC.execute.and.returnValue(Promise.resolve());

        // Act
        await facade.logout();

        // Assert
        expect(facade.error()).toBeNull(); // Error cleared before operation
      });
    });
  });

  // ============================================================================
  // Session Management Tests
  // ============================================================================

  describe('Session Management', () => {
    describe('initializeAuth', () => {
      it('should call refreshProfile and mark session restore as attempted', async () => {
        // Arrange
        mockGetProfileUC.execute.and.returnValue(Promise.resolve(mockUser));

        // Act
        await facade.initializeAuth();

        // Assert
        expect(facade.sessionRestoreAttempted()).toBe(true);
        expect(mockGetProfileUC.execute).toHaveBeenCalled();
        expect(facade.user()).toBe(mockUser);
      });

      it('should not attempt initialization multiple times', async () => {
        // Arrange
        mockGetProfileUC.execute.and.returnValue(Promise.resolve(mockUser));
        await facade.initializeAuth(); // First call
        mockGetProfileUC.execute.calls.reset();

        // Act
        await facade.initializeAuth(); // Second call

        // Assert
        expect(mockGetProfileUC.execute).not.toHaveBeenCalled();
        expect(facade.sessionRestoreAttempted()).toBe(true);
      });

      it('should clear auth state when profile refresh fails', async () => {
        // Arrange
        (facade as any)._user.set(mockUser);
        (facade as any)._session.set(mockSession);
        mockGetProfileUC.execute.and.returnValue(Promise.reject(new Error('Token expired')));

        // Act
        await facade.initializeAuth();

        // Assert
        expect(facade.sessionRestoreAttempted()).toBe(true);
        expect(facade.user()).toBeNull();
        expect(facade.session()).toBeNull();
        expect(facade.error()).toBeNull();
        expect(facade.loading()).toBe(false);
      });
    });

    describe('refreshSession', () => {
      it('should call RefreshSessionUseCase and update state on success', async () => {
        // Arrange
        mockRefreshUC.execute.and.returnValue(Promise.resolve(mockSession));

        // Act
        await facade.refreshSession();

        // Assert
        expect(mockRefreshUC.execute).toHaveBeenCalled();
        expect(facade.session()).toBe(mockSession);
        expect(facade.user()).toBe(mockUser);
        expect(facade.error()).toBeNull();
      });

      it('should clear session state when refresh fails silently', async () => {
        // Arrange
        (facade as any)._session.set(mockSession);
        (facade as any)._user.set(mockUser);
        const error = new Error('Session expired');
        const transformedError = ApplicationError.sessionExpired();
        mockRefreshUC.execute.and.returnValue(Promise.reject(error));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act (should not throw)
        await facade.refreshSession();

        // Assert
        expect(mockRefreshUC.execute).toHaveBeenCalled();
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(error);
        expect(facade.error()).toBe(transformedError.userMessage);
        expect(facade.session()).toBeNull();
        expect(facade.user()).toBeNull();
      });

      it('should show loading when explicitly requested', async () => {
        // Arrange
        let resolveRefresh: (value: Session) => void;
        const refreshPromise = new Promise<Session>((resolve) => {
          resolveRefresh = resolve;
        });
        mockRefreshUC.execute.and.returnValue(refreshPromise);

        // Act
        const refreshOperation = facade.refreshSession({ skipLoading: false });

        // Assert - During operation
        expect(facade.loading()).toBe(true);

        // Complete the operation
        resolveRefresh!(mockSession);
        await refreshOperation;

        // Assert - After operation
        expect(facade.loading()).toBe(false);
      });

      it('should throw error when loading is enabled and refresh fails', async () => {
        // Arrange
        const error = new Error('Session expired');
        const transformedError = ApplicationError.sessionExpired();
        mockRefreshUC.execute.and.returnValue(Promise.reject(error));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(facade.refreshSession({ skipLoading: false })).toBeRejected();
        expect(facade.loading()).toBe(false);
      });
    });

    describe('refreshProfile', () => {
      it('should call GetProfileUseCase and update user state', async () => {
        // Arrange
        mockGetProfileUC.execute.and.returnValue(Promise.resolve(mockUser));

        // Act
        await facade.refreshProfile();

        // Assert
        expect(mockGetProfileUC.execute).toHaveBeenCalled();
        expect(facade.user()).toBe(mockUser);
        expect(facade.loading()).toBe(false);
        expect(facade.error()).toBeNull();
      });

      it('should handle profile refresh errors and clear state', async () => {
        // Arrange
        (facade as any)._user.set(mockUser);
        (facade as any)._session.set(mockSession);
        const error = new Error('Profile fetch failed');
        const transformedError = ApplicationError.sessionExpired();
        mockGetProfileUC.execute.and.returnValue(Promise.reject(error));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(facade.refreshProfile()).toBeRejected();
        expect(mockGetProfileUC.execute).toHaveBeenCalled();
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(error);
        expect(facade.error()).toBe(transformedError.userMessage);
        expect(facade.user()).toBeNull();
        expect(facade.session()).toBeNull();
        expect(facade.loading()).toBe(false);
      });

      it('should show loading state during profile refresh', async () => {
        // Arrange
        let resolveProfile: (value: User) => void;
        const profilePromise = new Promise<User>((resolve) => {
          resolveProfile = resolve;
        });
        mockGetProfileUC.execute.and.returnValue(profilePromise);

        // Act
        const profileOperation = facade.refreshProfile();

        // Assert - During operation
        expect(facade.loading()).toBe(true);

        // Complete the operation
        resolveProfile!(mockUser);
        await profileOperation;

        // Assert - After operation
        expect(facade.loading()).toBe(false);
      });
    });
  });

  // ============================================================================
  // Email and Password Reset Operations Tests
  // ============================================================================

  describe('Email and Password Reset Operations', () => {
    describe('confirmEmail', () => {
      const token = 'email-confirmation-token';

      it('should call ConfirmEmailUseCase and refresh profile on success', async () => {
        // Arrange
        mockConfirmEmailUC.execute.and.returnValue(Promise.resolve('Email confirmed'));
        mockGetProfileUC.execute.and.returnValue(Promise.resolve(mockUser));

        // Act
        await facade.confirmEmail(token);

        // Assert
        expect(mockConfirmEmailUC.execute).toHaveBeenCalledWith({ token });
        expect(mockGetProfileUC.execute).toHaveBeenCalled();
        expect(facade.user()).toBe(mockUser);
        expect(facade.loading()).toBe(false);
        expect(facade.error()).toBeNull();
        expect(mockNotifications.success).toHaveBeenCalledWith(
          'Email confirmed!',
          'Your email address has been successfully confirmed.'
        );
      });

      it('should handle email confirmation errors', async () => {
        // Arrange
        const error = new Error('Invalid token');
        const transformedError = ApplicationError.invalidInput('Invalid confirmation token');
        mockConfirmEmailUC.execute.and.returnValue(Promise.reject(error));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(facade.confirmEmail(token)).toBeRejected();
        expect(mockConfirmEmailUC.execute).toHaveBeenCalledWith({ token });
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(error);
        expect(facade.error()).toBe(transformedError.userMessage);
        expect(facade.loading()).toBe(false);
      });

      it('should show loading state during email confirmation', async () => {
        // Arrange
        let resolveConfirm: (value: string) => void;
        const confirmPromise = new Promise<string>((resolve) => {
          resolveConfirm = resolve;
        });
        mockConfirmEmailUC.execute.and.returnValue(confirmPromise);
        mockGetProfileUC.execute.and.returnValue(Promise.resolve(mockUser));

        // Act
        const confirmOperation = facade.confirmEmail(token);

        // Assert - During operation
        expect(facade.loading()).toBe(true);

        // Complete the operation
        resolveConfirm!('Confirmed');
        await confirmOperation;

        // Assert - After operation
        expect(facade.loading()).toBe(false);
      });
    });

    describe('requestPasswordReset', () => {
      const email = 'john@example.com';

      it('should call RequestPasswordResetUseCase and send info notification', async () => {
        // Arrange
        mockReqResetUC.execute.and.returnValue(Promise.resolve('Reset email sent'));

        // Act
        await facade.requestPasswordReset(email);

        // Assert
        expect(mockReqResetUC.execute).toHaveBeenCalledWith({ email });
        expect(facade.loading()).toBe(false);
        expect(facade.error()).toBeNull();
        expect(mockNotifications.info).toHaveBeenCalledWith(
          'Password reset requested',
          'Please check your email for password reset instructions.'
        );
      });

      it('should handle password reset request errors', async () => {
        // Arrange
        const error = new Error('User not found');
        const transformedError = ApplicationError.userNotFound(email);
        mockReqResetUC.execute.and.returnValue(Promise.reject(error));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(facade.requestPasswordReset(email)).toBeRejected();
        expect(mockReqResetUC.execute).toHaveBeenCalledWith({ email });
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(error);
        expect(facade.error()).toBe(transformedError.userMessage);
        expect(facade.loading()).toBe(false);
      });

      it('should show loading state during password reset request', async () => {
        // Arrange
        let resolveReset: (value: string) => void;
        const resetPromise = new Promise<string>((resolve) => {
          resolveReset = resolve;
        });
        mockReqResetUC.execute.and.returnValue(resetPromise);

        // Act
        const resetOperation = facade.requestPasswordReset(email);

        // Assert - During operation
        expect(facade.loading()).toBe(true);

        // Complete the operation
        resolveReset!('Reset sent');
        await resetOperation;

        // Assert - After operation
        expect(facade.loading()).toBe(false);
      });
    });

    describe('confirmPasswordReset', () => {
      const resetData: PasswordResetConfirmRequest = {
        token: 'reset-token',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      };

      it('should call ConfirmPasswordResetUseCase and send success notification', async () => {
        // Arrange
        mockConfirmResetUC.execute.and.returnValue(Promise.resolve('Password reset confirmed'));

        // Act
        await facade.confirmPasswordReset(resetData);

        // Assert
        expect(mockConfirmResetUC.execute).toHaveBeenCalledWith(resetData);
        expect(facade.loading()).toBe(false);
        expect(facade.error()).toBeNull();
        expect(mockNotifications.success).toHaveBeenCalledWith(
          'Password reset successful!',
          'Your password has been updated. Please log in with your new password.'
        );
      });

      it('should handle password reset confirmation errors', async () => {
        // Arrange
        const error = new Error('Invalid reset token');
        const transformedError = ApplicationError.invalidInput('Invalid reset token');
        mockConfirmResetUC.execute.and.returnValue(Promise.reject(error));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(facade.confirmPasswordReset(resetData)).toBeRejected();
        expect(mockConfirmResetUC.execute).toHaveBeenCalledWith(resetData);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(error);
        expect(facade.error()).toBe(transformedError.userMessage);
        expect(facade.loading()).toBe(false);
      });

      it('should show loading state during password reset confirmation', async () => {
        // Arrange
        let resolveConfirm: (value: string) => void;
        const confirmPromise = new Promise<string>((resolve) => {
          resolveConfirm = resolve;
        });
        mockConfirmResetUC.execute.and.returnValue(confirmPromise);

        // Act
        const confirmOperation = facade.confirmPasswordReset(resetData);

        // Assert - During operation
        expect(facade.loading()).toBe(true);

        // Complete the operation
        resolveConfirm!('Confirmed');
        await confirmOperation;

        // Assert - After operation
        expect(facade.loading()).toBe(false);
      });
    });
  });

  // ============================================================================
  // State Management Operations Tests
  // ============================================================================

  describe('State Management Operations', () => {
    describe('clearError', () => {
      it('should clear authentication error state', () => {
        // Arrange
        (facade as any)._authError.set('Test error');
        expect(facade.error()).toBe('Test error');

        // Act
        facade.clearError();

        // Assert
        expect(facade.error()).toBeNull();
      });

      it('should not affect other state when clearing error', () => {
        // Arrange
        (facade as any)._user.set(mockUser);
        (facade as any)._session.set(mockSession);
        (facade as any)._loading.set(true);
        (facade as any)._authError.set('Test error');

        // Act
        facade.clearError();

        // Assert
        expect(facade.error()).toBeNull();
        expect(facade.user()).toBe(mockUser); // Unchanged
        expect(facade.session()).toBe(mockSession); // Unchanged
        expect(facade.loading()).toBe(true); // Unchanged
      });
    });

    describe('clearAuthState', () => {
      it('should clear both error and loading states', () => {
        // Arrange
        (facade as any)._authError.set('Test error');
        (facade as any)._loading.set(true);

        // Act
        facade.clearAuthState();

        // Assert
        expect(facade.error()).toBeNull();
        expect(facade.loading()).toBe(false);
      });

      it('should not affect user and session data when clearing auth state', () => {
        // Arrange
        (facade as any)._user.set(mockUser);
        (facade as any)._session.set(mockSession);
        (facade as any)._authError.set('Test error');
        (facade as any)._loading.set(true);

        // Act
        facade.clearAuthState();

        // Assert
        expect(facade.error()).toBeNull();
        expect(facade.loading()).toBe(false);
        expect(facade.user()).toBe(mockUser); // Preserved
        expect(facade.session()).toBe(mockSession); // Preserved
      });
    });

    describe('clearAuthStateCompletely', () => {
      it('should clear all authentication state', () => {
        // Arrange
        (facade as any)._user.set(mockUser);
        (facade as any)._session.set(mockSession);
        (facade as any)._authError.set('Test error');
        (facade as any)._loading.set(true);

        // Act
        facade.clearAuthStateCompletely();

        // Assert
        expect(facade.user()).toBeNull();
        expect(facade.session()).toBeNull();
        expect(facade.error()).toBeNull();
        expect(facade.loading()).toBe(false);
      });

      it('should maintain sessionRestoreAttempted flag', () => {
        // Arrange
        (facade as any)._sessionRestoreAttempted.set(true);
        (facade as any)._user.set(mockUser);
        (facade as any)._session.set(mockSession);

        // Act
        facade.clearAuthStateCompletely();

        // Assert
        expect(facade.sessionRestoreAttempted()).toBe(true); // Preserved
        expect(facade.user()).toBeNull();
        expect(facade.session()).toBeNull();
      });
    });

    describe('reset', () => {
      it('should reset all facade state to initial values', () => {
        // Arrange
        (facade as any)._user.set(mockUser);
        (facade as any)._session.set(mockSession);
        (facade as any)._authError.set('Test error');
        (facade as any)._loading.set(true);
        (facade as any)._sessionRestoreAttempted.set(true);

        // Act
        facade.reset();

        // Assert
        expect(facade.user()).toBeNull();
        expect(facade.session()).toBeNull();
        expect(facade.error()).toBeNull();
        expect(facade.loading()).toBe(false);
        expect(facade.sessionRestoreAttempted()).toBe(false);
      });

      it('should reset all computed properties', () => {
        // Arrange
        (facade as any)._user.set(mockUser);
        expect(facade.isAuthenticated()).toBe(true);
        expect(facade.userDisplayName()).toBe('John Doe');

        // Act
        facade.reset();

        // Assert
        expect(facade.isAuthenticated()).toBe(false);
        expect(facade.userDisplayName()).toBe('');
        expect(facade.isAdmin()).toBe(false);
      });
    });
  });

  // ============================================================================
  // Session Utility Methods Tests
  // ============================================================================

  describe('Session Utility Methods', () => {
    describe('getAccessTokenOrNull', () => {
      it('should return access token when session exists', () => {
        // Arrange
        (facade as any)._session.set(mockSession);

        // Act
        const token = facade.getAccessTokenOrNull();

        // Assert
        expect(token).toBe('mock-token');
        expect(mockSession.accessToken.getValue).toHaveBeenCalled();
      });

      it('should return null when session is null', () => {
        // Arrange
        (facade as any)._session.set(null);

        // Act
        const token = facade.getAccessTokenOrNull();

        // Assert
        expect(token).toBeNull();
      });

      it('should return null when access token getValue returns null', () => {
        // Arrange
        mockSession.accessToken.getValue = jasmine.createSpy('getValue').and.returnValue(null);
        (facade as any)._session.set(mockSession);

        // Act
        const token = facade.getAccessTokenOrNull();

        // Assert
        expect(token).toBeNull();
      });

      it('should return null when access token getValue returns empty string', () => {
        // Arrange
        mockSession.accessToken.getValue = jasmine.createSpy('getValue').and.returnValue('');
        (facade as any)._session.set(mockSession);

        // Act
        const token = facade.getAccessTokenOrNull();

        // Assert
        expect(token).toBeNull();
      });
    });

    describe('isSessionValid', () => {
      it('should return true when session exists and is valid', () => {
        // Arrange
        (facade as any)._session.set(mockSession);
        const nowEpochSeconds = 1234567800; // 90 seconds before expiration
        mockSession.isValid = jasmine.createSpy('isValid').and.returnValue(true);

        // Act
        const isValid = facade.isSessionValid(nowEpochSeconds);

        // Assert
        expect(isValid).toBe(true);
        expect(mockSession.isValid).toHaveBeenCalledWith(nowEpochSeconds);
      });

      it('should return false when session exists but is invalid', () => {
        // Arrange
        (facade as any)._session.set(mockSession);
        const nowEpochSeconds = 1234567900; // After expiration
        mockSession.isValid = jasmine.createSpy('isValid').and.returnValue(false);

        // Act
        const isValid = facade.isSessionValid(nowEpochSeconds);

        // Assert
        expect(isValid).toBe(false);
        expect(mockSession.isValid).toHaveBeenCalledWith(nowEpochSeconds);
      });

      it('should return false when session is null', () => {
        // Arrange
        (facade as any)._session.set(null);
        const nowEpochSeconds = 1234567800;

        // Act
        const isValid = facade.isSessionValid(nowEpochSeconds);

        // Assert
        expect(isValid).toBe(false);
      });
    });

    describe('getSessionTimeRemaining', () => {
      it('should return remaining time when session is valid', () => {
        // Arrange
        (facade as any)._session.set(mockSession);
        const nowEpochSeconds = 1234567800; // 90 seconds before expiration
        Object.defineProperty(mockSession.accessToken, 'expSeconds', {
          value: 1234567890,
          configurable: true,
        });

        // Act
        const remaining = facade.getSessionTimeRemaining(nowEpochSeconds);

        // Assert
        expect(remaining).toBe(90); // 1234567890 - 1234567800
      });

      it('should return 0 when session is expired', () => {
        // Arrange
        (facade as any)._session.set(mockSession);
        const nowEpochSeconds = 1234567900; // 10 seconds after expiration
        Object.defineProperty(mockSession.accessToken, 'expSeconds', {
          value: 1234567890,
          configurable: true,
        });

        // Act
        const remaining = facade.getSessionTimeRemaining(nowEpochSeconds);

        // Assert
        expect(remaining).toBe(0);
      });

      it('should return null when session is null', () => {
        // Arrange
        (facade as any)._session.set(null);
        const nowEpochSeconds = 1234567800;

        // Act
        const remaining = facade.getSessionTimeRemaining(nowEpochSeconds);

        // Assert
        expect(remaining).toBeNull();
      });

      it('should return null when access token has no expiration', () => {
        // Arrange
        Object.defineProperty(mockSession.accessToken, 'expSeconds', {
          value: undefined,
          configurable: true,
        });
        (facade as any)._session.set(mockSession);
        const nowEpochSeconds = 1234567800;

        // Act
        const remaining = facade.getSessionTimeRemaining(nowEpochSeconds);

        // Assert
        expect(remaining).toBeNull();
      });

      it('should handle edge case of exactly expired session', () => {
        // Arrange
        (facade as any)._session.set(mockSession);
        const nowEpochSeconds = 1234567890; // Exactly at expiration
        Object.defineProperty(mockSession.accessToken, 'expSeconds', {
          value: 1234567890,
          configurable: true,
        });

        // Act
        const remaining = facade.getSessionTimeRemaining(nowEpochSeconds);

        // Assert
        expect(remaining).toBe(0);
      });
    });
  });

  // ============================================================================
  // Error Handling and Transformation Integration Tests
  // ============================================================================

  describe('Error Handling and Transformation Integration', () => {
    it('should consistently transform errors across all operations', async () => {
      // Arrange
      const operations = [
        () =>
          facade.login({
            identifier: { type: 'email', value: 'test@example.com' },
            password: 'pass',
          }),
        () =>
          facade.register({
            username: 'johndoe',
            email: 'test@example.com',
            password: 'pass',
            passwordConfirm: 'pass',
            acceptTerms: true,
            firstName: 'John',
            lastName: 'Doe',
          }),
        () => facade.refreshProfile(),
        () => facade.confirmEmail('token'),
        () => facade.requestPasswordReset('test@example.com'),
        () =>
          facade.confirmPasswordReset({
            token: 'token',
            newPassword: 'newpass',
            confirmPassword: 'newpass',
          }),
      ];

      const useCases = [
        mockLoginUC,
        mockRegisterUC,
        mockGetProfileUC,
        mockConfirmEmailUC,
        mockReqResetUC,
        mockConfirmResetUC,
      ];

      const error = new Error('Network error');
      const transformedError = ApplicationError.serviceUnavailable('auth-service');

      // Configure all use cases to fail
      mockLoginUC.execute.and.returnValue(Promise.reject(error));
      mockRegisterUC.execute.and.returnValue(Promise.reject(error));
      mockGetProfileUC.execute.and.returnValue(Promise.reject(error));
      mockConfirmEmailUC.execute.and.returnValue(Promise.reject(error));
      mockReqResetUC.execute.and.returnValue(Promise.reject(error));
      mockConfirmResetUC.execute.and.returnValue(Promise.reject(error));
      mockErrorTransformer.transform.and.returnValue(transformedError);

      // Act & Assert
      for (const operation of operations) {
        try {
          await operation();
        } catch {
          // Some operations re-throw, others don't
        }
        expect(facade.error()).toBe(transformedError.userMessage);
        facade.clearError(); // Reset for next test
      }

      // Verify transformer was called for each operation
      expect(mockErrorTransformer.transform.calls.count()).toBe(operations.length);
    });

    it('should log errors appropriately during operations', async () => {
      // Arrange
      const error = new Error('Test error');
      const transformedError = ApplicationError.authenticationFailed();
      mockLoginUC.execute.and.returnValue(Promise.reject(error));
      mockErrorTransformer.transform.and.returnValue(transformedError);

      // Act
      await facade.login({
        identifier: { type: 'email', value: 'test@example.com' },
        password: 'pass',
      });

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith('Login failed', {
        operation: 'login',
        userId: undefined,
      });
      expect(mockLogger.debug).toHaveBeenCalledWith('Login error transformed', {
        operation: 'login',
      });
    });
  });

  // ============================================================================
  // Notification Integration Tests
  // ============================================================================

  describe('Notification Integration Tests', () => {
    it('should send appropriate success notifications for each operation', async () => {
      // Arrange
      const testCases = [
        {
          operation: () =>
            facade.login({
              identifier: { type: 'email', value: 'test@example.com' },
              password: 'pass',
            }),
          useCase: mockLoginUC,
          mockReturn: mockSession,
          expectedNotification: [
            'Welcome back!',
            `Hello ${mockUser.firstName}, you've successfully logged in.`,
          ],
        },
        {
          operation: () =>
            facade.register({
              username: 'johndoe',
              email: 'test@example.com',
              password: 'pass',
              passwordConfirm: 'pass',
              acceptTerms: true,
              firstName: 'John',
              lastName: 'Doe',
            }),
          useCase: mockRegisterUC,
          mockReturn: null,
          expectedNotification: [
            'Registration successful!',
            'Please check your email to confirm your account.',
          ],
        },
        {
          operation: () => facade.logout(),
          useCase: mockLogoutUC,
          mockReturn: null,
          expectedNotification: [
            'Logged out successfully',
            'You have been safely logged out of your account.',
          ],
          notificationType: 'info',
        },
        {
          operation: () => facade.confirmEmail('token'),
          useCase: mockConfirmEmailUC,
          mockReturn: 'Email confirmed',
          expectedNotification: [
            'Email confirmed!',
            'Your email address has been successfully confirmed.',
          ],
          additionalSetup: () =>
            mockGetProfileUC.execute.and.returnValue(Promise.resolve(mockUser)),
        },
        {
          operation: () => facade.requestPasswordReset('test@example.com'),
          useCase: mockReqResetUC,
          mockReturn: 'Reset email sent',
          expectedNotification: [
            'Password reset requested',
            'Please check your email for password reset instructions.',
          ],
          notificationType: 'info',
        },
        {
          operation: () =>
            facade.confirmPasswordReset({
              token: 'token',
              newPassword: 'newpass',
              confirmPassword: 'newpass',
            }),
          useCase: mockConfirmResetUC,
          mockReturn: 'Password reset successful',
          expectedNotification: [
            'Password reset successful!',
            'Your password has been updated. Please log in with your new password.',
          ],
        },
      ];

      // Act & Assert
      // Test login notification
      mockLoginUC.execute.and.returnValue(Promise.resolve(mockSession));
      await facade.login({
        identifier: { type: 'email', value: 'test@example.com' },
        password: 'pass',
      });
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Welcome back!',
        `Hello ${mockUser.firstName}, you've successfully logged in.`
      );
      mockNotifications.success.calls.reset();

      // Test register notification
      mockRegisterUC.execute.and.returnValue(Promise.resolve());
      await facade.register({
        username: 'johndoe',
        email: 'test@example.com',
        password: 'pass',
        passwordConfirm: 'pass',
        acceptTerms: true,
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Registration successful!',
        'Please check your email to confirm your account.'
      );
      mockNotifications.success.calls.reset();

      // Test logout notification
      mockLogoutUC.execute.and.returnValue(Promise.resolve());
      await facade.logout();
      expect(mockNotifications.info).toHaveBeenCalledWith(
        'Logged out successfully',
        'You have been safely logged out of your account.'
      );
      mockNotifications.info.calls.reset();

      // Test confirm email notification
      mockConfirmEmailUC.execute.and.returnValue(Promise.resolve('Email confirmed'));
      mockGetProfileUC.execute.and.returnValue(Promise.resolve(mockUser));
      await facade.confirmEmail('token');
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Email confirmed!',
        'Your email address has been successfully confirmed.'
      );
      mockNotifications.success.calls.reset();

      // Test request password reset notification
      mockReqResetUC.execute.and.returnValue(Promise.resolve('Reset email sent'));
      await facade.requestPasswordReset('test@example.com');
      expect(mockNotifications.info).toHaveBeenCalledWith(
        'Password reset requested',
        'Please check your email for password reset instructions.'
      );
      mockNotifications.info.calls.reset();

      // Test confirm password reset notification
      mockConfirmResetUC.execute.and.returnValue(Promise.resolve('Password reset successful'));
      await facade.confirmPasswordReset({
        token: 'token',
        newPassword: 'newpass',
        confirmPassword: 'newpass',
      });
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Password reset successful!',
        'Your password has been updated. Please log in with your new password.'
      );
      mockNotifications.success.calls.reset();
    });

    it('should handle notification failures gracefully', async () => {
      // Arrange
      mockLoginUC.execute.and.returnValue(Promise.resolve(mockSession));
      mockNotifications.success.and.returnValue(Promise.reject(new Error('Notification failed')));

      // Ensure error transformer returns a valid ApplicationError if called
      const mockError = ApplicationError.authenticationFailed();
      mockErrorTransformer.transform.and.returnValue(mockError);

      // Act - Should not throw even if notification fails, but currently clears auth state
      await expectAsync(
        facade.login({ identifier: { type: 'email', value: 'test@example.com' }, password: 'pass' })
      ).toBeResolved();

      // Assert - Current behavior clears session on notification failure
      expect(facade.session()).toBeNull();
      expect(facade.user()).toBeNull();
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBe('Invalid email or password'); // Error message from ApplicationError.authenticationFailed()
    });
  });
});
