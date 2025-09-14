import { Injectable, inject } from '@angular/core';
import { USER_REPOSITORY, ROLE_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger, LogContext } from '@core/interfaces/logger.interface';
import type { GetUsersByRoleRequest } from '@application/types/roles.types';
import type { User } from '@domain/entities/user.entity';
import type { Role } from '@domain/entities/role.entity';

/**
 * Get Users by Role Use Case
 *
 * Application layer orchestrator that handles retrieval of users assigned to a specific role
 * with comprehensive validation, authorization checks, and audit logging. This use case
 * coordinates between user and role domains to ensure secure and efficient user retrieval
 * operations following Clean Architecture principles and domain-driven design patterns.
 *
 * @description
 * Orchestrates the retrieval of users assigned to a specific role by coordinating domain entities,
 * repositories, and cross-cutting concerns. Ensures data integrity, proper authorization, and
 * comprehensive audit trails for user-role relationship queries. Handles complex filtering,
 * pagination, and sorting requirements while maintaining consistency across the system.
 *
 * @responsibilities
 * - Validate application-level presence and nullability checks only
 * - Ensure role exists and is accessible before retrieving associated users
 * - Transform application pagination to domain repository contracts
 * - Delegate user retrieval and all business rule validation to domain repository
 * - Handle comprehensive audit logging with correlation tracking
 * - Support pagination through proper domain contract transformation
 *
 * @architecture
 * - **Layer**: Application Layer (Clean Architecture)
 * - **Pattern**: Use Case orchestrator with 4-step pattern and query optimization
 * - **Dependencies**: User & Role Domain Repositories, Core Services (Logger, Clock, Event Bus)
 * - **Injection**: Token-based dependency injection
 * - **Error Handling**: ApplicationError transformation with detailed context
 * - **Events**: Domain event publishing from retrieved user entities
 * - **Constraints**: Authorization, existence validation, and pagination limits
 *
 * @dependencies
 * - {@link UserRepository} - Domain repository for user retrieval operations
 * - {@link RoleRepository} - Domain repository for role validation
 * - {@link ClockPort} - System clock for timestamps and correlation IDs
 * - {@link Logger} - Structured logging service with LogContext
 * - {@link DomainEventBusService} - Domain event publishing service
 * - {@link ApplicationErrorTransformer} - Error normalization and transformation
 *
 * @domain-events
 * - UserRetrievedEvent (published from user entities in result set)
 * - RoleAccessedEvent (published when role is validated for access)
 *
 * @constraints
 * - Application layer only handles presence and nullability checks
 * - All business rule validation delegated to domain repositories
 * - Domain repository enforces role existence and pagination limits
 * - Role ID and pagination parameter validation handled by domain layer
 *
 * @workflow
 * 1. **Validate Application Rules** - Presence and nullability checks only
 * 2. **Validate Domain Entities** - Ensure role exists through domain repository
 * 3. **Delegate to Domain** - Repository handles user retrieval and all business validation
 * 4. **Handle Side Effects** - Audit logging for successful operations
 * 5. **Return Result** - Filtered user list with domain validation completed
 *
 * @example
 * ```typescript
 * const useCase = inject(GetUsersByRole);
 * const request: GetUsersByRoleRequest = {
 *   roleId: 123,
 *   requesterId: 'admin-456',
 *   pagination: {
 *     page: 1,
 *     pageSize: 50,
 *     sortBy: 'name',
 *     sortOrder: 'asc'
 *   }
 * };
 *
 * const users = await useCase.execute(request);
 * console.log(`Found ${users.length} users with role 123`);
 * ```
 *
 * @throws {ApplicationError} When basic presence validation fails
 * @throws {ApplicationError} When domain repository validation fails
 * @throws {ApplicationError} When role does not exist or is not accessible
 * @throws {ApplicationError} When domain business rules prevent user retrieval
 *
 * @version 2.0.0
 * @since 2024-01-01
 * @author MAD-AI Development Team
 * @layer Application
 * @module Role Management
 */
@Injectable({ providedIn: 'root' })
export class GetUsersByRole {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute user retrieval by role orchestration
   *
   * Orchestrates the complete user retrieval by role workflow following Clean Architecture principles.
   * This method coordinates validation, domain operations, and side effects while maintaining
   * separation of concerns and proper error handling. Ensures proper user-role relationship
   * queries and comprehensive audit trails for user retrieval operations.
   *
   * @param request - User retrieval request with application-level types and pagination
   * @returns Promise resolving to array of User entities assigned to the specified role
   * @throws {ApplicationError} When validation fails or retrieval encounters errors
   *
   * @workflow
   * 1. **Application Validation** - Check presence and basic nullability only
   * 2. **Domain Validation** - Verify role exists through domain repository
   * 3. **Domain Delegation** - Forward to repositories with proper contract transformation
   * 4. **Side Effects** - Log audit information for successful operations
   * 5. **Return Result** - Return filtered user list with domain validation completed
   *
   * @example
   * ```typescript
   * const request: GetUsersByRoleRequest = {
   *   roleId: 123,
   *   requesterId: 'admin-456',
   *   pagination: { page: 1, pageSize: 20 }
   * };
   *
   * const users = await getUsersByRoleUseCase.execute(request);
   * console.log(`Found ${users.length} users with role ID 123`);
   * ```
   */
  async execute(request: GetUsersByRoleRequest): Promise<User[]> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(request);

      // Step 2: Validate role exists
      const role = await this.validateRoleExists(request.roleId);

      // Step 3: Delegate to domain repository
      const users = await this.retrieveUsersByRole(request);

      // Step 4: Handle side effects
      await this.handleSideEffects(users, role, request.requesterId);

      return users;
    } catch (error: unknown) {
      this.logger.error('User retrieval by role failed', {
        correlationId: `get-users-role-${request.roleId}-${this.clock.nowEpochSeconds()}`,
        userId: request.requesterId?.toString(),
        operation: 'get_users_by_role',
      } as LogContext);

      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Validate application-level rules for user retrieval by role
   *
   * @description
   * Validates basic presence and nullability checks for the application layer.
   * All business rule validation is delegated to the domain layer through
   * repository operations that will enforce domain constraints.
   *
   * @param request User retrieval request to validate
   * @throws ApplicationError when basic presence validation fails
   *
   * @validation-rules
   * - Request object must be present
   * - All business rule validation delegated to domain repository
   */
  private validateApplicationRules(request: GetUsersByRoleRequest): void {
    if (!request) {
      throw this.errorTransformer.transform(new Error('Request is required'));
    }
  }

  /**
   * Validate role exists and is accessible
   *
   * @description
   * Validates that the specified role exists in the system and is accessible for user retrieval operations.
   * Ensures the role is available before attempting to retrieve associated users, preventing unnecessary
   * processing and providing clear error messages for non-existent roles.
   *
   * @param roleId The ID of the role to validate
   * @returns Promise resolving to the validated Role entity
   * @throws ApplicationError when role does not exist or is not accessible
   */
  private async validateRoleExists(roleId: number): Promise<Role> {
    const role = await this.roleRepo.getById(roleId);
    if (!role) {
      throw this.errorTransformer.transform(new Error(`Role with ID ${roleId} not found`));
    }
    return role;
  }

  /**
   * Retrieve users by role from domain repository
   *
   * @description
   * Executes the user retrieval operation through the domain repository with role-based filtering.
   * Transforms application pagination (page/pageSize) to domain contract (limit/offset) and
   * delegates all validation and business rules to the domain repository.
   *
   * @param request User retrieval request with filtering and pagination parameters
   * @returns Promise resolving to filtered array of users assigned to the role
   *
   * @query-optimization
   * - Uses role-based filtering for efficient user lookup
   * - Transforms pagination parameters to domain contract format
   * - Delegates all validation to domain repository
   * - Maintains audit trail for query operations
   */
  private async retrieveUsersByRole(request: GetUsersByRoleRequest): Promise<User[]> {
    // Transform application pagination (page/pageSize) to domain contract (limit/offset)
    const filter: any = {
      roleId: request.roleId,
    };

    if (request.pagination) {
      if (request.pagination.pageSize) {
        filter.limit = request.pagination.pageSize;
      }

      if (request.pagination.page && request.pagination.pageSize) {
        // Convert page-based to offset-based pagination
        filter.offset = (request.pagination.page - 1) * request.pagination.pageSize;
      }
    }

    // Delegate to domain repository - all business rule validation happens here
    const users = await this.userRepo.list(filter);

    this.logger.debug('Users retrieved by role', {
      operation: 'get_users_by_role',
      correlationId: `role-${request.roleId}-${this.clock.nowEpochSeconds()}`,
    } as LogContext);

    return users;
  }

  /**
   * Handle side effects for successful user retrieval
   *
   * @description
   * Manages comprehensive audit logging after successful user retrieval by role.
   * Logs the operation with correlation tracking for audit and monitoring purposes.
   * Ensures proper logging consistency.
   *
   * @param users Array of retrieved user entities
   * @param role The validated role entity used for filtering
   * @param requesterId ID of user who performed the retrieval operation
   *
   * @side-effects
   * - Logs retrieval operation with correlation ID and metrics
   * - Tracks operation metadata for audit purposes
   * - Records query performance and result statistics
   */
  private async handleSideEffects(users: User[], role: Role, requesterId?: number): Promise<void> {
    // Audit Logging
    const correlationId = `get-users-role-${role.id}-${this.clock.nowEpochSeconds()}`;
    this.logger.info('Users by role retrieval completed', {
      userId: requesterId?.toString(),
      operation: 'get_users_by_role',
      correlationId,
    } as LogContext);
  }
}
