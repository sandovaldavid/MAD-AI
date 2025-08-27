/**
 * Notification types representing different business scenarios in the MAD-AI system.
 *
 * @description
 * This enum defines the standard notification types that represent different
 * business events and user feedback scenarios within the domain.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Priority levels for notifications with their semantic meanings.
 */
export const NOTIFICATION_PRIORITY_LEVELS = {
  1: 'Critical',
  2: 'High',
  3: 'Normal',
  4: 'Low',
  5: 'Informational',
} as const;

/**
 * Default display durations by notification type (in milliseconds).
 * null indicates persistent notifications that don't auto-dismiss.
 */
export const NOTIFICATION_DEFAULT_DURATIONS = {
  [NotificationType.SUCCESS]: 3000,
  [NotificationType.INFO]: 5000,
  [NotificationType.WARNING]: 8000,
  [NotificationType.ERROR]: null, // Persistent
} as const;
