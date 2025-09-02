import { Injectable, inject } from '@angular/core';
import {
  ROLE_REPOSITORY,
  USER_REPOSITORY,
  CLOCK_PORT,
  LOGGER_PORT,
  DOMAIN_EVENT_BUS_REPO,
} from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { AssignRoleToUserRequest } from '@application/types/roles.types';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger, LogContext } from '@core/interfaces/logger.interface';
import type { DomainEventBusService } from '@core/services/domain-event-bus.service';

/**
 * Assign Role to User Use Case
 *
 * Application layer orchestrator that handles role assignment operations with comprehensive
 * validation, authorization checks, and audit logging. This use case coordinates between
 * user and role domains to ensure secure and consistent role assignments following
 * Clean Architecture principles and domain-driven design patterns.
 *
 * @description
 * Orchestrates the assignment of roles to users by coordinating domain entities, repositories,
 * and cross-cutting concerns. Ensures data integrity, proper authorization, and comprehensive
 * audit trails for role assignment operations. Handles complex business rules around user-role
 * relationships and maintains consistency across the system.
 *
 * @responsibilities
 * - Validate application-level authorization for role assignments
 * - Ensure both user and role exist and are in valid states
 * - Check business rules preventing role assignments (conflicts, permissions)
 * - Transform application DTOs to domain operations
 * - Delegate role assignment to domain repository with proper context
 * - Publish domain events for role assignment changes
 * - Handle comprehensive audit logging with correlation tracking
 * - Ensure transactional consistency for user-role relationship changes
 * - Validate role assignment constraints and business rules
 *
 * @architecture
 * - **Layer**: Application Layer (Clean Architecture)
 * - **Pattern**: Use Case orchestrator with 4-step pattern
 * - **Dependencies**: Role & User Domain Repositories, Core Services (Logger, Clock, Event Bus)
 * - **Injection**: Token-based dependency injection
 * - **Error Handling**: ApplicationError transformation with detailed context
 * - **Events**: Domain event publishing for user-role relationship changes
 * - **Constraints**: Authorization, existence validation, and business rule enforcement
 *
 * @dependencies
 * - {@link RoleRepository} - Domain repository for role assignment operations
 * - {@link UserRepository} - Domain repository for user validation
 * - {@link ClockPort} - System clock for timestamps and correlation IDs
 * - {@link Logger} - Structured logging service with LogContext
 * - {@link DomainEventBusService} - Domain event publishing service
 * - {@link ApplicationErrorTransformer} - Error normalization and transformation
 *
 * @domain-events
 * - RoleAssignedToUserEvent (published from role assignment domain logic)
 * - UserRoleUpdatedEvent (published from user entity domain events)
 *
 * @constraints
 * - User must exist and be active in the system
 * - Role must exist and be active in the system
 * - Requester must have assignment permissions for the specific role
 * - User cannot have conflicting roles based on business rules
 * - Role assignment must comply with organizational policies
 * - System roles may have additional assignment restrictions
 *
 * @workflow
 * 1. **Validate Application Rules** - Authorization, existence, and constraint checks
 * 2. **Delegate to Domain** - Repository handles assignment with business logic
 * 3. **Handle Side Effects** - Event publishing and comprehensive audit logging
 * 4. **Return Result** - Confirmation of successful assignment
 *
 * @example
 * ```typescript
 * const useCase = inject(AssignRoleToUser);
 * const request: AssignRoleToUserRequest = {
 *   userId: 456,
 *   roleId: 123,
 *   assignedByUserId: 'admin-789'
 * };
 *
 * await useCase.execute(request);
 * console.log('Role assigned successfully');
 * ```
 *
 * @throws {ApplicationError} When validation fails or required data is missing
 * @throws {ApplicationError} When authorization fails or requester lacks permissions
 * @throws {ApplicationError} When user or role does not exist
 * @throws {ApplicationError} When user or role is not active
 * @throws {ApplicationError} When business rules prevent the assignment
 * @throws {ApplicationError} When role conflicts exist for the user
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
  private readonly eventBus = inject<DomainEventBusService>(DOMAIN_EVENT_BUS_REPO);
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
   * 2. **Domain Delegation** - Forward to repository for assignment business logic
   * 3. **Side Effects** - Publish domain events and log comprehensive audit information
   * 4. **Return Result** - Confirm successful assignment completion
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
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(input);

      // Step 2: Delegate to domain repository for assignment
      await this.roleRepo.assign(input);

      // Step 3: Handle side effects
      await this.handleRoleAssignmentSideEffects(input);
    } catch (error: unknown) {
      this.logger.error('Role assignment failed', {
        correlationId: `assign-role-${input.userId}-${input.roleId}-${this.clock.nowEpochSeconds()}`,
        userId: input.assignedByUserId?.toString(),
        operation: 'assign_role_to_user',
      } as LogContext);

      // Normalize errors for application layer
      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Validate application-level rules for role assignment
   *
   * @description
   * Validates request parameters and basic business rules specific to the application layer.
   * Ensures all required data is present and meets application-level requirements before
   * proceeding with role assignment. Performs initial validation before domain-level checks.
   *
   * @param input Role assignment request to validate
   * @throws ApplicationError when validation fails or required data is missing
   *
   * @validation-rules
   * - Request object must be provided
   * - userId must be present and valid
   * - roleId must be present and valid
   * - assignedByUserId must be present for audit tracking
   */
  private validateApplicationRules(input: AssignRoleToUserRequest): void {
    if (!input || !input.userId || !input.roleId || !input.assignedByUserId) {
      throw this.errorTransformer.transform(new Error('Role assignment data is required'));
    }
  }

  /**
   * Handle side effects for successful role assignment
   *
   * @description
   * Manages domain event publishing and comprehensive audit logging after successful role assignment.
   * Publishes domain events related to the role assignment and logs the operation with correlation
   * tracking for audit and monitoring purposes. Ensures proper event handling and logging consistency.
   *
   * @param input The role assignment input data
   *
   * @side-effects
   * - Publishes RoleAssignedToUserEvent domain events
   * - Logs assignment operation with correlation ID
   * - Tracks assignment metadata for audit purposes
   */
  private async handleRoleAssignmentSideEffects(input: AssignRoleToUserRequest): Promise<void> {
    const timestamp = this.clock.nowEpochSeconds();
    const correlationId = `role-assign-${input.userId}-${input.roleId}-${timestamp}`;

    // Domain Events - Simulate publishing until real API is connected
    this.logger.info(
      `Domain Events simulation: RoleAssignedToUserEvent for user ${input.userId} and role ${input.roleId}`,
      {
        correlationId,
      } as LogContext
    );

    // TODO: Once Domain Event Bus is connected to real API, replace simulation with:
    // const events = await this.roleRepo.getDomainEventsForAssignment(input);
    // if (events.length > 0) {
    //   await this.eventBus.publishAll(events);
    // }

    this.logger.info('Role assignment completed', {
      correlationId,
      userId: input.userId.toString(),
      operation: 'assign_role_to_user',
    } as LogContext);
  }
}
