import { Component, ChangeDetectionStrategy, signal, inject, effect } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GetRoleByIdUseCase } from '@application/use-cases/role/get-role-by-id.use-case';
import { RoleModel } from '@domain/models/role/role.model';
import { RoleAccessLevel, ROLE_ACCESS_LEVEL_LABELS } from '@domain/enums/role-access-level.enum';
import { TitleService } from '@core/services/title.service';
import { Button } from '@shared/components/ui/button/button';
import { ShieldIcon } from '../../../icons/shield.icon/shield.icon';
import { IdBadgeIcon } from '../../../icons/id-badge.icon/id-badge.icon';
import { InfoIcon } from '../../../icons/info.icon/info.icon';
import { UserListIcon } from '../../../icons/user-list.icon/user-list.icon';
import { CalendarIcon } from '../../../icons/calendar.icon/calendar.icon';
import { CheckCircleIcon } from '../../../icons/check-circle.icon/check-circle.icon';
import { XCircleIcon } from '../../../icons/x-circle.icon/x-circle.icon';
import { SettingsIcon } from '../../../icons/settings.icon/settings.icon';

@Component({
    selector: 'app-detail-role',
    imports: [
        Button,
        ShieldIcon,
        IdBadgeIcon,
        InfoIcon,
        UserListIcon,
        CalendarIcon,
        CheckCircleIcon,
        XCircleIcon,
        SettingsIcon,
    ],
    templateUrl: './detail-role.html',
    styleUrl: './detail-role.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailRole {
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly getRoleByIdUseCase = inject(GetRoleByIdUseCase);
    private readonly titleService = inject(TitleService);

    // Signals for state management
    protected readonly role = signal<RoleModel | null>(null);
    protected readonly isLoading = signal(true);
    protected readonly error = signal<string | null>(null);
    protected readonly roleId = signal<number | null>(null);

    constructor() {
        // Extract role ID from route parameters
        effect(() => {
            const id = this.route.snapshot.paramMap.get('id');
            if (id) {
                const roleId = parseInt(id, 10);
                if (!isNaN(roleId)) {
                    this.roleId.set(roleId);
                    this.loadRole(roleId);
                } else {
                    this.error.set('ID de rol inválido');
                    this.isLoading.set(false);
                }
            } else {
                this.error.set('ID de rol no encontrado');
                this.isLoading.set(false);
            }
        });

        // Update title when role is loaded
        effect(() => {
            const currentRole = this.role();
            if (currentRole) {
                this.titleService.setTitle(`Detalles del Rol: ${currentRole.name}`);
            }
        });
    }

    private loadRole(id: number): void {
        this.isLoading.set(true);
        this.error.set(null);

        this.getRoleByIdUseCase.execute(id).subscribe({
            next: (role) => {
                this.role.set(role);
                this.isLoading.set(false);
            },
            error: (err) => {
                this.error.set('Error al cargar los detalles del rol');
                this.isLoading.set(false);
                console.error('Error loading role details:', err);
            },
        });
    }

    // Helper methods
    protected getAccessLevelLabel(level: RoleAccessLevel): string {
        return ROLE_ACCESS_LEVEL_LABELS[level] || 'Desconocido';
    }

    protected getAccessLevelBadgeClass(level: RoleAccessLevel): string {
        const badgeClasses = {
            [RoleAccessLevel.ADMINISTRATOR]: 'access-level-admin',
            [RoleAccessLevel.PROJECT_MANAGER]: 'access-level-pm',
            [RoleAccessLevel.TEAM_LEAD]: 'access-level-lead',
            [RoleAccessLevel.DEVELOPER]: 'access-level-dev',
            [RoleAccessLevel.USER]: 'access-level-user',
        };
        return badgeClasses[level] || 'access-level-default';
    }

    protected getStatusBadgeClass(isActive: boolean): string {
        return isActive ? 'status-badge-active' : 'status-badge-inactive';
    }

    protected getStatusText(isActive: boolean): string {
        return isActive ? 'Activo' : 'Inactivo';
    }

    protected formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    // Navigation methods
    protected goBack(): void {
        this.router.navigate(['/users/roles']);
    }

    protected navigateToEdit(): void {
        const id = this.roleId();
        if (id) {
            this.router.navigate(['/users/roles', id, 'edit']);
        }
    }

    protected refresh(): void {
        const id = this.roleId();
        if (id) {
            this.loadRole(id);
        }
    }
}
