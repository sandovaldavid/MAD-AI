/**
 * Toast Component Barrel Export
 *
 * Central export point for all toast-related functionality.
 * This provides a clean API for importing toast components.
 *
 * @fileoverview Barrel export for toast component
 * @module Shared/Components/Toast
 * @since 1.0.0
 */

// Models
export type {
  UINotificationId,
  UINotification,
  NewUINotification,
  SimpleUINotification,
  UINotificationUpdate,
  UINotificationFilter,
  UINotificationSort,
} from './models/ui-notification.model';

// Enums
export { UINotificationType } from './enums/ui-notification-type.enum';
export { UINotificationPosition } from './enums/ui-notification-position.enum';

// Types
export type {
  UINotificationAction,
  UINotificationConfig,
  UINotificationDefaults,
  UINotificationTheme,
  UINotificationAnimation,
  UINotificationAccessibility,
  UINotificationResponsive,
  UINotificationSystemConfig,
} from './types/ui-notification.types';
