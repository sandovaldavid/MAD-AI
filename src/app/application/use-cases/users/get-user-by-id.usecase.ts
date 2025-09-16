import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { Logger } from '@core/interfaces/logger.interface';
import type { GetUserByIdRequest, GetUserResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';

/**
 * Get User By ID Use Case
 *
 * @description
 * Application layer orchestrator that retrieves users by ID following pure orchestration
 * patterns. Delegates all validation to Domain layer and focuses solely on coordinating
 * the user retrieval workflow with proper logging and error transformation.
 *
 * @responsibilities
 * - Orchestrate user retrieval through domain repository
 * - Log operation for audit and security purposes
 * - Transform domain/infrastructure errors to application layer errors
 * - Return user entity to calling facade
 *
 * @architecture
 * This use case follows the Golden Rule orchestration pattern:
 * 1. Request user from repository (Domain handles validation)
 * 2. Log successful access for audit purposes
 * 3. Return user entity
 * 4. Transform errors appropriately for Application layer consumption
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class GetUserById {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  /**
   * Execute user retrieval orchestration with audit logging
   *
   * @description
   * Pure orchestration that delegates user retrieval to Domain repository
   * and handles logging for audit purposes. All validation is performed
   * at the Domain layer through repository and entity logic.
   *
   * @param request User retrieval request with ID
   * @returns Promise resolving to user entity
   * @throws ApplicationError when user not found or domain validation fails
   */
  async execute(request: GetUserByIdRequest): Promise<GetUserResult> {
    try {
      // Step 0: Validate input at application layer
      if (!request || typeof request !== 'object') {
        throw new Error('Invalid request: request must be an object');
      }

      if (request.userId === null || request.userId === undefined) {
        throw new Error('User ID is required');
      }

      // Step 1: Delegate user retrieval to Domain repository
      // All validation (ID format, business rules) handled by Domain layer
      const user = await this.userRepo.getById(request.userId);

      // Step 2: Log successful access for audit and security purposes
      this.logger.info('User retrieved successfully', {
        operation: 'get_user_by_id',
        userId: user.id.toString(),
      });

      // Step 3: Return domain entity
      return user;
    } catch (error: unknown) {
      // Step 4: Log error and transform for Application layer consumption
      const safeUserId = (request as any)?.userId?.toString() ?? 'unknown';
      this.logger.error('User retrieval failed', {
        correlationId: `get-user-by-id-${safeUserId}-${Date.now()}`,
        userId: safeUserId,
        operation: 'get_user_by_id',
      });

      const appError = this.errorTransformer.transform(error, {
        operation: 'get_user_by_id',
        userId: safeUserId,
      });
      throw appError;
    }
  }
}
