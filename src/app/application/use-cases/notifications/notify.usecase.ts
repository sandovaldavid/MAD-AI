import { inject, Injectable } from '@angular/core';
import { NOTIFICATION_PORT, CLOCK_PORT } from '@app/di/tokens';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { NewNotification, NotificationId } from '@domain/entities/notification.entity';

/**
 * Notify Use Case
 *
 * @description
 * Application layer orchestrator that handles notification creation with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with comprehensive validation for notification operations.
 *
 * @responsibilities
 * - Validate application-level rules for notification creation
 * - Delegate to notification port for the actual notification
 * - Handle audit logging and side effects
 * - Normalize errors for consistent application layer handling
 *
 * @architecture
 * - Application Layer orchestrator
 * - Uses notification port through dependency injection
 * - Integrates with system clock for precise timestamping
 * - Follows 4-step orchestration pattern
 *
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class Notify {
    private readonly notificationPort = inject<NotificationPort>(NOTIFICATION_PORT);
    private readonly clock = inject<ClockPort>(CLOCK_PORT);
    private readonly errorTransformer = inject(ApplicationErrorTransformer);

    /**
     * Execute notification creation orchestration with validation and audit logging
     *
     * @param notification - New notification data to send
     * @param requesterId - ID of the user making the request (for audit logging)
     * @returns NotificationId for the created notification
     * @throws ApplicationError when validation fails or notification fails
     */
    execute(notification: NewNotification, requesterId?: number): NotificationId {
        try {
            // Step 1: Validate application rules
            this.validateApplicationRules(notification);

            // Step 2: Additional validation for notification data
            this.validateNotificationData(notification);

            // Step 3: Delegate to notification port for creation
            const notificationId = this.notificationPort.push(notification);

            // Step 4: Handle side effects
            this.handleNotificationSideEffects(notification, notificationId, requesterId);

            return notificationId;
        } catch (error: unknown) {
            // Normalize errors for application layer
            throw new ApplicationError(
                'notify',
                this.errorTransformer.transformError(error),
                'NOTIFICATION_CREATION_FAILED'
            );
        }
    }

    /**
     * Validate application-level rules for notification creation
     *
     * @description
     * Validates request parameters and basic business rules specific to the application layer.
     * Domain validation is handled by the notification port.
     *
     * @param notification Notification data to validate
     * @throws ApplicationError when validation fails
     */
    private validateApplicationRules(notification: NewNotification): void {
        if (!notification) {
            throw new ApplicationError(
                'notify',
                'INVALID_NOTIFICATION_DATA',
                'Notification data is required'
            );
        }

        if (!notification.title || typeof notification.title !== 'string') {
            throw new ApplicationError(
                'notify',
                'INVALID_NOTIFICATION_TITLE',
                'Notification title is required and must be a string'
            );
        }

        if (!notification.message || typeof notification.message !== 'string') {
            throw new ApplicationError(
                'notify',
                'INVALID_NOTIFICATION_MESSAGE',
                'Notification message is required and must be a string'
            );
        }

        if (!notification.type || typeof notification.type !== 'string') {
            throw new ApplicationError(
                'notify',
                'INVALID_NOTIFICATION_TYPE',
                'Notification type is required and must be a string'
            );
        }
    }

    /**
     * Validate notification data beyond basic requirements
     *
     * @description
     * Performs additional validation for notification content and structure.
     *
     * @param notification Notification data to validate
     * @throws ApplicationError when validation fails
     */
    private validateNotificationData(notification: NewNotification): void {
        // Validate title length (after confirming it exists)
        if (notification.title && notification.title.length > 100) {
            throw new ApplicationError(
                'notify',
                'NOTIFICATION_TITLE_TOO_LONG',
                'Notification title cannot exceed 100 characters'
            );
        }

        // Validate message length (after confirming it exists)
        if (notification.message && notification.message.length > 500) {
            throw new ApplicationError(
                'notify',
                'NOTIFICATION_MESSAGE_TOO_LONG',
                'Notification message cannot exceed 500 characters'
            );
        }

        // Validate type is from allowed list (after confirming it exists)
        if (notification.type) {
            const allowedTypes = ['info', 'success', 'warning', 'error', 'system'];
            if (!allowedTypes.includes(notification.type.toLowerCase())) {
                throw new ApplicationError(
                    'notify',
                    'INVALID_NOTIFICATION_TYPE_VALUE',
                    `Notification type must be one of: ${allowedTypes.join(', ')}`
                );
            }
        }

        // Validate userId if provided
        if (notification.userId !== undefined && notification.userId !== null) {
            if (
                typeof notification.userId !== 'number' ||
                !Number.isInteger(notification.userId) ||
                notification.userId <= 0
            ) {
                throw new ApplicationError(
                    'notify',
                    'INVALID_USER_ID',
                    'User ID must be a positive integer when provided'
                );
            }
        }
    }

    /**
     * Handle side effects of notification creation
     *
     * @description
     * Manages audit logging and other side effects after successful notification creation.
     * Uses high-precision timestamps for accurate audit trails.
     *
     * @param notification The notification data that was sent
     * @param notificationId The ID of the created notification
     * @param requesterId ID of user who created the notification
     */
    private handleNotificationSideEffects(
        notification: NewNotification,
        notificationId: NotificationId,
        requesterId?: number
    ): void {
        const timestamp = this.clock.nowEpochSeconds();

        console.log(`[AUDIT] Notification created`, {
            timestamp,
            notificationId,
            requesterId,
            notification: {
                title: notification.title,
                type: notification.type,
                userId: notification.userId,
                hasMessage: !!notification.message,
            },
            operation: 'notify',
            feature: 'notifications',
            severity: 'LOW',
        });
    }
}
