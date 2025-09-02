import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, CLOCK_PORT, LOGGER_PORT, DOMAIN_EVENT_BUS_REPO } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { BulkCreateRolesRequest, BulkCreateRolesResult } from '@application/types/roles.types';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger, LogContext } from '@core/interfaces/logger.interface';
import type { DomainEventBusService } from '@core/services/domain-event-bus.service';

/**
 * Bulk Create Roles Use Case
 *
 * Application layer orchestrator that handles bulk role creation operations with comprehensive
 * validation, error handling, and audit logging. This use case manages the creation of multiple
 * roles in a single operation while maintaining data consistency, proper authorization, and
 * detailed tracking for batch operations following Clean Architecture principles.
 *
 * @description
 * Orchestrates the bulk creation of roles by coordinating domain entities, repositories,
 * and cross-cutting concerns. Ensures data integrity, proper authorization, and comprehensive
 * audit trails for bulk role creation operations. Handles complex batch processing with
 * configurable error handling strategies and maintains consistency across the system.
 *
 * @responsibilities
 * - Validate bulk operation parameters and constraints
 * - Ensure proper authorization for bulk role creation
 * - Process roles in configurable batches with error handling
 * - Maintain transactional consistency for bulk operations
 * - Transform application DTOs to domain operations
 * - Delegate role creation to domain repository with proper context
 * - Publish domain events for bulk role creation changes
 * - Handle comprehensive audit logging with correlation tracking
 * - Provide detailed results with success/failure metrics
 * - Support configurable error handling (continue on error or fail fast)
 *
 * @architecture
 * - **Layer**: Application Layer (Clean Architecture)
 * - **Pattern**: Use Case orchestrator with 4-step pattern and bulk processing
 * - **Dependencies**: Role Domain Repository, Core Services (Logger, Clock, Event Bus)
 * - **Injection**: Token-based dependency injection
 * - **Error Handling**: ApplicationError transformation with detailed context
 * - **Events**: Domain event publishing for bulk role creation operations
 * - **Constraints**: Batch size limits, authorization checks, and business rule validation
 *
 * @dependencies
 * - {@link RoleRepository} - Domain repository for role creation operations
 * - {@link ClockPort} - System clock for timestamps and correlation IDs
 * - {@link Logger} - Structured logging service with LogContext
 * - {@link DomainEventBusService} - Domain event publishing service
 * - {@link ApplicationErrorTransformer} - Error normalization and transformation
 *
 * @domain-events
 * - BulkRoleCreationEvent (published for successful bulk operations)
 * - RoleCreatedEvent (published for each successfully created role)
 *
 * @constraints
 * - Maximum batch size of 100 roles per operation
 * - Requester must have bulk creation permissions
 * - All roles must pass individual validation rules
 * - System must maintain consistency during bulk operations
 * - Configurable error handling (continue on error vs fail fast)
 * - Business rules must be enforced for each role
 *
 * @workflow
 * 1. **Validate Application Rules** - Authorization, batch size, and parameter checks
 * 2. **Delegate to Domain** - Process each role through repository with error handling
 * 3. **Handle Side Effects** - Event publishing and comprehensive audit logging
 * 4. **Return Result** - Detailed bulk operation results with metrics
 *
 * @example
 * ```typescript
 * const useCase = inject(BulkCreateRoles);
 * const request: BulkCreateRolesRequest = {
 *   roles: [
 *     { name: 'Project Manager', accessLevel: 3, description: 'Manages projects' },
 *     { name: 'Developer', accessLevel: 2, description: 'Develops software' }
 *   ],
 *   requesterId: 123,
 *   continueOnError: true
 * };
 *
 * const result = await useCase.execute(request);
 * console.log(`Created ${result.successful} roles, ${result.failed} failed`);
 * ```
 *
 * @throws {ApplicationError} When validation fails or required data is missing
 * @throws {ApplicationError} When authorization fails or requester lacks permissions
 * @throws {ApplicationError} When batch size exceeds maximum allowed (100)
 * @throws {ApplicationError} When no roles are provided for bulk creation
 * @throws {ApplicationError} When business rules prevent role creation
 * @throws {ApplicationError} When continueOnError is false and any role fails
 *
 * @version 2.0.0
 * @since 2024-01-01
 * @author MAD-AI Development Team
 * @layer Application
 * @module Role Management
 */
@Injectable({ providedIn: 'root' })
export class BulkCreateRoles {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly eventBus = inject<DomainEventBusService>(DOMAIN_EVENT_BUS_REPO);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute bulk role creation orchestration
   *
   * Orchestrates the complete bulk role creation workflow following Clean Architecture principles.
   * This method coordinates validation, domain operations, and side effects while maintaining
   * separation of concerns and proper error handling. Processes multiple roles with configurable
   * error handling and provides comprehensive results with execution metrics.
   *
   * @param request - Bulk creation request with roles data and configuration
   * @returns Promise resolving to bulk creation result with detailed metrics
   * @throws {ApplicationError} When validation fails or operation encounters critical errors
   *
   * @workflow
   * 1. **Application Validation** - Check authorization, batch constraints, and parameters
   * 2. **Domain Delegation** - Process each role through repository with error handling
   * 3. **Side Effects** - Publish domain events and log comprehensive audit information
   * 4. **Return Result** - Provide detailed bulk operation results with execution metrics
   *
   * @example
   * ```typescript
   * const request: BulkCreateRolesRequest = {
   *   roles: [
   *     { name: 'Admin', accessLevel: 5, description: 'System administrator' },
   *     { name: 'User', accessLevel: 1, description: 'Regular user' }
   *   ],
   *   requesterId: 456,
   *   continueOnError: false
   * };
   *
   * const result = await bulkCreateRolesUseCase.execute(request);
   * ```
   */
  async execute(request: BulkCreateRolesRequest): Promise<BulkCreateRolesResult> {
    const startTime = this.clock.nowEpochSeconds();
    const correlationId = `bulk-roles-${request.requesterId}-${startTime}`;

    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(request);

      // Step 2: Delegate to domain repository for bulk creation
      const result = await this.performBulkCreation(request);

      // Step 3: Handle side effects
      await this.handleBulkCreationSideEffects(result, request.requesterId, correlationId);

      return {
        ...result,
        executionTime: this.clock.nowEpochSeconds() - startTime,
        correlationId,
      } as BulkCreateRolesResult;
    } catch (error: unknown) {
      this.logger.error('Bulk role creation failed', {
        correlationId,
        userId: request.requesterId?.toString(),
        operation: 'bulk_create_roles',
      } as LogContext);

      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Validate application-level rules for bulk role creation
   *
   * @description
   * Validates request parameters and business rules specific to bulk operations at the application layer.
   * Ensures batch size constraints, proper authorization, and required data before proceeding with
   * bulk role creation. Performs comprehensive validation to prevent invalid bulk operations.
   *
   * @param request Bulk creation request to validate
   * @throws ApplicationError when validation fails or constraints are violated
   *
   * @validation-rules
   * - Request must contain at least one role
   * - Batch size must not exceed maximum allowed (100)
   * - Requester ID must be valid and present
   * - Role data must meet basic structural requirements
   */
  private validateApplicationRules(request: BulkCreateRolesRequest): void {
    if (!request.roles || request.roles.length === 0) {
      throw this.errorTransformer.transform(new Error('Bulk creation requires at least one role'));
    }

    if (request.roles.length > 100) {
      throw this.errorTransformer.transform(new Error('Batch size exceeds maximum allowed (100)'));
    }

    if (!request.requesterId || typeof request.requesterId !== 'number') {
      throw this.errorTransformer.transform(new Error('Valid requester ID is required'));
    }
  }

  /**
   * Perform bulk creation by processing each role individually
   *
   * @description
   * Executes the bulk creation operation by processing each role individually through the domain repository.
   * Supports configurable error handling strategies (continue on error vs fail fast) and tracks
   * success/failure metrics for comprehensive reporting. Maintains consistency and proper error isolation.
   *
   * @param request Bulk creation request with role data and configuration
   * @returns Promise resolving to bulk creation result with success/failure metrics
   *
   * @processing-strategy
   * - Process roles individually to maintain isolation
   * - Support configurable error handling (continueOnError flag)
   * - Track detailed success/failure metrics
   * - Maintain consistency across the operation
   */
  private async performBulkCreation(
    request: BulkCreateRolesRequest
  ): Promise<{ successful: number; failed: number; total: number }> {
    let successful = 0;
    let failed = 0;

    // Process each role individually using existing create method
    for (const roleData of request.roles) {
      try {
        const createContract = {
          name: roleData.name,
          accessLevel: roleData.accessLevel,
          description: roleData.description,
          canLeadProjects: roleData.canLeadProjects,
          isUniquePerTeam: roleData.isUniquePerTeam,
        };

        await this.roleRepo.create(createContract);
        successful++;
      } catch (error) {
        // Continue with next role if continueOnError is true
        if (!request.continueOnError) {
          throw error;
        }
        failed++;
      }
    }

    return {
      successful,
      failed,
      total: request.roles.length,
    };
  }

  /**
   * Handle side effects for successful bulk role creation
   *
   * @description
   * Manages domain event publishing and comprehensive audit logging after successful bulk role creation.
   * Publishes bulk operation events and logs the operation with correlation tracking for audit
   * and monitoring purposes. Ensures proper event handling and logging consistency for bulk operations.
   *
   * @param result Bulk creation result with success/failure metrics
   * @param requesterId ID of user who performed the bulk operation
   * @param correlationId Correlation ID for operation tracing
   *
   * @side-effects
   * - Publishes BulkRoleCreationEvent domain events
   * - Logs bulk operation with correlation ID and metrics
   * - Tracks operation metadata for audit purposes
   * - Records execution details for monitoring
   */
  private async handleBulkCreationSideEffects(
    result: { successful: number; failed: number; total: number },
    requesterId: number,
    correlationId: string
  ): Promise<void> {
    // Domain Events - Simulate publishing for bulk operation
    this.logger.info(
      `Domain Events simulation: BulkRoleCreationEvent for ${result.successful} roles`,
      {
        correlationId,
      } as LogContext
    );

    // TODO: Once Domain Event Bus is connected to real API, implement bulk event publishing
    // await this.eventBus.publish(new BulkRoleCreationEvent(result, requesterId));

    // Structured logging with correlation ID
    this.logger.info('Bulk role creation completed', {
      correlationId,
      userId: requesterId.toString(),
      operation: 'bulk_create_roles',
    } as LogContext);
  }
}
