import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { User } from '@domain/entities/user.entity';
import type { UserNotificationPreferences } from '@domain/value-objects/user-notification-preferences.vo';

/**
 * Update Notification Preferences Use Case
 *
 * @description
 * Application layer orchestrator for notification preferences updates. Handles
 * user-initiated modifications to their notification settings including email,
 * system, and task notifications. Follows clean orchestration patterns by
 * delegating all validation to Domain layer.
 *
 * @responsibilities
 * - Execute notification preferences update through domain repository
 * - Handle error transformation for application layer consumption
 * - Log notification preferences changes for audit purposes
 * - Coordinate notification settings management workflow
 *
 * @architecture
 * - Application Layer orchestrator following Golden Rule pattern
 * - Uses domain repositories through dependency injection
 * - Focuses on workflow coordination, not business logic
 * - Maintains audit trail for user preference tracking
 *
 * @businessContext
 * This use case specifically handles notification preferences updates,
 * allowing users to control how they receive different types of notifications:
 * - Email notifications (external communication)
 * - System notifications (in-app alerts)
 * - Task notifications (workflow-related alerts)
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable()
export class UpdateNotificationPreferencesUseCase {
  private readonly userRepository = inject<UserRepository>(USER_REPOSITORY);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute notification preferences update orchestration
   *
   * @description
   * Orchestrates notification preferences update by delegating to domain repository
   * and handling application-layer concerns like logging and error transformation.
   * All validation and business rules are enforced at the Domain layer.
   *
   * @param userId - ID of the user whose notification preferences to update
   * @param preferences - New notification preferences configuration
   * @returns Promise resolving to updated User entity
   * @throws ApplicationError for validation failures, unauthorized access, or system errors
   *
   * @businessRules
   * - User can only update their own notification preferences
   * - All preference types (email, system, task) must be specified
   * - Preferences must be boolean values
   * - Updates are immediately effective for future notifications
   *
   * @example Notification Preferences Update
   * ```typescript
   * const preferences = {
   *   email: true,    // Receive email notifications
   *   system: false,  // Disable in-app system notifications
   *   task: true      // Receive task-related notifications
   * };
   *
   * try {
   *   const updatedUser = await updateNotificationPreferencesUseCase.execute(123, preferences);
   *   console.log('Notification preferences updated successfully');
   *   console.log(`Email: ${updatedUser.notificationPreferences?.email}`);
   * } catch (error) {
   *   if (error instanceof ValidationError) {
   *     console.error('Invalid notification preferences:', error.message);
   *   }
   * }
   * ```
   */
  async execute(userId: number, preferences: UserNotificationPreferences): Promise<User> {
    console.log(
      '[UpdateNotificationPreferencesUseCase] execute called with userId:',
      userId,
      'and preferences:',
      preferences
    );

    try {
      console.log('[UpdateNotificationPreferencesUseCase] Logging info about starting update');
      this.logger.info('Starting notification preferences update', {
        operation: 'update_notification_preferences',
        userId: userId.toString(),
      });

      // Execute notification preferences update through domain repository
      // The update is done via the general user update method with notification preferences
      console.log('[UpdateNotificationPreferencesUseCase] Calling userRepository.update...');
      const updatedUser = await this.userRepository.update(userId, {
        notificationPreferences: preferences,
      });
      console.log(
        '[UpdateNotificationPreferencesUseCase] userRepository.update completed, updated user:',
        updatedUser
      );

      console.log('[UpdateNotificationPreferencesUseCase] Logging success');
      this.logger.info('Notification preferences updated successfully', {
        operation: 'update_notification_preferences',
        userId: updatedUser.id.toString(),
      });

      return updatedUser;
    } catch (error) {
      console.error('[UpdateNotificationPreferencesUseCase] Error occurred:', error);
      console.log('[UpdateNotificationPreferencesUseCase] Logging error');
      this.logger.error('Notification preferences update failed', {
        operation: 'update_notification_preferences',
        userId: userId.toString(),
      });

      console.log('[UpdateNotificationPreferencesUseCase] Transforming error');
      throw this.errorTransformer.transform(error, {
        operation: 'update_notification_preferences',
        userId: userId.toString(),
      });
    }
  }
}
