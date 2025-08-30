import { BusinessRuleErrorCode } from '../enums/business-rule-error-code.enum';

type ErrorContext = Record<string, unknown>;

export class BusinessRuleError extends Error {
  public readonly code: string;
  public readonly context?: ErrorContext;
  public readonly errorId: string;
  public readonly timestamp: Date;

  constructor(message: string, code: string, context?: ErrorContext) {
    super(message);
    this.name = 'BusinessRuleError';
    this.code = code;
    this.context = context;
    this.errorId = this.generateErrorId();
    this.timestamp = new Date();
  }

  // Genera un identificador único para el error
  private generateErrorId(): string {
    return 'err-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 10);
  }

  // Factory methods específicos
  static cannotDeleteRoleWithUsers(roleId: number, userCount: number): BusinessRuleError {
    return new BusinessRuleError(
      'Cannot delete role with assigned users',
      BusinessRuleErrorCode.ROLE_HAS_ASSIGNED_USERS,
      { roleId, userCount }
    );
  }

  static cannotAssignRole(
    userId: string,
    roleId: string,
    currentRole: string,
    targetRole: string
  ): BusinessRuleError {
    return new BusinessRuleError(
      `User ${userId} with role ${currentRole} cannot assign role ${targetRole}`,
      BusinessRuleErrorCode.CANNOT_ASSIGN_ROLE,
      { userId, roleId, currentRole, targetRole }
    );
  }

  static cannotDeleteResourceInUse(resourceId: number, assignmentCount: number): BusinessRuleError {
    return new BusinessRuleError(
      'Cannot delete resource currently in use',
      BusinessRuleErrorCode.RESOURCE_IN_USE,
      {
        resourceId,
        assignmentCount,
      }
    );
  }

  static emailDomainBlacklisted(domain: string): BusinessRuleError {
    return new BusinessRuleError(
      `Email domain '${domain}' is blacklisted`,
      BusinessRuleErrorCode.EMAIL_DOMAIN_BLACKLISTED,
      { domain }
    );
  }

  static roleNameReserved(roleName: string): BusinessRuleError {
    return new BusinessRuleError(
      `Role name '${roleName}' is reserved and cannot be used`,
      BusinessRuleErrorCode.ROLE_NAME_RESERVED,
      { roleName }
    );
  }

  static dateTimeTooOld(dateTime: string, maxDaysInPast: number): BusinessRuleError {
    return new BusinessRuleError(
      `Date/time '${dateTime}' is too far in the past (max ${maxDaysInPast} days allowed)`,
      BusinessRuleErrorCode.DATETIME_TOO_OLD,
      { dateTime, maxDaysInPast }
    );
  }

  static dateTimeTooFuture(dateTime: string, maxDaysInFuture: number): BusinessRuleError {
    return new BusinessRuleError(
      `Date/time '${dateTime}' is too far in the future (max ${maxDaysInFuture} days allowed)`,
      BusinessRuleErrorCode.DATETIME_TOO_FUTURE,
      { dateTime, maxDaysInFuture }
    );
  }

  static tokenSecurityInsufficient(
    actualLevel: string,
    requiredLevel: string,
    maskedToken: string
  ): BusinessRuleError {
    return new BusinessRuleError(
      `Token security level '${actualLevel}' does not meet required level '${requiredLevel}'`,
      BusinessRuleErrorCode.TOKEN_SECURITY_INSUFFICIENT,
      { actualLevel, requiredLevel, maskedToken }
    );
  }

  static tokenTypeNotAllowedForHighSecurity(
    tokenType: string,
    maskedToken: string
  ): BusinessRuleError {
    return new BusinessRuleError(
      `Token type '${tokenType}' is not allowed for high-security operations`,
      BusinessRuleErrorCode.TOKEN_TYPE_NOT_ALLOWED,
      { tokenType, maskedToken }
    );
  }

  static tokenExpired(maskedToken: string, expiredBySeconds: number): BusinessRuleError {
    return new BusinessRuleError(
      `Token has expired ${expiredBySeconds} seconds ago`,
      BusinessRuleErrorCode.TOKEN_EXPIRED,
      { maskedToken, expiredBySeconds }
    );
  }

  static tokenInvalid(maskedToken: string): BusinessRuleError {
    return new BusinessRuleError(
      'Token is invalid or malformed',
      BusinessRuleErrorCode.TOKEN_INVALID,
      { maskedToken }
    );
  }

  /**
   * No se puede deshabilitar todos los canales de notificación
   */
  static cannotDisableAllChannels(context?: ErrorContext): BusinessRuleError {
    return new BusinessRuleError(
      'At least one notification channel must be enabled',
      BusinessRuleErrorCode.NO_CHANNELS_ENABLED,
      context
    );
  }

  /**
   * No se pueden desactivar notificaciones críticas (system/security)
   */
  static cannotDisableCriticalNotifications(context?: ErrorContext): BusinessRuleError {
    return new BusinessRuleError(
      'Critical notifications cannot be disabled',
      BusinessRuleErrorCode.CRITICAL_NOTIFICATIONS_REQUIRED,
      context
    );
  }

  /**
   * Configuración inválida de quiet hours
   */
  static invalidQuietHoursFormat(context?: ErrorContext): BusinessRuleError {
    return new BusinessRuleError(
      'Invalid quiet hours format',
      BusinessRuleErrorCode.INVALID_QUIET_HOURS_FORMAT,
      context
    );
  }

  /**
   * Frecuencia de notificaciones fuera de rango permitido
   */
  static invalidNotificationFrequency(context?: ErrorContext): BusinessRuleError {
    return new BusinessRuleError(
      'Notification frequency is out of allowed range',
      BusinessRuleErrorCode.INVALID_NOTIFICATION_FREQUENCY,
      context
    );
  }

  /**
   * Idioma de notificación no soportado
   */
  static unsupportedNotificationLanguage(language: string): BusinessRuleError {
    return new BusinessRuleError(
      `Notification language '${language}' is not supported`,
      BusinessRuleErrorCode.UNSUPPORTED_NOTIFICATION_LANGUAGE,
      { language }
    );
  }

  /**
   * Preferencias inconsistentes (privacyMode bloqueando notificaciones obligatorias)
   */
  static inconsistentPreferences(context?: ErrorContext): BusinessRuleError {
    return new BusinessRuleError(
      'Preferences are inconsistent with business rules',
      BusinessRuleErrorCode.INCONSISTENT_PREFERENCES,
      context
    );
  }

  /**
   * Intento de actualizar preferencias con datos inválidos
   */
  static invalidPreferencesUpdate(context?: ErrorContext): BusinessRuleError {
    return new BusinessRuleError(
      'Cannot update preferences with invalid data',
      BusinessRuleErrorCode.INVALID_PREFERENCES_UPDATE,
      context
    );
  }

  /**
   * Intento de marcar como leída una notificación ya descartada
   */
  static notificationAlreadyDismissed(notificationId: string): BusinessRuleError {
    return new BusinessRuleError(
      'Cannot mark dismissed notification as read',
      BusinessRuleErrorCode.NOTIFICATION_ALREADY_DISMISSED,
      {
        notificationId,
        currentState: 'dismissed',
        attemptedAction: 'markAsRead',
      }
    );
  }
}
