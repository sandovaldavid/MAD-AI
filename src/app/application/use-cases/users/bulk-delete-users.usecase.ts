import { Injectable, inject } from '@angular/core';

import { USER_REPOSITORY, CLOCK_PORT } from '@di/tokens';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';

export interface BulkDeleteUsersRequest {
    readonly userIds: readonly number[];
    readonly performingUserId: number;
}

export interface BulkDeleteUserResult {
    readonly userId: number;
    readonly success: boolean;
    readonly error?: string;
}

export interface BulkDeleteUsersResponse {
    readonly totalRequested: number;
    readonly successfulDeletions: number;
    readonly failedDeletions: number;
    readonly results: readonly BulkDeleteUserResult[];
}

@Injectable({ providedIn: 'root' })
export class BulkDeleteUsers {
    private readonly userRepository = inject<UserRepository>(USER_REPOSITORY);
    private readonly clock = inject<ClockPort>(CLOCK_PORT);
    private readonly errorTransformer = new ApplicationErrorTransformer();

    async execute(request: BulkDeleteUsersRequest): Promise<BulkDeleteUsersResponse> {
        try {
            // Step 1: Validate application-level rules
            this.validateApplicationRules(request);

            // Step 2: Fetch domain data
            const operationTimestamp = this.clock.nowEpochSeconds();

            // Step 3: Execute core business operation
            const results = await this.deleteUsersInBatch(request);

            // Step 4: Handle side effects
            await this.handleBulkDeletionSideEffects(request, results, operationTimestamp);

            return results;
        } catch (error: unknown) {
            this.normalizeAndRethrow(error);
        }
    }

    private validateApplicationRules(request: BulkDeleteUsersRequest): void {
        if (!request.userIds || request.userIds.length === 0) {
            throw new ApplicationError(
                'User IDs are required for bulk deletion',
                'VALIDATION_ERROR',
                'bulk-delete-users',
                'users'
            );
        }

        if (request.userIds.length > 50) {
            throw new ApplicationError(
                'Cannot delete more than 50 users at once',
                'BATCH_SIZE_EXCEEDED',
                'bulk-delete-users',
                'users'
            );
        }

        // Check for self-deletion
        if (request.userIds.includes(request.performingUserId)) {
            throw new ApplicationError(
                'Cannot delete your own user account',
                'SELF_DELETION_NOT_ALLOWED',
                'bulk-delete-users',
                'users'
            );
        }

        // Check for duplicates
        const uniqueIds = new Set(request.userIds);
        if (uniqueIds.size !== request.userIds.length) {
            throw new ApplicationError(
                'Duplicate user IDs detected in deletion request',
                'DUPLICATE_IDS',
                'bulk-delete-users',
                'users'
            );
        }
    }

    private async deleteUsersInBatch(
        request: BulkDeleteUsersRequest
    ): Promise<BulkDeleteUsersResponse> {
        const results: BulkDeleteUserResult[] = [];
        let successfulDeletions = 0;
        let failedDeletions = 0;

        for (const userId of request.userIds) {
            try {
                // Check if user exists before attempting deletion
                const user = await this.userRepository.getById(userId);
                if (!user) {
                    results.push({
                        userId,
                        success: false,
                        error: 'User not found',
                    });
                    failedDeletions++;
                    continue;
                }

                // Perform deletion
                await this.userRepository.delete(userId);

                results.push({
                    userId,
                    success: true,
                });
                successfulDeletions++;
            } catch (error: any) {
                results.push({
                    userId,
                    success: false,
                    error: error?.message || 'Unknown error during deletion',
                });
                failedDeletions++;
            }
        }

        return {
            totalRequested: request.userIds.length,
            successfulDeletions,
            failedDeletions,
            results,
        };
    }

    private async handleBulkDeletionSideEffects(
        request: BulkDeleteUsersRequest,
        results: BulkDeleteUsersResponse,
        operationTimestamp: number
    ): Promise<void> {
        const successfulIds = results.results
            .filter((result) => result.success)
            .map((result) => result.userId);

        const failedIds = results.results
            .filter((result) => !result.success)
            .map((result) => result.userId);

        console.log(`[AUDIT] Bulk user deletion completed`, {
            timestamp: operationTimestamp,
            performedBy: request.performingUserId,
            operation: 'bulk-delete-users',
            feature: 'users',
            totalRequested: results.totalRequested,
            successfulDeletions: results.successfulDeletions,
            failedDeletions: results.failedDeletions,
            successfulUserIds: successfulIds,
            failedUserIds: failedIds,
            severity: 'HIGH',
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
            operation: 'bulk-delete-users',
            feature: 'users',
        });

        throw new ApplicationError(
            'bulk_delete_users',
            errorMessage,
            'BULK_USER_DELETION_FAILED'
        , error);
    }
}
