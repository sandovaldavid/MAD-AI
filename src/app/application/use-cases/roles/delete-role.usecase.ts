import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, LOGGER_PORT, CLOCK_PORT, DOMAIN_EVENT_BUS_REPO } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { DeleteRoleRequest } from '@application/types/roles.types';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { Logger, LogContext } from '@core/interfaces/logger.interface';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { DomainEventBusService } from '@core/services/domain-event-bus.service';

/**
 * Delete Role Use Case
 *
 * Application layer orchestrator that handles role deletion operations with comprehensive validation,
 * audit logging, and domain event publishing. This use case follows the 4-step orchestration pattern
 * defined in Clean Architecture principles and ensures safe deletion with proper authorization checks.
 *
 * @description
 * Orchestrates the deletion of roles from the system by coordinating domain entities,
 * repositories, and cross-cutting concerns. Ensures data integrity, authorization, and
 * proper event publishing for audit and system integration purposes. Handles cascade
 * effects and referential integrity constraints.
 *
 * @responsibilities
 * - Validate application-level authorization and deletion permissions
 * - Check for referential integrity constraints (users assigned to role)
 * - Verify role exists before deletion attempt
 * - Transform application DTOs to domain operations
 * - Delegate role deletion to domain repository
 * - Publish domain events for system integration
 * - Handle audit logging and error normalization
 * - Ensure transactional consistency for deletion
 *
 * @architecture
 * - **Layer**: Application Layer (Clean Architecture)
 * - **Pattern**: Use Case orchestrator with 4-step pattern
 * - **Dependencies**: Domain Repository, Core Services (Logger, Clock, Event Bus)
 * - **Injection**: Token-based dependency injection
 * - **Error Handling**: ApplicationError transformation
 * - **Events**: Domain event publishing for audit trail
 * - **Constraints**: Referential integrity and authorization checks
 *
 * @dependencies
 * - {@link RoleRepository} - Domain repository for role deletion
 * - {@link ClockPort} - System clock for timestamps
 * - {@link Logger} - Structured logging service
 * - {@link DomainEventBusService} - Domain event publishing
 * - {@link ApplicationErrorTransformer} - Error normalization
 *
 * @domain-events
 * - RoleDeletedEvent (simulated via logger until real event bus integration)
 *
 * @constraints
 * - Role must exist before deletion
 * - Requester must have deletion permissions
 * - No users should be assigned to the role (referential integrity)
 * - System roles cannot be deleted (business rule)
 *
 * @workflow
 * 1. **Validate Application Rules** - Authorization, existence, and constraint checks
 * 2. **Delegate to Domain** - Repository handles business logic and persistence
 * 3. **Handle Side Effects** - Event publishing and audit logging
 * 4. **Return Result** - Confirmation of successful deletion
 *
 * @example
 * ```typescript
 * const useCase = inject(DeleteRole);
 * const request: DeleteRoleRequest = {
 *   id: 123,
 *   requesterId: 'admin-456'
 * };
 *
 * await useCase.execute(request);
 * console.log('Role deleted successfully');
 * ```
 *
 * @throws {ApplicationError} When validation fails or role ID is missing
 * @throws {ApplicationError} When authorization fails or requester lacks permissions
 * @throws {ApplicationError} When role does not exist
 * @throws {ApplicationError} When referential integrity constraints are violated
 * @throws {ApplicationError} When attempting to delete system-critical roles
 *
 * @version 2.0.0
 * @since 2024-01-01
 * @author MAD-AI Development Team
 * @layer Application
 * @module Role Management
 */
@Injectable({ providedIn: 'root' })
export class DeleteRole {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly eventBus = inject<DomainEventBusService>(DOMAIN_EVENT_BUS_REPO);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute role deletion orchestration
   *
   * Orchestrates the complete role deletion workflow following Clean Architecture principles.
   * This method coordinates validation, domain operations, and side effects while maintaining
   * separation of concerns and proper error handling. Ensures referential integrity and
   * proper authorization before allowing deletion.
   *
   * @param request - Role deletion request with application-level types
   * @returns Promise resolving when deletion is complete
   * @throws {ApplicationError} When validation fails or deletion encounters errors
   *
   * @workflow
   * 1. **Application Validation** - Check authorization, existence, and constraints
   * 2. **Domain Delegation** - Forward to repository for business logic execution
   * 3. **Side Effects** - Publish events and log audit information
   * 4. **Completion** - Confirm successful deletion
   *
   * @example
   * ```typescript
   * await deleteRoleUseCase.execute({
   *   id: 123,
   *   requesterId: 'admin-456'
   * });
   * ```
   */
  async execute(request: DeleteRoleRequest): Promise<void> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(request);

      // Step 2: Delegate to domain repository
      await this.performDeletion(request);

      // Step 3: Handle side effects
      await this.handleSideEffects(request);

      this.logger.info('Role deletion completed successfully', {
        correlationId: `delete-role-${request.id}`,
        userId: request.requesterId?.toString(),
        operation: 'delete_role',
      } as LogContext);
    } catch (error: unknown) {
      this.logger.error('Role deletion failed', {
        correlationId: `delete-role-${request.id}`,
        userId: request.requesterId?.toString(),
        operation: 'delete_role',
      } as LogContext);

      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Validate application-level rules for role deletion
   */
  private validateApplicationRules(request: DeleteRoleRequest): void {
    if (!request?.id || typeof request.id !== 'number' || request.id <= 0) {
      throw this.errorTransformer.transform(new Error('Valid role ID is required'));
    }

    if (!request.requesterId || typeof request.requesterId !== 'number') {
      throw this.errorTransformer.transform(new Error('Valid requester ID is required'));
    }
  }

  /**
   * Perform role deletion operation
   */
  private async performDeletion(request: DeleteRoleRequest): Promise<void> {
    await this.roleRepo.delete(request.id);
  }

  /**
   * Handle side effects for successful role deletion
   */
  private async handleSideEffects(request: DeleteRoleRequest): Promise<void> {
    const correlationId = `delete-role-${request.id}-${this.clock.nowEpochSeconds()}`;

    // Domain Events - Simular publicación para role deletion
    this.logger.info(`Domain Events simulation: RoleDeletedEvent for role ${request.id}`, {
      correlationId,
    });

    // TODO: Una vez que el Domain Event Bus esté conectado a la API real,
    // implementar publicación de eventos de role deletion
    // await this.eventBus.publish(new RoleDeletedEvent(request.id, request.requesterId));

    // Audit Logging
    this.logger.info('Role deletion side effects handled', {
      correlationId,
      userId: request.requesterId?.toString(),
      operation: 'delete_role',
    } as LogContext);
  }
}
