/**
 * Contract for creating a new role in the MAD-AI system.
 * Encapsulates all required properties for defining organizational roles
 * with specific access levels and team management capabilities.
 *
 * @description This contract defines the complete structure for role creation,
 * including access level hierarchy, project leadership permissions, and
 * team uniqueness constraints. The readonly modifier ensures immutability.
 *
 * @example Creating a team lead role
 * ```typescript
 * const teamLead: CreateRoleContract = {
 *   name: 'Team Lead',
 *   accessLevel: 80,
 *   description: 'Leads development teams and manages project execution',
 *   canLeadProjects: true,
 *   isUniquePerTeam: true,
 *   createdByUserId: 123
 * };
 * ```
 *
 * @example Creating a developer role
 * ```typescript
 * const developer: CreateRoleContract = {
 *   name: 'Developer',
 *   accessLevel: 50,
 *   description: 'Develops software solutions and implements features',
 *   canLeadProjects: false,
 *   isUniquePerTeam: false,
 *   createdByUserId: 456
 * };
 * ```
 *
 * @since 1.0.0
 * @domain Role Management
 */
export type CreateRoleContract = Readonly<{
  /** Role name (must be unique) */
  name: string;
  /**
   * Access level for permission hierarchy.
   * @range 1-5
   */
  accessLevel?: number;
  /** Role description */
  description?: string;
  /** Project leadership permission */
  canLeadProjects?: boolean;
  /** Team uniqueness constraint */
  isUniquePerTeam?: boolean;
  /** ID of the user who created this role (for audit purposes) */
  createdByUserId: number;
}>;

/**
 * Contract for partially updating existing roles in the MAD-AI system.
 * Supports atomic updates of individual role properties using PATCH semantics.
 *
 * @description This contract enables selective role modifications where only
 * the specified fields will be updated, maintaining data integrity for
 * unchanged properties. The readonly modifier ensures immutability.
 *
 * @example Updating access level
 * ```typescript
 * const accessUpdate: UpdateRolePatchContract = {
 *   accessLevel: 75
 * };
 * ```
 *
 * @example Updating role capabilities
 * ```typescript
 * const capabilityUpdate: UpdateRolePatchContract = {
 *   canLeadProjects: true,
 *   description: 'Senior developer with project leadership responsibilities'
 * };
 * ```
 *
 * @example Deactivating a role
 * ```typescript
 * const deactivation: UpdateRolePatchContract = {
 *   isActive: false
 * };
 * ```
 *
 * @since 1.0.0
 * @domain Role Management
 */
export type UpdateRolePatchContract = Readonly<{
  /** Updated role name (must remain unique) */
  name?: string;
  /**
   * Updated access level for permission hierarchy.
   * @range 1-5
   */
  accessLevel?: number;
  /** Updated role description */
  description?: string;
  /** Updated project leadership permission */
  canLeadProjects?: boolean;
  /** Updated team uniqueness constraint */
  isUniquePerTeam?: boolean;
  /** Updated active status of the role */
  isActive?: boolean;
}>;

/**
 * Contract for filtering and searching roles in the MAD-AI system.
 * Provides simple yet effective filtering capabilities for role management.
 *
 * @description This contract enables role queries with optional text search
 * and active status filtering. The readonly modifier ensures immutability
 * of filter parameters.
 *
 * @example Searching active roles
 * ```typescript
 * const activeSearch: ListRolesFilterContract = {
 *   search: 'lead',
 *   active: true
 * };
 * ```
 *
 * @example All roles regardless of status
 * ```typescript
 * const allRoles: ListRolesFilterContract = {
 *   // No filters applied
 * };
 * ```
 *
 * @since 1.0.0
 * @domain Role Management
 */
export type ListRolesFilterContract = Readonly<{
  /**
   * Text search across role name and description.
   * Performs case-insensitive partial matching.
   */
  search?: string;
  /**
   * Filter by role active status.
   * When true, returns only active roles.
   * When false, returns only inactive roles.
   * When undefined, returns all roles.
   */
  active?: boolean;
}>;

/**
 * Contract for role assignment operations in the MAD-AI system.
 * Encapsulates the relationship between users and roles with audit trail.
 *
 * @description This contract represents the domain concept of role assignment,
 * tracking not only the user-role relationship but also the actor who
 * performed the assignment for audit and governance purposes.
 *
 * @example Standard role assignment
 * ```typescript
 * const assignment: RoleAssignmentContract = {
 *   userId: 123,
 *   roleId: 456,
 *   assignedByUserId: 789
 * };
 * ```
 *
 * @example System-level assignment
 * ```typescript
 * const systemAssignment: RoleAssignmentContract = {
 *   userId: 123,
 *   roleId: 456
 *   // assignedByUserId omitted for system operations
 * };
 * ```
 *
 * @since 1.0.0
 * @domain Role Management
 */
export type RoleAssignmentContract = Readonly<{
  /** ID of the user receiving the role assignment */
  userId: number;
  /** ID of the role being assigned */
  roleId: number;
  /**
   * ID of the user who performed the assignment.
   * Optional for system-level assignments or automated processes.
   */
  assignedByUserId?: number;
}>;
