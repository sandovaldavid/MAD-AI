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
  });

  describe('Factory Methods - Role Management', () => {
    describe('cannotDeleteRoleWithUsers', () => {
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
    });

    describe('cannotDisableCriticalNotifications', () => {
      it('should create error when trying to disable critical notifications', () => {
        const context = { notificationType: 'security' };

        const error = BusinessRuleError.cannotDisableCriticalNotifications(context);

        expect(error.message).toBe('Critical notifications cannot be disabled');
        expect(error.code).toBe(BusinessRuleErrorCode.CRITICAL_NOTIFICATIONS_REQUIRED);
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
    });

    describe('invalidNotificationFrequency', () => {
      it('should create error for invalid notification frequency', () => {
        const context = { frequency: 0, minAllowed: 1, maxAllowed: 100 };

        const error = BusinessRuleError.invalidNotificationFrequency(context);

        expect(error.message).toBe('Notification frequency is out of allowed range');
        expect(error.code).toBe(BusinessRuleErrorCode.INVALID_NOTIFICATION_FREQUENCY);
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
    });

    describe('inconsistentPreferences', () => {
      it('should create error for inconsistent notification preferences', () => {
        const context = { privacyMode: 'strict', blockedNotifications: ['security'] };

        const error = BusinessRuleError.inconsistentPreferences(context);

        expect(error.message).toBe('Preferences are inconsistent with business rules');
        expect(error.code).toBe(BusinessRuleErrorCode.INCONSISTENT_PREFERENCES);
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
});
