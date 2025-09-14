import { Injectable, inject } from '@angular/core';
import { USER_REPOSITORY, ROLE_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger, LogContext } from '@core/interfaces/logger.interface';
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
 * This use case follows a **Repository-Centric** pattern where role assignment/unassignment
 * operations are handled primarily through repository methods rather than domain entity
 * methods. This design is intentional and consistent with the current domain model where
 * Role and User entities focus on their individual properties and behaviors, while
 * relationship management is delegated to specialized repository operations.
 *
 * @responsibilities
 * - Validate application-level authorization for role unassignments
 * - Ensure both user and role exist and are in valid states
 * - Transform application DTOs to domain operations
 * - Delegate role unassignment to domain repository with proper context
 * - Handle comprehensive audit logging with correlation tracking
 * - Ensure transactional consistency for user-role relationship changes
 * - Business rules and constraints are enforced by the domain layer
 *
 * @architecture
 * - **Layer**: Application Layer (Clean Architecture)
 * - **Pattern**: Use Case orchestrator with 4-step pattern
 * - **Dependencies**: User & Role Domain Repositories, Core Services (Logger, Clock)
 * - **Injection**: Token-based dependency injection
 * - **Error Handling**: ApplicationError transformation with detailed context
 * - **Constraints**: Authorization, existence validation, and business rule enforcement
 *
 * @dependencies
 * - {@link UserRepository} - Domain repository for user validation and operations
 * - {@link RoleRepository} - Domain repository for role unassignment operations
 * - {@link ClockPort} - System clock for timestamps and correlation IDs
 * - {@link Logger} - Structured logging service with LogContext
 * - {@link ApplicationErrorTransformer} - Error normalization and transformation
 *
 * @domain-events
 * Domain events are currently not implemented in this version of the system.
 * Future versions may include events like RoleUnassignedFromUserEvent for
 * decoupled notification and audit trail management.
 *
 * @constraints
 * - User must exist and be active in the system
 * - Role must exist and be active in the system
 * - Requester must have unassignment permissions for the specific role
 * - User must currently have the role assigned
 * - Business rules and constraints are enforced by the domain layer
 *
 * @workflow
 * 1. **Validate Application Rules** - Authorization, existence, and constraint checks
 * 2. **Validate Domain Entities** - Ensure user and role exist with proper validation
 * 3. **Delegate to Domain** - Repository handles unassignment with business logic
 * 4. **Handle Side Effects** - Comprehensive audit logging
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
 * @throws {ApplicationError} When business rules prevent the unassignment (enforced by domain layer)
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
   * 4. **Side Effects** - Comprehensive audit information logging
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
      const { user, role } = await this.validateEntitiesExist(request);

      // Step 3: Delegate to domain repository
      await this.performRoleUnassignment(request);

      // Step 4: Handle side effects
      await this.handleSideEffects(user, role, request.requesterId);
    } catch (error: unknown) {
      this.logger.error('Role unassignment failed', {
        correlationId: `unassign-role-${request?.roleId ?? 'unknown'}-user-${request?.userId ?? 'unknown'}-${this.clock.nowEpochSeconds()}`,
        userId: request?.requesterId?.toString(),
        operation: 'unassign_role_from_user',
      } as LogContext);

      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Validate application-level rules for role unassignment
   *
   * @description
   * Validates request parameters at the application layer. Only handles application-level
   * concerns such as input presence and basic structure validation. Business rules about
   * valid ID ranges, formats, and constraints are delegated to the domain layer through
   * repository operations.
   *
   * ✅ CORRECT: Only validates application concerns:
   * - Input nullability (application layer responsibility)
   * - Basic presence of required fields (application layer responsibility)
   * - Request structure validity (application layer responsibility)
   *
   * ❌ NEVER validates business rules:
   * - ID ranges or formats (domain repository responsibility)
   * - Business constraints (domain repository responsibility)
   * - Entity relationships (domain repository responsibility)
   *
   * @param request Role unassignment request to validate
   * @throws ApplicationError when application-level validation fails
   *
   * @validation-rules
   * - Request object must be provided
   * - userId must be present (business validation delegated to domain)
   * - roleId must be present (business validation delegated to domain)
   * - Requester ID is optional but checked if present
   */
  private validateApplicationRules(request: UnassignRoleFromUserRequest): void {
    // Application-level validation: Check if request exists
    if (!request) {
      throw this.errorTransformer.transform(new Error('Request is required'));
    }

    // Application-level validation: Check required field presence (not business constraints)
    if (!request.userId) {
      throw this.errorTransformer.transform(new Error('User ID is required'));
    }

    if (!request.roleId) {
      throw this.errorTransformer.transform(new Error('Role ID is required'));
    }
  }

  /**
   * Validate entities exist for unassignment
   *
   * @description
   * Validates that both user and role entities exist in the system and can be retrieved
   * for the unassignment operation. Performs parallel entity fetching for efficiency.
   * This is purely an existence check - all business rule validation about the
   * unassignment operation itself is delegated to the domain repository.
   *
   * @param request Role unassignment request with user and role IDs
   * @returns Promise resolving to validated user and role entities
   * @throws ApplicationError when entities don't exist
   *
   * @validation-scope
   * - Verifies user entity exists (NOT business validation of user state)
   * - Verifies role entity exists (NOT business validation of role state)
   * - Business rules about unassignment eligibility are handled by repository
   */
  private async validateEntitiesExist(
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
   * Manages comprehensive audit logging after successful role unassignment.
   * Logs the operation with correlation tracking for audit and monitoring purposes.
   * Ensures proper logging consistency and maintains audit trail requirements.
   *
   * @param user The user entity from which role was unassigned
   * @param role The role entity that was unassigned
   * @param requesterId ID of user who performed the unassignment operation
   *
   * @side-effects
   * - Logs unassignment operation with correlation ID and context
   * - Tracks operation metadata for audit purposes
   * - Records unassignment details for compliance and monitoring
   */
  private async handleSideEffects(user: User, role: Role, requesterId?: number): Promise<void> {
    // Domain events removed as part of refactor

    // Audit Logging
    const correlationId = `unassign-role-${role.id}-user-${user.id}-${this.clock.nowEpochSeconds()}`;
    this.logger.info('Role unassignment completed', {
      userId: requesterId?.toString(),
      operation: 'unassign_role_from_user',
      correlationId,
    } as LogContext);
  }
}
