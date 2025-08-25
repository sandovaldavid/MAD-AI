import { inject, Injectable, signal, computed } from '@angular/core';
import { Observable, BehaviorSubject, EMPTY } from 'rxjs';
import { catchError, startWith } from 'rxjs/operators';

// Use Cases imports
import { Notify } from '../use-cases/notifications/notify.usecase';
import { DismissNotification } from '../use-cases/notifications/dismiss-notification.usecase';
import { ClearNotifications } from '../use-cases/notifications/clear-notifications.usecase';
import { UpdateNotification } from '../use-cases/notifications/update-notification.usecase';
import { GetNotifications } from '../use-cases/notifications/get-notifications.usecase';
import { SubscribeToNotifications } from '../use-cases/notifications/subscribe-to-notifications.usecase';

// Application types
import type {
  NotifyRequest,
  DismissNotificationRequest,
  UpdateNotificationRequest,
  ClearNotificationsRequest,
  SubscribeToNotificationsRequest,
  NotifyResult,
  DismissNotificationResult,
  UpdateNotificationResult,
  ClearNotificationsResult,
  GetNotificationsResult,
  NotificationState,
  NotificationEvent,
  NotificationEventType,
} from '@application/types/notifications.types';

// Domain entities
import type { Notification, NotificationType } from '@domain/entities/notification.entity';

// Shared facade types
import type { FacadeOpts } from '@application/types/facade-opts';

/**
 * Notifications Facade - Pure Orchestrator
 *
 * @description
 * Pure orchestrator that delegates all business logic to robust use cases.
 * This facade focuses solely on:
 * - Coordinating between notification use cases
 * - Managing reactive application state (loading, notifications, errors)
 * - Providing a clean API for the presentation layer
 * - Real-time notification subscription management
 * - Cross-facade coordination for UI feedback
 *
 * All error handling, validation, and business logic is delegated to use cases.
 *
 * @responsibilities
 * - State management for notifications UI
 * - Use case orchestration and coordination
 * - Real-time notification subscription management
 * - Cross-facade integration for UI feedback
 *
 * @architecture
 * - No direct business logic or error handling
 * - Uses robust use cases for all operations
 * - Returns use case results directly to caller
 * - Manages reactive state for UI binding
 * - Provides real-time updates through observables
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class NotificationsFacade {
  // Use Case Dependencies
  private readonly notifyUC = inject(Notify);
  private readonly dismissUC = inject(DismissNotification);
  private readonly clearUC = inject(ClearNotifications);
  private readonly updateUC = inject(UpdateNotification);
  private readonly getUC = inject(GetNotifications);
  private readonly subscribeUC = inject(SubscribeToNotifications);

  // Private Reactive State
  private readonly _notifications = signal<Notification[]>([]);
  private readonly _loading = signal(false);
  private readonly _notificationError = signal<string | null>(null);
  private readonly _unreadCount = signal(0);
  private readonly _totalCount = signal(0);

  // Real-time subscription management
  private notificationSubject = new BehaviorSubject<NotificationEvent | null>(null);
  private subscription: Observable<Notification[]> | null = null;

  constructor() {
    // Auto-initialize synchronization with notification service
    this.initializeNotificationSync();
  }

  // Public Reactive State (Computed - Read-only)
  readonly notifications = computed(() => this._notifications());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._notificationError());
  readonly unreadCount = computed(() => this._unreadCount());
  readonly totalCount = computed(() => this._totalCount());
  readonly hasNotifications = computed(() => this._notifications().length > 0);
  readonly hasUnread = computed(() => this._unreadCount() > 0);

  // Combined state for easy UI binding
  readonly state = computed(
    (): NotificationState => ({
      notifications: this._notifications(),
      loading: this._loading(),
      error: this._notificationError(),
      unreadCount: this._unreadCount(),
      totalCount: this._totalCount(),
    })
  );

  // Real-time notification events stream
  readonly events$ = this.notificationSubject.asObservable();

  /**
   * Create a new notification
   *
   * @param request - Notification creation request
   * @param opts - Optional facade configuration
   * @returns Promise resolving to the notification creation result
   */
  async notify(request: NotifyRequest, opts?: FacadeOpts): Promise<NotifyResult> {
    if (!opts?.skipLoading) this._loading.set(true);
    this._notificationError.set(null);

    try {
      // Delegate to use case - returns NotificationId
      const notificationId = await this.notifyUC.execute({
        type: request.type,
        message: request.message,
        title: request.description, // Map description to title
        userId: request.userId?.toString(), // Convert number to string
        duration: request.duration,
        metadata: request.metadata,
      });

      // State is automatically updated via subscription, no manual refresh needed
      // Find the notification in current state for event emission
      const notification = this._notifications().find((n) => n.id === notificationId);

      if (notification) {
        // Emit event for real-time coordination
        this.emitEvent('notification-created', notification);

        return {
          notification,
          success: true,
        };
      } else {
        throw new Error('Failed to retrieve created notification');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create notification';
      this._notificationError.set(errorMessage);
      throw error;
    } finally {
      if (!opts?.skipLoading) this._loading.set(false);
    }
  }

  /**
   * Dismiss a specific notification
   *
   * @param request - Notification dismissal request
   * @param opts - Optional facade configuration
   * @returns Promise resolving to the dismissal result
   */
  async dismiss(
    request: DismissNotificationRequest,
    opts?: FacadeOpts
  ): Promise<DismissNotificationResult> {
    if (!opts?.skipLoading) this._loading.set(true);
    this._notificationError.set(null);

    try {
      // Get notification before dismissing for event emission
      const dismissedNotification = this._notifications().find(
        (n) => n.id === request.notificationId
      );

      // Delegate to use case - the service will handle state changes
      await this.dismissUC.execute(request.notificationId, request.userId);

      // State is automatically updated via subscription, no manual update needed
      // The initializeNotificationSync() method ensures facade stays in sync

      // Emit event for real-time coordination
      this.emitEvent('notification-dismissed', dismissedNotification);

      return {
        notificationId: request.notificationId,
        success: true,
        message: 'Notification dismissed successfully',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to dismiss notification';
      this._notificationError.set(errorMessage);
      throw error;
    } finally {
      if (!opts?.skipLoading) this._loading.set(false);
    }
  }

  /**
   * Update an existing notification
   *
   * @param request - Notification update request
   * @param opts - Optional facade configuration
   * @returns Promise resolving to the update result
   */
  async update(
    request: UpdateNotificationRequest,
    opts?: FacadeOpts
  ): Promise<UpdateNotificationResult> {
    if (!opts?.skipLoading) this._loading.set(true);
    this._notificationError.set(null);

    try {
      // Get notification before updating for state tracking
      const existingNotification = this._notifications().find(
        (n) => n.id === request.notificationId
      );
      const wasRead = existingNotification?.isRead;

      // Delegate to use case - returns void, creamos el objeto patch con tipo propio
      type NotificationPatch = { message?: string; isRead?: boolean };
      const updateData: NotificationPatch = {};
      if (request.message !== undefined) updateData.message = request.message;
      if (request.isRead !== undefined) updateData.isRead = request.isRead;
      // Note: description and duration might not be supported by the entity

      await this.updateUC.execute(request.notificationId, updateData, request.userId);

      // Refresh to get updated notification
      await this.refresh(request.userId);
      const updatedNotification = this._notifications().find(
        (n) => n.id === request.notificationId
      );

      if (!updatedNotification) {
        throw new Error('Failed to retrieve updated notification');
      }

      // Update unread count if read status changed
      if (wasRead !== updatedNotification.isRead) {
        if (updatedNotification.isRead && !wasRead) {
          this._unreadCount.update((count) => Math.max(0, count - 1));
        } else if (!updatedNotification.isRead && wasRead) {
          this._unreadCount.update((count) => count + 1);
        }
      }

      // Emit event for real-time updates
      this.emitEvent('notification-updated', updatedNotification);

      return {
        notification: updatedNotification,
        success: true,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update notification';
      this._notificationError.set(errorMessage);
      throw error;
    } finally {
      if (!opts?.skipLoading) this._loading.set(false);
    }
  }

  /**
   * Clear notifications (bulk operation)
   *
   * @param request - Clear notifications request
   * @param opts - Optional facade configuration
   * @returns Promise resolving to the clear operation result
   */
  async clear(
    request: ClearNotificationsRequest = {},
    opts?: FacadeOpts
  ): Promise<ClearNotificationsResult> {
    if (!opts?.skipLoading) this._loading.set(true);
    this._notificationError.set(null);

    try {
      // Count current notifications before clearing
      const beforeCount = this._notifications().length;

      // Delegate to use case (only takes requesterId)
      await this.clearUC.execute(request.userId);

      // Update state - refresh from source to see what's left
      await this.refresh(request.userId);

      // Calculate cleared count
      const afterCount = this._notifications().length;
      const clearedCount = beforeCount - afterCount;

      // Emit event for real-time updates
      this.emitEvent('notifications-cleared');

      return {
        clearedCount,
        success: true,
        message: `${clearedCount} notifications cleared successfully`,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear notifications';
      this._notificationError.set(errorMessage);
      throw error;
    } finally {
      if (!opts?.skipLoading) this._loading.set(false);
    }
  }

  /**
   * Get current notifications and refresh state
   *
   * @param userId - Optional user ID to filter notifications
   * @param opts - Optional facade configuration
   * @returns Promise resolving to the current notifications
   */
  async refresh(userId?: number, opts?: FacadeOpts): Promise<GetNotificationsResult> {
    if (!opts?.skipLoading) this._loading.set(true);
    this._notificationError.set(null);

    try {
      // Delegate to use case
      const notifications = await this.getUC.execute(userId);

      // Update state
      this._notifications.set(notifications);
      this._totalCount.set(notifications.length);
      this._unreadCount.set(notifications.filter((n) => !n.isRead).length);

      return {
        notifications,
        totalCount: notifications.length,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to refresh notifications';
      this._notificationError.set(errorMessage);
      throw error;
    } finally {
      if (!opts?.skipLoading) this._loading.set(false);
    }
  }

  /**
   * Subscribe to real-time notification updates
   *
   * @param request - Subscription configuration
   * @returns Observable of notification updates
   */
  subscribeToUpdates(request: SubscribeToNotificationsRequest = {}): Observable<Notification[]> {
    try {
      // Create new observable from subscription use case
      const observable = new Observable<Notification[]>((subscriber) => {
        // Create callback for use case
        const callback = (notifications: Notification[]) => {
          // Update internal state when real-time updates arrive
          this._notifications.set(notifications);
          this._totalCount.set(notifications.length);
          this._unreadCount.set(notifications.filter((n) => !n.isRead).length);

          // Emit to observable subscribers
          subscriber.next(notifications);
        };

        // Subscribe through use case
        const unsubscribe = this.subscribeUC.execute(callback, request.userId);

        // Return cleanup function
        return () => {
          if (unsubscribe) {
            unsubscribe();
          }
        };
      });

      // Cache the subscription
      this.subscription = observable.pipe(
        catchError((error) => {
          this._notificationError.set(error?.message ?? 'Subscription error');
          return EMPTY;
        }),
        startWith(this._notifications()) // Start with current state
      );

      return this.subscription;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to subscribe to notifications';
      this._notificationError.set(errorMessage);
      return EMPTY;
    }
  }

  /**
   * Convenience method to show success notification
   */
  async success(message: string, description?: string, opts?: FacadeOpts): Promise<NotifyResult> {
    return this.notify(
      {
        type: 'success',
        message,
        description,
        duration: 5000, // Auto-dismiss after 5 seconds
      },
      opts
    );
  }

  /**
   * Convenience method to show error notification
   */
  async notificationError(
    message: string,
    description?: string,
    opts?: FacadeOpts
  ): Promise<NotifyResult> {
    return this.notify(
      {
        type: 'error',
        message,
        description,
        // Don't specify duration to prevent auto-dismiss for errors
      },
      opts
    );
  }

  /**
   * Convenience method to show warning notification
   */
  async warning(message: string, description?: string, opts?: FacadeOpts): Promise<NotifyResult> {
    return this.notify(
      {
        type: 'warning',
        message,
        description,
        duration: 8000, // Auto-dismiss after 8 seconds
      },
      opts
    );
  }

  /**
   * Convenience method to show info notification
   */
  async info(message: string, description?: string, opts?: FacadeOpts): Promise<NotifyResult> {
    return this.notify(
      {
        type: 'info',
        message,
        description,
        duration: 5000, // Auto-dismiss after 5 seconds
      },
      opts
    );
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId?: number): Promise<void> {
    const unreadNotifications = this._notifications().filter((n) => !n.isRead);

    for (const notification of unreadNotifications) {
      await this.update(
        {
          notificationId: notification.id,
          isRead: true,
          userId,
        },
        { skipLoading: true }
      );
    }
  }

  /**
   * Get notifications by type
   */
  getByType(type: NotificationType): Notification[] {
    return this._notifications().filter((n) => n.type === type);
  }

  /**
   * Get unread notifications
   */
  getUnread(): Notification[] {
    return this._notifications().filter((n) => !n.isRead);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._notificationError.set(null);
  }

  /**
   * Reset facade state (useful for testing or user logout)
   */
  reset(): void {
    this._notifications.set([]);
    this._loading.set(false);
    this._notificationError.set(null);
    this._unreadCount.set(0);
    this._totalCount.set(0);
    this.subscription = null;
  }

  // Private helper methods

  /**
   * Initialize notification synchronization with the service layer
   *
   * @description
   * Establishes a subscription to the notification service to keep the facade
   * state synchronized with the domain layer. This ensures that the facade
   * reflects the current state of notifications managed by the service.
   */
  private initializeNotificationSync(): void {
    try {
      // Subscribe to notification changes from the service layer
      const callback = (notifications: Notification[]) => {
        // Sync facade state with service state
        this._notifications.set(notifications);
        this._totalCount.set(notifications.length);
        this._unreadCount.set(notifications.filter((n) => !n.isRead).length);
      };

      // Use the subscribe use case to establish the connection
      this.subscribeUC.execute(callback);
    } catch (error) {
      // Log initialization error but don't fail the facade construction
      console.warn('NotificationsFacade: Failed to initialize sync with service layer', error);
      this._notificationError.set('Failed to sync with notification service');
    }
  }

  /**
   * Emit notification event for real-time coordination
   */
  private emitEvent(type: NotificationEventType, notification?: Notification): void {
    const event: NotificationEvent = {
      type,
      notification,
      timestamp: new Date(),
    };
    this.notificationSubject.next(event);
  }
}
