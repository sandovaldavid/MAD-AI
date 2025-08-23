import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, CLOCK_PORT } from '../../../di/tokens';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';

/**
 * Delete User Use Case
 *
 * @description
 * Application layer orchestrator that handles user deletion with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with error normalization to ensure consistent user deletion workflow.
 *
 * @responsibilities
 * - Orchestrate user deletion with validation and side effects
 * - Validate application-level access rules
 * - Execute user deletion through domain repository
 * - Handle deletion audit logging for compliance purposes
 * - Normalize errors for application layer consumption
 *
 * @architecture
 * This use case acts as an orchestrator that:
 * 1. Validates application rules (user ID, deletion permissions)
 * 2. Delegates user deletion to domain repository
 * 3. Handles side effects (audit logging, cleanup notifications)
 * 4. Normalizes errors for consistent error handling
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class DeleteUser {
    private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
    private readonly clock = inject<ClockPort>(CLOCK_PORT);
    private readonly errorTransformer = inject(ApplicationErrorTransformer);

    /**
     * Execute user deletion orchestration with validation and audit logging
     *
     * @param userId - ID of the user to delete
     * @param requesterId - ID of the user making the request (for audit logging)
     * @returns Promise resolving when deletion is complete
     * @throws ApplicationError when user not found or deletion fails
     */
    async execute(userId: number, requesterId?: number): Promise<void> {
        try {
            console.log('Delete Use Case - Starting execution');
            // Step 1: Validate application rules
            this.validateApplicationRules(userId, requesterId);
            console.log('Application use case - Validation complete');
            console.log('Delete Use Case');

            // Step 2: Delegate to domain repository
            await this.userRepo.delete(userId);

            // Step 3: Handle side effects
            this.handleUserDeletionSideEffects(userId, requesterId);
        } catch (error: unknown) {
            // Step 4: Normalize errors for application layer
            throw new ApplicationError(
                'delete_user',
                this.errorTransformer.transformError(error),
                'USER_DELETION_FAILED'
            );
        }
    }

    /**
     * Validate application-level rules for user deletion
     *
     * @description
     * Validates request parameters and business rules specific to the application layer.
     * Domain validation is handled by the repository layer.
     *
     * @param userId User ID to validate
     * @param requesterId ID of user making the request
     * @throws ApplicationError when validation fails
     */
    private validateApplicationRules(userId: number, requesterId?: number): void {
        console.log('Delete Use Case - Validating application rules');
        console.log(`userId: ${userId} - requesterId: ${requesterId}`);
        if (userId === undefined || userId === null) {
            throw new ApplicationError(
                'delete_user',
                'User ID is required and must be a valid number',
                'INVALID_USER_ID',
                { providedUserId: userId }
            );
        }

        if (typeof userId !== 'number' || userId <= 0) {
            throw new ApplicationError(
                'delete_user',
                'User ID must be a positive number',
                'INVALID_USER_ID_FORMAT',
                { providedUserId: userId }
            );
        }

        // Prevent self-deletion (basic application-level rule)
        if (requesterId && userId === requesterId) {
            throw new ApplicationError(
                'delete_user',
                'Users cannot delete their own account through this operation',
                'SELF_DELETION_NOT_ALLOWED',
                {
                    userId,
                    requesterId,
                    suggestion: 'Use account deactivation instead',
                }
            );
        }
    }

    /**
     * Handle side effects after successful user deletion
     *
     * @description
     * Manages audit logging and other side effects related to user deletion operations.
     * This includes compliance logging and cleanup notifications.
     *
     * @param deletedUserId ID of the deleted user
     * @param requesterId ID of user making the request
     */
    private handleUserDeletionSideEffects(deletedUserId: number, requesterId?: number): void {
        const timestamp = new Date(this.clock.nowEpochSeconds() * 1000);

        // Log user deletion for audit trail
        console.log('[User Deletion] User successfully deleted', {
            timestamp: timestamp.toISOString(),
            deletedUserId,
            requesterId: requesterId || 'system',
            action: 'delete_user',
            status: 'success',
            severity: 'high', // User deletion is a high-severity action
        });

        // Additional side effects can be added here:
        // - Send notification to administrators
        // - Clean up user-related cache entries
        // - Trigger data cleanup jobs
        // - Log to external audit systems
        // - Update user metrics and analytics
    }
}
