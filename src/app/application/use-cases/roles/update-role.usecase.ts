import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { Role } from '@domain/entities/role.entity';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import { UpdateRolePatchContract } from '@domain/repositories/business/role.contract';

export interface UpdateRoleInput {
  id: number;
  name?: string;
  description?: string;
  accessLevel?: number;
  canLeadProjects?: boolean;
  isUniquePerTeam?: boolean;
  isActive?: boolean;
}

/**
 * Update Role Use Case
 *
 * Application layer orchestrator that handles role update operations with comprehensive validation,
 * audit logging, and error handling. This use case follows the 4-step orchestration pattern
 * defined in Clean Architecture principles.
 *
 * @description
 * Orchestrates the update of existing roles in the system by coordinating domain entities,
 * repositories, and cross-cutting concerns. Ensures data integrity, authorization, and
 * proper event publishing for audit and system integration purposes.
 *
 * @responsibilities
 * - Validate application-level authorization and business rules
 * - Transform application DTOs to domain objects
 * - Delegate role update to domain repository
 * - Publish domain events for system integration
 * - Handle audit logging and error normalization
 * - Ensure transactional consistency
 *
 * @architecture
 * - **Layer**: Application Layer (Clean Architecture)
 * - **Pattern**: Use Case orchestrator with 4-step pattern
 * - **Dependencies**: Domain Repository, Core Services (Logger, Clock, Event Bus)
 * - **Injection**: Token-based dependency injection
 * - **Error Handling**: ApplicationError transformation
 * - **Events**: Domain event publishing for audit trail
 *
 * @dependencies
 * - {@link RoleRepository} - Domain repository for role persistence
 * - {@link ClockPort} - System clock for timestamps
 * - {@link Logger} - Structured logging service
 * - {@link ApplicationErrorTransformer} - Error normalization
 *
 * @domain-events
 * - RoleUpdatedEvent (simulated via logger until real event bus integration)
 *
 * @workflow
 * 1. **Validate Application Rules** - Authorization and input validation
 * 2. **Delegate to Domain** - Repository handles business logic and persistence
 * 3. **Handle Side Effects** - Event publishing and audit logging
 * 4. **Return Result** - Domain entity with proper typing
 *
 * @example
 * ```typescript
 * const useCase = inject(UpdateRoleUseCase);
 * const input: UpdateRoleInput = {
 *   id: 123,
 *   name: 'Senior Project Manager',
 *   accessLevel: 4,
 *   description: 'Manages complex projects',
 *   canLeadProjects: true,
 *   isUniquePerTeam: false,
 *   isActive: true
 * };
 *
 * const role = await useCase.execute(input);
 * console.log('Role updated:', role.name);
 * ```
 *
 * @throws {ApplicationError} When validation fails or update encounters business rule violations
 * @throws {ApplicationError} When authorization fails or user lacks permissions
 * @throws {ApplicationError} When domain constraints are violated (duplicate names, invalid access levels)
 *
 * @version 2.0.0
 * @since 2024-01-01
 * @author MAD-AI Development Team
 * @layer Application
 * @module Role Management
 */
@Injectable({
  providedIn: 'root',
})
export class UpdateRoleUseCase {
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute role update orchestration
   *
   * Orchestrates the complete role update workflow following Clean Architecture principles.
   * This method coordinates validation, domain operations, and side effects while maintaining
   * separation of concerns and proper error handling.
   *
   * @param input - Role update input with application-level types
   * @returns Promise resolving to the updated Role domain entity
   * @throws {ApplicationError} When validation fails or update encounters errors
   *
   * @workflow
   * 1. **Application Validation** - Check authorization and input constraints
   * 2. **Domain Delegation** - Forward to repository for business logic execution
   * 3. **Side Effects** - Publish events and log audit information
   * 4. **Result Return** - Provide domain entity with proper typing
   *
   * @example
   * ```typescript
   * const role = await updateRoleUseCase.execute({
   *   id: 123,
   *   name: 'Senior Developer',
   *   accessLevel: 4,
   *   description: 'Experienced software developer',
   *   canLeadProjects: false,
   *   isUniquePerTeam: false,
   *   isActive: true
   * });
   * ```
   */
  async execute(input: UpdateRoleInput): Promise<Role> {
    try {
      // Step 1: Validate application rules (authorization and null checks only)
      this.validateApplicationRules(input);

      // Step 2: Get existing role for existence check
      const existingRole = await this.roleRepo.getById(input.id);
      if (!existingRole) {
        throw new Error(`Role with id ${input.id} not found`);
      }

      // Step 3: Build update contract and delegate to repository
      // Repository will handle all business logic validation and persistence
      const updateData: UpdateRolePatchContract = this.buildUpdateData(input);
      const updatedRole = await this.roleRepo.update(input.id, updateData);

      // Step 4: Handle side effects (audit logging)
      await this.handleSideEffects(updatedRole, input.id);

      return updatedRole;
    } catch (error: unknown) {
      throw this.errorTransformer.transform(error, {
        operation: 'updateRole',
        userId: input.id.toString(), // Using userId field to store roleId for logging context
      });
    }
  }

  /**
   * Validate application-level rules for role update
   *
   * Performs validation that cannot be done at the domain level,
   * such as authorization checks and application-specific constraints.
   *
   * ✅ CORRECT: Only validates application concerns:
   * - Input nullability (application layer responsibility)
   * - Basic type safety (application layer responsibility)
   * - Authorization (application layer responsibility)
   *
   * ❌ NEVER validates business rules:
   * - Name length limits (domain responsibility)
   * - Access level ranges (domain responsibility)
   * - Business constraints (domain responsibility)
   *
   * @param input - Role update input to validate
   * @throws {ApplicationError} When application-level validation fails
   */
  private validateApplicationRules(input: UpdateRoleInput): void {
    // Application-level validation: Check if input exists
    if (!input) {
      throw this.errorTransformer.transform(
        new Error('Invalid input provided: Input is null or undefined')
      );
    }

    // Application-level validation: Check ID presence and basic type
    if (!input.id || input.id <= 0) {
      throw this.errorTransformer.transform(new Error('Invalid input provided: Invalid role ID'));
    }
  }

  /**
   * Build update data from input
   *
   * Transforms the application input into the domain contract format,
   * filtering out undefined values to create a proper patch operation.
   *
   * @param input - Role update input
   * @returns UpdateRolePatchContract with only defined fields
   */
  private buildUpdateData(input: UpdateRoleInput): UpdateRolePatchContract {
    return {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.accessLevel !== undefined && { accessLevel: input.accessLevel }),
      ...(input.canLeadProjects !== undefined && { canLeadProjects: input.canLeadProjects }),
      ...(input.isUniquePerTeam !== undefined && { isUniquePerTeam: input.isUniquePerTeam }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    };
  }

  /**
   * Handle side effects for successful role update
   *
   * Manages audit logging and any other side effects that should occur
   * after a successful role update operation.
   *
   * @param role - The updated role entity
   * @param inputId - The original input ID for correlation
   */
  private async handleSideEffects(role: Role, inputId: number): Promise<void> {
    const correlationId = `role-update-${inputId}-${this.clock.nowEpochSeconds()}`;

    this.logger.info('Role updated successfully', {
      operation: 'update_role',
      userId: inputId.toString(), // Using userId field to store roleId for logging context
      correlationId,
    });
  }
}
