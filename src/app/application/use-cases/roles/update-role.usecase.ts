import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, CLOCK_PORT } from '@di/tokens';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { DomainEventProcessor } from '@application/services/domain-event-processor.service';
import type { Role } from '@domain/entities/role.entity';
import type { UpdateRolePatchContract } from '@domain/contracts/role.contract';

/**
 * Update Role Use Case
 *
 * @description
 * Application layer orchestrator that handles role updates with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with comprehensive validation for role update parameters.
 *
 * @responsibilities
 * - Validate application-level rules for role updates
 * - Delegate to domain repository for the actual update
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
export class UpdateRole {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly eventProcessor = inject(DomainEventProcessor);

  /**
   * Execute role update orchestration with validation and audit logging
   *
   * @param id - Role ID to update
   * @param patch - Partial update data
   * @param requesterId - ID of the user making the request (for audit logging)
   * @returns Promise resolving to the updated Role entity
   * @throws ApplicationError when validation fails or update fails
   */
  async execute(id: number, patch: UpdateRolePatchContract, requesterId?: number): Promise<Role> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(id, patch);

      // Step 2: Delegate to domain repository
      const updatedRole = await this.roleRepo.update(id, patch);

      // Step 3: Handle side effects
      await this.handleRoleUpdateSideEffects(id, patch, updatedRole, requesterId);

      return updatedRole;
    } catch (error: unknown) {
      // Step 4: Normalize errors for application layer
      throw new ApplicationError(
        'update_role',
        this.errorTransformer.transformError(error),
        'ROLE_UPDATE_FAILED'
      );
    }
  }

  /**
   * Validate application-level rules for role updates
   *
   * @description
   * Validates request parameters and business rules specific to the application layer.
   * Domain validation is handled by the repository layer.
   *
   * @param id Role ID to validate
   * @param patch Update patch to validate
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(id: number, patch: UpdateRolePatchContract): void {
    // Validate ID
    if (id === undefined || id === null) {
      throw new ApplicationError(
        'update_role',
        'Role ID is required for update',
        'INVALID_ROLE_ID'
      );
    }

    if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
      throw new ApplicationError(
        'update_role',
        'Role ID must be a positive integer',
        'INVALID_ROLE_ID_FORMAT'
      );
    }

    // Validate patch object
    if (!patch || typeof patch !== 'object') {
      throw new ApplicationError(
        'update_role',
        'Update patch is required for role update',
        'INVALID_UPDATE_PATCH'
      );
    }

    if (Object.keys(patch).length === 0) {
      throw new ApplicationError(
        'update_role',
        'Update patch must contain at least one property to update',
        'EMPTY_UPDATE_PATCH'
      );
    }

    // Validate name if provided
    if (patch.name !== undefined) {
      if (!patch.name || typeof patch.name !== 'string' || patch.name.trim().length === 0) {
        throw new ApplicationError(
          'update_role',
          'Role name cannot be empty or whitespace only',
          'INVALID_ROLE_NAME'
        );
      }

      if (patch.name.trim().length > 100) {
        throw new ApplicationError(
          'update_role',
          'Role name cannot exceed 100 characters',
          'ROLE_NAME_TOO_LONG'
        );
      }
    }

    // Validate access level if provided
    if (patch.accessLevel !== undefined) {
      console.log(
        'Validate access level if provided: ',
        patch.accessLevel,
        typeof patch.accessLevel
      );
      if (
        typeof patch.accessLevel !== 'number' ||
        !Number.isInteger(patch.accessLevel) ||
        patch.accessLevel < 0 ||
        patch.accessLevel > 5
      ) {
        throw new ApplicationError(
          'update_role',
          'Access level must be an integer between 0 and 5',
          'INVALID_ACCESS_LEVEL'
        );
      }
    }
  }

  /**
   * Handle side effects for successful role update
   *
   * @param id Role ID that was updated
   * @param patch The patch data that was applied
   * @param updatedRole The updated role entity
   * @param requesterId ID of user who performed the update
   */
  private async handleRoleUpdateSideEffects(
    id: number,
    patch: UpdateRolePatchContract,
    updatedRole: Role,
    requesterId?: number
  ): Promise<void> {
    // Process domain events from the updated role entity
    await this.eventProcessor.processEntityEvents(updatedRole);

    const timestamp = this.clock.nowEpochSeconds();
    const updatedFields = Object.keys(patch);

    console.log(`[AUDIT] Role update completed`, {
      timestamp,
      roleId: id,
      updatedFields,
      beforeUpdate: patch,
      afterUpdate: {
        id: updatedRole.id,
        name: updatedRole.name,
        accessLevel: updatedRole.accessLevel,
      },
      requesterId,
      operation: 'update_role',
      feature: 'roles',
      severity: 'MEDIUM',
    });
  }
}
