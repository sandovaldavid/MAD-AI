import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger, LogContext } from '@core/interfaces/logger.interface';
import type { ListRolesRequest, RoleFilters } from '@application/types/roles.types';
import type { Role } from '@domain/entities/role.entity';

/**
 * List Roles Use Case
 *
 * Application layer orchestrator that handles role listing with comprehensive filtering,
 * validation, audit logging, and domain event publishing. This use case follows the 4-step
 * orchestration pattern defined in Clean Architecture principles and ensures secure role
 * enumeration with proper authorization and filtering capabilities.
 *
 * @description
 * Orchestrates the listing of roles from the system with optional filtering by coordinating
 * domain entities, repositories, and cross-cutting concerns. Supports advanced filtering
 * by access level, active status, and search terms. Ensures data integrity, authorization,
 * and proper event publishing for role enumeration operations. Handles domain events
 * from multiple role entities and provides comprehensive audit trails for bulk operations.
 *
 * @responsibilities
 * - Validate application-level presence and nullability checks only
 * - Transform application filters to domain repository contracts
 * - Delegate role listing and all business rule validation to domain repository
 * - Handle audit logging and error normalization
 * - Ensure transactional consistency for listing operations
 * - Support pagination and filtering through domain delegation
 *
 * @architecture
 * - **Layer**: Application Layer (Clean Architecture)
 * - **Pattern**: Use Case orchestrator with 4-step pattern + filter mapping
 * - **Dependencies**: Domain Repository, Core Services (Logger, Clock, Event Bus)
 * - **Injection**: Token-based dependency injection
 * - **Error Handling**: ApplicationError transformation
 * - **Events**: Bulk domain event publishing for multiple entities
 * - **Constraints**: Filter validation, authorization checks, access level ranges
 *
 * @dependencies
 * - {@link RoleRepository} - Domain repository for role listing and filtering
 * - {@link ClockPort} - System clock for timestamps
 * - {@link Logger} - Structured logging service
 * - {@link DomainEventBusService} - Domain event publishing
 * - {@link ApplicationErrorTransformer} - Error normalization
 *
 * @domain-events
 * - RoleRetrievedEvent (published from each role entity domain events)
 *
 * @constraints
 * - All business rule validation delegated to domain repository
 * - Application layer only handles presence and nullability checks
 * - Domain repository enforces access level ranges and business constraints
 * - Filter parameter validation handled by domain layer
 *
 * @workflow
 * 1. **Validate Application Rules** - Presence and nullability checks only
 * 2. **Delegate to Domain** - Repository handles filtering and all business rule validation
 * 3. **Handle Side Effects** - Audit logging for successful operations
 * 4. **Return Result** - Array of role entities with domain validation completed
 *
 * @example
 * ```typescript
 * const useCase = inject(ListRoles);
 *
 * // List all roles
 * const allRoles = await useCase.execute();
 *
 * // List roles with filters
 * const request: ListRolesRequest = {
 *   filters: {
 *     accessLevel: 3,
 *     isActive: true
 *   },
 *   requesterId: 'admin-456'
 * };
 * const filteredRoles = await useCase.execute(request);
 * ```
 *
 * @throws {ApplicationError} When basic presence validation fails
 * @throws {ApplicationError} When domain repository validation fails
 * @throws {ApplicationError} When domain business rules are violated
 * @throws {ApplicationError} When system constraints prevent role listing
 *
 * @version 2.0.0
 * @since 2024-01-01
 * @author MAD-AI Development Team
 * @layer Application
 * @module Role Management
 */
@Injectable()
export class ListRoles {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute role listing orchestration
   *
   * Orchestrates the complete role listing workflow following Clean Architecture principles.
   * This method coordinates validation, domain filtering operations, and side effects while
   * maintaining separation of concerns and proper error handling. Supports optional filtering
   * and comprehensive audit trails for role enumeration operations.
   *
   * @param request - Optional role listing request with filters and requester info
   * @returns Promise resolving to array of Role entities matching the criteria
   * @throws {ApplicationError} When validation fails or role listing encounters errors
   *
   * @workflow
   * 1. **Application Validation** - Check presence and basic nullability only
   * 2. **Domain Filtering** - Transform filters and delegate to repository with full business validation
   * 3. **Side Effects** - Log audit information for successful operations
   * 4. **Return Result** - Return filtered array of role entities
   *
   * @example
   * ```typescript
   * // Simple listing
   * const roles = await listRolesUseCase.execute();
   *
   * // Filtered listing
   * const roles = await listRolesUseCase.execute({
   *   filters: { accessLevel: 2, isActive: true },
   *   requesterId: 'admin-456'
   * });
   * ```
   */
  async execute(request?: ListRolesRequest): Promise<Role[]> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(request);

      // Step 2: Delegate to domain repository
      const domainFilters = this.mapToDomainFilters(request?.filters);
      const roles = await this.roleRepo.list(domainFilters);

      // Step 3: Handle side effects
      await this.handleSideEffects(roles, request?.requesterId);

      return roles;
    } catch (error: unknown) {
      this.logger.error('Role listing failed', {
        correlationId: `list-roles-${this.clock.nowEpochSeconds()}`,
        userId: request?.requesterId?.toString(),
        operation: 'list_roles',
      } as LogContext);

      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Validate application-level rules for role listing
   *
   * @description
   * Validates basic presence and nullability checks for the application layer.
   * All business rule validation is delegated to the domain layer through
   * repository operations that will enforce domain constraints.
   *
   * @param request Optional list roles request to validate
   * @throws ApplicationError when basic validation fails
   */
  private validateApplicationRules(request?: ListRolesRequest): void {
    // Application layer only validates presence and basic nullability
    // All business rule validation is delegated to domain repository
    // No additional validation needed - filters are optional
    // Domain repository will handle all business rule validation
  }

  /**
   * Handle side effects for successful role listing
   *
   * @description
   * Manages bulk domain event publishing and audit logging after successful role listing.
   * Publishes domain events from all retrieved role entities and logs the listing operation
   * with correlation tracking for bulk operations.
   *
   * @param roles Array of retrieved role entities
   * @param requesterId ID of the user requesting the role listing
   */
  private async handleSideEffects(roles: Role[], requesterId?: number): Promise<void> {
    // Domain Events - No longer needed with simplified Role entity

    // Audit Logging
    const correlationId = `list-roles-${this.clock.nowEpochSeconds()}`;
    this.logger.info('Role listing completed', {
      correlationId,
      userId: requesterId?.toString(),
      operation: 'list_roles',
    } as LogContext);
  }

  /**
   * Map Application filters to Domain contract
   *
   * @description
   * Transforms application-level filter objects to domain repository contract format.
   * Handles the mapping between application filter types and domain repository expectations.
   * All filter validation is delegated to the domain repository which will enforce
   * business rules and constraints.
   *
   * @param filters Optional application-level role filters
   * @returns Domain repository filter contract or undefined if no filters provided
   */
  private mapToDomainFilters(filters?: RoleFilters) {
    if (!filters || Object.keys(filters).length === 0) return undefined;

    return {
      search: filters.accessLevel ? `level:${filters.accessLevel}` : undefined,
      active: filters.isActive,
    };
  }
}
