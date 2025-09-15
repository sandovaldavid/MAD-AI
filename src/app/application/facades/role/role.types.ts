import type { RoleSummary } from '@/app/application/mappers/role.mapper';
import type { User } from '@domain/entities/user.entity';
import type { FacadeOpts } from '@application/types/facade-opts';

/**
 * Shared types for role facades
 */

export interface ListRolesParams {
  search?: string;
  active?: boolean;
}

export interface RoleState {
  loading: boolean;
  error: string | null;
  roles: RoleSummary[];
  currentRole: RoleSummary | null;
  roleUsers: User[];
  currentFilters: ListRolesParams | null;
}

export interface CreateRoleData {
  name: string;
  accessLevel: number;
  description: string;
  canLeadProjects?: boolean;
  isUniquePerTeam?: boolean;
}

export interface UpdateRoleData {
  name?: string;
  accessLevel?: number;
  description?: string;
  isActive?: boolean;
  canLeadProjects?: boolean;
  isUniquePerTeam?: boolean;
}

export interface BulkUpdateRoleData {
  id: number;
  data: UpdateRoleData;
}

export interface RoleStatistics {
  total: number;
  active: number;
  inactive: number;
  byAccessLevel: Record<number, number>;
}

export { type FacadeOpts };
