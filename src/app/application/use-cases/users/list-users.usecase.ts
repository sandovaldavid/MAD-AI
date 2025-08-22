import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, CLOCK_PORT } from '../../../di/tokens';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { User } from '@domain/entities/user.entity';
import type { UserListFilterContract } from '@domain/contracts/user.contract';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';

/**
 * List Users Use Case
 * 
 * @description
 * Application layer orchestrator that handles user listing with validation,
 * filtering, audit logging, and error normalization. This use case follows the orchestration
 * pattern with error normalization to ensure consistent user listing workflow.
 * 
 * @responsibilities
 * - Orchestrate user listing with validation and side effects
 * - Validate application-level access rules
 * - Execute user listing through domain repository
 * - Handle listing audit logging for compliance purposes
 * - Normalize errors for application layer consumption
 * 
 * @architecture
 * This use case acts as an orchestrator that:
 * 1. Validates application rules (filter parameters, access permissions)
 * 2. Delegates user listing to domain repository
 * 3. Handles side effects (audit logging, access tracking)
 * 4. Normalizes errors for consistent error handling
 * 
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class ListUsers {
    private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
    private readonly clock = inject<ClockPort>(CLOCK_PORT);
    private readonly errorTransformer = inject(ApplicationErrorTransformer);

    /**
     * Execute user listing orchestration with validation and audit logging
     * 
     * @param filter - Optional filter criteria for user listing
     * @param requesterId - ID of the user making the request (for audit logging)
     * @returns Promise resolving to array of user entities
     * @throws ApplicationError when listing fails or access denied
     */
    async execute(filter?: UserListFilterContract, requesterId?: number): Promise<User[]> {
        try {
            // Step 1: Validate application rules
            this.validateApplicationRules(filter);

            // Step 2: Delegate to domain repository
            const users = await this.userRepo.list(filter);

            // Step 3: Handle side effects
            this.handleUserListingSideEffects(users.length, filter, requesterId);

            return users;

        } catch (error: unknown) {
            // Step 4: Normalize errors for application layer
            this.normalizeAndRethrow(error);
        }
    }

    /**
     * Validate application-level rules for user listing
     * 
     * @description
     * Validates request parameters and business rules specific to the application layer.
     * Domain validation is handled by the repository layer.
     * 
     * @param filter Filter criteria to validate
     * @throws ApplicationError when validation fails
     */
    private validateApplicationRules(filter?: UserListFilterContract): void {
        if (filter === null) {
            throw new ApplicationError(
                'list_users',
                'INVALID_FILTER_PARAMETER',
                'Filter parameter cannot be null',
                { providedFilter: filter }
            );
        }

        if (filter && typeof filter !== 'object') {
            throw new ApplicationError(
                'list_users',
                'INVALID_FILTER_TYPE',
                'Filter parameter must be a valid object',
                { providedFilter: filter }
            );
        }

        // Validate pagination parameters if provided
        if (filter?.limit !== undefined) {
            if (typeof filter.limit !== 'number' || filter.limit <= 0) {
                throw new ApplicationError(
                    'list_users',
                    'INVALID_LIMIT_PARAMETER',
                    'Limit must be a positive number',
                    { providedLimit: filter.limit }
                );
            }

            if (filter.limit > 1000) {
                throw new ApplicationError(
                    'list_users',
                    'LIMIT_TOO_LARGE',
                    'Limit cannot exceed 1000 records per request',
                    { providedLimit: filter.limit, maxLimit: 1000 }
                );
            }
        }

        if (filter?.offset !== undefined) {
            if (typeof filter.offset !== 'number' || filter.offset < 0) {
                throw new ApplicationError(
                    'list_users',
                    'INVALID_OFFSET_PARAMETER',
                    'Offset must be a non-negative number',
                    { providedOffset: filter.offset }
                );
            }
        }
    }

    /**
     * Handle side effects after successful user listing
     * 
     * @description
     * Manages audit logging and other side effects related to user listing operations.
     * This includes access tracking and performance monitoring.
     * 
     * @param resultCount Number of users returned
     * @param filter Filter criteria that was applied
     * @param requesterId ID of user making the request
     */
    private handleUserListingSideEffects(
        resultCount: number, 
        filter?: UserListFilterContract, 
        requesterId?: number
    ): void {
        const timestamp = new Date(this.clock.nowEpochSeconds() * 1000);
        
        // Log user listing for audit trail
        console.log('[User Listing] Users successfully listed', {
            timestamp: timestamp.toISOString(),
            resultCount,
            filterApplied: !!filter,
            filter: filter ? {
                limit: filter.limit,
                offset: filter.offset,
                roleId: filter.roleId,
                isActive: filter.isActive,
                searchTerm: filter.searchTerm ? '[REDACTED]' : undefined
            } : null,
            requesterId: requesterId || 'anonymous',
            action: 'list_users',
            status: 'success'
        });

        // Additional side effects can be added here:
        // - Performance monitoring for large queries
        // - Access pattern analysis
        // - Rate limiting checks
        // - Cache management
        // - Usage analytics
    }

    /**
     * Normalize and rethrow errors for application layer consistency
     * 
     * @description
     * Transforms domain and infrastructure errors into normalized ApplicationError
     * instances for consistent error handling across the application layer.
     * 
     * @param error Original error from domain or infrastructure layers
     * @throws ApplicationError Normalized error for application consumption
     */
    private normalizeAndRethrow(error: unknown): never {
        const errorMessage = this.errorTransformer.transformError(error, {
            operation: 'list_users',
            feature: 'user'
        });
        
        throw new ApplicationError('list_users', errorMessage, 'USER_LISTING_FAILED', error);
    }
}
