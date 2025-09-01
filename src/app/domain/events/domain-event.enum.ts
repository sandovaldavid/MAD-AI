export enum DomainEventType {
  /** User account was created */
  USER_CREATED = 'USER_CREATED',
  /** User successfully authenticated */
  USER_AUTHENTICATED = 'USER_AUTHENTICATED',
  /** User authentication failed */
  USER_AUTHENTICATION_FAILED = 'USER_AUTHENTICATION_FAILED',
  /** User profile information was modified */
  USER_PROFILE_MODIFIED = 'USER_PROFILE_MODIFIED',
  /** User password was updated */
  USER_PASSWORD_UPDATED = 'USER_PASSWORD_UPDATED',
  /** User email address was verified */
  USER_EMAIL_VERIFIED = 'USER_EMAIL_VERIFIED',
  /** User account was activated */
  USER_ACCOUNT_ACTIVATED = 'USER_ACCOUNT_ACTIVATED',
  /** User account was deactivated */
  USER_ACCOUNT_DEACTIVATED = 'USER_ACCOUNT_DEACTIVATED',
  /** User role was changed */
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  /** User preferences were updated */
  USER_PREFERENCES_UPDATED = 'USER_PREFERENCES_UPDATED',
  /** Notification was dismissed by user */
  NOTIFICATION_DISMISSED = 'NOTIFICATION_DISMISSED',
  /** All user notifications were cleared */
  NOTIFICATIONS_CLEARED = 'NOTIFICATIONS_CLEARED',
  /** Role was created */
  ROLE_CREATED = 'ROLE_CREATED',
  /** Role was activated */
  ROLE_ACTIVATED = 'ROLE_ACTIVATED',
  /** Role was deactivated */
  ROLE_DEACTIVATED = 'ROLE_DEACTIVATED',
  /** Role was modified */
  ROLE_MODIFIED = 'ROLE_MODIFIED',
  /** User session was terminated */
  SESSION_TERMINATED = 'SESSION_TERMINATED',
  /** User logged out from the system */
  USER_LOGGED_OUT = 'USER_LOGGED_OUT',
  /** User session expired due to timeout */
  USER_SESSION_EXPIRED = 'USER_SESSION_EXPIRED',
  /** Unauthorized access attempt detected */
  UNAUTHORIZED_ACCESS_ATTEMPTED = 'UNAUTHORIZED_ACCESS_ATTEMPTED',
  /** Security violation detected */
  SECURITY_VIOLATION_DETECTED = 'SECURITY_VIOLATION_DETECTED',
}

export enum DomainEventSeverity {
  /** Low impact business event */
  LOW = 'LOW',
  /** Medium impact business event */
  MEDIUM = 'MEDIUM',
  /** High impact business event */
  HIGH = 'HIGH',
  /** Critical business event requiring immediate attention */
  CRITICAL = 'CRITICAL',
}
