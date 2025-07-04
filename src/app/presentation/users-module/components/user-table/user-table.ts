import {
    Component,
    ChangeDetectionStrategy,
    signal,
    OnInit,
    inject,
    computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { GetUsersUseCase } from '@application/use-cases/user/get-users.use-case';
import { DeleteUserUseCase } from '@application/use-cases/user/delete-user.use-case';
import { UpdateUserUseCase } from '@application/use-cases/user/update-user.use-case';
import { UserListModel } from '@domain/models/user/user-list.model';
import { NotificationService } from '@core/services/notification.service';
import { ModalConfirmation } from '@shared/components/ui/modal-confirmation/modal-confirmation';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-user-table',
    imports: [DatePipe, ModalConfirmation],
    templateUrl: './user-table.html',
    styleUrl: './user-table.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserTable implements OnInit {
    private readonly getUsersUseCase = inject(GetUsersUseCase);
    private readonly deleteUserUseCase = inject(DeleteUserUseCase);
    private readonly updateUserUseCase = inject(UpdateUserUseCase);
    private readonly router = inject(Router);
    private readonly notificationService = inject(NotificationService);

    protected readonly users = signal<UserListModel[]>([]);
    protected readonly isLoading = signal(true);
    protected readonly error = signal<string | null>(null);
    protected readonly sortColumn = signal<keyof UserListModel>('username');
    protected readonly sortDirection = signal<'asc' | 'desc'>('asc');
    protected readonly searchQuery = signal('');

    // Modal states
    protected readonly showDeleteModal = signal(false);
    protected readonly showToggleModal = signal(false);
    protected readonly selectedUser = signal<UserListModel | null>(null);
    protected readonly isProcessing = signal(false);

    // Computed values
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

        // Apply sorting
        const column = this.sortColumn();
        const direction = this.sortDirection();

        return filtered.sort((a, b) => {
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
    });

    protected readonly totalUsers = computed(() => this.users().length);
    protected readonly activeUsers = computed(
        () => this.users().filter((user) => user.is_active).length
    );
    protected readonly inactiveUsers = computed(
        () => this.users().filter((user) => !user.is_active).length
    );

    ngOnInit(): void {
        this.loadUsers();
    }

    private loadUsers(): void {
        this.isLoading.set(true);
        this.error.set(null);

        this.getUsersUseCase.execute().subscribe({
            next: (users) => {
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

    protected refresh(): void {
        this.loadUsers();
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

    protected onSearchChange(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.searchQuery.set(target.value);
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
    protected confirmDeleteUser(user: UserListModel): void {
        this.selectedUser.set(user);
        this.showDeleteModal.set(true);
    }

    protected onConfirmDelete(): void {
        const user = this.selectedUser();
        if (!user || this.isProcessing()) return;

        this.isProcessing.set(true);

        this.deleteUserUseCase.execute(user.id).subscribe({
            next: () => {
                this.notificationService.success('Usuario eliminado', `${user.username} ha sido eliminado exitosamente`).subscribe();
                this.showDeleteModal.set(false);
                this.selectedUser.set(null);
                this.isProcessing.set(false);
                this.loadUsers(); // Refresh the list
            },
            error: (error) => {
                console.error('Error deleting user:', error);
                this.notificationService.error('Error', 'Error al eliminar el usuario. Por favor, intenta nuevamente.').subscribe();
                this.isProcessing.set(false);
            }
        });
    }

    protected confirmToggleUserStatus(user: UserListModel): void {
        this.selectedUser.set(user);
        this.showToggleModal.set(true);
    }

    protected onConfirmToggleStatus(): void {
        const user = this.selectedUser();
        if (!user || this.isProcessing()) return;

        this.isProcessing.set(true);
        const newStatus = !user.is_active;

        this.updateUserUseCase.execute(user.id, { is_active: newStatus }).subscribe({
            next: () => {
                const statusText = newStatus ? 'activado' : 'desactivado';
                this.notificationService.success('Estado actualizado', `${user.username} ha sido ${statusText} exitosamente`).subscribe();
                this.showToggleModal.set(false);
                this.selectedUser.set(null);
                this.isProcessing.set(false);
                this.loadUsers(); // Refresh the list
            },
            error: (error) => {
                console.error('Error updating user status:', error);
                this.notificationService.error('Error', 'Error al actualizar el estado del usuario. Por favor, intenta nuevamente.').subscribe();
                this.isProcessing.set(false);
            }
        });
    }

    protected onCancelModal(): void {
        if (!this.isProcessing()) {
            this.showDeleteModal.set(false);
            this.showToggleModal.set(false);
            this.selectedUser.set(null);
        }
    }

    // Modal content getters
    protected getDeleteModalTitle(): string {
        return 'Eliminar Usuario';
    }

    protected getDeleteModalMessage(): string {
        const user = this.selectedUser();
        if (user) {
            return `¿Estás seguro de que deseas eliminar a ${user.first_name} ${user.last_name} (${user.username})? Esta acción no se puede deshacer.`;
        }
        return '¿Estás seguro de que deseas eliminar este usuario?';
    }

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
