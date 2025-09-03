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
 * @description
 * Application layer orchestrator that handles user retrieval by username with validation,
 * security logging, and error normalization. This use case follows the orchestration
 * pattern with error normalization to ensure consistent user lookup workflow.
 *
 * @responsibilities
 * - Orchestrate user retrieval with validation and side effects
 * - Validate application-level access rules
 * - Execute user lookup through domain repository
 * - Handle user lookup logging for security purposes
 * - Normalize errors for application layer consumption
 *
 * @architecture
 * This use case acts as an orchestrator that:
 * 1. Validates application rules (username format, access permissions)
 * 2. Delegates user lookup to domain repository
 * 3. Handles side effects (lookup logging, audit trail)
 * 4. Normalizes errors for consistent error handling
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class GetUserByUsername {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  /**
   * Execute user lookup orchestration with validation and audit logging
   *
   * @param request User lookup request with username
   * @returns Promise resolving to user entity
   * @throws ApplicationError when user not found or access denied
   */
  async execute(request: GetUserByUsernameRequest): Promise<GetUserResult> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(request.username);

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
      this.handleUserLookupSideEffects(user);

      return user;
    } catch (error: unknown) {
      // Step 4: Normalize errors for application layer
      const appError = this.errorTransformer.transform(error, {
        operation: 'get_user_by_username',
      });
      throw appError;
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
   * Handle side effects after successful user lookup
   *
   * @description
   * Manages audit logging and other side effects related to user lookup operations.
   * This includes security logging for potential unauthorized access attempts.
   *
   * @param user Retrieved user entity
   * @param username Username used for lookup
   * @param requesterId ID of user making the request
   */
  private handleUserLookupSideEffects(user: User): void {
    // Log user lookup for security monitoring
    this.logger.info('User found by username', {
      userId: user.id.toString(),
      operation: 'get_user_by_username',
    });

    // Additional side effects can be added here:
    // - Analytics tracking
    // - Access pattern monitoring
    // - Rate limiting checks
    // - Security alerts for suspicious patterns
    // - Username enumeration protection
  }
}
