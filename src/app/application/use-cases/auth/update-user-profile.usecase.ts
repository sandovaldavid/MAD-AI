import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { User } from '@domain/entities/user.entity';
import type { UpdateUserPatchContract } from '@domain/repositories/business/user.contract';

/**
 * Update User Profile Use Case
 *
 * @description
 * Application layer orchestrator for user profile updates. Handles self-service
 * profile modifications by authenticated users. Follows clean orchestration patterns
 * by delegating all validation and business logic to Domain layer.
 *
 * @responsibilities
 * - Execute user profile updates through domain repository
 * - Handle error transformation for application layer consumption
 * - Log profile update operations for audit purposes
 * - Coordinate self-service profile management workflow
 *
 * @architecture
 * - Application Layer orchestrator following Golden Rule pattern
 * - Uses domain repositories through dependency injection
 * - Focuses on workflow coordination, not business logic
 * - Maintains audit trail for security compliance
 *
 * @businessContext
 * This use case specifically handles profile updates initiated by the user themselves,
 * distinguishing it from administrative user updates handled by UpdateUserUseCase.
 * It ensures users can only modify their own profiles and appropriate fields.
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable()
export class UpdateUserProfileUseCase {
  private readonly userRepository = inject<UserRepository>(USER_REPOSITORY);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute user profile update orchestration
   *
   * @description
   * Orchestrates profile update by delegating to domain repository and handling
   * application-layer concerns like logging and error transformation. All validation
   * and business rules are enforced at the Domain layer.
   *
   * @param userId - ID of the user whose profile to update
   * @param updateData - Partial profile update data
   * @returns Promise resolving to updated User entity
   * @throws ApplicationError for validation failures, unauthorized access, or system errors
   *
   * @businessRules
   * - User can only update their own profile (enforced by domain layer)
   * - Only profile-appropriate fields can be updated (not administrative fields)
   * - Email changes may require verification (handled by domain layer)
   * - Username changes must respect uniqueness constraints (handled by domain layer)
   *
   * @example Profile Update
   * ```typescript
   * const updateData = {
   *   firstName: 'Johnny',
   *   lastName: 'Doe',
   *   email: 'johnny.doe@example.com'
   * };
   *
   * try {
   *   const updatedUser = await updateProfileUseCase.execute(123, updateData);
   *   console.log(`Profile updated for: ${updatedUser.email.value}`);
   * } catch (error) {
   *   if (error instanceof ValidationError) {
   *     console.error('Invalid profile data:', error.message);
   *   }
   * }
   * ```
   */
  async execute(userId: number, updateData: UpdateUserPatchContract): Promise<User> {
    try {
      this.logger.info('Starting user profile update', {
        operation: 'update_profile',
        userId: userId.toString(),
      });

      // Execute profile update through domain repository
      // All validation, authorization, and business logic handled by Domain layer
      const updatedUser = await this.userRepository.update(userId, updateData);

      this.logger.info('User profile updated successfully', {
        operation: 'update_profile',
        userId: updatedUser.id.toString(),
      });

      return updatedUser;
    } catch (error) {
      this.logger.error('User profile update failed', {
        operation: 'update_profile',
        userId: userId.toString(),
      });

      throw this.errorTransformer.transform(error, {
        operation: 'update_profile',
        userId: userId.toString(),
      });
    }
  }
}