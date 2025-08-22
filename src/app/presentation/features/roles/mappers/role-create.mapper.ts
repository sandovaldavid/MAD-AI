import { RoleModel } from '../models/role.model';

/**
 * Type definition for role creation input (what the facade expects)
 */
export interface CreateRoleInput {
    name: string;
    accessLevel: number;
    description: string;
    canLeadProjects?: boolean;
    isUniquePerTeam?: boolean;
}

/**
 * Mapper to convert RoleModel (presentation layer) to CreateRoleInput (application layer)
 *
 * @description
 * This mapper handles the transformation between the presentation layer's RoleModel
 * and the application layer's expected input format, ensuring type safety and
 * proper data conversion (e.g., string to number for accessLevel).
 *
 * @param roleModel - Partial RoleModel from the presentation layer
 * @returns CreateRoleInput - Properly typed input for the application facade
 */
export function mapRoleModelToCreateInput(roleModel: Partial<RoleModel>): CreateRoleInput {
    return {
        name: roleModel.name || '',
        accessLevel: Number(roleModel.accessLevel) || 5,
        description: roleModel.description || '',
        canLeadProjects: false, // Default value for optional field
        isUniquePerTeam: false, // Default value for optional field
    };
}

/**
 * Validates that the role model has the minimum required fields for creation
 *
 * @param roleModel - Partial RoleModel to validate
 * @returns boolean - True if model has required fields, false otherwise
 */
export function isValidRoleForCreation(roleModel: Partial<RoleModel>): boolean {
    return !!(
        roleModel.name?.trim() &&
        roleModel.accessLevel &&
        Number.isInteger(Number(roleModel.accessLevel)) &&
        Number(roleModel.accessLevel) >= 1 &&
        Number(roleModel.accessLevel) <= 5
    );
}
