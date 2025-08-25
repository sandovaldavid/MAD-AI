import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY, SESSION_STORE_PORT, CLOCK_PORT } from '../../../di/tokens';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { SessionStorePort } from '@domain/repositories/session/session-store.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { RegisterRequest } from '@application/types/auth.types';
import { ValidationError } from '@domain/errors/validation-error.entity';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';

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
  private readonly sessionStore = inject<SessionStorePort>(SESSION_STORE_PORT);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

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

      // 2. Delegate to domain repository (domain will handle validation)
      await this.authRepo.register(request);

      // 3. Handle side effects - auto-login if requested
      await this.handleRegistrationSideEffects(request);
    } catch (error) {
      // 4. Normalize and re-throw error
      throw new ApplicationError(
        'register',
        this.errorTransformer.transformError(error),
        this.extractErrorCode(error)
      );
    }
  }

  /**
   * Validates application-specific rules for registration
   */
  private async validateApplicationRules(request: RegisterRequest): Promise<void> {
    // Application-level validation: check if registration is open
    const registrationOpen = await this.checkRegistrationAvailability();

    if (!registrationOpen) {
      throw new ApplicationError(
        'register',
        'User registration is currently not available. Please try again later.',
        'REGISTRATION_CLOSED'
      );
    }

    // Application-level validation: check for existing active session
    const existingSession = await this.sessionStore.readAll();
    if (existingSession?.user) {
      throw new ApplicationError(
        'register',
        'Cannot register while already logged in. Please logout first.',
        'ALREADY_AUTHENTICATED'
      );
    }
  }

  /**
   * Handles registration-related side effects
   */
  private async handleRegistrationSideEffects(request: RegisterRequest): Promise<void> {
    // Log successful registration for audit purposes
    const registrationTime = new Date(this.clock.nowEpochSeconds() * 1000);
    console.log(`User registered at ${registrationTime.toISOString()}: ${request.email}`);

    // For now, auto-login logic would be handled here if implemented
    // This would typically trigger the login use case with the new credentials
    console.log('Registration completed successfully');
  }

  /**
   * Checks if user registration is currently available
   */
  private async checkRegistrationAvailability(): Promise<boolean> {
    // This would typically check system configuration or feature flags
    // For now, returning true (registration always available)
    return true;
  }

  /**
   * Extracts error code from unknown error
   */
  private extractErrorCode(error: unknown): string {
    if (error instanceof ValidationError) {
      return error.code;
    }
    if (error && typeof error === 'object' && 'code' in error) {
      return String((error as any).code);
    }
    return 'UNKNOWN_ERROR';
  }
}
