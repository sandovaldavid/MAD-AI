export interface RoleTableRowView {
  id: string;
  name: string;
  displayName: string;
  description: string;
  userCount: number;
  accessLevel: number;
  statusBadge: StatusBadgeView;
  createdAt: string;
  updatedAt: string;
}

export interface RoleCardView {
  id: string;
  name: string;
  displayName: string;
  description: string;
  accessLevel: number;
  userCount: number;
  permissionCount: number;
  status: RoleStatus;
}

export interface RoleFormView {
  id?: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon: string;
  accessLevel: number; // 1-5, used for permission validation
  isActive: boolean;
}

export interface RoleDetailView {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  accessLevel: number; // 1-5, used for permission validation
  status: RoleStatus;
}

// Supporting types
export interface StatusBadgeView {
  label: string;
  color: string;
  icon: string;
}

export type RoleStatus = 'active' | 'inactive';

// Search and filter types
export interface RoleSearchView {
  query: string;
  filters: RoleFiltersView;
  sortBy: RoleSortField;
  sortDirection: 'asc' | 'desc';
}

export interface RoleFiltersView {
  status?: RoleStatus;
  hasUsers?: boolean;
  accessLevel?: number; // 1-5, filter by access level instead of system role
  permissionCategory?: string;
  dateRange?: DateRangeView;
}

export interface DateRangeView {
  start: string;
  end: string;
}

export type RoleSortField = 'name' | 'displayName' | 'userCount' | 'createdAt' | 'updatedAt';
