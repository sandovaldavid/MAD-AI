import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RolesFacade } from '@application/facades/roles.facade';
import { PageHeader, type PageHeaderConfig } from '@shared/components/page-header/page-header';
import { RoleFormComponent } from '../../forms/role-form/role-form';
import { BreadcrumbService } from '@core/cross-cutting/ui-state/breadcrumb.service';
import { RoleModel } from '../../models/role.model';
import {
  mapRoleModelToCreateInput,
  isValidRoleForCreation,
} from '../../mappers/role-create.mapper';

@Component({
  selector: 'app-create-role',
  standalone: true,
  imports: [CommonModule, PageHeader, RoleFormComponent],
  templateUrl: './create-role.html',
  styleUrl: './create-role.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateRole {
  private router = inject(Router);
  private breadcrumbService = inject(BreadcrumbService);

  readonly facade = inject(RolesFacade);

  readonly headerConfig = computed(
    (): PageHeaderConfig => ({
      title: 'Crear Nuevo Rol',
      description: 'Define un nuevo rol con permisos específicos para el sistema',
      icon: 'shield-plus',
      showBreadcrumbs: true,
      actions: [],
    })
  );

  constructor() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'Roles', route: '/roles' },
      { label: 'Crear Rol', route: '/roles/new', isLast: true },
    ]);
  }

  async onRoleCreated(roleData: Partial<RoleModel>) {
    try {
      // Validate input before processing
      if (!isValidRoleForCreation(roleData)) {
        console.error('Invalid role data for creation:', roleData);
        return;
      }

      // Use mapper to convert typed model to facade input
      const createInput = mapRoleModelToCreateInput(roleData);

      await this.facade.createRole(createInput);

      // Navigate back to roles list after successful creation
      this.router.navigate(['/roles']);
    } catch (error) {
      console.error('Error creating role:', error);
      // Error handling is already done by the facade through notifications
    }
  }

  onCancel() {
    this.router.navigate(['/roles']);
  }
}
