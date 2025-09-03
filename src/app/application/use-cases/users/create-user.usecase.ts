import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, ROLE_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import type { Logger } from '@core/interfaces/logger.interface';
import { DomainEventBusService } from '@core/services/domain-event-bus.service';
import { DomainEvent } from '@domain/events/domain-event.entity';
import { DomainEventType } from '@domain/events/domain-event.enum';
import { ISODateTime } from '@domain/value-objects/iso-datetime.vo';
import type { CreateUserRequest, CreateUserResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { User } from '@domain/entities/user.entity';
import type { CreateUserContract } from '@/app/domain/repositories/business/user.contract';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';

/**
 * Create User Use Case
 *
 * @description
 * Application layer orchestrator that handles user creation with validation,
 * role verification, and post-creation workflows. This use case follows the
 * orchestration pattern to coordinate multiple repositories and handle side effects.
 *
 * @responsibilities
 * - Orchestrate user creation with validation and side effects
 * - Validate application-level business rules (duplicates, role permissions)
 * - Coordinate user and role repositories
 * - Handle post-creation side effects (welcome notifications, audit logging)
 * - Normalize errors for application layer consumption
 *
 * @architecture
 * This use case acts as an orchestrator that:
 * 1. Validates application rules (duplicates, role assignments)
 * 2. Delegates user creation to domain repository
 * 3. Handles side effects (notifications, logging, role assignment)
 * 4. Normalizes errors for consistent error handling
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class CreateUser {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly eventBus = inject(DomainEventBusService);

  /**
   * Execute user creation orchestration with validation and side effects
   *
   * @param request User creation request with data and options
   * @returns Promise resolving to created user
   * @throws ApplicationError when validation fails or creation is not allowed
   */
  async execute(request: CreateUserRequest): Promise<CreateUserResult> {
    try {
      // Step 1: Validate application rules
      await this.validateApplicationRules(request.userData);

      // Step 2: Delegate to domain repository
      const user = await this.userRepo.create(request.userData);

      // Step 3: Handle side effects
      await this.handleUserCreationSideEffects(user, request.userData, request.createdBy);

      return user;
    } catch (error: unknown) {
      // Step 4: Normalize errors for application layer
      const appError = this.errorTransformer.transform(error, {
        operation: 'create_user',
      });
      throw appError;
    }
  }

  /**
   * Validate application-level rules for user creation
   *
   * @description
   * Validates business rules specific to the application layer, such as
   * checking for duplicates and validating role assignments. Domain validation
   * is handled by the repository layer.
   *
   * @param userData User data to validate
   * @throws ApplicationError when validation fails
   */
  private async validateApplicationRules(userData: CreateUserContract): Promise<void> {
    // Check for duplicate email
    const existingUserByEmail = await this.userRepo.getByEmail(userData.email);
    if (existingUserByEmail) {
      throw new ApplicationError(
        ApplicationErrorCode.USER_ALREADY_EXISTS,
        'Email address is already registered',
        'Email address is already registered',
        { email: userData.email }
      );
    }

    // Check for duplicate username
    const existingUserByUsername = await this.userRepo.getByUsername(userData.username);
    if (existingUserByUsername) {
      throw new ApplicationError(
        ApplicationErrorCode.USER_ALREADY_EXISTS,
        'Username is already taken',
        'Username is already taken',
        { username: userData.username }
      );
    }

    // Validate role exists and is assignable
    const role = await this.roleRepo.getById(userData.roleId);
    if (!role.isActive) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_ROLE_SPEC,
        'Cannot assign inactive role to new user',
        'Cannot assign inactive role to new user',
        { roleId: userData.roleId }
      );
    }
  }

  /**
   * Handle side effects for successful user creation
   *
   * @param user Created user entity
   * @param userData Original user data used for creation
   * @param createdBy ID of the user who created this user
   */
  private async handleUserCreationSideEffects(
    user: User,
    userData: CreateUserContract,
    createdBy?: number
  ): Promise<void> {
    // Create and publish UserCreated domain event
    const userCreatedEvent = DomainEvent.create({
      id: `user-created-${user.id}-${Date.now()}`,
      eventType: DomainEventType.USER_CREATED,
      aggregateId: user.id.toString(),
      aggregateType: 'User',
      eventData: {
        userId: user.id,
        email: user.email.value,
        username: user.username.value,
        roleId: user.getRole.id,
        createdBy: createdBy?.toString(),
        createdAt: user.createdAt?.toString(),
      },
      causedByUserId: createdBy?.toString(),
      occurredAt: ISODateTime.fromDate(this.clock.nowDate()),
    });

    await this.eventBus.publish(userCreatedEvent);

    // Log user creation for audit trail
    this.logger.info('User created successfully', {
      userId: user.id.toString(),
      operation: 'create_user',
    });

    // TODO: Send welcome email notification
    // TODO: Create user onboarding tasks
    // TODO: Notify administrators of new user creation
  }
}
