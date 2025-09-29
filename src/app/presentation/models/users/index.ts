/**
 * User Presentation Models Index
 *
 * @description
 * Central export file for all user-related presentation models and types.
 * This file aggregates all user model exports to provide a clean import interface
 * for components and services in the presentation layer.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Presentation
 */

// ============================================================================
// UI Types and Interfaces
// ============================================================================

export type {
  UserDisplayData,
  UserCardData,
  UserStatusDisplay,
  UserStatsData,
  UserFormData,
  UserSearchCriteria,
  UserStatusFilter,
  UserSortField,
  SortDirection,
  SortConfig,
  DateRangeFilter,
  UserListData,
  UserPaginationConfig,
  UserActionConfig,
  UserBulkAction,
  UserSelectionState,
  UserFormErrors,
  UserOperationResult,
  UserLoadingState,
  UserUIPreferences,
} from './user-ui.types';

// ============================================================================
// Display Models (ViewModels)
// ============================================================================

export { UserListViewModel, UserCardViewModel, UserDetailViewModel } from './user-display.model';

// ============================================================================
// Color and Status Types
// ============================================================================

export type {
  UserStatusColor,
  UserStatusType,
  UserStatusInfo,
  UserActivityLevel,
  UserActivityInfo,
} from './user-colors.type';

export {
  USER_STATUS_CONFIG,
  USER_ACTIVITY_CONFIG,
  getUserStatusInfo,
  getUserStatusInfoByCssClass,
  getUserStatusIcon,
  getUserStatusBadgeClasses,
  getUserActivityInfo,
  getUserActivityBadgeClasses,
  mapStringToUserStatus,
} from './user-colors.type';
