import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, CLOCK_PORT } from '@di/tokens';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { Role } from '@domain/entities/role.entity';
import type { ListRolesFilterContract } from '@domain/contracts/role.contract';

/**
 * List Roles Use Case
 * 
 * @description
 * Application layer orchestrator that handles role listing with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with comprehensive validation for filter parameters.
 * 
 * @responsibilities
 * - Validate application-level rules for role listing filters
 * - Delegate to domain repository for the actual listing
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
export class ListRoles {
    private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
    private readonly clock = inject<ClockPort>(CLOCK_PORT);
    private readonly errorTransformer = inject(ApplicationErrorTransformer);

    /**
     * Execute role listing orchestration with validation and audit logging
     * 
     * @param filter - Optional filter criteria for role listing
     * @param requesterId - ID of the user making the request (for audit logging)
     * @returns Promise resolving to array of Role entities
     * @throws ApplicationError when validation fails or listing fails
     */
    async execute(filter?: ListRolesFilterContract, requesterId?: number): Promise<Role[]> {
        try {
            // Step 1: Validate application rules
            this.validateApplicationRules(filter);

            // Step 2: Delegate to domain repository
            const roles = await this.roleRepo.list(filter);

            // Step 3: Handle side effects
            this.handleRoleListingSideEffects(filter, roles, requesterId);

            return roles;
        } catch (error: unknown) {
            // Step 4: Normalize errors for application layer
            this.normalizeAndRethrow(error);
        }
    }

    /**
     * Validate application-level rules for role listing
     * 
     * @description
     * Validates request parameters and business rules specific to the application layer.
     * Domain validation is handled by the repository layer.
     * 
     * @param filter Filter criteria to validate
     * @throws ApplicationError when validation fails
     */
    private validateApplicationRules(filter?: ListRolesFilterContract): void {
        if (filter && typeof filter !== 'object') {
            throw new ApplicationError(
                'list_roles',
                'INVALID_FILTER_TYPE',
                'Filter must be an object when provided'
            );
        }

        if (filter?.search !== undefined) {
            if (typeof filter.search !== 'string') {
                throw new ApplicationError(
                    'list_roles',
                    'INVALID_SEARCH_TYPE',
                    'Search filter must be a string'
                );
            }

            if (filter.search.length > 100) {
                throw new ApplicationError(
                    'list_roles',
                    'SEARCH_TOO_LONG',
                    'Search term cannot exceed 100 characters'
                );
            }
        }

        if (filter?.active !== undefined && typeof filter.active !== 'boolean') {
            throw new ApplicationError(
                'list_roles',
                'INVALID_ACTIVE_FILTER',
                'Active filter must be a boolean value'
            );
        }
    }

    /**
     * Handle side effects of role listing
     * 
     * @description
     * Manages audit logging and other side effects after successful role listing.
     * Uses high-precision timestamps for accurate audit trails.
     * 
     * @param filter The filter criteria used
     * @param roles The retrieved roles
     * @param requesterId ID of user who performed the listing
     */
    private handleRoleListingSideEffects(
        filter: ListRolesFilterContract | undefined, 
        roles: Role[], 
        requesterId?: number
    ): void {
        const timestamp = this.clock.nowEpochSeconds();

        console.log(`[AUDIT] Role listing completed`, {
            timestamp,
            filterCriteria: {
                search: filter?.search,
                active: filter?.active,
                hasFilter: !!filter
            },
            resultCount: roles.length,
            adminRolesCount: roles.filter(role => role.isAdministrator()).length,
            activeRolesCount: roles.filter(role => role.isActive).length,
            requesterId,
            operation: 'list_roles',
            feature: 'roles',
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
            operation: 'list_roles',
            feature: 'roles'
        });
        
        throw new ApplicationError('list_roles', errorMessage, 'ROLE_LISTING_FAILED', error);
    }
}
