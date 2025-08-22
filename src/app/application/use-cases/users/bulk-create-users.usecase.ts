import { Injectable, inject } from '@angular/core';

import { USER_REPOSITORY, CLOCK_PORT } from '@di/tokens';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { DomainEventProcessor } from '@application/services/domain-event-processor.service';
import type { CreateUserContract } from '@domain/contracts/user.contract';
import type { User } from '@domain/entities/user.entity';

export interface BulkCreateUsersRequest {
  readonly users: readonly CreateUserContract[];
  readonly performingUserId: number;
}

export interface BulkCreateUserResult {
  readonly index: number;
  readonly success: boolean;
  readonly user?: User;
  readonly error?: string;
  readonly email?: string;
}

export interface BulkCreateUsersResponse {
  readonly totalRequested: number;
  readonly successfulCreations: number;
  readonly failedCreations: number;
  readonly results: readonly BulkCreateUserResult[];
}

/**
 * Bulk Create Users Use Case
 * 
 * @description
 * Application layer orchestrator that handles bulk user creation with validation,
 * batch processing, audit logging, and error normalization. This use case follows 
 * the orchestration pattern with iterative processing since repository lacks bulk methods.
 * 
 * @responsibilities
 * - Validate application-level rules for bulk user creation
 * - Process users in batches with individual repository calls
 * - Handle comprehensive audit logging and side effects
 * - Normalize errors for consistent application layer handling
 * 
 * @architecture
 * - Application Layer orchestrator
 * - Uses domain repository through dependency injection
 * - Integrates with system clock for precise timestamping
 * - Follows 4-step orchestration pattern with batch processing
 * 
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class BulkCreateUsers {
  private readonly userRepository = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly eventProcessor = inject(DomainEventProcessor);

  async execute(request: BulkCreateUsersRequest): Promise<BulkCreateUsersResponse> {
    try {
      // Step 1: Validate application-level rules
      this.validateApplicationRules(request);

      // Step 2: Fetch domain data
      const operationTimestamp = this.clock.nowEpochSeconds();

      // Step 3: Execute core business operation
      const results = await this.createUsersInBatch(request);

      // Step 4: Handle side effects
      await this.handleBulkCreationSideEffects(request, results, operationTimestamp);

      return results;
    } catch (error: unknown) {
      this.normalizeAndRethrow(error);
    }
  }

  private validateApplicationRules(request: BulkCreateUsersRequest): void {
    if (!request.users || request.users.length === 0) {
      throw new ApplicationError(
        'bulk_create_users',
        'VALIDATION_ERROR',
        'User data is required for bulk creation'
      );
    }

    if (request.users.length > 100) {
      throw new ApplicationError(
        'bulk_create_users',
        'BATCH_SIZE_EXCEEDED',
        'Cannot create more than 100 users at once'
      );
    }

    // Check for duplicate emails in the batch
    const emails = request.users.map(user => user.email.toLowerCase());
    const uniqueEmails = new Set(emails);
    if (uniqueEmails.size !== emails.length) {
      throw new ApplicationError(
        'bulk_create_users',
        'DUPLICATE_EMAILS',
        'Duplicate email addresses detected in bulk creation request'
      );
    }
  }

  private async createUsersInBatch(request: BulkCreateUsersRequest): Promise<BulkCreateUsersResponse> {
    const results: BulkCreateUserResult[] = [];
    let successfulCreations = 0;
    let failedCreations = 0;

    for (let i = 0; i < request.users.length; i++) {
      const userData = request.users[i];
      try {
        // Use individual repository calls since no bulk method exists
        const user = await this.userRepository.create(userData);

        results.push({
          index: i,
          success: true,
          user,
          email: userData.email
        });
        successfulCreations++;
      } catch (error: any) {
        results.push({
          index: i,
          success: false,
          error: error?.message || 'Unknown error during user creation',
          email: userData.email
        });
        failedCreations++;
      }
    }

    return {
      totalRequested: request.users.length,
      successfulCreations,
      failedCreations,
      results
    };
  }

  private async handleBulkCreationSideEffects(
    request: BulkCreateUsersRequest,
    results: BulkCreateUsersResponse,
    operationTimestamp: number
  ): Promise<void> {
    // Process domain events for all successfully created users
    const successfulUsers = results.results
      .filter(result => result.success && result.user)
      .map(result => result.user!);

    for (const user of successfulUsers) {
      await this.eventProcessor.processEntityEvents(user);
    }

    const successfulEmails = results.results
      .filter(result => result.success)
      .map(result => result.email);

    const failedEmails = results.results
      .filter(result => !result.success)
      .map(result => result.email);

    console.log(`[AUDIT] Bulk user creation completed`, {
      timestamp: operationTimestamp,
      performedBy: request.performingUserId,
      operation: 'bulk_create_users',
      feature: 'users',
      totalRequested: results.totalRequested,
      successfulCreations: results.successfulCreations,
      failedCreations: results.failedCreations,
      successfulEmails,
      failedEmails,
      severity: 'MEDIUM'
    });
  }

  /**
   * Transform and normalize errors for consistent handling across the application layer
   * 
   * @description
   * Uses the ApplicationErrorTransformer to convert domain/infrastructure errors into
   * ApplicationError instances for consistent error handling across the application layer.
   * 
   * @param error Original error from domain or infrastructure layers
   * @throws ApplicationError Normalized error for application consumption
   */
  private normalizeAndRethrow(error: unknown): never {
    const errorMessage = this.errorTransformer.transformError(error, {
      operation: 'bulk_create_users',
      feature: 'users'
    });
    
    throw new ApplicationError('bulk_create_users', errorMessage, 'BULK_USER_CREATION_FAILED', error);
  }
}
