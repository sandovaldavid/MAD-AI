import { Component, ChangeDetectionStrategy, signal, inject, effect } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GetRoleByIdUseCase } from '@application/use-cases/role/get-role-by-id.use-case';
import { DeleteRoleUseCase } from '@application/use-cases/role/delete-role.use-case';
import { RoleModel } from '@domain/models/role/role.model';
import { RoleAccessLevel, ROLE_ACCESS_LEVEL_LABELS } from '@domain/enums/role-access-level.enum';
import { TitleService } from '@core/services/title.service';
import { NotificationService } from '@core/services/notification.service';
import { Button } from '@shared/components/ui/button/button';
import { ShieldIcon } from '../../../icons/shield.icon/shield.icon';
import { IdBadgeIcon } from '../../../icons/id-badge.icon/id-badge.icon';
import { InfoIcon } from '../../../icons/info.icon/info.icon';
import { UserListIcon } from '../../../icons/user-list.icon/user-list.icon';
import { CalendarIcon } from '../../../icons/calendar.icon/calendar.icon';
import { CheckCircleIcon } from '../../../icons/check-circle.icon/check-circle.icon';
import { XCircleIcon } from '../../../icons/x-circle.icon/x-circle.icon';
import { TrashIcon } from '@shared/components/ui/button/icons/trash.icon';
import { XIcon } from '@shared/components/ui/button/icons/x.icon';

@Component({
    selector: 'app-delete-role',
    imports: [
        Button,
        ShieldIcon,
        IdBadgeIcon,
        InfoIcon,
        UserListIcon,
        CalendarIcon,
        CheckCircleIcon,
        XCircleIcon,
        TrashIcon,
        XIcon,
    ],
    templateUrl: './delete-role.html',
    styleUrl: './delete-role.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteRole {
    // Injected services
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly titleService = inject(TitleService);
    private readonly notificationService = inject(NotificationService);
    private readonly getRoleByIdUseCase = inject(GetRoleByIdUseCase);
    private readonly deleteRoleUseCase = inject(DeleteRoleUseCase);

    // Signals
    role = signal<RoleModel | null>(null);
    isLoading = signal(true);
    isDeleting = signal(false);
    error = signal<string | null>(null);
    confirmationText = signal('');

    // Role access level labels
    protected readonly ROLE_ACCESS_LEVEL_LABELS = ROLE_ACCESS_LEVEL_LABELS;

    constructor() {
        // Set initial title
        this.titleService.setTitle('Eliminar Rol');

        // Load role data when component initializes
        effect(
            () => {
                const roleId = this.route.snapshot.paramMap.get('id');
                if (roleId) {
                    this.loadRole(Number(roleId));
                } else {
                    this.handleError('ID de rol no válido');
                }
            },
            { allowSignalWrites: true }
        );

        // Update title when role is loaded
        effect(() => {
            const role = this.role();
            if (role) {
                this.titleService.setTitle(`Eliminar Rol: ${role.name}`);
            }
        });
    }

    /**
     * Load role data by ID
     */
    private loadRole(id: number): void {
        this.isLoading.set(true);
        this.error.set(null);

        this.getRoleByIdUseCase.execute(id).subscribe({
            next: (role) => {
                this.role.set(role);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading role:', error);
                this.handleError('Error al cargar los datos del rol');
            },
        });
    }

    /**
     * Handle deletion confirmation
     */
    onConfirmDelete(): void {
        const role = this.role();
        if (!role || this.isDeleting()) return;

        // Validate confirmation text
        if (this.confirmationText().trim().toLowerCase() !== role.name.toLowerCase()) {
            this.notificationService.error('Error', 'El nombre del rol no coincide');
            return;
        }

        this.isDeleting.set(true);

        this.deleteRoleUseCase.execute(role.id).subscribe({
            next: () => {
                this.notificationService.success('Éxito', 'Rol eliminado exitosamente');
                this.router.navigate(['/admin/users/roles']);
            },
            error: (error) => {
                console.error('Error deleting role:', error);
                this.handleError('Error al eliminar el rol');
                this.isDeleting.set(false);
            },
        });
    }

    /**
     * Cancel deletion and navigate back
     */
    onCancel(): void {
        this.router.navigate(['/users/roles']);
    }

    /**
     * Navigate to role detail page
     */
    onViewDetails(): void {
        const role = this.role();
        if (role) {
            this.router.navigate(['/users/roles', role.id]);
        }
    }

    /**
     * Retry loading role data
     */
    onRetry(): void {
        const roleId = this.route.snapshot.paramMap.get('id');
        if (roleId) {
            this.loadRole(Number(roleId));
        }
    }

    /**
     * Handle errors
     */
    private handleError(message: string): void {
        this.error.set(message);
        this.isLoading.set(false);
        this.notificationService.error('Error', message);
    }

    /**
     * Update confirmation text
     */
    onConfirmationTextChange(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.confirmationText.set(target.value);
    }

    /**
     * Check if confirmation text matches role name
     */
    isConfirmationValid(): boolean {
        const role = this.role();
        if (!role) return false;
        return this.confirmationText().trim().toLowerCase() === role.name.toLowerCase();
    }

    /**
     * Get access level label with proper styling
     */
    getAccessLevelInfo(level: RoleAccessLevel): { label: string; class: string } {
        const label = this.ROLE_ACCESS_LEVEL_LABELS[level] || 'Desconocido';
        const cssClass = `access-level-${level}`;
        return { label, class: cssClass };
    }

    /**
     * Format date for display
     */
    formatDate(dateString: string): string {
        try {
            return new Date(dateString).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    }
}
