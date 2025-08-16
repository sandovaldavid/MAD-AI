import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icon } from '@shared/ui/icon/icon';
import { RoleModel } from '../../models/role.model';
import {
    RoleAccessLevelInfo,
    getRoleAccessLevelInfo,
    getRoleAccessLevelIcon,
} from '../../types/role-colors.type';

@Component({
    selector: 'app-role-card',
    standalone: true,
    imports: [CommonModule, Icon],
    templateUrl: './role-card.html',
    styleUrl: './role-card.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleCard {
    // Inputs
    role = input.required<RoleModel>();
    loading = input<boolean>(false);

    // Outputs
    view = output<number>();
    toggleStatus = output<{ id: number; status: boolean }>();
    delete = output<number>();

    // Event handlers
    onViewRole() {
        this.view.emit(this.role().id);
    }

    onToggleStatus() {
        const role = this.role();
        this.toggleStatus.emit({ id: role.id, status: role.isActive });
    }

    onDeleteRole() {
        this.delete.emit(this.role().id);
    }

    // Helper methods for styling
    getAccessLevelInfo(): RoleAccessLevelInfo {
        return getRoleAccessLevelInfo(this.role().accessLevel);
    }

    getStatusInfo() {
        const isActive = this.role().isActive;
        return {
            label: isActive ? 'Activo' : 'Inactivo',
            icon: isActive ? 'filled/check-circle' : 'filled/x-circle',
            classes: isActive
                ? 'bg-successful-100 text-successful-800 dark:bg-successful-800 dark:text-successful-200'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',
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
