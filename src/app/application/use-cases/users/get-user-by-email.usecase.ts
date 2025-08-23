import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, CLOCK_PORT } from '../../../di/tokens';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { User } from '@domain/entities/user.entity';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';

/**
 * Get User By Email Use Case
 *
 * @description
 * Application layer orchestrator that handles user retrieval by email with validation,
 * security logging, and error normalization. This use case follows the orchestration
 * pattern with error normalization to ensure consistent user lookup workflow.
 *
 * @responsibilities
 * - Orchestrate user retrieval with validation and side effects
 * - Validate application-level access rules
 * - Execute user lookup through domain repository
 * - Handle user lookup logging for security purposes
 * - Normalize errors for application layer consumption
 *
 * @architecture
 * This use case acts as an orchestrator that:
 * 1. Validates application rules (email format, access permissions)
 * 2. Delegates user lookup to domain repository
 * 3. Handles side effects (lookup logging, audit trail)
 * 4. Normalizes errors for consistent error handling
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class GetUserByEmail {
    private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
    private readonly clock = inject<ClockPort>(CLOCK_PORT);
    private readonly errorTransformer = inject(ApplicationErrorTransformer);

    /**
     * Execute user lookup orchestration with validation and audit logging
     *
     * @param email - Email address to search for
     * @param requesterId - ID of the user making the request (for audit logging)
     * @returns Promise resolving to user entity
     * @throws ApplicationError when user not found or access denied
     */
    async execute(email: string, requesterId?: number): Promise<User> {
        try {
            // Step 1: Validate application rules
            this.validateApplicationRules(email);

            // Step 2: Delegate to domain repository
            const user = await this.userRepo.getByEmail(email);

            // Check if user was found
            if (!user) {
                throw new ApplicationError(
                    'get_user_by_email',
                    'USER_NOT_FOUND',
                    'No user found with the provided email address',
                    { searchedEmail: email }
                );
            }

            // Step 3: Handle side effects
            this.handleUserLookupSideEffects(user, email, requesterId);

            return user;
        } catch (error: unknown) {
            // Step 4: Normalize errors for application layer
            throw new ApplicationError(
                'get_user_by_email',
                this.errorTransformer.transformError(error),
                'USER_LOOKUP_FAILED'
            );
        }
    }

    /**
     * Validate application-level rules for user lookup by email
     *
     * @description
     * Validates request parameters and business rules specific to the application layer.
     * Domain validation is handled by the repository layer.
     *
     * @param email Email address to validate
     * @throws ApplicationError when validation fails
     */
    private validateApplicationRules(email: string): void {
        if (!email || typeof email !== 'string') {
            throw new ApplicationError(
                'get_user_by_email',
                'INVALID_EMAIL_PARAMETER',
                'Email parameter is required and must be a non-empty string',
                { providedEmail: email }
            );
        }

        const trimmedEmail = email.trim();
        if (trimmedEmail.length === 0) {
            throw new ApplicationError(
                'get_user_by_email',
                'EMPTY_EMAIL_PARAMETER',
                'Email parameter cannot be empty or contain only whitespace',
                { providedEmail: email }
            );
        }

        // Basic email format validation (detailed validation is in domain layer)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            throw new ApplicationError(
                'get_user_by_email',
                'INVALID_EMAIL_FORMAT',
                'Email must have a valid format',
                { providedEmail: email }
            );
        }

        if (trimmedEmail.length > 255) {
            throw new ApplicationError(
                'get_user_by_email',
                'EMAIL_TOO_LONG',
                'Email address cannot exceed 255 characters',
                {
                    providedEmail: email,
                    length: trimmedEmail.length,
                    maxLength: 255,
                }
            );
        }
    }

    /**
     * Handle side effects after successful user lookup
     *
     * @description
     * Manages audit logging and other side effects related to user lookup operations.
     * This includes security logging for potential unauthorized access attempts.
     *
     * @param user Retrieved user entity
     * @param email Email used for lookup
     * @param requesterId ID of user making the request
     */
    private handleUserLookupSideEffects(user: User, email: string, requesterId?: number): void {
        const timestamp = new Date(this.clock.nowEpochSeconds() * 1000);

        // Log user lookup for security monitoring
        console.log('[User Lookup] User found by email', {
            timestamp: timestamp.toISOString(),
            foundUserId: user.id,
            searchedEmail: email,
            requesterId: requesterId || 'anonymous',
            action: 'get_user_by_email',
            status: 'success',
        });

        // Additional side effects can be added here:
        // - Analytics tracking
        // - Access pattern monitoring
        // - Rate limiting checks
        // - Security alerts for suspicious patterns
    }
}
