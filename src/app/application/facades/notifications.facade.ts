import { inject, Injectable, signal, computed } from '@angular/core';
import {
  NOTIFY_USECASE_PORT,
  DISMISS_NOTIFICATION_USECASE_PORT,
  CLEAR_NOTIFICATIONS_USECASE_PORT,
  UPDATE_NOTIFICATION_USECASE_PORT,
  GET_NOTIFICATIONS_USECASE_PORT,
  SUBSCRIBE_TO_NOTIFICATIONS_USECASE_PORT,
} from '@di/tokens';
import { Observable, EMPTY, Subject } from 'rxjs';
import { catchError, startWith, finalize } from 'rxjs/operators';

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
  GetNotificationsRequest,
} from '@application/types/notifications.types';

// Domain entities
import { Notification } from '@domain/entities/notification.entity';
import { NotificationType } from '@domain/enums/notification-type.enum';

// Shared facade types
import type { FacadeOpts } from '@application/types/facade-opts';

/**
 * Notification event types for real-time coordination
 */
export enum NotificationEventType {
  NOTIFICATION_CREATED = 'notification-created',
  NOTIFICATION_DISMISSED = 'notification-dismissed',
  NOTIFICATIONS_CLEARED = 'notifications-cleared',
  NOTIFICATION_UPDATED = 'notification-updated',
}

/**
 * Notification event data structure
 */
export interface NotificationEvent {
  type: NotificationEventType;
  notification?: Notification;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

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
  // Use Case Dependencies (Injected via DI tokens)
  private readonly notifyUC = inject(NOTIFY_USECASE_PORT);
  private readonly dismissUC = inject(DISMISS_NOTIFICATION_USECASE_PORT);
  private readonly clearUC = inject(CLEAR_NOTIFICATIONS_USECASE_PORT);
  private readonly updateUC = inject(UPDATE_NOTIFICATION_USECASE_PORT);
  private readonly getUC = inject(GET_NOTIFICATIONS_USECASE_PORT);
  private readonly subscribeUC = inject(SUBSCRIBE_TO_NOTIFICATIONS_USECASE_PORT);

  // Event emission system
  private readonly _eventSubject = new Subject<NotificationEvent>();

  // Private Reactive State
  private readonly _notifications = signal<Notification[]>([]);
  private readonly _loading = signal(false);
  private readonly _notificationError = signal<string | null>(null);
  private readonly _unreadCount = signal(0);
  private readonly _totalCount = signal(0);

  // Loading state management for concurrent operations
  private _loadingCount = 0;

  /**
   * Start loading state for an operation
   */
  private startLoading(): void {
    this._loadingCount++;
    this._loading.set(true);
  }

  /**
   * End loading state for an operation
   */
  private endLoading(): void {
    this._loadingCount--;
    if (this._loadingCount <= 0) {
      this._loadingCount = 0;
      this._loading.set(false);
    }
  }

  constructor() {
    // Auto-initialize synchronization with notification service
    this.initializeNotificationSync().catch((error) => {
      console.warn('NotificationsFacade: Failed to initialize sync in constructor', error);
    });
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
  readonly state = computed(() => ({
    notifications: this._notifications(),
    loading: this._loading(),
    error: this._notificationError(),
    unreadCount: this._unreadCount(),
    totalCount: this._totalCount(),
  }));

  /**
   * Subscribe to notification events for real-time coordination
   *
   * @returns Observable of notification events
   *
   * @since 1.0.0
   * @application NotificationsFacade
   * @example
   * ```typescript
   * notificationsFacade.onEvent().subscribe(event => {
   *   switch (event.type) {
   *     case NotificationEventType.NOTIFICATION_CREATED:
   *       console.log('New notification:', event.notification);
   *       break;
   *     case NotificationEventType.NOTIFICATION_DISMISSED:
   *       console.log('Notification dismissed:', event.notification?.id);
   *       break;
   *   }
   * });
   * ```
   */
  onEvent(): Observable<NotificationEvent> {
    return this._eventSubject.asObservable();
  }

  /**
   * Create a new notification
   *
   * @param request - Notification creation request
   * @param opts - Optional facade configuration
   * @returns Promise resolving to the notification creation result
   */
  async notify(request: NotifyRequest, opts?: FacadeOpts): Promise<NotifyResult> {
    if (!opts?.skipLoading) this.startLoading();
    this._notificationError.set(null);

    try {
      // Delegate to use case - returns NotificationId
      const notificationId = await this.notifyUC.execute({
        type: request.type,
        message: request.message,
        description: request.description,
        userId: request.userId,
      });

      // Create notification object using the factory method
      const notification = Notification.createWithId(
        {
          type: request.type,
          message: request.message,
          title: undefined,
          userId: request.userId?.toString(),
        },
        notificationId
      );

      // Emit event for real-time coordination
      this.emitEvent(NotificationEventType.NOTIFICATION_CREATED, notification);

      return notification;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create notification';
      this._notificationError.set(errorMessage);
      throw error;
    } finally {
      if (!opts?.skipLoading) this.endLoading();
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
    if (!opts?.skipLoading) this.startLoading();
    this._notificationError.set(null);

    try {
      // Get notification before dismissing for event emission
      const dismissedNotification = this._notifications().find(
        (n) => n.id === request.notificationId
      );

      // Delegate to use case - the service will handle state changes
      await this.dismissUC.execute({
        notificationId: request.notificationId,
        requesterId: request.requesterId,
      });

      // State is automatically updated via subscription, no manual update needed
      // The initializeNotificationSync() method ensures facade stays in sync

      // Emit event for real-time coordination
      this.emitEvent(NotificationEventType.NOTIFICATION_DISMISSED, dismissedNotification);

      return {
        notificationId: request.notificationId,
        success: true,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to dismiss notification';
      this._notificationError.set(errorMessage);
      throw error;
    } finally {
      if (!opts?.skipLoading) this.endLoading();
    }
  }

  /**
   * Update an existing notification
   *
   * Delegates the update operation to the use case following Clean Architecture.
   * The facade focuses on orchestration, not business logic.
   *
   * @param request - Notification update request with patch data
   * @param opts - Optional facade execution options
   * @returns Promise resolving to the update result
   *
   * @since 1.0.0
   * @application NotificationsFacade
   * @example
   * ```typescript
   * await notificationsFacade.update({
   *   notificationId: '123',
   *   patch: { isRead: true },
   *   requesterId: userId
   * });
   * ```
   */
  async update(
    request: UpdateNotificationRequest,
    opts?: FacadeOpts
  ): Promise<UpdateNotificationResult> {
    if (!opts?.skipLoading) this.startLoading();
    this._notificationError.set(null);

    try {
      // Delegate to use case - the use case handles all business logic
      await this.updateUC.execute(request);

      // Refresh state to get updated data from use case
      await this.refresh(request.requesterId);

      // Emit event for real-time coordination
      const updatedNotification = this._notifications().find(
        (n) => n.id === request.notificationId
      );
      this.emitEvent(NotificationEventType.NOTIFICATION_UPDATED, updatedNotification, {
        updatedFields: Object.keys(request.updateData || {}),
      });

      return {
        success: true,
        notificationId: request.notificationId,
        updatedFields: Object.keys(request.updateData || {}),
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update notification';
      this._notificationError.set(errorMessage);
      throw error;
    } finally {
      if (!opts?.skipLoading) this.endLoading();
    }
  }

  /**
   * Clear notifications (bulk operation)
   *
   * Delegates the clear operation to the use case following Clean Architecture.
   * The facade focuses on orchestration, not business logic.
   *
   * @param request - Clear notifications request
   * @param opts - Optional facade execution options
   * @returns Promise resolving to the clear operation result
   *
   * @since 1.0.0
   * @application NotificationsFacade
   * @example
   * ```typescript
   * await notificationsFacade.clear({ requesterId: userId });
   * ```
   */
  async clear(
    request: ClearNotificationsRequest = {},
    opts?: FacadeOpts
  ): Promise<ClearNotificationsResult> {
    if (!opts?.skipLoading) this.startLoading();
    this._notificationError.set(null);

    try {
      // Count current notifications before clearing
      const beforeCount = this._notifications().length;

      // Delegate to use case
      await this.clearUC.execute(request);

      // Update state - refresh from source to see what's left
      await this.refresh(request.requesterId);

      // Calculate cleared count
      const afterCount = this._notifications().length;
      const clearedCount = beforeCount - afterCount;

      // Emit event for real-time updates
      this.emitEvent(NotificationEventType.NOTIFICATIONS_CLEARED);

      return {
        success: true,
        clearedCount,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear notifications';
      this._notificationError.set(errorMessage);
      throw error;
    } finally {
      if (!opts?.skipLoading) this.endLoading();
    }
  }

  /**
   * Get current notifications and refresh state
   *
   * Delegates the get operation to the use case following Clean Architecture.
   * The facade focuses on orchestration, not business logic.
   *
   * @param userId - Optional user ID to filter notifications
   * @param opts - Optional facade execution options
   * @returns Promise resolving to the current notifications
   *
   * @since 1.0.0
   * @application NotificationsFacade
   * @example
   * ```typescript
   * const result = await notificationsFacade.refresh(userId);
   * console.log(`Found ${result.totalCount} notifications`);
   * ```
   */
  async refresh(userId?: number, opts?: FacadeOpts): Promise<GetNotificationsResult> {
    if (!opts?.skipLoading) this.startLoading();
    this._notificationError.set(null);

    try {
      // Create proper request object for use case
      const request: GetNotificationsRequest = {
        requesterId: userId,
      };

      // Delegate to use case
      const result = await this.getUC.execute(request);

      // Update state with the result
      this._notifications.set(result.notifications);
      this._totalCount.set(result.totalCount);
      this._unreadCount.set(result.notifications.filter((n) => !n.isRead).length);

      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to refresh notifications';
      this._notificationError.set(errorMessage);
      throw error;
    } finally {
      if (!opts?.skipLoading) this.endLoading();
    }
  }

  /**
   * Subscribe to real-time notification updates
   *
   * @param request - Subscription configuration with callback and requester ID
   * @returns Observable of notification updates
   *
   * @since 1.0.0
   * @application NotificationsFacade
   */
  subscribeToUpdates(request: SubscribeToNotificationsRequest): Observable<Notification[]> {
    const subject = new Subject<Notification[]>();
    let unsubscribeFunction: (() => void) | null = null;

    // Create a callback that emits to the subject and updates facade state
    const notificationCallback = (notifications: Notification[]) => {
      console.log('[FACADE] Callback called with notifications:', notifications.length, 'items');
      // Update facade's internal state
      this._notifications.set(notifications);
      this._totalCount.set(notifications.length);
      this._unreadCount.set(notifications.filter((n) => !n.isRead).length);
      // Emit to subject for external subscribers
      subject.next(notifications);
      console.log('[FACADE] Subject next called with:', notifications.length, 'items');
    };

    // Create the subscription request with our callback
    const subscriptionRequest: SubscribeToNotificationsRequest = {
      callback: notificationCallback,
      requesterId: request.requesterId,
    };

    // Execute the use case to establish subscription
    this.subscribeUC
      .execute(subscriptionRequest)
      .then((unsubscribe) => {
        console.log('[FACADE] Use case executed successfully, emitting current notifications');
        unsubscribeFunction = unsubscribe;
        // Emit current notifications immediately after subscription is established
        const currentNotifications = this._notifications();
        console.log('[FACADE] Current notifications:', currentNotifications.length, 'items');
        subject.next(currentNotifications);
      })
      .catch((error) => {
        console.log('[FACADE] Use case execution failed:', error);
        subject.error(error);
      });

    const pipedObservable = subject.pipe(
      startWith(this._notifications()),
      catchError((error) => {
        console.log('[FACADE] Pipe error:', error);
        this._notificationError.set(error?.message ?? 'Subscription error');
        return EMPTY;
      }),
      finalize(() => {
        console.log('[FACADE] Finalizing subscription');
        if (unsubscribeFunction) {
          unsubscribeFunction();
        }
      })
    );

    console.log('[FACADE] Returning piped observable');
    return pipedObservable;
  }

  /**
   * Convenience method to show success notification
   *
   * @param message - Success message to display
   * @param description - Optional description for the notification
   * @param opts - Optional facade execution options
   * @returns Promise resolving to the notification creation result
   *
   * @since 1.0.0
   * @application NotificationsFacade
   */
  async success(message: string, description?: string, opts?: FacadeOpts): Promise<NotifyResult> {
    return this.notify(
      {
        type: NotificationType.SUCCESS,
        message,
        description,
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
        type: NotificationType.ERROR,
        message,
        description,
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
        type: NotificationType.WARNING,
        message,
        description,
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
        type: NotificationType.INFO,
        message,
        description,
      },
      opts
    );
  }

  /**
   * Mark all notifications as read
   *
   * This method delegates the bulk update operation to a dedicated use case
   * following Clean Architecture principles. The facade only orchestrates
   * the operation without containing business logic.
   *
   * @param userId - Optional user ID to filter notifications
   * @param opts - Optional facade execution options
   * @returns Promise that resolves when bulk update is complete
   *
   * @since 1.0.0
   * @application NotificationsFacade
   * @example
   * ```typescript
   * await notificationsFacade.markAllAsRead(userId);
   * ```
   */
  async markAllAsRead(userId?: number, opts?: FacadeOpts): Promise<void> {
    const skipLoading = opts?.skipLoading ?? false;
    if (!skipLoading) this.startLoading();
    this._notificationError.set(null);

    try {
      // TODO: Create dedicated MarkAllAsReadUseCase to handle this logic
      // For now, delegate to existing update method but this should be refactored
      const unreadNotifications = this._notifications().filter((n) => !n.isRead);

      for (const notification of unreadNotifications) {
        await this.update(
          {
            notificationId: notification.id,
            updateData: { isRead: true },
            requesterId: userId,
          },
          { skipLoading: true }
        );
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark all as read';
      this._notificationError.set(errorMessage);
      throw error;
    } finally {
      if (!skipLoading) this.endLoading();
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
    this._loadingCount = 0;
    this._loading.set(false);
    this._notificationError.set(null);
    this._unreadCount.set(0);
    this._totalCount.set(0);
  }

  /**
   * Complete the event system and clean up resources
   *
   * @description
   * Completes the event Subject to notify all subscribers that no more events
   * will be emitted. This should be called when the facade is being destroyed
   * or when you want to stop all event emissions.
   *
   * @since 1.0.0
   * @application NotificationsFacade
   */
  complete(): void {
    if (!this._eventSubject.closed) {
      this._eventSubject.complete();
    }
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
  private async initializeNotificationSync(): Promise<void> {
    try {
      // Subscribe to notification changes from the service layer
      const callback = (notifications: Notification[]) => {
        // Sync facade state with service state
        this._notifications.set(notifications);
        this._totalCount.set(notifications.length);
        this._unreadCount.set(notifications.filter((n) => !n.isRead).length);
      };

      // Use the subscribe use case to establish the connection
      const request: SubscribeToNotificationsRequest = {
        callback,
      };
      await this.subscribeUC.execute(request);
    } catch (error) {
      // Log initialization error but don't fail the facade construction
      console.warn('NotificationsFacade: Failed to initialize sync with service layer', error);
      this._notificationError.set('Failed to sync with notification service');
    }
  }

  /**
   * Emit notification event for real-time coordination
   *
   * @description
   * Emits events to notify other parts of the application about notification changes.
   * This enables cross-component coordination and real-time UI updates.
   *
   * @param type - The type of notification event
   * @param notification - Optional notification data associated with the event
   * @param metadata - Optional additional metadata for the event
   *
   * @since 1.0.0
   * @application NotificationsFacade
   * @private
   */
  private emitEvent(
    type: NotificationEventType,
    notification?: Notification,
    metadata?: Record<string, unknown>
  ): void {
    try {
      const event: NotificationEvent = {
        type,
        notification,
        timestamp: new Date(),
        metadata,
      };

      // Emit the event to all subscribers
      this._eventSubject.next(event);

      // Log the event for debugging (only in development)
      if (typeof window !== 'undefined' && (window as { ngDevMode?: boolean }).ngDevMode) {
        console.log(`[NotificationsFacade] Event emitted:`, {
          type: event.type,
          notificationId: notification?.id,
          timestamp: event.timestamp,
        });
      }
    } catch (error) {
      // Log emission errors but don't fail the operation
      console.warn('[NotificationsFacade] Failed to emit event:', {
        type,
        notificationId: notification?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
