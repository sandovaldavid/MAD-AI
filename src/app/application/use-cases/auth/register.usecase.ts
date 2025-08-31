import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY, SESSION_STORE_PORT, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { SessionStoreRepository } from '@domain/repositories/session/session-store.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { RegisterRequest } from '@application/types/auth.types';
import { AuthMapper } from '@application/mappers/auth.mapper';

/**
 * Register User Use Case
 *
 * @description
 * Application layer orchestrator that handles user registration with comprehensive validation,
 * email verification flow, and optional auto-login. This use case follows the orchestration
 * pattern with error normalization to ensure consistent error handling.
 *
 * @responsibilities
 * - Orchestrate registration process with pre-validation and side effects
 * - Validate registration data using domain contracts
 * - Execute user registration through domain repository
 * - Handle email confirmation workflow
 * - Optionally authenticate user after registration
 * - Normalize errors for application layer consumption
 *
 * @architecture
 * This use case acts as an orchestrator that:
 * 1. Validates registration preconditions (application rules)
 * 2. Delegates core registration to domain repository
 * 3. Handles side effects (auto-login, audit logging)
 * 4. Normalizes errors for consistent error handling
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class Register {
  private readonly authRepo = inject<AuthRepository>(AUTH_REPOSITORY);
  private readonly sessionStore = inject<SessionStoreRepository>(SESSION_STORE_PORT);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  /**
   * Orchestrates user registration with validation, delegation, and side effects
   *
   * @param request - Registration request containing user data and preferences
   * @returns Promise<void> - Completes when registration is successful
   *
   * @throws ApplicationError when registration fails with normalized error message
   *
   * @example Basic registration
   * ```typescript
   * await registerUC.execute({
   *   username: 'john_doe',
   *   email: 'john@example.com',
   *   password: 'securePassword123',
   *   passwordConfirm: 'securePassword123',
   *   firstName: 'John',
   *   lastName: 'Doe'
   * });
   * ```
   */
  async execute(request: RegisterRequest): Promise<void> {
    try {
      // 1. Validate application rules for registration
      await this.validateApplicationRules(request);

      // 2. Transform Application request to Domain contract
      const domainData = AuthMapper.toRegisterUserContract(request);

      // 3. Delegate to domain repository (domain will handle validation)
      await this.authRepo.register(domainData);

      // 4. Handle side effects - auto-login if requested
      await this.handleRegistrationSideEffects(request);
    } catch (error) {
      // 5. Normalize and re-throw error
      throw this.errorTransformer.transform(error, {
        operation: 'register',
        correlationId: `register-${request.email}`,
      });
    }
  }

  /**
   * Validates application-specific rules for registration
   */
  private async validateApplicationRules(request: RegisterRequest): Promise<void> {
    this.logger.info('User registration initiated', {
      userId: request.email,
      operation: 'register',
      correlationId: `register-${request.email}`,
    });

    // Application-level validation: check if registration is open
    const registrationOpen = await this.checkRegistrationAvailability();

    if (!registrationOpen) {
      throw new ApplicationError(
        ApplicationErrorCode.REGISTRATION_CLOSED,
        'User registration is currently not available',
        'Registration is temporarily closed. Please try again later.',
        undefined,
        'Please check back later or contact support'
      );
    }

    // Application-level validation: check for existing active session
    const existingSession = await this.sessionStore.readAll();
    if (existingSession?.user) {
      throw new ApplicationError(
        ApplicationErrorCode.ALREADY_AUTHENTICATED,
        'Cannot register while already logged in',
        'You are already logged in. Please logout first before registering a new account.',
        undefined,
        'Please logout and try again'
      );
    }
  }

  /**
   * Handles registration-related side effects
   * Application-level side effects that don't belong in Domain
   */
  private async handleRegistrationSideEffects(request: RegisterRequest): Promise<void> {
    try {
      // Log successful registration for audit purposes
      this.logger.info('User registration completed successfully', {
        operation: 'register',
        correlationId: `register-${request.email}`,
      });

      // Additional debug logging with more context
      this.logger.debug(`Registration completed for user: ${request.email}`, {
        operation: 'register',
        correlationId: `register-${request.email}`,
      });

      // TODO: Implement additional side effects:
      // - Send welcome email (would delegate to Notification use case)
      // - Log security event for audit trail
      // - Update registration metrics/analytics
      // - Trigger auto-login if requested
      // - Send email confirmation (delegate to EmailConfirmation use case)
    } catch {
      // Log error but don't fail registration for side effect failures
      this.logger.warn('Registration side effects failed, continuing with registration', {
        operation: 'register',
        correlationId: `register-${request.email}`,
      });
    }
  }

  /**
   * Checks if user registration is currently available
   * This is an Application-level rule that could check:
   * - System configuration flags
   * - Maintenance mode
   * - Feature toggles
   * - Business rules (e.g., registration closed during peak hours)
   */
  private async checkRegistrationAvailability(): Promise<boolean> {
    // TODO: Implement actual registration availability check
    // This could involve:
    // - Checking system configuration
    // - Verifying maintenance mode
    // - Consulting feature flags
    // - Business rules validation

    // For now, registration is always available
    return true;
  }
}
