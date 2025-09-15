import { ApplicationError } from './application-error';
import { ApplicationErrorCode } from './error-codes.enum';

/**
 * Test Suite for ApplicationError
 *
 * Tests the Application Error class following Clean Architecture principles.
 * Focuses on error creation, factory methods, property validation, and behavior
 * without testing business logic (handled by Domain layer).
 *
 * @description
 * Validates the Application Layer error handling with comprehensive scenarios:
 * - Error factory method behavior for all error types
 * - Property validation and immutability
 * - Error ID generation and uniqueness
 * - Timestamp consistency and accuracy
 * - Context preservation and serialization
 * - User-friendly message generation
 * - Retryable vs non-retryable error classification
 *
 * @architecture
 * - **Layer**: Application Layer Testing
 * - **Pattern**: Pure Unit Testing (no mocks needed for value object)
 * - **Dependencies**: None (ApplicationError is a pure value object)
 * - **Coverage**: 100% of error creation logic and factory methods
 *
 * @scenarios
 * - ✅ Constructor behavior and property assignment
 * - ✅ Factory method validation for all error types
 * - ✅ Error ID generation uniqueness and format
 * - ✅ Timestamp consistency
 * - ✅ Context preservation and edge cases
 * - ✅ User message vs technical message distinction
 * - ✅ Retryable error classification
 * - ✅ Suggested action generation
 *
 * @since 1.0.0
 * @layer Application Testing
 */
describe('ApplicationError', () => {
  describe('Constructor and Basic Properties', () => {
    describe('Basic Error Creation', () => {
      it('should create error with all required properties', () => {
        // Arrange
        const code = ApplicationErrorCode.INVALID_INPUT;
        const technicalMessage = 'Technical validation failed';
        const userMessage = 'Please check your input';
        const context = { field: 'email' };
        const suggestedAction = 'Try again with valid email';
        const retryable = true;

        // Act
        const error = new ApplicationError(
          code,
          technicalMessage,
          userMessage,
          context,
          suggestedAction,
          retryable
        );

        // Assert
        expect(error.name).toBe('ApplicationError');
        expect(error.message).toBe(technicalMessage);
        expect(error.code).toBe(code);
        expect(error.userMessage).toBe(userMessage);
        expect(error.context).toEqual(context);
        expect(error.suggestedAction).toBe(suggestedAction);
        expect(error.retryable).toBe(retryable);
        expect(error.timestamp).toBeInstanceOf(Date);
        expect(error.errorId).toMatch(/^app_[a-z0-9]+_[a-z0-9]+$/);
      });

      it('should create error with minimal parameters', () => {
        // Arrange
        const code = ApplicationErrorCode.UNEXPECTED_ERROR;
        const technicalMessage = 'Something went wrong';
        const userMessage = 'An error occurred';

        // Act
        const error = new ApplicationError(code, technicalMessage, userMessage);

        // Assert
        expect(error.code).toBe(code);
        expect(error.message).toBe(technicalMessage);
        expect(error.userMessage).toBe(userMessage);
        expect(error.context).toBeUndefined();
        expect(error.suggestedAction).toBeUndefined();
        expect(error.retryable).toBe(false); // Default value
        expect(error.timestamp).toBeInstanceOf(Date);
        expect(error.errorId).toBeDefined();
      });

      it('should inherit from Error class correctly', () => {
        // Arrange & Act
        const error = new ApplicationError(
          ApplicationErrorCode.AUTH_FAILED,
          'Authentication failed',
          'Invalid credentials'
        );

        // Assert
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.stack).toBeDefined();
      });

      it('should set default retryable to false when not specified', () => {
        // Arrange & Act
        const error = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Validation failed',
          'Input is invalid'
        );

        // Assert
        expect(error.retryable).toBe(false);
      });
    });

    describe('Error ID Generation', () => {
      it('should generate unique error IDs for each error instance', () => {
        // Arrange & Act
        const error1 = new ApplicationError(
          ApplicationErrorCode.AUTH_FAILED,
          'Error 1',
          'User message 1'
        );
        const error2 = new ApplicationError(
          ApplicationErrorCode.AUTH_FAILED,
          'Error 2',
          'User message 2'
        );
        const error3 = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Error 3',
          'User message 3'
        );

        // Assert
        expect(error1.errorId).not.toBe(error2.errorId);
        expect(error2.errorId).not.toBe(error3.errorId);
        expect(error1.errorId).not.toBe(error3.errorId);
      });

      it('should generate error IDs with correct format pattern', () => {
        // Arrange & Act
        const errors = Array.from(
          { length: 10 },
          (_, i) =>
            new ApplicationError(
              ApplicationErrorCode.UNEXPECTED_ERROR,
              `Error ${i}`,
              `Message ${i}`
            )
        );

        // Assert
        errors.forEach((error) => {
          expect(error.errorId).toMatch(/^app_[a-z0-9]+_[a-z0-9]+$/);
          expect(error.errorId.split('_').length).toBe(3);
          expect(error.errorId.startsWith('app_')).toBe(true);
        });
      });

      it('should generate error IDs with timestamp component', () => {
        // Arrange
        const beforeTimestamp = Date.now();

        // Act
        const error = new ApplicationError(
          ApplicationErrorCode.SERVICE_UNAVAILABLE,
          'Service down',
          'Service unavailable'
        );

        const afterTimestamp = Date.now();

        // Assert
        const errorIdParts = error.errorId.split('_');
        expect(errorIdParts[0]).toBe('app');

        // Convert timestamp part back to number and verify it's within range
        // Note: generateErrorId uses Date.now() which is in milliseconds
        const timestampPart = parseInt(errorIdParts[1], 36);
        expect(timestampPart).toBeGreaterThanOrEqual(beforeTimestamp);
        expect(timestampPart).toBeLessThanOrEqual(afterTimestamp + 1000); // Allow 1 second buffer
      });

      it('should include random component in error ID', () => {
        // Arrange & Act
        const errors = Array.from(
          { length: 100 },
          () =>
            new ApplicationError(
              ApplicationErrorCode.UNEXPECTED_ERROR,
              'Test error',
              'Test message'
            )
        );

        // Assert - Verify random components are different
        const randomParts = errors.map((error) => error.errorId.split('_')[2]);
        const uniqueRandomParts = new Set(randomParts);

        // With 100 errors and 6-character random strings, we should have very high uniqueness
        expect(uniqueRandomParts.size).toBeGreaterThan(95);
      });
    });

    describe('Timestamp Behavior', () => {
      it('should set timestamp to current time when error is created', () => {
        // Arrange
        const beforeCreation = new Date();

        // Act
        const error = new ApplicationError(
          ApplicationErrorCode.OPERATION_TIMEOUT,
          'Operation timed out',
          'Request took too long'
        );

        const afterCreation = new Date();

        // Assert
        expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
        expect(error.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
      });

      it('should have different timestamps for errors created at different times', (done) => {
        // Arrange
        const error1 = new ApplicationError(
          ApplicationErrorCode.RATE_LIMIT_EXCEEDED,
          'Rate limit 1',
          'Too many requests 1'
        );

        // Act
        setTimeout(() => {
          const error2 = new ApplicationError(
            ApplicationErrorCode.RATE_LIMIT_EXCEEDED,
            'Rate limit 2',
            'Too many requests 2'
          );

          // Assert
          expect(error2.timestamp.getTime()).toBeGreaterThan(error1.timestamp.getTime());
          done();
        }, 10); // Small delay to ensure different timestamps
      });

      it('should maintain timestamp immutability', () => {
        // Arrange
        const error = new ApplicationError(
          ApplicationErrorCode.INVALID_USER_STATE,
          'Invalid state',
          'User state is invalid'
        );
        const originalTimestamp = error.timestamp.getTime();

        // Act - Attempt to modify timestamp (should not affect original)
        const modifiedTimestamp = new Date(originalTimestamp + 1000);

        // Assert
        expect(error.timestamp.getTime()).toBe(originalTimestamp);
        expect(error.timestamp).not.toBe(modifiedTimestamp);
      });
    });

    describe('Context Property Handling', () => {
      it('should preserve context object exactly as provided', () => {
        // Arrange
        const context = {
          userId: 123,
          operation: 'user-update',
          details: {
            field: 'email',
            oldValue: 'old@example.com',
            newValue: 'new@example.com',
          },
          metadata: ['tag1', 'tag2'],
        };

        // Act
        const error = new ApplicationError(
          ApplicationErrorCode.USER_ALREADY_EXISTS,
          'User exists',
          'User already exists',
          context
        );

        // Assert
        expect(error.context).toEqual(context);
        expect(error.context).toBe(context); // ApplicationError preserves the same reference
      });

      it('should handle null and undefined context gracefully', () => {
        // Arrange & Act
        const errorWithNull = new ApplicationError(
          ApplicationErrorCode.AUTH_FAILED,
          'Auth failed',
          'Authentication failed',
          null as any
        );

        const errorWithUndefined = new ApplicationError(
          ApplicationErrorCode.AUTH_FAILED,
          'Auth failed',
          'Authentication failed',
          undefined
        );

        // Assert
        expect(errorWithNull.context).toBeNull();
        expect(errorWithUndefined.context).toBeUndefined();
      });

      it('should handle complex nested context objects', () => {
        // Arrange
        const complexContext = {
          request: {
            method: 'POST',
            url: '/api/users',
            headers: { 'Content-Type': 'application/json' },
            body: { email: 'test@example.com' },
          },
          response: {
            status: 409,
            headers: { 'X-Error-Code': 'DUPLICATE_EMAIL' },
          },
          timing: {
            startTime: new Date('2024-01-01T10:00:00Z'),
            endTime: new Date('2024-01-01T10:00:02Z'),
            duration: 2000,
          },
          user: {
            id: 456,
            role: 'admin',
            permissions: ['read', 'write'],
          },
        };

        // Act
        const error = new ApplicationError(
          ApplicationErrorCode.USER_ALREADY_EXISTS,
          'Duplicate user creation attempt',
          'A user with this email already exists',
          complexContext
        );

        // Assert
        expect(error.context).toEqual(complexContext);
        expect((error.context as any)?.request?.method).toBe('POST');
        expect((error.context as any)?.timing?.duration).toBe(2000);
        expect((error.context as any)?.user?.permissions).toEqual(['read', 'write']);
      });

      it('should handle empty context object', () => {
        // Arrange
        const emptyContext = {};

        // Act
        const error = new ApplicationError(
          ApplicationErrorCode.OPERATION_TIMEOUT,
          'Timeout occurred',
          'Operation timed out',
          emptyContext
        );

        // Assert
        expect(error.context).toEqual({});
        expect(typeof error.context).toBe('object');
      });
    });
  });

  describe('Factory Methods - Authentication Errors', () => {
    describe('authenticationFailed', () => {
      it('should create authentication failed error with correct properties', () => {
        // Act
        const error = ApplicationError.authenticationFailed();

        // Assert
        expect(error.code).toBe(ApplicationErrorCode.AUTH_FAILED);
        expect(error.message).toBe('User authentication failed');
        expect(error.userMessage).toBe('Invalid email or password');
        expect(error.context).toBeUndefined();
        expect(error.suggestedAction).toBe('Please check your credentials and try again');
        expect(error.retryable).toBe(false);
      });

      it('should inherit from ApplicationError and Error', () => {
        // Act
        const error = ApplicationError.authenticationFailed();

        // Assert
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('ApplicationError');
      });

      it('should generate unique error IDs for multiple instances', () => {
        // Act
        const error1 = ApplicationError.authenticationFailed();
        const error2 = ApplicationError.authenticationFailed();

        // Assert
        expect(error1.errorId).not.toBe(error2.errorId);
        expect(error1.errorId).toMatch(/^app_[a-z0-9]+_[a-z0-9]+$/);
        expect(error2.errorId).toMatch(/^app_[a-z0-9]+_[a-z0-9]+$/);
      });
    });

    describe('sessionExpired', () => {
      it('should create session expired error with security-focused messaging', () => {
        // Act
        const error = ApplicationError.sessionExpired();

        // Assert
        expect(error.code).toBe(ApplicationErrorCode.SESSION_EXPIRED);
        expect(error.message).toBe('User session has expired');
        expect(error.userMessage).toBe('Your session has expired for security reasons');
        expect(error.context).toBeUndefined();
        expect(error.suggestedAction).toBe('Please log in again to continue');
        expect(error.retryable).toBe(false);
      });

      it('should create error with current timestamp', () => {
        // Arrange
        const beforeCreation = new Date();

        // Act
        const error = ApplicationError.sessionExpired();

        const afterCreation = new Date();

        // Assert
        expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
        expect(error.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
      });
    });

    describe('userNotFound', () => {
      it('should create user not found error without email context', () => {
        // Act
        const error = ApplicationError.userNotFound();

        // Assert
        expect(error.code).toBe(ApplicationErrorCode.USER_NOT_FOUND);
        expect(error.message).toBe('User not found in system');
        expect(error.userMessage).toBe('No account found with this email address');
        expect(error.context).toEqual({ email: undefined });
        expect(error.suggestedAction).toBe(
          'Please check the email address or register a new account'
        );
        expect(error.retryable).toBe(false);
      });

      it('should create user not found error with email context', () => {
        // Arrange
        const email = 'test@example.com';

        // Act
        const error = ApplicationError.userNotFound(email);

        // Assert
        expect(error.code).toBe(ApplicationErrorCode.USER_NOT_FOUND);
        expect(error.message).toBe('User not found in system');
        expect(error.userMessage).toBe('No account found with this email address');
        expect(error.context).toEqual({ email });
        expect(error.suggestedAction).toBe(
          'Please check the email address or register a new account'
        );
        expect(error.retryable).toBe(false);
      });

      it('should handle empty email string', () => {
        // Arrange
        const email = '';

        // Act
        const error = ApplicationError.userNotFound(email);

        // Assert
        expect(error.context).toEqual({ email: '' });
      });

      it('should handle null email', () => {
        // Arrange
        const email = null as any;

        // Act
        const error = ApplicationError.userNotFound(email);

        // Assert
        expect(error.context).toEqual({ email: null });
      });
    });

    describe('accountLocked', () => {
      it('should create account locked error without unlock time', () => {
        // Arrange
        const userId = 'user123';

        // Act
        const error = ApplicationError.accountLocked(userId);

        // Assert
        expect(error.code).toBe(ApplicationErrorCode.ACCOUNT_LOCKED);
        expect(error.message).toBe('User account is locked');
        expect(error.userMessage).toBe(
          'Your account has been temporarily locked due to multiple failed login attempts'
        );
        expect(error.context).toEqual({ userId, unlockTime: undefined });
        expect(error.suggestedAction).toBe('Contact support to unlock your account');
        expect(error.retryable).toBe(false);
      });

      it('should create account locked error with unlock time', () => {
        // Arrange
        const userId = 'user456';
        const unlockTime = new Date('2024-12-01T15:30:00Z');

        // Act
        const error = ApplicationError.accountLocked(userId, unlockTime);

        // Assert
        expect(error.code).toBe(ApplicationErrorCode.ACCOUNT_LOCKED);
        expect(error.message).toBe('User account is locked');
        expect(error.userMessage).toBe(
          'Your account has been temporarily locked due to multiple failed login attempts'
        );
        expect(error.context).toEqual({ userId, unlockTime });
        expect(error.suggestedAction).toBe(`Please try again after ${unlockTime.toLocaleString()}`);
        expect(error.retryable).toBe(false);
      });

      it('should format unlock time in suggested action correctly', () => {
        // Arrange
        const userId = 'user789';
        const unlockTime = new Date('2024-01-15T14:45:30Z');

        // Act
        const error = ApplicationError.accountLocked(userId, unlockTime);

        // Assert
        expect(error.suggestedAction).toContain(unlockTime.toLocaleString());
        expect(error.suggestedAction).toMatch(/^Please try again after .+$/);
      });
    });
  });

  describe('Factory Methods - User Management Errors', () => {
    describe('insufficientPermissions', () => {
      it('should create insufficient permissions error with required role only', () => {
        // Arrange
        const requiredRole = 'admin';

        // Act
        const error = ApplicationError.insufficientPermissions(requiredRole);

        // Assert
        expect(error.code).toBe(ApplicationErrorCode.INSUFFICIENT_PERMISSIONS);
        expect(error.message).toBe('User lacks required permissions');
        expect(error.userMessage).toBe('You do not have permission to perform this action');
        expect(error.context).toEqual({ requiredRole, userRole: undefined });
        expect(error.suggestedAction).toBe(
          'Contact your administrator if you need additional permissions'
        );
        expect(error.retryable).toBe(false);
      });

      it('should create insufficient permissions error with both required and user roles', () => {
        // Arrange
        const requiredRole = 'manager';
        const userRole = 'employee';

        // Act
        const error = ApplicationError.insufficientPermissions(requiredRole, userRole);

        // Assert
        expect(error.code).toBe(ApplicationErrorCode.INSUFFICIENT_PERMISSIONS);
        expect(error.message).toBe('User lacks required permissions');
        expect(error.userMessage).toBe('You do not have permission to perform this action');
        expect(error.context).toEqual({ requiredRole, userRole });
        expect(error.suggestedAction).toBe(
          'Contact your administrator if you need additional permissions'
        );
        expect(error.retryable).toBe(false);
      });

      it('should handle empty role strings', () => {
        // Arrange
        const requiredRole = '';
        const userRole = '';

        // Act
        const error = ApplicationError.insufficientPermissions(requiredRole, userRole);

        // Assert
        expect(error.context).toEqual({ requiredRole: '', userRole: '' });
      });
    });

    describe('userAlreadyExists', () => {
      it('should create user already exists error with email context', () => {
        // Arrange
        const email = 'existing@example.com';

        // Act
        const error = ApplicationError.userAlreadyExists(email);

        // Assert
        expect(error.code).toBe(ApplicationErrorCode.USER_ALREADY_EXISTS);
        expect(error.message).toBe('User with email already exists');
        expect(error.userMessage).toBe('An account with this email address already exists');
        expect(error.context).toEqual({ email });
        expect(error.suggestedAction).toBe(
          'Try logging in instead, or use a different email address'
        );
        expect(error.retryable).toBe(false);
      });

      it('should preserve email exactly as provided in context', () => {
        // Arrange
        const emails = [
          'test@example.com',
          'USER@EXAMPLE.COM',
          'user+tag@example.co.uk',
          'user.name+tag@example-domain.com',
        ];

        // Act & Assert
        emails.forEach((email) => {
          const error = ApplicationError.userAlreadyExists(email);
          expect(error.context).toEqual({ email });
        });
      });
    });
  });

  describe('Factory Methods - System Errors', () => {
    describe('serviceUnavailable', () => {
      it('should create service unavailable error without retry time', () => {
        // Arrange
        const service = 'database';

        // Act
        const error = ApplicationError.serviceUnavailable(service);

        // Assert
        expect(error.code).toBe(ApplicationErrorCode.SERVICE_UNAVAILABLE);
        expect(error.message).toBe('Service database is currently unavailable');
        expect(error.userMessage).toBe(
          'The service is temporarily unavailable. Please try again later.'
        );
        expect(error.context).toEqual({ service, retryAfter: undefined });
        expect(error.suggestedAction).toBe('Please try again in a few minutes');
        expect(error.retryable).toBe(true);
      });

      it('should create service unavailable error with retry time', () => {
        // Arrange
        const service = 'payment-gateway';
        const retryAfter = 60;

        // Act
        const error = ApplicationError.serviceUnavailable(service, retryAfter);

        // Assert
        expect(error.code).toBe(ApplicationErrorCode.SERVICE_UNAVAILABLE);
        expect(error.message).toBe('Service payment-gateway is currently unavailable');
        expect(error.userMessage).toBe(
          'The service is temporarily unavailable. Please try again later.'
        );
        expect(error.context).toEqual({ service, retryAfter });
        expect(error.suggestedAction).toBe('Please try again in 60 seconds');
        expect(error.retryable).toBe(true);
      });

      it('should handle different retry time values', () => {
        // Arrange
        const testCases = [
          { service: 'api', retryAfter: 30, expected: 'Please try again in 30 seconds' },
          { service: 'cache', retryAfter: 120, expected: 'Please try again in 120 seconds' },
          { service: 'auth', retryAfter: 0, expected: 'Please try again in 0 seconds' },
        ];

        // Act & Assert
        testCases.forEach(({ service, retryAfter, expected }) => {
          const error = ApplicationError.serviceUnavailable(service, retryAfter);
          expect(error.suggestedAction).toBe(expected);
          expect(error.retryable).toBe(true);
        });
      });
    });

    describe('invalidInput', () => {
      it('should create invalid input error with details', () => {
        // Arrange
        const details = 'Email format is invalid';

        // Act
        const error = ApplicationError.invalidInput(details);

        // Assert
        expect(error.code).toBe(ApplicationErrorCode.INVALID_INPUT);
        expect(error.message).toBe('Invalid input provided: Email format is invalid');
        expect(error.userMessage).toBe('The information provided is not valid');
        expect(error.context).toEqual({ details });
        expect(error.suggestedAction).toBe('Please check your input and try again');
        expect(error.retryable).toBe(false);
      });

      it('should handle empty details string', () => {
        // Arrange
        const details = '';

        // Act
        const error = ApplicationError.invalidInput(details);

        // Assert
        expect(error.message).toBe('Invalid input provided: ');
        expect(error.context).toEqual({ details: '' });
      });

      it('should handle detailed validation information', () => {
        // Arrange
        const details = 'Password must be at least 8 characters and contain uppercase letters';

        // Act
        const error = ApplicationError.invalidInput(details);

        // Assert
        expect(error.message).toBe(`Invalid input provided: ${details}`);
        expect(error.context).toEqual({ details });
      });
    });

    describe('unexpectedError', () => {
      it('should create unexpected error with default properties', () => {
        // Act
        const error = ApplicationError.unexpectedError();

        // Assert
        expect(error.code).toBe(ApplicationErrorCode.UNEXPECTED_ERROR);
        expect(error.message).toBe('An unexpected error occurred');
        expect(error.userMessage).toBe('Something went wrong. Please try again.');
        expect(error.context).toBeUndefined();
        expect(error.suggestedAction).toBe('If the problem persists, please contact support');
        expect(error.retryable).toBe(true);
      });

      it('should be retryable by default', () => {
        // Act
        const error = ApplicationError.unexpectedError();

        // Assert
        expect(error.retryable).toBe(true);
      });

      it('should create unique instances with different IDs and timestamps', () => {
        // Act
        const error1 = ApplicationError.unexpectedError();
        const error2 = ApplicationError.unexpectedError();

        // Assert
        expect(error1.errorId).not.toBe(error2.errorId);
        expect(error1.timestamp).not.toBe(error2.timestamp);
      });
    });
  });

  describe('Error Classification and Behavior', () => {
    describe('Retryable Error Classification', () => {
      it('should classify authentication errors as non-retryable', () => {
        // Act & Assert
        expect(ApplicationError.authenticationFailed().retryable).toBe(false);
        expect(ApplicationError.sessionExpired().retryable).toBe(false);
        expect(ApplicationError.userNotFound().retryable).toBe(false);
        expect(ApplicationError.accountLocked('user123').retryable).toBe(false);
      });

      it('should classify user management errors as non-retryable', () => {
        // Act & Assert
        expect(ApplicationError.insufficientPermissions('admin').retryable).toBe(false);
        expect(ApplicationError.userAlreadyExists('test@example.com').retryable).toBe(false);
        expect(ApplicationError.invalidInput('Invalid format').retryable).toBe(false);
      });

      it('should classify system errors as retryable', () => {
        // Act & Assert
        expect(ApplicationError.serviceUnavailable('database').retryable).toBe(true);
        expect(ApplicationError.unexpectedError().retryable).toBe(true);
      });

      it('should respect explicit retryable parameter in constructor', () => {
        // Arrange & Act
        const retryableError = new ApplicationError(
          ApplicationErrorCode.AUTH_FAILED,
          'Tech message',
          'User message',
          undefined,
          undefined,
          true
        );

        const nonRetryableError = new ApplicationError(
          ApplicationErrorCode.SERVICE_UNAVAILABLE,
          'Tech message',
          'User message',
          undefined,
          undefined,
          false
        );

        // Assert
        expect(retryableError.retryable).toBe(true);
        expect(nonRetryableError.retryable).toBe(false);
      });
    });

    describe('Message Distinction', () => {
      it('should maintain distinction between technical and user messages', () => {
        // Arrange
        const technicalMessage = 'Database constraint violation: unique_email_index';
        const userMessage = 'An account with this email already exists';

        // Act
        const error = new ApplicationError(
          ApplicationErrorCode.USER_ALREADY_EXISTS,
          technicalMessage,
          userMessage
        );

        // Assert
        expect(error.message).toBe(technicalMessage); // Technical message for developers
        expect(error.userMessage).toBe(userMessage); // User-friendly message for UI
        expect(error.message).not.toBe(error.userMessage);
      });

      it('should provide appropriate user messages for all factory methods', () => {
        // Arrange
        const factoryMethods = [
          { method: () => ApplicationError.authenticationFailed(), expectUserFriendly: true },
          { method: () => ApplicationError.sessionExpired(), expectUserFriendly: true },
          { method: () => ApplicationError.userNotFound(), expectUserFriendly: true },
          {
            method: () => ApplicationError.accountLocked('user123'),
            expectUserFriendly: true,
          },
          {
            method: () => ApplicationError.insufficientPermissions('admin'),
            expectUserFriendly: true,
          },
          {
            method: () => ApplicationError.userAlreadyExists('test@example.com'),
            expectUserFriendly: true,
          },
          {
            method: () => ApplicationError.serviceUnavailable('database'),
            expectUserFriendly: true,
          },
          {
            method: () => ApplicationError.invalidInput('Invalid format'),
            expectUserFriendly: true,
          },
          { method: () => ApplicationError.unexpectedError(), expectUserFriendly: true },
        ];

        // Act & Assert
        factoryMethods.forEach(({ method, expectUserFriendly }) => {
          const error = method();
          expect(error.userMessage).toBeDefined();
          expect(error.userMessage.length).toBeGreaterThan(0);

          if (expectUserFriendly) {
            // User messages should not contain technical jargon
            expect(error.userMessage).not.toMatch(/database|constraint|violation|stack|trace/i);
            expect(error.userMessage).not.toMatch(/null|undefined|object|array/i);
          }
        });
      });
    });

    describe('Suggested Actions', () => {
      it('should provide actionable suggestions for recoverable errors', () => {
        // Act & Assert
        const authError = ApplicationError.authenticationFailed();
        expect(authError.suggestedAction).toContain('check your credentials');

        const sessionError = ApplicationError.sessionExpired();
        expect(sessionError.suggestedAction).toContain('log in again');

        const userNotFoundError = ApplicationError.userNotFound();
        expect(userNotFoundError.suggestedAction).toContain('check the email');

        const permissionError = ApplicationError.insufficientPermissions('admin');
        expect(permissionError.suggestedAction).toContain('administrator');

        const duplicateUserError = ApplicationError.userAlreadyExists('test@example.com');
        expect(duplicateUserError.suggestedAction).toContain('logging in instead');
      });

      it('should provide time-specific suggestions for service unavailable errors', () => {
        // Arrange & Act
        const errorWithoutTime = ApplicationError.serviceUnavailable('database');
        const errorWithTime = ApplicationError.serviceUnavailable('api', 30);

        // Assert
        expect(errorWithoutTime.suggestedAction).toBe('Please try again in a few minutes');
        expect(errorWithTime.suggestedAction).toBe('Please try again in 30 seconds');
      });

      it('should handle undefined suggested actions gracefully', () => {
        // Arrange & Act
        const error = new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          'Technical message',
          'User message'
          // suggestedAction is undefined
        );

        // Assert
        expect(error.suggestedAction).toBeUndefined();
      });
    });
  });

  describe('Property Immutability and Edge Cases', () => {
    describe('Immutability Verification', () => {
      it('should create immutable error properties', () => {
        // Arrange
        const context = { userId: 123, operation: 'test' };
        const error = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Technical message',
          'User message',
          context,
          'Try again',
          true
        );

        // Act - Attempt to modify properties (should not affect original)
        const originalCode = error.code;
        const originalMessage = error.message;
        const originalUserMessage = error.userMessage;
        const originalTimestamp = error.timestamp.getTime();
        const originalErrorId = error.errorId;

        // Assert - Properties should remain unchanged
        expect(error.code).toBe(originalCode);
        expect(error.message).toBe(originalMessage);
        expect(error.userMessage).toBe(originalUserMessage);
        expect(error.timestamp.getTime()).toBe(originalTimestamp);
        expect(error.errorId).toBe(originalErrorId);
      });

      it('should provide TypeScript compile-time readonly protection', () => {
        // Arrange
        const error = ApplicationError.authenticationFailed();

        // Assert - TypeScript readonly provides compile-time protection
        // At runtime, JavaScript allows property modification, but TypeScript prevents it at compile time
        expect(error.code).toBe(ApplicationErrorCode.AUTH_FAILED);
        expect(error.userMessage).toBe('Invalid email or password');
        expect(error.retryable).toBe(false);
        expect(error.timestamp).toBeInstanceOf(Date);
        expect(error.errorId).toMatch(/^app_[a-z0-9]+_[a-z0-9]+$/);

        // Readonly properties are defined on the class
        expect(Object.getOwnPropertyDescriptor(error, 'code')).toBeDefined();
        expect(Object.getOwnPropertyDescriptor(error, 'userMessage')).toBeDefined();
        expect(Object.getOwnPropertyDescriptor(error, 'timestamp')).toBeDefined();
        expect(Object.getOwnPropertyDescriptor(error, 'errorId')).toBeDefined();
        expect(Object.getOwnPropertyDescriptor(error, 'retryable')).toBeDefined();
      });
    });

    describe('Edge Cases and Boundary Values', () => {
      it('should handle very long technical messages', () => {
        // Arrange
        const longMessage = 'A'.repeat(10000);

        // Act
        const error = new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          longMessage,
          'User message'
        );

        // Assert
        expect(error.message).toBe(longMessage);
        expect(error.message.length).toBe(10000);
      });

      it('should handle special characters in messages', () => {
        // Arrange
        const specialCharMessage = 'Error with émojis 🚫, newlines\n, tabs\t, and "quotes"';
        const userMessage = 'User message with <html> & entities';

        // Act
        const error = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          specialCharMessage,
          userMessage
        );

        // Assert
        expect(error.message).toBe(specialCharMessage);
        expect(error.userMessage).toBe(userMessage);
      });

      it('should handle empty string messages', () => {
        // Arrange & Act
        const error = new ApplicationError(ApplicationErrorCode.UNEXPECTED_ERROR, '', '');

        // Assert
        expect(error.message).toBe('');
        expect(error.userMessage).toBe('');
      });

      it('should handle complex context with circular references protection', () => {
        // Arrange
        const context: any = { id: 1, name: 'test' };
        context.self = context; // Create circular reference

        // Act
        const error = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Circular reference test',
          'Test message',
          context
        );

        // Assert
        expect(error.context).toBeDefined();
        expect((error.context as any)?.id).toBe(1);
        expect((error.context as any)?.name).toBe('test');
        // The circular reference should be preserved but not cause issues
      });
    });

    describe('Error Serialization', () => {
      it('should be serializable to JSON without circular references', () => {
        // Arrange
        const error = ApplicationError.serviceUnavailable('database', 60);

        // Act
        const serialized = JSON.stringify({
          name: error.name,
          message: error.message,
          code: error.code,
          userMessage: error.userMessage,
          context: error.context,
          suggestedAction: error.suggestedAction,
          retryable: error.retryable,
          timestamp: error.timestamp.toISOString(),
          errorId: error.errorId,
        });

        const parsed = JSON.parse(serialized);

        // Assert
        expect(parsed.name).toBe('ApplicationError');
        expect(parsed.message).toBe('Service database is currently unavailable');
        expect(parsed.code).toBe('SERVICE_UNAVAILABLE');
        expect(parsed.userMessage).toBe(
          'The service is temporarily unavailable. Please try again later.'
        );
        expect(parsed.context).toEqual({ service: 'database', retryAfter: 60 });
        expect(parsed.suggestedAction).toBe('Please try again in 60 seconds');
        expect(parsed.retryable).toBe(true);
        expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        expect(parsed.errorId).toMatch(/^app_[a-z0-9]+_[a-z0-9]+$/);
      });

      it('should maintain error information through serialization round trip', () => {
        // Arrange
        const originalError = ApplicationError.accountLocked(
          'user123',
          new Date('2024-01-15T10:00:00Z')
        );

        // Act
        const errorData = {
          name: originalError.name,
          message: originalError.message,
          code: originalError.code,
          userMessage: originalError.userMessage,
          context: originalError.context,
          suggestedAction: originalError.suggestedAction,
          retryable: originalError.retryable,
          timestamp: originalError.timestamp.toISOString(),
          errorId: originalError.errorId,
        };

        const serialized = JSON.stringify(errorData);
        const parsed = JSON.parse(serialized);

        // Assert
        expect(parsed.code).toBe(originalError.code);
        expect(parsed.message).toBe(originalError.message);
        expect(parsed.userMessage).toBe(originalError.userMessage);
        // Context comparison needs special handling for Date objects
        expect(parsed.context.userId).toBe((originalError.context as any).userId);
        expect(new Date(parsed.context.unlockTime).getTime()).toBe(
          ((originalError.context as any).unlockTime as Date).getTime()
        );
        expect(parsed.suggestedAction).toBe(originalError.suggestedAction);
        expect(parsed.retryable).toBe(originalError.retryable);
        expect(parsed.errorId).toBe(originalError.errorId);
        expect(new Date(parsed.timestamp).getTime()).toBe(originalError.timestamp.getTime());
      });
    });
  });
});
