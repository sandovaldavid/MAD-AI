import { Injectable, inject } from '@angular/core';

import { USER_REPOSITORY, CLOCK_PORT } from '@di/tokens';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { DomainEventProcessor } from '@application/services/domain-event-processor.service';
import type { UpdateUserPatchContract } from '@domain/contracts/user.contract';
import type { User } from '@domain/entities/user.entity';

export interface BulkUpdateUsersRequest {
  readonly updates: readonly (UpdateUserPatchContract & { id: number })[];
  readonly performingUserId: number;
}

export interface BulkUpdateUserResult {
  readonly userId: number;
  readonly success: boolean;
  readonly user?: User;
  readonly error?: string;
}

export interface BulkUpdateUsersResponse {
  readonly totalRequested: number;
  readonly successfulUpdates: number;
  readonly failedUpdates: number;
  readonly results: readonly BulkUpdateUserResult[];
}

/**
 * Bulk Update Users Use Case
 * 
 * @description
 * Application layer orchestrator that handles bulk user updates with validation,
 * batch processing, audit logging, and error normalization. This use case follows 
 * the orchestration pattern with iterative processing since repository lacks bulk methods.
 * 
 * @responsibilities
 * - Validate application-level rules for bulk user updates
 * - Process updates in batches with individual repository calls
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
export class BulkUpdateUsers {
  private readonly userRepository = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly eventProcessor = inject(DomainEventProcessor);

  async execute(request: BulkUpdateUsersRequest): Promise<BulkUpdateUsersResponse> {
    try {
      // Step 1: Validate application-level rules
      this.validateApplicationRules(request);

      // Step 2: Fetch domain data
      const operationTimestamp = this.clock.nowEpochSeconds();

      // Step 3: Execute core business operation
      const results = await this.updateUsersInBatch(request);

      // Step 4: Handle side effects
      await this.handleBulkUpdateSideEffects(request, results, operationTimestamp);

      return results;
    } catch (error: unknown) {
      this.normalizeAndRethrow(error);
    }
  }

  private validateApplicationRules(request: BulkUpdateUsersRequest): void {
    if (!request.updates || request.updates.length === 0) {
      throw new ApplicationError(
        'bulk_update_users',
        'VALIDATION_ERROR',
        'Update data is required for bulk updates'
      );
    }

    if (request.updates.length > 50) {
      throw new ApplicationError(
        'bulk_update_users',
        'BATCH_SIZE_EXCEEDED',
        'Cannot update more than 50 users at once'
      );
    }

    // Check for duplicate user IDs in the batch
    const userIds = request.updates.map(update => update.id);
    const uniqueIds = new Set(userIds);
    if (uniqueIds.size !== userIds.length) {
      throw new ApplicationError(
        'bulk_update_users',
        'DUPLICATE_IDS',
        'Duplicate user IDs detected in bulk update request'
      );
    }

    // Validate each update has at least one field to update
    for (const update of request.updates) {
      const hasUpdatableFields = Object.keys(update).some(key => 
        key !== 'id' && update[key as keyof typeof update] !== undefined
      );
      
      if (!hasUpdatableFields) {
        throw new ApplicationError(
          'bulk_update_users',
          'NO_UPDATE_FIELDS',
          `No updatable fields provided for user ID ${update.id}`
        );
      }
    }
  }

  private async updateUsersInBatch(request: BulkUpdateUsersRequest): Promise<BulkUpdateUsersResponse> {
    const results: BulkUpdateUserResult[] = [];
    let successfulUpdates = 0;
    let failedUpdates = 0;

    for (const updateData of request.updates) {
      const { id, ...updateFields } = updateData;
      try {
        // Use individual repository calls since no bulk method exists
        const user = await this.userRepository.update(id, updateFields);

        results.push({
          userId: id,
          success: true,
          user
        });
        successfulUpdates++;
      } catch (error: any) {
        results.push({
          userId: id,
          success: false,
          error: error?.message || 'Unknown error during user update'
        });
        failedUpdates++;
      }
    }

    return {
      totalRequested: request.updates.length,
      successfulUpdates,
      failedUpdates,
      results
    };
  }

  private async handleBulkUpdateSideEffects(
    request: BulkUpdateUsersRequest,
    results: BulkUpdateUsersResponse,
    operationTimestamp: number
  ): Promise<void> {
    // Process domain events for all successfully updated users
    const successfulUsers = results.results
      .filter(result => result.success && result.user)
      .map(result => result.user!);

    for (const user of successfulUsers) {
      await this.eventProcessor.processEntityEvents(user);
    }

    const successfulIds = results.results
      .filter(result => result.success)
      .map(result => result.userId);

    const failedIds = results.results
      .filter(result => !result.success)
      .map(result => result.userId);

    console.log(`[AUDIT] Bulk user update completed`, {
      timestamp: operationTimestamp,
      performedBy: request.performingUserId,
      operation: 'bulk_update_users',
      feature: 'users',
      totalRequested: results.totalRequested,
      successfulUpdates: results.successfulUpdates,
      failedUpdates: results.failedUpdates,
      successfulUserIds: successfulIds,
      failedUserIds: failedIds,
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
      operation: 'bulk_update_users',
      feature: 'users'
    });
    
    throw new ApplicationError('bulk_update_users', errorMessage, 'BULK_USER_UPDATE_FAILED', error);
  }
}
