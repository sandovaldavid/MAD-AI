/**
 * User UI Types
 *
 * @description
 * Type definitions specific to the User presentation layer.
 * These types define the shape of data used by UI components,
 * following the Dumb Component pattern where data is pre-processed
 * by Smart Components before being passed to display components.
 *
 * @responsibilities
 * - Define UI-specific interfaces for user data display
 * - Provide type safety for component communication
 * - Support form validation and user interactions
 * - Enable proper TypeScript inference in templates
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Presentation
 */

// ============================================================================
// User Display Types (for Dumb Components)
// ============================================================================

/**
 * User data optimized for display in lists and tables
 * Contains pre-processed and formatted data ready for UI consumption
 */
export interface UserDisplayData {
  readonly id: number;
  readonly displayName: string;
  readonly email: string;
  readonly username: string;
  readonly role: string;
  readonly accessLevel?: number;
  readonly status: UserStatusDisplay;
  readonly avatar?: string;
  readonly initials: string;
  readonly lastActivity?: string;
  readonly lastActivityDisplay?: string;
  readonly createdAt: string;
  readonly isActive: boolean;
  readonly canEdit: boolean;
  readonly canDelete: boolean;
}

/**
 * User data for card display components
 * Optimized for compact card layouts with essential information
 */
export interface UserCardData {
  readonly id: number;
  readonly displayName: string;
  readonly email: string;
  readonly role: string;
  readonly status: UserStatusDisplay;
  readonly avatar?: string;
  readonly stats?: UserStatsData;
}

/**
 * User status information with display properties
 * Contains both the status value and its UI representation
 */
export interface UserStatusDisplay {
  readonly value: string;
  readonly label: string;
  readonly cssClass: string;
  readonly iconName: string;
  readonly description: string;
}

/**
 * User statistics for dashboard and detail views
 */
export interface UserStatsData {
  readonly totalLogins: number;
  readonly lastLoginDate?: string;
  readonly totalActions: number;
  readonly accountAge: string;
  readonly completionRate: number;
}

// ============================================================================
// Form Types (for User Input Components)
// ============================================================================

/**
 * User form data for create/edit operations
 * Contains only the fields that can be modified through the UI
 */
export interface UserFormData {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly username: string;
  readonly role?: string;
  readonly isActive?: boolean;
  readonly sendWelcomeEmail?: boolean;
}

/**
 * User search/filter criteria for list filtering
 * Supports multiple filter types and search terms
 */
export interface UserSearchCriteria {
  readonly searchTerm: string;
  readonly statusFilter?: UserStatusFilter;
  readonly roleFilter?: string;
  readonly role?: string;
  readonly status?: string;
  readonly isActive?: boolean | null;
  readonly createdFrom?: string | null;
  readonly createdTo?: string | null;
  readonly lastActivityFrom?: string | null;
  readonly lastActivityTo?: string | null;
  readonly dateRange?: DateRangeFilter;
  readonly sortBy?: UserSortField;
  readonly sortDirection?: SortDirection;
}

/**
 * User filter options for status-based filtering
 */
export type UserStatusFilter = 'all' | 'active' | 'inactive' | 'pending';

/**
 * Available fields for sorting user lists
 */
export type UserSortField = 'name' | 'email' | 'role' | 'status' | 'created' | 'lastActivity';

/**
 * Sort direction options
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort configuration for table components
 */
export interface SortConfig {
  readonly field: string;
  readonly direction: SortDirection;
}

/**
 * Date range filter for temporal filtering
 */
export interface DateRangeFilter {
  readonly startDate: string;
  readonly endDate: string;
}

// ============================================================================
// List and Pagination Types
// ============================================================================

/**
 * Paginated user list data with metadata
 * Used by list components to display users with pagination controls
 */
export interface UserListData {
  readonly users: UserDisplayData[];
  readonly totalCount: number;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

/**
 * Pagination configuration for user lists
 */
export interface UserPaginationConfig {
  readonly page: number;
  readonly pageSize: number;
  readonly showSizeOptions: boolean;
  readonly sizeOptions: number[];
}

// ============================================================================
// Action and Event Types
// ============================================================================

/**
 * Available actions for user management
 * Defines what operations can be performed on users
 */
export interface UserActionConfig {
  readonly canView: boolean;
  readonly canEdit: boolean;
  readonly canDelete: boolean;
  readonly canActivate: boolean;
  readonly canDeactivate: boolean;
  readonly canResetPassword: boolean;
}

/**
 * Bulk action types for multiple user operations
 */
export type UserBulkAction = 'activate' | 'deactivate' | 'delete' | 'export' | 'assignRole';

/**
 * User table selection state
 * Manages which users are selected for bulk operations
 */
export interface UserSelectionState {
  readonly selectedIds: Set<number>;
  readonly isAllSelected: boolean;
  readonly selectedCount: number;
  readonly totalCount: number;
}

// ============================================================================
// Validation and Error Types
// ============================================================================

/**
 * Form validation errors for user forms
 * Maps field names to their validation error messages
 */
export interface UserFormErrors {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly email?: string;
  readonly username?: string;
  readonly role?: string;
  readonly general?: string;
}

/**
 * User operation result for UI feedback
 * Provides information about the success or failure of operations
 */
export interface UserOperationResult {
  readonly success: boolean;
  readonly message: string;
  readonly userId?: number;
  readonly errors?: UserFormErrors;
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Loading states for different user operations
 * Enables fine-grained loading indicators
 */
export interface UserLoadingState {
  readonly list: boolean;
  readonly detail: boolean;
  readonly create: boolean;
  readonly update: boolean;
  readonly delete: boolean;
  readonly bulkActions: boolean;
}

/**
 * User management UI preferences
 * Stores user preferences for list display and behavior
 */
export interface UserUIPreferences {
  readonly defaultPageSize: number;
  readonly defaultSortField: UserSortField;
  readonly defaultSortDirection: SortDirection;
  readonly showAvatars: boolean;
  readonly compactView: boolean;
  readonly autoRefresh: boolean;
}
