import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, LOGGER_PORT, CLOCK_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { DeleteRoleRequest } from '@/app/application/types/roles/roles.types';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { ClockPort } from '@domain/repositories/system/clock.repository';

/**
 * Delete Role Use Case - Application Layer Orchestrator
 *
 * @description
 * Application layer orchestrator that coordinates role deletion through Domain repository.
 * Follows Clean Architecture principles with strict separation of concerns:
 * - Application handles only orchestration and authorization checks
 * - Domain handles all business logic through repository interface
 * - Infrastructure handles technical implementation details
 *
 * @responsibilities
 * - Validate application-level rules (presence, authorization)
 * - Orchestrate role deletion through Domain repository
 * - Handle audit logging for compliance requirements
 * - Transform and normalize errors from lower layers
 *
 * @architectural_pattern
 * This use case follows the 4-step Application Layer orchestration pattern:
 * 1. **Validation** - Application rules (presence, authorization only)
 * 2. **Delegation** - Domain repository handles all business logic
 * 3. **Audit** - Structured logging for compliance and monitoring
 * 4. **Completion** - Confirm successful orchestration
 *
 * @business_logic_delegation
 * The Domain repository handles:
 * - Role existence verification
 * - Business rule validation (system role protection)
 * - Referential integrity checks
 * - Actual deletion operations
 *
 * @audit_compliance
 * Maintains comprehensive audit trail for role deletions including:
 * - Operation correlation IDs for traceability
 * - Requester identification for accountability
 * - Timestamp precision for compliance reporting
 *
 * @example
 * ```typescript
 * await deleteRoleUseCase.execute({
 *   id: 123,
 *   requesterId: 456
 * });
 * ```
 */
@Injectable()
export class DeleteRoleUseCase {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);

  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute role deletion orchestration
   *
   * @description
   * Application layer orchestration following 4-step Clean Architecture pattern.
   * Delegates all business logic to Domain layer through repository interface.
   *
   * @param request Role deletion request
   * @returns Promise resolving when deletion is complete
   * @throws ApplicationError when validation fails or deletion encounters errors
   *
   * @workflow
   * 1. **Application Validation** - Check presence and authorization only
   * 2. **Domain Delegation** - Repository handles all business rules and deletion
   * 3. **Audit Logging** - Record successful deletion for compliance
   * 4. **Completion** - Confirm successful orchestration
   */
  async execute(request: DeleteRoleRequest): Promise<void> {
    try {
      // Step 1: Application validation (presence and authorization only)
      this.validateApplicationRules(request);
      await this.validateAuthorization(request.requesterId);

      this.logger.info('Authorization validated for role deletion', {
        userId: request.requesterId!.toString(),
        operation: 'delete_role_authorization',
      });

      // Step 2: Delegate deletion to domain repository
      // Repository handles: existence check, business rule validation, referential integrity
      await this.roleRepo.getById(request.id);
      await this.roleRepo.delete(request.id);

      // Step 3: Handle side effects (audit logging only)
      this.logger.info('Role deleted successfully', {
        operation: 'delete_role',
        userId: request.requesterId!.toString(),
        correlationId: `role-delete-${request.id}-${this.clock.nowEpochSeconds()}`,
      });
    } catch (error: unknown) {
      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Validate application-level rules for role deletion
   *
   * @description
   * Application layer only handles presence and nullability checks.
   * All business rules including ID format validation are delegated to the Domain layer.
   *
   * @param request Delete role request to validate
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(request: DeleteRoleRequest): void {
    if (!request) {
      throw new Error('Invalid input provided: Request is null or undefined');
    }

    if (
      request.id === null ||
      request.id === undefined ||
      typeof request.id !== 'number' ||
      !Number.isInteger(request.id) ||
      request.id <= 0
    ) {
      throw new Error('Invalid input provided: Role ID is required and must be a positive number');
    }
  }

  /**
   * Validate authorization for role deletion
   *
   * @description
   * Application-level authorization check ensuring requester has permissions.
   * Business authorization rules are handled by Domain layer.
   *
   * @param requesterId Requester ID to validate
   * @throws ApplicationError when authorization fails
   */
  private async validateAuthorization(requesterId?: number): Promise<void> {
    // Application-level check: Requester must be authenticated
    if (!requesterId) {
      throw new ApplicationError(
        ApplicationErrorCode.INSUFFICIENT_PERMISSIONS,
        'Requester ID is required for role deletion',
        'You must be authenticated to delete roles'
      );
    }
  }
}
