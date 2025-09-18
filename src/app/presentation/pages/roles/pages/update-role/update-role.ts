import {
  ChangeDetectionStrategy,
  Component,
  inject,
  computed,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RolesFacade } from '@application/facades/role';
import {
  PageHeader,
  type PageHeaderConfig,
} from '@presentation/shared/components/page-header/page-header';
import { RoleFormComponent } from '../../forms/role-form/role-form';
import { ErrorDisplay } from '@presentation/shared/components/error-view/error-display/error-display';
import { BreadcrumbService } from '@/app/presentation/services/breadcrumb.service';
import type { ErrorDisplayConfig } from '@presentation/shared/types/error-display.types';
import type { RoleModel } from '../../models/role.model';
import { RolePresentationMapper } from '../../mappers/role-presentation.mapper';

/**
 * Type for role update form data
 * Includes only the fields that can be updated from the UI
 */
type RoleUpdateData = Pick<RoleModel, 'name' | 'accessLevel' | 'description' | 'isActive'> & {
  canLeadProjects?: boolean;
  isUniquePerTeam?: boolean;
};

@Component({
  selector: 'app-update-role',
  standalone: true,
  imports: [CommonModule, PageHeader, RoleFormComponent, ErrorDisplay],
  templateUrl: './update-role.html',
  styleUrl: './update-role.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateRole {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private breadcrumbService = inject(BreadcrumbService);

  readonly facade = inject(RolesFacade);

  private roleId = signal<number | null>(null);

  readonly currentRole = computed(() => {
    const id = this.roleId();
    return id ? this.facade.roles().find((r) => r.id === id) : null;
  });

  readonly roleModel = computed(() => {
    const role = this.currentRole();
    return role ? RolePresentationMapper.toRoleModel(role) : null;
  });

  readonly headerConfig = computed(
    (): PageHeaderConfig => ({
      title: `Editar Rol: ${this.roleModel()?.displayName || 'Cargando...'}`,
      description: 'Modifica los permisos y configuración del rol',
      icon: 'shield',
      showBreadcrumbs: true,
      actions: [],
    })
  );

  readonly errorConfig = computed(
    (): ErrorDisplayConfig => ({
      type: 'generic',
      severity: 'error',
      title: 'Rol no encontrado',
      message: 'El rol que intentas editar no existe o ha sido eliminado.',
      actions: [
        {
          label: 'Volver a Roles',
          style: 'primary',
          action: () => this.router.navigate(['/roles']),
        },
      ],
    })
  );

  constructor() {
    // Get role ID from route params
    effect(() => {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.roleId.set(+id);
        this.updateBreadcrumbs();
      }
    });

    // Load roles if not already loaded
    effect(() => {
      if (this.facade.roles().length === 0) {
        this.facade.refresh({});
      }
    });
  }

  private updateBreadcrumbs() {
    const role = this.roleModel();
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'Roles', route: '/roles' },
      {
        label: role?.displayName || 'Editar',
        route: `/roles/${this.roleId()}/edit`,
        isLast: true,
      },
    ]);
  }

  async onRoleUpdated(roleData: RoleUpdateData) {
    const roleId = this.roleId();
    if (!roleId) return;

    try {
      await this.facade.updateRole(roleId, roleData);
      this.router.navigate(['/roles', roleId]);
    } catch (error) {
      console.error('Error updating role:', error);
    }
  }

  onCancel() {
    const roleId = this.roleId();
    if (roleId) {
      this.router.navigate(['/roles', roleId]);
    } else {
      this.router.navigate(['/roles']);
    }
  }
}
