import { Injectable, inject } from '@angular/core';
import { NOTIFICATION_PORT, CLOCK_PORT } from '@di/tokens';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { Notification } from '@domain/entities/notification.entity';

/**
 * Get Notifications Use Case
 *
 * @description
 * Application layer orchestrator that handles notification retrieval with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with comprehensive validation for notification retrieval operations.
 *
 * @responsibilities
 * - Validate application-level rules for notification retrieval
 * - Delegate to domain repository for the actual retrieval
 * - Handle audit logging and side effects
 * - Normalize errors for consistent application layer handling
 *
 * @architecture
 * - Application Layer orchestrator
 * - Uses domain repository through dependency injection
 * - Integrates with system clock for precise timestamping
 * - Follows 4-step orchestration pattern
 *
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class GetNotifications {
  private readonly notificationPort = inject<NotificationPort>(NOTIFICATION_PORT);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute notification retrieval orchestration with validation and audit logging
   *
   * @param requesterId - ID of the user making the request (for audit logging)
   * @returns Promise resolving to array of current notifications
   * @throws ApplicationError when validation fails or retrieval fails
   */
  async execute(requesterId?: number): Promise<Notification[]> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(requesterId);

      // Step 2: No additional domain validation needed for retrieval

      // Step 3: Delegate to domain repository for notification retrieval
      const notifications = this.notificationPort.snapshot();

      // Step 4: Handle side effects
      this.handleNotificationRetrievalSideEffects(notifications, requesterId);

      return notifications;
    } catch (error: unknown) {
      throw new ApplicationError(
        'get_notifications',
        this.errorTransformer.transformError(error),
        'NOTIFICATION_RETRIEVAL_FAILED'
      );
    }
  }

  /**
   * Validate application-level rules for notification retrieval
   *
   * @description
   * Validates request parameters and basic business rules specific to the application layer.
   * Domain validation is handled by the repository layer.
   *
   * @param requesterId Requester ID to validate (optional)
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(requesterId?: number): void {
    // Validate requester ID if provided
    if (requesterId !== undefined && requesterId !== null) {
      if (typeof requesterId !== 'number' || !Number.isInteger(requesterId) || requesterId <= 0) {
        throw new ApplicationError(
          'get_notifications',
          'INVALID_REQUESTER_ID_FORMAT',
          'Requester ID must be a positive integer when provided'
        );
      }
    }
  }

  /**
   * Handle side effects of notification retrieval
   *
   * @description
   * Manages audit logging and other side effects after successful notification retrieval.
   * Uses high-precision timestamps for accurate audit trails.
   *
   * @param notifications Retrieved notifications
   * @param requesterId ID of user who performed the retrieval
   */
  private handleNotificationRetrievalSideEffects(
    notifications: Notification[],
    requesterId?: number
  ): void {
    const timestamp = this.clock.nowEpochSeconds();

    // Calculate notification statistics for audit purposes
    const totalNotifications = notifications.length;
    const unreadNotifications = notifications.filter((n) => !n.isRead).length;
    const notificationsByType = notifications.reduce(
      (acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log(`[AUDIT] Notifications retrieval completed`, {
      timestamp,
      requesterId,
      results: {
        totalNotifications,
        unreadNotifications,
        readNotifications: totalNotifications - unreadNotifications,
        notificationsByType,
      },
      operation: 'get_notifications',
      feature: 'notifications',
      severity: 'LOW',
    });
  }
}
