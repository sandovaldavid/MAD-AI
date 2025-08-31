import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY, SESSION_STORE_PORT, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { SessionStoreRepository } from '@domain/repositories/session/session-store.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { User } from '@domain/entities/user.entity';
import type { DeviceInfo } from '@application/types/auth.types';

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
  private readonly sessionStore = inject<SessionStoreRepository>(SESSION_STORE_PORT);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  // Simple in-memory cache for profile data (in production, consider more sophisticated caching)

  /**
   * Execute profile retrieval orchestration with session validation
   *
   * @param deviceInfo Optional device information for security logging
   * @returns Promise resolving to user profile
   * @throws ApplicationError when session is invalid or profile inaccessible
   */
  async execute(deviceInfo?: DeviceInfo): Promise<User> {
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
      throw this.errorTransformer.transform(error, {
        operation: 'get_profile',
        correlationId: `profile-${Date.now()}`,
      });
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
      throw new ApplicationError(
        ApplicationErrorCode.SESSION_EXPIRED,
        'No active session found',
        'You must be logged in to access your profile'
      );
    }

    const accessExp = session.tokens.accessExp;
    if (accessExp && accessExp < this.clock.nowEpochSeconds()) {
      throw new ApplicationError(
        ApplicationErrorCode.SESSION_EXPIRED,
        'Session has expired',
        'Your session has expired. Please log in again.'
      );
    }
  }

  /**
   * Handle side effects for successful profile retrieval
   *
   * @param user Retrieved user profile
   * @param deviceInfo Optional device information for security logging
   */
  private handleProfileSideEffects(user: User, deviceInfo?: DeviceInfo): void {
    // Log profile access for security monitoring
    this.logger.info('GetProfile: Profile accessed for security monitoring', {
      userId: user.id.toString(),
      operation: 'profile_access',
      correlationId: `profile-${user.id}-${Date.now()}`,
    });

    if (deviceInfo) {
      this.logger.info('GetProfile: Device info logged for security monitoring', {
        userId: user.id.toString(),
        correlationId: `profile-${user.id}-${Date.now()}-${deviceInfo.userAgent}-${deviceInfo.platform}`,
        operation: `Profile Side Effects: ${deviceInfo}`,
      });
    }

    // Additional debug logging with user details (if needed for troubleshooting)
    this.logger.debug(
      `Profile accessed for user ${user.username.value} at ${this.clock.nowDate().toISOString()}`,
      {
        userId: user.id.toString(),
        operation: 'profile_access',
      }
    );
  }
}
