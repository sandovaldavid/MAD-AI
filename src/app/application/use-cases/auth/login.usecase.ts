import { inject, Injectable } from '@angular/core';
import {
  AUTH_REPOSITORY,
  SESSION_STORE_PORT,
  CLOCK_PORT,
  LOGGER_PORT,
  SECURITY_EVENT_REPOSITORY,
} from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { AuthMapper } from '@application/mappers';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { SessionStoreRepository } from '@domain/repositories/session/session-store.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type {
  SecurityEventRepository,
  SecurityEvent,
} from '@domain/repositories/system/security-event.repository';
import type { LoginRequest } from '@application/types/auth.types';
import type { Session } from '@domain/entities/session.entity';
import type { SessionSnapshotContract } from '@domain/repositories/session/session-store.contract';

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
  private readonly sessionStore = inject<SessionStoreRepository>(SESSION_STORE_PORT);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly securityLogger = inject<SecurityEventRepository>(SECURITY_EVENT_REPOSITORY);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

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
    // 1. Log del inicio de la operación
    this.logger.info('Starting user login', {
      operation: 'login',
      correlationId: `login-${Date.now()}`,
    });

    try {
      // 2. Validate application rules
      await this.validateApplicationRules(request);

      // 3. Map Application type to Domain contract
      const domainCredentials = AuthMapper.toCredentialsContract(request);

      // 4. Execute authentication through domain repository
      const session = await this.authRepo.login(domainCredentials);

      // 5. Persist session data using session store
      await this.persistSession(session);

      // 6. Handle side effects - security logging and audit trails
      await this.handleSessionSideEffects(session, request);

      // 6. Log successful completion
      this.logger.info('User login completed successfully', {
        operation: 'login',
        correlationId: `login-${Date.now()}`,
      });

      return session;
    } catch (error) {
      // 7. Log error and normalize
      this.logger.error('User login failed', {
        operation: 'login',
        correlationId: `login-${Date.now()}`,
      });

      // 8. Normalize and re-throw error
      throw this.errorTransformer.transform(error, {
        operation: 'login',
        correlationId: `login-${Date.now()}`,
      });
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
        ApplicationErrorCode.SYSTEM_MAINTENANCE,
        'System is currently in maintenance mode',
        'The system is temporarily unavailable for maintenance. Please try again later.',
        undefined,
        'Please try again in a few minutes'
      );
    }

    // Application-level validation: rate limiting check
    await this.validateRateLimit(request.identifier.value);
  }

  /**
   * Handles session-related side effects
   */
  private async handleSessionSideEffects(session: Session, request: LoginRequest): Promise<void> {
    const loginTime = new Date(this.clock.nowEpochSeconds() * 1000);

    // Log security event for successful login
    const securityEvent: SecurityEvent = {
      type: 'SUSPICIOUS_ACTIVITY',
      details: {
        timestamp: loginTime.toISOString(),
        event: 'USER_LOGIN_SUCCESS',
        identifier: request.identifier.value,
        hasDeviceInfo: !!request.deviceInfo,
        rememberMe: request.rememberMe ?? false,
        success: true,
      },
      timestamp: loginTime,
    };

    await this.securityLogger.logSecurityEvent(securityEvent);

    // Log successful login for audit trail
    this.logger.info('User login completed successfully', {
      operation: 'login',
      correlationId: `login-${Date.now()}`,
      userId: String(session.user.id),
    });

    // Additional side effects could include:
    // - Update user's last login timestamp
    // - Send login notification email
    // - Update user activity metrics
    // - Trigger security monitoring alerts
  }

  /**
   * Checks if system is in maintenance mode
   */
  private async checkMaintenanceMode(currentTime: Date): Promise<boolean> {
    this.logger.debug(
      'Checking system maintenance mode: [Always return true, this function is in development]',
      {
        operation: currentTime.getDate().toString(),
        correlationId: `login-${Date.now()}`,
      }
    );
    return true;
  }

  /**
   * Validates rate limiting for the identifier
   */
  private async validateRateLimit(identifier: string): Promise<void> {
    // Rate limiting logic would be implemented here
    // For now, this is a placeholder
    // Could check against a cache or rate limiting service
    this.logger.debug('Validating rate limit for identifier', {
      operation: identifier,
      correlationId: `login-${Date.now()}`,
    });
  }

  /**
   * Persists session data using the session store
   */
  private async persistSession(session: Session): Promise<void> {
    try {
      // Convert domain session to storage snapshot
      const sessionSnapshot: SessionSnapshotContract = {
        user: {
          id: session.user.id,
          username: session.user.username.value, // Convert Username VO to string
          email: session.user.email.value, // Convert Email VO to string
          roleId: session.user.getRole.id, // Use Role getter for id
          roleName: session.user.getRole.name, // Use Role getter for name
          accessLevel: session.user.getRole.getAccessLevel().getValue(), // Use AccessLevel getValue() method
          isEmailConfirmed: session.user.isEmailConfirmed,
          status: session.user.status?.value,
          updatedAt: session.user.updatedAt?.value, // Convert ISODateTime to string
        },
        tokens: {
          accessToken: session.access.getValue(), // Use AccessToken getValue() method
          accessExp: session.access.expSeconds, // Get expiration as number
          refreshToken: session.refresh.getValue(), // Use RefreshToken getValue() method
        },
        version: 1,
        updatedAt: Date.now(),
      };

      // Persist session using session store
      await this.sessionStore.writeAll(sessionSnapshot);

      this.logger.info('Session persisted successfully', {
        operation: 'session_persistence',
        userId: String(session.user.id),
      });
    } catch (error) {
      this.logger.error('Failed to persist session', {
        operation: 'session_persistence',
        userId: String(session.user.id),
      });
      throw error;
    }
  }
}
