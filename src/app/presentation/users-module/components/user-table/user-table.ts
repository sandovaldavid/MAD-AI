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
import { GetUsersUseCase } from '@application/use-cases/user/get-users.use-case';

import { ActivateUserUseCase } from '@application/use-cases/user/activate-user.use-case';
import { DeactivateUserUseCase } from '@application/use-cases/user/deactivate-user.use-case';
import { GetRolesUseCase } from '@application/use-cases/role/get-roles.use-case';
import { UserListModel } from '@domain/models/user/user-list.model';
import { RoleListModel } from '@domain/models/role/role-list.model';
import { NotificationService } from '@core/services/notification.service';
import { ModalConfirmation } from '@shared/components/ui/modal-confirmation/modal-confirmation';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';
import { DatePipe } from '@angular/common';
import { Button } from '@shared/components/ui/button/button';
import type { SelectOption } from '@domain/ui/select';

@Component({
    selector: 'app-user-table',
    imports: [DatePipe, ModalConfirmation, InputComponent, SelectComponent, FormsModule, Button],
    templateUrl: './user-table.html',
    styleUrl: './user-table.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserTable implements OnInit {
    private readonly getUsersUseCase = inject(GetUsersUseCase);
    private readonly activateUserUseCase = inject(ActivateUserUseCase);
    private readonly deactivateUserUseCase = inject(DeactivateUserUseCase);
    private readonly getRolesUseCase = inject(GetRolesUseCase);
    private readonly router = inject(Router);
    private readonly notificationService = inject(NotificationService);

    protected readonly users = signal<UserListModel[]>([]);
    protected readonly roles = signal<RoleListModel[]>([]);
    protected readonly isLoading = signal(true);
    protected readonly isLoadingRoles = signal(true);
    protected readonly error = signal<string | null>(null);
    protected readonly sortColumn = signal<keyof UserListModel>('username');
    protected readonly sortDirection = signal<'asc' | 'desc'>('asc');
    protected readonly searchQuery = signal('');
    protected readonly selectedRoleId = signal<string>('');

    // Modal states
    protected readonly showToggleModal = signal(false);
    protected readonly selectedUser = signal<UserListModel | null>(null);
    protected readonly isProcessing = signal(false);

    // Computed values
    protected readonly roleOptions = computed<SelectOption[]>(() => {
        const options: SelectOption[] = [{ value: '', label: 'Todos los roles' }];

        return options.concat(
            this.roles()
                .filter((role) => role.is_active)
                .map((role) => ({
                    value: role.id.toString(),
                    label: role.name,
                }))
        );
    });

    protected readonly filteredAndSortedUsers = computed(() => {
        let filtered = this.users();

        // Apply search filter
        const query = this.searchQuery().toLowerCase();
        if (query) {
            filtered = filtered.filter(
                (user) =>
                    user.username.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query) ||
                    user.first_name.toLowerCase().includes(query) ||
                    user.last_name.toLowerCase().includes(query) ||
                    (user.role_name && user.role_name.toLowerCase().includes(query))
            );
        }

        // Apply role filter
        const selectedRoleId = this.selectedRoleId();
        if (selectedRoleId) {
            filtered = filtered.filter((user) => {
                // Find the role for this user
                const userRole = this.roles().find((role) => role.name === user.role_name);
                return userRole?.id.toString() === selectedRoleId;
            });
        }

        // Apply sorting
        const column = this.sortColumn();
        const direction = this.sortDirection();

        const sorted = filtered.sort((a, b) => {
            let valueA = a[column];
            let valueB = b[column];

            // Handle null values
            if (valueA === null || valueA === undefined) valueA = '';
            if (valueB === null || valueB === undefined) valueB = '';

            // Convert to string for comparison
            const stringA = String(valueA).toLowerCase();
            const stringB = String(valueB).toLowerCase();

            if (direction === 'asc') {
                return stringA.localeCompare(stringB);
            } else {
                return stringB.localeCompare(stringA);
            }
        });

        return sorted;
    });

    protected readonly totalUsers = computed(() => this.users().length);
    protected readonly activeUsers = computed(
        () => this.users().filter((user) => user.is_active).length
    );
    protected readonly inactiveUsers = computed(
        () => this.users().filter((user) => !user.is_active).length
    );

    protected readonly selectedRoleName = computed(() => {
        const selectedRoleId = this.selectedRoleId();
        if (!selectedRoleId) return '';
        const role = this.roleOptions().find((r) => r.value === selectedRoleId);
        return role?.label || '';
    });

    // Generate empty rows to maintain minimum table height
    protected readonly emptyRows = computed(() => {
        const currentUsers = this.filteredAndSortedUsers();
        const minRows = 4;

        // Only generate empty rows if there are users but less than minRows
        // Don't generate empty rows when there are no users (to preserve empty state)
        if (currentUsers.length === 0) {
            return [];
        }

        const emptyRowsCount = Math.max(0, minRows - currentUsers.length);
        return Array(emptyRowsCount).fill(null);
    });

    ngOnInit(): void {
        this.loadUsers();
        this.loadRoles();
    }

    private loadUsers(): void {
        this.isLoading.set(true);
        this.error.set(null);

        this.getUsersUseCase.execute().subscribe({
            next: (users) => {
                console.log('Users received:', users);
                console.log('First user role_name:', users[0]?.role_name);
                console.log('First user complete data:', users[0]);
                this.users.set(users);
                this.isLoading.set(false);
            },
            error: (err) => {
                this.error.set('Error al cargar la lista de usuarios');
                this.isLoading.set(false);
                console.error('Error loading users:', err);
            },
        });
    }

    private loadRoles(): void {
        this.isLoadingRoles.set(true);

        this.getRolesUseCase.execute().subscribe({
            next: (roles) => {
                this.roles.set(roles);
                this.isLoadingRoles.set(false);
            },
            error: (err) => {
                console.error('Error loading roles:', err);
                this.isLoadingRoles.set(false);
            },
        });
    }

    protected refresh(): void {
        this.loadUsers();
        this.loadRoles();
    }

    protected sort(column: keyof UserListModel): void {
        if (this.sortColumn() === column) {
            // Toggle direction if same column
            this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new column and default to ascending
            this.sortColumn.set(column);
            this.sortDirection.set('asc');
        }
    }

    protected onSearchChange(value: string): void {
        this.searchQuery.set(value);
    }

    protected onRoleFilterChange(value: string | number | (string | number)[]): void {
        this.selectedRoleId.set(Array.isArray(value) ? '' : String(value));
    }

    protected getStatusBadgeClass(isActive: boolean): string {
        return isActive ? 'status-badge-active' : 'status-badge-inactive';
    }

    protected getStatusText(isActive: boolean): string {
        return isActive ? 'Activo' : 'Inactivo';
    }

    protected getSortIcon(column: keyof UserListModel): string {
        if (this.sortColumn() !== column) return 'sort-unsorted';
        return this.sortDirection() === 'asc' ? 'sort-asc' : 'sort-desc';
    }

    // Navigation methods
    protected navigateToCreate(): void {
        this.router.navigate(['/users/create']);
    }

    protected navigateToView(userId: number): void {
        this.router.navigate(['/users', userId]);
    }

    protected navigateToEdit(userId: number): void {
        this.router.navigate(['/users', userId, 'edit']);
    }

    // CRUD operations
    protected navigateToDelete(userId: number): void {
        console.log('⚠️ navigateToDelete called with userId:', userId);
        console.log('🧭 About to navigate to deactivate page:', ['/users', userId, 'delete']);
        this.router.navigate(['/users', userId, 'delete']);
    }

    protected confirmToggleUserStatus(user: UserListModel): void {
        this.selectedUser.set(user);
        this.showToggleModal.set(true);
    }

    protected onConfirmToggleStatus(): void {
        const user = this.selectedUser();
        if (!user || this.isProcessing()) return;

        console.log('🚀 Starting toggle status for user:', {
            userId: user.id,
            currentStatus: user.is_active,
            username: user.username,
        });

        this.isProcessing.set(true);
        const newStatus = !user.is_active;

        console.log(`📋 Will ${newStatus ? 'activate' : 'deactivate'} user ${user.id}`);

        // Use the appropriate use case based on the desired status
        const useCase = newStatus
            ? this.activateUserUseCase.execute(user.id)
            : this.deactivateUserUseCase.execute(user.id);

        useCase.subscribe({
            next: (updatedUser: UserListModel) => {
                console.log('✅ Received updated user from API:', {
                    userId: updatedUser.id,
                    newStatus: updatedUser.is_active,
                    expectedStatus: newStatus,
                    fullUser: updatedUser,
                });

                const statusText = newStatus ? 'activado' : 'desactivado';
                this.notificationService
                    .success(
                        'Estado actualizado',
                        `${user.username} ha sido ${statusText} exitosamente`
                    )
                    .subscribe();

                // SIMPLIFIED APPROACH: Always reload the entire list
                // This ensures the UI always reflects the correct state
                console.log('🔄 Reloading all users to ensure UI consistency...');
                this.loadUsers();

                this.showToggleModal.set(false);
                this.selectedUser.set(null);
                this.isProcessing.set(false);
            },
            error: (error: any) => {
                console.error('❌ Error updating user status:', error);
                this.notificationService
                    .error(
                        'Error',
                        'Error al actualizar el estado del usuario. Por favor, intenta nuevamente.'
                    )
                    .subscribe();
                this.isProcessing.set(false);
            },
        });
    }

    // Simplified version that always reloads - use for testing if local update fails
    protected onCancelModal(): void {
        if (!this.isProcessing()) {
            this.showToggleModal.set(false);
            this.selectedUser.set(null);
        }
    }

    // Modal content getters
    protected getToggleModalTitle(): string {
        const user = this.selectedUser();
        const action = user?.is_active ? 'Desactivar' : 'Activar';
        return `${action} Usuario`;
    }

    protected getToggleModalMessage(): string {
        const user = this.selectedUser();
        if (user) {
            const action = user.is_active ? 'desactivar' : 'activar';
            return `¿Estás seguro de que deseas ${action} a ${user.first_name} ${user.last_name} (${user.username})?`;
        }
        return '¿Estás seguro de que deseas cambiar el estado de este usuario?';
    }

    protected getToggleConfirmText(): string {
        const user = this.selectedUser();
        return user?.is_active ? 'Desactivar' : 'Activar';
    }

    protected getToggleButtonClass(): string {
        const user = this.selectedUser();
        return user?.is_active ? 'btn-danger' : 'btn-primary';
    }
}
