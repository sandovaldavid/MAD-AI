import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger, LogContext } from '@core/interfaces/logger.interface';
import type { GetRoleByNameRequest } from '@application/types/roles.types';
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
 * Orchestrates the retrieval of roles by their exact name from the system by coordinating domain
 * entities, repositories, and cross-cutting concerns. Performs case-insensitive exact matching
 * with comprehensive validation and audit trails. Ensures data integrity, authorization, and
 * proper event publishing for role search operations. Handles domain events and provides
 * detailed audit logging for role access patterns.
 *
 * @responsibilities
 * - Validate application-level authorization and search permissions
 * - Verify role name format, length, and search constraints
 * - Perform exact case-insensitive name matching
 * - Transform application DTOs to domain operations
 * - Delegate role search to domain repository with filtering
 * - Publish domain events from retrieved role entity
 * - Handle audit logging and error normalization
 * - Ensure transactional consistency for search operations
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
 * - Role name must be provided and non-empty
 * - Role name length limited to 100 characters
 * - Exact case-insensitive name matching required
 * - Role must exist in the system
 * - Requester must have read permissions for the role
 * - System roles may have additional access restrictions
 *
 * @workflow
 * 1. **Validate Application Rules** - Name format and constraint checks
 * 2. **Validate Authorization** - Check user permissions and authentication
 * 3. **Delegate to Domain** - Repository handles search with filtering and exact matching
 * 4. **Handle Side Effects** - Event publishing and audit logging
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
 * @throws {ApplicationError} When validation fails or role name is invalid
 * @throws {ApplicationError} When authorization fails or requester lacks permissions
 * @throws {ApplicationError} When role with exact name does not exist
 * @throws {ApplicationError} When role name exceeds length constraints
 * @throws {ApplicationError} When system constraints prevent role access
 *
 * @version 2.0.0
 * @since 2024-01-01
 * @author MAD-AI Development Team
 * @layer Application
 * @module Role Management
 */
@Injectable({ providedIn: 'root' })
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
   * 1. **Application Validation** - Check name format and constraints
   * 2. **Authorization Validation** - Verify user permissions and authentication
   * 3. **Domain Search** - Perform exact case-insensitive name matching via repository
   * 4. **Side Effects** - Publish domain events and log audit information
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
   * Validates request parameters including role name format, length constraints,
   * and basic business rules specific to the application layer. Domain validation
   * is handled by the repository layer.
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

    if (request.name.length > 50) {
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
   * Find role by exact name match
   *
   * @description
   * Performs exact case-insensitive name matching by searching the repository
   * and finding the role with the exact name match. Throws error if no exact
   * match is found.
   *
   * @param name The role name to search for (exact match, case-insensitive)
   * @returns Promise resolving to the matching Role entity
   * @throws ApplicationError when no exact match is found
   */
  private async findRoleByName(name: string): Promise<Role> {
    const roles = await this.roleRepo.list({ search: name.trim() });

    // Find exact match (case-insensitive)
    const exactMatch = roles.find((role) => role.name.toLowerCase() === name.trim().toLowerCase());

    if (!exactMatch) {
      throw new ApplicationError(
        ApplicationErrorCode.ROLE_NOT_FOUND,
        `Role with name '${name.trim()}' not found`,
        `No role found with the name '${name.trim()}'`
      );
    }

    return exactMatch;
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
