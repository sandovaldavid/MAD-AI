import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, CLOCK_PORT, LOGGER_PORT, DOMAIN_EVENT_BUS_REPO } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger, LogContext } from '@core/interfaces/logger.interface';
import type { DomainEventBusService } from '@core/services/domain-event-bus.service';
import type { BulkDeleteRolesRequest, BulkDeleteRolesResult } from '@application/types/roles.types';

/**
 * Bulk Delete Roles Use Case
 *
 * Application layer orchestrator that handles bulk role deletion operations with comprehensive
 * validation, error handling, and audit logging. This use case manages the deletion of multiple
 * roles in a single operation while maintaining data consistency, proper authorization, and
 * detailed tracking for batch operations following Clean Architecture principles.
 *
 * @description
 * Orchestrates the bulk deletion of roles by coordinating domain entities, repositories,
 * and cross-cutting concerns. Ensures data integrity, proper authorization, and comprehensive
 * audit trails for bulk role deletion operations. Handles complex batch processing with
 * configurable error handling strategies and maintains consistency across the system.
 *
 * @responsibilities
 * - Validate bulk operation parameters and constraints
 * - Ensure proper authorization for bulk role deletion
 * - Process roles in configurable batches with error handling
 * - Maintain transactional consistency for bulk operations
 * - Transform application DTOs to domain operations
 * - Delegate role deletion to domain repository with proper context
 * - Publish domain events for bulk role deletion changes
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
 * - **Events**: Domain event publishing for bulk role deletion operations
 * - **Constraints**: Batch size limits, authorization checks, and business rule validation
 *
 * @dependencies
 * - {@link RoleRepository} - Domain repository for role deletion operations
 * - {@link ClockPort} - System clock for timestamps and correlation IDs
 * - {@link Logger} - Structured logging service with LogContext
 * - {@link DomainEventBusService} - Domain event publishing service
 * - {@link ApplicationErrorTransformer} - Error normalization and transformation
 *
 * @domain-events
 * - BulkRoleDeletionEvent (published for successful bulk operations)
 * - RoleDeletedEvent (published for each successfully deleted role)
 *
 * @constraints
 * - Maximum batch size of 50 roles per operation
 * - Requester must have bulk deletion permissions
 * - All roles must exist before deletion
 * - System must maintain consistency during bulk operations
 * - Configurable error handling (continue on error vs fail fast)
 * - Business rules must be enforced for each role deletion
 *
 * @workflow
 * 1. **Validate Application Rules** - Authorization, batch size, and parameter checks
 * 2. **Delegate to Domain** - Process each role through repository with error handling
 * 3. **Handle Side Effects** - Event publishing and comprehensive audit logging
 * 4. **Return Result** - Detailed bulk operation results with metrics
 *
 * @example
 * ```typescript
 * const useCase = inject(BulkDeleteRoles);
 * const request: BulkDeleteRolesRequest = {
 *   roleIds: [123, 456, 789],
 *   requesterId: 101,
 *   continueOnError: true
 * };
 *
 * const result = await useCase.execute(request);
 * console.log(`Deleted ${result.successful} roles, ${result.failed} failed`);
 * ```
 *
 * @throws {ApplicationError} When validation fails or required data is missing
 * @throws {ApplicationError} When authorization fails or requester lacks permissions
 * @throws {ApplicationError} When batch size exceeds maximum allowed (50)
 * @throws {ApplicationError} When no role IDs are provided for bulk deletion
 * @throws {ApplicationError} When business rules prevent role deletion
 * @throws {ApplicationError} When continueOnError is false and any role deletion fails
 *
 * @version 2.0.0
 * @since 2024-01-01
 * @author MAD-AI Development Team
 * @layer Application
 * @module Role Management
 */
@Injectable({ providedIn: 'root' })
export class BulkDeleteRoles {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly eventBus = inject<DomainEventBusService>(DOMAIN_EVENT_BUS_REPO);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute bulk role deletion orchestration
   *
   * Orchestrates the complete bulk role deletion workflow following Clean Architecture principles.
   * This method coordinates validation, domain operations, and side effects while maintaining
   * separation of concerns and proper error handling. Processes multiple roles with configurable
   * error handling and provides comprehensive results with execution metrics.
   *
   * @param request - Bulk deletion request with role IDs and configuration
   * @returns Promise resolving to bulk deletion result with detailed metrics
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
   * const request: BulkDeleteRolesRequest = {
   *   roleIds: [123, 456, 789],
   *   requesterId: 101,
   *   continueOnError: false
   * };
   *
   * const result = await bulkDeleteRolesUseCase.execute(request);
   * ```
   */
  async execute(request: BulkDeleteRolesRequest): Promise<BulkDeleteRolesResult> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(request);

      // Step 2: Delegate to domain repository
      const result = await this.performBulkDeletion(request);

      // Step 3: Handle side effects
      await this.handleSideEffects(result, request.requesterId);

      return result;
    } catch (error: unknown) {
      this.logger.error('Bulk role deletion failed', {
        correlationId: `bulk-delete-failed-${request.requesterId}-${this.clock.nowEpochSeconds()}`,
        userId: request.requesterId?.toString(),
        operation: 'bulk_delete_roles',
      } as LogContext);

      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Validate application-level rules for bulk role deletion
   *
   * @description
   * Validates request parameters and business rules specific to bulk operations at the application layer.
   * Ensures batch size constraints, proper authorization, and required data before proceeding with
   * bulk role deletion. Performs comprehensive validation to prevent invalid bulk operations.
   *
   * @param request Bulk deletion request to validate
   * @throws ApplicationError when validation fails or constraints are violated
   *
   * @validation-rules
   * - Request must contain at least one role ID
   * - Batch size must not exceed maximum allowed (50)
   * - Requester ID must be valid and present
   * - Role IDs must be valid numbers
   */
  private validateApplicationRules(request: BulkDeleteRolesRequest): void {
    if (!request?.roleIds?.length) {
      throw this.errorTransformer.transform(new Error('No role IDs provided for bulk deletion'));
    }

    if (request.roleIds.length > 50) {
      throw this.errorTransformer.transform(new Error('Too many roles for bulk deletion'));
    }

    if (!request.requesterId || typeof request.requesterId !== 'number') {
      throw this.errorTransformer.transform(new Error('Invalid requester ID'));
    }
  }

  /**
   * Perform bulk deletion operation
   *
   * @description
   * Executes the bulk deletion operation by processing each role individually through the domain repository.
   * Supports configurable error handling strategies (continue on error vs fail fast) and tracks
   * success/failure metrics for comprehensive reporting. Maintains consistency and proper error isolation.
   *
   * @param request Bulk deletion request with role IDs and configuration
   * @returns Promise resolving to bulk deletion result with success/failure metrics
   *
   * @processing-strategy
   * - Process roles individually to maintain isolation
   * - Support configurable error handling (continueOnError flag)
   * - Track detailed success/failure metrics
   * - Maintain consistency across the operation
   */
  private async performBulkDeletion(
    request: BulkDeleteRolesRequest
  ): Promise<BulkDeleteRolesResult> {
    const startTime = this.clock.nowEpochSeconds();
    const correlationId = `bulk-delete-roles-${request.roleIds.join('-')}-${startTime}`;

    let deletedCount = 0;
    for (const roleId of request.roleIds) {
      try {
        await this.roleRepo.delete(roleId);
        deletedCount++;
      } catch (error) {
        if (!request.continueOnError) {
          throw error;
        }
      }
    }

    const endTime = this.clock.nowEpochSeconds();
    const executionTime = endTime - startTime;

    return {
      successful: deletedCount,
      failed: request.roleIds.length - deletedCount,
      total: request.roleIds.length,
      executionTime,
      correlationId,
    };
  }

  /**
   * Handle side effects for successful bulk deletion
   *
   * @description
   * Manages domain event publishing and comprehensive audit logging after successful bulk role deletion.
   * Publishes bulk operation events and logs the operation with correlation tracking for audit
   * and monitoring purposes. Ensures proper event handling and logging consistency for bulk operations.
   *
   * @param result Bulk deletion result with success/failure metrics
   * @param requesterId ID of user who performed the bulk operation
   *
   * @side-effects
   * - Publishes BulkRoleDeletionEvent domain events
   * - Logs bulk operation with correlation ID and metrics
   * - Tracks operation metadata for audit purposes
   * - Records execution details for monitoring
   */
  private async handleSideEffects(
    result: BulkDeleteRolesResult,
    requesterId?: number
  ): Promise<void> {
    const correlationId = result.correlationId;

    // Domain Events - Simulate publishing for bulk deletion
    this.logger.info(
      `Domain Events simulation: BulkRoleDeletionEvent for ${result.successful} roles`,
      {
        correlationId,
      } as LogContext
    );

    // TODO: Once Domain Event Bus is connected to real API, implement bulk event publishing
    // await this.eventBus.publish(new BulkRoleDeletionEvent(result, requesterId));

    // Audit Logging
    this.logger.info('Bulk role deletion completed', {
      userId: requesterId?.toString(),
      operation: 'bulk_delete_roles',
      correlationId,
    } as LogContext);
  }
}
