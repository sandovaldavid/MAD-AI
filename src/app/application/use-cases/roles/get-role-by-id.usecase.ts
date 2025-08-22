import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, CLOCK_PORT } from '@di/tokens';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { Role } from '@domain/entities/role.entity';

/**
 * Get Role By ID Use Case
 *
 * @description
 * Application layer orchestrator that handles role retrieval by ID with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with comprehensive validation for role ID parameters.
 *
 * @responsibilities
 * - Validate application-level rules for role ID
 * - Delegate to domain repository for the actual retrieval
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
export class GetRoleById {
    private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
    private readonly clock = inject<ClockPort>(CLOCK_PORT);
    private readonly errorTransformer = inject(ApplicationErrorTransformer);

    /**
     * Execute role retrieval orchestration with validation and audit logging
     *
     * @param id - Role ID to retrieve
     * @param requesterId - ID of the user making the request (for audit logging)
     * @returns Promise resolving to the Role entity
     * @throws ApplicationError when validation fails or role not found
     */
    async execute(id: number, requesterId?: number): Promise<Role> {
        try {
            // Step 1: Validate application rules
            this.validateApplicationRules(id);

            // Step 2: Delegate to domain repository
            const role = await this.roleRepo.getById(id);

            // Step 3: Handle side effects
            this.handleRoleRetrievalSideEffects(id, role, requesterId);

            return role;
        } catch (error: unknown) {
            // Step 4: Normalize errors for application layer
            this.normalizeAndRethrow(error);
        }
    }

    /**
     * Validate application-level rules for role retrieval
     *
     * @description
     * Validates request parameters and business rules specific to the application layer.
     * Domain validation is handled by the repository layer.
     *
     * @param id Role ID to validate
     * @throws ApplicationError when validation fails
     */
    private validateApplicationRules(id: number): void {
        if (id === undefined || id === null) {
            throw new ApplicationError(
                'get_role_by_id',
                'INVALID_ROLE_ID',
                'Role ID is required for retrieval'
            );
        }

        if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
            throw new ApplicationError(
                'get_role_by_id',
                'INVALID_ROLE_ID_FORMAT',
                'Role ID must be a positive integer'
            );
        }
    }

    /**
     * Handle side effects of role retrieval
     *
     * @description
     * Manages audit logging and other side effects after successful role retrieval.
     * Uses high-precision timestamps for accurate audit trails.
     *
     * @param id The requested role ID
     * @param role The retrieved role entity
     * @param requesterId ID of user who performed the retrieval
     */
    private handleRoleRetrievalSideEffects(id: number, role: Role, requesterId?: number): void {
        const timestamp = this.clock.nowEpochSeconds();

        console.log(`[AUDIT] Role retrieval completed`, {
            timestamp,
            requestedId: id,
            foundRole: {
                id: role.id,
                name: role.name,
                accessLevel: role.accessLevel,
            },
            requesterId,
            operation: 'get_role_by_id',
            feature: 'roles',
            severity: 'LOW',
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
            operation: 'get_role_by_id',
            feature: 'roles',
        });

        throw new ApplicationError('get_role_by_id', errorMessage, 'ROLE_RETRIEVAL_FAILED', error);
    }
}
