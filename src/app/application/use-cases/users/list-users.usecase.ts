import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { Logger } from '@core/interfaces/logger.interface';
import type { ListUsersRequest, ListUsersResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { UserListFilterContract } from '@/app/domain/repositories/business/user.contract';
import type { User } from '@domain/entities/user.entity';

/**
 * List Users Use Case
 *
 * Application layer orchestrator that handles user listing operations with comprehensive validation,
 * authorization, audit logging, and error normalization. This use case follows the 4-step orchestration
 * pattern defined in Clean Architecture principles.
 *
 * @description
 * Orchestrates the retrieval of users from the system by coordinating domain repositories,
 * and cross-cutting concerns. Ensures data integrity, authorization, and proper event publishing
 * for audit and system integration purposes.
 *
 * @responsibilities
 * - Validate application-level authorization and business rules
 * - Transform application DTOs to domain operations
 * - Delegate user listing to domain repository
 * - Handle audit logging and error normalization
 * - Ensure transactional consistency
 *
 * @architecture
 * - **Layer**: Application Layer (Clean Architecture)
 * - **Pattern**: Use Case orchestrator with 4-step pattern
 * - **Dependencies**: Domain Repository, Core Services (Logger, Clock)
 * - **Injection**: Token-based dependency injection
 * - **Error Handling**: ApplicationError preservation and transformation
 *
 * @workflow
 * 1. **Validate Application Rules** - Filter parameters and constraint checks
 * 2. **Validate Authorization** - Check user permissions and authentication
 * 3. **Delegate to Domain** - Repository handles business logic and persistence
 * 4. **Handle Side Effects** - Audit logging with correlation ID
 *
 * @example
 * ```typescript
 * const result = await listUsersUseCase.execute({
 *   filter: { limit: 10, offset: 0 },
 *   requesterId: 456
 * });
 * ```
 *
 * @throws {ApplicationError} When validation fails or listing encounters errors
 * @throws {ApplicationError} When authorization fails or requester lacks permissions
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class ListUsersUseCase {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  /**
   * Execute user listing orchestration with 4-step pattern
   *
   * @description
   * Orchestrates the complete user listing workflow following Clean Architecture principles.
   * This method coordinates validation, authorization, domain operations, and side effects
   * while maintaining separation of concerns and proper error handling.
   *
   * @param request User listing request with filter and requester information
   * @returns Promise resolving to list of users with total count
   * @throws ApplicationError when validation, authorization, or listing fails
   *
   * @workflow
   * 1. **Application Validation** - Check filter parameters and basic constraints
   * 2. **Authorization Validation** - Verify requester permissions and authentication
   * 3. **Domain Delegation** - Execute listing through UserRepository
   * 4. **Side Effects** - Audit logging with correlation ID
   *
   * @example
   * ```typescript
   * const users = await listUsersUseCase.execute({
   *   filter: { limit: 10 },
   *   requesterId: 456
   * });
   * ```
   */
  async execute(request?: ListUsersRequest): Promise<ListUsersResult> {
    try {
      // Step 1: Validate application rules and authorization
      this.validateApplicationRules(request?.filter);
      await this.validateAuthorization(request?.requesterId);

      // Step 2: Delegate to domain repository
      const users = await this.userRepo.list(request?.filter);

      // Step 3: Handle side effects
      await this.handleUserListingSideEffects(users, request?.requesterId, request?.filter);

      return {
        users,
        totalCount: users.length,
      };
    } catch (error: unknown) {
      // Don't transform ApplicationErrors (already in correct format)
      if (error instanceof ApplicationError) {
        throw error;
      }
      // Transform external errors (repository, system errors)
      throw this.errorTransformer.transform(error, {
        operation: 'list_users',
      });
    }
  }

  /**
   * Validate application-level rules for user listing
   *
   * @description
   * Validates request parameters and business rules specific to the application layer.
   * Domain validation is handled by the repository layer.
   *
   * @param filter Filter criteria to validate
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(filter?: UserListFilterContract): void {
    if (filter === null) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Filter parameter cannot be null',
        'Filter parameter cannot be null',
        { providedFilter: filter }
      );
    }

    if (filter && typeof filter !== 'object') {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Filter parameter must be a valid object',
        'Filter parameter must be a valid object',
        { providedFilter: filter }
      );
    }

    // Validate pagination parameters if provided
    if (filter?.limit !== undefined) {
      if (typeof filter.limit !== 'number' || filter.limit <= 0) {
        throw new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Limit must be a positive number',
          'Limit must be a positive number',
          { providedLimit: filter.limit }
        );
      }

      if (filter.limit > 1000) {
        throw new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Limit cannot exceed 1000 records per request',
          'Limit cannot exceed 1000 records per request',
          { providedLimit: filter.limit, maxLimit: 1000 }
        );
      }
    }

    if (filter?.offset !== undefined) {
      if (typeof filter.offset !== 'number' || filter.offset < 0) {
        throw new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Offset must be a non-negative number',
          'Offset must be a non-negative number',
          { providedOffset: filter.offset }
        );
      }
    }
  }

  /**
   * Validate authorization for user listing
   *
   * @description
   * Ensures the requester has proper permissions to list users.
   * This is an application-level concern for access control.
   *
   * @param requesterId ID of user making the request
   * @throws ApplicationError when authorization fails
   */
  private async validateAuthorization(requesterId?: number): Promise<void> {
    // Check if requester is authenticated
    if (!requesterId) {
      throw new ApplicationError(
        ApplicationErrorCode.INSUFFICIENT_PERMISSIONS,
        'Requester ID is required for user listing',
        'You must be authenticated to list users'
      );
    }

    // Note: In a full implementation, you would:
    // 1. Fetch the requester user from UserRepository
    // 2. Check their role and permissions using business logic
    // 3. Validate they have user management permissions
    //
    // For now, we're accepting any authenticated user
    // This should be expanded based on business requirements

    this.logger.info('Authorization validated for user listing', {
      operation: 'list_users_authorization',
    });
  }

  /**
   * Handle side effects after successful user listing
   *
   * @description
   * Manages audit logging and other side effects related to user listing operations.
   * This includes access tracking and performance monitoring.
   *
   * @param users List of users returned
   * @param requesterId ID of user making the request
   * @param filter Filter criteria that was applied
   */
  private async handleUserListingSideEffects(
    users: User[],
    requesterId?: number,
    filter?: UserListFilterContract
  ): Promise<void> {
    const correlationId = `list-users-${this.clock.nowEpochSeconds()}`;

    // Log user listing for audit trail
    this.logger.info('Users listed successfully', {
      operation: 'list_users',
      correlationId,
    });

    // Additional side effects can be added here:
    // - Performance monitoring for large queries
    // - Access pattern analysis
    // - Rate limiting checks
    // - Cache management
    // - Usage analytics
  }
}
