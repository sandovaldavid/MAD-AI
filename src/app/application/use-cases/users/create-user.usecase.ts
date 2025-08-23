import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, ROLE_REPOSITORY, CLOCK_PORT } from '../../../di/tokens';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { User } from '@domain/entities/user.entity';
import type { CreateUserContract } from '@domain/contracts/user.contract';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { DomainEventProcessor } from '@application/services/domain-event-processor.service';

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
    private readonly eventProcessor = inject(DomainEventProcessor);

    /**
     * Execute user creation orchestration with validation and side effects
     *
     * @param userData User data for creation
     * @param createdBy ID of the user creating this user (for audit purposes)
     * @returns Promise resolving to created user
     * @throws ApplicationError when validation fails or creation is not allowed
     */
    async execute(userData: CreateUserContract, createdBy?: number): Promise<User> {
        try {
            // Step 1: Validate application rules
            await this.validateApplicationRules(userData);

            // Step 2: Delegate to domain repository
            const user = await this.userRepo.create(userData);

            // Step 3: Handle side effects
            await this.handleUserCreationSideEffects(user, userData, createdBy);

            return user;
        } catch (error: unknown) {
            // Step 4: Normalize errors for application layer
            throw new ApplicationError(
                'create_user',
                this.errorTransformer.transformError(error),
                'USER_CREATION_FAILED'
            );
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
                'create_user',
                'Email address is already registered',
                'EMAIL_ALREADY_EXISTS'
            );
        }

        // Check for duplicate username
        const existingUserByUsername = await this.userRepo.getByUsername(userData.username);
        if (existingUserByUsername) {
            throw new ApplicationError(
                'create_user',
                'Username is already taken',
                'USERNAME_ALREADY_EXISTS'
            );
        }

        // Validate role exists and is assignable
        const role = await this.roleRepo.getById(userData.roleId);
        if (!role.isActive) {
            throw new ApplicationError(
                'create_user',
                'Cannot assign inactive role to new user',
                'INACTIVE_ROLE_ASSIGNMENT'
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
        // Process domain events from the user entity
        await this.eventProcessor.processEntityEvents(user);

        // Log user creation for audit trail
        console.log(`User ${user.id} created at ${this.clock.nowDate().toISOString()}`, {
            userId: user.id,
            username: user.username,
            email: user.email,
            roleId: userData.roleId,
            createdBy: createdBy ?? 'system',
            timestamp: this.clock.nowDate().toISOString(),
            operation: 'create_user',
        });

        // TODO: Send welcome email notification
        // TODO: Create user onboarding tasks
        // TODO: Notify administrators of new user creation
    }
}
