import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icon } from '@presentation/shared/ui/icon/icon';
import { AccessLevelIndicator } from '../access-level-indicator/access-level-indicator';
import {
  RoleCardView,
  getRoleAccessLevelInfo,
  getRoleAccessLevelIcon,
} from '../../../../models/roles/index';

@Component({
  selector: 'app-role-card',
  standalone: true,
  imports: [CommonModule, Icon, AccessLevelIndicator],
  templateUrl: './role-card.html',
  styleUrl: './role-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleCard {
  // Inputs
  role = input.required<RoleCardView>();
  loading = input<boolean>(false);

  // Outputs
  view = output<number>();
  toggleStatus = output<{ id: number; status: boolean }>();
  delete = output<number>();

  // Event handlers
  onViewRole() {
    this.view.emit(Number(this.role().id));
  }

  onToggleStatus() {
    const role = this.role();
    this.toggleStatus.emit({ id: Number(role.id), status: role.status === 'active' });
  }

  onDeleteRole() {
    this.delete.emit(Number(this.role().id));
  }

  // Helper methods for styling
  getAccessLevelInfo() {
    return getRoleAccessLevelInfo(this.role().accessLevel);
  }

  getStatusInfo() {
    const isActive = this.role().status === 'active';
    const levelInfo = this.getAccessLevelInfo();

    return {
      label: isActive ? 'Activo' : 'Inactivo',
      icon: isActive ? 'filled/check-circle' : 'filled/x-circle',
      classes: isActive
        ? 'bg-successful-100 text-successful-800 dark:bg-successful-800 dark:text-successful-100'
        : 'bg-error-100 text-error-800 dark:bg-error-800 dark:text-error-100',
      buttonClasses: isActive
        ? 'text-warning-600 hover:text-warning-700 dark:text-warning-400 dark:hover:text-warning-300'
        : 'text-successful-600 hover:text-successful-700 dark:text-successful-400 dark:hover:text-successful-300',
      buttonTooltip: isActive ? 'Desactivar rol' : 'Activar rol',
    };
  }

  getAccessLevelIcon(): string {
    return getRoleAccessLevelIcon(this.role().accessLevel);
  }

  getUserCountDisplay(): string {
    const count = this.role().userCount || 0;
    if (count === 0) return 'Sin usuarios';
    if (count === 1) return '1 usuario';
    return `${count} usuarios`;
  }
}
