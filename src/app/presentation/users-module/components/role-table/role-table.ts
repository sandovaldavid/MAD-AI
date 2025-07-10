import {
    Component,
    ChangeDetectionStrategy,
    signal,
    OnInit,
    inject,
    computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GetRolesUseCase } from '@application/use-cases/role/get-roles.use-case';
import { DeleteRoleUseCase } from '@application/use-cases/role/delete-role.use-case';
import { UpdateRoleUseCase } from '@application/use-cases/role/update-role.use-case';
import { RoleEntity } from '@domain/entities/role.entity';
import { UpdateRoleData } from '@domain/models/role/role.dto';
import { RoleAccessLevel, ROLE_ACCESS_LEVEL_LABELS } from '@domain/enums/role-access-level.enum';
import { SelectOption } from '@domain/ui/select';
import { NotificationService } from '@core/services/notification.service';
import { ModalConfirmation } from '@shared/components/ui/modal-confirmation/modal-confirmation';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';
import { Button } from '@shared/components/ui/button/button';

@Component({
    selector: 'app-role-table',
    imports: [ModalConfirmation, InputComponent, SelectComponent, FormsModule, Button],
    templateUrl: './role-table.html',
    styleUrl: './role-table.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleTable implements OnInit {
    private readonly getRolesUseCase = inject(GetRolesUseCase);
    private readonly deleteRoleUseCase = inject(DeleteRoleUseCase);
    private readonly updateRoleUseCase = inject(UpdateRoleUseCase);
    private readonly router = inject(Router);
    private readonly notificationService = inject(NotificationService);

    // Signals for state management
    protected readonly roles = signal<RoleEntity[]>([]);
    protected readonly isLoading = signal(true);
    protected readonly error = signal<string | null>(null);
    protected readonly sortColumn = signal<keyof RoleEntity>('name');
    protected readonly sortDirection = signal<'asc' | 'desc'>('asc');
    protected readonly searchQuery = signal('');
    protected readonly selectedAccessLevel = signal<string>('');

    // Modal states
    protected readonly showDeleteModal = signal(false);
    protected readonly showToggleModal = signal(false);
    protected readonly selectedRole = signal<RoleEntity | null>(null);
    protected readonly isProcessing = signal(false);

    // Computed values
    protected readonly accessLevelOptions = computed<SelectOption[]>(() => {
        const options: SelectOption[] = [{ value: '', label: 'Todos los niveles' }];

        return options.concat(
            Object.entries(ROLE_ACCESS_LEVEL_LABELS).map(([level, label]) => ({
                value: level,
                label: label,
            }))
        );
    });

    protected readonly filteredAndSortedRoles = computed(() => {
        let filtered = this.roles();

        // Apply search filter
        const query = this.searchQuery().toLowerCase();
        if (query) {
            filtered = filtered.filter(
                (role) =>
                    role.name.toLowerCase().includes(query) ||
                    role.description.toLowerCase().includes(query)
            );
        }

        // Apply access level filter
        const accessLevel = this.selectedAccessLevel();
        if (accessLevel) {
            filtered = filtered.filter((role) => role.accessLevel.toString() === accessLevel);
        }

        // Apply sorting
        const column = this.sortColumn();
        const direction = this.sortDirection();

        return [...filtered].sort((a, b) => {
            let aValue = a[column];
            let bValue = b[column];

            // Handle different data types
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    });

    protected readonly totalRoles = computed(() => this.roles().length);
    protected readonly activeRoles = computed(
        () => this.roles().filter((role) => role.isActive).length
    );
    protected readonly inactiveRoles = computed(
        () => this.roles().filter((role) => !role.isActive).length
    );
    protected readonly filteredCount = computed(() => this.filteredAndSortedRoles().length);

    protected readonly selectedAccessLevelName = computed(() => {
        const level = this.selectedAccessLevel();
        return level && ROLE_ACCESS_LEVEL_LABELS[parseInt(level) as RoleAccessLevel]
            ? ROLE_ACCESS_LEVEL_LABELS[parseInt(level) as RoleAccessLevel]
            : '';
    });

    ngOnInit(): void {
        this.loadRoles();
    }

    private loadRoles(): void {
        this.isLoading.set(true);
        this.error.set(null);

        this.getRolesUseCase.execute().subscribe({
            next: (roles) => {
                this.roles.set(roles);
                this.isLoading.set(false);
            },
            error: (err) => {
                this.error.set('Error al cargar la lista de roles');
                this.isLoading.set(false);
                console.error('Error loading roles:', err);
            },
        });
    }

    protected refresh(): void {
        this.loadRoles();
    }

    protected sort(column: string): void {
        const entityColumn = this.mapToEntityProperty(column);
        if (this.sortColumn() === entityColumn) {
            this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
        } else {
            this.sortColumn.set(entityColumn as keyof RoleEntity);
            this.sortDirection.set('asc');
        }
    }

    /**
     * Maps legacy column names to entity properties
     */
    private mapToEntityProperty(column: string): keyof RoleEntity {
        const propertyMap: Record<string, keyof RoleEntity> = {
            access_level: 'accessLevel',
            user_count: 'userCount',
            is_active: 'isActive',
        };

        return (column in propertyMap ? propertyMap[column] : column) as keyof RoleEntity;
    }

    protected onSearchChange(value: string): void {
        this.searchQuery.set(value);
    }

    protected onAccessLevelFilterChange(value: string | number | (string | number)[]): void {
        const stringValue = Array.isArray(value) ? value[0]?.toString() || '' : value.toString();
        this.selectedAccessLevel.set(stringValue);
    }

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

    protected getSortIcon(column: string): string {
        const entityColumn = this.mapToEntityProperty(column);
        if (this.sortColumn() !== entityColumn) return 'sort-unsorted';
        return this.sortDirection() === 'asc' ? 'sort-asc' : 'sort-desc';
    }

    // Navigation methods
    protected navigateToCreate(): void {
        this.router.navigate(['/users/roles/create']);
    }

    protected navigateToView(roleId: number): void {
        this.router.navigate(['/users/roles', roleId]);
    }

    protected navigateToEdit(roleId: number): void {
        this.router.navigate(['/users/roles', roleId, 'edit']);
    }

    protected navigateToDelete(roleId: number): void {
        this.router.navigate(['/users/roles', roleId, 'delete']);
    }

    // CRUD operations
    protected confirmDeleteRole(role: RoleEntity): void {
        this.selectedRole.set(role);
        this.showDeleteModal.set(true);
    }

    protected onConfirmDelete(): void {
        const role = this.selectedRole();
        if (!role || this.isProcessing()) return;

        this.isProcessing.set(true);

        this.deleteRoleUseCase.execute(role.id).subscribe({
            next: () => {
                this.notificationService
                    .success('Éxito', `El rol "${role.name}" ha sido eliminado exitosamente`)
                    .subscribe();

                // Remove the role from the local list
                const updatedRoles = this.roles().filter((r) => r.id !== role.id);
                this.roles.set(updatedRoles);

                this.isProcessing.set(false);
                this.onCancelModal();
            },
            error: (error) => {
                console.error('Error deleting role:', error);
                let errorMessage = 'Ocurrió un error al eliminar el rol';

                // Handle specific error cases based on the API documentation
                if (error.status === 400) {
                    errorMessage = 'No se puede eliminar el rol porque tiene usuarios asignados';
                } else if (error.status === 404) {
                    errorMessage = 'El rol no fue encontrado';
                }

                this.notificationService.error('Error', errorMessage).subscribe();

                this.isProcessing.set(false);
                this.onCancelModal();
            },
        });
    }

    protected confirmToggleRoleStatus(role: RoleEntity): void {
        this.selectedRole.set(role);
        this.showToggleModal.set(true);
    }

    protected onConfirmToggleStatus(): void {
        const role = this.selectedRole();
        if (!role || this.isProcessing()) return;

        this.isProcessing.set(true);

        // Prepare the update data with only the fields we want to change
        const updateData: UpdateRoleData = {
            name: role.name,
            description: role.description,
            accessLevel: role.accessLevel,
            canLeadProjects: role.canLeadProjects,
            isUniquePerTeam: role.isUniquePerTeam,
            isActive: !role.isActive, // Toggle the current status
        };

        this.updateRoleUseCase.execute(role.id, updateData).subscribe({
            next: (updatedRole) => {
                const action = updatedRole.isActive ? 'activado' : 'desactivado';
                this.notificationService
                    .success('Éxito', `El rol "${role.name}" ha sido ${action} exitosamente`)
                    .subscribe();

                // Update the role in the local list
                const updatedRoles = this.roles().map((r) => {
                    if (r.id === role.id) {
                        // Create a new RoleEntity with updated isActive property
                        return new RoleEntity({
                            ...r,
                            isActive: updatedRole.isActive,
                        });
                    }
                    return r;
                });
                this.roles.set(updatedRoles);

                this.isProcessing.set(false);
                this.onCancelModal();
            },
            error: (error) => {
                console.error('Error updating role status:', error);
                const action = role.isActive ? 'desactivar' : 'activar';
                this.notificationService
                    .error('Error', `Ocurrió un error al ${action} el rol`)
                    .subscribe();

                this.isProcessing.set(false);
                this.onCancelModal();
            },
        });
    }

    protected onCancelModal(): void {
        this.showDeleteModal.set(false);
        this.showToggleModal.set(false);
        this.selectedRole.set(null);
        this.isProcessing.set(false);
    }

    // Modal helper methods
    protected getDeleteModalTitle(): string {
        return 'Eliminar Rol';
    }

    protected getDeleteModalMessage(): string {
        const role = this.selectedRole();
        if (role) {
            return `¿Estás seguro de que deseas eliminar el rol "${role.name}"? Esta acción no se puede deshacer y afectará a ${role.userCount} usuario(s).`;
        }
        return '¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede deshacer.';
    }

    protected getToggleModalTitle(): string {
        const role = this.selectedRole();
        return role?.isActive ? 'Desactivar Rol' : 'Activar Rol';
    }

    protected getToggleModalMessage(): string {
        const role = this.selectedRole();
        if (role) {
            const action = role.isActive ? 'desactivar' : 'activar';
            return `¿Estás seguro de que deseas ${action} el rol "${role.name}"?`;
        }
        return '';
    }

    protected getToggleConfirmText(): string {
        const role = this.selectedRole();
        return role?.isActive ? 'Desactivar' : 'Activar';
    }

    protected getToggleButtonClass(): string {
        const role = this.selectedRole();
        return role?.isActive ? 'btn-danger' : 'btn-primary';
    }
}
