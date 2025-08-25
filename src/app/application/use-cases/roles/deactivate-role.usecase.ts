import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, CLOCK_PORT } from '@di/tokens';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { DomainEventProcessor } from '@application/services/domain-event-processor.service';
import type { Role } from '@domain/entities/role.entity';

/**
 * Deactivate Role Use Case
 *
 * @description
 * Application layer orchestrator that handles role deactivation with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with comprehensive validation for role deactivation operations.
 *
 * @responsibilities
 * - Validate application-level rules for role deactivation
 * - Delegate to domain repository for the actual deactivation
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
export class DeactivateRole {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly eventProcessor = inject(DomainEventProcessor);

  /**
   * Execute role deactivation orchestration with validation and audit logging
   *
   * @param id - Role ID to deactivate
   * @param requesterId - ID of the user making the request (for audit logging)
   * @returns Promise resolving to the deactivated Role entity
   * @throws ApplicationError when validation fails or deactivation fails
   */
  async execute(id: number, requesterId?: number): Promise<Role> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(id);

      // Step 2: Get current role state and validate for deactivation
      const currentRole = await this.validateRoleForDeactivation(id);

      // Step 3: Delegate to domain repository for deactivation
      const deactivatedRole = await this.roleRepo.update(id, { isActive: false });

      // Step 4: Handle side effects
      await this.handleRoleDeactivationSideEffects(id, currentRole, deactivatedRole, requesterId);

      return deactivatedRole;
    } catch (error: unknown) {
      // Normalize errors for application layer
      throw new ApplicationError(
        'deactivate_role',
        this.errorTransformer.transformError(error),
        'ROLE_DEACTIVATION_FAILED'
      );
    }
  }

  /**
   * Validate application-level rules for role deactivation
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
        'deactivate_role',
        'INVALID_ROLE_ID',
        'Role ID is required for deactivation'
      );
    }

    if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
      throw new ApplicationError(
        'deactivate_role',
        'INVALID_ROLE_ID_FORMAT',
        'Role ID must be a positive integer'
      );
    }
  }

  /**
   * Validate role can be deactivated
   *
   * @description
   * Fetches the role and validates it can be deactivated according to business rules.
   * Prevents deactivation of already inactive roles and administrator role.
   *
   * @param id Role ID to validate
   * @returns Promise resolving to the current Role entity
   * @throws ApplicationError when role cannot be deactivated
   */
  private async validateRoleForDeactivation(id: number): Promise<Role> {
    const role = await this.roleRepo.getById(id);

    if (!role.isActive) {
      throw new ApplicationError(
        'deactivate_role',
        'ROLE_ALREADY_INACTIVE',
        `Role '${role.name}' is already inactive and does not need deactivation`
      );
    }

    // Prevent deactivation of critical system roles (like Administrator)
    if (role.name.toLowerCase() === 'administrator' || role.accessLevel >= 1000) {
      throw new ApplicationError(
        'deactivate_role',
        'CANNOT_DEACTIVATE_ADMIN_ROLE',
        `Administrator role '${role.name}' cannot be deactivated for system security`
      );
    }

    return role;
  }

  /**
   * Handle side effects for successful role deactivation
   *
   * @description
   * Manages audit logging and other side effects after successful role deactivation.
   * Uses high-precision timestamps for accurate audit trails.
   *
   * @param id The deactivated role ID
   * @param currentRole The role state before deactivation
   * @param deactivatedRole The role state after deactivation
   * @param requesterId ID of user who performed the deactivation
   */
  private async handleRoleDeactivationSideEffects(
    id: number,
    currentRole: Role,
    deactivatedRole: Role,
    requesterId?: number
  ): Promise<void> {
    // Process domain events from the deactivated role entity
    await this.eventProcessor.processEntityEvents(deactivatedRole);

    const timestamp = this.clock.nowEpochSeconds();

    console.log(`[AUDIT] Role deactivation completed`, {
      timestamp,
      roleId: id,
      role: {
        name: deactivatedRole.name,
        accessLevel: deactivatedRole.accessLevel,
        wasActive: currentRole.isActive,
        nowActive: deactivatedRole.isActive,
      },
      requesterId,
      operation: 'deactivate_role',
      feature: 'roles',
      severity: 'MEDIUM',
    });
  }
}
