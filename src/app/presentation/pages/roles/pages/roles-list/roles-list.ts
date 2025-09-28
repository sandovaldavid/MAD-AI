import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RolesFacade } from '@application/facades/role';
import { ROLE_ACCESS_LEVEL_CONFIG } from '../../../../models/roles/accesLevel.models.js';
import { NotificationsFacade } from '@application/facades/notifications.facade';
import { Icon } from '@presentation/shared/ui/icon/icon';
import { RoleCard } from '../../components/role-card/role-card';
import { RoleTable } from '../../components/role-table/role-table';
import {
  PageHeader,
  type PageHeaderConfig,
} from '@presentation/shared/components/page-header/page-header';
import { ErrorDisplay } from '@presentation/shared/components/error-view/error-display/error-display';
import { type RoleCardView, type RoleStatus } from '../../../../models/roles/role.models';
import {
  ConfirmationModal,
  ModalConfig,
  ModalActionEvent,
} from '@presentation/shared/components/confirmation-modal/confirmation-modal';
import { ViewToggleComponent } from '@presentation/shared/components/view-toggle/view-toggle';
import { RoleSkeleton } from '../../skeleton/role-list-skeleton/role-skeleton';
import type { ErrorDisplayConfig } from '@presentation/shared/types/error-display.types';
import { BreadcrumbService } from '@/app/presentation/services/breadcrumb.service';
import type { RoleSummary } from '@/app/application/mappers/role.mapper';
import type { RoleExportConfig } from '@/app/application/types/roles/role-export.types';

export interface PendingRoleAction {
  type: 'delete' | 'activate' | 'deactivate';
  roleId: number;
  status?: boolean;
}

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [
    CommonModule,
    Icon,
    RoleCard,
    RoleTable,
    PageHeader,
    ErrorDisplay,
    RoleSkeleton,
    ConfirmationModal,
    ViewToggleComponent,
  ],
  templateUrl: './roles-list.html',
  styleUrl: './roles-list.css',
})
export class RolesList {
  confirmVisible = signal(false);
  confirmConfig = signal<ModalConfig | null>(null);
  confirmLoading = signal(false);
  pendingAction: PendingRoleAction | null = null;
  private facade = inject(RolesFacade);
  private router = inject(Router);
  private breadcrumbService = inject(BreadcrumbService);

  private notifications = inject(NotificationsFacade);

  readonly loading = this.facade.loading;
  readonly roles = computed(() => {
    // Main roles list from facade
    return this.facade.roles();
  });
  readonly error = this.facade.error;

  search = signal('');
  activeFilter = signal<boolean | null>(null);
  viewMode = signal<'cards' | 'table'>('cards');

  // Advanced Filters
  accessLevelFilter = signal<number | null>(null);
  userCountRangeFilter = signal<{ min: number | null; max: number | null }>({
    min: null,
    max: null,
  });
  sortBy = signal<'name' | 'accessLevel' | 'userCount' | 'isActive'>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');
  showAdvancedFilters = signal(false);
  // Animación de salida para filtros avanzados
  advancedFiltersLeaving = signal(false);
  // Animación de entrada para filtros avanzados
  advancedFiltersEntering = signal(false);
  // Animación de wrapper para altura y opacidad
  advancedFiltersWrapperOpen = signal(false);

  // Método público para mostrar el panel (entrada/salida)
  showAdvancedFiltersPanel() {
    return this.showAdvancedFilters() || this.advancedFiltersLeaving();
  }

  constructor() {
    // Load initial data and set breadcrumbs
    effect(() => {
      this.breadcrumbService.setBreadcrumbs([
        { label: 'Dashboard', route: '/dashboard' },
        { label: 'Roles', route: '/roles', isLast: true },
      ]);
      this.onRetry();
    });
  }

  // Computed properties for UI components
  readonly headerConfig = computed(
    (): PageHeaderConfig => ({
      title: 'Roles',
      icon: 'shield',
      description: 'Administra Roles de usuario y permisos',
      showBreadcrumbs: true,
      actions: [
        {
          label: 'Nuevo Rol',
          icon: 'shield-plus',
          variant: 'primary',
          action: () => this.onCreateRole(),
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

  // Computed filtered roles
  readonly filteredRoles = computed(() => {
    // Read all signals first to ensure proper dependency tracking
    const rolesData = this.roles();
    const searchTerm = this.search();
    const activeFilterValue = this.activeFilter();
    const accessLevel = this.accessLevelFilter();
    const userCountRange = this.userCountRangeFilter();
    const sortByValue = this.sortBy();
    const sortDirectionValue = this.sortDirection();

    let filtered = rolesData;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (role: RoleSummary) =>
          role.name.toLowerCase().includes(searchLower) ||
          role.description.toLowerCase().includes(searchLower)
      );
    }

    // Active filter
    if (activeFilterValue !== null) {
      filtered = filtered.filter((role: RoleSummary) => role.isActive === activeFilterValue);
    }

    // Access level filter
    if (accessLevel !== null) {
      filtered = filtered.filter((role: RoleSummary) => role.accessLevel === accessLevel);
    }

    // User count range filter
    if (userCountRange.min !== null || userCountRange.max !== null) {
      filtered = filtered.filter((role: RoleSummary) => {
        const userCount = role.userCount || 0;
        const meetsMin = userCountRange.min === null || userCount >= userCountRange.min;
        const meetsMax = userCountRange.max === null || userCount <= userCountRange.max;
        return meetsMin && meetsMax;
      });
    }

    // Apply sorting (always return a new array for immutability)
    const sorted = [...filtered].sort((a: RoleSummary, b: RoleSummary) => {
      let aValue: any;
      let bValue: any;

      switch (sortByValue) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'accessLevel':
          aValue = a.accessLevel;
          bValue = b.accessLevel;
          break;
        case 'userCount':
          aValue = a.userCount || 0;
          bValue = b.userCount || 0;
          break;
        case 'isActive':
          aValue = a.isActive ? 1 : 0;
          bValue = b.isActive ? 1 : 0;
          break;
      }

      if (aValue < bValue) {
        return sortDirectionValue === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirectionValue === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  });

  // Transform filtered roles to card view format
  readonly rolesForCardView = computed(() => {
    const filtered = this.filteredRoles();
    return filtered.map(
      (role: RoleSummary): RoleCardView => ({
        id: role.id.toString(),
        name: role.name,
        displayName: role.name, // RoleSummary doesn't have displayName
        description: role.description,
        accessLevel: role.accessLevel,
        userCount: role.userCount,
        permissionCount: 0, // RoleSummary doesn't have this information
        status: role.isActive ? 'active' : ('inactive' as RoleStatus),
      })
    );
  });

  // Filter statistics
  readonly filterStats = computed(() => {
    const total = this.roles().length;
    const filtered = this.filteredRoles().length;
    const active = this.filteredRoles().filter((r: RoleSummary) => r.isActive).length;
    const hasFilters =
      this.search() ||
      this.activeFilter() !== null ||
      this.accessLevelFilter() !== null ||
      this.userCountRangeFilter().min !== null ||
      this.userCountRangeFilter().max !== null;

    return { total, filtered, active, hasFilters };
  });

  readonly errorConfig = computed(
    (): ErrorDisplayConfig => ({
      type: 'generic',
      severity: 'error',
      title: 'Failed to load roles',
      message: this.facade.error() || 'Unable to fetch roles at this time.',
      actions: [
        {
          label: 'Try Again',
          style: 'primary',
          action: () => this.onRetry(),
        },
      ],
    })
  );

  onRetry() {
    const params: { search: string; active?: boolean } = {
      search: this.search(),
    };

    const activeFilterValue = this.activeFilter();
    if (activeFilterValue !== null) {
      params.active = activeFilterValue;
    }

    void this.facade.refresh(params);
  }

  onCreateRole() {
    void this.router.navigate(['/roles/new']);
  }

  onViewRole(id: number) {
    void this.router.navigate(['/roles', id]);
  }

  onToggleActive(rid: number, status: boolean) {
    this.pendingAction = { type: status ? 'deactivate' : 'activate', roleId: rid, status };
    this.confirmConfig.set({
      title: status ? 'Desactivar Rol' : 'Activar Rol',
      description: `¿Estás seguro que deseas ${status ? 'desactivar' : 'activar'} el rol con ID ${rid}?`,
      iconVariant: status ? 'warning' : 'success',
      actions: [
        { label: 'Cancelar', variant: 'secondary', action: 'cancel' },
        {
          label: status ? 'Desactivar' : 'Activar',
          variant: status ? 'danger' : 'primary',
          action: 'confirm',
        },
      ],
    });
    this.confirmVisible.set(true);
  }

  onDelete(rid: number) {
    this.pendingAction = { type: 'delete', roleId: rid };
    this.confirmConfig.set({
      title: 'Eliminar Rol',
      description: `¿Estás seguro que deseas eliminar el rol con ID ${rid}? Esta acción no se puede deshacer.`,
      iconVariant: 'error',
      actions: [
        { label: 'Cancelar', variant: 'secondary', action: 'cancel' },
        { label: 'Eliminar', variant: 'danger', action: 'confirm' },
      ],
    });
    this.confirmVisible.set(true);
  }
  onConfirmModalAction(event: ModalActionEvent) {
    if (!this.pendingAction) {
      this.confirmVisible.set(false);
      return;
    }
    if (event.action === 'confirm') {
      this.confirmLoading.set(true);
      const { type, roleId, status } = this.pendingAction;
      if (type === 'delete') {
        void this.facade
          .deleteRole(roleId)
          .then(() => {
            this.notifications.success(
              'Rol eliminado',
              `El rol con ID ${roleId} ha sido eliminado correctamente.`
            );
          })
          .catch((error) => {
            this.notifications.notificationError(
              'Error al eliminar rol',
              typeof error === 'string' ? error : 'No se pudo eliminar el rol.'
            );
          })
          .finally(() => {
            this.confirmLoading.set(false);
            this.confirmVisible.set(false);
            this.pendingAction = null;
          });
      } else if (type === 'activate' || type === 'deactivate') {
        void this.facade
          .toggleRoleActivation(roleId)
          .then(() => {
            this.notifications.success(
              type === 'activate' ? 'Rol activado' : 'Rol desactivado',
              `El rol con ID ${roleId} ha sido ${type === 'activate' ? 'activado' : 'desactivado'} correctamente.`
            );
          })
          .catch((error) => {
            this.notifications.notificationError(
              type === 'activate' ? 'Error al activar rol' : 'Error al desactivar rol',
              typeof error === 'string'
                ? error
                : `No se pudo ${type === 'activate' ? 'activar' : 'desactivar'} el rol.`
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

  // New methods for RoleTable integration
  onEditRole(roleId: number) {
    this.router.navigate(['/roles', roleId, 'edit']);
  }

  onSortChange(event: {
    column: 'name' | 'accessLevel' | 'userCount' | 'isActive';
    direction: 'asc' | 'desc';
  }) {
    this.updateSort(event.column, event.direction);
  }

  onBulkAction(event: { action: string; roleIds: number[] }) {
    switch (event.action) {
      case 'delete':
        event.roleIds.forEach((id) => {
          this.facade
            .deleteRole(id)
            .then(() => {
              this.notifications.success(
                'Rol eliminado',
                `El rol con ID ${id} ha sido eliminado correctamente.`
              );
            })
            .catch((error) => {
              this.notifications.notificationError(
                'Error al eliminar rol',
                typeof error === 'string' ? error : 'No se pudo eliminar el rol.'
              );
            });
        });
        break;
      case 'activate':
        event.roleIds.forEach((id) => {
          this.facade
            .activateRole(id)
            .then(() => {
              this.notifications.success(
                'Rol activado',
                `El rol con ID ${id} ha sido activado correctamente.`
              );
            })
            .catch((error) => {
              this.notifications.notificationError(
                'Error al activar rol',
                typeof error === 'string' ? error : 'No se pudo activar el rol.'
              );
            });
        });
        break;
      case 'deactivate':
        event.roleIds.forEach((id) => {
          this.facade
            .deactivateRole(id)
            .then(() => {
              this.notifications.success(
                'Rol desactivado',
                `El rol con ID ${id} ha sido desactivado correctamente.`
              );
            })
            .catch((error) => {
              this.notifications.notificationError(
                'Error al desactivar rol',
                typeof error === 'string' ? error : 'No se pudo desactivar el rol.'
              );
            });
        });
        break;
      case 'export':
        // Using proper RoleExportOptions interface
        this.onExportRoles({
          format: 'json',
          roleIds: event.roleIds,
          includeDescription: true,
          includeUserCount: true,
        });
        break;
    }
  }

  async onExportRoles(event: {
    format: string;
    roleIds: number[];
    includeDescription?: boolean;
    includeUserCount?: boolean;
  }): Promise<void> {
    if (!event.roleIds || event.roleIds.length === 0) {
      await this.notifications.warning(
        'Exportación sin roles',
        'No hay roles seleccionados para exportar.'
      );
      return;
    }
    try {
      // Create proper export options using RoleExportConfig interface
      const exportOptions: Partial<RoleExportConfig> = {
        format: event.format.toLowerCase() as 'pdf' | 'csv' | 'json' | 'xlsx',
        includeDescription: event.includeDescription ?? true,
        includeUserCount: event.includeUserCount ?? true,
      };

      await this.facade.exportRoles(event.roleIds, exportOptions);
      this.notifications.success(
        'Exportación exitosa',
        `Se exportaron ${event.roleIds.length} roles en formato ${event.format.toUpperCase()}.`
      );
    } catch (error) {
      // Always serialize error for SSR/prerendering
      const errorStr =
        typeof error === 'object'
          ? JSON.stringify(error, Object.getOwnPropertyNames(error))
          : String(error);
      console.error('Export failed:', errorStr);
      this.notifications.notificationError(
        'Error en exportación',
        errorStr || 'No se pudo exportar los roles.'
      );
    }
  }

  toggleAdvancedFilters() {
    if (this.showAdvancedFilters()) {
      // Animación de salida
      this.advancedFiltersLeaving.set(true);
      this.showAdvancedFilters.set(false);
      this.advancedFiltersWrapperOpen.set(false);
      setTimeout(() => {
        this.advancedFiltersLeaving.set(false);
      }, 200); // Duración igual a la transición CSS
    } else {
      this.showAdvancedFilters.set(true);
      this.advancedFiltersEntering.set(true);
      setTimeout(() => {
        this.advancedFiltersEntering.set(false);
        this.advancedFiltersWrapperOpen.set(true);
      }, 10); // Pequeño delay para disparar la transición
    }
  }

  // Debounced search update to avoid excessive notifications and filtering
  private searchDebounceTimeout: any = null;
  updateSearch(value: string) {
    // Debounce search input (300ms)
    if (this.searchDebounceTimeout) {
      clearTimeout(this.searchDebounceTimeout);
    }
    this.searchDebounceTimeout = setTimeout(() => {
      this.search.set(value);
      // Do NOT show notification for search filter to avoid notification spam
    }, 300);
  }

  updateActiveFilter(value: boolean | null) {
    this.activeFilter.set(value);
    if (value !== null) {
      this.notifications.info(
        'Filtro aplicado',
        `Filtro de estado: ${value ? 'Activos' : 'Inactivos'}`
      );
    }
  }

  updateAccessLevelFilter(value: number | null) {
    this.accessLevelFilter.set(value);
    if (value !== null) {
      this.notifications.info('Filtro aplicado', `Filtro de nivel de acceso: Nivel ${value}`);
    }
  }

  updateUserCountRange(min: number | null, max: number | null) {
    this.userCountRangeFilter.set({ min, max });
  }

  updateSort(
    sortBy: 'name' | 'accessLevel' | 'userCount' | 'isActive',
    direction?: 'asc' | 'desc'
  ) {
    this.sortBy.set(sortBy);
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
    this.accessLevelFilter.set(null);
    this.userCountRangeFilter.set({ min: null, max: null });
    this.sortBy.set('name');
    this.sortDirection.set('asc');
  }

  // Get available filter options using config
  getAccessLevelOptions() {
    return Object.entries(ROLE_ACCESS_LEVEL_CONFIG).map(([key, info]) => ({
      value: Number(key),
      label: `Nivel ${key} - ${info.label}`,
    }));
  }

  getSortOptions() {
    return [
      { value: 'name', label: 'Nombre' },
      { value: 'accessLevel', label: 'Nivel de Acceso' },
      { value: 'userCount', label: 'Cantidad de Usuarios' },
      { value: 'isActive', label: 'Estado' },
    ];
  }
}
