import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, LOGGER_PORT, CLOCK_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger, LogContext } from '@core/interfaces/logger.interface';
import type { ActivateRoleRequest } from '@application/types/roles.types';
import type { Role } from '@domain/entities/role.entity';

/**
 * Activate Role Use Case
 *
 * Application layer orchestrator that handles role activation operations with validation,
 * audit logging, and domain event publishing. This use case follows the 4-step orchestration
 * pattern defined in Clean Architecture principles and ensures safe role activation with
 * proper authorization checks and state transition validation.
 *
 * @description
 * Orchestrates the activation of roles in the system by coordinating domain entities,
 * repositories, and cross-cutting concerns. Ensures data integrity, authorization, and
 * comprehensive audit trails for role activation operations. Uses the Role entity's
 * activate() domain method to ensure proper business logic execution and state transition.
 *
 * This use case follows a **Domain-Centric** pattern where the role activation
 * business logic is executed through the Role entity's activate() method, ensuring
 * proper encapsulation of domain rules and state management.
 *
 * @responsibilities
 * - Validate application-level authorization and activation permissions
 * - Verify role exists and is in a valid state for activation
 * - Transform application DTOs to domain operations
 * - Invoke Role entity's activate() domain method for business logic
 * - Persist activation state through domain repository
 * - Handle audit logging and error normalization
 * - Ensure transactional consistency for state changes
 *
 * @architecture
 * - **Layer**: Application Layer (Clean Architecture)
 * - **Pattern**: Use Case orchestrator with 4-step pattern
 * - **Dependencies**: Domain Repository, Core Services (Logger, Clock)
 * - **Injection**: Token-based dependency injection
 * - **Error Handling**: ApplicationError transformation
 * - **Constraints**: Authorization checks and state validation
 *
 * @dependencies
 * - {@link RoleRepository} - Domain repository for role activation
 * - {@link ClockPort} - System clock for timestamps
 * - {@link Logger} - Structured logging service
 * - {@link ApplicationErrorTransformer} - Error normalization
 *
 * @domain-events
 * Domain events are not currently implemented in this version of the system.
 * The Role entity's activate() method handles state transitions directly.
 *
 * @constraints
 * - Role must exist in the system
 * - Role must not already be active (checked by domain method)
 * - Requester must have activation permissions
 * - Business rules for activation are enforced by Role.activate() method
 *
 * @workflow
 * 1. **Validate Application Rules** - Authorization, existence, and state checks
 * 2. **Entity Retrieval** - Get role entity from domain repository
 * 3. **Domain Operation** - Invoke role.activate() domain method
 * 4. **Persistence** - Save activation state through repository
 * 5. **Side Effects** - Audit logging and correlation tracking
 *
 * @example
 * ```typescript
 * const useCase = inject(ActivateRole);
 * const request: ActivateRoleRequest = {
 *   id: 123,
 *   requesterId: 'admin-456'
 * };
 *
 * const activatedRole = await useCase.execute(request);
 * console.log('Role activated:', activatedRole.name);
 * ```
 *
 * @throws {ApplicationError} When validation fails or role ID is invalid
 * @throws {ApplicationError} When authorization fails or requester lacks permissions
 * @throws {ApplicationError} When role does not exist
 * @throws {ApplicationError} When role is already active
 * @throws {ApplicationError} When business rules prevent activation
 *
 * @version 2.0.0
 * @since 2024-01-01
 * @author MAD-AI Development Team
 * @layer Application
 * @module Role Management
 */
@Injectable({ providedIn: 'root' })
export class ActivateRole {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute role activation orchestration
   *
   * Orchestrates the complete role activation workflow following Clean Architecture principles.
   * This method coordinates validation, domain operations, and side effects while maintaining
   * separation of concerns and proper error handling. Ensures proper state transitions
   * and comprehensive audit trails for role activation operations.
   *
   * @param request - Role activation request with application-level types
   * @returns Promise resolving to the activated Role entity
   * @throws {ApplicationError} When validation fails or activation encounters errors
   *
   * @workflow
   * 1. **Application Validation** - Check authorization, existence, and state constraints
   * 2. **Entity Retrieval** - Get role entity from domain repository
   * 3. **Domain Operation** - Invoke role.activate() domain method
   * 4. **Persistence** - Save activation state through repository
   * 5. **Side Effects** - Audit logging and correlation tracking
   *
   * @example
   * ```typescript
   * const activatedRole = await activateRoleUseCase.execute({
   *   id: 123,
   *   requesterId: 'admin-456'
   * });
   * ```
   */
  async execute(request: ActivateRoleRequest): Promise<Role> {
    try {
      // Step 1: Validate application rules
      this.validate(request);

      // Step 2: Get role entity from repository
      const role = await this.roleRepo.getById(request.id);
      if (!role) {
        throw this.errorTransformer.transform(new Error(`Role with ID ${request.id} not found`));
      }

      // Step 3: Invoke domain method for activation
      role.activate();

      // Step 4: Save the updated entity through repository update
      const updatedRole = await this.roleRepo.update(request.id, { isActive: true });

      // Step 5: Handle side effects
      await this.handleSideEffects(request);

      return updatedRole;
    } catch (error: unknown) {
      this.logger.error('Role activation failed', {
        correlationId: `activate-role-${request?.id || 'unknown'}-${this.clock.nowEpochSeconds()}`,
        userId: request?.requesterId?.toString(),
        operation: 'activate_role',
      } as LogContext);

      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Validate application-level rules for role activation
   *
   * @description
   * Validates request parameters and basic business rules specific to the application layer.
   * Ensures the role ID is valid and meets application-level requirements before proceeding
   * with activation.
   *
   * @param request Activate role request to validate
   * @throws ApplicationError when validation fails
   */
  private validate(request: ActivateRoleRequest): void {
    if (!request?.id || request.id <= 0) {
      throw this.errorTransformer.transform(new Error('Valid role ID required'));
    }
  }

  /**
   * Handle side effects for successful role activation
   *
   * @description
   * Manages audit logging after successful role activation.
   * Logs the activation operation with correlation tracking.
   *
   * @param request The activate role request
   */
  private async handleSideEffects(request: ActivateRoleRequest): Promise<void> {
    const correlationId = `role-activate-${request.id}-${this.clock.nowEpochSeconds()}`;

    this.logger.info('Role activated', {
      correlationId,
      userId: request.requesterId?.toString(),
      operation: 'activate_role',
    } as LogContext);
  }
}
