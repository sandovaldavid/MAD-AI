import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { Logger } from '@core/interfaces/logger.interface';
import type { ListUsersRequest, ListUsersResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';

/**
 * List Users Use Case
 *
 * Application layer orchestrator that handles user listing operations following the Golden Rule:
 * "Every use case should read like a script or recipe: 1. Get data from repository. 2. Log operation. 3. Return result."
 *
 * This use case follows pure orchestration principles, delegating all business logic,
 * validation, and authorization to the Domain layer through the UserRepository.
 *
 * @responsibilities
 * - Orchestrate user listing operation through Domain repository
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
 * const result = await listUsersUseCase.execute({
 *   filter: { limit: 10 },
 *   requesterId: 456
 * });
 * ```
 */
@Injectable()
export class ListUsersUseCase {
  private readonly userRepository = inject<UserRepository>(USER_REPOSITORY);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  /**
   * Execute user listing orchestration following the Golden Rule
   *
   * This method reads like a simple recipe:
   * 1. Get users from repository with the provided filter
   * 2. Log successful operation
   * 3. Return the result
   *
   * All business logic, validation, authorization, and filtering
   * is handled by the Domain layer through UserRepository.
   *
   * @param request User listing request with filter and requester information
   * @returns Promise resolving to users list result from Domain layer
   */
  async execute(request?: ListUsersRequest): Promise<ListUsersResult> {
    try {
      // Step 1: Get users from repository (Domain handles all validation and business logic)
      const users = await this.userRepository.list(request?.filter);

      // Step 2: Log successful operation
      this.logger.info('Users listed successfully', {
        operation: 'list_users',
      });

      // Step 3: Return result structure expected by Application layer
      return {
        users,
        totalCount: users.length,
      };
    } catch (error: unknown) {
      // Transform external errors (repository, system errors)
      throw this.errorTransformer.transform(error, {
        operation: 'list_users',
      });
    }
  }
}
