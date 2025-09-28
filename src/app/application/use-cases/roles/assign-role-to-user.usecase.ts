import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, USER_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { AssignRoleToUserRequest } from '@/app/application/types/roles/roles.types';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger, LogContext } from '@core/interfaces/logger.interface';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';

/**
 * @summary Assigns a role to a user.
 * @description This use case orchestrates the process of assigning a new role to an existing user,
 * following the principles of Clean Architecture. It ensures that both the user and the role exist,
 * delegates the business logic of changing the role to the user domain entity, and persists the change.
 *
 * @class AssignRoleToUser
 * @layer Application
 * @module Role Management
 *
 * @property {RoleRepository} roleRepo - The repository for role-related operations.
 * @property {UserRepository} userRepo - The repository for user-related operations.
 * @property {ClockPort} clock - The port for accessing the system clock.
 * @property {Logger} logger - The logger for recording application events.
 * @property {ApplicationErrorTransformer} errorTransformer - The transformer for application-specific errors.
 */
@Injectable()
export class AssignRoleToUser {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Orchestrates the role assignment process.
   * @param input The request object containing user, role, and assigner IDs.
   * @returns A promise that resolves when the operation is complete.
   * @throws {ApplicationError} If validation fails, or if the user or role cannot be found.
   *
   * @workflow
   * 1. **Validate Inputs**: Ensures all required IDs are present.
   * 2. **Fetch Entities**: Retrieves the user and role from their respective repositories.
   * 3. **Delegate Business Logic**: Calls the `changeRole` method on the User domain entity.
   * 4. **Persist Changes**: Saves the updated user information via the user repository.
   * 5. **Log Side-effect**: Records an audit log for the successful assignment.
   */
  async execute(input: AssignRoleToUserRequest): Promise<void> {
    const correlationId = `assign-role-${input?.userId || 'unknown'}-${
      input?.roleId || 'unknown'
    }-${this.clock.nowEpochSeconds()}`;

    try {
      this.validateApplicationRules(input);

      const user = await this.userRepo.getById(input.userId);
      if (!user) {
        throw new ApplicationError(
          ApplicationErrorCode.USER_NOT_FOUND,
          'User not found',
          'The specified user could not be found'
        );
      }

      const role = await this.roleRepo.getById(input.roleId);
      if (!role) {
        throw new ApplicationError(
          ApplicationErrorCode.ROLE_NOT_FOUND,
          'Role not found',
          'The specified role could not be found'
        );
      }

      user.changeRole(role);

      await this.userRepo.update(user.id, { roleId: role.id });

      await this.handleRoleAssignmentSideEffects(input);
    } catch (error: unknown) {
      this.logger.error('Role assignment failed', {
        correlationId,
        userId: input?.assignedByUserId?.toString() || 'unknown',
        operation: 'assign_role_to_user',
      } as LogContext);

      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Validates the presence of required data in the request.
   * @param input The role assignment request to validate.
   * @throws {Error} If the input or any required ID is null or undefined.
   */
  private validateApplicationRules(input: AssignRoleToUserRequest): void {
    if (
      !input ||
      input.userId === null ||
      input.userId === undefined ||
      input.roleId === null ||
      input.roleId === undefined ||
      input.assignedByUserId === null ||
      input.assignedByUserId === undefined
    ) {
      throw new Error('Role assignment data is required');
    }
  }

  /**
   * Handles side-effects, specifically logging, after a successful role assignment.
   * @param input The original request object used for logging context.
   */
  private async handleRoleAssignmentSideEffects(input: AssignRoleToUserRequest): Promise<void> {
    const timestamp = this.clock.nowEpochSeconds();
    const correlationId = `role-assign-${input.userId}-${input.roleId}-${timestamp}`;

    this.logger.info('Role assignment completed', {
      correlationId,
      userId: input.userId.toString(),
      operation: 'assign_role_to_user',
    } as LogContext);
  }
}
