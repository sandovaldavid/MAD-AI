import type { CreateRoleContract } from '@domain/repositories/business/role.contract';

/**
 * Application Layer Types for Roles Use Cases
 *
 * These types define the contracts between Presentation and Application layers,
 * ensuring proper separation of concerns and type safety.
 */


// Individual Role Operations Types
export interface CreateRoleRequest {
  readonly name: string;
  readonly accessLevel: number;
  readonly description?: string;
  readonly canLeadProjects?: boolean;
  readonly isUniquePerTeam?: boolean;
  readonly requesterId?: number;
}

export interface UpdateRoleRequest {
  readonly id: number;
  readonly name?: string;
  readonly accessLevel?: number;
  readonly description?: string;
  readonly canLeadProjects?: boolean;
  readonly isUniquePerTeam?: boolean;
  readonly requesterId?: number;
}

export interface ActivateRoleRequest {
  readonly id: number;
  readonly requesterId?: number;
}

export interface DeactivateRoleRequest {
  readonly id: number;
  readonly requesterId?: number;
}

export interface DeleteRoleRequest {
  readonly id: number;
  readonly requesterId?: number;
}

export interface AssignRoleToUserRequest {
  readonly userId: number;
  readonly roleId: number;
  readonly assignedByUserId: number;
}

export interface UnassignRoleFromUserRequest {
  readonly userId: number;
  readonly roleId: number;
  readonly requesterId?: number;
}

// Query Types
export interface GetRoleByIdRequest {
  readonly id: number;
  readonly requesterId?: number;
}

export interface GetRoleByNameRequest {
  readonly name: string;
  readonly requesterId?: number;
}

export interface ListRolesRequest {
  readonly filters?: RoleFilters;
  readonly pagination?: PaginationOptions;
  readonly requesterId?: number;
}

export interface GetUsersByRoleRequest {
  readonly roleId: number;
  readonly pagination?: PaginationOptions;
  readonly requesterId?: number;
}

// Supporting Types
export interface RoleFilters {
  readonly isActive?: boolean;
  readonly accessLevel?: number;
  readonly canLeadProjects?: boolean;
  readonly isUniquePerTeam?: boolean;
}

export interface PaginationOptions {
  readonly page: number;
  readonly pageSize: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
}

export interface RoleUpdateData {
  readonly id: number;
  readonly updates: Partial<Omit<CreateRoleContract, 'name'>>;
}

export interface RoleUpdateResult {
  readonly index: number;
  readonly id: number;
  readonly success: boolean;
  readonly updatedRole?: unknown; // Will be defined by Domain
  readonly error?: string;
}

// Unassign Role Operations Types
export interface UnassignRoleFromUserRequest {
  readonly userId: number;
  readonly roleId: number;
  readonly requesterId?: number;
}
