import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, CLOCK_PORT } from '@di/tokens';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { Role } from '@domain/entities/role.entity';
import type { ListRolesFilterContract } from '@domain/contracts/role.contract';

/**
 * Get Role By Name Use Case
 *
 * @description
 * Application layer orchestrator that handles role retrieval by name with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with comprehensive validation for role name parameters.
 *
 * @responsibilities
 * - Validate application-level rules for role name
 * - Delegate to domain repository for role search and filtering
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
export class GetRoleByName {
    private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
    private readonly clock = inject<ClockPort>(CLOCK_PORT);
    private readonly errorTransformer = inject(ApplicationErrorTransformer);

    /**
     * Execute role retrieval by name orchestration with validation and audit logging
     *
     * @param name - Role name to search for
     * @param requesterId - ID of the user making the request (for audit logging)
     * @returns Promise resolving to the Role entity
     * @throws ApplicationError when validation fails or role not found
     */
    async execute(name: string, requesterId?: number): Promise<Role> {
        try {
            // Step 1: Validate application rules
            this.validateApplicationRules(name);

            // Step 2: Search for role by name
            const role = await this.findRoleByName(name);

            // Step 3: Handle side effects
            this.handleRoleRetrievalSideEffects(name, role, requesterId);

            return role;
        } catch (error: unknown) {
            // Step 4: Normalize errors for application layer
            throw new ApplicationError(
                'get_role_by_name',
                this.errorTransformer.transformError(error),
                'ROLE_SEARCH_FAILED'
            );
        }
    }

    /**
     * Validate application-level rules for role name search
     *
     * @description
     * Validates request parameters and business rules specific to the application layer.
     * Domain validation is handled by the repository layer.
     *
     * @param name Role name to validate
     * @throws ApplicationError when validation fails
     */
    private validateApplicationRules(name: string): void {
        if (!name || typeof name !== 'string') {
            throw new ApplicationError(
                'get_role_by_name',
                'INVALID_ROLE_NAME',
                'Role name is required for search'
            );
        }

        if (name.trim().length === 0) {
            throw new ApplicationError(
                'get_role_by_name',
                'EMPTY_ROLE_NAME',
                'Role name cannot be empty or whitespace only'
            );
        }

        if (name.trim().length > 100) {
            throw new ApplicationError(
                'get_role_by_name',
                'ROLE_NAME_TOO_LONG',
                'Role name cannot exceed 100 characters'
            );
        }
    }

    /**
     * Find role by exact name match
     *
     * @description
     * Searches for roles using the repository list method and filters for exact match.
     * This approach maintains consistency with existing repository interface.
     *
     * @param name Role name to search for
     * @returns Promise resolving to the matching Role entity
     * @throws ApplicationError when role not found
     */
    private async findRoleByName(name: string): Promise<Role> {
        const filter: ListRolesFilterContract = {
            search: name.trim(),
        };

        const roles = await this.roleRepo.list(filter);

        // Find exact match (case-insensitive)
        const exactMatch = roles.find(
            (role) => role.name.toLowerCase() === name.trim().toLowerCase()
        );

        if (!exactMatch) {
            throw new ApplicationError(
                'get_role_by_name',
                'ROLE_NOT_FOUND',
                `Role with name '${name.trim()}' not found`
            );
        }

        return exactMatch;
    }

    /**
     * Handle side effects of role retrieval by name
     *
     * @description
     * Manages audit logging and other side effects after successful role retrieval.
     * Uses high-precision timestamps for accurate audit trails.
     *
     * @param searchName The requested role name
     * @param role The retrieved role entity
     * @param requesterId ID of user who performed the search
     */
    private handleRoleRetrievalSideEffects(
        searchName: string,
        role: Role,
        requesterId?: number
    ): void {
        const timestamp = this.clock.nowEpochSeconds();

        console.log(`[AUDIT] Role search by name completed`, {
            timestamp,
            searchName: searchName.trim(),
            foundRole: {
                id: role.id,
                name: role.name,
                accessLevel: role.accessLevel,
            },
            requesterId,
            operation: 'get_role_by_name',
            feature: 'roles',
            severity: 'LOW',
        });
    }
}
