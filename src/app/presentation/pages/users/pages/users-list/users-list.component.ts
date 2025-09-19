/**
 * Users List Page - Smart Compo
 *
 * @description
 * Smart component responsible for managing the users list view, including listing,
 * filtering, searching, pagination, and bulk operations. Acts as the main entry
 * point for user management functionality.
 *
 * @responsibilities
 * - Coordinate user listing through UsersFacade
 * - Manage search and filter state
 * - Handle pagination and sorting
 * - Coordinate bulk operations
 * - Manage UI state (loading, errors, selection)
 * - Provide navigation to detail/edit views
 * - Set page metadata (title, breadcrumbs)
 *
 * @architecture
 * Smart Component following MAD-AI patterns:
 * - Uses facades for business logic orchestration
 * - Manages reactive state with Angular signals
 * - Delegates UI rendering to dumb components
 * - Handles page-level services (title, breadcrumbs)
 * - No direct business logic or validation
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Presentation
 */

import {
  Component,
  computed,
  signal,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

// Presentation Services
import { BreadcrumbService } from '@presentation/services/breadcrumb.service';

// Application Layer Imports
import { UsersFacade } from '@application/facades/users/user.facade';
import { RolesFacade } from '@application/facades/role/role.facade';

// UI Components
import {
  PageHeader,
  PageHeaderConfig,
} from '@presentation/shared/components/page-header/page-header';
import {
  UserTableComponent,
  UserActionEvent,
  UserSelectionEvent,
  SortChangeEvent,
} from '../../components/user-table/user-table.component';
import { UserFilterComponent, FilterChangeEvent } from '../../components/user-filter/user-filter';
import {
  BulkActionsToolbar,
  BulkActionEvent,
  BulkAction,
} from '../../components/bulk-actions-toolbar/bulk-actions-toolbar';
import {
  Pagination,
  PageChangeEvent,
  PageSizeChangeEvent,
  PaginationConfig,
} from '@presentation/shared/ui/pagination/pagination';
import {
  ConfirmationModal,
  ModalConfig,
  ModalActionEvent,
} from '@presentation/shared/components/confirmation-modal/confirmation-modal';

// Types
import {
  UserDisplayData,
  UserSearchCriteria,
  SortConfig,
  UserActionConfig,
  UserStatusDisplay,
  UserSortField,
  SortDirection,
} from '../../types/user-ui.types';

@Component({
  selector: 'app-users-list',
  standalone: true,
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeader,
    UserTableComponent,
    UserFilterComponent,
    BulkActionsToolbar,
    Pagination,
    ConfirmationModal,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListPage implements OnInit {
  // ============================================================================
  // Dependencies
  // ============================================================================

  private readonly usersFacade = inject(UsersFacade);
  private readonly rolesFacade = inject(RolesFacade);
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);

  // ============================================================================
  // Component State
  // ============================================================================

  /**
   * Current search and filter criteria
   */
  private readonly _searchCriteria = signal<UserSearchCriteria>({
    searchTerm: '',
    statusFilter: 'all',
    roleFilter: '',
    sortBy: 'name',
    sortDirection: 'asc',
  });

  /**
   * Current pagination configuration
   */
  private readonly _paginationConfig = signal<PaginationConfig>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    showPageSizeSelector: true,
    showPageInfo: true,
    maxVisiblePages: 7,
  });

  /**
   * Bulk action configuration
   */
  private readonly _bulkActions = signal<BulkAction[]>([
    {
      id: 'activate',
      label: 'Activate',
      icon: 'user-check',
      variant: 'primary',
      requiresConfirmation: true,
    },
    {
      id: 'deactivate',
      label: 'Deactivate',
      icon: 'user-x',
      variant: 'secondary',
      requiresConfirmation: true,
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'trash',
      variant: 'danger',
      requiresConfirmation: true,
    },
  ]);

  /**
   * Confirmation modal state
   */
  private readonly _confirmationModal = signal<{
    visible: boolean;
    config: ModalConfig;
    loading: boolean;
    context?: any;
  }>({
    visible: false,
    loading: false,
    config: {
      title: 'Confirm Action',
      actions: [],
    },
  });

  /**
   * Current sort configuration for the table
   */
  private readonly _sortConfig = signal<SortConfig>({
    field: 'displayName',
    direction: 'asc',
  });

  /**
   * User action configuration
   */
  private readonly _userActions = signal<UserActionConfig>({
    canView: true,
    canEdit: true,
    canDelete: true,
    canActivate: true,
    canDeactivate: true,
    canResetPassword: true,
  });

  /**
   * Selection state for bulk operations
   */
  private readonly _selectedUsers = signal<UserDisplayData[]>([]);

  /**
   * Page header configuration
   */
  readonly headerConfig = computed(
    (): PageHeaderConfig => ({
      title: 'Gestión de Usuarios',
      description: 'Gestiona usuarios, roles y permisos en tu organización',
      icon: 'user-group',
      showBreadcrumbs: true,
      actions: [
        {
          label: 'Actualizar',
          icon: 'refresh',
          variant: 'secondary' as const,
          action: () => this.loadUsers(),
          disabled: false,
          loading: this.loading(),
        },
        {
          label: 'Agregar Usuario',
          icon: 'user-plus',
          variant: 'primary' as const,
          action: () => this.onCreateUser(),
          disabled: false,
          loading: false,
        },
      ],
    })
  );

  // ============================================================================
  // Public State (for template)
  // ============================================================================

  readonly facadeUsers = this.usersFacade.users;
  readonly loading = this.usersFacade.loading;
  readonly error = this.usersFacade.error;
  readonly availableRoles = this.rolesFacade.roles;
  readonly availableRoleNames = computed(() => this.availableRoles().map((role) => role.name));
  readonly searchCriteria = this._searchCriteria.asReadonly();
  readonly sortConfig = this._sortConfig.asReadonly();
  readonly userActions = this._userActions.asReadonly();
  readonly selectedUsers = this._selectedUsers.asReadonly();
  readonly paginationConfig = this._paginationConfig.asReadonly();
  readonly bulkActions = this._bulkActions.asReadonly();
  readonly confirmationModal = this._confirmationModal.asReadonly();

  // Transform User entities to UserDisplayData for the UI
  readonly users = computed(() => {
    const domainUsers = this.facadeUsers();

    if (domainUsers.length === 0) {
      return [];
    }

    try {
      const mappedUsers = domainUsers.map((user): UserDisplayData => {
        // Create display name from first and last name
        const displayName = `${user.firstName.value} ${user.lastName.value}`.trim();

        // Create initials from first letters
        const initials = displayName
          .split(' ')
          .map((name) => name.charAt(0).toUpperCase())
          .join('')
          .substring(0, 2);

        // Format dates
        const createdAt = user.createdAt ? user.createdAt.value : '';
        const lastActivity = user.lastActivityAt ? user.lastActivityAt.value : undefined;
        const lastActivityDisplay = lastActivity
          ? new Date(lastActivity).toLocaleDateString()
          : undefined;

        // Create status display
        const status: UserStatusDisplay = {
          value: user.active ? 'active' : 'inactive',
          label: user.active ? 'Activo' : 'Inactivo',
          cssClass: user.active ? 'text-success-600 bg-success-50' : 'text-error-600 bg-error-50',
          iconName: user.active ? 'check-circle' : 'x-circle',
          description: user.active ? 'Usuario activo' : 'Usuario inactivo',
        };

        return {
          id: user.id,
          displayName,
          email: user.email.value,
          username: user.username.value,
          role: user.role.name,
          accessLevel: user.role.accessLevel,
          status,
          initials,
          lastActivity,
          lastActivityDisplay,
          createdAt,
          isActive: user.active,
          canEdit: user.role.accessLevel <= 2,
          canDelete: user.role.accessLevel == 1,
        };
      });

      return mappedUsers;
    } catch (error) {
      console.error('❌ users-list.component: Error mapping users:', error);
      return [];
    }
  });

  // Apply client-side filtering and sorting
  readonly filteredUsers = computed(() => {
    const users = this.users();
    const criteria = this._searchCriteria();

    let filtered = [...users];

    // Apply search filter
    if (criteria.searchTerm.trim()) {
      const searchTerm = criteria.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (user) =>
          user.displayName.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          user.username.toLowerCase().includes(searchTerm) ||
          user.role.toLowerCase().includes(searchTerm)
      );
    }

    // Apply status filter
    if (criteria.statusFilter !== 'all') {
      filtered = filtered.filter((user) => user.status.value === criteria.statusFilter);
    }

    // Apply role filter
    if (criteria.roleFilter && criteria.roleFilter !== '') {
      filtered = filtered.filter((user) => user.role.toLowerCase() === criteria.roleFilter!.toLowerCase());
    }

    return filtered;
  });

  readonly sortedUsers = computed(() => {
    const filtered = this.filteredUsers();
    const sortConfig = this._sortConfig();

    if (!sortConfig.field) {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      const aValue = this.getSortValue(a, sortConfig.field);
      const bValue = this.getSortValue(b, sortConfig.field);

      let comparison = 0;
      if (aValue < bValue) {
        comparison = -1;
      } else if (aValue > bValue) {
        comparison = 1;
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  });

  // Computed pagination properties
  readonly totalFilteredItems = computed(() => this.sortedUsers().length);

  readonly totalPages = computed(() => {
    const totalItems = this.totalFilteredItems();
    const pageSize = this._paginationConfig().pageSize;
    return Math.ceil(totalItems / pageSize);
  });

  readonly paginatedUsers = computed(() => {
    const users = this.sortedUsers();
    const config = this._paginationConfig();
    const startIndex = (config.currentPage - 1) * config.pageSize;
    const endIndex = startIndex + config.pageSize;
    return users.slice(startIndex, endIndex);
  });

  // Updated pagination configuration that reflects filtered data
  readonly dynamicPaginationConfig = computed((): PaginationConfig => {
    const baseConfig = this._paginationConfig();
    const totalItems = this.totalFilteredItems();
    const totalPages = this.totalPages();
    
    return {
      ...baseConfig,
      totalItems,
      totalPages,
    };
  });

  // ============================================================================
  // Component Lifecycle
  // ============================================================================

  ngOnInit(): void {
    // Set up breadcrumbs for the users list page
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'Gestión de Usuarios', route: '/users', isLast: true },
    ]);

    // Load users and roles data
    this.loadUsers();
    this.loadRoles();
  }

  // ============================================================================
  // User Actions Event Handling
  // ============================================================================

  /**
   * Handle user action events from the table component
   */
  onUserAction(event: UserActionEvent): void {
    const { action, user } = event;

    switch (action) {
      case 'view':
        this.viewUser(user.id);
        break;
      case 'edit':
        this.editUser(user.id);
        break;
      case 'delete':
        this.deleteUser(user);
        break;
      case 'activate':
        this.activateUser(user);
        break;
      case 'deactivate':
        this.deactivateUser(user);
        break;
      case 'resetPassword':
        this.resetUserPassword();
        break;
    }
  }

  /**
   * Handle user selection changes for bulk operations
   */
  onSelectionChange(event: UserSelectionEvent): void {
    this._selectedUsers.set(event.selectedUsers);
  }

  /**
   * Handle sort configuration changes
   */
  onSortChange(event: SortChangeEvent): void {
    this._sortConfig.set({
      field: event.field as string,
      direction: event.direction,
    });

    // Update search criteria for consistency
    this._searchCriteria.update((criteria) => ({
      ...criteria,
      sortBy: event.field as UserSortField,
      sortDirection: event.direction,
    }));
  }

  /**
   * Handle filter changes
   */
  onFilterChange(event: FilterChangeEvent): void {
    this._searchCriteria.set(event.filters);

    // Update sort config if sort fields are present
    if (event.filters.sortBy && event.filters.sortDirection) {
      this._sortConfig.set({
        field: event.filters.sortBy,
        direction: event.filters.sortDirection,
      });
    }

    // Reset pagination when filters change
    this._paginationConfig.update((config) => ({
      ...config,
      currentPage: 1,
    }));
  }

  /**
   * Handle filters reset
   */
  onFiltersReset(): void {
    this._searchCriteria.set({
      searchTerm: '',
      statusFilter: 'all',
      roleFilter: '',
      sortBy: 'name',
      sortDirection: 'asc',
    });

    this._sortConfig.set({
      field: 'name',
      direction: 'asc',
    });

    this._paginationConfig.update((config) => ({
      ...config,
      currentPage: 1,
    }));
  }

  /**
   * Handle bulk actions
   */
  onBulkAction(event: BulkActionEvent): void {
    const selectedUsers = this._selectedUsers();

    if (selectedUsers.length === 0) {
      return;
    }

    switch (event.action) {
      case 'activate':
        this.showConfirmationModal(
          {
            title: 'Activate Users',
            description: `Are you sure you want to activate ${selectedUsers.length} user(s)?`,
            iconVariant: 'info',
            actions: [
              { label: 'Cancel', variant: 'secondary', action: 'cancel' },
              { label: 'Activate', variant: 'primary', action: 'confirm' },
            ],
          },
          { action: 'bulk-activate', users: selectedUsers }
        );
        break;
      case 'deactivate':
        this.showConfirmationModal(
          {
            title: 'Deactivate Users',
            description: `Are you sure you want to deactivate ${selectedUsers.length} user(s)?`,
            iconVariant: 'warning',
            actions: [
              { label: 'Cancel', variant: 'secondary', action: 'cancel' },
              { label: 'Deactivate', variant: 'danger', action: 'confirm' },
            ],
          },
          { action: 'bulk-deactivate', users: selectedUsers }
        );
        break;
      case 'delete':
        this.showConfirmationModal(
          {
            title: 'Delete Users',
            description: `Are you sure you want to permanently delete ${selectedUsers.length} user(s)? This action cannot be undone.`,
            iconVariant: 'error',
            actions: [
              { label: 'Cancel', variant: 'secondary', action: 'cancel' },
              { label: 'Delete', variant: 'danger', action: 'confirm' },
            ],
          },
          { action: 'bulk-delete', users: selectedUsers }
        );
        break;
    }
  }

  /**
   * Clear selection
   */
  onClearSelection(): void {
    this._selectedUsers.set([]);
  }

  /**
   * Handle pagination changes
   */
  onPageChange(event: PageChangeEvent): void {
    const maxPages = this.totalPages();
    const requestedPage = Math.max(1, Math.min(event.page, maxPages));
    
    this._paginationConfig.update((config) => ({
      ...config,
      currentPage: requestedPage,
      pageSize: event.pageSize,
    }));
  }

  onPageSizeChange(event: PageSizeChangeEvent): void {
    this._paginationConfig.update((config) => ({
      ...config,
      pageSize: event.pageSize,
      currentPage: 1, // Reset to page 1 when page size changes
    }));
  }

  /**
   * Handle confirmation modal actions
   */
  onConfirmationAction(event: ModalActionEvent): void {
    const modalContext = this._confirmationModal().context;

    if (event.action === 'confirm' && modalContext) {
      this.executeConfirmedAction(modalContext);
    }

    // Hide modal
    this._confirmationModal.update((modal) => ({
      ...modal,
      visible: false,
    }));
  }

  /**
   * Handle create user button click
   */
  onCreateUser(): void {
    this.router.navigate(['/users', 'create']);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Load users with current search criteria (public method for template)
   */
  loadUsers(): void {
    // Use listUsers method from the facade
    this.usersFacade.listUsers();
  }

  /**
   * Load available roles for filtering
   */
  loadRoles(): void {
    // Use listRoles method from the facade
    this.rolesFacade.loadRoles();
  }

  /**
   * Navigate to user detail view
   */
  private viewUser(userId: number): void {
    this.router.navigate(['/users', userId]);
  }

  /**
   * Navigate to user edit view
   */
  private editUser(userId: number): void {
    this.router.navigate(['/users', 'edit', userId]);
  }

  /**
   * Delete user with confirmation
   */
  private deleteUser(user: UserDisplayData): void {
    this.showConfirmationModal(
      {
        title: 'Delete User',
        description: `Are you sure you want to delete ${user.displayName}? This action cannot be undone.`,
        iconVariant: 'error',
        actions: [
          { label: 'Cancel', variant: 'secondary', action: 'cancel' },
          { label: 'Delete', variant: 'danger', action: 'confirm' },
        ],
      },
      { action: 'delete-user', userId: user.id }
    );
  }

  /**
   * Activate user
   */
  private activateUser(user: UserDisplayData): void {
    this.usersFacade.activateUser(user.id);
  }

  /**
   * Deactivate user
   */
  private deactivateUser(user: UserDisplayData): void {
    this.usersFacade.deactivateUser(user.id);
  }

  /**
   * Reset user password - not available in current facade
   */
  private resetUserPassword(): void {
    // This method is not available in the current UsersFacade
    // Showing a message for now
    alert('La funcionalidad de restablecer contraseña no está disponible actualmente.');
  }

  /**
   * Show confirmation modal
   */
  private showConfirmationModal(config: Partial<ModalConfig>, context?: any): void {
    this._confirmationModal.set({
      visible: true,
      loading: false,
      context,
      config: {
        ...config,
        size: config.size || 'md',
        closable: config.closable ?? true,
        closeOnBackdrop: config.closeOnBackdrop ?? true,
        closeOnEscape: config.closeOnEscape ?? true,
        actions: config.actions || [],
      } as ModalConfig,
    });
  }

  /**
   * Execute confirmed action
   */
  private executeConfirmedAction(context: any): void {
    this._confirmationModal.update((modal) => ({
      ...modal,
      loading: true,
    }));

    try {
      switch (context.action) {
        case 'delete-user':
          this.usersFacade.deleteUser(context.userId);
          break;
        case 'bulk-activate':
          context.users.forEach((user: UserDisplayData) => {
            this.usersFacade.activateUser(user.id);
          });
          this._selectedUsers.set([]);
          break;
        case 'bulk-deactivate':
          context.users.forEach((user: UserDisplayData) => {
            this.usersFacade.deactivateUser(user.id);
          });
          this._selectedUsers.set([]);
          break;
        case 'bulk-delete':
          context.users.forEach((user: UserDisplayData) => {
            this.usersFacade.deleteUser(user.id);
          });
          this._selectedUsers.set([]);
          break;
      }
    } finally {
      this._confirmationModal.update((modal) => ({
        ...modal,
        loading: false,
      }));
    }
  }

  /**
   * Close confirmation modal
   */
  private closeModal(): void {
    this._confirmationModal.set({
      visible: false,
      loading: false,
      context: null,
      config: {
        size: 'md',
        title: '',
        description: '',
        closable: true,
        closeOnBackdrop: true,
        closeOnEscape: true,
        actions: [],
      },
    });
  }

  /**
   * Get sort value for comparison
   */
  private getSortValue(user: UserDisplayData, field: string): any {
    switch (field) {
      case 'displayName':
        return user.displayName.toLowerCase();
      case 'email':
        return user.email.toLowerCase();
      case 'username':
        return user.username.toLowerCase();
      case 'role':
        return user.role.toLowerCase();
      case 'createdAt':
        return new Date(user.createdAt || 0).getTime();
      case 'lastActivity':
        return user.lastActivity ? new Date(user.lastActivity).getTime() : 0;
      default:
        return '';
    }
  }
}
