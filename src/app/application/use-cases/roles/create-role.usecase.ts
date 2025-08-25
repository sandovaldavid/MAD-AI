import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, CLOCK_PORT } from '@di/tokens';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { DomainEventProcessor } from '@application/services/domain-event-processor.service';
import type { CreateRoleContract } from '@domain/contracts/role.contract';
import type { Role } from '@domain/entities/role.entity';

/**
 * Create Role Use Case
 *
 * @description
 * Application layer orchestrator that handles role creation with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with comprehensive validation for role specifications.
 *
 * @responsibilities
 * - Validate application-level rules for role creation
 * - Delegate to domain repository for the actual creation
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
export class CreateRole {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly eventProcessor = inject(DomainEventProcessor);

  /**
   * Execute role creation orchestration with validation and audit logging
   *
   * @param spec - Role creation specification
   * @param requesterId - ID of the user creating the role (for audit logging)
   * @returns Promise resolving to the created Role entity
   * @throws ApplicationError when validation fails or creation fails
   */
  async execute(spec: CreateRoleContract, requesterId?: number): Promise<Role> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(spec);

      // Step 2: Delegate to domain repository
      const role = await this.roleRepo.create(spec);

      // Step 3: Handle side effects
      await this.handleRoleCreationSideEffects(role, requesterId);

      return role;
    } catch (error: unknown) {
      throw new ApplicationError(
        'create_role',
        this.errorTransformer.transformError(error),
        'ROLE_CREATION_FAILED'
      );
    }
  }

  /**
   * Validate application-level rules for role creation
   *
   * @description
   * Validates request parameters and business rules specific to the application layer.
   * Domain validation is handled by the repository layer.
   *
   * @param spec Role creation specification to validate
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(spec: CreateRoleContract): void {
    if (!spec) {
      throw new ApplicationError(
        'create_role',
        'INVALID_ROLE_SPEC',
        'Role specification is required for creation'
      );
    }

    if (!spec.name || typeof spec.name !== 'string' || spec.name.trim().length === 0) {
      throw new ApplicationError(
        'create_role',
        'INVALID_ROLE_NAME',
        'Role name is required and must be a non-empty string'
      );
    }

    if (spec.name.trim().length > 100) {
      throw new ApplicationError(
        'create_role',
        'ROLE_NAME_TOO_LONG',
        'Role name cannot exceed 100 characters'
      );
    }

    if (
      spec.accessLevel !== undefined &&
      (typeof spec.accessLevel !== 'number' || spec.accessLevel < 1 || spec.accessLevel > 5)
    ) {
      throw new ApplicationError(
        'create_role',
        'INVALID_ACCESS_LEVEL',
        'Access level must be a number between 1 and 5'
      );
    }
  }

  /**
   * Handle side effects for successful role creation
   *
   * @description
   * Performs audit logging and other side effects after role creation.
   * Uses high-precision timestamps for accurate audit trails.
   *
   * @param role The created role entity
   * @param requesterId ID of user who performed the creation
   */
  private async handleRoleCreationSideEffects(role: Role, requesterId?: number): Promise<void> {
    // Process domain events from the created role entity
    await this.eventProcessor.processEntityEvents(role);

    const timestamp = this.clock.nowEpochSeconds();

    console.log(`[AUDIT] Role creation completed`, {
      timestamp,
      roleId: role.id,
      roleName: role.name,
      accessLevel: role.accessLevel,
      requesterId,
      operation: 'create_role',
      feature: 'roles',
      severity: 'MEDIUM',
    });
  }
}
