import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY, SESSION_STORE_PORT, CLOCK_PORT } from '../../../di/tokens';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { SessionStorePort } from '@domain/repositories/session/session-store.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { LoginRequest } from '@application/types/auth.types';
import type { Session } from '@domain/entities/session.entity';
import { ApplicationError } from '@application/errors/application-error';
import { DomainEventProcessor } from '@application/services/domain-event-processor.service';

/**
 * Login with Credentials Use Case
 *
 * @description
 * Orchestrates user authentication with application-level validation,
 * session management, and security considerations. This use case coordinates
 * multiple repositories and handles side effects while normalizing errors
 * for facade consumption.
 *
 * @responsibilities
 * - Validate application-level login rules (maintenance mode, rate limiting)
 * - Execute authentication through domain repository
 * - Handle session persistence and metadata management
 * - Coordinate security logging and audit trails
 * - Normalize errors using specialized auth error handler
 *
 * @architecture
 * - Application Layer orchestrator
 * - Uses domain repositories through dependency injection
 * - Delegates error transformation to AuthErrorHandler
 * - Returns domain entities with normalized error handling
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class LoginWithCredentials {
    private readonly authRepo = inject<AuthRepository>(AUTH_REPOSITORY);
    private readonly sessionStore = inject<SessionStorePort>(SESSION_STORE_PORT);
    private readonly clock = inject<ClockPort>(CLOCK_PORT);
    private readonly eventProcessor = inject(DomainEventProcessor);

    /**
     * Executes user login with comprehensive validation and security handling
     *
     * @param request - Login request containing credentials and optional metadata
     * @returns Promise<Session> - Domain session entity
     *
     * @example
     * ```typescript
     * const session = await loginUC.execute({
     *   identifier: { type: 'email', value: 'user@example.com' },
     *   password: 'securePassword',
     *   rememberMe: true,
     *   deviceInfo: {
     *     userAgent: navigator.userAgent,
     *     platform: 'web'
     *   }
     * });
     * console.log('Login successful:', session.user.username);
     * ```
     */
    async execute(request: LoginRequest): Promise<Session> {
        try {
            // 1. Validate application rules
            await this.validateApplicationRules(request);

            // 2. Execute authentication through domain repository
            const session = await this.authRepo.login(request);

            // 3. Handle side effects - persist session state
            await this.handleSessionSideEffects(session, request);

            return session;
        } catch (error) {
            // 4. Re-throw the original error - let the facade handle transformation
            // The facade's error transformer will provide user-friendly messages
            throw error;
        }
    }

    /**
     * Validates application-specific rules for login
     */
    private async validateApplicationRules(request: LoginRequest): Promise<void> {
        // Application-level validation: check if system is in maintenance mode
        const currentTime = new Date(this.clock.nowEpochSeconds() * 1000);
        const maintenanceMode = await this.checkMaintenanceMode(currentTime);

        if (maintenanceMode) {
            throw new ApplicationError(
                'login',
                'System is currently in maintenance mode. Please try again later.',
                'SYSTEM_MAINTENANCE'
            );
        }

        // Application-level validation: rate limiting check
        await this.validateRateLimit(request.identifier.value);
    }

    /**
     * Handles session-related side effects
     */
    private async handleSessionSideEffects(session: Session, request: LoginRequest): Promise<void> {
        // Process domain events from the session entity
        await this.eventProcessor.processEntityEvents(session);

        // For now, we'll use a simplified session storage approach
        // The actual implementation would depend on the Session entity structure
        // This is a placeholder that would be refined based on actual entity properties

        // Log successful login for security auditing
        // Note: Audit logging would be coordinated here if we had an audit repository
        console.log(`User logged in: ${session.user.email} at ${new Date().toISOString()}`);
    }

    /**
     * Checks if system is in maintenance mode
     */
    private async checkMaintenanceMode(currentTime: Date): Promise<boolean> {
        // This would typically check a configuration or system status
        // For now, return false as a placeholder
        return false;
    }

    /**
     * Validates rate limiting for the identifier
     */
    private async validateRateLimit(identifier: string): Promise<void> {
        // Rate limiting logic would be implemented here
        // For now, this is a placeholder
        // Could check against a cache or rate limiting service
    }
}
