import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, USER_REPOSITORY, CLOCK_PORT } from '@di/tokens';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { Role } from '@domain/entities/role.entity';

/**
 * Delete Role Use Case
 *
 * @description
 * Application layer orchestrator that handles role deletion with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with comprehensive validation including assignment checks and administrator protection.
 *
 * @responsibilities
 * - Validate application-level rules for role deletion
 * - Check for active user assignments and administrator roles
 * - Delegate to domain repository for the actual deletion
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
export class DeleteRole {
    private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
    private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
    private readonly clock = inject<ClockPort>(CLOCK_PORT);
    private readonly errorTransformer = inject(ApplicationErrorTransformer);

    /**
     * Execute role deletion orchestration with validation and audit logging
     *
     * @param id - Role ID to delete
     * @param requesterId - ID of the user making the request (for audit logging)
     * @returns Promise resolving when deletion is complete
     * @throws ApplicationError when validation fails or deletion fails
     */
    async execute(id: number, requesterId?: number): Promise<void> {
        try {
            // Step 1: Validate application rules
            this.validateApplicationRules(id);

            // Step 2: Fetch domain data and validate business rules
            const role = await this.validateRoleForDeletion(id);

            // Step 3: Delegate to domain repository
            await this.roleRepo.delete(id);

            // Step 4: Handle side effects
            this.handleRoleDeletionSideEffects(id, role, requesterId);
        } catch (error: unknown) {
            // Normalize errors for application layer
            throw new ApplicationError(
                'delete_role',
                this.errorTransformer.transformError(error),
                'ROLE_DELETION_FAILED'
            );
        }
    }

    /**
     * Validate application-level rules for role deletion
     *
     * @description
     * Validates request parameters and basic business rules specific to the application layer.
     * Domain validation is handled by the repository layer.
     *
     * @param id Role ID to validate
     * @throws ApplicationError when validation fails
     */
    private validateApplicationRules(id: number): void {
        if (id === undefined || id === null) {
            throw new ApplicationError(
                'delete_role',
                'Role ID is required for deletion',
                'INVALID_ROLE_ID'
            );
        }

        if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
            throw new ApplicationError(
                'delete_role',
                'Role ID must be a positive integer',
                'INVALID_ROLE_ID_FORMAT'
            );
        }
    }

    /**
     * Validate role for deletion including business rule checks
     *
     * @description
     * Fetches the role and validates it can be deleted according to business rules.
     * Checks for administrator role protection and active user assignments using
     * the user_count field provided by the API.
     *
     * @param id Role ID to validate
     * @returns Promise resolving to the Role entity
     * @throws ApplicationError when role cannot be deleted
     */
    private async validateRoleForDeletion(id: number): Promise<Role> {
        // Get the role first to validate it exists and check properties
        const role = await this.roleRepo.getById(id);

        console.log('Validating role for deletion:', role);
        console.log(role.userCount);

        // Prevent deletion of administrator roles
        if (role.isAdministrator()) {
            throw new ApplicationError(
                'delete_role',
                `Cannot delete administrator role '${role.name}'. Administrator roles are protected from deletion for security reasons.`,
                'ADMINISTRATOR_ROLE_PROTECTED'
            );
        }

        // Check if role has assigned users using the user_count field from API
        if (role.userCount > 0) {
            throw new ApplicationError(
                'delete_role',
                `Cannot delete role '${role.name}' because it has ${role.userCount} assigned user(s). Please reassign users to a different role before deletion.`,
                'ROLE_HAS_ASSIGNED_USERS'
            );
        }

        return role;
    }

    /**
     * Handle side effects of role deletion
     *
     * @description
     * Manages audit logging and other side effects after successful role deletion.
     * Uses high-precision timestamps for accurate audit trails.
     *
     * @param id The deleted role ID
     * @param role The deleted role entity (before deletion)
     * @param requesterId ID of user who performed the deletion
     */
    private handleRoleDeletionSideEffects(id: number, role: Role, requesterId?: number): void {
        const timestamp = this.clock.nowEpochSeconds();

        console.log(`[AUDIT] Role deletion completed`, {
            timestamp,
            roleId: id,
            deletedRole: {
                name: role.name,
                accessLevel: role.accessLevel,
                wasAdministrator: role.isAdministrator(),
            },
            requesterId,
            operation: 'delete_role',
            feature: 'roles',
            severity: 'HIGH',
        });
    }
}
