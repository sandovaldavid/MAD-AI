import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, USER_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { AssignRoleToUserRequest } from '@application/types/roles.types';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger, LogContext } from '@core/interfaces/logger.interface';

/**
 * Assign Role to User Use Case
 *
 * Application layer orchestrator that handles role assignment operations following
 * Clean Architecture principles. Provides pure orchestration between user requests
 * and domain operations without implementing business logic.
 *
 * @description
 * Orchestrates role assignment by coordinating application-level validation,
 * domain delegation, and cross-cutting concerns. Serves as the entry point for
 * role assignment operations while maintaining clean separation between
 * application orchestration and domain business logic.
 *
 * @responsibilities
 * - Validate application-level request parameters (presence/nullability)
 * - Coordinate authentication and authorization requirements
 * - Delegate role assignment operations to domain repository
 * - Handle cross-cutting concerns (logging, error transformation)
 * - Orchestrate the complete assignment workflow
 *
 * @architecture
 * - **Layer**: Application Layer (Clean Architecture)
 * - **Pattern**: Use Case orchestrator with 4-step pattern
 * - **Dependencies**: Domain Repositories, Core Services (Logger, Clock)
 * - **Injection**: Token-based dependency injection
 * - **Error Handling**: ApplicationError transformation
 * - **Business Logic**: Delegated entirely to Domain layer
 *
 * @dependencies
 * - {@link RoleRepository} - Domain repository for role assignment operations
 * - {@link UserRepository} - Domain repository for user operations
 * - {@link ClockPort} - System clock for timestamps and correlation IDs
 * - {@link Logger} - Structured logging service
 * - {@link ApplicationErrorTransformer} - Error normalization
 *
 * @constraints
 * - Request parameters must be present (not null/undefined)
 * - All business rules enforced by Domain layer
 *
 * @workflow
 * 1. **Validate Application Rules** - Parameter presence/nullability checks
 * 2. **Delegate to Domain** - Repository handles assignment business logic
 * 3. **Handle Side Effects** - Logging and audit trail
 *
 * @example
 * ```typescript
 * const useCase = inject(AssignRoleToUser);
 * const request: AssignRoleToUserRequest = {
 *   userId: 456,
 *   roleId: 123,
 *   assignedByUserId: 789
 * };
 *
 * await useCase.execute(request);
 * ```
 *
 * @throws {ApplicationError} When request validation fails
 * @throws {ApplicationError} When domain operation fails (transformed)
 *
 * @version 2.0.0
 * @since 2024-01-01
 * @author MAD-AI Development Team
 * @layer Application
 * @module Role Management
 */
@Injectable({ providedIn: 'root' })
export class AssignRoleToUser {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  // Domain event bus removed as part of refactor
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute role assignment orchestration
   *
   * Orchestrates the complete role assignment workflow following Clean Architecture principles.
   * This method coordinates validation, domain operations, and side effects while maintaining
   * separation of concerns and proper error handling. Ensures proper user-role relationship
   * management and comprehensive audit trails for role assignment operations.
   *
   * @param input - Role assignment request with application-level types
   * @returns Promise resolving when assignment is complete
   * @throws {ApplicationError} When validation fails or assignment encounters errors
   *
   * @workflow
   * 1. **Application Validation** - Check authorization, existence, and constraint validation
   * 2. **Domain Orchestration** - Retrieve entities and delegate to domain business logic
   * 3. **Persistence** - Save changes through domain repository
   * 4. **Side Effects** - Log comprehensive audit information
   *
   * @example
   * ```typescript
   * const request: AssignRoleToUserRequest = {
   *   userId: 456,
   *   roleId: 123,
   *   assignedByUserId: 'admin-789'
   * };
   *
   * await assignRoleToUserUseCase.execute(request);
   * ```
   */
  async execute(input: AssignRoleToUserRequest): Promise<void> {
    const correlationId = `assign-role-${input?.userId || 'unknown'}-${input?.roleId || 'unknown'}-${this.clock.nowEpochSeconds()}`;

    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(input);

      // Step 2: Delegate to domain repository for role assignment
      await this.roleRepo.assign({
        userId: input.userId,
        roleId: input.roleId,
        assignedByUserId: input.assignedByUserId,
      });

      // Step 3: Handle side effects
      await this.handleRoleAssignmentSideEffects(input);
    } catch (error: unknown) {
      this.logger.error('Role assignment failed', {
        correlationId,
        userId: input?.assignedByUserId?.toString() || 'unknown',
        operation: 'assign_role_to_user',
        error: error instanceof Error ? error.message : 'Unknown error',
      } as LogContext);

      // Normalize errors for application layer
      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Validate application-level rules for role assignment
   *
   * @description
   * Validates request parameters at the application layer by checking for presence
   * and nullability only. All business rule validation (ID format, range checks, etc.)
   * is delegated to the Domain layer.
   *
   * @param input Role assignment request to validate
   * @throws ApplicationError when validation fails or required data is missing
   *
   * @validation-rules
   * - Request object must be provided
   * - userId must be present (not null/undefined)
   * - roleId must be present (not null/undefined)
   * - assignedByUserId must be present (not null/undefined) for audit tracking
   */
  private validateApplicationRules(input: AssignRoleToUserRequest): void {
    if (!input) {
      throw this.errorTransformer.transform(new Error('Role assignment request is required'));
    }

    if (input.userId === null || input.userId === undefined) {
      throw this.errorTransformer.transform(new Error('User ID is required for role assignment'));
    }

    if (input.roleId === null || input.roleId === undefined) {
      throw this.errorTransformer.transform(new Error('Role ID is required for role assignment'));
    }

    if (input.assignedByUserId === null || input.assignedByUserId === undefined) {
      throw this.errorTransformer.transform(
        new Error('Assigned by user ID is required for audit tracking')
      );
    }
  }

  /**
   * Handle side effects for successful role assignment
   *
   * @description
   * Manages comprehensive audit logging after successful role assignment.
   * Logs the operation with correlation tracking for audit and monitoring purposes.
   * Ensures proper logging consistency and audit trail maintenance.
   *
   * @param input The role assignment input data
   *
   * @side-effects
   * - Logs assignment operation with correlation ID
   * - Tracks assignment metadata for audit purposes
   */
  private async handleRoleAssignmentSideEffects(input: AssignRoleToUserRequest): Promise<void> {
    const timestamp = this.clock.nowEpochSeconds();
    const correlationId = `role-assign-${input.userId}-${input.roleId}-${timestamp}`;

    this.logger.info('Role assignment completed', {
      correlationId,
      userId: input.userId.toString(),
      roleId: input.roleId.toString(),
      assignedBy: input.assignedByUserId.toString(),
      operation: 'assign_role_to_user',
    } as LogContext);
  }
}
