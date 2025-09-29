import type {
  ActivateRoleRequest,
  DeactivateRoleRequest,
  DeleteRoleRequest,
  AssignRoleToUserRequest,
  UnassignRoleFromUserRequest,
} from '@application/types/roles/roles.types';

/**
 * Mappers for converting Presentation layer role operations to Application layer requests
 */

/**
 * Creates an activate role request
 */
export function createActivateRoleRequest(
  roleId: string,
  requesterId?: number
): ActivateRoleRequest {
  return {
    id: parseInt(roleId, 10),
    requesterId: requesterId,
  };
}

/**
 * Creates a deactivate role request
 */
export function createDeactivateRoleRequest(
  roleId: string,
  requesterId?: number
): DeactivateRoleRequest {
  return {
    id: parseInt(roleId, 10),
    requesterId: requesterId,
  };
}

/**
 * Creates a delete role request
 */
export function createDeleteRoleRequest(roleId: string, requesterId?: number): DeleteRoleRequest {
  return {
    id: parseInt(roleId, 10),
    requesterId: requesterId,
  };
}

/**
 * Creates an assign role to user request
 */
export function createAssignRoleToUserRequest(
  userId: string | number,
  roleId: string | number,
  assignedByUserId: string | number
): AssignRoleToUserRequest {
  return {
    userId: typeof userId === 'string' ? parseInt(userId, 10) : userId,
    roleId: typeof roleId === 'string' ? parseInt(roleId, 10) : roleId,
    assignedByUserId:
      typeof assignedByUserId === 'string' ? parseInt(assignedByUserId, 10) : assignedByUserId,
  };
}

/**
 * Creates an unassign role from user request
 */
export function createUnassignRoleFromUserRequest(
  userId: string | number,
  roleId: string | number,
  requesterId?: number
): UnassignRoleFromUserRequest {
  return {
    userId: typeof userId === 'string' ? parseInt(userId, 10) : userId,
    roleId: typeof roleId === 'string' ? parseInt(roleId, 10) : roleId,
    requesterId: requesterId,
  };
}

/**
 * Batch operations helpers
 */
export function createBatchActivateRolesRequests(
  roleIds: string[],
  requesterId?: number
): ActivateRoleRequest[] {
  return roleIds.map((roleId) => createActivateRoleRequest(roleId, requesterId));
}

export function createBatchDeactivateRolesRequests(
  roleIds: string[],
  requesterId?: number
): DeactivateRoleRequest[] {
  return roleIds.map((roleId) => createDeactivateRoleRequest(roleId, requesterId));
}

export function createBatchDeleteRolesRequests(
  roleIds: string[],
  requesterId?: number
): DeleteRoleRequest[] {
  return roleIds.map((roleId) => createDeleteRoleRequest(roleId, requesterId));
}

/**
 * Validation functions
 */
export function isValidRoleId(roleId: string | number): boolean {
  const numericId = typeof roleId === 'string' ? parseInt(roleId, 10) : roleId;
  return !isNaN(numericId) && numericId > 0;
}

export function isValidUserId(userId: string | number): boolean {
  const numericId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  return !isNaN(numericId) && numericId > 0;
}

export function areValidRoleIds(roleIds: string[]): boolean {
  return roleIds.length > 0 && roleIds.every((id) => isValidRoleId(id));
}
