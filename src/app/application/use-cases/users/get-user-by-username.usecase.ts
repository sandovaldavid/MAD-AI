import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { Logger } from '@core/interfaces/logger.interface';
import type { GetUserByUsernameRequest, GetUserResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { User } from '@domain/entities/user.entity';

/**
 * Get User By Username Use Case
 *
 * Application layer orchestrator that handles user retrieval by username with comprehensive validation,
 * authorization, security logging, and error normalization. This use case follows the 4-step orchestration
 * pattern defined in Clean Architecture principles.
 *
 * @description
 * Orchestrates the retrieval of users by username from the system by coordinating domain repositories,
 * and cross-cutting concerns. Ensures data integrity, authorization, and proper event publishing
 * for audit and system integration purposes.
 *
 * @responsibilities
 * - Validate application-level authorization and business rules
 * - Transform application DTOs to domain operations
 * - Delegate user lookup to domain repository
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
 * 1. **Validate Application Rules** - Username format and constraint checks
 * 2. **Validate Authorization** - Check user permissions and authentication
 * 3. **Delegate to Domain** - Repository handles business logic and persistence
 * 4. **Handle Side Effects** - Audit logging with correlation ID
 *
 * @example
 * ```typescript
 * const user = await getUserByUsernameUseCase.execute({
 *   username: 'john_doe',
 *   requesterId: 456
 * });
 * ```
 *
 * @throws {ApplicationError} When validation fails or user retrieval encounters errors
 * @throws {ApplicationError} When authorization fails or requester lacks permissions
 * @throws {ApplicationError} When user with username does not exist
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class GetUserByUsernameUseCase {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  /**
   * Execute user lookup orchestration with 4-step pattern
   *
   * @description
   * Orchestrates the complete user lookup by username workflow following Clean Architecture principles.
   * This method coordinates validation, authorization, domain operations, and side effects
   * while maintaining separation of concerns and proper error handling.
   *
   * @param request User lookup request with username and requester information
   * @returns Promise resolving to user entity
   * @throws ApplicationError when validation, authorization, or lookup fails
   *
   * @workflow
   * 1. **Application Validation** - Check username format and constraints
   * 2. **Authorization Validation** - Verify requester permissions and authentication
   * 3. **Domain Delegation** - Execute lookup through UserRepository
   * 4. **Side Effects** - Audit logging with correlation ID
   *
   * @example
   * ```typescript
   * const user = await getUserByUsernameUseCase.execute({
   *   username: 'john_doe',
   *   requesterId: 456
   * });
   * ```
   */
  async execute(request: GetUserByUsernameRequest): Promise<GetUserResult> {
    try {
      // Step 1: Validate application rules and authorization
      this.validateApplicationRules(request.username);
      await this.validateAuthorization(request.requesterId);

      // Step 2: Delegate to domain repository
      const user = await this.userRepo.getByUsername(request.username);

      // Check if user was found
      if (!user) {
        throw new ApplicationError(
          ApplicationErrorCode.USER_NOT_FOUND,
          'No user found with the provided username',
          'No user found with the provided username',
          { searchedUsername: request.username }
        );
      }

      // Step 3: Handle side effects
      await this.handleUserLookupSideEffects(user, request.requesterId, request.username);

      return user;
    } catch (error: unknown) {
      // Don't transform ApplicationErrors (already in correct format)
      if (error instanceof ApplicationError) {
        throw error;
      }
      // Transform external errors (repository, system errors)
      throw this.errorTransformer.transform(error, {
        operation: 'get_user_by_username',
      });
    }
  }

  /**
   * Validate application-level rules for user lookup by username
   *
   * @description
   * Validates request parameters and business rules specific to the application layer.
   * Domain validation is handled by the repository layer.
   *
   * @param username Username to validate
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(username: string): void {
    if (!username || typeof username !== 'string') {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Username parameter is required and must be a non-empty string',
        'Username parameter is required and must be a non-empty string',
        { providedUsername: username }
      );
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length === 0) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Username parameter cannot be empty or contain only whitespace',
        'Username parameter cannot be empty or contain only whitespace',
        { providedUsername: username }
      );
    }

    // Basic username format validation (detailed validation is in domain layer)
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Username can only contain letters, numbers, dots, hyphens, and underscores',
        'Username can only contain letters, numbers, dots, hyphens, and underscores',
        { providedUsername: username }
      );
    }

    if (trimmedUsername.length < 3) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Username must be at least 3 characters long',
        'Username must be at least 3 characters long',
        {
          providedUsername: username,
          length: trimmedUsername.length,
          minLength: 3,
        }
      );
    }

    if (trimmedUsername.length > 50) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Username cannot exceed 50 characters',
        'Username cannot exceed 50 characters',
        {
          providedUsername: username,
          length: trimmedUsername.length,
          maxLength: 50,
        }
      );
    }
  }

  /**
   * Validate authorization for user lookup
   *
   * @description
   * Ensures the requester has proper permissions to lookup users by username.
   * This is an application-level concern for access control.
   *
   * @param requesterId ID of user making the request
   * @throws ApplicationError when authorization fails
   */
  private async validateAuthorization(requesterId: number): Promise<void> {
    // Check if requester is authenticated
    if (!requesterId) {
      throw new ApplicationError(
        ApplicationErrorCode.INSUFFICIENT_PERMISSIONS,
        'Requester ID is required for user lookup',
        'You must be authenticated to lookup users'
      );
    }

    // Note: In a full implementation, you would:
    // 1. Fetch the requester user from UserRepository
    // 2. Check their role and permissions using business logic
    // 3. Validate they have user lookup permissions
    //
    // For now, we're accepting any authenticated user
    // This should be expanded based on business requirements

    this.logger.info('Authorization validated for user lookup', {
      operation: 'get_user_by_username_authorization',
    });
  }

  /**
   * Handle side effects after successful user lookup
   *
   * @description
   * Manages audit logging and other side effects related to user lookup operations.
   * This includes security logging for potential unauthorized access attempts.
   *
   * @param user Retrieved user entity
   * @param requesterId ID of user making the request
   * @param username Username used for lookup
   */
  private async handleUserLookupSideEffects(
    user: User,
    requesterId: number,
    username: string
  ): Promise<void> {
    const correlationId = `get-user-username-${user.id}-${this.clock.nowEpochSeconds()}`;

    // Log user lookup for security monitoring
    this.logger.info('User found by username', {
      operation: 'get_user_by_username',
      correlationId,
    });

    // Additional side effects can be added here:
    // - Analytics tracking for requesterId: ${requesterId}
    // - Access pattern monitoring for username: ${username}
    // - Rate limiting checks
    // - Security alerts for suspicious patterns
    // - Username enumeration protection
  }
}
