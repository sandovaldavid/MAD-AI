import { Role } from '@domain/entities/role.entity';
import {
    CreateRoleContract,
    UpdateRolePatchContract,
    ListRolesFilterContract,
    RoleAssignmentContract,
} from '../../contracts/role.contract';

/**
 * @fileoverview Domain repository interface for role management operations.
 *
 * @description Defines comprehensive contracts for role lifecycle management including
 * CRUD operations, role assignments, and permission management. This interface follows
 * Domain-Driven Design principles and provides clean separation between domain logic
 * and infrastructure concerns for role-based access control (RBAC) systems.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @example Basic Role Operations
 * ```typescript
 * // In a use case
 * @Injectable({ providedIn: 'root' })
 * export class CreateRoleUseCase {
 *   constructor(@Inject(ROLE_REPOSITORY) private roleRepo: RoleRepository) {}
 *
 *   async execute(spec: CreateRoleContract): Promise<Role> {
 *     return this.roleRepo.create(spec);
 *   }
 * }
 * ```
 *
 * @example Role Assignment
 * ```typescript
 * // Assign role to user
 * await roleRepository.assign({
 *   roleId: 2,
 *   userId: 123,
 *   assignedBy: 456,
 *   reason: 'Promotion to manager'
 * });
 * ```
 *
 * @see {@link Role} - Role domain entity
 * @see {@link CreateRoleContract} - Role creation specification
 * @see {@link UpdateRolePatchContract} - Role update specification
 * @see {@link RoleAssignmentContract} - Role assignment specification
 */

/**
 * Repository interface for role management operations.
 *
 * @description Provides comprehensive contracts for role-based access control (RBAC)
 * including role lifecycle management, assignment operations, and permission handling.
 * All operations work with domain entities and contracts, maintaining clean architecture.
 *
 * @interface RoleRepository
 *
 * @businessRules
 * - Role names must be unique within the system
 * - Role hierarchies must be acyclic to prevent permission conflicts
 * - Role deletion must check for active assignments
 * - Role assignments must validate user eligibility
 * - Permission changes must be propagated to active sessions
 *
 * @performanceConsiderations
 * - Role lookups should be cached for frequent permission checks
 * - Assignment operations should be batched when possible
 * - Permission resolution should be optimized for authorization checks
 * - Role hierarchies should be precomputed for complex structures
 *
 * @securityNotes
 * - All operations should validate caller permissions
 * - Role escalation attempts should be logged and prevented
 * - Administrative role changes should require additional verification
 * - Permission changes should invalidate relevant user sessions
 */
export interface RoleRepository {
    /**
     * Retrieves a filtered list of roles.
     *
     * @description Fetches roles based on provided filtering criteria with support
     * for sorting and status filtering. This is the primary method for role discovery
     * and administrative role management operations.
     *
     * @param filter - Optional filtering and sorting criteria
     * @returns Promise resolving to array of Role entities matching criteria
     *
     * @throws {ValidationError} When filter parameters are invalid
     * @throws {UnauthorizedError} When caller lacks permission to list roles
     * @throws {NetworkError} When role service is unavailable
     *
     * @businessRules
     * - Must respect caller's access permissions for role visibility
     * - Should apply default sorting if none specified
     * - Must validate filter parameters before processing
     * - Should include role hierarchy information when available
     *
     * @example Basic Role Listing
     * ```typescript
     * // Get all active roles
     * const activeRoles = await roleRepository.list({
     *   isActive: true
     * });
     *
     * console.log(`Found ${activeRoles.length} active roles`);
     * activeRoles.forEach(role => {
     *   console.log(`- ${role.name}: ${role.description}`);
     * });
     * ```
     *
     * @example Role Hierarchy Listing
     * ```typescript
     * // Get roles with hierarchy information
     * const hierarchicalRoles = await roleRepository.list({
     *   includeHierarchy: true,
     *   sortBy: 'accessLevel',
     *   sortDirection: 'asc'
     * });
     *
     * // Display role hierarchy
     * hierarchicalRoles.forEach(role => {
     *   const indent = '  '.repeat(role.hierarchyLevel || 0);
     *   console.log(`${indent}${role.name} (Level ${role.accessLevel})`);
     * });
     * ```
     *
     * @example Filtered Role Search
     * ```typescript
     * // Search for management roles
     * const managementRoles = await roleRepository.list({
     *   nameContains: 'manager',
     *   accessLevelMin: 50,
     *   isActive: true
     * });
     * ```
     */
    list(filter?: ListRolesFilterContract): Promise<Role[]>;

    /**
     * Retrieves a specific role by ID.
     *
     * @description Fetches a complete role entity by its unique identifier,
     * including all permission information and metadata. This operation
     * should return the most current role data.
     *
     * @param id - Unique role identifier
     * @returns Promise resolving to Role entity
     *
     * @throws {RoleNotFoundError} When role with specified ID doesn't exist
     * @throws {UnauthorizedError} When caller lacks permission to access role
     * @throws {ValidationError} When ID format is invalid
     * @throws {NetworkError} When role service is unavailable
     *
     * @businessRules
     * - Must validate ID format and range
     * - Should respect caller's access permissions
     * - Must return complete role information including permissions
     * - Should include role status and metadata
     *
     * @example Role Retrieval
     * ```typescript
     * try {
     *   const role = await roleRepository.getById(2);
     *   console.log(`Role: ${role.name}`);
     *   console.log(`Description: ${role.description}`);
     *   console.log(`Access Level: ${role.accessLevel}`);
     *   console.log(`Active: ${role.isActive ? 'Yes' : 'No'}`);
     * } catch (error) {
     *   if (error instanceof RoleNotFoundError) {
     *     console.error('Role not found');
     *   }
     * }
     * ```
     *
     * @example Permission Checking
     * ```typescript
     * // Check if role has specific permission
     * async hasPermission(roleId: number, permission: string): Promise<boolean> {
     *   try {
     *     const role = await roleRepository.getById(roleId);
     *     return role.permissions.includes(permission);
     *   } catch (error) {
     *     return false; // Assume no permission on error
     *   }
     * }
     * ```
     */
    getById(id: number): Promise<Role>;

    /**
     * Creates a new role.
     *
     * @description Creates a new role with the provided specification data.
     * This operation should validate all business rules, enforce naming
     * constraints, and assign appropriate default permissions.
     *
     * @param spec - Complete role creation specification
     * @returns Promise resolving to the newly created Role entity
     *
     * @throws {ValidationError} When role data is invalid
     * @throws {ConflictError} When role name already exists
     * @throws {UnauthorizedError} When caller lacks permission to create roles
     * @throws {BusinessRuleError} When business rules are violated
     * @throws {NetworkError} When role service is unavailable
     *
     * @businessRules
     * - Must validate all input data before creation
     * - Should enforce unique constraints for role names
     * - Must validate access level ranges and permissions
     * - Should assign appropriate default status
     * - Must validate role hierarchy consistency
     * - Should log role creation for audit purposes
     *
     * @example Role Creation
     * ```typescript
     * const roleSpec = {
     *   name: 'Project Manager',
     *   description: 'Manages project teams and resources',
     *   accessLevel: 75,
     *   permissions: ['project.create', 'project.update', 'team.manage'],
     *   isActive: true
     * };
     *
     * try {
     *   const newRole = await roleRepository.create(roleSpec);
     *   console.log(`Created role ${newRole.id}: ${newRole.name}`);
     * } catch (error) {
     *   if (error instanceof ConflictError) {
     *     console.error('Role name already exists');
     *   } else if (error instanceof ValidationError) {
     *     console.error('Invalid role data:', error.message);
     *   }
     * }
     * ```
     *
     * @example Hierarchical Role Creation
     * ```typescript
     * // Create role with hierarchy considerations
     * const childRoleSpec = {
     *   name: 'Team Lead',
     *   description: 'Leads development teams',
     *   accessLevel: 60,
     *   parentRoleId: 2, // Project Manager
     *   permissions: ['team.lead', 'code.review'],
     *   isActive: true
     * };
     *
     * const childRole = await roleRepository.create(childRoleSpec);
     * ```
     */
    create(spec: CreateRoleContract): Promise<Role>;

    /**
     * Updates an existing role with partial data.
     *
     * @description Applies partial updates to an existing role. Only provided
     * fields are updated, leaving other fields unchanged. This operation should
     * validate business rules and permission consistency.
     *
     * @param id - ID of role to update
     * @param patch - Partial update data
     * @returns Promise resolving to the updated Role entity
     *
     * @throws {RoleNotFoundError} When role with specified ID doesn't exist
     * @throws {ValidationError} When update data is invalid
     * @throws {ConflictError} When update would violate uniqueness constraints
     * @throws {UnauthorizedError} When caller lacks permission to update role
     * @throws {BusinessRuleError} When business rules are violated
     * @throws {NetworkError} When role service is unavailable
     *
     * @businessRules
     * - Must validate role exists before updating
     * - Should enforce naming uniqueness constraints for changed names
     * - Must validate caller's permission to update target role
     * - Should preserve permission consistency during updates
     * - Must validate hierarchy changes don't create cycles
     * - Should propagate permission changes to active sessions
     *
     * @example Role Update
     * ```typescript
     * // Update role description and permissions
     * const updates = {
     *   description: 'Enhanced project management role',
     *   permissions: ['project.create', 'project.update', 'team.manage', 'budget.view']
     * };
     *
     * try {
     *   const updatedRole = await roleRepository.update(2, updates);
     *   console.log(`Updated role: ${updatedRole.name}`);
     *
     *   // Invalidate cached permissions for users with this role
     *   await permissionCache.invalidateRole(updatedRole.id);
     * } catch (error) {
     *   if (error instanceof BusinessRuleError) {
     *     console.error('Update violates business rules:', error.message);
     *   }
     * }
     * ```
     *
     * @example Access Level Change
     * ```typescript
     * // Change role access level with validation
     * async changeAccessLevel(
     *   roleId: number,
     *   newAccessLevel: number,
     *   requesterId: number
     * ): Promise<Role> {
     *   // Validate requester has sufficient access level
     *   const requesterRole = await this.getUserRole(requesterId);
     *   if (requesterRole.accessLevel <= newAccessLevel) {
     *     throw new UnauthorizedError('Cannot assign higher access level');
     *   }
     *
     *   return this.roleRepository.update(roleId, { accessLevel: newAccessLevel });
     * }
     * ```
     */
    update(id: number, patch: UpdateRolePatchContract): Promise<Role>;

    /**
     * Deletes a role.
     *
     * @description Removes a role from the system. This operation should
     * check for active assignments and implement appropriate cleanup or
     * migration strategies before deletion.
     *
     * @param id - ID of role to delete
     * @returns Promise that resolves when deletion is complete
     *
     * @throws {RoleNotFoundError} When role with specified ID doesn't exist
     * @throws {UnauthorizedError} When caller lacks permission to delete role
     * @throws {BusinessRuleError} When role cannot be deleted due to active assignments
     * @throws {SystemRoleError} When attempting to delete protected system roles
     * @throws {NetworkError} When role service is unavailable
     *
     * @businessRules
     * - Must validate role exists before deletion
     * - Should check for active user assignments before allowing deletion
     * - Must prevent deletion of protected system roles
     * - Should provide migration path for users with deleted role
     * - Must log role deletion for audit purposes
     * - Should clean up related permissions and cached data
     *
     * @example Safe Role Deletion
     * ```typescript
     * try {
     *   // Check for active assignments first
     *   const assignedUsers = await userRepository.list({ roleId: roleId });
     *   if (assignedUsers.length > 0) {
     *     console.log(`Cannot delete role: ${assignedUsers.length} users assigned`);
     *     return;
     *   }
     *
     *   await roleRepository.delete(roleId);
     *   console.log('Role deleted successfully');
     * } catch (error) {
     *   if (error instanceof SystemRoleError) {
     *     console.error('Cannot delete system role');
     *   }
     * }
     * ```
     *
     * @example Role Migration Before Deletion
     * ```typescript
     * // Migrate users to different role before deletion
     * async deleteRoleWithMigration(
     *   roleIdToDelete: number,
     *   migrationRoleId: number
     * ): Promise<void> {
     *   // Get all users with role to be deleted
     *   const affectedUsers = await userRepository.list({ roleId: roleIdToDelete });
     *
     *   // Migrate users to new role
     *   for (const user of affectedUsers) {
     *     await userRepository.changeRole(user.id, migrationRoleId);
     *   }
     *
     *   // Now safe to delete the role
     *   await roleRepository.delete(roleIdToDelete);
     * }
     * ```
     */
    delete(id: number): Promise<void>;

    /**
     * Assigns a role to a user.
     *
     * @description Creates a role assignment linking a user to a specific role.
     * This operation should validate assignment eligibility and maintain
     * audit trails for compliance and security purposes.
     *
     * @param input - Role assignment specification including context
     * @returns Promise that resolves when assignment is complete
     *
     * @throws {RoleNotFoundError} When specified role doesn't exist
     * @throws {UserNotFoundError} When specified user doesn't exist
     * @throws {UnauthorizedError} When caller lacks permission to assign role
     * @throws {BusinessRuleError} When assignment violates business rules
     * @throws {ConflictError} When user already has the specified role
     * @throws {NetworkError} When role service is unavailable
     *
     * @businessRules
     * - Must validate both role and user exist
     * - Should verify caller has permission to assign specified role
     * - Must prevent duplicate role assignments
     * - Should validate user eligibility for role
     * - Must log assignment for audit and compliance purposes
     * - Should notify relevant parties of role changes
     *
     * @example Role Assignment
     * ```typescript
     * const assignment = {
     *   roleId: 2, // Manager role
     *   userId: 123,
     *   assignedBy: 456, // Admin user
     *   reason: 'Promotion to team manager',
     *   effectiveDate: new Date(),
     *   expirationDate: null // Permanent assignment
     * };
     *
     * try {
     *   await roleRepository.assign(assignment);
     *   console.log('Role assigned successfully');
     *
     *   // Notify user of role change
     *   await notificationService.sendRoleAssignmentNotification(assignment);
     * } catch (error) {
     *   if (error instanceof BusinessRuleError) {
     *     console.error('Assignment violates business rules:', error.message);
     *   }
     * }
     * ```
     *
     * @example Temporary Role Assignment
     * ```typescript
     * // Assign temporary role with expiration
     * const temporaryAssignment = {
     *   roleId: 3, // Temporary admin
     *   userId: 123,
     *   assignedBy: 456,
     *   reason: 'Temporary admin access for project',
     *   effectiveDate: new Date(),
     *   expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
     * };
     *
     * await roleRepository.assign(temporaryAssignment);
     *
     * // Schedule automatic revocation
     * await scheduleService.scheduleRoleRevocation(
     *   temporaryAssignment.userId,
     *   temporaryAssignment.roleId,
     *   temporaryAssignment.expirationDate
     * );
     * ```
     */
    assign(input: RoleAssignmentContract): Promise<void>;

    /**
     * Removes a role assignment from a user.
     *
     * @description Removes the assignment linking a user to a specific role.
     * This operation should maintain audit trails and handle permission
     * cleanup appropriately.
     *
     * @param input - Role unassignment specification
     * @returns Promise that resolves when unassignment is complete
     *
     * @throws {RoleNotFoundError} When specified role doesn't exist
     * @throws {UserNotFoundError} When specified user doesn't exist
     * @throws {UnauthorizedError} When caller lacks permission to unassign role
     * @throws {BusinessRuleError} When unassignment violates business rules
     * @throws {AssignmentNotFoundError} When assignment doesn't exist
     * @throws {NetworkError} When role service is unavailable
     *
     * @businessRules
     * - Must validate assignment exists before removal
     * - Should verify caller has permission to unassign specified role
     * - Must prevent removal of required role assignments
     * - Should maintain minimum role requirements for users
     * - Must log unassignment for audit purposes
     * - Should clean up cached permissions after unassignment
     *
     * @example Role Unassignment
     * ```typescript
     * try {
     *   await roleRepository.unassign({
     *     roleId: 2,
     *     userId: 123
     *   });
     *
     *   console.log('Role unassigned successfully');
     *
     *   // Clear cached permissions
     *   await permissionCache.clearUserPermissions(123);
     *
     *   // Notify user of role change
     *   await notificationService.sendRoleRemovalNotification(123, 2);
     * } catch (error) {
     *   if (error instanceof BusinessRuleError) {
     *     console.error('Cannot remove required role assignment');
     *   }
     * }
     * ```
     *
     * @example Bulk Role Unassignment
     * ```typescript
     * // Remove role from multiple users
     * async bulkUnassignRole(roleId: number, userIds: number[]): Promise<void> {
     *   const results = await Promise.allSettled(
     *     userIds.map(userId =>
     *       roleRepository.unassign({ roleId, userId })
     *     )
     *   );
     *
     *   const successful = results.filter(r => r.status === 'fulfilled').length;
     *   const failed = results.filter(r => r.status === 'rejected').length;
     *
     *   console.log(`Unassigned role from ${successful} users, ${failed} failed`);
     * }
     * ```
     */
    unassign(input: { roleId: number; userId: number }): Promise<void>;
}
