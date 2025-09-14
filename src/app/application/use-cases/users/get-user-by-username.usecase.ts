import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { Logger } from '@core/interfaces/logger.interface';
import type { GetUserByUsernameRequest, GetUserResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';

/**
 * Get User By Username Use Case
 *
 * Application layer orchestrator that handles user retrieval by username following the Golden Rule:
 * "Every use case should read like a script or recipe: 1. Get user from repository. 2. Log operation. 3. Return result."
 *
 * This use case follows pure orchestration principles, delegating all business logic,
 * validation, and authorization to the Domain layer through the UserRepository.
 *
 * @responsibilities
 * - Orchestrate user lookup operation through Domain repository
 * - Transform errors from lower layers to Application errors
 * - Log successful operations for monitoring
 * - Return results provided by Domain layer
 *
 * @architecture
 * - **Layer**: Application Layer (Clean Architecture)
 * - **Pattern**: Pure orchestration with 3-step pattern
 * - **Dependencies**: Domain Repository, Core Logger
 * - **Trust**: Complete trust in Domain layer for business logic
 *
 * @example
 * ```typescript
 * const user = await getUserByUsernameUseCase.execute({
 *   username: 'john_doe',
 *   requesterId: 456
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class GetUserByUsernameUseCase {
  private readonly userRepository = inject<UserRepository>(USER_REPOSITORY);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  /**
   * Execute user lookup orchestration following the Golden Rule
   *
   * This method reads like a simple recipe:
   * 1. Get user from repository by username
   * 2. Log successful operation
   * 3. Return the user
   *
   * All business logic, validation, authorization, and user existence checks
   * are handled by the Domain layer through UserRepository.
   *
   * @param request User lookup request with username and requester information
   * @returns Promise resolving to user entity from Domain layer
   */
  async execute(request: GetUserByUsernameRequest): Promise<GetUserResult> {
    try {
      // Step 1: Get user from repository (Domain handles all validation and business logic)
      const user = await this.userRepository.getByUsername(request.username);

      // Trust Domain: If user not found, repository should handle appropriately
      if (!user) {
        // This case should ideally be handled by Domain repository throwing proper error
        // But since interface allows null, we transform to Application error
        throw new Error('User not found with provided username');
      }

      // Step 2: Log successful operation
      this.logger.info('User retrieved by username successfully', {
        operation: 'get_user_by_username',
      });

      // Step 3: Return user from Domain
      return user;
    } catch (error: unknown) {
      // Transform external errors (repository, system errors)
      throw this.errorTransformer.transform(error, {
        operation: 'get_user_by_username',
      });
    }
  }
}
