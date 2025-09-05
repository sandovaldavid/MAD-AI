import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, CLOCK_PORT, LOGGER_PORT, DOMAIN_EVENT_BUS_REPO } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { DomainEventBusService } from '@core/services/domain-event-bus.service';
import type { CreateRoleRequest } from '@application/types/roles.types';
import type { Role } from '@domain/entities/role.entity';

/**
 * Create Role Use Case
 *
 * Application layer orchestrator that handles role creation operations with comprehensive validation,
 * audit logging, and domain event publishing. This use case follows the 4-step orchestration pattern
 * defined in Clean Architecture principles.
 *
 * @description
 * Orchestrates the creation of new roles in the system by coordinating domain entities,
 * repositories, and cross-cutting concerns. Ensures data integrity, authorization, and
 * proper event publishing for audit and system integration purposes.
 *
 * @responsibilities
 * - Validate application-level authorization and business rules
 * - Transform application DTOs to domain objects
 * - Delegate role creation to domain repository
 * - Publish domain events for system integration
 * - Handle audit logging and error normalization
 * - Ensure transactional consistency
 *
 * @architecture
 * - **Layer**: Application Layer (Clean Architecture)
 * - **Pattern**: Use Case orchestrator with 4-step pattern
 * - **Dependencies**: Domain Repository, Core Services (Logger, Clock, Event Bus)
 * - **Injection**: Token-based dependency injection
 * - **Error Handling**: ApplicationError transformation
 * - **Events**: Domain event publishing for audit trail
 *
 * @dependencies
 * - {@link RoleRepository} - Domain repository for role persistence
 * - {@link ClockPort} - System clock for timestamps
 * - {@link Logger} - Structured logging service
 * - {@link DomainEventBusService} - Domain event publishing
 * - {@link ApplicationErrorTransformer} - Error normalization
 *
 * @domain-events
 * - RoleCreatedEvent (simulated via logger until real event bus integration)
 *
 * @workflow
 * 1. **Validate Application Rules** - Authorization and input validation
 * 2. **Delegate to Domain** - Repository handles business logic and persistence
 * 3. **Handle Side Effects** - Event publishing and audit logging
 * 4. **Return Result** - Domain entity with proper typing
 *
 * @example
 * ```typescript
 * const useCase = inject(CreateRole);
 * const request: CreateRoleRequest = {
 *   name: 'Project Manager',
 *   accessLevel: 3,
 *   description: 'Manages project execution',
 *   canLeadProjects: true,
 *   isUniquePerTeam: false,
 *   requesterId: 'user-123'
 * };
 *
 * const role = await useCase.execute(request);
 * console.log('Role created:', role.name);
 * ```
 *
 * @throws {ApplicationError} When validation fails or creation encounters business rule violations
 * @throws {ApplicationError} When authorization fails or requester lacks permissions
 * @throws {ApplicationError} When domain constraints are violated (duplicate names, invalid access levels)
 *
 * @version 2.0.0
 * @since 2024-01-01
 * @author MAD-AI Development Team
 * @layer Application
 * @module Role Management
 */
@Injectable({ providedIn: 'root' })
export class CreateRole {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly eventBus = inject<DomainEventBusService>(DOMAIN_EVENT_BUS_REPO);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute role creation orchestration
   *
   * Orchestrates the complete role creation workflow following Clean Architecture principles.
   * This method coordinates validation, domain operations, and side effects while maintaining
   * separation of concerns and proper error handling.
   *
   * @param request - Role creation request with application-level types
   * @returns Promise resolving to the created Role domain entity
   * @throws {ApplicationError} When validation fails or creation encounters errors
   *
   * @workflow
   * 1. **Application Validation** - Check authorization and input constraints
   * 2. **Domain Delegation** - Forward to repository for business logic execution
   * 3. **Side Effects** - Publish events and log audit information
   * 4. **Result Return** - Provide domain entity with proper typing
   *
   * @example
   * ```typescript
   * const role = await createRoleUseCase.execute({
   *   name: 'Senior Developer',
   *   accessLevel: 4,
   *   description: 'Experienced software developer',
   *   canLeadProjects: false,
   *   isUniquePerTeam: false,
   *   requesterId: 'admin-456'
   * });
   * ```
   */
  async execute(request: CreateRoleRequest): Promise<Role> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(request);

      // Step 2: Validate requester and map to domain contract
      if (!request.requesterId) {
        throw new ApplicationError(
          ApplicationErrorCode.INSUFFICIENT_PERMISSIONS,
          'Requester ID is required for role creation',
          'You must be authenticated to create roles'
        );
      }

      const createContract = {
        name: request.name,
        accessLevel: request.accessLevel,
        description: request.description,
        canLeadProjects: request.canLeadProjects,
        isUniquePerTeam: request.isUniquePerTeam,
        createdByUserId: request.requesterId,
      };

      const role = await this.roleRepo.create(createContract);

      // Step 3: Handle side effects
      await this.handleSideEffects(role, request.requesterId);

      return role;
    } catch (error: unknown) {
      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Validate application-level rules for role creation
   */
  private validateApplicationRules(request: CreateRoleRequest): void {
    if (!request?.name?.trim()) {
      throw this.errorTransformer.transform(new Error('Role name is required'));
    }

    if (request.name.length > 100) {
      throw this.errorTransformer.transform(new Error('Role name too long'));
    }
  }

  /**
   * Handle side effects for successful role creation
   */
  private async handleSideEffects(role: Role, requesterId?: number): Promise<void> {
    // Domain Events
    const events = role.getDomainEvents();
    if (events.length > 0) {
      await this.eventBus.publishAll(events);
      role.clearDomainEvents();
    }

    // Audit Logging
    const correlationId = `role-${role.id}-${this.clock.nowEpochSeconds()}`;
    this.logger.info('Role creation completed', {
      userId: requesterId?.toString(),
      operation: 'create_role',
      correlationId,
    });
  }
}
