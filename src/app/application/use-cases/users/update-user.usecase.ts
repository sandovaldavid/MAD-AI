import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { UpdateUserRequest, UpdateUserResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { Logger } from '@core/interfaces/logger.interface';

/**
 * Update User Use Case
 *
 * @description
 * Application layer orchestrator that handles user updates following pure orchestration
 * patterns. Delegates all validation and business logic to Domain layer and focuses
 * solely on coordinating the user update workflow with proper logging and error transformation.
 *
 * @responsibilities
 * - Orchestrate user update through domain repository
 * - Log operation for audit and security purposes
 * - Transform domain/infrastructure errors to application layer errors
 * - Return updated user entity to calling facade
 *
 * @architecture
 * This use case follows the Golden Rule orchestration pattern:
 * 1. Delegate user update to Domain repository (Domain handles all validation and business logic)
 * 2. Log successful operation for audit purposes
 * 3. Return updated user entity
 * 4. Transform errors appropriately for Application layer consumption
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable()
export class UpdateUserUseCase {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  /**
   * Execute user update orchestration with audit logging
   *
   * @description
   * Pure orchestration that delegates user update to Domain repository
   * and handles logging for audit purposes. All validation, authorization,
   * and business logic is performed at the Domain layer through repository
   * and entity logic.
   *
   * @param request User update request with ID, data, and requester information
   * @returns Promise resolving to updated user entity
   * @throws ApplicationError when user not found or domain validation fails
   */
  async execute(request: UpdateUserRequest): Promise<UpdateUserResult> {
    try {
      // Step 1: Delegate user update to Domain repository
      // All validation (ID format, patch data, authorization, business rules) handled by Domain layer
      const updatedUser = await this.userRepo.update(request.userId, request.updateData);

      // Step 2: Log successful operation for audit and security purposes
      this.logger.info('User updated successfully', {
        operation: 'update_user',
        userId: updatedUser.id.toString(),
      });

      // Step 3: Return updated domain entity
      return updatedUser;
    } catch (error: unknown) {
      // Step 4: Transform errors for Application layer consumption
      const appError = this.errorTransformer.transform(error, {
        operation: 'update_user',
        userId: request.userId.toString(),
      });
      throw appError;
    }
  }
}
