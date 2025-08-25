import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, USER_REPOSITORY, CLOCK_PORT } from '@di/tokens';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { DomainEventProcessor } from '@application/services/domain-event-processor.service';
import type { RoleAssignmentContract } from '@domain/contracts/role.contract';
import type { Role } from '@domain/entities/role.entity';
import type { User } from '@domain/entities/user.entity';

/**
 * Assign Role to User Use Case
 *
 * @description
 * Application layer orchestrator that handles role assignment to users with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with comprehensive validation for role assignment operations.
 *
 * @responsibilities
 * - Validate application-level rules for role assignments
 * - Ensure both user and role exist and are active
 * - Delegate to domain repository for the actual assignment
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
export class AssignRoleToUser {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly eventProcessor = inject(DomainEventProcessor);

  /**
   * Execute role assignment orchestration with validation and audit logging
   *
   * @param input - Role assignment contract with userId, roleId, and assignedByUserId
   * @returns Promise resolving when assignment is complete
   * @throws ApplicationError when validation fails or assignment fails
   */
  async execute(input: RoleAssignmentContract): Promise<void> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(input);

      // Step 2: Validate entities exist and are eligible for assignment
      const { user, role } = await this.validateEntitiesForAssignment(input);

      // Step 3: Delegate to domain repository for assignment
      await this.roleRepo.assign(input);

      // Step 4: Handle side effects
      await this.handleRoleAssignmentSideEffects(input, user, role);
    } catch (error: unknown) {
      // Normalize errors for application layer
      throw new ApplicationError(
        'assign_role_to_user',
        this.errorTransformer.transformError(error),
        'ROLE_ASSIGNMENT_FAILED'
      );
    }
  }

  /**
   * Validate application-level rules for role assignment
   *
   * @description
   * Validates request parameters and basic business rules specific to the application layer.
   * Domain validation is handled by the repository layer.
   *
   * @param input Role assignment contract to validate
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(input: RoleAssignmentContract): void {
    if (!input) {
      throw new ApplicationError(
        'assign_role_to_user',
        'INVALID_ASSIGNMENT_DATA',
        'Role assignment data is required'
      );
    }

    if (input.userId === undefined || input.userId === null) {
      throw new ApplicationError(
        'assign_role_to_user',
        'INVALID_USER_ID',
        'User ID is required for role assignment'
      );
    }

    if (typeof input.userId !== 'number' || !Number.isInteger(input.userId) || input.userId <= 0) {
      throw new ApplicationError(
        'assign_role_to_user',
        'INVALID_USER_ID_FORMAT',
        'User ID must be a positive integer'
      );
    }

    if (input.roleId === undefined || input.roleId === null) {
      throw new ApplicationError(
        'assign_role_to_user',
        'INVALID_ROLE_ID',
        'Role ID is required for role assignment'
      );
    }

    if (typeof input.roleId !== 'number' || !Number.isInteger(input.roleId) || input.roleId <= 0) {
      throw new ApplicationError(
        'assign_role_to_user',
        'INVALID_ROLE_ID_FORMAT',
        'Role ID must be a positive integer'
      );
    }

    if (input.assignedByUserId !== undefined && input.assignedByUserId !== null) {
      if (
        typeof input.assignedByUserId !== 'number' ||
        !Number.isInteger(input.assignedByUserId) ||
        input.assignedByUserId <= 0
      ) {
        throw new ApplicationError(
          'assign_role_to_user',
          'INVALID_ASSIGNED_BY_USER_ID_FORMAT',
          'Assigned by user ID must be a positive integer when provided'
        );
      }
    }
  }

  /**
   * Validate entities exist and are eligible for assignment
   *
   * @description
   * Fetches user and role entities and validates they exist and meet assignment criteria.
   *
   * @param input Role assignment contract
   * @returns Promise resolving to validated user and role entities
   * @throws ApplicationError when entities don't exist or aren't eligible
   */
  private async validateEntitiesForAssignment(
    input: RoleAssignmentContract
  ): Promise<{ user: User; role: Role }> {
    // Fetch both entities in parallel for efficiency
    const [user, role] = await Promise.all([
      this.userRepo.getById(input.userId),
      this.roleRepo.getById(input.roleId),
    ]);

    // Validate user is active
    if (!user.active) {
      throw new ApplicationError(
        'assign_role_to_user',
        'USER_NOT_ACTIVE',
        `User with ID ${input.userId} is not active and cannot be assigned roles`
      );
    }

    // Validate role is active
    if (!role.isActive) {
      throw new ApplicationError(
        'assign_role_to_user',
        'ROLE_NOT_ACTIVE',
        `Role '${role.name}' is not active and cannot be assigned to users`
      );
    }

    return { user, role };
  }

  /**
   * Handle side effects for successful role assignment
   *
   * @param input The role assignment input data
   * @param user The user entity that received the role
   * @param role The role entity that was assigned
   */
  private async handleRoleAssignmentSideEffects(
    input: RoleAssignmentContract,
    user: User,
    role: Role
  ): Promise<void> {
    // Process domain events from the user entity (role assignment events)
    await this.eventProcessor.processEntityEvents(user);

    const timestamp = this.clock.nowEpochSeconds();

    console.log(`[AUDIT] Role assignment completed`, {
      timestamp,
      userId: input.userId,
      roleId: input.roleId,
      assignedByUserId: input.assignedByUserId,
      user: {
        username: user.username,
        email: user.email,
        isActive: user.active,
      },
      role: {
        name: role.name,
        accessLevel: role.accessLevel,
        isActive: role.isActive,
      },
      operation: 'assign_role_to_user',
      feature: 'roles',
      severity: 'MEDIUM',
    });
  }
}
