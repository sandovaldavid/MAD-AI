import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, USER_REPOSITORY, CLOCK_PORT } from '@di/tokens';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { Role } from '@domain/entities/role.entity';
import type { User } from '@domain/entities/user.entity';

/**
 * Unassign Role from User Use Case
 *
 * @description
 * Application layer orchestrator that handles role unassignment from users with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with comprehensive validation for role unassignment operations.
 *
 * @responsibilities
 * - Validate application-level rules for role unassignments
 * - Ensure both user and role exist before attempting unassignment
 * - Delegate to domain repository for the actual unassignment
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
export class UnassignRoleFromUser {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute role unassignment orchestration with validation and audit logging
   *
   * @param input - Role unassignment request with userId and roleId
   * @param requesterId - ID of the user making the request (for audit logging)
   * @returns Promise resolving when unassignment is complete
   * @throws ApplicationError when validation fails or unassignment fails
   */
  async execute(input: { roleId: number; userId: number }, requesterId?: number): Promise<void> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(input);

      // Step 2: Validate entities exist and assignment is valid
      const { user, role } = await this.validateEntitiesForUnassignment(input);

      // Step 3: Delegate to domain repository for unassignment
      await this.roleRepo.unassign(input);

      // Step 4: Handle side effects
      this.handleRoleUnassignmentSideEffects(input, user, role, requesterId);
    } catch (error: unknown) {
      // Normalize errors for application layer
      throw new ApplicationError(
        'unassign_role_from_user',
        this.errorTransformer.transformError(error),
        'ROLE_UNASSIGNMENT_FAILED'
      );
    }
  }

  /**
   * Validate application-level rules for role unassignment
   *
   * @description
   * Validates request parameters and basic business rules specific to the application layer.
   * Domain validation is handled by the repository layer.
   *
   * @param input Role unassignment request to validate
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(input: { roleId: number; userId: number }): void {
    if (!input) {
      throw new ApplicationError(
        'unassign_role_from_user',
        'INVALID_UNASSIGNMENT_DATA',
        'Role unassignment data is required'
      );
    }

    if (input.userId === undefined || input.userId === null) {
      throw new ApplicationError(
        'unassign_role_from_user',
        'INVALID_USER_ID',
        'User ID is required for role unassignment'
      );
    }

    if (typeof input.userId !== 'number' || !Number.isInteger(input.userId) || input.userId <= 0) {
      throw new ApplicationError(
        'unassign_role_from_user',
        'INVALID_USER_ID_FORMAT',
        'User ID must be a positive integer'
      );
    }

    if (input.roleId === undefined || input.roleId === null) {
      throw new ApplicationError(
        'unassign_role_from_user',
        'INVALID_ROLE_ID',
        'Role ID is required for role unassignment'
      );
    }

    if (typeof input.roleId !== 'number' || !Number.isInteger(input.roleId) || input.roleId <= 0) {
      throw new ApplicationError(
        'unassign_role_from_user',
        'INVALID_ROLE_ID_FORMAT',
        'Role ID must be a positive integer'
      );
    }
  }

  /**
   * Validate entities exist and unassignment is valid
   *
   * @description
   * Fetches user and role entities and validates they exist and meet unassignment criteria.
   *
   * @param input Role unassignment request
   * @returns Promise resolving to validated user and role entities
   * @throws ApplicationError when entities don't exist or unassignment isn't valid
   */
  private async validateEntitiesForUnassignment(input: {
    roleId: number;
    userId: number;
  }): Promise<{ user: User; role: Role }> {
    // Fetch both entities in parallel for efficiency
    const [user, role] = await Promise.all([
      this.userRepo.getById(input.userId),
      this.roleRepo.getById(input.roleId),
    ]);

    // Validate user exists (repository should throw if not found, but we validate anyway)
    if (!user) {
      throw new ApplicationError(
        'unassign_role_from_user',
        'USER_NOT_FOUND',
        `User with ID ${input.userId} does not exist`
      );
    }

    // Validate role exists (repository should throw if not found, but we validate anyway)
    if (!role) {
      throw new ApplicationError(
        'unassign_role_from_user',
        'ROLE_NOT_FOUND',
        `Role with ID ${input.roleId} does not exist`
      );
    }

    // Prevent unassignment of critical system roles from system users
    if (role.name.toLowerCase() === 'administrator' && user.id === 1) {
      throw new ApplicationError(
        'unassign_role_from_user',
        'CANNOT_UNASSIGN_SYSTEM_ADMIN_ROLE',
        'Cannot unassign administrator role from system user for security reasons'
      );
    }

    return { user, role };
  }

  /**
   * Handle side effects of role unassignment
   *
   * @description
   * Manages audit logging and other side effects after successful role unassignment.
   * Uses high-precision timestamps for accurate audit trails.
   *
   * @param input The role unassignment request
   * @param user The user entity that lost the role
   * @param role The role entity that was unassigned
   * @param requesterId ID of user who performed the unassignment
   */
  private handleRoleUnassignmentSideEffects(
    input: { roleId: number; userId: number },
    user: User,
    role: Role,
    requesterId?: number
  ): void {
    const timestamp = this.clock.nowEpochSeconds();

    console.log(`[AUDIT] Role unassignment completed`, {
      timestamp,
      userId: input.userId,
      roleId: input.roleId,
      requesterId,
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
      operation: 'unassign_role_from_user',
      feature: 'roles',
      severity: 'MEDIUM',
    });
  }
}
