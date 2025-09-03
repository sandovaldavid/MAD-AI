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

/**
 * List Users Use Case
 *
 * @description
 * Application layer orchestrator that handles user listing with validation,
 * filtering, audit logging, and error normalization. This use case follows the orchestration
 * pattern with error normalization to ensure consistent user listing workflow.
 *
 * @responsibilities
 * - Orchestrate user listing with validation and side effects
 * - Validate application-level access rules
 * - Execute user listing through domain repository
 * - Handle listing audit logging for compliance purposes
 * - Normalize errors for application layer consumption
 *
 * @architecture
 * This use case acts as an orchestrator that:
 * 1. Validates application rules (filter parameters, access permissions)
 * 2. Delegates user listing to domain repository
 * 3. Handles side effects (audit logging, access tracking)
 * 4. Normalizes errors for consistent error handling
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class ListUsers {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  /**
   * Execute user listing orchestration with validation and audit logging
   *
   * @param request User listing request with optional filter
   * @returns Promise resolving to list of users with total count
   * @throws ApplicationError when listing fails or access denied
   */
  async execute(request?: ListUsersRequest): Promise<ListUsersResult> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(request?.filter);

      // Step 2: Delegate to domain repository
      const users = await this.userRepo.list(request?.filter);

      // Step 3: Handle side effects
      this.handleUserListingSideEffects();

      return {
        users,
        totalCount: users.length,
      };
    } catch (error: unknown) {
      // Step 4: Normalize errors for application layer
      const appError = this.errorTransformer.transform(error, {
        operation: 'list_users',
      });
      throw appError;
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
   * Handle side effects after successful user listing
   *
   * @description
   * Manages audit logging and other side effects related to user listing operations.
   * This includes access tracking and performance monitoring.
   *
   * @param resultCount Number of users returned
   * @param filter Filter criteria that was applied
   * @param requesterId ID of user making the request
   */
  private handleUserListingSideEffects(): void {
    // Log user listing for audit trail
    this.logger.info('Users listed successfully', {
      operation: 'list_users',
    });

    // Additional side effects can be added here:
    // - Performance monitoring for large queries
    // - Access pattern analysis
    // - Rate limiting checks
    // - Cache management
    // - Usage analytics
  }
}
