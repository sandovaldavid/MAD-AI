import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RolesFacade } from '@application/facades/role';
import {
  PageHeader,
  type PageHeaderConfig,
} from '@presentation/shared/components/page-header/page-header';
import { RoleFormComponent } from '../../forms/role-form/role-form';
import { BreadcrumbService } from '@/app/presentation/services/breadcrumb.service';
import {
  mapRoleFormDataToCreateRoleData,
  isValidRoleForCreation,
  type RoleFormData,
} from '../../mappers';

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

  async onRoleCreated(roleData: RoleFormData) {
    try {
      // Validate input before processing
      if (!isValidRoleForCreation(roleData)) {
        console.error('Invalid role data for creation:', roleData);
        return;
      }

      // Use mapper to convert form data to Application layer facade data
      const createData = mapRoleFormDataToCreateRoleData(roleData);

      await this.facade.createRole(createData);

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
