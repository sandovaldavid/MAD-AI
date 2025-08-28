/**
 * Business Rule Error Codes for MAD-AI System
 *
 * @description
 * This enum centralizes all business rule error codes used throughout the domain layer.
 * These codes represent violations of business logic and domain policies.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
export enum BusinessRuleErrorCode {
  // Role Management Errors
  ROLE_HAS_ASSIGNED_USERS = 'ROLE_HAS_ASSIGNED_USERS',
  CANNOT_ASSIGN_ROLE = 'CANNOT_ASSIGN_ROLE',
  RESOURCE_IN_USE = 'RESOURCE_IN_USE',
  ROLE_NAME_RESERVED = 'ROLE_NAME_RESERVED',

  // Token Business Rule Errors
  TOKEN_SECURITY_INSUFFICIENT = 'TOKEN_SECURITY_INSUFFICIENT',
  TOKEN_TYPE_NOT_ALLOWED = 'TOKEN_TYPE_NOT_ALLOWED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',

  // DateTime Business Rule Errors
  DATETIME_TOO_OLD = 'DATETIME_TOO_OLD',
  DATETIME_TOO_FUTURE = 'DATETIME_TOO_FUTURE',

  // Email Domain Policy Errors
  EMAIL_DOMAIN_BLACKLISTED = 'EMAIL_DOMAIN_BLACKLISTED',

  // Notification Preference Errors
  NO_CHANNELS_ENABLED = 'NO_CHANNELS_ENABLED',
  CRITICAL_NOTIFICATIONS_REQUIRED = 'CRITICAL_NOTIFICATIONS_REQUIRED',
  INVALID_QUIET_HOURS_FORMAT = 'INVALID_QUIET_HOURS_FORMAT',
  INVALID_NOTIFICATION_FREQUENCY = 'INVALID_NOTIFICATION_FREQUENCY',
  UNSUPPORTED_NOTIFICATION_LANGUAGE = 'UNSUPPORTED_NOTIFICATION_LANGUAGE',
  INCONSISTENT_PREFERENCES = 'INCONSISTENT_PREFERENCES',
  INVALID_PREFERENCES_UPDATE = 'INVALID_PREFERENCES_UPDATE',

  // Notification State Errors
  NOTIFICATION_ALREADY_DISMISSED = 'NOTIFICATION_ALREADY_DISMISSED',
}

/**
 * Utility functions for business rule error codes.
 */
export const BusinessRuleErrorCodeUtils = {
  /**
   * Checks if the error code is related to role management.
   */
  isRoleManagementError(code: BusinessRuleErrorCode): boolean {
    return [
      BusinessRuleErrorCode.ROLE_HAS_ASSIGNED_USERS,
      BusinessRuleErrorCode.CANNOT_ASSIGN_ROLE,
      BusinessRuleErrorCode.RESOURCE_IN_USE,
      BusinessRuleErrorCode.ROLE_NAME_RESERVED,
    ].includes(code);
  },

  /**
   * Checks if the error code is related to token business rules.
   */
  isTokenBusinessRuleError(code: BusinessRuleErrorCode): boolean {
    return [
      BusinessRuleErrorCode.TOKEN_SECURITY_INSUFFICIENT,
      BusinessRuleErrorCode.TOKEN_TYPE_NOT_ALLOWED,
      BusinessRuleErrorCode.TOKEN_EXPIRED,
      BusinessRuleErrorCode.TOKEN_INVALID,
    ].includes(code);
  },

  /**
   * Checks if the error code is related to datetime business rules.
   */
  isDateTimeBusinessRuleError(code: BusinessRuleErrorCode): boolean {
    return [
      BusinessRuleErrorCode.DATETIME_TOO_OLD,
      BusinessRuleErrorCode.DATETIME_TOO_FUTURE,
    ].includes(code);
  },

  /**
   * Checks if the error code is related to email domain policies.
   */
  isEmailDomainError(code: BusinessRuleErrorCode): boolean {
    return [BusinessRuleErrorCode.EMAIL_DOMAIN_BLACKLISTED].includes(code);
  },

  /**
   * Checks if the error code is related to notification preferences.
   */
  isNotificationPreferenceError(code: BusinessRuleErrorCode): boolean {
    return [
      BusinessRuleErrorCode.NO_CHANNELS_ENABLED,
      BusinessRuleErrorCode.CRITICAL_NOTIFICATIONS_REQUIRED,
      BusinessRuleErrorCode.INVALID_QUIET_HOURS_FORMAT,
      BusinessRuleErrorCode.INVALID_NOTIFICATION_FREQUENCY,
      BusinessRuleErrorCode.UNSUPPORTED_NOTIFICATION_LANGUAGE,
      BusinessRuleErrorCode.INCONSISTENT_PREFERENCES,
      BusinessRuleErrorCode.INVALID_PREFERENCES_UPDATE,
    ].includes(code);
  },

  /**
   * Gets human-readable description for error codes.
   */
  getDescription(code: BusinessRuleErrorCode): string {
    const descriptions: Record<BusinessRuleErrorCode, string> = {
      [BusinessRuleErrorCode.ROLE_HAS_ASSIGNED_USERS]: 'Cannot delete role with assigned users',
      [BusinessRuleErrorCode.CANNOT_ASSIGN_ROLE]: 'User cannot assign the requested role',
      [BusinessRuleErrorCode.RESOURCE_IN_USE]: 'Cannot delete resource currently in use',
      [BusinessRuleErrorCode.ROLE_NAME_RESERVED]: 'Role name is reserved and cannot be used',
      [BusinessRuleErrorCode.TOKEN_SECURITY_INSUFFICIENT]:
        'Token does not meet minimum security requirements',
      [BusinessRuleErrorCode.TOKEN_TYPE_NOT_ALLOWED]:
        'Token type is not allowed for this operation',
      [BusinessRuleErrorCode.TOKEN_EXPIRED]: 'Token has expired',
      [BusinessRuleErrorCode.TOKEN_INVALID]: 'Token is invalid',
      [BusinessRuleErrorCode.DATETIME_TOO_OLD]: 'Date/time is too far in the past',
      [BusinessRuleErrorCode.DATETIME_TOO_FUTURE]: 'Date/time is too far in the future',
      [BusinessRuleErrorCode.EMAIL_DOMAIN_BLACKLISTED]: 'Email domain is blacklisted',
      [BusinessRuleErrorCode.NO_CHANNELS_ENABLED]:
        'At least one notification channel must be enabled',
      [BusinessRuleErrorCode.CRITICAL_NOTIFICATIONS_REQUIRED]:
        'Critical notifications cannot be disabled',
      [BusinessRuleErrorCode.INVALID_QUIET_HOURS_FORMAT]: 'Invalid quiet hours format',
      [BusinessRuleErrorCode.INVALID_NOTIFICATION_FREQUENCY]:
        'Notification frequency is out of allowed range',
      [BusinessRuleErrorCode.UNSUPPORTED_NOTIFICATION_LANGUAGE]:
        'Notification language is not supported',
      [BusinessRuleErrorCode.INCONSISTENT_PREFERENCES]:
        'Preferences are inconsistent with business rules',
      [BusinessRuleErrorCode.INVALID_PREFERENCES_UPDATE]:
        'Cannot update preferences with invalid data',
      [BusinessRuleErrorCode.NOTIFICATION_ALREADY_DISMISSED]:
        'Notification has already been dismissed',
    };

    return descriptions[code] || 'Unknown business rule error';
  },
};
