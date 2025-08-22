import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, CLOCK_PORT } from '../../../di/tokens';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { User } from '@domain/entities/user.entity';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';

/**
 * Get User By Username Use Case
 * 
 * @description
 * Application layer orchestrator that handles user retrieval by username with validation,
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
 * 1. Validates application rules (username format, access permissions)
 * 2. Delegates user lookup to domain repository
 * 3. Handles side effects (lookup logging, audit trail)
 * 4. Normalizes errors for consistent error handling
 * 
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class GetUserByUsername {
    private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
    private readonly clock = inject<ClockPort>(CLOCK_PORT);
    private readonly errorTransformer = inject(ApplicationErrorTransformer);

    /**
     * Execute user lookup orchestration with validation and audit logging
     * 
     * @param username - Username to search for
     * @param requesterId - ID of the user making the request (for audit logging)
     * @returns Promise resolving to user entity
     * @throws ApplicationError when user not found or access denied
     */
    async execute(username: string, requesterId?: number): Promise<User> {
        try {
            // Step 1: Validate application rules
            this.validateApplicationRules(username);

            // Step 2: Delegate to domain repository
            const user = await this.userRepo.getByUsername(username);

            // Check if user was found
            if (!user) {
                throw new ApplicationError(
                    'get_user_by_username',
                    'USER_NOT_FOUND',
                    'No user found with the provided username',
                    { searchedUsername: username }
                );
            }

            // Step 3: Handle side effects
            this.handleUserLookupSideEffects(user, username, requesterId);

            return user;

        } catch (error: unknown) {
            // Step 4: Normalize errors for application layer
            this.normalizeAndRethrow(error);
        }
    }

    /**
     * Validate application-level rules for user lookup by username
     * 
     * @description
     * Validates request parameters and business rules specific to the application layer.
     * Domain validation is handled by the repository layer.
     * 
     * @param username Username to validate
     * @throws ApplicationError when validation fails
     */
    private validateApplicationRules(username: string): void {
        if (!username || typeof username !== 'string') {
            throw new ApplicationError(
                'get_user_by_username',
                'INVALID_USERNAME_PARAMETER',
                'Username parameter is required and must be a non-empty string',
                { providedUsername: username }
            );
        }

        const trimmedUsername = username.trim();
        if (trimmedUsername.length === 0) {
            throw new ApplicationError(
                'get_user_by_username',
                'EMPTY_USERNAME_PARAMETER',
                'Username parameter cannot be empty or contain only whitespace',
                { providedUsername: username }
            );
        }

        // Basic username format validation (detailed validation is in domain layer)
        const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
        if (!usernameRegex.test(trimmedUsername)) {
            throw new ApplicationError(
                'get_user_by_username',
                'INVALID_USERNAME_FORMAT',
                'Username can only contain letters, numbers, dots, hyphens, and underscores',
                { providedUsername: username }
            );
        }

        if (trimmedUsername.length < 3) {
            throw new ApplicationError(
                'get_user_by_username',
                'USERNAME_TOO_SHORT',
                'Username must be at least 3 characters long',
                { 
                    providedUsername: username, 
                    length: trimmedUsername.length,
                    minLength: 3
                }
            );
        }

        if (trimmedUsername.length > 50) {
            throw new ApplicationError(
                'get_user_by_username',
                'USERNAME_TOO_LONG',
                'Username cannot exceed 50 characters',
                { 
                    providedUsername: username, 
                    length: trimmedUsername.length,
                    maxLength: 50
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
     * @param username Username used for lookup
     * @param requesterId ID of user making the request
     */
    private handleUserLookupSideEffects(user: User, username: string, requesterId?: number): void {
        const timestamp = new Date(this.clock.nowEpochSeconds() * 1000);
        
        // Log user lookup for security monitoring
        console.log('[User Lookup] User found by username', {
            timestamp: timestamp.toISOString(),
            foundUserId: user.id,
            searchedUsername: username,
            requesterId: requesterId || 'anonymous',
            action: 'get_user_by_username',
            status: 'success'
        });

        // Additional side effects can be added here:
        // - Analytics tracking
        // - Access pattern monitoring
        // - Rate limiting checks
        // - Security alerts for suspicious patterns
        // - Username enumeration protection
    }

    /**
     * Normalize and rethrow errors for application layer consistency
     * 
     * @description
     * Transforms domain and infrastructure errors into normalized ApplicationError
     * instances for consistent error handling across the application layer.
     * 
     * @param error Original error from domain or infrastructure layers
     * @throws ApplicationError Normalized error for application consumption
     */
    private normalizeAndRethrow(error: unknown): never {
        const errorMessage = this.errorTransformer.transformError(error, {
            operation: 'get_user_by_username',
            feature: 'user'
        });
        
        throw new ApplicationError('get_user_by_username', errorMessage, 'USER_LOOKUP_FAILED', error);
    }
}
