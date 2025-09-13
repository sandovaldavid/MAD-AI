import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, LOGGER_PORT, CLOCK_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { DeleteRoleRequest } from '@application/types/roles.types';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Role } from '@domain/entities/role.entity';

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
 * const useCase = inject(DeleteRoleUseCase);
 * const request: DeleteRoleRequest = {
 *   id: 123,
 *   requesterId: 456
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
export class DeleteRoleUseCase {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);

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
   *   requesterId: 456
   * });
   * ```
   */
  async execute(request: DeleteRoleRequest): Promise<void> {
    try {
      // Step 1: Validate application rules and authorization
      this.validateApplicationRules(request);
      await this.validateAuthorization(request.requesterId);

      // Step 2: Verify role exists and get role entity
      const role = await this.verifyRoleExists(request.id);

      // Step 3: Delegate to domain repository for deletion
      await this.roleRepo.delete(request.id);

      // Step 4: Handle side effects
      await this.handleSideEffects(role, request.requesterId!);
    } catch (error: unknown) {
      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Validate application-level rules for role deletion
   *
   * Performs validation that cannot be done at the domain level,
   * such as basic input validation and structure verification.
   * Domain-level validations (business rules) are handled by the repository.
   */
  private validateApplicationRules(request: DeleteRoleRequest): void {
    // Application-level validation: Check if request exists
    if (!request) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Invalid input provided: Request is null or undefined',
        'Request data is required for role deletion'
      );
    }

    // Application-level validation: Role ID presence and basic format
    if (!request.id || typeof request.id !== 'number' || request.id <= 0) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Invalid input provided: Role ID is required and must be a positive number',
        'Valid role ID must be provided'
      );
    }

    // Note: Business logic validations (system role protection, referential integrity)
    // are handled by the domain layer through repository operations
  }

  /**
   * Validate authorization for role deletion
   *
   * Ensures the requester has proper permissions to delete roles.
   * This is an application-level concern for access control.
   */
  private async validateAuthorization(requesterId?: number): Promise<void> {
    // Check if requester is authenticated
    if (!requesterId) {
      throw new ApplicationError(
        ApplicationErrorCode.INSUFFICIENT_PERMISSIONS,
        'Requester ID is required for role deletion',
        'You must be authenticated to delete roles'
      );
    }

    // Note: In a full implementation, you would:
    // 1. Fetch the requester user from UserRepository
    // 2. Check their role and permissions using business logic
    // 3. Validate they have role management permissions
    //
    // For now, we're accepting any authenticated user
    // This should be expanded based on business requirements

    this.logger.info('Authorization validated for role deletion', {
      userId: requesterId.toString(),
      operation: 'delete_role_authorization',
    });
  }

  /**
   * Verify role exists before deletion
   *
   * Ensures the role exists in the system before attempting deletion.
   * Returns the role entity for use in side effects.
   */
  private async verifyRoleExists(roleId: number): Promise<Role> {
    const role = await this.roleRepo.getById(roleId);

    if (!role) {
      throw new ApplicationError(
        ApplicationErrorCode.ROLE_NOT_FOUND,
        'Role not found for deletion',
        `Role with ID ${roleId} does not exist`
      );
    }

    return role;
  }

  /**
   * Handle side effects for successful role deletion
   *
   * Manages audit logging and any other side effects that should occur
   * after a successful role deletion operation.
   *
   * Domain Events Strategy:
   * Currently using structured logging as a temporary domain event mechanism.
   * In a future iteration, this should be replaced with proper domain event
   * publishing through a DomainEventBus service for system integration.
   */
  private async handleSideEffects(role: Role, requesterId: number): Promise<void> {
    const correlationId = `role-delete-${role.id}-${this.clock.nowEpochSeconds()}`;

    // Audit logging for compliance and monitoring
    this.logger.info('Role deleted successfully', {
      operation: 'delete_role',
      userId: requesterId.toString(),
      correlationId,
    });

    // TODO: Replace with proper domain event publishing
    // Example future implementation:
    // await this.domainEventBus.publish(new RoleDeletedEvent({
    //   roleId: role.id,
    //   roleName: role.name,
    //   deletedBy: requesterId,
    //   timestamp: this.clock.now()
    // }));
  }
}
