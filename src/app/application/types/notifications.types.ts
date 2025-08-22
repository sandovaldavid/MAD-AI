/**
 * Notification Types - Application Layer
 * 
 * @description
 * Type definitions for notification operations at the application layer.
 * These types define the contract between the presentation layer and the 
 * notification facade for all notification-related operations.
 * 
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */

import type { 
    Notification, 
    NotificationId, 
    NotificationType, 
    NewNotification 
} from '@domain/entities/notification.entity';

/**
 * Request to create a new notification
 */
export interface NotifyRequest {
    /** Type of notification (success, error, warning, info) */
    type: NotificationType;
    /** Main notification message */
    message: string;
    /** Optional detailed description */
    description?: string;
    /** Auto-dismiss timeout in milliseconds (0 = no auto-dismiss) */
    duration?: number;
    /** User ID this notification is for (if user-specific) */
    userId?: number;
    /** Additional metadata for the notification */
    metadata?: Record<string, any>;
}

/**
 * Request to dismiss a specific notification
 */
export interface DismissNotificationRequest {
    /** Unique identifier of the notification to dismiss */
    notificationId: NotificationId;
    /** ID of the user dismissing the notification */
    userId?: number;
}

/**
 * Request to update an existing notification
 */
export interface UpdateNotificationRequest {
    /** Unique identifier of the notification to update */
    notificationId: NotificationId;
    /** New message (optional) */
    message?: string;
    /** New description (optional) */
    description?: string;
    /** New duration (optional) */
    duration?: number;
    /** Mark as read/unread (optional) */
    isRead?: boolean;
    /** ID of the user making the update */
    userId?: number;
}

/**
 * Request to clear notifications (batch operation)
 */
export interface ClearNotificationsRequest {
    /** Clear all notifications for specific user (if provided) */
    userId?: number;
    /** Clear only notifications of specific types */
    types?: NotificationType[];
    /** Clear only read/unread notifications */
    onlyRead?: boolean;
}

/**
 * Request to subscribe to notification updates
 */
export interface SubscribeToNotificationsRequest {
    /** User ID to filter notifications (if user-specific) */
    userId?: number;
    /** Types of notifications to listen for */
    types?: NotificationType[];
}

/**
 * Result of a notify operation
 */
export interface NotifyResult {
    /** The created notification */
    notification: Notification;
    /** Success status */
    success: boolean;
    /** Any warning messages */
    warnings?: string[];
}

/**
 * Result of a dismiss notification operation
 */
export interface DismissNotificationResult {
    /** ID of the dismissed notification */
    notificationId: NotificationId;
    /** Success status */
    success: boolean;
    /** Confirmation message */
    message?: string;
}

/**
 * Result of an update notification operation
 */
export interface UpdateNotificationResult {
    /** The updated notification */
    notification: Notification;
    /** Success status */
    success: boolean;
    /** Any warning messages */
    warnings?: string[];
}

/**
 * Result of a clear notifications operation
 */
export interface ClearNotificationsResult {
    /** Number of notifications cleared */
    clearedCount: number;
    /** Success status */
    success: boolean;
    /** Summary message */
    message?: string;
}

/**
 * Result of getting notifications
 */
export interface GetNotificationsResult {
    /** Array of current notifications */
    notifications: Notification[];
    /** Total count (may differ from array length if paginated) */
    totalCount: number;
    /** Unread count */
    unreadCount: number;
}

/**
 * Notification state for reactive UI binding
 */
export interface NotificationState {
    /** Current notifications */
    notifications: Notification[];
    /** Loading state for any notification operation */
    loading: boolean;
    /** Error state */
    error: string | null;
    /** Unread count */
    unreadCount: number;
    /** Total count */
    totalCount: number;
}

/**
 * Notification event types for real-time updates
 */
export type NotificationEventType = 
    | 'notification-created'
    | 'notification-updated' 
    | 'notification-dismissed'
    | 'notifications-cleared';

/**
 * Notification event payload
 */
export interface NotificationEvent {
    /** Type of event */
    type: NotificationEventType;
    /** Associated notification (if applicable) */
    notification?: Notification;
    /** Additional event data */
    metadata?: Record<string, any>;
    /** Timestamp of the event */
    timestamp: Date;
}
