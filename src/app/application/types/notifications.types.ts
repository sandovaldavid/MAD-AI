/**
 * Notification Application Types
 *
 * @description
 * Minimal type definitions for Application Layer coordination.
 * These types provide simple interfaces for notification-related use case orchestration.
 *
 * @responsibilities
 * - Define minimal request interfaces for notification operations
 * - Provide type safety for notification coordination
 * - Keep complexity in appropriate layers (Domain/Infrastructure)
 *
 * @architecture
 * - Application layer: Simple coordination types only
 * - Domain layer: Business logic and contracts
 * - Infrastructure layer: DTOs and technical implementations
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */

import type {
  Notification,
  NotificationId,
  NewNotification,
} from '@domain/entities/notification.entity';
import { NotificationType } from '@domain/enums/notification-type.enum';

// ============================================================================
// Simple Request Interfaces (Application Layer Coordination)
// ============================================================================

/**
 * Simple request to create a notification
 */
export interface NotifyRequest {
  type: NotificationType;
  message: string;
  description?: string;
  userId?: number;
}

/**
 * Simple request to dismiss a notification
 */
export interface DismissNotificationRequest {
  notificationId: NotificationId;
  requesterId?: number;
}

/**
 * Simple request to clear all notifications
 */
export interface ClearNotificationsRequest {
  requesterId?: number;
}

/**
 * Simple request to update a notification
 */
export interface UpdateNotificationRequest {
  notificationId: NotificationId;
  patch: Partial<Notification>;
  requesterId?: number;
}

/**
 * Simple request to get notifications with optional filters
 */
export interface GetNotificationsRequest {
  requesterId?: number;
  filters?: {
    type?: NotificationType;
    isRead?: boolean;
    limit?: number;
  };
}

/**
 * Simple request to subscribe to notifications
 */
export interface SubscribeToNotificationsRequest {
  callback: (notifications: Notification[]) => void;
  requesterId?: number;
}

// ============================================================================
// Minimal Result Types (Domain entities returned directly)
// ============================================================================

/**
 * Notification creation result - returns domain entity directly
 */
export type NotifyResult = Notification;

/**
 * Notification dismissal result - simple confirmation
 */
export interface DismissNotificationResult {
  success: boolean;
  notificationId: NotificationId;
}

/**
 * Get notifications result - returns domain entities directly
 */
export interface GetNotificationsResult {
  notifications: Notification[];
  totalCount: number;
}

/**
 * Clear notifications result with statistics
 */
export interface ClearNotificationsResult {
  success: boolean;
  clearedCount: number;
}

/**
 * Update notification result with details
 */
export interface UpdateNotificationResult {
  success: boolean;
  notificationId: NotificationId;
  updatedFields: string[];
}
