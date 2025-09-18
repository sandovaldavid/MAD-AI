/**
 * @fileoverview Presentation Models Index
 *
 * This file exports all presentation layer models for easy importing.
 * These models are specifically designed for UI components and are decoupled
 * from application and domain layer types.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2025-01-01
 */

// User models
export * from './user.models';

// Role models
export type {
  RoleTableRowView,
  RoleCardView,
  RoleFormView,
  RoleDetailView,
  RoleStatisticsView,
  RoleActivityView,
  RoleUserView,
  PermissionSelectionView,
  RolePermissionView,
  RoleConfirmDialogView,
  RoleNotificationView,
  RoleSelectorView,
  RoleOptionView,
  RoleFormValidation,
  RoleSearchView,
  RoleFiltersView,
  BulkRoleOperationView,
  PermissionMatrixView,
  PermissionCategoryView,
  RoleSortField,
  RoleStatus,
  StatusBadgeView as RoleStatusBadgeView,
  TableAction as RoleTableAction,
  ValidationState as RoleValidationState,
  DateRangeView as RoleDateRangeView,
  BadgeColor as RoleBadgeColor,
  ButtonColor as RoleButtonColor,
} from './role.models';

// Auth models
export * from './auth.models';

// Common types used across models
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

export interface ValidationState {
  isValid: boolean;
  message?: string;
  showError: boolean;
}

export interface TableAction {
  label: string;
  icon: string;
  color: ButtonColor;
  action: string;
  disabled?: boolean;
  tooltip?: string;
}

export interface DateRangeView {
  start: string;
  end: string;
}

export interface NotificationView {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}
