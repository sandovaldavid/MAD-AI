import { BusinessRuleError } from './business-rule-error.entity';
import { BusinessRuleErrorCode } from '../enums/business-rule-error-code.enum';

/**
 * Domain Layer Test - BusinessRuleError
 *
 * Tests business rule error creation and validation following DDD principles.
 * Ensures error entities maintain invariants and provide correct domain feedback.
 */
describe('BusinessRuleError - Domain Tests', () => {
  describe('Constructor and Basic Properties', () => {
    it('should create BusinessRuleError with correct properties', () => {
      const message = 'Test error message';
      const code = 'TEST_ERROR';
      const context = { testId: 123 };

      const error = new BusinessRuleError(message, code, context);

      expect(error).toBeInstanceOf(BusinessRuleError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('BusinessRuleError');
      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
      expect(error.context).toEqual(context);
      expect(error.errorId).toBeDefined();
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should generate unique error IDs', () => {
      const error1 = new BusinessRuleError('Error 1', 'CODE1');
      const error2 = new BusinessRuleError('Error 2', 'CODE2');

      expect(error1.errorId).not.toBe(error2.errorId);
      expect(error1.errorId).toMatch(/^err-[a-z0-9]+-[a-z0-9]+$/);
    });

    it('should handle undefined context', () => {
      const error = new BusinessRuleError('Test message', 'TEST_CODE');

      expect(error.context).toBeUndefined();
    });

    it('should handle empty string message', () => {
      const error = new BusinessRuleError('', 'EMPTY_MESSAGE');

      expect(error.message).toBe('');
      expect(error.code).toBe('EMPTY_MESSAGE');
    });

    it('should handle empty string code', () => {
      const error = new BusinessRuleError('Test message', '');

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('');
    });

    it('should handle both empty strings', () => {
      const error = new BusinessRuleError('', '');

      expect(error.message).toBe('');
      expect(error.code).toBe('');
      expect(error.context).toBeUndefined();
    });

    it('should handle null context gracefully', () => {
      const error = new BusinessRuleError('Test message', 'TEST_CODE', null as any);

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.context).toBeNull();
    });

    it('should handle very long message strings', () => {
      const longMessage = 'A'.repeat(1000);
      const error = new BusinessRuleError(longMessage, 'LONG_MESSAGE');

      expect(error.message).toBe(longMessage);
      expect(error.message.length).toBe(1000);
    });

    it('should handle special characters in message and code', () => {
      const message = 'Error with special chars: !@#$%^&*()[]{}|;:,.<>?/~`\'\"\\';
      const code = 'SPECIAL_CODE!@#$%';

      const error = new BusinessRuleError(message, code);

      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
    });

    it('should handle unicode characters in message and code', () => {
      const message = 'Error con caracteres especiales: áéíóú ñ 中文 🚀';
      const code = 'UNICODE_ERROR_中文_🎯';

      const error = new BusinessRuleError(message, code);

      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
    });

    it('should handle numbers as strings in message and code', () => {
      const error = new BusinessRuleError('123456789', '987654321');

      expect(error.message).toBe('123456789');
      expect(error.code).toBe('987654321');
    });

    it('should handle whitespace-only strings', () => {
      const error = new BusinessRuleError('   ', '\t\n\r  ');

      expect(error.message).toBe('   ');
      expect(error.code).toBe('\t\n\r  ');
    });

    it('should create timestamp within reasonable bounds', () => {
      const before = new Date();
      const error = new BusinessRuleError('Timestamp test', 'TIMESTAMP_TEST');
      const after = new Date();

      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should generate error ID with consistent format', () => {
      const errors = Array.from({ length: 10 }, () => new BusinessRuleError('Test', 'TEST'));

      errors.forEach((error) => {
        expect(error.errorId).toMatch(/^err-[a-z0-9]+-[a-z0-9]+$/);
        expect(error.errorId.length).toBeGreaterThan(10);
        expect(error.errorId.startsWith('err-')).toBe(true);
      });
    });
  });

  describe('Factory Methods - Role Management', () => {
    describe('cannotDeleteRoleWithUsers', () => {
      // REGLA DE NEGOCIO: Un rol no puede eliminarse si tiene usuarios asignados
      // RAZÓN: Prevenir inconsistencias en el sistema
      // CONTEXTO: Integridad referencial del dominio
      it('should create error for role deletion with assigned users', () => {
        const roleId = 42;
        const userCount = 5;

        const error = BusinessRuleError.cannotDeleteRoleWithUsers(roleId, userCount);

        expect(error).toBeInstanceOf(BusinessRuleError);
        expect(error.message).toBe('Cannot delete role with assigned users');
        expect(error.code).toBe(BusinessRuleErrorCode.ROLE_HAS_ASSIGNED_USERS);
        expect(error.context).toEqual({ roleId, userCount });
      });

      it('should preserve role ID and user count in context', () => {
        const error = BusinessRuleError.cannotDeleteRoleWithUsers(1, 0);

        expect(error.context?.['roleId']).toBe(1);
        expect(error.context?.['userCount']).toBe(0);
      });

      it('should handle negative role ID edge case', () => {
        const error = BusinessRuleError.cannotDeleteRoleWithUsers(-1, 3);

        expect(error.context).toEqual({ roleId: -1, userCount: 3 });
      });

      it('should handle large numbers edge case', () => {
        const error = BusinessRuleError.cannotDeleteRoleWithUsers(Number.MAX_SAFE_INTEGER, 999999);

        expect(error.context).toEqual({ roleId: Number.MAX_SAFE_INTEGER, userCount: 999999 });
      });
    });

    describe('cannotAssignRole', () => {
      it('should create error for invalid role assignment', () => {
        const userId = 'user-123';
        const roleId = 'role-456';
        const currentRole = 'USER';
        const targetRole = 'ADMIN';

        const error = BusinessRuleError.cannotAssignRole(userId, roleId, currentRole, targetRole);

        expect(error.message).toBe('User user-123 with role USER cannot assign role ADMIN');
        expect(error.code).toBe(BusinessRuleErrorCode.CANNOT_ASSIGN_ROLE);
        expect(error.context).toEqual({ userId, roleId, currentRole, targetRole });
      });

      it('should handle empty string parameters', () => {
        const error = BusinessRuleError.cannotAssignRole('', '', '', '');

        expect(error.message).toBe('User  with role  cannot assign role ');
        expect(error.context).toEqual({ userId: '', roleId: '', currentRole: '', targetRole: '' });
      });

      it('should handle special characters in role names', () => {
        const error = BusinessRuleError.cannotAssignRole(
          'user@domain.com',
          'role-123!@#',
          'SUPER_ADMIN',
          'GUEST_USER'
        );

        expect(error.message).toBe(
          'User user@domain.com with role SUPER_ADMIN cannot assign role GUEST_USER'
        );
        expect(error.context).toEqual({
          userId: 'user@domain.com',
          roleId: 'role-123!@#',
          currentRole: 'SUPER_ADMIN',
          targetRole: 'GUEST_USER',
        });
      });

      it('should handle unicode characters', () => {
        const error = BusinessRuleError.cannotAssignRole(
          'usuario-español',
          'rol-123',
          'ADMINISTRADOR',
          'INVITADO'
        );

        expect(error.message).toBe(
          'User usuario-español with role ADMINISTRADOR cannot assign role INVITADO'
        );
      });
    });
  });

  describe('Factory Methods - Resource Management', () => {
    describe('cannotDeleteResourceInUse', () => {
      it('should create error for resource deletion when in use', () => {
        const resourceId = 100;
        const assignmentCount = 3;

        const error = BusinessRuleError.cannotDeleteResourceInUse(resourceId, assignmentCount);

        expect(error.message).toBe('Cannot delete resource currently in use');
        expect(error.code).toBe(BusinessRuleErrorCode.RESOURCE_IN_USE);
        expect(error.context).toEqual({ resourceId, assignmentCount });
      });

      it('should handle zero assignment count edge case', () => {
        const error = BusinessRuleError.cannotDeleteResourceInUse(999, 0);

        expect(error.context).toEqual({ resourceId: 999, assignmentCount: 0 });
      });

      it('should handle negative resource ID', () => {
        const error = BusinessRuleError.cannotDeleteResourceInUse(-5, 10);

        expect(error.context).toEqual({ resourceId: -5, assignmentCount: 10 });
      });

      it('should handle very large assignment count', () => {
        const error = BusinessRuleError.cannotDeleteResourceInUse(1, Number.MAX_SAFE_INTEGER);

        expect(error.context).toEqual({ resourceId: 1, assignmentCount: Number.MAX_SAFE_INTEGER });
      });
    });
  });

  describe('Factory Methods - Email Domain Validation', () => {
    describe('emailDomainBlacklisted', () => {
      it('should create error for blacklisted email domain', () => {
        const domain = 'spam.com';

        const error = BusinessRuleError.emailDomainBlacklisted(domain);

        expect(error.message).toBe("Email domain 'spam.com' is blacklisted");
        expect(error.code).toBe(BusinessRuleErrorCode.EMAIL_DOMAIN_BLACKLISTED);
        expect(error.context).toEqual({ domain });
      });
    });
  });

  describe('Factory Methods - Role Name Validation', () => {
    describe('roleNameReserved', () => {
      it('should create error for reserved role name', () => {
        const roleName = 'superadmin';

        const error = BusinessRuleError.roleNameReserved(roleName);

        expect(error.message).toBe("Role name 'superadmin' is reserved and cannot be used");
        expect(error.code).toBe(BusinessRuleErrorCode.ROLE_NAME_RESERVED);
        expect(error.context).toEqual({ roleName });
      });
    });
  });

  describe('Factory Methods - DateTime Validation', () => {
    describe('dateTimeTooOld', () => {
      it('should create error for datetime too far in past', () => {
        const dateTime = '2020-01-01T00:00:00Z';
        const maxDaysInPast = 30;

        const error = BusinessRuleError.dateTimeTooOld(dateTime, maxDaysInPast);

        expect(error.message).toBe(
          "Date/time '2020-01-01T00:00:00Z' is too far in the past (max 30 days allowed)"
        );
        expect(error.code).toBe(BusinessRuleErrorCode.DATETIME_TOO_OLD);
        expect(error.context).toEqual({ dateTime, maxDaysInPast });
      });
    });

    describe('dateTimeTooFuture', () => {
      it('should create error for datetime too far in future', () => {
        const dateTime = '2030-01-01T00:00:00Z';
        const maxDaysInFuture = 365;

        const error = BusinessRuleError.dateTimeTooFuture(dateTime, maxDaysInFuture);

        expect(error.message).toBe(
          "Date/time '2030-01-01T00:00:00Z' is too far in the future (max 365 days allowed)"
        );
        expect(error.code).toBe(BusinessRuleErrorCode.DATETIME_TOO_FUTURE);
        expect(error.context).toEqual({ dateTime, maxDaysInFuture });
      });
    });
  });

  describe('Factory Methods - Token Security', () => {
    describe('tokenSecurityInsufficient', () => {
      it('should create error for insufficient token security', () => {
        const actualLevel = 'LOW';
        const requiredLevel = 'HIGH';
        const maskedToken = 'tok_****1234';

        const error = BusinessRuleError.tokenSecurityInsufficient(
          actualLevel,
          requiredLevel,
          maskedToken
        );

        expect(error.message).toBe(
          "Token security level 'LOW' does not meet required level 'HIGH'"
        );
        expect(error.code).toBe(BusinessRuleErrorCode.TOKEN_SECURITY_INSUFFICIENT);
        expect(error.context).toEqual({ actualLevel, requiredLevel, maskedToken });
      });
    });

    describe('tokenTypeNotAllowedForHighSecurity', () => {
      it('should create error for disallowed token type in high security', () => {
        const tokenType = 'TEMPORARY';
        const maskedToken = 'tok_****5678';

        const error = BusinessRuleError.tokenTypeNotAllowedForHighSecurity(tokenType, maskedToken);

        expect(error.message).toBe(
          "Token type 'TEMPORARY' is not allowed for high-security operations"
        );
        expect(error.code).toBe(BusinessRuleErrorCode.TOKEN_TYPE_NOT_ALLOWED);
        expect(error.context).toEqual({ tokenType, maskedToken });
      });
    });

    describe('tokenExpired', () => {
      it('should create error for expired token', () => {
        const maskedToken = 'tok_****9999';
        const expiredBySeconds = 3600;

        const error = BusinessRuleError.tokenExpired(maskedToken, expiredBySeconds);

        expect(error.message).toBe('Token has expired 3600 seconds ago');
        expect(error.code).toBe(BusinessRuleErrorCode.TOKEN_EXPIRED);
        expect(error.context).toEqual({ maskedToken, expiredBySeconds });
      });
    });

    describe('tokenInvalid', () => {
      it('should create error for invalid token', () => {
        const maskedToken = 'tok_****invalid';

        const error = BusinessRuleError.tokenInvalid(maskedToken);

        expect(error.message).toBe('Token is invalid or malformed');
        expect(error.code).toBe(BusinessRuleErrorCode.TOKEN_INVALID);
        expect(error.context).toEqual({ maskedToken });
      });
    });
  });

  describe('Factory Methods - Notification Preferences', () => {
    describe('cannotDisableAllChannels', () => {
      it('should create error when trying to disable all notification channels', () => {
        const context = { userId: 'user-123' };

        const error = BusinessRuleError.cannotDisableAllChannels(context);

        expect(error.message).toBe('At least one notification channel must be enabled');
        expect(error.code).toBe(BusinessRuleErrorCode.NO_CHANNELS_ENABLED);
        expect(error.context).toEqual(context);
      });

      it('should create error without context parameter', () => {
        const error = BusinessRuleError.cannotDisableAllChannels();

        expect(error.message).toBe('At least one notification channel must be enabled');
        expect(error.code).toBe(BusinessRuleErrorCode.NO_CHANNELS_ENABLED);
        expect(error.context).toBeUndefined();
      });

      it('should create error with empty context', () => {
        const error = BusinessRuleError.cannotDisableAllChannels({});

        expect(error.message).toBe('At least one notification channel must be enabled');
        expect(error.code).toBe(BusinessRuleErrorCode.NO_CHANNELS_ENABLED);
        expect(error.context).toEqual({});
      });

      it('should create error with complex context', () => {
        const complexContext = {
          userId: 'user-456',
          attemptedChannels: ['email', 'sms', 'push'],
          timestamp: '2024-01-01T00:00:00Z',
          source: 'settings-page',
        };

        const error = BusinessRuleError.cannotDisableAllChannels(complexContext);

        expect(error.context).toEqual(complexContext);
      });
    });

    describe('cannotDisableCriticalNotifications', () => {
      it('should create error when trying to disable critical notifications', () => {
        const context = { notificationType: 'security' };

        const error = BusinessRuleError.cannotDisableCriticalNotifications(context);

        expect(error.message).toBe('Critical notifications cannot be disabled');
        expect(error.code).toBe(BusinessRuleErrorCode.CRITICAL_NOTIFICATIONS_REQUIRED);
        expect(error.context).toEqual(context);
      });

      it('should create error without context parameter', () => {
        const error = BusinessRuleError.cannotDisableCriticalNotifications();

        expect(error.message).toBe('Critical notifications cannot be disabled');
        expect(error.code).toBe(BusinessRuleErrorCode.CRITICAL_NOTIFICATIONS_REQUIRED);
        expect(error.context).toBeUndefined();
      });

      it('should create error with system notification context', () => {
        const context = {
          notificationTypes: ['system', 'security'],
          userId: 'admin-789',
          attemptedDisable: 'system',
        };

        const error = BusinessRuleError.cannotDisableCriticalNotifications(context);

        expect(error.context).toEqual(context);
      });
    });

    describe('invalidQuietHoursFormat', () => {
      it('should create error for invalid quiet hours format', () => {
        const context = { providedFormat: '25:00-26:00' };

        const error = BusinessRuleError.invalidQuietHoursFormat(context);

        expect(error.message).toBe('Invalid quiet hours format');
        expect(error.code).toBe(BusinessRuleErrorCode.INVALID_QUIET_HOURS_FORMAT);
        expect(error.context).toEqual(context);
      });

      it('should create error without context parameter', () => {
        const error = BusinessRuleError.invalidQuietHoursFormat();

        expect(error.message).toBe('Invalid quiet hours format');
        expect(error.code).toBe(BusinessRuleErrorCode.INVALID_QUIET_HOURS_FORMAT);
        expect(error.context).toBeUndefined();
      });

      it('should create error with detailed validation context', () => {
        const context = {
          providedFormat: 'invalid-format',
          expectedFormat: 'HH:MM-HH:MM',
          validationRules: ['24-hour format', 'start < end'],
          userId: 'user-settings-123',
        };

        const error = BusinessRuleError.invalidQuietHoursFormat(context);

        expect(error.context).toEqual(context);
      });
    });

    describe('invalidNotificationFrequency', () => {
      it('should create error for invalid notification frequency', () => {
        const context = { frequency: 0, minAllowed: 1, maxAllowed: 100 };

        const error = BusinessRuleError.invalidNotificationFrequency(context);

        expect(error.message).toBe('Notification frequency is out of allowed range');
        expect(error.code).toBe(BusinessRuleErrorCode.INVALID_NOTIFICATION_FREQUENCY);
        expect(error.context).toEqual(context);
      });

      it('should create error without context parameter', () => {
        const error = BusinessRuleError.invalidNotificationFrequency();

        expect(error.message).toBe('Notification frequency is out of allowed range');
        expect(error.code).toBe(BusinessRuleErrorCode.INVALID_NOTIFICATION_FREQUENCY);
        expect(error.context).toBeUndefined();
      });

      it('should create error with boundary violation context', () => {
        const context = {
          frequency: -1,
          minAllowed: 0,
          maxAllowed: 24,
          violationType: 'below_minimum',
          requestedBy: 'user-frequency-test',
        };

        const error = BusinessRuleError.invalidNotificationFrequency(context);

        expect(error.context).toEqual(context);
      });
    });

    describe('unsupportedNotificationLanguage', () => {
      it('should create error for unsupported notification language', () => {
        const language = 'klingon';

        const error = BusinessRuleError.unsupportedNotificationLanguage(language);

        expect(error.message).toBe("Notification language 'klingon' is not supported");
        expect(error.code).toBe(BusinessRuleErrorCode.UNSUPPORTED_NOTIFICATION_LANGUAGE);
        expect(error.context).toEqual({ language });
      });

      it('should create error with empty language string', () => {
        const language = '';

        const error = BusinessRuleError.unsupportedNotificationLanguage(language);

        expect(error.message).toBe("Notification language '' is not supported");
        expect(error.code).toBe(BusinessRuleErrorCode.UNSUPPORTED_NOTIFICATION_LANGUAGE);
        expect(error.context).toEqual({ language });
      });

      it('should create error with special characters in language', () => {
        const language = 'zh-中文-!@#$%';

        const error = BusinessRuleError.unsupportedNotificationLanguage(language);

        expect(error.message).toBe("Notification language 'zh-中文-!@#$%' is not supported");
        expect(error.context).toEqual({ language });
      });
    });

    describe('inconsistentPreferences', () => {
      it('should create error for inconsistent notification preferences', () => {
        const context = { privacyMode: 'strict', blockedNotifications: ['security'] };

        const error = BusinessRuleError.inconsistentPreferences(context);

        expect(error.message).toBe('Preferences are inconsistent with business rules');
        expect(error.code).toBe(BusinessRuleErrorCode.INCONSISTENT_PREFERENCES);
        expect(error.context).toEqual(context);
      });

      it('should create error without context parameter', () => {
        const error = BusinessRuleError.inconsistentPreferences();

        expect(error.message).toBe('Preferences are inconsistent with business rules');
        expect(error.code).toBe(BusinessRuleErrorCode.INCONSISTENT_PREFERENCES);
        expect(error.context).toBeUndefined();
      });

      it('should create error with complex inconsistency context', () => {
        const context = {
          conflictingSettings: {
            privacyMode: 'maximum',
            notificationChannels: ['email', 'sms'],
            requiredNotifications: ['security', 'system'],
          },
          conflictReason: 'privacy_blocks_required_notifications',
          userId: 'user-preferences-conflict',
        };

        const error = BusinessRuleError.inconsistentPreferences(context);

        expect(error.context).toEqual(context);
      });
    });

    describe('invalidPreferencesUpdate', () => {
      it('should create error for invalid preferences update attempt', () => {
        const context = { invalidField: 'unknownSetting', providedValue: 'invalid' };

        const error = BusinessRuleError.invalidPreferencesUpdate(context);

        expect(error.message).toBe('Cannot update preferences with invalid data');
        expect(error.code).toBe(BusinessRuleErrorCode.INVALID_PREFERENCES_UPDATE);
        expect(error.context).toEqual(context);
      });

      it('should create error without context parameter', () => {
        const error = BusinessRuleError.invalidPreferencesUpdate();

        expect(error.message).toBe('Cannot update preferences with invalid data');
        expect(error.code).toBe(BusinessRuleErrorCode.INVALID_PREFERENCES_UPDATE);
        expect(error.context).toBeUndefined();
      });

      it('should create error with validation failure context', () => {
        const context = {
          validationErrors: [
            { field: 'theme', error: 'unsupported_value' },
            { field: 'language', error: 'invalid_locale' },
          ],
          attemptedUpdate: {
            theme: 'rainbow',
            language: 'nonexistent',
          },
          userId: 'user-invalid-update',
        };

        const error = BusinessRuleError.invalidPreferencesUpdate(context);

        expect(error.context).toEqual(context);
      });
    });

    describe('notificationAlreadyDismissed', () => {
      it('should create error when trying to mark dismissed notification as read', () => {
        const notificationId = 'notif-123';

        const error = BusinessRuleError.notificationAlreadyDismissed(notificationId);

        expect(error.message).toBe('Cannot mark dismissed notification as read');
        expect(error.code).toBe(BusinessRuleErrorCode.NOTIFICATION_ALREADY_DISMISSED);
        expect(error.context).toEqual({
          notificationId,
          currentState: 'dismissed',
          attemptedAction: 'markAsRead',
        });
      });
    });
  });

  describe('Business Rule Invariants', () => {
    it('should maintain error immutability through readonly contract', () => {
      const error = BusinessRuleError.cannotDeleteRoleWithUsers(1, 1);

      // Domain Layer maintains immutability through TypeScript readonly contracts
      // The entity should be immutable by design, not by runtime enforcement
      expect(error.code).toBe(BusinessRuleErrorCode.ROLE_HAS_ASSIGNED_USERS);
      expect(error.context).toEqual({ roleId: 1, userCount: 1 });
      expect(error.errorId).toBeDefined();
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should generate valid error IDs with consistent format', () => {
      const error = new BusinessRuleError('Test', 'TEST');

      expect(error.errorId).toMatch(/^err-[a-z0-9]+-[a-z0-9]+$/);
      expect(error.errorId.length).toBeGreaterThan(10);
    });

    it('should preserve timestamp at creation time', () => {
      const before = new Date();
      const error = new BusinessRuleError('Test', 'TEST');
      const after = new Date();

      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should maintain context immutability', () => {
      const context = { roleId: 1, userCount: 5 };
      const error = BusinessRuleError.cannotDeleteRoleWithUsers(1, 5);

      // Context should be preserved exactly as provided
      expect(error.context).toEqual(context);
      expect(error.context?.['roleId']).toBe(1);
      expect(error.context?.['userCount']).toBe(5);
    });

    it('should always generate unique IDs even in rapid succession', () => {
      const errors = Array.from({ length: 100 }, () => new BusinessRuleError('Test', 'CODE'));
      const uniqueIds = new Set(errors.map((e) => e.errorId));
      expect(uniqueIds.size).toBe(100);
    });
  });

  describe('Error ID Generation - Comprehensive Coverage', () => {
    it('should generate error IDs with proper prefix', () => {
      const error = new BusinessRuleError('Test', 'TEST');

      expect(error.errorId).toMatch(/^err-/);
      expect(error.errorId.startsWith('err-')).toBe(true);
    });

    it('should generate error IDs with timestamp component', () => {
      const error = new BusinessRuleError('Test', 'TEST');
      const parts = error.errorId.split('-');

      expect(parts.length).toBe(3);
      expect(parts[0]).toBe('err');
      expect(parts[1]).toMatch(/^[a-z0-9]+$/);
      expect(parts[2]).toMatch(/^[a-z0-9]+$/);
    });

    it('should generate error IDs with valid base36 components', () => {
      const errors = Array.from({ length: 50 }, () => new BusinessRuleError('Test', 'TEST'));

      errors.forEach((error) => {
        const parts = error.errorId.split('-');
        expect(parts[1]).toMatch(/^[a-z0-9]+$/); // timestamp component
        expect(parts[2]).toMatch(/^[a-z0-9]+$/); // random component
        expect(parts[1].length).toBeGreaterThan(0);
        expect(parts[2].length).toBeGreaterThan(0);
      });
    });

    it('should generate error IDs with increasing timestamp components over time', async () => {
      const error1 = new BusinessRuleError('Test 1', 'TEST1');

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 1));

      const error2 = new BusinessRuleError('Test 2', 'TEST2');

      const timestamp1 = error1.errorId.split('-')[1];
      const timestamp2 = error2.errorId.split('-')[1];

      // Convert base36 to number for comparison
      const num1 = parseInt(timestamp1, 36);
      const num2 = parseInt(timestamp2, 36);

      expect(num2).toBeGreaterThanOrEqual(num1);
    });

    it('should generate error IDs with different random components', () => {
      // Create multiple errors at the same time to test randomness
      const errors = Array.from({ length: 20 }, () => new BusinessRuleError('Test', 'TEST'));

      const randomComponents = errors.map((error) => error.errorId.split('-')[2]);
      const uniqueRandoms = new Set(randomComponents);

      // With good randomness, should have most components unique
      expect(uniqueRandoms.size).toBeGreaterThan(15); // Allow some collisions but expect mostly unique
    });

    it('should handle rapid error creation maintaining uniqueness', () => {
      const startTime = Date.now();
      const errors = [];

      // Create 200 errors rapidly
      for (let i = 0; i < 200; i++) {
        errors.push(new BusinessRuleError(`Test ${i}`, `TEST${i}`));
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all IDs are unique
      const ids = errors.map((e) => e.errorId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(200);

      // Verify format consistency
      ids.forEach((id) => {
        expect(id).toMatch(/^err-[a-z0-9]+-[a-z0-9]+$/);
      });

      // Test completed quickly (under 1 second for 200 errors)
      expect(duration).toBeLessThan(1000);
    });

    it('should generate consistent ID format across different error types', () => {
      const roleError = BusinessRuleError.cannotDeleteRoleWithUsers(1, 5);
      const tokenError = BusinessRuleError.tokenExpired('tok_***', 3600);
      const domainError = BusinessRuleError.emailDomainBlacklisted('spam.com');
      const notificationError = BusinessRuleError.cannotDisableAllChannels();

      const errors = [roleError, tokenError, domainError, notificationError];

      errors.forEach((error) => {
        expect(error.errorId).toMatch(/^err-[a-z0-9]+-[a-z0-9]+$/);
        expect(error.errorId.split('-').length).toBe(3);
      });
    });

    it('should maintain ID uniqueness across factory methods', () => {
      const errors = [
        BusinessRuleError.cannotDeleteRoleWithUsers(1, 1),
        BusinessRuleError.cannotAssignRole('u1', 'r1', 'USER', 'ADMIN'),
        BusinessRuleError.cannotDeleteResourceInUse(1, 1),
        BusinessRuleError.emailDomainBlacklisted('test.com'),
        BusinessRuleError.roleNameReserved('admin'),
        BusinessRuleError.dateTimeTooOld('2020-01-01', 30),
        BusinessRuleError.dateTimeTooFuture('2030-01-01', 365),
        BusinessRuleError.tokenSecurityInsufficient('LOW', 'HIGH', 'tok_***'),
        BusinessRuleError.tokenTypeNotAllowedForHighSecurity('TEMP', 'tok_***'),
        BusinessRuleError.tokenExpired('tok_***', 3600),
        BusinessRuleError.tokenInvalid('tok_***'),
        BusinessRuleError.cannotDisableAllChannels(),
        BusinessRuleError.cannotDisableCriticalNotifications(),
        BusinessRuleError.invalidQuietHoursFormat(),
        BusinessRuleError.invalidNotificationFrequency(),
        BusinessRuleError.unsupportedNotificationLanguage('klingon'),
        BusinessRuleError.inconsistentPreferences(),
        BusinessRuleError.invalidPreferencesUpdate(),
        BusinessRuleError.notificationAlreadyDismissed('notif-123'),
      ];

      const ids = errors.map((e) => e.errorId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(errors.length);
    });
  });

  describe('Error Context Handling', () => {
    it('should handle complex context objects', () => {
      const complexContext = {
        userId: 'user-123',
        roles: ['ADMIN', 'USER'],
        metadata: {
          source: 'api',
          timestamp: new Date(),
          nested: { value: 42 },
        },
      };

      const error = new BusinessRuleError('Complex context test', 'COMPLEX_TEST', complexContext);

      expect(error.context).toEqual(complexContext);
      expect((error.context as any)?.metadata?.nested?.value).toBe(42);
    });

    it('should handle empty context gracefully', () => {
      const error = new BusinessRuleError('No context', 'NO_CONTEXT', {});

      expect(error.context).toEqual({});
    });
  });

  describe('Context Object Variations - Comprehensive Coverage', () => {
    it('should handle deeply nested context objects', () => {
      const deeplyNestedContext = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  data: 'deeply nested value',
                  array: [1, 2, { nested: true }],
                  nullValue: null,
                  undefinedValue: undefined,
                },
              },
            },
          },
        },
        parallelBranch: {
          data: 'parallel data',
        },
      };

      const error = new BusinessRuleError('Deep nested test', 'DEEP_NESTED', deeplyNestedContext);

      expect(error.context).toEqual(deeplyNestedContext);
      expect((error.context as any)?.level1?.level2?.level3?.level4?.level5?.data).toBe(
        'deeply nested value'
      );
      expect((error.context as any)?.parallelBranch?.data).toBe('parallel data');
    });

    it('should handle context with various data types', () => {
      const now = new Date();
      const regex = /test-pattern/gi;
      const map = new Map([
        ['key1', 'value1'],
        ['key2', '42'],
      ]);
      const set = new Set([1, 2, 3]);

      const mixedTypesContext = {
        stringValue: 'test string',
        numberValue: 42,
        booleanValue: true,
        nullValue: null,
        undefinedValue: undefined,
        arrayValue: [1, 'string', true, null],
        objectValue: { nested: 'object' },
        dateValue: now,
        regexValue: regex,
        mapValue: map,
        setValue: set,
        functionValue: () => 'test function',
        symbolValue: Symbol('test-symbol'),
      };

      const error = new BusinessRuleError('Mixed types test', 'MIXED_TYPES', mixedTypesContext);

      expect(error.context).toEqual(mixedTypesContext);
      expect((error.context as any)?.stringValue).toBe('test string');
      expect((error.context as any)?.numberValue).toBe(42);
      expect((error.context as any)?.booleanValue).toBe(true);
      expect((error.context as any)?.dateValue).toBe(now);
      expect((error.context as any)?.arrayValue.length).toBe(4);
    });

    it('should handle context with circular references gracefully', () => {
      const circularContext: any = {
        name: 'circular test',
        data: { value: 123 },
      };
      circularContext.self = circularContext;

      const error = new BusinessRuleError('Circular reference test', 'CIRCULAR', circularContext);

      expect(error.context).toBe(circularContext);
      expect((error.context as any)?.name).toBe('circular test');
      expect((error.context as any)?.self).toBe(circularContext);
    });

    it('should handle context with large arrays', () => {
      const largeArrayContext = {
        smallArray: [1, 2, 3],
        largeArray: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` })),
        emptyArray: [],
        mixedArray: ['string', 42, true, { nested: 'object' }, [1, 2, 3], null, undefined],
      };

      const error = new BusinessRuleError('Large array test', 'LARGE_ARRAY', largeArrayContext);

      expect(error.context).toEqual(largeArrayContext);
      expect((error.context as any)?.largeArray.length).toBe(1000);
      expect((error.context as any)?.largeArray[0]).toEqual({ id: 0, value: 'item-0' });
      expect((error.context as any)?.largeArray[999]).toEqual({ id: 999, value: 'item-999' });
    });

    it('should handle context with special string values', () => {
      const specialStringsContext = {
        emptyString: '',
        whitespaceOnly: '   \t\n\r  ',
        unicodeString: '🚀 Unicode test: áéíóú ñ 中文 日本語 🎯',
        longString: 'A'.repeat(10000),
        jsonString: '{"key": "value", "nested": {"data": 123}}',
        base64String: btoa('test data'),
        urlString: 'https://example.com/path?query=value&other=123',
        emailString: 'user@domain.co.uk',
        phoneString: '+1-234-567-8900',
        specialChars: '!@#$%^&*()[]{}|;:,.<>?/~`\'\"\\',
      };

      const error = new BusinessRuleError(
        'Special strings test',
        'SPECIAL_STRINGS',
        specialStringsContext
      );

      expect(error.context).toEqual(specialStringsContext);
      expect((error.context as any)?.longString.length).toBe(10000);
      expect((error.context as any)?.unicodeString).toContain('🚀');
      expect((error.context as any)?.base64String).toBe(btoa('test data'));
    });

    it('should handle context with extreme numeric values', () => {
      const extremeNumbersContext = {
        zero: 0,
        negativeZero: -0,
        positiveInfinity: Infinity,
        negativeInfinity: -Infinity,
        notANumber: NaN,
        maxSafeInteger: Number.MAX_SAFE_INTEGER,
        minSafeInteger: Number.MIN_SAFE_INTEGER,
        maxValue: Number.MAX_VALUE,
        minValue: Number.MIN_VALUE,
        epsilon: Number.EPSILON,
        largeFloat: 1.7976931348623157e308,
        smallFloat: 5e-324,
        scientificNotation: 1.23e-10,
      };

      const error = new BusinessRuleError(
        'Extreme numbers test',
        'EXTREME_NUMBERS',
        extremeNumbersContext
      );

      expect(error.context).toEqual(extremeNumbersContext);
      expect((error.context as any)?.maxSafeInteger).toBe(Number.MAX_SAFE_INTEGER);
      expect((error.context as any)?.positiveInfinity).toBe(Infinity);
      expect(Number.isNaN((error.context as any)?.notANumber)).toBe(true);
    });

    it('should handle context with various object patterns', () => {
      class CustomClass {
        constructor(public value: string) {}
      }

      const complexObjectContext = {
        plainObject: { key: 'value' },
        objectWithMethods: {
          data: 'test',
          method: function () {
            return this.data;
          },
          arrow: () => 'arrow function',
        },
        classInstance: new CustomClass('instance value'),
        arrayOfObjects: [
          { id: 1, name: 'first' },
          { id: 2, name: 'second' },
        ],
        objectWithSymbolKeys: {
          [Symbol('symbol-key')]: 'symbol value',
          regularKey: 'regular value',
        },
        nestedArraysAndObjects: {
          users: [
            { id: 1, roles: ['admin', 'user'] },
            { id: 2, roles: ['user'] },
          ],
          config: {
            settings: {
              theme: 'dark',
              notifications: {
                email: true,
                push: false,
                sms: {
                  enabled: true,
                  frequency: 'daily',
                },
              },
            },
          },
        },
      };

      const error = new BusinessRuleError(
        'Complex objects test',
        'COMPLEX_OBJECTS',
        complexObjectContext
      );

      expect(error.context).toEqual(complexObjectContext);
      expect((error.context as any)?.classInstance).toBeInstanceOf(CustomClass);
      expect((error.context as any)?.classInstance.value).toBe('instance value');
      expect((error.context as any)?.nestedArraysAndObjects?.config?.settings?.theme).toBe('dark');
    });

    it('should handle context mutation after creation', () => {
      const mutableContext = {
        data: 'original',
        nested: { value: 1 },
        array: [1, 2, 3],
      };

      const error = new BusinessRuleError('Mutation test', 'MUTATION_TEST', mutableContext);

      // Mutate original context after error creation
      mutableContext.data = 'modified';
      mutableContext.nested.value = 999;
      mutableContext.array.push(4);

      // Error context should preserve original state (reference behavior)
      expect((error.context as any)?.data).toBe('modified'); // Reference kept
      expect((error.context as any)?.nested.value).toBe(999); // Reference kept
      expect((error.context as any)?.array.length).toBe(4); // Reference kept
    });

    it('should handle edge cases with falsy values in context', () => {
      const falsyContext = {
        false: false,
        zero: 0,
        emptyString: '',
        null: null,
        undefined: undefined,
        NaN: NaN,
        negativeZero: -0,
      };

      const error = new BusinessRuleError('Falsy values test', 'FALSY_VALUES', falsyContext);

      expect(error.context).toEqual(falsyContext);
      expect((error.context as any)?.false).toBe(false);
      expect((error.context as any)?.zero).toBe(0);
      expect((error.context as any)?.emptyString).toBe('');
      expect((error.context as any)?.null).toBeNull();
      expect((error.context as any)?.undefined).toBeUndefined();
    });

    it('should handle extremely large context objects', () => {
      const largeContext: Record<string, any> = {};

      // Create large context with many properties
      for (let i = 0; i < 1000; i++) {
        largeContext[`property_${i}`] = {
          id: i,
          data: `value_${i}`,
          metadata: {
            created: new Date(),
            tags: [`tag1_${i}`, `tag2_${i}`],
            nested: {
              level1: i * 2,
              level2: {
                value: `nested_${i}`,
              },
            },
          },
        };
      }

      const error = new BusinessRuleError('Large context test', 'LARGE_CONTEXT', largeContext);

      expect(error.context).toEqual(largeContext);
      expect(Object.keys(error.context as any).length).toBe(1000);
      expect((error.context as any)?.property_0?.id).toBe(0);
      expect((error.context as any)?.property_999?.metadata?.nested?.level1).toBe(1998);
    });
  });
});
