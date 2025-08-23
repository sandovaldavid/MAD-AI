import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, CLOCK_PORT } from '../../../di/tokens';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { User } from '@domain/entities/user.entity';
import type { UpdateUserPatchContract } from '@domain/contracts/user.contract';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { DomainEventProcessor } from '@application/services/domain-event-processor.service';

/**
 * Update User Use Case
 *
 * @description
 * Application layer orchestrator that handles user updates with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with error normalization to ensure consistent user update workflow.
 *
 * @responsibilities
 * - Orchestrate user updates with validation and side effects
 * - Validate application-level access rules
 * - Execute user update through domain repository
 * - Handle update audit logging for compliance purposes
 * - Normalize errors for application layer consumption
 *
 * @architecture
 * This use case acts as an orchestrator that:
 * 1. Validates application rules (user ID, patch data, permissions)
 * 2. Delegates user update to domain repository
 * 3. Handles side effects (audit logging, change tracking)
 * 4. Normalizes errors for consistent error handling
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class UpdateUser {
    private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
    private readonly clock = inject<ClockPort>(CLOCK_PORT);
    private readonly errorTransformer = inject(ApplicationErrorTransformer);
    private readonly eventProcessor = inject(DomainEventProcessor);

    /**
     * Execute user update orchestration with validation and audit logging
     *
     * @param userId - ID of the user to update
     * @param patch - Update data patch containing fields to modify
     * @param requesterId - ID of the user making the request (for audit logging)
     * @returns Promise resolving to updated user entity
     * @throws ApplicationError when user not found or update fails
     */
    async execute(
        userId: number,
        patch: UpdateUserPatchContract,
        requesterId?: number
    ): Promise<User> {
        try {
            // Step 1: Validate application rules
            this.validateApplicationRules(userId, patch);

            // Step 2: Delegate to domain repository
            const updatedUser = await this.userRepo.update(userId, patch);

            // Step 3: Handle side effects
            await this.handleUserUpdateSideEffects(updatedUser, patch, requesterId);

            return updatedUser;
        } catch (error: unknown) {
            // Step 4: Normalize errors for application layer
            throw new ApplicationError(
                'update_user',
                this.errorTransformer.transformError(error),
                'USER_UPDATE_FAILED'
            );
        }
    }

    /**
     * Validate application-level rules for user update
     *
     * @description
     * Validates request parameters and business rules specific to the application layer.
     * Domain validation is handled by the repository layer.
     *
     * @param userId User ID to validate
     * @param patch Update patch to validate
     * @throws ApplicationError when validation fails
     */
    private validateApplicationRules(userId: number, patch: UpdateUserPatchContract): void {
        if (userId === undefined || userId === null) {
            throw new ApplicationError(
                'update_user',
                'INVALID_USER_ID',
                'User ID is required and must be a valid number',
                { providedUserId: userId }
            );
        }

        if (typeof userId !== 'number' || userId <= 0) {
            throw new ApplicationError(
                'update_user',
                'INVALID_USER_ID_FORMAT',
                'User ID must be a positive number',
                { providedUserId: userId }
            );
        }

        if (!patch || typeof patch !== 'object') {
            throw new ApplicationError(
                'update_user',
                'INVALID_PATCH_DATA',
                'Update patch is required and must be a valid object',
                { providedPatch: patch }
            );
        }

        // Check if patch has at least one field to update
        const patchKeys = Object.keys(patch);
        if (patchKeys.length === 0) {
            throw new ApplicationError(
                'update_user',
                'EMPTY_PATCH_DATA',
                'Update patch must contain at least one field to update',
                { providedPatch: patch }
            );
        }

        // Additional validation for specific fields can be added here
        // (complex business rules are handled in domain layer)
    }

    /**
     * Handle side effects after successful user update
     *
     * @description
     * Manages audit logging and other side effects related to user update operations.
     * This includes change tracking and compliance logging.
     *
     * @param updatedUser Updated user entity
     * @param patch Update patch that was applied
     * @param requesterId ID of user making the request
     */
    private async handleUserUpdateSideEffects(
        updatedUser: User,
        patch: UpdateUserPatchContract,
        requesterId?: number
    ): Promise<void> {
        // Process domain events from the updated user entity
        await this.eventProcessor.processEntityEvents(updatedUser);

        const timestamp = new Date(this.clock.nowEpochSeconds() * 1000);
        const changedFields = Object.keys(patch);

        // Log user update for audit trail
        console.log('[User Update] User successfully updated', {
            timestamp: timestamp.toISOString(),
            updatedUserId: updatedUser.id,
            changedFields,
            requesterId: requesterId || 'system',
            action: 'update_user',
            status: 'success',
        });

        // Additional side effects can be added here:
        // - Change history logging
        // - Email notifications for important changes
        // - Cache invalidation
        // - Event publishing for other services
        // - Compliance audit trail
    }
}
