import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { DomainEventBusService } from '@core/services/domain-event-bus.service';
import { DomainEvent } from '@domain/events/domain-event.entity';
import { DomainEventType } from '@domain/events/domain-event.enum';
import { ISODateTime } from '@domain/value-objects/iso-datetime.vo';
import type { ActivateUserRequest, GetUserResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { User } from '@domain/entities/user.entity';
import type { Logger } from '@core/interfaces/logger.interface';

/**
 * Activate User Use Case
 *
 * @description
 * Application layer orchestrator that handles user activation with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with error normalization to ensure consistent user activation workflow.
 *
 * @responsibilities
 * - Orchestrate user activation with validation and side effects
 * - Validate application-level access rules
 * - Execute user activation through domain repository
 * - Handle activation audit logging for compliance purposes
 * - Normalize errors for application layer consumption
 *
 * @architecture
 * This use case acts as an orchestrator that:
 * 1. Validates application rules (user ID, activation permissions)
 * 2. Delegates user activation to domain repository
 * 3. Handles side effects (audit logging, notification triggers)
 * 4. Normalizes errors for consistent error handling
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class ActivateUser {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly eventBus = inject(DomainEventBusService);

  /**
   * Execute user activation orchestration with validation and audit logging
   *
   * @param request User activation request with ID
   * @returns Promise resolving to activated user
   * @throws ApplicationError when user not found or activation fails
   */
  async execute(request: ActivateUserRequest): Promise<GetUserResult> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(request.userId, undefined);

      // Step 2: Delegate to domain repository
      await this.userRepo.activate(request.userId);

      // Step 3: Get the activated user for event processing
      const activatedUser = await this.userRepo.getById(request.userId);

      // Step 4: Handle side effects
      await this.handleUserActivationSideEffects(activatedUser, undefined, undefined);

      return activatedUser;
    } catch (error: unknown) {
      // Step 4: Normalize errors for application layer
      const appError = this.errorTransformer.transform(error, {
        operation: 'activate_user',
        userId: request.userId.toString(),
      });
      throw appError;
    }
  }

  /**
   * Validate application-level rules for user activation
   *
   * @description
   * Validates request parameters and business rules specific to the application layer.
   * Domain validation is handled by the repository layer.
   *
   * @param userId User ID to validate
   * @param requesterId ID of user making the request
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(userId: number, requesterId?: number): void {
    if (userId === undefined || userId === null) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'User ID is required and must be a valid number',
        'User ID is required and must be a valid number',
        { providedUserId: userId }
      );
    }

    if (typeof userId !== 'number' || userId <= 0) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'User ID must be a positive number',
        'User ID must be a positive number',
        { providedUserId: userId }
      );
    }

    // Prevent self-activation in some business contexts (if needed)
    // This could be relaxed depending on business rules
    if (requesterId && userId === requesterId) {
      // Log self-activation but allow it (common use case)
      this.logger.info('Self-activation detected', {
        userId: userId.toString(),
        operation: 'activate_user',
      });
    }
  }

  /**
   * Handle side effects for successful user activation
   *
   * @param activatedUser The activated user entity
   * @param requesterId ID of user who performed the activation
   * @param reason Optional reason for the activation
   */
  private async handleUserActivationSideEffects(
    activatedUser: User,
    requesterId?: number,
    reason?: string
  ): Promise<void> {
    // Create and publish UserAccountActivated domain event
    const userActivatedEvent = DomainEvent.create({
      id: `user-activated-${activatedUser.id}-${Date.now()}`,
      eventType: DomainEventType.USER_ACCOUNT_ACTIVATED,
      aggregateId: activatedUser.id.toString(),
      aggregateType: 'User',
      eventData: {
        userId: activatedUser.id.toString(),
        requesterId: requesterId?.toString(),
        reason: reason,
        activatedAt: ISODateTime.fromDate(new Date()).toString(),
      },
      causedByUserId: requesterId?.toString(),
      occurredAt: ISODateTime.fromDate(new Date()),
    });

    await this.eventBus.publish(userActivatedEvent);

    // Log user activation for audit trail
    this.logger.info('User activated successfully', {
      userId: activatedUser.id.toString(),
      operation: 'activate_user',
    });

    // Additional side effects can be added here:
    // - Send notification to user about activation
    // - Update user metrics and analytics
    // - Trigger welcome back workflows
    // - Log to external audit systems
    // - Clear activation-related cache entries
    // - Send notifications to administrators
  }
}
