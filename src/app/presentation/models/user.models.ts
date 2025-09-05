/**
 * @fileoverview User Presentation Models
 *
 * This file contains the presentation layer models for user-related views.
 * These models are specifically designed for UI components and are decoupled
 * from application and domain layer types.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2025-01-01
 */

export interface UserTableRowView {
  id: string;
  displayName: string;
  email: string;
  username: string;
  roleBadge: RoleBadgeView;
  statusBadge: StatusBadgeView;
  lastLogin: string;
  createdAt: string;
  actions: TableAction[];
}

export interface UserCardView {
  id: string;
  avatarUrl?: string;
  displayName: string;
  email: string;
  role: string;
  status: UserStatus;
  joinDate: string;
  lastActivity: string;
}

export interface UserFormView {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  roleId: string;
  isActive: boolean;
  profileImage?: File;
}

export interface UserProfileView {
  id: string;
  displayName: string;
  email: string;
  username: string;
  role: RoleBadgeView;
  status: StatusBadgeView;
  avatarUrl?: string;
  joinDate: string;
  lastLogin: string;
  permissions: PermissionView[];
  statistics: UserStatisticsView;
}

export interface UserStatisticsView {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersThisMonth: number;
  usersByRole: RoleCountView[];
}

export interface RoleCountView {
  roleName: string;
  count: number;
  percentage: number;
}

// Supporting types
export interface RoleBadgeView {
  label: string;
  color: BadgeColor;
  icon: string;
}

export interface StatusBadgeView {
  label: string;
  color: BadgeColor;
  icon: string;
}

export interface PermissionView {
  id: string;
  name: string;
  description: string;
  category: string;
  granted: boolean;
}

export interface TableAction {
  label: string;
  icon: string;
  color: ButtonColor;
  action: 'edit' | 'delete' | 'activate' | 'deactivate' | 'view' | 'reset-password';
  disabled?: boolean;
  tooltip?: string;
}

// Enums for UI
export type BadgeColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'light' | 'dark';
export type ButtonColor = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'light' | 'dark';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

// Form validation types
export interface UserFormValidation {
  firstName: ValidationState;
  lastName: ValidationState;
  email: ValidationState;
  username: ValidationState;
  roleId: ValidationState;
}

export interface ValidationState {
  isValid: boolean;
  message?: string;
  showError: boolean;
}

// Search and filter types
export interface UserSearchView {
  query: string;
  filters: UserFiltersView;
  sortBy: UserSortField;
  sortDirection: 'asc' | 'desc';
}

export interface UserFiltersView {
  role?: string;
  status?: UserStatus;
  dateRange?: DateRangeView;
  hasAvatar?: boolean;
}

export interface DateRangeView {
  start: string;
  end: string;
}

export type UserSortField = 'name' | 'email' | 'role' | 'status' | 'createdAt' | 'lastLogin';

// Bulk operations
export interface BulkUserOperationView {
  operation: 'activate' | 'deactivate' | 'delete' | 'change-role';
  userIds: string[];
  newRoleId?: string;
  confirmMessage: string;
  successMessage: string;
  errorMessage: string;
}

// Modal and dialog types
export interface UserConfirmDialogView {
  title: string;
  message: string;
  confirmButton: string;
  cancelButton: string;
  type: 'info' | 'warning' | 'danger';
}

export interface UserNotificationView {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}
