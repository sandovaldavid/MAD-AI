import { Injectable, inject } from '@angular/core';
import { NOTIFICATION_PORT, CLOCK_PORT } from '@di/tokens';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';

/**
 * Clear Notifications Use Case
 * 
 * @description
 * Application layer orchestrator that handles clearing all notifications with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with comprehensive validation for notification clearing operations.
 * 
 * @responsibilities
 * - Validate application-level rules for notification clearing
 * - Delegate to domain repository for the actual clearing
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
export class ClearNotifications {
    private readonly notificationPort = inject<NotificationPort>(NOTIFICATION_PORT);
    private readonly clock = inject<ClockPort>(CLOCK_PORT);
    private readonly errorTransformer = inject(ApplicationErrorTransformer);

    /**
     * Execute notification clearing orchestration with validation and audit logging
     * 
     * @param requesterId - ID of the user making the request (for audit logging)
     * @returns Promise resolving when clearing is complete
     * @throws ApplicationError when validation fails or clearing fails
     */
    async execute(requesterId?: number): Promise<void> {
        try {
            // Step 1: Validate application rules
            this.validateApplicationRules(requesterId);

            // Step 2: Get current notifications for audit logging before clearing
            const currentNotifications = this.notificationPort.snapshot();

            // Step 3: Delegate to domain repository for clearing
            this.notificationPort.clear();

            // Step 4: Handle side effects
            this.handleNotificationClearingSideEffects(currentNotifications, requesterId);
        } catch (error: unknown) {
            // Normalize errors for application layer
            this.normalizeAndRethrow(error);
        }
    }

    /**
     * Validate application-level rules for notification clearing
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
                    'clear_notifications',
                    'INVALID_REQUESTER_ID_FORMAT',
                    'Requester ID must be a positive integer when provided'
                );
            }
        }
    }

    /**
     * Handle side effects of notification clearing
     * 
     * @description
     * Manages audit logging and other side effects after successful notification clearing.
     * Uses high-precision timestamps for accurate audit trails.
     * 
     * @param clearedNotifications The notifications that were cleared
     * @param requesterId ID of user who performed the clearing
     */
    private handleNotificationClearingSideEffects(
        clearedNotifications: any[],
        requesterId?: number
    ): void {
        const timestamp = this.clock.nowEpochSeconds();

        // Calculate statistics of cleared notifications
        const totalCleared = clearedNotifications.length;
        const clearedByType = clearedNotifications.reduce((acc, n) => {
            acc[n.type] = (acc[n.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const unreadCleared = clearedNotifications.filter(n => !n.isRead).length;

        console.log(`[AUDIT] All notifications cleared`, {
            timestamp,
            requesterId,
            clearedStatistics: {
                totalCleared,
                unreadCleared,
                readCleared: totalCleared - unreadCleared,
                clearedByType
            },
            operation: 'clear_notifications',
            feature: 'notifications',
            severity: 'MEDIUM'
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
            operation: 'clear_notifications',
            feature: 'notifications'
        });
        
        throw new ApplicationError('clear_notifications', errorMessage, 'NOTIFICATION_CLEARING_FAILED', error);
    }
}
