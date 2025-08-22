import { Injectable, inject } from '@angular/core';
import { NOTIFICATION_PORT, CLOCK_PORT } from '@di/tokens';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { Notification, NotificationId } from '@domain/entities/notification.entity';

/**
 * Update Notification Use Case
 * 
 * @description
 * Application layer orchestrator that handles notification updates with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with comprehensive validation for notification update operations.
 * 
 * @responsibilities
 * - Validate application-level rules for notification updates
 * - Ensure notification exists before updating
 * - Delegate to domain repository for the actual update
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
export class UpdateNotification {
    private readonly notificationPort = inject<NotificationPort>(NOTIFICATION_PORT);
    private readonly clock = inject<ClockPort>(CLOCK_PORT);
    private readonly errorTransformer = inject(ApplicationErrorTransformer);

    /**
     * Execute notification update orchestration with validation and audit logging
     * 
     * @param id - Notification ID to update
     * @param patch - Partial notification data to update
     * @param requesterId - ID of the user making the request (for audit logging)
     * @returns Promise resolving when update is complete
     * @throws ApplicationError when validation fails or update fails
     */
    async execute(id: NotificationId, patch: Partial<Notification>, requesterId?: number): Promise<void> {
        try {
            // Step 1: Validate application rules
            this.validateApplicationRules(id, patch, requesterId);

            // Step 2: Validate notification exists and can be updated
            const currentNotification = await this.validateNotificationForUpdate(id);

            // Step 3: Delegate to domain repository for update
            this.notificationPort.update(id, patch);

            // Step 4: Handle side effects
            this.handleNotificationUpdateSideEffects(id, currentNotification, patch, requesterId);
        } catch (error: unknown) {
            // Normalize errors for application layer
            this.normalizeAndRethrow(error);
        }
    }

    /**
     * Validate application-level rules for notification update
     * 
     * @description
     * Validates request parameters and basic business rules specific to the application layer.
     * Domain validation is handled by the repository layer.
     * 
     * @param id Notification ID to validate
     * @param patch Update data to validate
     * @param requesterId Requester ID to validate (optional)
     * @throws ApplicationError when validation fails
     */
    private validateApplicationRules(id: NotificationId, patch: Partial<Notification>, requesterId?: number): void {
        if (id === undefined || id === null) {
            throw new ApplicationError(
                'update_notification',
                'INVALID_NOTIFICATION_ID',
                'Notification ID is required for update'
            );
        }

        if (typeof id !== 'string' || id.trim().length === 0) {
            throw new ApplicationError(
                'update_notification',
                'INVALID_NOTIFICATION_ID_FORMAT',
                'Notification ID must be a non-empty string'
            );
        }

        if (!patch || Object.keys(patch).length === 0) {
            throw new ApplicationError(
                'update_notification',
                'INVALID_UPDATE_DATA',
                'Update patch data is required and cannot be empty'
            );
        }

        // Validate patch fields
        if (patch.message !== undefined) {
            if (typeof patch.message !== 'string') {
                throw new ApplicationError(
                    'update_notification',
                    'INVALID_MESSAGE_TYPE',
                    'Notification message must be a string'
                );
            }

            if (patch.message.length > 500) {
                throw new ApplicationError(
                    'update_notification',
                    'MESSAGE_TOO_LONG',
                    'Notification message cannot exceed 500 characters'
                );
            }
        }

        if (patch.type !== undefined) {
            if (typeof patch.type !== 'string') {
                throw new ApplicationError(
                    'update_notification',
                    'INVALID_TYPE',
                    'Notification type must be a string'
                );
            }

            const allowedTypes = ['info', 'success', 'warning', 'error', 'system'];
            if (!allowedTypes.includes(patch.type.toLowerCase())) {
                throw new ApplicationError(
                    'update_notification',
                    'INVALID_TYPE_VALUE',
                    `Notification type must be one of: ${allowedTypes.join(', ')}`
                );
            }
        }

        if (patch.isRead !== undefined && typeof patch.isRead !== 'boolean') {
            throw new ApplicationError(
                'update_notification',
                'INVALID_READ_STATUS',
                'Notification read status must be a boolean'
            );
        }

        // Validate requester ID if provided
        if (requesterId !== undefined && requesterId !== null) {
            if (typeof requesterId !== 'number' || !Number.isInteger(requesterId) || requesterId <= 0) {
                throw new ApplicationError(
                    'update_notification',
                    'INVALID_REQUESTER_ID_FORMAT',
                    'Requester ID must be a positive integer when provided'
                );
            }
        }
    }

    /**
     * Validate notification exists and can be updated
     * 
     * @description
     * Validates that the notification exists in the current snapshot and is in an updatable state.
     * 
     * @param id Notification ID to validate
     * @returns Current notification data
     * @throws ApplicationError when notification cannot be updated
     */
    private async validateNotificationForUpdate(id: NotificationId): Promise<Notification> {
        const notifications = this.notificationPort.snapshot();
        const notification = notifications.find(n => n.id === id);

        if (!notification) {
            throw new ApplicationError(
                'update_notification',
                'NOTIFICATION_NOT_FOUND',
                `Notification with ID '${id}' does not exist`
            );
        }

        return notification;
    }

    /**
     * Handle side effects of notification update
     * 
     * @description
     * Manages audit logging and other side effects after successful notification update.
     * Uses high-precision timestamps for accurate audit trails.
     * 
     * @param id The updated notification ID
     * @param currentNotification The notification before update
     * @param patch The update data that was applied
     * @param requesterId ID of user who performed the update
     */
    private handleNotificationUpdateSideEffects(
        id: NotificationId,
        currentNotification: Notification,
        patch: Partial<Notification>,
        requesterId?: number
    ): void {
        const timestamp = this.clock.nowEpochSeconds();

        // Track which fields were updated
        const updatedFields = Object.keys(patch);

        console.log(`[AUDIT] Notification update completed`, {
            timestamp,
            notificationId: id,
            requesterId,
            originalNotification: {
                type: currentNotification.type,
                message: currentNotification.message?.substring(0, 50) + '...',
                isRead: currentNotification.isRead
            },
            updateData: {
                updatedFields,
                patchData: patch
            },
            operation: 'update_notification',
            feature: 'notifications',
            severity: 'LOW'
        });
    }

    /**
     * Transform and normalize errors for consistent handling across the application layer
     * 
     * @description
     * Uses the ApplicationErrorTransformer to convert domain/infrastructure errors into
     * ApplicationError instances for consistent error handling across the application layer.
     * 
     * @param error Original error from domain or infrastructure layers
     * @throws ApplicationError Normalized error for application consumption
     */
    private normalizeAndRethrow(error: unknown): never {
        const errorMessage = this.errorTransformer.transformError(error, {
            operation: 'update_notification',
            feature: 'notifications'
        });
        
        throw new ApplicationError('update_notification', errorMessage, 'NOTIFICATION_UPDATE_FAILED', error);
    }
}
