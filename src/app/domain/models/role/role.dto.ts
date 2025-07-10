import { RoleAccessLevel } from '../../enums/role-access-level.enum';

/**
 * Data transfer objects for Role entity
 * These are used for creating and updating roles
 */

/**
 * Data required to create a new role
 */
export interface CreateRoleData {
    name: string;
    description: string;
    accessLevel: RoleAccessLevel;
    canLeadProjects?: boolean;
    isUniquePerTeam?: boolean;
    createdByUserId: number;
}

/**
 * Data for updating an existing role
 */
export interface UpdateRoleData {
    name?: string;
    description?: string;
    accessLevel?: RoleAccessLevel;
    canLeadProjects?: boolean;
    isUniquePerTeam?: boolean;
    isActive?: boolean;
}

/**
 * Data for assigning a role to a user
 */
export interface AssignRoleData {
    userId: number;
    roleId: number;
    assignedByUserId?: number;
}

/**
 * Data for unassigning a role from a user
 */
export interface UnassignRoleData {
    userId: number;
}
