import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger, LogContext } from '@core/interfaces/logger.interface';
import type { DeactivateRoleRequest } from '@application/types/roles.types';
import type { Role } from '@domain/entities/role.entity';

/**
 * Deactivate Role Use Case
 *
 * Application layer orchestrator that handles role deactivation operations following
 * Clean Architecture principles. Provides pure orchestration between user requests
 * and domain operations without implementing business logic.
 *
 * @description
 * Orchestrates role deactivation by coordinating application-level validation,
 * domain delegation, and cross-cutting concerns. Serves as the entry point for
 * role deactivation operations while maintaining clean separation between
 * application orchestration and domain business logic.
 *
 * @responsibilities
 * - Validate application-level request parameters (presence/nullability)
 * - Coordinate authentication and authorization checks
 * - Delegate deactivation operations to domain repository
 * - Handle cross-cutting concerns (logging, error transformation)
 * - Orchestrate the complete deactivation workflow
 *
 * @architecture
 * - **Layer**: Application Layer (Clean Architecture)
 * - **Pattern**: Use Case orchestrator with 4-step pattern
 * - **Dependencies**: Domain Repository, Core Services (Logger, Clock)
 * - **Injection**: Token-based dependency injection
 * - **Error Handling**: ApplicationError transformation
 * - **Business Logic**: Delegated entirely to Domain layer
 *
 * @dependencies
 * - {@link RoleRepository} - Domain repository for role operations
 * - {@link ClockPort} - System clock for timestamps
 * - {@link Logger} - Structured logging service
 * - {@link ApplicationErrorTransformer} - Error normalization
 *
 * @constraints
 * - Request ID must be present (not null/undefined)
 * - Requester ID must be provided for authorization
 * - All business rules enforced by Domain layer
 *
 * @workflow
 * 1. **Validate Application Rules** - Parameter presence/nullability checks
 * 2. **Validate Authorization** - Check authentication requirements
 * 3. **Delegate to Domain** - Repository handles deactivation business logic
 * 4. **Handle Side Effects** - Logging and audit trail
 *
 * @example
 * ```typescript
 * const useCase = inject(DeactivateRoleUseCase);
 * const request: DeactivateRoleRequest = {
 *   id: 123,
 *   requesterId: 456
 * };
 *
 * const deactivatedRole = await useCase.execute(request);
 * ```
 *
 * @throws {ApplicationError} When request validation fails
 * @throws {ApplicationError} When authorization requirements not met
 * @throws {ApplicationError} When domain operation fails (transformed)
 *
 * @version 2.0.0
 * @since 2024-01-01
 * @author MAD-AI Development Team
 * @layer Application
 * @module Role Management
 */
@Injectable()
export class DeactivateRoleUseCase {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute role deactivation orchestration
   *
   * Orchestrates the complete role deactivation workflow following Clean Architecture
   * principles. This method provides pure orchestration between application concerns
   * and domain operations, ensuring proper separation of concerns and comprehensive
   * error handling.
   *
   * @param request - Role deactivation request with application-level types
   * @returns Promise resolving to the deactivated Role entity
   * @throws {ApplicationError} When validation or orchestration fails
   *
   * @workflow
   * 1. **Application Validation** - Parameter presence/nullability checks
   * 2. **Authorization Validation** - Authentication requirements
   * 3. **Domain Delegation** - Forward to repository for business logic
   * 4. **Side Effects** - Logging and audit trail management
   *
   * @example
   * ```typescript
   * const deactivatedRole = await deactivateRoleUseCase.execute({
   *   id: 123,
   *   requesterId: 456
   * });
   * ```
   */
  async execute(request: DeactivateRoleRequest): Promise<Role> {
    try {
      // Step 1: Validate application rules and authorization
      this.validateApplicationRules(request);
      await this.validateAuthorization(request.requesterId);

      // Step 2: Delegate to domain repository
      const role = await this.roleRepo.update(request.id, { isActive: false });

      // Step 3: Handle side effects
      await this.handleSideEffects(request);

      return role;
    } catch (error: unknown) {
      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Validate application-level rules for role deactivation
   *
   * @description
   * Validates request parameters at the application layer by checking for presence
   * and nullability only. All business rule validation (ID format, range checks, etc.)
   * is delegated to the Domain layer.
   *
   * @param request Deactivate role request to validate
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(request: DeactivateRoleRequest): void {
    if (
      !request ||
      request.id === null ||
      request.id === undefined ||
      !Number.isInteger(request.id) ||
      request.id <= 0
    ) {
      throw new Error('Invalid input provided: Valid role ID is required for deactivation');
    }
  }

  /**
   * Validate authorization for role deactivation
   *
   * @description
   * Validates that the requester has proper authorization to deactivate roles.
   * Ensures that the requester ID is provided and has deactivation permissions.
   *
   * @param requesterId ID of the user requesting role deactivation
   * @throws ApplicationError when authorization fails
   */
  private async validateAuthorization(requesterId?: number): Promise<void> {
    if (!requesterId) {
      throw new ApplicationError(
        ApplicationErrorCode.INSUFFICIENT_PERMISSIONS,
        'Requester ID is required for role deactivation',
        'You must be authenticated to deactivate roles'
      );
    }
  }

  /**
   * Handle side effects for successful role deactivation
   *
   * @description
   * Manages audit logging after successful role deactivation.
   * Logs the deactivation operation with correlation tracking.
   *
   * @param request The deactivate role request
   */
  private async handleSideEffects(request: DeactivateRoleRequest): Promise<void> {
    const correlationId = `role-deactivate-${request.id}-${this.clock.nowEpochSeconds()}`;

    this.logger.info('Role deactivated', {
      correlationId,
      userId: request.requesterId?.toString(),
      operation: 'deactivate_role',
    } as LogContext);
  }
}
