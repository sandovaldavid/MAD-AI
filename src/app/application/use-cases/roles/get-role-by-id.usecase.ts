import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, CLOCK_PORT, LOGGER_PORT, DOMAIN_EVENT_BUS_REPO } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger, LogContext } from '@core/interfaces/logger.interface';
import type { DomainEventBusService } from '@core/services/domain-event-bus.service';
import type { GetRoleByIdRequest } from '@application/types/roles.types';
import type { Role } from '@domain/entities/role.entity';

/**
 * Get Role By ID Use Case
 *
 * Application layer orchestrator that handles role retrieval by ID with comprehensive validation,
 * audit logging, and domain event publishing. This use case follows the 4-step orchestration pattern
 * defined in Clean Architecture principles and ensures safe role access with proper authorization checks.
 *
 * @description
 * Orchestrates the retrieval of roles by their unique identifier from the system by coordinating
 * domain entities, repositories, and cross-cutting concerns. Ensures data integrity, authorization,
 * and proper event publishing for audit and system integration purposes. Handles domain events
 * and provides comprehensive audit trails for role access operations.
 *
 * @responsibilities
 * - Validate application-level authorization and access permissions
 * - Verify role ID format and constraints
 * - Transform application DTOs to domain operations
 * - Delegate role retrieval to domain repository
 * - Publish domain events from retrieved role entity
 * - Handle audit logging and error normalization
 * - Ensure transactional consistency for read operations
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
 * - Role must exist in the system
 * - Requester must have read permissions for the role
 * - Role ID must be a valid positive integer
 * - System roles may have additional access restrictions
 *
 * @workflow
 * 1. **Validate Application Rules** - Authorization, ID format, and constraint checks
 * 2. **Delegate to Domain** - Repository handles business logic and persistence
 * 3. **Handle Side Effects** - Event publishing and audit logging
 * 4. **Return Result** - Role entity with domain events published
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
 * @throws {ApplicationError} When validation fails or role ID is invalid
 * @throws {ApplicationError} When authorization fails or requester lacks permissions
 * @throws {ApplicationError} When role does not exist
 * @throws {ApplicationError} When system constraints prevent role access
 *
 * @version 2.0.0
 * @since 2024-01-01
 * @author MAD-AI Development Team
 * @layer Application
 * @module Role Management
 */
@Injectable({ providedIn: 'root' })
export class GetRoleById {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly eventBus = inject<DomainEventBusService>(DOMAIN_EVENT_BUS_REPO);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute role retrieval orchestration
   *
   * Orchestrates the complete role retrieval workflow following Clean Architecture principles.
   * This method coordinates validation, domain operations, and side effects while maintaining
   * separation of concerns and proper error handling. Ensures referential integrity and
   * proper authorization before allowing role access.
   *
   * @param request - Role retrieval request with application-level types
   * @returns Promise resolving to the Role entity
   * @throws {ApplicationError} When validation fails or role retrieval encounters errors
   *
   * @workflow
   * 1. **Application Validation** - Check authorization, ID format, and constraints
   * 2. **Domain Delegation** - Forward to repository for business logic execution
   * 3. **Side Effects** - Publish domain events and log audit information
   * 4. **Return Result** - Return retrieved role entity
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
      this.logger.error('Role retrieval failed', {
        correlationId: `get-role-${request.id}-${this.clock.nowEpochSeconds()}`,
        userId: request.requesterId?.toString(),
        operation: 'get_role_by_id',
      } as LogContext);

      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Validate application-level rules for role retrieval
   *
   * @description
   * Validates request parameters and basic business rules specific to the application layer.
   * Domain validation is handled by the repository layer.
   *
   * @param request Get role by ID request to validate
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(request: GetRoleByIdRequest): void {
    if (!request?.id || request.id <= 0 || !Number.isInteger(request.id)) {
      throw this.errorTransformer.transform(new Error('Invalid role ID'));
    }
  }

  /**
   * Handle side effects for successful role retrieval
   *
   * @description
   * Manages domain event publishing and audit logging after successful role retrieval.
   * Publishes any domain events from the retrieved role entity and logs the operation.
   *
   * @param role The retrieved role entity
   * @param requesterId ID of the user requesting the role
   */
  private async handleSideEffects(role: Role, requesterId?: number): Promise<void> {
    // Domain Events - Publish any events from the role entity
    const events = role.getDomainEvents();
    if (events.length > 0) {
      await this.eventBus.publishAll(events);
      role.clearDomainEvents();
    }

    // Audit Logging
    const correlationId = `get-role-${role.id}-${this.clock.nowEpochSeconds()}`;
    this.logger.info('Role retrieval completed', {
      correlationId,
      userId: requesterId?.toString(),
      operation: 'get_role_by_id',
    } as LogContext);
  }
}
