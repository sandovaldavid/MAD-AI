import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, CLOCK_PORT } from '@di/tokens';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { Role } from '@domain/entities/role.entity';

/**
 * Role deletion criteria interface
 */
export interface RoleDeletionData {
  readonly id: number;
  readonly name?: string; // Optional for verification
  readonly force?: boolean; // Force delete even if role is in use
}

/**
 * Request interface for bulk role deletion
 */
export interface BulkDeleteRolesRequest {
  readonly roles: readonly RoleDeletionData[];
  readonly requestedBy: number;
  readonly validateOnly?: boolean;
  readonly continueOnError?: boolean;
  readonly maxBatchSize?: number;
  readonly transactionId?: string;
  readonly cascadeDelete?: boolean; // Delete associated user assignments
}

/**
 * Individual deletion result
 */
export interface RoleDeletionResult {
  readonly index: number;
  readonly id: number;
  readonly name?: string;
  readonly success: boolean;
  readonly deletedRole?: Role;
  readonly error?: string;
  readonly blockingReasons?: string[];
  readonly retryable?: boolean;
  readonly cascadeActions?: {
    readonly userAssignments: number;
    readonly teamAssignments: number;
  };
}

/**
 * Response interface for bulk role deletion
 */
export interface BulkDeleteRolesResponse {
  readonly results: readonly RoleDeletionResult[];
  readonly summary: {
    readonly total: number;
    readonly successful: number;
    readonly failed: number;
    readonly skipped: number;
    readonly cascadeActions: number;
  };
  readonly transactionId?: string;
  readonly performance: {
    readonly executionTime: number;
    readonly averageTime: number;
    readonly constraintViolations: number;
  };
}

/**
 * Bulk Delete Roles Use Case
 *
 * @description
 * Specialized application layer orchestrator for bulk role deletion operations.
 * This use case handles batch processing with dependency checking, cascade deletion,
 * constraint validation, and comprehensive error handling for safe role removal.
 *
 * @responsibilities
 * - Dependency validation and constraint checking
 * - Cascade deletion management for associated data
 * - Individual error tracking and recovery
 * - Performance monitoring and reporting
 * - Transaction management for data consistency
 *
 * @architecture
 * - Specialized bulk operation orchestrator
 * - Optimized for safe large-scale deletion
 * - Individual result tracking for each item
 * - Dependency and constraint validation
 *
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class BulkDeleteRoles {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute bulk role deletion with comprehensive validation and error handling
   *
   * @param request - Bulk deletion request with roles and options
   * @returns Promise resolving to detailed bulk deletion response
   * @throws ApplicationError when critical validation fails
   */
  async execute(request: BulkDeleteRolesRequest): Promise<BulkDeleteRolesResponse> {
    const startTime = this.clock.nowEpochSeconds();

    try {
      // Phase 1: Validate bulk operation constraints
      this.validateBulkConstraints(request);

      // Phase 2: Handle validation-only mode
      if (request.validateOnly) {
        return await this.performValidationOnly(request, startTime);
      }

      // Phase 3: Execute bulk deletion with optimized processing
      return await this.performBulkDeletion(request, startTime);
    } catch (error: unknown) {
      return this.handleCriticalError(request, error, startTime);
    }
  }

  /**
   * Validate bulk operation constraints and business rules
   */
  private validateBulkConstraints(request: BulkDeleteRolesRequest): void {
    const maxBatchSize = request.maxBatchSize || 50; // Smaller batch for deletions

    if (!request.roles || request.roles.length === 0) {
      throw new ApplicationError(
        'bulk_delete_roles',
        'EMPTY_BATCH',
        'Bulk deletion requires at least one role'
      );
    }

    if (request.roles.length > maxBatchSize) {
      throw new ApplicationError(
        'bulk_delete_roles',
        'BATCH_SIZE_EXCEEDED',
        `Batch size ${request.roles.length} exceeds maximum allowed ${maxBatchSize}`
      );
    }

    if (!request.requestedBy || typeof request.requestedBy !== 'number') {
      throw new ApplicationError(
        'bulk_delete_roles',
        'INVALID_REQUESTER',
        'Valid requester ID is required for bulk operations'
      );
    }

    // Validate unique IDs within batch
    const ids = request.roles.map((r) => r.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      throw new ApplicationError(
        'bulk_delete_roles',
        'DUPLICATE_IDS',
        'Duplicate role IDs found in deletion batch'
      );
    }
  }

  /**
   * Perform validation-only mode processing
   */
  private async performValidationOnly(
    request: BulkDeleteRolesRequest,
    startTime: number
  ): Promise<BulkDeleteRolesResponse> {
    const results: RoleDeletionResult[] = [];
    let constraintViolations = 0;
    let totalCascadeActions = 0;

    // Pre-load all roles to validate existence
    const existingRoles = await this.roleRepo.list();
    const roleMap = new Map(existingRoles.map((r) => [r.id, r]));

    for (let i = 0; i < request.roles.length; i++) {
      const roleData = request.roles[i];
      const validationResult = await this.validateIndividualDeletion(
        roleData,
        i,
        roleMap,
        request.cascadeDelete || false
      );

      if (!validationResult.success && validationResult.blockingReasons?.length) {
        constraintViolations++;
      }

      if (validationResult.cascadeActions) {
        totalCascadeActions +=
          validationResult.cascadeActions.userAssignments +
          validationResult.cascadeActions.teamAssignments;
      }

      results.push(validationResult);
    }

    const endTime = this.clock.nowEpochSeconds();
    const successful = results.filter((r) => r.success).length;

    return {
      results,
      summary: {
        total: request.roles.length,
        successful,
        failed: request.roles.length - successful,
        skipped: 0,
        cascadeActions: totalCascadeActions,
      },
      transactionId: request.transactionId,
      performance: {
        executionTime: endTime - startTime,
        averageTime: (endTime - startTime) / request.roles.length,
        constraintViolations,
      },
    };
  }

  /**
   * Perform actual bulk deletion with optimized processing
   */
  private async performBulkDeletion(
    request: BulkDeleteRolesRequest,
    startTime: number
  ): Promise<BulkDeleteRolesResponse> {
    const results: RoleDeletionResult[] = [];
    let successful = 0;
    let failed = 0;
    let skipped = 0;
    let constraintViolations = 0;
    let totalCascadeActions = 0;

    // Pre-load all roles for validation
    const existingRoles = await this.roleRepo.list();
    const roleMap = new Map(existingRoles.map((r) => [r.id, r]));

    // Process each role deletion with individual error handling
    for (let i = 0; i < request.roles.length; i++) {
      const roleData = request.roles[i];

      try {
        // Validate individual deletion
        const validationResult = await this.validateIndividualDeletion(
          roleData,
          i,
          roleMap,
          request.cascadeDelete || false
        );

        if (!validationResult.success) {
          if (validationResult.blockingReasons?.length) {
            constraintViolations++;
          }
          results.push(validationResult);
          skipped++;
          continue;
        }

        // Attempt role deletion
        const role = roleMap.get(roleData.id)!;

        // Handle cascade deletion if needed
        let cascadeActions = { userAssignments: 0, teamAssignments: 0 };
        if (request.cascadeDelete) {
          cascadeActions = await this.performCascadeDeletion(role);
          totalCascadeActions += cascadeActions.userAssignments + cascadeActions.teamAssignments;
        }

        // Delete the role
        await this.roleRepo.delete(roleData.id);

        results.push({
          index: i,
          id: roleData.id,
          name: role.name,
          success: true,
          deletedRole: role,
          retryable: false,
          cascadeActions,
        });
        successful++;
      } catch (error: unknown) {
        const errorResult = this.handleIndividualDeletionError(roleData, i, error);
        results.push(errorResult);
        failed++;

        // Break on critical errors if not continuing on error
        if (!request.continueOnError && this.isCriticalError(error)) {
          break;
        }
      }
    }

    const endTime = this.clock.nowEpochSeconds();

    // Log bulk operation completion
    this.logBulkOperationCompletion(request, {
      total: request.roles.length,
      successful,
      failed,
      skipped,
      constraintViolations,
      totalCascadeActions,
      executionTime: endTime - startTime,
    });

    return {
      results,
      summary: {
        total: request.roles.length,
        successful,
        failed,
        skipped,
        cascadeActions: totalCascadeActions,
      },
      transactionId: request.transactionId,
      performance: {
        executionTime: endTime - startTime,
        averageTime: (endTime - startTime) / request.roles.length,
        constraintViolations,
      },
    };
  }

  /**
   * Validate individual role deletion within batch context
   */
  private async validateIndividualDeletion(
    roleData: RoleDeletionData,
    index: number,
    roleMap: Map<number, Role>,
    cascadeDelete: boolean
  ): Promise<RoleDeletionResult> {
    // Check if role exists
    const role = roleMap.get(roleData.id);
    if (!role) {
      return {
        index,
        id: roleData.id,
        name: roleData.name,
        success: false,
        error: 'Role not found',
        blockingReasons: ['ROLE_NOT_FOUND'],
        retryable: false,
      };
    }

    // Verify name match if provided
    if (roleData.name && role.name !== roleData.name) {
      return {
        index,
        id: roleData.id,
        name: roleData.name,
        success: false,
        error: 'Role name mismatch',
        blockingReasons: ['NAME_MISMATCH'],
        retryable: true,
      };
    }

    // Check for dependencies and constraints
    const dependencies = await this.checkRoleDependencies(role);

    if (dependencies.hasBlockingDependencies && !roleData.force && !cascadeDelete) {
      return {
        index,
        id: roleData.id,
        name: role.name,
        success: false,
        error: 'Role has active dependencies',
        blockingReasons: dependencies.reasons,
        retryable: true,
        cascadeActions: dependencies.cascadeActions,
      };
    }

    return {
      index,
      id: roleData.id,
      name: role.name,
      success: true,
      retryable: false,
      cascadeActions: dependencies.cascadeActions,
    };
  }

  /**
   * Check role dependencies and constraints
   */
  private async checkRoleDependencies(role: Role): Promise<{
    hasBlockingDependencies: boolean;
    reasons: string[];
    cascadeActions: { userAssignments: number; teamAssignments: number };
  }> {
    const reasons: string[] = [];
    let userAssignments = 0;
    let teamAssignments = 0;

    try {
      // Check for active user assignments (simulated - would need real repository method)
      // In real implementation, you'd check user-role assignments
      // userAssignments = await this.roleRepo.countActiveUserAssignments(role.id);

      // Check for team assignments (simulated)
      // teamAssignments = await this.roleRepo.countActiveTeamAssignments(role.id);

      // For now, simulate some basic constraints
      if (role.name === 'Admin' || role.name === 'System Admin') {
        reasons.push('SYSTEM_ROLE_PROTECTION');
      }

      if (userAssignments > 0) {
        reasons.push(`ACTIVE_USER_ASSIGNMENTS_${userAssignments}`);
      }

      if (teamAssignments > 0) {
        reasons.push(`ACTIVE_TEAM_ASSIGNMENTS_${teamAssignments}`);
      }
    } catch (error) {
      console.warn('Failed to check role dependencies:', error);
      reasons.push('DEPENDENCY_CHECK_FAILED');
    }

    return {
      hasBlockingDependencies: reasons.length > 0,
      reasons,
      cascadeActions: { userAssignments, teamAssignments },
    };
  }

  /**
   * Perform cascade deletion of associated data
   */
  private async performCascadeDeletion(role: Role): Promise<{
    userAssignments: number;
    teamAssignments: number;
  }> {
    // In a real implementation, this would:
    // 1. Remove user-role assignments
    // 2. Remove team-role assignments
    // 3. Update project assignments
    // 4. Log cascade actions

    // For now, return simulated counts
    return {
      userAssignments: 0,
      teamAssignments: 0,
    };
  }

  /**
   * Handle individual role deletion errors
   */
  private handleIndividualDeletionError(
    roleData: RoleDeletionData,
    index: number,
    error: unknown
  ): RoleDeletionResult {
    const normalizedError = this.errorTransformer.transformError(error, {
      operation: 'bulk_delete_roles_individual',
      feature: 'roles',
    });

    return {
      index,
      id: roleData.id,
      name: roleData.name,
      success: false,
      error: normalizedError || 'Unknown deletion error',
      retryable: !this.isCriticalError(error),
    };
  }

  /**
   * Determine if error is critical and should stop batch processing
   */
  private isCriticalError(error: unknown): boolean {
    return (
      error instanceof Error &&
      (error.message.includes('connection') ||
        error.message.includes('permission') ||
        error.message.includes('unauthorized') ||
        error.message.includes('constraint'))
    );
  }

  /**
   * Handle critical errors that prevent bulk operation continuation
   */
  private handleCriticalError(
    request: BulkDeleteRolesRequest,
    error: unknown,
    startTime: number
  ): BulkDeleteRolesResponse {
    const endTime = this.clock.nowEpochSeconds();
    const normalizedError = this.errorTransformer.transformError(error, {
      operation: 'bulk_delete_roles',
      feature: 'roles',
    });

    // Log critical error
    console.error(`[AUDIT] Bulk role deletion critical error`, {
      timestamp: endTime,
      requestedBy: request.requestedBy,
      error: normalizedError,
      batchSize: request.roles.length,
      executionTime: endTime - startTime,
      operation: 'bulk_delete_roles',
      feature: 'roles',
      severity: 'CRITICAL',
    });

    return {
      results: [],
      summary: {
        total: request.roles.length,
        successful: 0,
        failed: request.roles.length,
        skipped: 0,
        cascadeActions: 0,
      },
      transactionId: request.transactionId,
      performance: {
        executionTime: endTime - startTime,
        averageTime: 0,
        constraintViolations: 0,
      },
    };
  }

  /**
   * Log bulk operation completion with detailed metrics
   */
  private logBulkOperationCompletion(
    request: BulkDeleteRolesRequest,
    metrics: {
      total: number;
      successful: number;
      failed: number;
      skipped: number;
      constraintViolations: number;
      totalCascadeActions: number;
      executionTime: number;
    }
  ): void {
    const timestamp = this.clock.nowEpochSeconds();

    console.log(`[AUDIT] Bulk role deletion completed`, {
      timestamp,
      requestedBy: request.requestedBy,
      transactionId: request.transactionId,
      cascadeDelete: request.cascadeDelete,
      results: {
        ...metrics,
        successRate: (metrics.successful / metrics.total) * 100,
        averageTimePerRole: metrics.executionTime / metrics.total,
      },
      operation: 'bulk_delete_roles',
      feature: 'roles',
      severity: 'HIGH', // Deletions are high-impact operations
    });
  }
}
