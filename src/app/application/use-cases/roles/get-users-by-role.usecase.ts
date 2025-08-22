import { Injectable, inject } from '@angular/core';
import { USER_REPOSITORY, ROLE_REPOSITORY, CLOCK_PORT } from '@di/tokens';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { User } from '@domain/entities/user.entity';
import type { Role } from '@domain/entities/role.entity';
import type { UserListFilterContract } from '@domain/contracts/user.contract';

/**
 * Get Users by Role Use Case
 * 
 * @description
 * Application layer orchestrator that handles retrieval of users assigned to a specific role
 * with validation, audit logging, and error normalization. This use case follows the 
 * orchestration pattern with comprehensive validation for user listing operations.
 * 
 * @responsibilities
 * - Validate application-level rules for user retrieval by role
 * - Ensure role exists before retrieving associated users
 * - Delegate to domain repository for the actual user retrieval
 * - Handle audit logging and side effects
 * - Normalize errors for consistent application layer handling
 * 
 * @architecture
 * - Application Layer orchestrator
 * - Uses domain repositories through dependency injection
 * - Integrates with system clock for precise timestamping
 * - Follows 4-step orchestration pattern
 * 
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class GetUsersByRole {
    private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
    private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
    private readonly clock = inject<ClockPort>(CLOCK_PORT);
    private readonly errorTransformer = inject(ApplicationErrorTransformer);

    /**
     * Execute user retrieval by role orchestration with validation and audit logging
     * 
     * @param roleId - Role ID to find users for
     * @param additionalFilters - Optional additional filters for user search
     * @param requesterId - ID of the user making the request (for audit logging)
     * @returns Promise resolving to array of users assigned to the role
     * @throws ApplicationError when validation fails or retrieval fails
     */
    async execute(
        roleId: number, 
        additionalFilters?: Partial<UserListFilterContract>,
        requesterId?: number
    ): Promise<User[]> {
        try {
            // Step 1: Validate application rules
            this.validateApplicationRules(roleId, additionalFilters);

            // Step 2: Validate role exists
            const role = await this.validateRoleExists(roleId);

            // Step 3: Delegate to domain repository for user retrieval
            const filter: UserListFilterContract = {
                roleId,
                ...additionalFilters
            };
            
            console.log('🔥 GetUsersByRole.execute - About to call userRepo.list with filter:', filter);
            
            const users = await this.userRepo.list(filter);
            
            console.log('🔥 GetUsersByRole.execute - Successfully retrieved users:', {
                count: users.length,
                userIds: users.map(u => u.id)
            });

            // Step 4: Handle side effects
            this.handleUserRetrievalSideEffects(roleId, role, users, additionalFilters, requesterId);

            return users;
        } catch (error: unknown) {
            console.error('🔥 GetUsersByRole.execute - ERROR CAUGHT:', error);
            console.error('🔥 GetUsersByRole.execute - Error type:', typeof error);
            console.error('🔥 GetUsersByRole.execute - Error constructor:', (error as any)?.constructor?.name);
            console.error('🔥 GetUsersByRole.execute - Error message:', (error as any)?.message);
            console.error('🔥 GetUsersByRole.execute - Error stack:', (error as any)?.stack);
            
            // Normalize errors for application layer
            this.normalizeAndRethrow(error);
        }
    }

    /**
     * Validate application-level rules for user retrieval by role
     * 
     * @description
     * Validates request parameters and basic business rules specific to the application layer.
     * Domain validation is handled by the repository layer.
     * 
     * @param roleId Role ID to validate
     * @param additionalFilters Additional filters to validate
     * @throws ApplicationError when validation fails
     */
    private validateApplicationRules(
        roleId: number, 
        additionalFilters?: Partial<UserListFilterContract>
    ): void {
        if (roleId === undefined || roleId === null) {
            throw new ApplicationError(
                'get_users_by_role',
                'INVALID_ROLE_ID',
                'Role ID is required for user retrieval'
            );
        }

        if (typeof roleId !== 'number' || !Number.isInteger(roleId) || roleId <= 0) {
            throw new ApplicationError(
                'get_users_by_role',
                'INVALID_ROLE_ID_FORMAT',
                'Role ID must be a positive integer'
            );
        }

        // Validate additional filters if provided
        if (additionalFilters) {
            if (additionalFilters.searchTerm !== undefined) {
                if (typeof additionalFilters.searchTerm !== 'string') {
                    throw new ApplicationError(
                        'get_users_by_role',
                        'INVALID_SEARCH_FILTER',
                        'Search term filter must be a string'
                    );
                }

                if (additionalFilters.searchTerm.length > 100) {
                    throw new ApplicationError(
                        'get_users_by_role',
                        'SEARCH_FILTER_TOO_LONG',
                        'Search term filter cannot exceed 100 characters'
                    );
                }
            }

            if (additionalFilters.isActive !== undefined && typeof additionalFilters.isActive !== 'boolean') {
                throw new ApplicationError(
                    'get_users_by_role',
                    'INVALID_ACTIVE_FILTER',
                    'Active filter must be a boolean value'
                );
            }

            if (additionalFilters.limit !== undefined) {
                if (typeof additionalFilters.limit !== 'number' || !Number.isInteger(additionalFilters.limit) || additionalFilters.limit <= 0) {
                    throw new ApplicationError(
                        'get_users_by_role',
                        'INVALID_LIMIT_FILTER',
                        'Limit filter must be a positive integer'
                    );
                }

                if (additionalFilters.limit > 1000) {
                    throw new ApplicationError(
                        'get_users_by_role',
                        'LIMIT_FILTER_TOO_HIGH',
                        'Limit filter cannot exceed 1000 records'
                    );
                }
            }
        }
    }

    /**
     * Validate role exists
     * 
     * @description
     * Fetches the role and validates it exists before retrieving associated users.
     * 
     * @param roleId Role ID to validate
     * @returns Promise resolving to the Role entity
     * @throws ApplicationError when role doesn't exist
     */
    private async validateRoleExists(roleId: number): Promise<Role> {
        const role = await this.roleRepo.getById(roleId);
        
        if (!role) {
            throw new ApplicationError(
                'get_users_by_role',
                'ROLE_NOT_FOUND',
                `Role with ID ${roleId} does not exist`
            );
        }

        return role;
    }

    /**
     * Handle side effects of user retrieval by role
     * 
     * @description
     * Manages audit logging and other side effects after successful user retrieval.
     * Uses high-precision timestamps for accurate audit trails.
     * 
     * @param roleId The role ID that was queried
     * @param role The role entity
     * @param users The retrieved users
     * @param additionalFilters Any additional filters that were applied
     * @param requesterId ID of user who performed the retrieval
     */
    private handleUserRetrievalSideEffects(
        roleId: number,
        role: Role,
        users: User[],
        additionalFilters?: Partial<UserListFilterContract>,
        requesterId?: number
    ): void {
        const timestamp = this.clock.nowEpochSeconds();

        // Calculate statistics
        const activeUsers = users.filter(user => user.active).length;
        const inactiveUsers = users.length - activeUsers;
        const hasFilters = additionalFilters && Object.keys(additionalFilters).length > 0;

        console.log(`[AUDIT] Users by role retrieval completed`, {
            timestamp,
            roleId,
            requesterId,
            role: {
                name: role.name,
                accessLevel: role.accessLevel,
                isActive: role.isActive
            },
            results: {
                totalUsers: users.length,
                activeUsers,
                inactiveUsers,
                hasAdditionalFilters: hasFilters,
                appliedFilters: additionalFilters || {}
            },
            operation: 'get_users_by_role',
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
            operation: 'get_users_by_role',
            feature: 'roles'
        });
        
        throw new ApplicationError('get_users_by_role', errorMessage, 'USER_RETRIEVAL_BY_ROLE_FAILED', error);
    }
}
