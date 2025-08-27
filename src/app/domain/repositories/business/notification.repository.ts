import {
  NewNotification,
  Notification,
  NotificationId,
} from '@domain/entities/notification.entity';

/**
 * @fileoverview Domain repository interface for notification management operations.
 *
 * @description Defines comprehensive contracts for notification lifecycle management including
 * real-time subscription patterns, CRUD operations, and state management. This interface follows
 * Domain-Driven Design principles and provides reactive patterns for notification systems.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @example Basic Notification Usage
 * ```typescript
 * // In a use case
 * @Injectable({ providedIn: 'root' })
 * export class NotificationUseCase {
 *   constructor(@Inject(NOTIFICATION_REPOSITORY) private notificationRepo: NotificationPort) {}
 *
 *   async showSuccess(message: string): Promise<void> {
 *     this.notificationRepo.push({
 *       type: 'success',
 *       message,
 *       duration: 3000
 *     });
 *   }
 * }
 * ```
 *
 * @example Real-time Subscription
 * ```typescript
 * // Subscribe to notification changes
 * const unsubscribe = notificationRepository.onChange((notifications) => {
 *   console.log(`${notifications.length} notifications active`);
 *   this.updateUI(notifications);
 * });
 *
 * // Cleanup when component is destroyed
 * onDestroy(() => unsubscribe());
 * ```
 *
 * @see {@link Notification} - Notification domain entity
 * @see {@link NewNotification} - Notification creation specification
 * @see {@link NotificationId} - Notification identifier type
 */

/**
 * Repository port interface for notification management operations.
 *
 * @description Provides comprehensive contracts for notification lifecycle management
 * with reactive patterns for real-time UI updates. This port follows the hexagonal
 * architecture pattern and supports both subscription-based and imperative operations.
 *
 * @interface NotificationPort
 *
 * @businessRules
 * - Notifications must have unique identifiers within the system
 * - Auto-dismissal should be supported for temporary notifications
 * - Notification ordering should be maintained (FIFO by default)
 * - Duplicate notifications should be prevented or merged
 * - Persistent notifications must survive page reloads when appropriate
 *
 * @performanceConsiderations
 * - Notification updates should be batched to prevent UI thrashing
 * - Old notifications should be automatically cleaned up to prevent memory leaks
 * - Subscription notifications should be debounced for high-frequency updates
 * - Large notification payloads should be lazy-loaded when displayed
 *
 * @reactivePatterns
 * - Observer pattern for real-time UI updates
 * - Command pattern for notification mutations
 * - Strategy pattern for different notification behaviors
 * - Chain of responsibility for notification processing
 */
export interface NotificationPort {
  /**
   * Subscribes to notification changes with real-time updates.
   *
   * @description Establishes a reactive subscription to notification state changes.
   * The provided callback will be invoked whenever the notification list changes,
   * enabling real-time UI updates and reactive programming patterns.
   *
   * @param sub - Callback function that receives the current notification list
   * @returns Function to unsubscribe from changes
   *
   * @throws {ValidationError} When subscription callback is invalid
   * @throws {SubscriptionError} When subscription cannot be established
   *
   * @businessRules
   * - Subscription callbacks must be called with current state immediately
   * - Multiple subscriptions should be supported concurrently
   * - Unsubscribe function must be idempotent
   * - Subscription should survive notification state resets
   *
   * @example Basic Subscription
   * ```typescript
   * // Subscribe to all notification changes
   * const unsubscribe = notificationRepository.onChange((notifications) => {
   *   console.log(`Current notifications: ${notifications.length}`);
   *
   *   notifications.forEach(notification => {
   *     console.log(`- ${notification.type}: ${notification.message}`);
   *   });
   * });
   *
   * // Cleanup subscription
   * setTimeout(() => {
   *   unsubscribe();
   * }, 30000);
   * ```
   *
   * @example Filtered Subscription
   * ```typescript
   * // Subscribe with filtering
   * const unsubscribe = notificationRepository.onChange((notifications) => {
   *   // Filter for error notifications only
   *   const errors = notifications.filter(n => n.type === 'error');
   *
   *   if (errors.length > 0) {
   *     this.showErrorIndicator(errors.length);
   *   } else {
   *     this.hideErrorIndicator();
   *   }
   * });
   * ```
   *
   * @example Component Integration
   * ```typescript
   * @Component({...})
   * export class NotificationComponent implements OnInit, OnDestroy {
   *   notifications: Notification[] = [];
   *   private unsubscribe?: () => void;
   *
   *   ngOnInit() {
   *     this.unsubscribe = this.notificationRepo.onChange((notifications) => {
   *       this.notifications = notifications;
   *       this.cdr.detectChanges(); // Trigger change detection
   *     });
   *   }
   *
   *   ngOnDestroy() {
   *     this.unsubscribe?.();
   *   }
   * }
   * ```
   */
  onChange(sub: (list: Notification[]) => void): () => void;

  /**
   * Retrieves the current snapshot of all notifications.
   *
   * @description Returns the current state of all active notifications without
   * establishing a subscription. This is useful for initial renders or one-time
   * state queries where reactive updates are not needed.
   *
   * @returns Array of current Notification entities
   *
   * @businessRules
   * - Should return notifications in display order (newest first by default)
   * - Must return a immutable snapshot to prevent external mutations
   * - Should include all active notifications regardless of type
   * - Must be consistent with subscription callback data
   *
   * @example Initial State Loading
   * ```typescript
   * // Get current state for initial render
   * const currentNotifications = notificationRepository.snapshot();
   * console.log(`Found ${currentNotifications.length} existing notifications`);
   *
   * // Use for initial state
   * this.notifications = currentNotifications;
   *
   * // Then subscribe for updates
   * this.unsubscribe = notificationRepository.onChange((notifications) => {
   *   this.notifications = notifications;
   * });
   * ```
   *
   * @example State Validation
   * ```typescript
   * // Validate notification state
   * function validateNotificationState(): boolean {
   *   const notifications = notificationRepository.snapshot();
   *
   *   // Check for invalid states
   *   const hasInvalidDurations = notifications.some(n =>
   *     n.duration !== null && n.duration <= 0
   *   );
   *
   *   const hasDuplicateIds = new Set(notifications.map(n => n.id)).size !== notifications.length;
   *
   *   return !hasInvalidDurations && !hasDuplicateIds;
   * }
   * ```
   *
   * @example Notification Analytics
   * ```typescript
   * // Analyze current notification distribution
   * const notifications = notificationRepository.snapshot();
   * const analytics = {
   *   total: notifications.length,
   *   byType: notifications.reduce((acc, n) => {
   *     acc[n.type] = (acc[n.type] || 0) + 1;
   *     return acc;
   *   }, {} as Record<string, number>),
   *   unread: notifications.filter(n => !n.isRead).length,
   *   persistent: notifications.filter(n => n.duration === null).length
   * };
   * ```
   */
  snapshot(): Notification[];

  /**
   * Creates and adds a new notification to the system.
   *
   * @description Creates a new notification with the provided specification
   * and adds it to the active notification list. The notification will be
   * assigned a unique identifier and appropriate timestamps.
   *
   * @param n - New notification specification
   * @returns Unique identifier of the created notification
   *
   * @throws {ValidationError} When notification data is invalid
   * @throws {DuplicateError} When notification already exists (if duplicate prevention enabled)
   * @throws {QuotaExceededError} When notification limit is reached
   *
   * @businessRules
   * - Must assign unique identifier to new notifications
   * - Should validate notification data before creation
   * - Must set appropriate timestamps (created, updated)
   * - Should apply default values for optional fields
   * - Must trigger subscription callbacks after successful creation
   * - Should implement auto-dismissal for timed notifications
   *
   * @example Success Notification
   * ```typescript
   * // Create success notification
   * const successId = notificationRepository.push({
   *   type: 'success',
   *   message: 'Operation completed successfully',
   *   title: 'Success',
   *   duration: 3000, // Auto-dismiss after 3 seconds
   *   actions: [
   *     { label: 'View Details', action: 'view-details' }
   *   ]
   * });
   *
   * console.log(`Created notification with ID: ${successId}`);
   * ```
   *
   * @example Error Notification
   * ```typescript
   * // Create persistent error notification
   * const errorId = notificationRepository.push({
   *   type: 'error',
   *   message: 'Failed to save changes. Please try again.',
   *   title: 'Save Error',
   *   duration: null, // Persistent until dismissed
   *   severity: 'high',
   *   actions: [
   *     { label: 'Retry', action: 'retry-save' },
   *     { label: 'Discard', action: 'discard-changes' }
   *   ]
   * });
   * ```
   *
   * @example Batch Notification Creation
   * ```typescript
   * // Create multiple notifications efficiently
   * const notificationSpecs = [
   *   { type: 'info', message: 'Update 1 completed' },
   *   { type: 'info', message: 'Update 2 completed' },
   *   { type: 'success', message: 'All updates completed' }
   * ];
   *
   * const createdIds = notificationSpecs.map(spec =>
   *   notificationRepository.push(spec)
   * );
   * ```
   */
  push(n: NewNotification): NotificationId;

  /**
   * Updates an existing notification with partial data.
   *
   * @description Applies partial updates to an existing notification.
   * Only provided fields are updated, leaving other fields unchanged.
   * This operation maintains notification identity and preserves timestamps.
   *
   * @param id - Unique identifier of notification to update
   * @param patch - Partial update data
   *
   * @throws {NotificationNotFoundError} When notification with specified ID doesn't exist
   * @throws {ValidationError} When update data is invalid
   * @throws {ImmutableFieldError} When attempting to update immutable fields
   *
   * @businessRules
   * - Must validate notification exists before updating
   * - Should preserve immutable fields (id, createdAt)
   * - Must update timestamps appropriately (updatedAt)
   * - Should validate patch data before applying
   * - Must trigger subscription callbacks after successful update
   * - Should handle auto-dismissal timer changes
   *
   * @example Message Update
   * ```typescript
   * // Update notification message
   * try {
   *   notificationRepository.update(notificationId, {
   *     message: 'Updated: Operation completed with warnings',
   *     type: 'warning'
   *   });
   *   console.log('Notification updated successfully');
   * } catch (error) {
   *   if (error instanceof NotificationNotFoundError) {
   *     console.error('Notification not found');
   *   }
   * }
   * ```
   *
   * @example Progress Update
   * ```typescript
   * // Update progress notification
   * const progressId = notificationRepository.push({
   *   type: 'info',
   *   message: 'Processing...',
   *   progress: { current: 0, total: 100 }
   * });
   *
   * // Update progress periodically
   * setInterval(() => {
   *   const progress = getUploadProgress();
   *   notificationRepository.update(progressId, {
   *     message: `Processing... ${progress.current}/${progress.total}`,
   *     progress
   *   });
   * }, 1000);
   * ```
   *
   * @example Status Change
   * ```typescript
   * // Change notification from loading to success
   * notificationRepository.update(loadingNotificationId, {
   *   type: 'success',
   *   message: 'Processing completed successfully',
   *   duration: 3000, // Now auto-dismiss
   *   actions: [
   *     { label: 'View Results', action: 'view-results' }
   *   ]
   * });
   * ```
   */
  update(id: NotificationId, patch: Partial<Notification>): void;

  /**
   * Dismisses and removes a specific notification.
   *
   * @description Removes a notification from the active list by its unique
   * identifier. This operation is irreversible and should trigger cleanup
   * of associated resources and timers.
   *
   * @param id - Unique identifier of notification to dismiss
   *
   * @throws {NotificationNotFoundError} When notification with specified ID doesn't exist
   *
   * @businessRules
   * - Must validate notification exists before dismissal
   * - Should clean up associated timers and resources
   * - Must trigger subscription callbacks after successful dismissal
   * - Should log dismissal events for analytics if configured
   * - Must be idempotent (safe to call multiple times)
   *
   * @example Manual Dismissal
   * ```typescript
   * // Dismiss specific notification
   * try {
   *   notificationRepository.dismiss(notificationId);
   *   console.log('Notification dismissed successfully');
   * } catch (error) {
   *   if (error instanceof NotificationNotFoundError) {
   *     console.warn('Notification already dismissed');
   *   }
   * }
   * ```
   *
   * @example Conditional Dismissal
   * ```typescript
   * // Dismiss notifications based on criteria
   * const notifications = notificationRepository.snapshot();
   * const oldNotifications = notifications.filter(n =>
   *   Date.now() - n.createdAt.getTime() > 300000 // 5 minutes old
   * );
   *
   * oldNotifications.forEach(notification => {
   *   notificationRepository.dismiss(notification.id);
   * });
   * ```
   *
   * @example Auto-dismissal Handler
   * ```typescript
   * // Handle auto-dismissal with custom logic
   * function handleNotificationCreated(notification: Notification) {
   *   if (notification.duration && notification.duration > 0) {
   *     setTimeout(() => {
   *       try {
   *         notificationRepository.dismiss(notification.id);
   *       } catch (error) {
   *         // Notification already dismissed manually
   *       }
   *     }, notification.duration);
   *   }
   * }
   * ```
   */
  dismiss(id: NotificationId): void;

  /**
   * Clears all active notifications.
   *
   * @description Removes all notifications from the active list. This operation
   * should clean up all associated resources, timers, and cached data. This is
   * typically used for reset operations or cleanup scenarios.
   *
   * @businessRules
   * - Must remove all active notifications regardless of type
   * - Should clean up all associated timers and resources
   * - Must trigger subscription callbacks with empty list
   * - Should log clear events for analytics if configured
   * - Must be idempotent (safe to call multiple times)
   *
   * @example Application Reset
   * ```typescript
   * // Clear all notifications on logout
   * function handleUserLogout() {
   *   notificationRepository.clear();
   *   console.log('All notifications cleared');
   * }
   * ```
   *
   * @example Error Recovery
   * ```typescript
   * // Clear notifications during error recovery
   * function handleCriticalError() {
   *   // Clear existing notifications to prevent confusion
   *   notificationRepository.clear();
   *
   *   // Show critical error notification
   *   notificationRepository.push({
   *     type: 'error',
   *     message: 'A critical error occurred. Please refresh the page.',
   *     duration: null,
   *     severity: 'critical'
   *   });
   * }
   * ```
   *
   * @example Maintenance Mode
   * ```typescript
   * // Clear notifications before maintenance
   * function enterMaintenanceMode() {
   *   notificationRepository.clear();
   *
   *   notificationRepository.push({
   *     type: 'warning',
   *     message: 'System maintenance in progress. Some features may be unavailable.',
   *     duration: null
   *   });
   * }
   * ```
   */
  clear(): void;
}
