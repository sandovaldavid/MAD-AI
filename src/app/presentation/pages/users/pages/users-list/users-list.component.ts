/**
 * Users List Page Component
 *
 * @description
 * Smart component responsible for managing the users list view with filtering,
 * searching, pagination, and bulk operations. Follows the same patterns as roles-list.
 *
 * @author MAD-AI Development Team
 * @version 2.0.0
 * @since 2024-01-01
 * @layer Presentation
 */

import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Application Layer Imports
import { UsersFacade } from '@application/facades/users/user.facade';
import { RolesFacade } from '@application/facades/role/role.facade';
import { NotificationsFacade } from '@application/facades/notifications.facade';

// UI Components
import { Icon } from '@presentation/shared/ui/icon/icon';
import { UserTableComponent } from '../../components/user-table/user-table.component';
import { UserCardComponent } from '../../components/user-card/user-card';
import {
  PageHeader,
  type PageHeaderConfig,
} from '@presentation/shared/components/page-header/page-header';
import { ErrorDisplay } from '@presentation/shared/components/error-view/error-display/error-display';
import {
  ConfirmationModal,
  ModalConfig,
  ModalActionEvent,
} from '@presentation/shared/components/confirmation-modal/confirmation-modal';
import { ViewToggleComponent } from '@presentation/shared/components/view-toggle/view-toggle';
import { RoleSkeleton } from '../../../roles/skeleton/role-list-skeleton/role-skeleton';
import { Pagination } from '@presentation/shared/ui/pagination/pagination';

// Types and Services
import type { ErrorDisplayConfig } from '@presentation/shared/types/error-display.types';
import { BreadcrumbService } from '@/app/presentation/services/breadcrumb.service';
import { UserPresentationMapper } from '../../mappers/user-presentation.mapper';
import type { UserDisplayData } from '../../../../models/users/user-ui.types';
import type { UserCardViewModel } from '../../../../models/users/user-display.model';
import type {
  UserActionEvent,
  UserSelectionEvent,
  SortChangeEvent,
} from '../../components/user-table/user-table.component';
import type { UserCardActionEvent } from '../../components/user-card/user-card';

export interface PendingUserAction {
  type: 'delete' | 'activate' | 'deactivate' | 'resetPassword';
  userId: number;
  status?: boolean;
}

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    Icon,
    UserCardComponent,
    UserTableComponent,
    PageHeader,
    ErrorDisplay,
    RoleSkeleton,
    ConfirmationModal,
    ViewToggleComponent,
    Pagination,
  ],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListPage {
  // Confirmation modal state
  confirmVisible = signal(false);
  confirmConfig = signal<ModalConfig | null>(null);
  confirmLoading = signal(false);
  pendingAction: PendingUserAction | null = null;

  private facade = inject(UsersFacade);
  private rolesFacade = inject(RolesFacade);
  private router = inject(Router);
  private breadcrumbService = inject(BreadcrumbService);
  private notifications = inject(NotificationsFacade);

  readonly loading = this.facade.loading;
  readonly users = computed(() => {
    const rawUsers = this.facade.users();
    console.log('🔍 Raw users from facade:', rawUsers);

    const cardUsers = UserPresentationMapper.toCardViewModels(rawUsers, true);
    console.log('📋 Mapped card users:', cardUsers);

    return cardUsers;
  });
  readonly error = this.facade.error;
  readonly availableRoles = this.rolesFacade.roles;
  readonly availableRoleNames = computed(() => this.availableRoles().map((role) => role.name));

  // Filter state
  search = signal('');
  activeFilter = signal<boolean | null>(null);
  roleFilter = signal<string | null>(null);
  activityFilter = signal<string>('');
  viewMode = signal<'cards' | 'table'>('cards');

  // Sorting state
  sortBy = signal<'displayName' | 'email' | 'role' | 'lastActivity' | 'createdAt'>('displayName');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Advanced Filters Animation
  showAdvancedFilters = signal(false);
  advancedFiltersLeaving = signal(false);
  advancedFiltersEntering = signal(false);
  advancedFiltersWrapperOpen = signal(false);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  // Selection state
  private _selectedUsers = signal<UserDisplayData[]>([]);
  readonly selectedUsers = this._selectedUsers.asReadonly();

  // Computed table users (converted from domain entities)
  readonly tableUsers = computed(() => {
    const rawUsers = this.facade.users();
    return UserPresentationMapper.toListViewModels(rawUsers).map((vm) => vm as UserDisplayData);
  });

  // User actions configuration
  readonly userActions = signal({
    canView: true,
    canEdit: true,
    canDelete: true,
    canActivate: true,
    canDeactivate: true,
    canResetPassword: true,
  });

  // Sort configuration for table
  readonly sortConfig = computed(() => ({
    field: this.sortBy(),
    direction: this.sortDirection(),
  }));

  constructor() {
    // Load initial data
    effect(() => {
      // Set breadcrumbs for this page
      this.breadcrumbService.setBreadcrumbs([
        { label: 'Dashboard', route: '/dashboard' },
        { label: 'Usuarios', route: '/users', isLast: true },
      ]);
      this.onRetry();
      this.loadRoles();
    });
  }

  // Computed properties for UI components
  readonly headerConfig = computed(
    (): PageHeaderConfig => ({
      title: 'Usuarios',
      icon: 'user-group',
      description: 'Administra usuarios y sus permisos en el sistema',
      showBreadcrumbs: true,
      actions: [
        {
          label: 'Nuevo Usuario',
          icon: 'user-plus',
          variant: 'primary',
          action: () => this.onCreateUser(),
        },
        {
          label: this.showAdvancedFilters() ? 'Ocultar Filtros' : 'Filtros Avanzados',
          icon: this.showAdvancedFilters() ? 'funnel-slash' : 'funnel',
          variant: 'ghost',
          action: () => this.toggleAdvancedFilters(),
        },
      ],
    })
  );

  // Public method for showing advanced filters panel
  showAdvancedFiltersPanel() {
    return this.showAdvancedFilters() || this.advancedFiltersLeaving();
  }

  // Computed filtered users
  readonly filteredUsers = computed(() => {
    let filtered = this.users();

    // Search filter
    const searchTerm = this.search().toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(
        (user: UserCardViewModel) =>
          user.displayName.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          user.role.toLowerCase().includes(searchTerm)
      );
    }

    // Active filter
    const activeFilterValue = this.activeFilter();
    if (activeFilterValue !== null) {
      filtered = filtered.filter((user: UserCardViewModel) => {
        const isActive = user.status.value === 'active';
        return isActive === activeFilterValue;
      });
    }

    // Role filter
    const roleFilterValue = this.roleFilter();
    if (roleFilterValue) {
      filtered = filtered.filter(
        (user: UserCardViewModel) => user.role.toLowerCase() === roleFilterValue.toLowerCase()
      );
    }

    // Activity filter - UserCardViewModel doesn't have lastActivity, using stats if available
    const activityFilterValue = this.activityFilter();
    if (activityFilterValue && activityFilterValue !== '' && activityFilterValue !== 'all') {
      const now = new Date();
      const filterDate = this.getActivityFilterDate(activityFilterValue, now);

      filtered = filtered.filter((user: UserCardViewModel) => {
        // Use stats.lastLoginDate if available, otherwise include all users
        if (!user.stats?.lastLoginDate) return true; // Include users without activity data
        const userActivity = new Date(user.stats.lastLoginDate);
        return userActivity >= filterDate;
      });
    }

    // Apply sorting
    const sortByValue = this.sortBy();
    const sortDirectionValue = this.sortDirection();

    filtered.sort((a: UserCardViewModel, b: UserCardViewModel) => {
      let aValue: any;
      let bValue: any;

      switch (sortByValue) {
        case 'displayName':
          aValue = a.displayName.toLowerCase();
          bValue = b.displayName.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'role':
          aValue = a.role.toLowerCase();
          bValue = b.role.toLowerCase();
          break;
        // Note: UserCardViewModel doesn't have lastActivity or createdAt
        // These sort options should be disabled in the UI for card view
        default:
          aValue = a.displayName.toLowerCase();
          bValue = b.displayName.toLowerCase();
      }

      if (aValue < bValue) {
        return sortDirectionValue === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirectionValue === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  });

  // Filter statistics
  readonly filterStats = computed(() => {
    const total = this.users().length;
    const filtered = this.filteredUsers().length;
    const active = this.filteredUsers().filter(
      (u: UserCardViewModel) => u.status.value === 'active'
    ).length;
    const hasFilters =
      this.search() ||
      this.activeFilter() !== null ||
      this.roleFilter() !== null ||
      this.activityFilter() !== '';

    return { total, filtered, active, hasFilters };
  });

  // Pagination
  readonly totalPages = computed(() => {
    return Math.ceil(this.filteredUsers().length / this.pageSize());
  });

  readonly paginatedUsers = computed(() => {
    const users = this.filteredUsers();
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return users.slice(start, end);
  });

  readonly dynamicPaginationConfig = computed(() => ({
    currentPage: this.currentPage(),
    totalPages: this.totalPages(),
    totalItems: this.filteredUsers().length,
    pageSize: this.pageSize(),
    pageSizeOptions: [5, 10, 25, 50, 100],
    showPageSizeSelector: true,
    showPageInfo: true,
    maxVisiblePages: 7,
  }));

  readonly errorConfig = computed(
    (): ErrorDisplayConfig => ({
      type: 'generic',
      severity: 'error',
      title: 'Failed to load users',
      message: this.facade.error() || 'Unable to fetch users at this time.',
      actions: [
        {
          label: 'Try Again',
          style: 'primary',
          action: () => this.onRetry(),
        },
      ],
    })
  );

  // Event Handlers
  onRetry() {
    this.facade.listUsers();
  }

  onCreateUser() {
    this.router.navigate(['/users/new']);
  }

  onViewUser(id: number) {
    this.router.navigate(['/users', id]);
  }

  onEditUser(id: number) {
    this.router.navigate(['/users', id, 'edit']);
  }

  onToggleActive(userId: number, isActive: boolean) {
    this.pendingAction = {
      type: isActive ? 'deactivate' : 'activate',
      userId,
      status: !isActive,
    };

    this.confirmConfig.set({
      title: isActive ? 'Desactivar Usuario' : 'Activar Usuario',
      description: `¿Estás seguro que deseas ${isActive ? 'desactivar' : 'activar'} este usuario?`,
      iconVariant: isActive ? 'warning' : 'success',
      actions: [
        { label: 'Cancelar', variant: 'secondary', action: 'cancel' },
        {
          label: isActive ? 'Desactivar' : 'Activar',
          variant: isActive ? 'danger' : 'primary',
          action: 'confirm',
        },
      ],
    });
    this.confirmVisible.set(true);
  }

  onDelete(userId: number) {
    this.pendingAction = { type: 'delete', userId };
    this.confirmConfig.set({
      title: 'Eliminar Usuario',
      description: `¿Estás seguro que deseas eliminar este usuario? Esta acción no se puede deshacer.`,
      iconVariant: 'error',
      actions: [
        { label: 'Cancelar', variant: 'secondary', action: 'cancel' },
        { label: 'Eliminar', variant: 'danger', action: 'confirm' },
      ],
    });
    this.confirmVisible.set(true);
  }

  onUserAction(event: UserActionEvent | UserCardActionEvent): void {
    const { action, user } = event;

    switch (action) {
      case 'view':
        this.onViewUser(user.id);
        break;
      case 'edit':
        this.onEditUser(user.id);
        break;
      case 'select':
        // Handle card selection if needed
        break;
      case 'delete':
        this.onDelete(user.id);
        break;
      case 'activate':
        this.onToggleActive(user.id, 'status' in user ? user.status.value === 'active' : false);
        break;
      case 'deactivate':
        this.onToggleActive(user.id, 'status' in user ? user.status.value === 'active' : false);
        break;
      case 'resetPassword':
        this.onResetPassword(user.id);
        break;
    }
  }

  onSelectionChange(event: UserSelectionEvent): void {
    this._selectedUsers.set(event.selectedUsers);
  }

  onSortChange(event: SortChangeEvent): void {
    this.sortBy.set(event.field as any);
    this.sortDirection.set(event.direction);
  }

  onPageChange(event: { page: number; pageSize: number }): void {
    this.currentPage.set(event.page);
    this.pageSize.set(event.pageSize);
  }

  onPageSizeChange(event: { pageSize: number }): void {
    this.pageSize.set(event.pageSize);
    this.currentPage.set(1);
  }

  onBulkAction(
    event:
      | { action: string; users: UserCardViewModel[] }
      | { action: string; userIds: number[] }
      | { action: string; users: UserDisplayData[] }
  ) {
    // Handle bulk actions similar to roles-list
    const userIds = 'users' in event ? event.users.map((u) => u.id) : event.userIds;

    // Handle export actions
    if (event.action.startsWith('export-')) {
      this.onExportUsers(event.action, userIds);
      return;
    }

    switch (event.action) {
      case 'activate':
        userIds.forEach((id) => this.facade.activateUser(id));
        break;
      case 'deactivate':
        userIds.forEach((id) => this.facade.deactivateUser(id));
        break;
      case 'delete':
        userIds.forEach((id) => this.facade.deleteUser(id));
        break;
    }
    this._selectedUsers.set([]);
  }

  onConfirmModalAction(event: ModalActionEvent) {
    if (!this.pendingAction) {
      this.confirmVisible.set(false);
      return;
    }

    if (event.action === 'confirm') {
      this.confirmLoading.set(true);
      const { type, userId } = this.pendingAction;

      if (type === 'delete') {
        this.facade
          .deleteUser(userId)
          .then(() => {
            this.notifications.success(
              'Usuario eliminado',
              'El usuario ha sido eliminado correctamente.'
            );
          })
          .catch((error) => {
            this.notifications.notificationError(
              'Error al eliminar usuario',
              typeof error === 'string' ? error : 'No se pudo eliminar el usuario.'
            );
          })
          .finally(() => {
            this.confirmLoading.set(false);
            this.confirmVisible.set(false);
            this.pendingAction = null;
          });
      } else if (type === 'activate') {
        this.facade
          .activateUser(userId)
          .then(() => {
            this.notifications.success(
              'Usuario activado',
              'El usuario ha sido activado correctamente.'
            );
          })
          .catch((error) => {
            this.notifications.notificationError(
              'Error al activar usuario',
              typeof error === 'string' ? error : 'No se pudo activar el usuario.'
            );
          })
          .finally(() => {
            this.confirmLoading.set(false);
            this.confirmVisible.set(false);
            this.pendingAction = null;
          });
      } else if (type === 'deactivate') {
        this.facade
          .deactivateUser(userId)
          .then(() => {
            this.notifications.success(
              'Usuario desactivado',
              'El usuario ha sido desactivado correctamente.'
            );
          })
          .catch((error) => {
            this.notifications.notificationError(
              'Error al desactivar usuario',
              typeof error === 'string' ? error : 'No se pudo desactivar el usuario.'
            );
          })
          .finally(() => {
            this.confirmLoading.set(false);
            this.confirmVisible.set(false);
            this.pendingAction = null;
          });
      }
    } else {
      this.confirmVisible.set(false);
      this.pendingAction = null;
    }
  }

  // Filter methods
  toggleAdvancedFilters() {
    if (this.showAdvancedFilters()) {
      // Animation de salida
      this.advancedFiltersLeaving.set(true);
      this.showAdvancedFilters.set(false);
      this.advancedFiltersWrapperOpen.set(false);
      setTimeout(() => {
        this.advancedFiltersLeaving.set(false);
      }, 200);
    } else {
      this.showAdvancedFilters.set(true);
      this.advancedFiltersEntering.set(true);
      setTimeout(() => {
        this.advancedFiltersEntering.set(false);
        this.advancedFiltersWrapperOpen.set(true);
      }, 10);
    }
  }

  updateSearch(value: string) {
    this.search.set(value);
    this.currentPage.set(1);
    if (value) {
      this.notifications.info('Filtro aplicado', `Filtro de búsqueda: "${value}"`);
    }
  }

  updateActiveFilter(value: boolean | null) {
    this.activeFilter.set(value);
    this.currentPage.set(1);
    if (value !== null) {
      this.notifications.info(
        'Filtro aplicado',
        `Filtro de estado: ${value ? 'Activos' : 'Inactivos'}`
      );
    }
  }

  updateRoleFilter(value: string | null) {
    this.roleFilter.set(value);
    this.currentPage.set(1);
    if (value) {
      this.notifications.info('Filtro aplicado', `Filtro de rol: ${value}`);
    }
  }

  updateActivityFilter(value: string) {
    this.activityFilter.set(value);
    this.currentPage.set(1);
    if (value) {
      this.notifications.info(
        'Filtro aplicado',
        `Filtro de actividad: ${this.getActivityLabel(value)}`
      );
    }
  }

  updateSort(
    sortBy: 'displayName' | 'email' | 'role' | 'lastActivity' | 'createdAt',
    direction?: 'asc' | 'desc'
  ) {
    this.sortBy.set(sortBy as 'displayName' | 'email' | 'role');
    if (direction) {
      this.sortDirection.set(direction);
    } else {
      // Toggle direction if same column
      this.sortDirection.update((current) => (current === 'asc' ? 'desc' : 'asc'));
    }
  }

  clearAllFilters() {
    this.search.set('');
    this.activeFilter.set(null);
    this.roleFilter.set(null);
    this.activityFilter.set('');
    this.sortBy.set('displayName');
    this.sortDirection.set('asc');
    this.currentPage.set(1);
  }

  // Helper methods
  getSortOptions() {
    return [
      { value: 'displayName', label: 'Nombre' },
      { value: 'email', label: 'Email' },
      { value: 'role', label: 'Rol' },
      // Note: UserCardViewModel doesn't support sorting by lastActivity or createdAt
    ];
  }

  getTableActions() {
    return ['activate', 'deactivate', 'delete'];
  }

  private loadRoles(): void {
    this.rolesFacade.loadRoles();
  }

  private onResetPassword(userId: number): void {
    this.pendingAction = { type: 'resetPassword', userId };
    this.confirmConfig.set({
      title: 'Restablecer Contraseña',
      description: `¿Estás seguro que deseas restablecer la contraseña de este usuario?`,
      iconVariant: 'warning',
      actions: [
        { label: 'Cancelar', variant: 'secondary', action: 'cancel' },
        { label: 'Restablecer', variant: 'primary', action: 'confirm' },
      ],
    });
    this.confirmVisible.set(true);
  }

  private getActivityFilterDate(filter: string, now: Date): Date {
    switch (filter) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return weekAgo;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        return monthAgo;
      case '3months':
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return threeMonthsAgo;
      default:
        return new Date(0);
    }
  }

  private getActivityLabel(filter: string): string {
    switch (filter) {
      case 'today':
        return 'Hoy';
      case 'week':
        return 'Esta semana';
      case 'month':
        return 'Este mes';
      case '3months':
        return 'Últimos 3 meses';
      default:
        return 'Cualquier momento';
    }
  }

  /**
   * Handle export actions for selected users
   */
  private onExportUsers(action: string, userIds: number[]): void {
    const format = action.replace('export-', '') as 'pdf' | 'csv' | 'json' | 'excel';

    if (userIds.length === 0) {
      this.notifications.warning('Sin selección', 'Selecciona al menos un usuario para exportar.');
      return;
    }

    // Export selected users with the specified format
    this.facade
      .exportUsers(userIds, { format })
      .then(() => {
        this.notifications.success(
          'Exportación exitosa',
          `Usuarios exportados en formato ${format.toUpperCase()}`
        );

        // Clear selection after successful export
        this._selectedUsers.set([]);
      })
      .catch((error) => {
        const errorMessage =
          error?.message ||
          (typeof error === 'string' ? error : 'No se pudo exportar los usuarios.');

        this.notifications.notificationError('Error de exportación', errorMessage);
      });
  }

  /**
   * Format date for relative display (e.g., "Hace 2 días")
   */
  private formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays === 1 ? '' : 's'}`;
    if (diffDays < 30)
      return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) === 1 ? '' : 's'}`;
    if (diffDays < 365)
      return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) === 1 ? '' : 'es'}`;

    return date.toLocaleDateString();
  }
}
