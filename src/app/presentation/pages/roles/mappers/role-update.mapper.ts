import type { RoleFormView, RoleDetailView } from '../../../models/roles/role.models';
import type { UpdateRoleRequest } from '@application/types/roles/roles.types';
import type { RoleFormData } from './role-create.mapper';

/**
 * Mappers for converting Presentation layer role models to Application layer update requests
 */

/**
 * Maps role form data to UpdateRoleRequest for the Application layer
 */
export function mapRoleFormDataToUpdateRequest(
  roleId: number,
  formData: RoleFormData,
  requesterId?: number
): UpdateRoleRequest {
  return {
    id: roleId,
    name: formData.name,
    accessLevel: formData.accessLevel,
    description: formData.description,
    requesterId: requesterId,
  };
}

/**
 * Maps role form data to UpdateRoleRequest for the Application layer
 */
export function mapRoleFormViewToUpdateRequest(
  roleId: number,
  formView: RoleFormView,
  requesterId?: number
): UpdateRoleRequest {
  return {
    id: roleId,
    name: formView.name,
    accessLevel: formView.accessLevel,
    description: formView.description,
    requesterId: requesterId,
  };
}

/**
 * Maps role detail view to UpdateRoleRequest for the Application layer
 */
export function mapRoleDetailViewToUpdateRequest(
  roleDetailView: RoleDetailView,
  requesterId?: number
): UpdateRoleRequest {
  return {
    id: parseInt(roleDetailView.id, 10),
    name: roleDetailView.name,
    accessLevel: roleDetailView.accessLevel,
    description: roleDetailView.description,
    requesterId: requesterId,
  };
}

/**
 * Maps partial role updates to UpdateRoleRequest
 */
export function mapPartialRoleToUpdateRequest(
  roleId: number,
  updates: Partial<RoleFormView>,
  requesterId?: number
): UpdateRoleRequest {
  return {
    id: roleId,
    name: updates.name,
    accessLevel: updates.accessLevel,
    description: updates.description,
    requesterId: requesterId,
  };
}

/**
 * Validates if a role form data is valid for updating
 */
export function isValidRoleFormDataForUpdate(formData: RoleFormData): boolean {
  return !!(
    formData.name &&
    formData.name.trim().length > 0 &&
    formData.accessLevel >= 0 &&
    formData.accessLevel <= 5
  );
}

/**
 * Validates if an update request has valid data
 */
export function isValidUpdateRequest(request: UpdateRoleRequest): boolean {
  return !!(
    request.id &&
    request.id > 0 &&
    (!request.name || request.name.trim().length > 0) &&
    (!request.accessLevel || (request.accessLevel >= 0 && request.accessLevel <= 5))
  );
}
