/**
 * @fileoverview Role Create Mapper
 *
 * Mapper functions to convert between Presentation layer role models
 * and Application layer role creation requests.
 */

import type { RoleFormView } from '../../../models/roles/role.models';
import type { CreateRoleRequest } from '@application/types/roles/roles.types';
import type { CreateRoleData } from '@application/facades/role/role.types';

/**
 * Interface for role creation data coming from the form
 */
export interface RoleFormData {
  name: string;
  accessLevel: number;
  description: string;
  isActive: boolean;
}

/**
 * Legacy interface for backward compatibility
 */
export interface RoleModel {
  name: string;
  accessLevel?: number;
  description?: string;
  canLeadProjects?: boolean;
  isUniquePerTeam?: boolean;
}

/**
 * Maps role form data to CreateRoleData for the Application layer facade
 */
export function mapRoleFormDataToCreateRoleData(formData: RoleFormData): CreateRoleData {
  return {
    name: formData.name,
    accessLevel: formData.accessLevel,
    description: formData.description || '', // Ensure it's never undefined
    // Optional properties can be set to defaults or derived from access level
    canLeadProjects: formData.accessLevel >= 3, // Level 3+ can lead projects
    isUniquePerTeam: formData.accessLevel >= 4, // Level 4+ is unique per team
  };
}

/**
 * Maps RoleFormData to CreateRoleRequest for the Application layer
 */
export function mapRoleFormDataToCreateRequest(
  formData: RoleFormData,
  requesterId?: number
): CreateRoleRequest {
  return {
    name: formData.name,
    accessLevel: formData.accessLevel,
    description: formData.description || undefined,
    canLeadProjects: formData.accessLevel <= 3, // Higher access levels can lead projects
    isUniquePerTeam: formData.accessLevel <= 2, // Only critical roles are unique per team
    requesterId,
  };
}

/**
 * Maps RoleModel to CreateRoleRequest for the Application layer
 * @deprecated Use mapRoleFormDataToCreateRequest instead
 */
export function mapRoleModelToCreateInput(
  roleData: Partial<RoleModel>,
  requesterId?: number
): CreateRoleRequest {
  if (!roleData.name) {
    throw new Error('Role name is required for creation');
  }

  return {
    name: roleData.name,
    accessLevel: roleData.accessLevel || 5, // Default to minimum access level
    description: roleData.description,
    canLeadProjects: roleData.canLeadProjects || (roleData.accessLevel || 5) <= 3,
    isUniquePerTeam: roleData.isUniquePerTeam || (roleData.accessLevel || 5) <= 2,
    requesterId,
  };
}

/**
 * Maps RoleFormView to CreateRoleRequest for the Application layer
 */
export function mapRoleFormViewToCreateRequest(
  roleFormView: RoleFormView,
  requesterId?: number
): CreateRoleRequest {
  return {
    name: roleFormView.name,
    accessLevel: roleFormView.accessLevel,
    description: roleFormView.description || undefined,
    canLeadProjects: roleFormView.accessLevel <= 3,
    isUniquePerTeam: roleFormView.accessLevel <= 2,
    requesterId,
  };
}

/**
 * Validates if role data is valid for creation
 */
export function isValidRoleForCreation(
  roleData: Partial<RoleModel>
): roleData is Pick<RoleModel, 'name'> & Partial<RoleModel> {
  return Boolean(
    roleData &&
      roleData.name &&
      roleData.name.trim().length >= 3 &&
      (roleData.accessLevel === undefined ||
        (roleData.accessLevel >= 1 && roleData.accessLevel <= 5))
  );
}

/**
 * Validates if form data is valid for creation
 */
export function isValidRoleFormData(formData: RoleFormData): boolean {
  return Boolean(
    formData &&
      formData.name &&
      formData.name.trim().length >= 3 &&
      formData.accessLevel >= 1 &&
      formData.accessLevel <= 5
  );
}
