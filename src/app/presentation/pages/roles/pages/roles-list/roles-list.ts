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
import { RolesFacade } from '@application/facades/role';
import { Icon } from '@presentation/shared/ui/icon/icon';
import { RoleCard } from '../../components/role-card/role-card';
import { RoleTable } from '../../components/role-table/role-table';
import {
  PageHeader,
  type PageHeaderConfig,
} from '@presentation/shared/components/page-header/page-header';
import { ErrorDisplay } from '@presentation/shared/components/error-view/error-display/error-display';
import { RoleSkeleton } from '../../skeleton/role-list-skeleton/role-skeleton';
import type { ErrorDisplayConfig } from '@presentation/shared/types/error-display.types';
import { BreadcrumbService } from '@/app/presentation/services/breadcrumb.service';
import { RolePresentationMapper } from '../../mappers/role-presentation.mapper';
import { RoleModel } from '../../models/role.model';
import type { RoleExportOptions } from '../../mappers/role-export.mapper';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule, Icon, RoleCard, RoleTable, PageHeader, ErrorDisplay, RoleSkeleton],
  templateUrl: './roles-list.html',
  styleUrl: './roles-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesList {
  private facade = inject(RolesFacade);
  private router = inject(Router);
  private breadcrumbService = inject(BreadcrumbService);

  readonly loading = this.facade.loading;
  readonly roles = computed(() => RolePresentationMapper.toRoleModels(this.facade.roles()));
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

  constructor() {
    // Set breadcrumbs for this page
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'Roles', route: '/roles', isLast: true },
    ]);

    // Load initial data
    effect(() => {
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
    let filtered = this.roles();

    // Search filter
    const searchTerm = this.search().toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(
        (role) =>
          role.name.toLowerCase().includes(searchTerm) ||
          (role.description && role.description.toLowerCase().includes(searchTerm))
      );
    }

    // Active filter
    const activeFilterValue = this.activeFilter();
    if (activeFilterValue !== null) {
      filtered = filtered.filter((role) => role.isActive === activeFilterValue);
    }

    // Access level filter
    const accessLevel = this.accessLevelFilter();
    if (accessLevel !== null) {
      filtered = filtered.filter((role) => role.accessLevel === accessLevel);
    }

    // User count range filter
    const userCountRange = this.userCountRangeFilter();
    if (userCountRange.min !== null || userCountRange.max !== null) {
      filtered = filtered.filter((role) => {
        const userCount = role.userCount || 0;
        const meetsMin = userCountRange.min === null || userCount >= userCountRange.min;
        const meetsMax = userCountRange.max === null || userCount <= userCountRange.max;
        return meetsMin && meetsMax;
      });
    }

    // Apply sorting
    const sortByValue = this.sortBy();
    const sortDirectionValue = this.sortDirection();

    filtered.sort((a, b) => {
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

    return filtered;
  });

  // Filter statistics
  readonly filterStats = computed(() => {
    const total = this.roles().length;
    const filtered = this.filteredRoles().length;
    const active = this.filteredRoles().filter((r) => r.isActive).length;
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
    void this.facade.toggleRoleActivation(rid);
    console.log('Toggle active for role:', rid);
    console.log('Status Role:', status);
  }

  onDelete(rid: number) {
    console.log('Role Id to Delete: ', rid);
    void this.facade.deleteRole(rid);
  }

  // New methods for RoleTable integration
  onEditRole(roleId: number) {
    this.router.navigate(['/roles', roleId, 'edit']);
  }

  onBulkAction(event: { action: string; roleIds: number[] }) {
    switch (event.action) {
      case 'delete':
        event.roleIds.forEach((id) => this.facade.deleteRole(id));
        break;
      case 'activate':
        event.roleIds.forEach((id) => this.facade.activateRole(id));
        break;
      case 'deactivate':
        event.roleIds.forEach((id) => this.facade.deactivateRole(id));
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
  }) {
    try {
      // Create proper export options using RoleExportOptions interface
      const exportOptions: Partial<RoleExportOptions> = {
        format: event.format.toLowerCase() as 'pdf' | 'csv' | 'json',
        includeDescription: event.includeDescription ?? true,
        includeUserCount: event.includeUserCount ?? true,
        includeId: true,
        includeAccessLevel: true,
        includeStatus: true,
        customTitle: `Roles Export - ${new Date().toLocaleDateString()}`,
      };

      await this.facade.exportRoles(event.roleIds, exportOptions);
    } catch (error) {
      // Always serialize error for SSR/prerendering
      const errorStr =
        typeof error === 'object'
          ? JSON.stringify(error, Object.getOwnPropertyNames(error))
          : String(error);
      console.error('Export failed:', errorStr);
    }
  }

  // View mode toggle
  setViewMode(mode: 'cards' | 'table') {
    this.viewMode.set(mode);
  }

  // Advanced filters methods
  toggleAdvancedFilters() {
    this.showAdvancedFilters.update((show) => !show);
  }

  updateSearch(value: string) {
    this.search.set(value);
  }

  updateActiveFilter(value: boolean | null) {
    this.activeFilter.set(value);
  }

  updateAccessLevelFilter(value: number | null) {
    this.accessLevelFilter.set(value);
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

  // Get available filter options
  getAccessLevelOptions() {
    return [
      { value: 1, label: 'Nivel 1 - System Administrator' },
      { value: 2, label: 'Nivel 2 - Project Manager' },
      { value: 3, label: 'Nivel 3 - Senior User' },
      { value: 4, label: 'Nivel 4 - Standard User' },
      { value: 5, label: 'Nivel 5 - Basic User' },
    ];
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
