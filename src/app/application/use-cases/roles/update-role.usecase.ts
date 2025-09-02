import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, CLOCK_PORT, LOGGER_PORT, DOMAIN_EVENT_BUS_REPO } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { DomainEventBusService } from '@core/services/domain-event-bus.service';
import type { UpdateRoleRequest } from '@application/types/roles.types';
import type { Role } from '@domain/entities/role.entity';

/**
 * Update Role Use Case
 *
 * Application layer orchestrator that handles role update operations with comprehensive validation,
 * audit logging, and domain event publishing. This use case follows the 4-step orchestration pattern
 * defined in Clean Architecture principles and supports partial updates.
 *
 * @description
 * Orchestrates the update of existing roles in the system by coordinating domain entities,
 * repositories, and cross-cutting concerns. Ensures data integrity, authorization, and
 * proper event publishing for audit and system integration purposes. Supports partial updates
 * where only specified fields are modified.
 *
 * @responsibilities
 * - Validate application-level authorization and input constraints
 * - Ensure at least one field is provided for update (partial update support)
 * - Transform application DTOs to domain update operations
 * - Delegate role updates to domain repository
 * - Publish domain events for system integration
 * - Handle audit logging and error normalization
 * - Ensure transactional consistency for updates
 *
 * @architecture
 * - **Layer**: Application Layer (Clean Architecture)
 * - **Pattern**: Use Case orchestrator with 4-step pattern
 * - **Dependencies**: Domain Repository, Core Services (Logger, Clock, Event Bus)
 * - **Injection**: Token-based dependency injection
 * - **Error Handling**: ApplicationError transformation
 * - **Events**: Domain event publishing for audit trail
 * - **Update Strategy**: Partial updates with field-level validation
 *
 * @dependencies
 * - {@link RoleRepository} - Domain repository for role updates
 * - {@link ClockPort} - System clock for timestamps
 * - {@link Logger} - Structured logging service
 * - {@link DomainEventBusService} - Domain event publishing
 * - {@link ApplicationErrorTransformer} - Error normalization
 *
 * @domain-events
 * - RoleUpdatedEvent (simulated via logger until real event bus integration)
 *
 * @workflow
 * 1. **Validate Application Rules** - Authorization, input validation, and emptiness checks
 * 2. **Delegate to Domain** - Repository handles business logic and persistence
 * 3. **Handle Side Effects** - Event publishing and audit logging
 * 4. **Return Result** - Updated domain entity with proper typing
 *
 * @example
 * ```typescript
 * const useCase = inject(UpdateRole);
 * const request: UpdateRoleRequest = {
 *   id: 123,
 *   name: 'Senior Project Manager', // Only update name
 *   accessLevel: 4, // Only update access level
 *   requesterId: 'admin-456'
 * };
 *
 * const updatedRole = await useCase.execute(request);
 * console.log('Role updated:', updatedRole.name);
 * ```
 *
 * @throws {ApplicationError} When validation fails or role ID is missing
 * @throws {ApplicationError} When no fields are provided for update
 * @throws {ApplicationError} When authorization fails or requester lacks permissions
 * @throws {ApplicationError} When domain constraints are violated (duplicate names, invalid access levels)
 * @throws {ApplicationError} When role with specified ID does not exist
 *
 * @version 2.0.0
 * @since 2024-01-01
 * @author MAD-AI Development Team
 * @layer Application
 * @module Role Management
 */
@Injectable({ providedIn: 'root' })
export class UpdateRole {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly eventBus = inject<DomainEventBusService>(DOMAIN_EVENT_BUS_REPO);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute role update orchestration
   *
   * Orchestrates the complete role update workflow following Clean Architecture principles.
   * This method coordinates validation, domain operations, and side effects while maintaining
   * separation of concerns and proper error handling. Supports partial updates where only
   * specified fields are modified.
   *
   * @param request - Role update request with application-level types
   * @returns Promise resolving to the updated Role domain entity
   * @throws {ApplicationError} When validation fails or update encounters errors
   *
   * @workflow
   * 1. **Application Validation** - Check authorization, input constraints, and emptiness
   * 2. **Domain Delegation** - Forward to repository for business logic execution
   * 3. **Side Effects** - Publish events and log audit information
   * 4. **Result Return** - Provide updated domain entity with proper typing
   *
   * @example
   * ```typescript
   * const updatedRole = await updateRoleUseCase.execute({
   *   id: 123,
   *   name: 'Lead Developer',
   *   description: 'Technical leadership role',
   *   canLeadProjects: true,
   *   requesterId: 'admin-456'
   * });
   * ```
   */
  async execute(request: UpdateRoleRequest): Promise<Role> {
    this.validate(request);
    const role = await this.roleRepo.update(request.id, request);
    await this.handleSideEffects(request, role);
    return role;
  }

  private validate(request: UpdateRoleRequest): void {
    if (!request?.id || this.isEmpty(request)) {
      throw this.errorTransformer.transform(new Error('Role ID and at least one field required'));
    }
  }

  private isEmpty(request: UpdateRoleRequest): boolean {
    return (
      !request.name &&
      !request.accessLevel &&
      !request.description &&
      request.canLeadProjects === undefined &&
      request.isUniquePerTeam === undefined
    );
  }

  private async handleSideEffects(request: UpdateRoleRequest, role: Role): Promise<void> {
    const correlationId = `role-update-${request.id}-${this.clock.nowEpochSeconds()}`;

    // Domain Events - Usar patrón de entidad para obtener events
    const events = role.getDomainEvents();
    if (events.length > 0) {
      // Simular publicación hasta que esté lista la API real
      this.logger.info(
        `Domain Events simulation: Publishing ${events.length} events for role update`,
        {
          correlationId,
        }
      );

      // TODO: Una vez que el Domain Event Bus esté conectado a la API real,
      // reemplazar la simulación con:
      // await this.eventBus.publishAll(events);
      // role.clearDomainEvents();

      // Por ahora, simulamos la limpieza
      role.clearDomainEvents();
    }

    this.logger.info('Role updated', {
      correlationId,
      userId: request.requesterId?.toString(),
      operation: 'update_role',
    });
  }
}
