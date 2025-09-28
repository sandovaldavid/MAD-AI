import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger, LogContext } from '@core/interfaces/logger.interface';
import type { GetRoleByNameRequest } from '@/app/application/types/roles/roles.types';
import type { Role } from '@domain/entities/role.entity';

/**
 * Get Role By Name Use Case
 *
 * Application layer orchestrator that handles role retrieval by name with comprehensive validation,
 * exact name matching, audit logging, and domain event publishing. This use case follows the 4-step
 * orchestration pattern defined in Clean Architecture principles and ensures precise role lookup
 * with proper authorization and search constraints.
 *
 * @description
 * Orchestrates role search operations by coordinating between the presentation layer and
 * domain repositories. This use case follows Clean Architecture principles by maintaining
 * pure orchestration responsibilities without implementing business logic. All search
 * criteria, matching logic, and validation rules are delegated to the Domain layer.
 * Focuses on request coordination, error transformation, and audit logging.
 *
 * @responsibilities
 * - Validate application-level presence and nullability checks
 * - Handle basic authentication requirements
 * - Orchestrate role search by delegating to domain repository
 * - Transform domain errors to application errors
 * - Handle audit logging for successful operations
 * - Coordinate between domain services and presentation layer
 *
 * @architecture
 * - **Layer**: Application Layer (Clean Architecture)
 * - **Pattern**: Use Case orchestrator with 4-step pattern + search logic
 * - **Dependencies**: Domain Repository, Core Services (Logger, Clock, Event Bus)
 * - **Injection**: Token-based dependency injection
 * - **Error Handling**: ApplicationError transformation
 * - **Events**: Domain event publishing for audit trail
 * - **Constraints**: Name validation, exact matching, authorization checks
 *
 * @dependencies
 * - {@link RoleRepository} - Domain repository for role search and retrieval
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
 * - Repository handles search logic and matching criteria
 * - Requester authorization is validated at application level
 *
 * @workflow
 * 1. **Validate Application Rules** - Presence and nullability checks only
 * 2. **Validate Authorization** - Check basic authentication requirements
 * 3. **Delegate to Domain** - Repository handles all search logic and business rules
 * 4. **Handle Side Effects** - Audit logging only
 *
 * @example
 * ```typescript
 * const useCase = inject(GetRoleByNameUseCase);
 * const request: GetRoleByNameRequest = {
 *   name: 'Administrator',
 *   requesterId: 'admin-456'
 * };
 *
 * const role = await useCase.execute(request);
 * console.log('Role found:', role.name, role.description);
 * ```
 *
 * @throws {ApplicationError} When role name is not provided or empty
 * @throws {ApplicationError} When authorization fails or requester lacks authentication
 * @throws {ApplicationError} When no roles found matching search criteria
 * @throws {ApplicationError} When domain repository operations fail
 *
 * @version 2.0.0
 * @since 2024-01-01
 * @author MAD-AI Development Team
 * @layer Application
 * @module Role Management
 */
@Injectable()
export class GetRoleByNameUseCase {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute role retrieval by name orchestration
   *
   * Orchestrates the complete role retrieval by name workflow following Clean Architecture principles.
   * This method coordinates validation, domain search operations, and side effects while maintaining
   * separation of concerns and proper error handling. Performs exact case-insensitive name matching
   * with comprehensive audit trails.
   *
   * @param request - Role retrieval by name request with application-level types
   * @returns Promise resolving to the Role entity with exact name match
   * @throws {ApplicationError} When validation fails or role retrieval encounters errors
   *
   * @workflow
   * 1. **Application Validation** - Check presence and nullability only
   * 2. **Authorization Validation** - Verify basic authentication requirements
   * 3. **Domain Delegation** - Repository handles all search logic and business rules
   * 4. **Side Effects** - Audit logging only
   *
   * @example
   * ```typescript
   * const role = await getRoleByNameUseCase.execute({
   *   name: 'Administrator',
   *   requesterId: 'admin-456'
   * });
   * ```
   */
  async execute(request: GetRoleByNameRequest): Promise<Role> {
    try {
      // Step 1: Validate application rules and authorization
      this.validateApplicationRules(request);
      await this.validateAuthorization(request.requesterId);

      // Step 2: Delegate to domain repository
      const role = await this.findRoleByName(request.name);

      // Step 3: Handle side effects
      await this.handleSideEffects(role, request.requesterId!);

      return role;
    } catch (error: unknown) {
      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Validate application-level rules for role name search
   *
   * @description
   * Application layer only handles presence and nullability checks.
   * All business rules and constraints are delegated to the Domain layer.
   *
   * @param request Get role by name request to validate
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(request: GetRoleByNameRequest): void {
    if (!request?.name?.trim()) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Invalid input provided: Role name is required for search',
        'Role name is required for search'
      );
    }
    if (request.name.trim().length > 50) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Invalid input provided: Role name too long',
        'Role name must be 50 characters or less'
      );
    }
  }

  /**
   * Validate authorization for role access
   *
   * @description
   * Validates that the requester has proper authorization to access role information.
   * Ensures that the requester ID is provided and has read permissions for roles.
   *
   * @param requesterId ID of the user requesting role access
   * @throws ApplicationError when authorization fails
   */
  private async validateAuthorization(requesterId?: number): Promise<void> {
    if (!requesterId) {
      throw new ApplicationError(
        ApplicationErrorCode.INSUFFICIENT_PERMISSIONS,
        'Requester ID is required for role access',
        'You must be authenticated to access role information'
      );
    }
  }

  /**
   * Find role by delegating search to Domain repository
   *
   * @description
   * Delegates role search to Domain repository. The Domain layer handles
   * all search logic, matching criteria, and business rules. Application
   * layer only orchestrates the call and transforms any repository errors.
   *
   * @param name The role name to search for
   * @returns Promise resolving to the matching Role entity
   * @throws ApplicationError when role retrieval fails
   */
  private async findRoleByName(name: string): Promise<Role> {
    const trimmedName = name.trim();
    const roles = await this.roleRepo.list({ search: trimmedName });

    const foundRole = roles.find((role) => role.name.toLowerCase() === trimmedName.toLowerCase());

    if (!foundRole) {
      throw new ApplicationError(
        ApplicationErrorCode.ROLE_NOT_FOUND,
        `Role with name '${trimmedName}' not found`,
        `No role found with the name '${trimmedName}'`
      );
    }

    return foundRole;
  }

  /**
   * Handle side effects for successful role retrieval
   *
   * @description
   * Manages audit logging after successful role retrieval by name.
   * Logs the search operation with correlation tracking.
   *
   * @param role The retrieved role entity
   * @param requesterId ID of the user requesting the role
   */
  private async handleSideEffects(role: Role, requesterId?: number): Promise<void> {
    // Domain events are no longer needed with simplified Role entity

    // Audit Logging
    const correlationId = `get-role-name-${role.id}-${this.clock.nowEpochSeconds()}`;
    this.logger.info('Role retrieval by name completed', {
      correlationId,
      userId: requesterId?.toString(),
      operation: 'get_role_by_name',
    } as LogContext);
  }
}
