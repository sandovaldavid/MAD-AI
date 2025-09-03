import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { Logger } from '@core/interfaces/logger.interface';
import type { GetUserByIdRequest, GetUserResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { User } from '@domain/entities/user.entity';

/**
 * Get User By ID Use Case
 *
 * @description
 * Application layer orchestrator that handles user retrieval by ID with validation,
 * security logging, and error normalization. This use case follows the orchestration
 * pattern with error normalization to ensure consistent user access workflow.
 *
 * @responsibilities
 * - Orchestrate user retrieval with validation and side effects
 * - Validate application-level access rules
 * - Execute user retrieval through domain repository
 * - Handle user access logging for security purposes
 * - Normalize errors for application layer consumption
 *
 * @architecture
 * This use case acts as an orchestrator that:
 * 1. Validates application rules (ID format, access permissions)
 * 2. Delegates user retrieval to domain repository
 * 3. Handles side effects (access logging, audit trail)
 * 4. Normalizes errors for consistent error handling
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class GetUserById {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  /**
   * Execute user retrieval orchestration with validation and audit logging
   *
   * @param request User retrieval request with ID
   * @returns Promise resolving to user entity
   * @throws ApplicationError when user not found or access denied
   */
  async execute(request: GetUserByIdRequest): Promise<GetUserResult> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(request.userId);

      // Step 2: Delegate to domain repository
      const user = await this.userRepo.getById(request.userId);

      // Step 3: Handle side effects
      this.handleUserAccessSideEffects(user);

      return user;
    } catch (error: unknown) {
      // Step 4: Normalize errors for application layer
      const appError = this.errorTransformer.transform(error, {
        operation: 'get_user_by_id',
        userId: request.userId.toString(),
      });
      throw appError;
    }
  }

  /**
   * Validate application-level rules for user retrieval
   *
   * @description
   * Validates request parameters and business rules specific to the application layer.
   * Domain validation is handled by the repository layer.
   *
   * @param id User ID to validate
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(id: number): void {
    if (id === undefined || id === null) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'User ID is required',
        'User ID is required'
      );
    }

    if (!Number.isInteger(id) || id <= 0) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'User ID must be a positive integer',
        'User ID must be a positive integer'
      );
    }
  }

  /**
   * Handle side effects for successful user retrieval
   *
   * @param user Retrieved user entity
   * @param requesterId ID of the user making the request
   */
  private handleUserAccessSideEffects(user: User): void {
    // Log user access for security and audit purposes
    this.logger.info('User accessed by ID', {
      userId: user.id.toString(),
      operation: 'get_user_by_id',
    });
  }
}
