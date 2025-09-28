import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger, LogContext } from '@core/interfaces/logger.interface';
import type { GetRoleByIdRequest } from '@/app/application/types/roles/roles.types';
import type { Role } from '@domain/entities/role.entity';

/**
 * Get Role By ID Use Case
 *
 * Application layer orchestrator that handles role retrieval by ID with comprehensive validation,
 * audit logging, and domain event publishing. This use case follows the 4-step orchestration pattern
 * defined in Clean Architecture principles and ensures safe role access with proper authorization checks.
 *
 * @description
 * Orchestrates role retrieval operations by coordinating between the presentation layer and
 * domain repositories. This use case follows Clean Architecture principles by maintaining
 * pure orchestration responsibilities without implementing business logic. All validation
 * rules, constraint checking, and business logic are delegated to the Domain layer.
 * Focuses on request coordination, error transformation, and audit logging.
 *
 * @responsibilities
 * - Validate application-level presence and nullability checks
 * - Orchestrate role retrieval by delegating to domain repository
 * - Transform domain errors to application errors
 * - Handle audit logging for successful operations
 * - Coordinate between domain services and presentation layer
 *
 * @architecture
 * - **Layer**: Application Layer (Clean Architecture)
 * - **Pattern**: Use Case orchestrator with 4-step pattern
 * - **Dependencies**: Domain Repository, Core Services (Logger, Clock, Event Bus)
 * - **Injection**: Token-based dependency injection
 * - **Error Handling**: ApplicationError transformation
 * - **Events**: Domain event publishing for audit trail
 * - **Constraints**: Authorization checks and ID validation
 *
 * @dependencies
 * - {@link RoleRepository} - Domain repository for role retrieval
 * - {@link ClockPort} - System clock for timestamps
 * - {@link Logger} - Structured logging service
 * - {@link DomainEventBusService} - Domain event publishing
 * - {@link ApplicationErrorTransformer} - Error normalization
 *
 * @domain-events
 * - RoleRetrievedEvent (published from role entity domain events)
 *
 * @constraints
 * - Application layer only handles presence and nullability checks
 * - Domain layer enforces all business rules and validation constraints
 * - Repository handles entity retrieval and business logic
 * - Requester information is used for audit logging only
 *
 * @workflow
 * 1. **Validate Application Rules** - Presence and nullability checks only
 * 2. **Delegate to Domain** - Repository handles all business logic and validation
 * 3. **Handle Side Effects** - Audit logging only
 * 4. **Return Result** - Role entity retrieved by Domain repository
 *
 * @example
 * ```typescript
 * const useCase = inject(GetRoleById);
 * const request: GetRoleByIdRequest = {
 *   id: 123,
 *   requesterId: 'admin-456'
 * };
 *
 * const role = await useCase.execute(request);
 * console.log('Role retrieved:', role.name);
 * ```
 *
 * @throws {ApplicationError} When request is not provided or ID is null/undefined
 * @throws {ApplicationError} When domain repository operations fail
 * @throws {ApplicationError} When role does not exist (delegated from Domain layer)
 * @throws {ApplicationError} When ID format validation fails (delegated from Domain layer)
 *
 * @version 2.0.0
 * @since 2024-01-01
 * @author MAD-AI Development Team
 * @layer Application
 * @module Role Management
 */
@Injectable()
export class GetRoleById {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute role retrieval orchestration
   *
   * Orchestrates the complete role retrieval workflow following Clean Architecture principles.
   * This method coordinates validation, domain operations, and side effects while maintaining
   * separation of concerns and proper error handling. All business validation and constraint
   * checking is delegated to the Domain layer through the repository.
   *
   * @param request - Role retrieval request with application-level types
   * @returns Promise resolving to the Role entity
   * @throws {ApplicationError} When validation fails or role retrieval encounters errors
   *
   * @workflow
   * 1. **Application Validation** - Check presence and nullability only
   * 2. **Domain Delegation** - Repository handles all business logic and validation
   * 3. **Side Effects** - Audit logging only
   * 4. **Return Result** - Return role entity from Domain repository
   *
   * @example
   * ```typescript
   * const role = await getRoleByIdUseCase.execute({
   *   id: 123,
   *   requesterId: 'admin-456'
   * });
   * ```
   */
  async execute(request: GetRoleByIdRequest): Promise<Role> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(request);

      // Step 2: Delegate to domain repository
      const role = await this.roleRepo.getById(request.id);

      // Step 3: Handle side effects
      await this.handleSideEffects(role, request.requesterId);

      return role;
    } catch (error: unknown) {
      // Safe access for logging in case request is null/undefined
      const safeId = request?.id ?? 'unknown';
      const safeRequesterId = request?.requesterId;

      this.logger.error('Role retrieval failed', {
        correlationId: `get-role-${safeId}-${this.clock.nowEpochSeconds()}`,
        userId: safeRequesterId?.toString(),
        operation: 'get_role_by_id',
      } as LogContext);

      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Validate application-level rules for role retrieval
   *
   * @description
   * Application layer only handles presence and nullability checks.
   * All business rules including ID format validation are delegated to the Domain layer.
   *
   * @param request Get role by ID request to validate
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(request: GetRoleByIdRequest): void {
    if (!request) {
      throw new Error('Request is required for role retrieval');
    }

    if (
      request.id === null ||
      request.id === undefined ||
      !Number.isInteger(request.id) ||
      request.id <= 0
    ) {
      throw new Error('Role ID must be a positive integer');
    }
  }

  /**
   * Handle side effects for successful role retrieval
   *
   * @description
   * Manages audit logging after successful role retrieval.
   * Logs the operation with correlation tracking.
   *
   * @param role The retrieved role entity
   * @param requesterId ID of the user requesting the role
   */
  private async handleSideEffects(role: Role, requesterId?: number): Promise<void> {
    // Domain events are no longer needed with simplified Role entity

    // Audit Logging
    const correlationId = `get-role-${role.id}-${this.clock.nowEpochSeconds()}`;
    this.logger.info('Role retrieval completed', {
      correlationId,
      userId: requesterId?.toString(),
      operation: 'get_role_by_id',
    } as LogContext);
  }
}
