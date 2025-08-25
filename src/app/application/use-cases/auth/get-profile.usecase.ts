import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY, SESSION_STORE_PORT, CLOCK_PORT } from '../../../di/tokens';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { SessionStorePort } from '@domain/repositories/session/session-store.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { User } from '@domain/entities/user.entity';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';

/**
 * Get User Profile Use Case
 *
 * @description
 * Application layer orchestrator that handles user profile retrieval with session validation,
 * authentication checks, and security considerations. This use case follows the orchestration
 * pattern with error normalization to ensure consistent profile access workflow.
 *
 * @responsibilities
 * - Orchestrate profile retrieval with validation and side effects
 * - Validate application-level session rules
 * - Execute profile retrieval through domain repository
 * - Handle session validation and authentication requirements
 * - Normalize errors for application layer consumption
 *
 * @architecture
 * This use case acts as an orchestrator that:
 * 1. Validates application rules (session validity, authentication)
 * 2. Delegates profile retrieval to domain repository
 * 3. Handles side effects (activity logging, cache updates)
 * 4. Normalizes errors for consistent error handling
 *
 * @performance
 * - Validates session before making API calls
 * - Logs user activity for analytics
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class GetProfile {
  private readonly authRepo = inject<AuthRepository>(AUTH_REPOSITORY);
  private readonly sessionStore = inject<SessionStorePort>(SESSION_STORE_PORT);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  // Simple in-memory cache for profile data (in production, consider more sophisticated caching)

  /**
   * Execute profile retrieval orchestration with session validation
   *
   * @param deviceInfo Optional device information for security logging
   * @returns Promise resolving to user profile
   * @throws ApplicationError when session is invalid or profile inaccessible
   */
  async execute(deviceInfo?: { userAgent: string; platform: string }): Promise<User> {
    try {
      // Step 1: Validate application rules
      await this.validateApplicationRules();

      // Step 2: Delegate to domain repository
      const user = await this.authRepo.me();

      // Step 3: Handle side effects
      this.handleProfileSideEffects(user, deviceInfo);

      return user;
    } catch (error: unknown) {
      // Step 4: Normalize errors for application layer
      throw new ApplicationError(
        'get_profile',
        this.errorTransformer.transformError(error),
        'PROFILE_RETRIEVAL_FAILED'
      );
    }
  }

  /**
   * Validate application-level rules for profile access
   *
   * @description
   * Validates that user has a valid session before attempting profile retrieval.
   * This prevents unnecessary API calls for unauthenticated users.
   *
   * @throws ApplicationError when session is invalid or expired
   */
  private async validateApplicationRules(): Promise<void> {
    const session = await this.sessionStore.readAll();

    if (!session || !session.tokens) {
      throw new ApplicationError('get_profile', 'No active session found', 'NO_SESSION');
    }

    const accessExp = session.tokens.accessExp;
    if (accessExp && accessExp < this.clock.nowEpochSeconds()) {
      throw new ApplicationError('get_profile', 'Session has expired', 'SESSION_EXPIRED');
    }
  }

  /**
   * Handle side effects for successful profile retrieval
   *
   * @param user Retrieved user profile
   * @param deviceInfo Optional device information for security logging
   */
  private handleProfileSideEffects(
    user: User,
    deviceInfo?: { userAgent: string; platform: string }
  ): void {
    // Log profile access for security monitoring
    console.log(`Profile accessed for user ${user.id} at ${this.clock.nowDate().toISOString()}`, {
      userId: user.id,
      username: user.username,
      timestamp: this.clock.nowDate().toISOString(),
      deviceInfo: deviceInfo ?? null,
    });
  }
}
