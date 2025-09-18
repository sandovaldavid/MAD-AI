import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import type { Logger } from '@core/interfaces/logger.interface';
import type { CreateUserRequest, CreateUserResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { User } from '@domain/entities/user.entity';
import type { CreateUserContract } from '@domain/repositories/business/user.contract';

/**
 * Create User Use Case
 *
 * Application layer orchestrator that handles user creation following
 * Clean Architecture principles. Provides pure orchestration between user requests
 * and domain operations without implementing business logic.
 *
 * @description
 * Orchestrates user creation by coordinating application-level validation,
 * domain delegation, and cross-cutting concerns. Serves as the entry point for
 * user creation operations while maintaining clean separation between
 * application orchestration and domain business logic.
 *
 * @responsibilities
 * - Validate application-level request parameters (presence/nullability)
 * - Delegate user creation to domain repository (handles business rules)
 * - Handle cross-cutting concerns (logging, error transformation)
 * - Orchestrate the complete user creation workflow
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
 * - Duplicate validation handled by Domain repository
 *
 * @workflow
 * 1. **Validate Application Rules** - Parameter presence/nullability checks
 * 2. **Delegate to Domain** - Repository handles creation with business logic
 * 3. **Handle Side Effects** - Logging and audit trail
 * 4. **Transform Errors** - Normalize errors for Application layer
 *
 * @example
 * ```typescript
 * const useCase = inject(CreateUser);
 * const request: CreateUserRequest = {
 *   userData: {
 *     email: 'user@example.com',
 *     username: 'newuser',
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     roleId: 1
 *   }
 * };
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
export class CreateUser {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  async execute(request: CreateUserRequest): Promise<CreateUserResult> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(request.userData);

      // Step 2: Delegate to domain repository
      const user = await this.userRepo.create(request.userData);

      // Step 3: Handle side effects
      this.handleUserCreationSideEffects(user);

      return user;
    } catch (error: unknown) {
      // Step 4: Normalize errors for application layer
      throw this.errorTransformer.transform(error);
    }
  }

  private validateApplicationRules(userData: CreateUserContract): void {
    const missingFields: string[] = [];

    if (userData.email === null || userData.email === undefined) {
      missingFields.push('email');
    }
    if (userData.username === null || userData.username === undefined) {
      missingFields.push('username');
    }
    if (userData.firstName === null || userData.firstName === undefined) {
      missingFields.push('firstName');
    }
    if (userData.lastName === null || userData.lastName === undefined) {
      missingFields.push('lastName');
    }
    if (userData.roleId === null || userData.roleId === undefined) {
      missingFields.push('roleId');
    }

    if (missingFields.length > 0) {
      const fieldErrors = missingFields.map((field) => ({
        field,
        value: userData[field as keyof CreateUserContract],
        message: `The ${field} field is required.`,
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      }));

      throw this.errorTransformer.transform(
        ValidationError.createFromFields(fieldErrors, ValidationErrorCode.VALIDATION_ERROR)
      );
    }
  }

  private handleUserCreationSideEffects(user: User): void {
    this.logger.info('User created successfully', {
      userId: user.id.toString(),
      operation: 'create_user',
    });
  }
}
