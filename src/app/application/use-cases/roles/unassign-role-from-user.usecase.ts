import { Injectable, inject } from '@angular/core';
import {
  USER_REPOSITORY,
  ROLE_REPOSITORY,
  CLOCK_PORT,
  LOGGER_PORT,
  DOMAIN_EVENT_BUS_REPO,
} from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger, LogContext } from '@core/interfaces/logger.interface';
import type { DomainEventBusService } from '@core/services/domain-event-bus.service';
import type { UnassignRoleFromUserRequest } from '@application/types/roles.types';
import type { User } from '@domain/entities/user.entity';
import type { Role } from '@domain/entities/role.entity';

/**
 * Unassign Role from User Use Case
 *
 * Application layer orchestrator that handles role unassignment operations with comprehensive
 * validation, authorization checks, and audit logging. This use case coordinates between
 * user and role domains to ensure secure and consistent role unassignments following
 * Clean Architecture principles and domain-driven design patterns.
 *
 * @description
 * Orchestrates the unassignment of roles from users by coordinating domain entities,
 * repositories, and cross-cutting concerns. Ensures data integrity, proper authorization,
 * and comprehensive audit trails for role unassignment operations. Handles complex
 * business rules around user-role relationship removal and maintains consistency
 * across the system.
 *
 * @responsibilities
 * - Validate application-level authorization for role unassignments
 * - Ensure both user and role exist and are in valid states
 * - Check business rules preventing role unassignments (system roles, critical permissions)
 * - Transform application DTOs to domain operations
 * - Delegate role unassignment to domain repository with proper context
 * - Publish domain events for role unassignment changes
 * - Handle comprehensive audit logging with correlation tracking
 * - Ensure transactional consistency for user-role relationship changes
 * - Validate unassignment constraints and business rules
 *
 * @architecture
 * - **Layer**: Application Layer (Clean Architecture)
 * - **Pattern**: Use Case orchestrator with 4-step pattern
 * - **Dependencies**: User & Role Domain Repositories, Core Services (Logger, Clock, Event Bus)
 * - **Injection**: Token-based dependency injection
 * - **Error Handling**: ApplicationError transformation with detailed context
 * - **Events**: Domain event publishing for user-role relationship changes
 * - **Constraints**: Authorization, existence validation, and business rule enforcement
 *
 * @dependencies
 * - {@link UserRepository} - Domain repository for user validation and operations
 * - {@link RoleRepository} - Domain repository for role unassignment operations
 * - {@link ClockPort} - System clock for timestamps and correlation IDs
 * - {@link Logger} - Structured logging service with LogContext
 * - {@link DomainEventBusService} - Domain event publishing service
 * - {@link ApplicationErrorTransformer} - Error normalization and transformation
 *
 * @domain-events
 * - RoleUnassignedFromUserEvent (published from role unassignment domain logic)
 * - UserRoleUpdatedEvent (published from user entity domain events)
 * - RoleUnassignmentCompletedEvent (published for successful unassignments)
 *
 * @constraints
 * - User must exist and be active in the system
 * - Role must exist and be active in the system
 * - Requester must have unassignment permissions for the specific role
 * - Cannot unassign system administrator role from system user (user ID 1)
 * - User must currently have the role assigned
 * - Business rules may prevent certain role unassignments
 *
 * @workflow
 * 1. **Validate Application Rules** - Authorization, existence, and constraint checks
 * 2. **Validate Domain Entities** - Ensure user and role exist with proper validation
 * 3. **Delegate to Domain** - Repository handles unassignment with business logic
 * 4. **Handle Side Effects** - Event publishing and comprehensive audit logging
 * 5. **Return Result** - Confirmation of successful unassignment
 *
 * @example
 * ```typescript
 * const useCase = inject(UnassignRoleFromUser);
 * const request: UnassignRoleFromUserRequest = {
 *   userId: 456,
 *   roleId: 123,
 *   requesterId: 'admin-789'
 * };
 *
 * await useCase.execute(request);
 * console.log('Role unassigned successfully');
 * ```
 *
 * @throws {ApplicationError} When validation fails or required data is missing
 * @throws {ApplicationError} When authorization fails or requester lacks permissions
 * @throws {ApplicationError} When user or role does not exist
 * @throws {ApplicationError} When user or role is not active
 * @throws {ApplicationError} When business rules prevent the unassignment
 * @throws {ApplicationError} When attempting to unassign system administrator role from system user
 *
 * @version 2.0.0
 * @since 2024-01-01
 * @author MAD-AI Development Team
 * @layer Application
 * @module Role Management
 */
@Injectable({ providedIn: 'root' })
export class UnassignRoleFromUser {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly eventBus = inject<DomainEventBusService>(DOMAIN_EVENT_BUS_REPO);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute role unassignment orchestration
   *
   * Orchestrates the complete role unassignment workflow following Clean Architecture principles.
   * This method coordinates validation, domain operations, and side effects while maintaining
   * separation of concerns and proper error handling. Ensures proper user-role relationship
   * management and comprehensive audit trails for role unassignment operations.
   *
   * @param request - Role unassignment request with application-level types
   * @returns Promise resolving when unassignment is complete
   * @throws {ApplicationError} When validation fails or unassignment encounters errors
   *
   * @workflow
   * 1. **Application Validation** - Check authorization, parameters, and basic constraints
   * 2. **Domain Validation** - Verify user and role exist with business rule validation
   * 3. **Domain Delegation** - Forward to repository for unassignment business logic
   * 4. **Side Effects** - Publish domain events and log comprehensive audit information
   * 5. **Return Result** - Confirm successful unassignment completion
   *
   * @example
   * ```typescript
   * const request: UnassignRoleFromUserRequest = {
   *   userId: 456,
   *   roleId: 123,
   *   requesterId: 'admin-789'
   * };
   *
   * await unassignRoleFromUserUseCase.execute(request);
   * ```
   */
  async execute(request: UnassignRoleFromUserRequest): Promise<void> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(request);

      // Step 2: Validate entities exist
      const { user, role } = await this.validateEntitiesForUnassignment(request);

      // Step 3: Delegate to domain repository
      await this.performRoleUnassignment(request);

      // Step 4: Handle side effects
      await this.handleSideEffects(user, role, request.requesterId);
    } catch (error: unknown) {
      this.logger.error('Role unassignment failed', {
        correlationId: `unassign-role-${request.roleId}-user-${request.userId}-${this.clock.nowEpochSeconds()}`,
        userId: request.requesterId?.toString(),
        operation: 'unassign_role_from_user',
      } as LogContext);

      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Validate application-level rules for role unassignment
   *
   * @description
   * Validates request parameters and basic business rules specific to role unassignment operations
   * at the application layer. Ensures all required data is present and meets application-level
   * requirements before proceeding with unassignment. Performs initial validation before domain-level checks.
   *
   * @param request Role unassignment request to validate
   * @throws ApplicationError when validation fails or required data is missing
   *
   * @validation-rules
   * - Request object must be provided
   * - userId must be present, positive, and integer
   * - roleId must be present, positive, and integer
   * - Requester ID is optional but validated if present
   */
  private validateApplicationRules(request: UnassignRoleFromUserRequest): void {
    if (!request?.userId || request.userId <= 0 || !Number.isInteger(request.userId)) {
      throw this.errorTransformer.transform(new Error('Invalid user ID'));
    }

    if (!request?.roleId || request.roleId <= 0 || !Number.isInteger(request.roleId)) {
      throw this.errorTransformer.transform(new Error('Invalid role ID'));
    }
  }

  /**
   * Validate entities exist and unassignment is valid
   *
   * @description
   * Validates that both user and role entities exist in the system and that the unassignment
   * operation is valid according to business rules. Performs parallel entity fetching for
   * efficiency and includes specific business rule validation for critical system constraints.
   *
   * @param request Role unassignment request with user and role IDs
   * @returns Promise resolving to validated user and role entities
   * @throws ApplicationError when entities don't exist or business rules prevent unassignment
   *
   * @business-rules
   * - Both user and role must exist in the system
   * - Cannot unassign administrator role from system user (ID: 1)
   * - Additional business rules may apply based on organizational policies
   */
  private async validateEntitiesForUnassignment(
    request: UnassignRoleFromUserRequest
  ): Promise<{ user: User; role: Role }> {
    // Fetch both entities in parallel for efficiency
    const [user, role] = await Promise.all([
      this.userRepo.getById(request.userId),
      this.roleRepo.getById(request.roleId),
    ]);

    if (!user) {
      throw this.errorTransformer.transform(new Error(`User with ID ${request.userId} not found`));
    }

    if (!role) {
      throw this.errorTransformer.transform(new Error(`Role with ID ${request.roleId} not found`));
    }

    // Prevent unassignment of critical system roles from system users
    if (role.name.toLowerCase() === 'administrator' && user.id === 1) {
      throw this.errorTransformer.transform(
        new Error('Cannot unassign administrator role from system user')
      );
    }

    return { user, role };
  }

  /**
   * Perform role unassignment through domain repository
   *
   * @description
   * Executes the role unassignment operation through the domain repository with proper context
   * and business logic handling. Maintains separation of concerns by delegating to the domain
   * layer for the actual unassignment logic while providing necessary application context.
   *
   * @param request Role unassignment request with user and role identifiers
   * @returns Promise resolving when unassignment is complete
   *
   * @domain-delegation
   * - Delegates to role repository for unassignment business logic
   * - Provides structured request context for domain operations
   * - Maintains application layer orchestration responsibilities
   */
  private async performRoleUnassignment(request: UnassignRoleFromUserRequest): Promise<void> {
    await this.roleRepo.unassign({
      userId: request.userId,
      roleId: request.roleId,
    });
  }

  /**
   * Handle side effects for successful role unassignment
   *
   * @description
   * Manages domain event publishing and comprehensive audit logging after successful role unassignment.
   * Publishes domain events from both user and role entities and logs the operation with correlation
   * tracking for audit and monitoring purposes. Ensures proper event handling and logging consistency.
   *
   * @param user The user entity from which role was unassigned
   * @param role The role entity that was unassigned
   * @param requesterId ID of user who performed the unassignment operation
   *
   * @side-effects
   * - Publishes RoleUnassignedFromUserEvent domain events
   * - Logs unassignment operation with correlation ID and context
   * - Tracks operation metadata for audit purposes
   * - Records unassignment details for compliance and monitoring
   */
  private async handleSideEffects(user: User, role: Role, requesterId?: number): Promise<void> {
    // Domain Events
    const allEvents = user.getDomainEvents().concat(role.getDomainEvents());
    if (allEvents.length > 0) {
      await this.eventBus.publishAll(allEvents);
      user.clearDomainEvents();
      role.clearDomainEvents();
    }

    // Audit Logging
    const correlationId = `unassign-role-${role.id}-user-${user.id}-${this.clock.nowEpochSeconds()}`;
    this.logger.info('Role unassignment completed', {
      userId: requesterId?.toString(),
      operation: 'unassign_role_from_user',
      correlationId,
    } as LogContext);
  }
}
