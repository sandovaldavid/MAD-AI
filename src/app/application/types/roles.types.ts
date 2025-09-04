import type { CreateRoleContract } from '@domain/repositories/business/role.contract';

/**
 * Application Layer Types for Roles Use Cases
 *
 * These types define the contracts between Presentation and Application layers,
 * ensuring proper separation of concerns and type safety.
 */

// Bulk Operations Types
export interface BulkCreateRolesRequest {
  readonly roles: readonly CreateRoleRequest[];
  readonly requesterId: number;
  readonly validateOnly?: boolean;
  readonly continueOnError?: boolean;
}

export interface BulkCreateRolesResult {
  readonly successful: number;
  readonly failed: number;
  readonly total: number;
  readonly executionTime: number;
  readonly correlationId: string;
}

export interface BulkDeleteRolesResult {
  readonly successful: number;
  readonly failed: number;
  readonly total: number;
  readonly executionTime: number;
  readonly correlationId: string;
}

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
  readonly unassignedByUserId: number;
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

// Bulk Operations Types
export interface BulkDeleteRolesRequest {
  readonly roleIds: readonly number[];
  readonly requesterId: number;
  readonly continueOnError?: boolean;
}

export interface BulkUpdateRolesRequest {
  readonly updates: readonly RoleUpdateData[];
  readonly requesterId: number;
  readonly continueOnError?: boolean;
  readonly maxBatchSize?: number;
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

export interface BulkUpdateRolesResult {
  readonly results: readonly RoleUpdateResult[];
  readonly summary: {
    readonly total: number;
    readonly successful: number;
    readonly failed: number;
    readonly skipped: number;
    readonly versionConflicts: number;
  };
  readonly performance: {
    readonly executionTime: number;
    readonly averageTime: number;
    readonly validationErrors: number;
  };
  readonly correlationId: string;
}

// Unassign Role Operations Types
export interface UnassignRoleFromUserRequest {
  readonly userId: number;
  readonly roleId: number;
  readonly requesterId?: number;
}
