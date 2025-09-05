/**
 * UI Notification Model - Shared Components Layer
 *
 * Represents a user interface notification with all presentation-specific properties.
 * This is a UI model for the presentation layer, properly located in shared/components.
 *
 * @fileoverview UI notification model for toast component
 * @module Shared/Components/Toast/Models
 * @since 1.0.0
 */

import { UINotificationType } from '../enums/ui-notification-type.enum';
import type { UINotificationPosition } from '../enums/ui-notification-position.enum';
import type { UINotificationAction } from '../types/ui-notification.types';

/**
 * Unique identifier for UI notifications
 */
export type UINotificationId = string;

/**
 * Complete UI notification entity with all presentation properties
 * Contains all information needed to display a notification in the user interface
 */
export interface UINotification {
  /** Unique identifier for the notification */
  id: UINotificationId;
  /** Visual type determining appearance (success, error, warning, info) */
  type: UINotificationType;
  /** Main notification message */
  message: string;
  /** Optional title/header for the notification */
  title?: string;
  /** Duration in milliseconds before auto-dismiss (0 = no auto-dismiss) */
  duration?: number | 0;
  /** Whether the user can manually dismiss the notification */
  dismissible?: boolean;
  /** Icon identifier to display with the notification */
  icon?: string | null;
  /** Unique key for deduplication purposes */
  key?: string | null;
  /** Group identifier for related notifications */
  groupId?: string | null;
  /** Timestamp when the notification was created */
  createdAt: number;
  /** Screen position where the notification should appear */
  position?: UINotificationPosition | null;
  /** Primary action button for the notification */
  action?: UINotificationAction | null;
  /** Secondary action button for the notification */
  secondaryAction?: UINotificationAction | null;
  /** Additional metadata for custom notification types */
  data?: Record<string, unknown>;
  /** Whether the notification is currently visible */
  visible?: boolean;
  /** Whether the notification has been read/acknowledged */
  read?: boolean;
  /** Animation state for transitions */
  animationState?: 'entering' | 'visible' | 'exiting' | 'hidden';
  /** Z-index for layering notifications */
  zIndex?: number;
}

/**
 * UI notification without auto-generated properties
 * Used for creating new notifications
 */
export type NewUINotification = Omit<
  UINotification,
  'id' | 'createdAt' | 'visible' | 'read' | 'animationState'
> & {
  id?: UINotificationId;
  createdAt?: number;
};

/**
 * Minimal UI notification for simple cases
 * Contains only the essential properties for basic notifications
 */
export interface SimpleUINotification {
  /** Visual type determining appearance */
  type: UINotificationType;
  /** Main notification message */
  message: string;
  /** Optional title/header */
  title?: string;
  /** Duration before auto-dismiss */
  duration?: number;
}

/**
 * UI notification update payload
 * Contains properties that can be updated after creation
 */
export interface UINotificationUpdate {
  /** Updated message */
  message?: string;
  /** Updated title */
  title?: string;
  /** Updated duration */
  duration?: number;
  /** Updated dismissible state */
  dismissible?: boolean;
  /** Updated visibility state */
  visible?: boolean;
  /** Updated read state */
  read?: boolean;
  /** Updated animation state */
  animationState?: 'entering' | 'visible' | 'exiting' | 'hidden';
  /** Updated actions */
  action?: UINotificationAction | null;
  secondaryAction?: UINotificationAction | null;
  /** Updated metadata */
  data?: Record<string, unknown>;
}

/**
 * UI notification filter criteria
 * Used for querying and filtering notifications
 */
export interface UINotificationFilter {
  /** Filter by notification type */
  type?: UINotificationType | UINotificationType[];
  /** Filter by visibility state */
  visible?: boolean;
  /** Filter by read state */
  read?: boolean;
  /** Filter by group ID */
  groupId?: string;
  /** Filter by creation date range */
  createdAfter?: number;
  createdBefore?: number;
  /** Filter by position */
  position?: UINotificationPosition;
  /** Filter by whether notification has actions */
  hasActions?: boolean;
}

/**
 * UI notification sorting options
 */
export interface UINotificationSort {
  /** Field to sort by */
  field: 'createdAt' | 'type' | 'priority' | 'duration';
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Utility functions for UI notification operations
 */
export const UINotificationUtils = {
  /**
   * Generate a unique notification ID
   * @returns Unique notification identifier
   */
  generateId(): UINotificationId {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  },

  /**
   * Create a complete UI notification from minimal data
   * @param notification - Minimal notification data
   * @returns Complete UI notification with defaults
   */
  create(notification: NewUINotification): UINotification {
    const now = Date.now();
    return {
      id: notification.id || this.generateId(),
      createdAt: notification.createdAt || now,
      visible: true,
      read: false,
      animationState: 'entering',
      dismissible: true,
      duration: 5000,
      ...notification,
    };
  },

  /**
   * Create a simple success notification
   * @param message - Success message
   * @param title - Optional title
   * @returns Success notification
   */
  createSuccess(message: string, title?: string): UINotification {
    return this.create({
      type: UINotificationType.SUCCESS,
      message,
      title,
      duration: 3000,
    });
  },

  /**
   * Create a simple error notification
   * @param message - Error message
   * @param title - Optional title
   * @returns Error notification
   */
  createError(message: string, title?: string): UINotification {
    return this.create({
      type: UINotificationType.ERROR,
      message,
      title,
      duration: 0, // Don't auto-dismiss errors
    });
  },

  /**
   * Create a simple warning notification
   * @param message - Warning message
   * @param title - Optional title
   * @returns Warning notification
   */
  createWarning(message: string, title?: string): UINotification {
    return this.create({
      type: UINotificationType.WARNING,
      message,
      title,
      duration: 4000,
    });
  },

  /**
   * Create a simple info notification
   * @param message - Info message
   * @param title - Optional title
   * @returns Info notification
   */
  createInfo(message: string, title?: string): UINotification {
    return this.create({
      type: UINotificationType.INFO,
      message,
      title,
      duration: 3000,
    });
  },

  /**
   * Check if a notification should auto-dismiss
   * @param notification - Notification to check
   * @returns True if notification should auto-dismiss
   */
  shouldAutoDismiss(notification: UINotification): boolean {
    return typeof notification.duration === 'number' && notification.duration > 0;
  },

  /**
   * Check if a notification has expired
   * @param notification - Notification to check
   * @param now - Current timestamp
   * @returns True if notification has expired
   */
  isExpired(notification: UINotification, now: number = Date.now()): boolean {
    if (!this.shouldAutoDismiss(notification)) return false;
    return now - notification.createdAt >= (notification.duration || 0);
  },

  /**
   * Update a notification with new properties
   * @param notification - Original notification
   * @param update - Properties to update
   * @returns Updated notification
   */
  update(notification: UINotification, update: UINotificationUpdate): UINotification {
    return { ...notification, ...update };
  },

  /**
   * Mark a notification as read
   * @param notification - Notification to mark as read
   * @returns Updated notification
   */
  markAsRead(notification: UINotification): UINotification {
    return this.update(notification, { read: true });
  },

  /**
   * Mark a notification as dismissed
   * @param notification - Notification to dismiss
   * @returns Updated notification
   */
  dismiss(notification: UINotification): UINotification {
    return this.update(notification, { visible: false, animationState: 'exiting' });
  },

  /**
   * Filter notifications by criteria
   * @param notifications - Notifications to filter
   * @param filter - Filter criteria
   * @returns Filtered notifications
   */
  filter(notifications: UINotification[], filter: UINotificationFilter): UINotification[] {
    return notifications.filter((notification) => {
      if (filter.type && !this.matchesType(notification.type, filter.type)) return false;
      if (typeof filter.visible === 'boolean' && notification.visible !== filter.visible)
        return false;
      if (typeof filter.read === 'boolean' && notification.read !== filter.read) return false;
      if (filter.groupId && notification.groupId !== filter.groupId) return false;
      if (filter.createdAfter && notification.createdAt < filter.createdAfter) return false;
      if (filter.createdBefore && notification.createdAt > filter.createdBefore) return false;
      if (filter.position && notification.position !== filter.position) return false;
      if (typeof filter.hasActions === 'boolean') {
        const hasActions = !!(notification.action || notification.secondaryAction);
        if (hasActions !== filter.hasActions) return false;
      }
      return true;
    });
  },

  /**
   * Sort notifications by specified criteria
   * @param notifications - Notifications to sort
   * @param sort - Sort criteria
   * @returns Sorted notifications
   */
  sort(notifications: UINotification[], sort: UINotificationSort): UINotification[] {
    return [...notifications].sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'createdAt':
          comparison = a.createdAt - b.createdAt;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'duration':
          comparison = (a.duration || 0) - (b.duration || 0);
          break;
        default:
          comparison = 0;
      }

      return sort.direction === 'desc' ? -comparison : comparison;
    });
  },

  /**
   * Group notifications by a specific property
   * @param notifications - Notifications to group
   * @param groupBy - Property to group by
   * @returns Grouped notifications
   */
  groupBy<K extends keyof UINotification>(
    notifications: UINotification[],
    groupBy: K
  ): Record<string, UINotification[]> {
    return notifications.reduce(
      (groups, notification) => {
        const key = String(notification[groupBy] || 'undefined');
        if (!groups[key]) groups[key] = [];
        groups[key].push(notification);
        return groups;
      },
      {} as Record<string, UINotification[]>
    );
  },

  /**
   * Check if notification type matches filter criteria
   * @param type - Notification type to check
   * @param filter - Type filter (single type or array)
   * @returns True if type matches filter
   */
  matchesType(
    type: UINotificationType,
    filter: UINotificationType | UINotificationType[]
  ): boolean {
    return Array.isArray(filter) ? filter.includes(type) : type === filter;
  },

  /**
   * Validate a UI notification object
   * @param notification - Object to validate
   * @returns True if valid UI notification
   */
  isValid(notification: unknown): notification is UINotification {
    return (
      typeof notification === 'object' &&
      notification !== null &&
      'id' in notification &&
      'type' in notification &&
      'message' in notification &&
      'createdAt' in notification &&
      typeof (notification as any).id === 'string' &&
      typeof (notification as any).message === 'string' &&
      typeof (notification as any).createdAt === 'number'
    );
  },
} as const;
