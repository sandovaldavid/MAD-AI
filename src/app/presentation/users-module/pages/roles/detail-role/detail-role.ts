import {
    Component,
    ChangeDetectionStrategy,
    signal,
    inject,
    effect,
    computed,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GetRoleByIdUseCase } from '@application/use-cases/role/get-role-by-id.use-case';
import { RoleEntity } from '@domain/entities/role.entity';
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
    readonly role = signal<RoleEntity | null>(null);
    readonly isLoading = signal(true);
    readonly error = signal<string | null>(null);
    readonly roleId = signal<number | null>(null);

    // Computed properties for better performance
    readonly roleAccessInfo = computed(() => {
        const roleData = this.role();
        if (!roleData) return null;

        return {
            label: ROLE_ACCESS_LEVEL_LABELS[roleData.accessLevel] || 'Desconocido',
            class: `access-level-${roleData.accessLevel}`,
            level: roleData.accessLevel,
        };
    });

    readonly formattedCreatedAt = computed(() => {
        const roleData = this.role();
        if (!roleData?.createdAt) return '';

        try {
            return roleData.createdAt.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return '';
        }
    });

    readonly accessLevelDescription = computed(() => {
        const roleData = this.role();
        if (!roleData) return '';

        const descriptions = {
            [RoleAccessLevel.ADMINISTRATOR]:
                'Acceso total al sistema y configuraciones administrativas',
            [RoleAccessLevel.PROJECT_MANAGER]: 'Gestión de proyectos y equipos de trabajo',
            [RoleAccessLevel.TEAM_LEAD]: 'Liderazgo de equipos y supervisión de desarrolladores',
            [RoleAccessLevel.DEVELOPER]: 'Desarrollo y colaboración en proyectos',
            [RoleAccessLevel.USER]: 'Acceso básico de usuario final',
        };

        return descriptions[roleData.accessLevel] || 'Permisos no definidos';
    });

    constructor() {
        // Set initial title
        this.titleService.setTitle('Detalles del Rol');

        // Extract role ID from route parameters
        effect(
            () => {
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
            },
            { allowSignalWrites: true }
        );

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

    // Navigation methods
    goBack(): void {
        this.router.navigate(['/users/roles']);
    }

    navigateToEdit(): void {
        const id = this.roleId();
        if (id) {
            this.router.navigate(['/users/roles', id, 'edit']);
        }
    }

    refresh(): void {
        const id = this.roleId();
        if (id) {
            this.loadRole(id);
        }
    }
}
