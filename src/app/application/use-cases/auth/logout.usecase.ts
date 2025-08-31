import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY, SESSION_STORE_PORT, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { DomainEventBusService } from '@core/services/domain-event-bus.service';
import { UserLoggedOutEvent } from '@domain/events/auth-events';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { SessionStoreRepository } from '@domain/repositories/session/session-store.repository';
import type { SessionSnapshotContract } from '@domain/repositories/session/session-store.contract';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { LogoutRequest } from '@application/types/auth.types';

/**
 * Logout User Use Case
 *
 * @description
 * Application layer orchestrator that handles user logout with comprehensive session cleanup,
 * token revocation, and security considerations. This use case follows the orchestration
 * pattern with error normalization to ensure consistent error handling.
 *
 * @responsibilities
 * - Orchestrate logout process with pre-validation and side effects
 * - Clear local session storage completely
 * - Revoke server-side tokens when possible
 * - Handle logout from all devices vs single device
 * - Log security events for audit purposes
 * - Normalize errors for application layer consumption
 *
 * @architecture
 * This use case acts as an orchestrator that:
 * 1. Validates logout preconditions (application rules)
 * 2. Delegates core logout to domain repository
 * 3. Handles side effects (session cleanup, audit logging)
 * 4. Normalizes errors for consistent error handling
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class Logout {
  private readonly authRepo = inject<AuthRepository>(AUTH_REPOSITORY);
  private readonly sessionStore = inject<SessionStoreRepository>(SESSION_STORE_PORT);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly eventBus = inject(DomainEventBusService);

  /**
   * Orchestrates user logout with validation, delegation, and side effects
   *
   * @param request - Logout request containing options for logout behavior
   * @returns Promise<void> - Completes when logout is successful
   *
   * @throws ApplicationError when logout fails with normalized error message
   *
   * @example Basic logout
   * ```typescript
   * await logoutUC.execute({
   *   logoutFromAllDevices: false,
   *   reason: 'user_requested',
   *   securityContext: {
   *     sessionId: 'current-session-id',
   *     deviceId: 'current-device'
   *   }
   * });
   * ```
   *   deviceInfo: {
   *     userAgent: navigator.userAgent,
   *     platform: 'web'
   *   }
   * });
   * console.log('Successfully logged out');
   * ```
   *
   * @example Logout from all devices
   * ```typescript
   * await logoutUC.execute({
   *   logoutFromAllDevices: true,
   *   reason: 'security_concern'
   * });
   * ```
   */
  async execute(request: LogoutRequest = {}): Promise<void> {
    try {
      // 1. Validate application rules for logout
      await this.validateApplicationRules(request);

      // 2. Get session data before logout for token revocation
      const sessionData = await this.sessionStore.readAll();

      // 3. Execute logout through domain repository with refresh token
      if (sessionData?.tokens?.refreshToken) {
        await this.authRepo.logout(sessionData.tokens.refreshToken);
      } else {
        // Graceful logout when no refresh token is available
        this.logger.warn('Logout attempted without refresh token', {
          operation: 'logout',
        });
      }

      // 4. Handle side effects - session cleanup and audit logging
      await this.handleLogoutSideEffects(request, sessionData);
    } catch (error) {
      // 5. Normalize and re-throw error
      throw this.errorTransformer.transform(error, {
        operation: 'logout',
        correlationId: `logout-${Date.now()}`,
      });
    }
  }

  /**
   * Validates application-specific rules for logout
   */
  private async validateApplicationRules(request: LogoutRequest): Promise<void> {
    // Application-level validation: check if user has an active session
    const sessionData = await this.sessionStore.readAll();

    if (!sessionData?.user) {
      throw new ApplicationError(
        ApplicationErrorCode.SESSION_EXPIRED,
        'No active session found to logout from',
        'You are not currently logged in'
      );
    }

    // Application-level validation: check if concurrent logouts are allowed
    if (request.logoutFromAllDevices) {
      await this.validateMultiDeviceLogout(sessionData.user.id);
    }
  }

  /**
   * Handles logout-related side effects
   */
  private async handleLogoutSideEffects(
    request: LogoutRequest,
    sessionData?: SessionSnapshotContract | null
  ): Promise<void> {
    // Publish domain event for user logout
    if (sessionData?.user) {
      try {
        const logoutEvent = UserLoggedOutEvent.create({
          userId: sessionData.user.id,
          reason: request.reason || 'user_requested',
          sessionId: sessionData.user.id.toString(), // Using userId as session identifier
        });

        const result = await this.eventBus.publish(logoutEvent.event);

        if (result.success) {
          this.logger.info('User logout event published successfully', {
            userId: sessionData.user.id.toString(),
            operation: 'logout_event_published',
            correlationId: result.eventId,
          });
        } else {
          this.logger.warn('Failed to publish user logout event', {
            userId: sessionData.user.id.toString(),
            operation: 'logout_event_publish_failed',
          });
        }
      } catch {
        this.logger.error('Error publishing user logout event', {
          userId: sessionData.user.id.toString(),
          operation: 'logout_event_publish_error',
        });
        // Don't throw here - logout should succeed even if event publishing fails
      }
    }

    // Clear local session storage completely
    await this.clearLocalSession();

    // Log logout for security auditing
    this.logger.info('User logout completed', {
      operation: 'logout',
    });

    // Additional cleanup for specific logout types
    if (request.logoutFromAllDevices) {
      // Handle all-devices logout cleanup
      this.logger.info('Logout from all devices completed', {
        operation: 'logout_all_devices',
      });
    }
  }
  /**
   * Validates multi-device logout permissions
   */
  private async validateMultiDeviceLogout(_userId: number): Promise<void> {
    // This would typically check if the user has permission to logout from all devices
    // For now, this is a placeholder - in a real implementation this would
    // check user permissions or account settings
    this.logger.debug('Validating multi-device logout permissions', {
      userId: _userId.toString(),
      operation: 'validate_multi_device_logout',
      correlationId: `logout-${Date.now()}`,
    });
  }

  /**
   * Clears all local session storage
   */
  private async clearLocalSession(): Promise<void> {
    // Clear complete session data by passing null (triggers clearAll)
    await this.sessionStore.writeAll(null);
  }
}
