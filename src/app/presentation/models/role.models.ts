/**
 * @fileoverview Role Presentation Models
 *
 * This file contains the presentation layer models for role-related views.
 * These models are specifically designed for UI components and are decoupled
 * from application and domain layer types.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2025-01-01
 */

export interface RoleTableRowView {
  id: string;
  name: string;
  displayName: string;
  description: string;
  userCount: number;
  permissionCount: number;
  statusBadge: StatusBadgeView;
  createdAt: string;
  updatedAt: string;
  actions: TableAction[];
}

export interface RoleCardView {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon: string;
  userCount: number;
  permissionCount: number;
  isSystemRole: boolean;
  status: RoleStatus;
}

export interface RoleFormView {
  id?: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon: string;
  permissions: PermissionSelectionView[];
  isSystemRole: boolean;
  isActive: boolean;
}

export interface RoleDetailView {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon: string;
  permissions: PermissionView[];
  users: RoleUserView[];
  statistics: RoleStatisticsView;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isSystemRole: boolean;
  status: RoleStatus;
}

export interface RoleStatisticsView {
  totalUsers: number;
  activeUsers: number;
  permissionsGranted: number;
  permissionsDenied: number;
  recentActivity: RoleActivityView[];
}

export interface RoleActivityView {
  id: string;
  action:
    | 'user_assigned'
    | 'user_removed'
    | 'permission_granted'
    | 'permission_revoked'
    | 'role_updated';
  description: string;
  timestamp: string;
  performedBy: string;
}

export interface RoleUserView {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  assignedAt: string;
  status: UserStatus;
}

export interface PermissionSelectionView {
  id: string;
  name: string;
  description: string;
  category: string;
  selected: boolean;
  required: boolean;
  dependsOn?: string[];
}

export interface PermissionView {
  id: string;
  name: string;
  description: string;
  category: string;
  granted: boolean;
  required: boolean;
}

// Supporting types
export interface StatusBadgeView {
  label: string;
  color: BadgeColor;
  icon: string;
}

export interface TableAction {
  label: string;
  icon: string;
  color: ButtonColor;
  action: 'edit' | 'delete' | 'duplicate' | 'view' | 'assign-users' | 'manage-permissions';
  disabled?: boolean;
  tooltip?: string;
}

// Enums for UI
export type BadgeColor =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'light'
  | 'dark';
export type ButtonColor =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark';
export type RoleStatus = 'active' | 'inactive' | 'system';
export type UserStatus = 'active' | 'inactive' | 'pending';

// Form validation types
export interface RoleFormValidation {
  name: ValidationState;
  displayName: ValidationState;
  description: ValidationState;
  permissions: ValidationState;
}

export interface ValidationState {
  isValid: boolean;
  message?: string;
  showError: boolean;
}

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
  systemRole?: boolean;
  permissionCategory?: string;
  dateRange?: DateRangeView;
}

export interface DateRangeView {
  start: string;
  end: string;
}

export type RoleSortField = 'name' | 'displayName' | 'userCount' | 'createdAt' | 'updatedAt';

// Bulk operations
export interface BulkRoleOperationView {
  operation: 'activate' | 'deactivate' | 'delete' | 'duplicate' | 'export';
  roleIds: string[];
  confirmMessage: string;
  successMessage: string;
  errorMessage: string;
}

// Permission management
export interface PermissionMatrixView {
  categories: PermissionCategoryView[];
  roles: RolePermissionView[];
}

export interface PermissionCategoryView {
  name: string;
  description: string;
  permissions: PermissionView[];
}

export interface RolePermissionView {
  roleId: string;
  roleName: string;
  permissions: Record<string, boolean>;
}

// Modal and dialog types
export interface RoleConfirmDialogView {
  title: string;
  message: string;
  confirmButton: string;
  cancelButton: string;
  type: 'info' | 'warning' | 'danger';
}

export interface RoleNotificationView {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}

// Role selector component
export interface RoleSelectorView {
  selectedRoleId?: string;
  availableRoles: RoleOptionView[];
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
  multiple?: boolean;
}

export interface RoleOptionView {
  id: string;
  displayName: string;
  description: string;
  color: string;
  icon: string;
  userCount: number;
  disabled?: boolean;
}
