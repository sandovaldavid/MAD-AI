import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, CLOCK_PORT } from '@di/tokens';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { Role } from '@domain/entities/role.entity';

/**
 * Activate Role Use Case
 *
 * @description
 * Application layer orchestrator that handles role activation with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with comprehensive validation for role activation operations.
 *
 * @responsibilities
 * - Validate application-level rules for role activation
 * - Delegate to domain repository for the actual activation
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
export class ActivateRole {
    private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
    private readonly clock = inject<ClockPort>(CLOCK_PORT);
    private readonly errorTransformer = inject(ApplicationErrorTransformer);

    /**
     * Execute role activation orchestration with validation and audit logging
     *
     * @param id - Role ID to activate
     * @param requesterId - ID of the user making the request (for audit logging)
     * @returns Promise resolving to the activated Role entity
     * @throws ApplicationError when validation fails or activation fails
     */
    async execute(id: number, requesterId?: number): Promise<Role> {
        try {
            // Step 1: Validate application rules
            this.validateApplicationRules(id);

            // Step 2: Get current role state and validate for activation
            const currentRole = await this.validateRoleForActivation(id);

            // Step 3: Delegate to domain repository for activation
            const activatedRole = await this.roleRepo.update(id, { isActive: true });

            // Step 4: Handle side effects
            this.handleRoleActivationSideEffects(id, currentRole, activatedRole, requesterId);

            return activatedRole;
        } catch (error: unknown) {
            // Normalize errors for application layer
            throw new ApplicationError(
                'activate_role',
                this.errorTransformer.transformError(error),
                'ROLE_ACTIVATION_FAILED'
            );
        }
    }

    /**
     * Validate application-level rules for role activation
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
                'activate_role',
                'INVALID_ROLE_ID',
                'Role ID is required for activation'
            );
        }

        if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
            throw new ApplicationError(
                'activate_role',
                'INVALID_ROLE_ID_FORMAT',
                'Role ID must be a positive integer'
            );
        }
    }

    /**
     * Validate role can be activated
     *
     * @description
     * Fetches the role and validates it can be activated according to business rules.
     *
     * @param id Role ID to validate
     * @returns Promise resolving to the current Role entity
     * @throws ApplicationError when role cannot be activated
     */
    private async validateRoleForActivation(id: number): Promise<Role> {
        const role = await this.roleRepo.getById(id);

        if (role.isActive) {
            throw new ApplicationError(
                'activate_role',
                'ROLE_ALREADY_ACTIVE',
                `Role '${role.name}' is already active and does not need activation`
            );
        }

        return role;
    }

    /**
     * Handle side effects of role activation
     *
     * @description
     * Manages audit logging and other side effects after successful role activation.
     * Uses high-precision timestamps for accurate audit trails.
     *
     * @param id The activated role ID
     * @param currentRole The role state before activation
     * @param activatedRole The role state after activation
     * @param requesterId ID of user who performed the activation
     */
    private handleRoleActivationSideEffects(
        id: number,
        currentRole: Role,
        activatedRole: Role,
        requesterId?: number
    ): void {
        const timestamp = this.clock.nowEpochSeconds();

        console.log(`[AUDIT] Role activation completed`, {
            timestamp,
            roleId: id,
            role: {
                name: activatedRole.name,
                accessLevel: activatedRole.accessLevel,
                wasActive: currentRole.isActive,
                nowActive: activatedRole.isActive,
            },
            requesterId,
            operation: 'activate_role',
            feature: 'roles',
            severity: 'MEDIUM',
        });
    }
}
