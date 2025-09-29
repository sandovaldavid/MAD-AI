import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { Logger } from '@core/interfaces/logger.interface';
import type {
  GetUserByEmailRequest,
  GetUserResult,
} from '@/app/application/types/users/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { User } from '@domain/entities/user.entity';

/**
 * Get User By Email Use Case
 *
 * Application layer orchestrator that handles user retrieval by email following
 * Clean Architecture principles. Provides pure orchestration between user requests
 * and domain operations without implementing business logic.
 *
 * @description
 * Orchestrates user lookup by coordinating application-level validation,
 * domain delegation, and cross-cutting concerns. Serves as the entry point for
 * user retrieval operations while maintaining clean separation between
 * application orchestration and domain business logic.
 *
 * @responsibilities
 * - Validate application-level request parameters (presence/nullability)
 * - Delegate user lookup operations to domain repository
 * - Handle cross-cutting concerns (logging, error transformation)
 * - Orchestrate the complete user retrieval workflow
 *
 * @architecture
 * - **Layer**: Application Layer (Clean Architecture)
 * - **Pattern**: Use Case orchestrator with 4-step pattern
 * - **Dependencies**: Domain Repository, Core Services (Logger)
 * - **Injection**: Token-based dependency injection
 * - **Error Handling**: ApplicationError transformation
 * - **Business Logic**: Delegated entirely to Domain layer
 *
 * @dependencies
 * - {@link UserRepository} - Domain repository for user operations
 * - {@link Logger} - Structured logging service
 * - {@link ApplicationErrorTransformer} - Error normalization
 *
 * @constraints
 * - Request parameters must be present (not null/undefined)
 * - All business rules enforced by Domain layer
 *
 * @workflow
 * 1. **Validate Application Rules** - Parameter presence/nullability checks
 * 2. **Delegate to Domain** - Repository handles lookup business logic
 * 3. **Handle Side Effects** - Logging and audit trail
 *
 * @example
 * ```typescript
 * const useCase = inject(GetUserByEmail);
 * const request: GetUserByEmailRequest = { email: 'user@example.com' };
 *
 * const user = await useCase.execute(request);
 * ```
 *
 * @throws {ApplicationError} When request validation fails
 * @throws {ApplicationError} When domain operation fails (transformed)
 *
 * @version 2.0.0
 * @since 1.0.0
 * @author MAD-AI Development Team
 * @layer Application
 * @module User Management
 */
@Injectable()
export class GetUserByEmail {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  /**
   * Execute user lookup orchestration
   *
   * Orchestrates the complete user retrieval workflow following Clean Architecture principles.
   * This method coordinates validation, domain operations, and side effects while maintaining
   * separation of concerns and proper error handling.
   *
   * @param request User lookup request with email
   * @returns Promise resolving to user entity
   * @throws {ApplicationError} When validation fails or lookup encounters errors
   *
   * @workflow
   * 1. **Application Validation** - Parameter presence/nullability checks
   * 2. **Domain Delegation** - Repository handles lookup with business logic
   * 3. **Side Effects** - Logging and audit trail
   *
   * @example
   * ```typescript
   * const request: GetUserByEmailRequest = { email: 'user@example.com' };
   * const user = await getUserByEmailUseCase.execute(request);
   * ```
   */
  async execute(request: GetUserByEmailRequest): Promise<GetUserResult> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(request.email);

      // Step 2: Delegate to domain repository
      // Domain repository handles all business logic, including email validation
      // Returns User entity if found, null if not found (both are valid business outcomes)
      const user = await this.userRepo.getByEmail(request.email);

      // Step 3: Handle side effects only for successful user lookup
      if (user) {
        this.handleUserLookupSideEffects(user);
      }

      return user;
    } catch (error: unknown) {
      // Step 4: Normalize errors for application layer
      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Validate application-level rules for user lookup by email
   *
   * @description
   * Validates request parameters at the application layer by checking for presence
   * and nullability only. All business rule validation (email format, length checks, etc.)
   * is delegated to the Domain layer.
   *
   * @param email Email address to validate
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(email: string): void {
    if (email === null || email === undefined || email.trim() === '') {
      throw this.errorTransformer.transform(new Error('Email is required for user lookup'));
    }
  }

  /**
   * Handle side effects for successful user lookup
   *
   * @description
   * Manages audit logging and other cross-cutting concerns after successful user lookup.
   * Provides structured logging for security monitoring and audit trail purposes.
   *
   * @param user Retrieved user entity
   *
   * @side-effects
   * - Logs lookup operation for security monitoring
   * - Tracks user access patterns for audit purposes
   */
  private handleUserLookupSideEffects(user: User): void {
    // Log user lookup for security monitoring with proper context
    this.logger.info('User found by email', {
      userId: user.id.toString(),
      operation: 'get_user_by_email',
    });

    // Additional side effects can be added here:
    // - Analytics tracking
    // - Access pattern monitoring
    // - Rate limiting checks
    // - Security alerts for suspicious patterns
  }
}
