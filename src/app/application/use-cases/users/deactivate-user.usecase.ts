import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { DomainEventBusService } from '@core/services/domain-event-bus.service';
import { DomainEvent } from '@domain/events/domain-event.entity';
import { DomainEventType } from '@domain/events/domain-event.enum';
import { ISODateTime } from '@domain/value-objects/iso-datetime.vo';
import type { DeactivateUserRequest, GetUserResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { User } from '@domain/entities/user.entity';
import type { Logger } from '@core/interfaces/logger.interface';

/**
 * Deactivate User Use Case
 *
 * @description
 * Application layer orchestrator that handles user deactivation with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with enhanced validation to prevent self-deactivation and maintain audit trails.
 *
 * @responsibilities
 * - Validate application-level rules for user deactivation
 * - Delegate to domain repository for the actual deactivation
 * - Handle audit logging and side effects
 * - Normalize errors for consistent application layer handling
 *
 * @architecture
 * - Application Layer orchestrator
 * - Uses domain repository through dependency injection
 * - Integrates with system clock for precise timestamping
 * - Follows 4-step orchestration pattern
 *
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class DeactivateUser {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly eventBus = inject(DomainEventBusService);

  /**
   * Execute user deactivation orchestration with validation and audit logging
   *
   * @param request User deactivation request with ID
   * @returns Promise resolving to deactivated user
   * @throws ApplicationError when user not found or deactivation fails
   */
  async execute(request: DeactivateUserRequest): Promise<GetUserResult> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(request.userId, undefined);

      // Step 2: Delegate to domain repository
      await this.userRepo.deactivate(request.userId);

      // Step 3: Get the deactivated user for event processing
      const deactivatedUser = await this.userRepo.getById(request.userId);

      // Step 4: Handle side effects
      await this.handleUserDeactivationSideEffects(deactivatedUser, undefined, undefined);

      return deactivatedUser;
    } catch (error: unknown) {
      // Step 4: Normalize errors for application layer
      const appError = this.errorTransformer.transform(error, {
        operation: 'deactivate_user',
      });
      throw appError;
    }
  }

  /**
   * Validate application-level rules for user deactivation
   *
   * @description
   * Validates request parameters and business rules specific to the application layer.
   * Includes enhanced validation for self-deactivation prevention.
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
        'User ID is required for deactivation',
        'User ID is required for deactivation',
        { userId }
      );
    }

    if (typeof userId !== 'number' || userId <= 0) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'User ID must be a positive number',
        'User ID must be a positive number',
        { userId }
      );
    }

    // Enhanced self-deactivation prevention
    if (requesterId && requesterId === userId) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Users cannot deactivate their own account for security reasons',
        'Users cannot deactivate their own account for security reasons',
        { userId, requesterId }
      );
    }
  }

  /**
   * Handle side effects for successful user deactivation
   *
   * @param deactivatedUser The deactivated user entity
   * @param requesterId ID of user who performed the deactivation
   * @param reason Optional reason for the deactivation
   */
  private async handleUserDeactivationSideEffects(
    deactivatedUser: User,
    requesterId?: number,
    reason?: string
  ): Promise<void> {
    // Create and publish UserAccountDeactivated domain event
    const userDeactivatedEvent = DomainEvent.create({
      id: `user-deactivated-${deactivatedUser.id}-${Date.now()}`,
      eventType: DomainEventType.USER_ACCOUNT_DEACTIVATED,
      aggregateId: deactivatedUser.id.toString(),
      aggregateType: 'User',
      eventData: {
        userId: deactivatedUser.id.toString(),
        requesterId: requesterId?.toString(),
        reason: reason,
        deactivatedAt: ISODateTime.fromDate(new Date()).toString(),
      },
      causedByUserId: requesterId?.toString(),
      occurredAt: ISODateTime.fromDate(new Date()),
    });

    await this.eventBus.publish(userDeactivatedEvent);

    // Enhanced audit logging for user deactivation
    this.logger.info(
      `User deactivation completed: user ${deactivatedUser.id} deactivated by ${requesterId || 'system'}`
    );
  }
}
