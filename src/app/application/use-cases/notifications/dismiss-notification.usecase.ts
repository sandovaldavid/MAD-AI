import { Injectable, inject } from '@angular/core';
import { NOTIFICATION_PORT, CLOCK_PORT } from '@di/tokens';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { NotificationId } from '@domain/entities/notification.entity';

/**
 * Dismiss Notification Use Case
 *
 * @description
 * Application layer orchestrator that handles notification dismissal with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with comprehensive validation for notification dismissal operations.
 *
 * @responsibilities
 * - Validate application-level rules for notification dismissal
 * - Delegate to domain repository for the actual dismissal
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
export class DismissNotification {
    private readonly notificationPort = inject<NotificationPort>(NOTIFICATION_PORT);
    private readonly clock = inject<ClockPort>(CLOCK_PORT);
    private readonly errorTransformer = inject(ApplicationErrorTransformer);

    /**
     * Execute notification dismissal orchestration with validation and audit logging
     *
     * @param id - Notification ID to dismiss
     * @param requesterId - ID of the user making the request (for audit logging)
     * @returns Promise resolving when dismissal is complete
     * @throws ApplicationError when validation fails or dismissal fails
     */
    async execute(id: NotificationId, requesterId?: number): Promise<void> {
        try {
            // Step 1: Validate application rules
            this.validateApplicationRules(id, requesterId);

            // Step 2: Delegate to domain repository for dismissal
            // The domain layer (service) handles existence validation and idempotency
            this.notificationPort.dismiss(id);

            // Step 3: Handle side effects
            this.handleNotificationDismissalSideEffects(id, requesterId);
        } catch (error: unknown) {
            // Normalize errors for application layer
            throw new ApplicationError(
                'dismiss_notification',
                this.errorTransformer.transformError(error),
                'NOTIFICATION_DISMISSAL_FAILED'
            );
        }
    }

    /**
     * Validate application-level rules for notification dismissal
     *
     * @description
     * Validates request parameters and basic business rules specific to the application layer.
     * Domain validation is handled by the repository layer.
     *
     * @param id Notification ID to validate
     * @param requesterId Requester ID to validate (optional)
     * @throws ApplicationError when validation fails
     */
    private validateApplicationRules(id: NotificationId, requesterId?: number): void {
        if (id === undefined || id === null) {
            throw new ApplicationError(
                'dismiss_notification',
                'INVALID_NOTIFICATION_ID',
                'Notification ID is required for dismissal'
            );
        }

        if (typeof id !== 'string' || id.trim().length === 0) {
            throw new ApplicationError(
                'dismiss_notification',
                'INVALID_NOTIFICATION_ID_FORMAT',
                'Notification ID must be a non-empty string'
            );
        }

        // Validate requester ID if provided
        if (requesterId !== undefined && requesterId !== null) {
            if (
                typeof requesterId !== 'number' ||
                !Number.isInteger(requesterId) ||
                requesterId <= 0
            ) {
                throw new ApplicationError(
                    'dismiss_notification',
                    'INVALID_REQUESTER_ID_FORMAT',
                    'Requester ID must be a positive integer when provided'
                );
            }
        }
    }

    /**
     * Validate notification exists and can be dismissed
     *
     * @description
     * Validates that the notification exists in the current snapshot and is in a dismissible state.
     *
     * @param id Notification ID to validate
     * @throws ApplicationError when notification cannot be dismissed
     */
    /**
     * Validate notification exists and can be dismissed
     *
     * @description
     * DEPRECATED: This validation is now handled by the domain service layer.
     * The NotificationPort service handles existence validation and idempotency,
     * making this application-layer validation redundant and potentially
     * causing race conditions with concurrent dismissal requests.
     *
     * @param id Notification ID to validate
     * @throws ApplicationError when notification not found or already dismissed
     */
    private async validateNotificationForDismissal(id: NotificationId): Promise<void> {
        // DEPRECATED: Validation moved to domain service layer
        // Keeping method for documentation purposes but it's no longer called
        // const notifications = this.notificationPort.snapshot();
        // const notification = notifications.find(n => n.id === id);
        // if (!notification) {
        //     throw new ApplicationError(
        //         'dismiss_notification',
        //         'NOTIFICATION_NOT_FOUND',
        //         `Notification with ID '${id}' does not exist or has already been dismissed`
        //     , error);
        // }
        // // Check if notification is already dismissed (if it has a dismissed property)
        // if ('isDismissed' in notification && notification.isDismissed) {
        //     throw new ApplicationError(
        //         'dismiss_notification',
        //         'NOTIFICATION_ALREADY_DISMISSED',
        //         `Notification with ID '${id}' has already been dismissed`
        //     , error);
        // }
    }

    /**
     * Handle side effects of notification dismissal
     *
     * @description
     * Manages audit logging and other side effects after successful notification dismissal.
     * Uses high-precision timestamps for accurate audit trails.
     *
     * @param id The dismissed notification ID
     * @param requesterId ID of user who performed the dismissal
     */
    private handleNotificationDismissalSideEffects(id: NotificationId, requesterId?: number): void {
        const timestamp = this.clock.nowEpochSeconds();

        console.log(`[AUDIT] Notification dismissal completed`, {
            timestamp,
            notificationId: id,
            requesterId,
            operation: 'dismiss_notification',
            feature: 'notifications',
            severity: 'LOW',
        });
    }
}
