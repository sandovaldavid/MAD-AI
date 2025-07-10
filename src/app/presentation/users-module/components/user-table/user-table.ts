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
import { DatePipe } from '@angular/common';

// Application layer - Use Cases
import { GetUsersUseCase } from '@application/use-cases/user/get-users.use-case';
import { ActivateUserUseCase } from '@application/use-cases/user/activate-user.use-case';
import { DeactivateUserUseCase } from '@application/use-cases/user/deactivate-user.use-case';
import { GetRolesUseCase } from '@application/use-cases/role/get-roles.use-case';

// Domain layer - Entities and Enums
import { UserEntity } from '@domain/entities/user.entity';
import { RoleEntity } from '@domain/entities/role.entity';
import { UserStatus } from '@domain/enums/user_status.enum';
import { RoleAccessLevel } from '@domain/enums/role-access-level.enum';
import type { SelectOption } from '@domain/ui/select';

// Core services
import { NotificationService } from '@core/services/notification.service';

// Shared components
import { ModalConfirmation } from '@shared/components/ui/modal-confirmation/modal-confirmation';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';
import { Button } from '@shared/components/ui/button/button';

/**
 * User Table Component
 * Displays a list of users with sorting, filtering, and status management functionality
 */
@Component({
    selector: 'app-user-table',
    imports: [DatePipe, ModalConfirmation, InputComponent, SelectComponent, FormsModule, Button],
    templateUrl: './user-table.html',
    styleUrl: './user-table.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserTable implements OnInit {
    // Dependency injection
    private readonly getUsersUseCase = inject(GetUsersUseCase);
    private readonly activateUserUseCase = inject(ActivateUserUseCase);
    private readonly deactivateUserUseCase = inject(DeactivateUserUseCase);
    private readonly getRolesUseCase = inject(GetRolesUseCase);
    private readonly router = inject(Router);
    private readonly notificationService = inject(NotificationService);

    // State signals
    protected readonly users = signal<UserEntity[]>([]);
    protected readonly roles = signal<RoleEntity[]>([]);
    protected readonly isLoading = signal(true);
    protected readonly isLoadingRoles = signal(true);
    protected readonly error = signal<string | null>(null);

    // Table control signals
    protected readonly sortColumn = signal<keyof UserEntity>('username');
    protected readonly sortDirection = signal<'asc' | 'desc'>('asc');
    protected readonly searchQuery = signal('');
    protected readonly selectedRoleId = signal<string>('');

    // Modal states
    protected readonly showToggleModal = signal(false);
    protected readonly selectedUser = signal<UserEntity | null>(null);
    protected readonly isProcessing = signal(false);

    /**
     * Computes the role options for the dropdown filter
     */
    protected readonly roleOptions = computed<SelectOption[]>(() => {
        const options: SelectOption[] = [{ value: '', label: 'Todos los roles' }];

        return options.concat(
            this.roles()
                .filter((role) => role.isActive)
                .map((role) => ({
                    value: role.id.toString(),
                    label: role.name,
                }))
        );
    });

    /**
     * Filter and sort users based on search query, role filter, and sort preferences
     */
    protected readonly filteredAndSortedUsers = computed(() => {
        // Start with all users
        let filtered = this.users();

        // Apply search filter if query exists
        const query = this.searchQuery().toLowerCase();
        if (query) {
            filtered = filtered.filter(
                (user) =>
                    user.username.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query) ||
                    user.firstName.toLowerCase().includes(query) ||
                    user.lastName.toLowerCase().includes(query) ||
                    (user.roleName && user.roleName.toLowerCase().includes(query))
            );
        }

        // Apply role filter
        const selectedRoleId = this.selectedRoleId();
        if (selectedRoleId) {
            filtered = filtered.filter((user) => {
                // Find the role for this user
                const userRole = this.roles().find((role) => role.name === user.roleName);
                return userRole?.id.toString() === selectedRoleId;
            });
        }

        // Apply sorting
        const column = this.sortColumn();
        const direction = this.sortDirection();

        return filtered.sort((a, b) => {
            // Get sort values using our helper method which handles special cases
            const valueA = this.getSortValue(a, column);
            const valueB = this.getSortValue(b, column);

            // Compare values based on direction
            if (direction === 'asc') {
                return this.compareValues(valueA, valueB);
            } else {
                return this.compareValues(valueB, valueA);
            }
        });
    });

    protected readonly totalUsers = computed(() => this.users().length);
    protected readonly activeUsers = computed(
        () => this.users().filter((user) => user.isActive).length
    );
    protected readonly inactiveUsers = computed(
        () => this.users().filter((user) => !user.isActive).length
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

    /**
     * Load users from the API
     */
    private loadUsers(): void {
        this.isLoading.set(true);
        this.error.set(null);

        this.getUsersUseCase.execute().subscribe({
            next: (users) => {
                // Use UserEntity array directly
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

    /**
     * Load roles from the API
     */
    private loadRoles(): void {
        this.isLoadingRoles.set(true);

        this.getRolesUseCase.execute().subscribe({
            next: (roles) => {
                // Use RoleEntity array directly
                this.roles.set(roles);
                this.isLoadingRoles.set(false);
            },
            error: (err) => {
                console.error('Error loading roles:', err);
                this.isLoadingRoles.set(false);
                // Add notification for consistency in error handling
                this.notificationService
                    .error(
                        'Error',
                        'Error al cargar los roles. Algunas funcionalidades pueden verse limitadas.'
                    )
                    .subscribe();
            },
        });
    }

    /**
     * Data Loading Methods
     * ----------------------------------------
     */

    /**
     * Refreshes all data in the table (users and roles)
     * Used by the refresh button and after certain operations
     */
    protected refresh(): void {
        this.loadUsers();
        this.loadRoles();
    }

    /**
     * Sorting methods
     * ----------------------------------------
     */

    /**
     * Handles sorting when a table column header is clicked
     * Handles both camelCase property names and snake_case field names for backward compatibility
     * @param column The column to sort by
     */
    protected sort(column: string | keyof UserEntity): void {
        // Map from snake_case to camelCase if needed
        const fieldMap: Record<string, keyof UserEntity> = {
            first_name: 'firstName',
            last_name: 'lastName',
            role_name: 'roleName',
            is_active: 'isActive',
            created_at: 'createdAt',
            updated_at: 'updatedAt',
            last_activity_at: 'lastActivityAt',
            full_name: 'fullName',
        };

        // Use the mapping or the field as-is if it exists on UserEntity
        const entityField =
            typeof column === 'string' && column in fieldMap
                ? fieldMap[column]
                : (column as keyof UserEntity);

        if (this.sortColumn() === entityField) {
            // Toggle direction if same column
            this.toggleSortDirection();
        } else {
            // Set new column and default to ascending
            this.sortColumn.set(entityField);
            this.sortDirection.set('asc');
        }
    }

    /**
     * Toggle sort direction between ascending and descending
     */
    private toggleSortDirection(): void {
        this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    }

    /**
     * Gets the appropriate sort icon based on column and current sort state
     */
    protected getSortIcon(column: keyof UserEntity): string {
        if (this.sortColumn() !== column) return 'sort-unsorted';
        return this.sortDirection() === 'asc' ? 'sort-asc' : 'sort-desc';
    }

    /**
     * Get the appropriate sort value based on column and special cases
     * @param user The user entity
     * @param column The column/property to get value for
     * @returns Normalized value for sorting
     */
    private getSortValue(user: UserEntity, column: keyof UserEntity): any {
        // Handle special case for fullName (which is a getter)
        if (column === 'fullName') {
            return user.fullName.toLowerCase();
        }

        // Handle special case for role name
        if (column === 'roleName') {
            return (user.roleName || '').toLowerCase();
        }

        // Handle date columns
        if (column === 'createdAt' || column === 'updatedAt' || column === 'lastActivityAt') {
            const date = user[column];
            return date ? new Date(date).getTime() : 0;
        }

        // Handle normal cases
        const value = user[column];
        return value === null || value === undefined ? '' : String(value).toLowerCase();
    }

    /**
     * Compare two values for sorting
     * @param a First value
     * @param b Second value
     * @returns Comparison result
     */
    private compareValues(a: any, b: any): number {
        // Handle numeric comparisons
        if (typeof a === 'number' && typeof b === 'number') {
            return a - b;
        }

        // Handle boolean comparisons
        if (typeof a === 'boolean' && typeof b === 'boolean') {
            return a === b ? 0 : a ? 1 : -1;
        }

        // Default to string comparison
        return String(a).localeCompare(String(b));
    }

    /**
     * Filtering methods
     * ----------------------------------------
     */

    /**
     * Handles search input changes
     * @param value New search query
     */
    protected onSearchChange(value: string): void {
        this.searchQuery.set(value);
    }

    /**
     * Handles role filter dropdown changes
     * @param value Selected role ID
     */
    protected onRoleFilterChange(value: string | number | (string | number)[]): void {
        this.selectedRoleId.set(Array.isArray(value) ? '' : String(value));
    }

    /**
     * UI Helper methods
     * ----------------------------------------
     */

    /**
     * Gets the appropriate CSS class for status badges
     */
    protected getStatusBadgeClass(isActive: boolean): string {
        return isActive ? 'status-badge-active' : 'status-badge-inactive';
    }

    /**
     * Gets the display text for user status
     */
    protected getStatusText(isActive: boolean): string {
        return isActive ? 'Activo' : 'Inactivo';
    }

    /**
     * Navigation methods
     * ----------------------------------------
     */

    /**
     * Navigate to create user page
     */
    protected navigateToCreate(): void {
        this.router.navigate(['/users/create']);
    }

    /**
     * Navigate to view user details page
     */
    protected navigateToView(userId: number): void {
        this.router.navigate(['/users', userId]);
    }

    /**
     * Navigate to edit user page
     */
    protected navigateToEdit(userId: number): void {
        this.router.navigate(['/users', userId, 'edit']);
    }

    /**
     * Navigate to delete user page
     */
    protected navigateToDelete(userId: number): void {
        this.router.navigate(['/users', userId, 'delete']);
    }

    /**
     * User Status Toggle Methods
     * ----------------------------------------
     */

    /**
     * Opens the confirmation modal for toggling user status
     * @param user The user whose status will be toggled
     */
    protected confirmToggleUserStatus(user: UserEntity): void {
        this.selectedUser.set(user);
        this.showToggleModal.set(true);
    }

    /**
     * Handle user status toggle confirmation
     * Activates or deactivates a user based on their current state
     */
    protected onConfirmToggleStatus(): void {
        const user = this.selectedUser();
        if (!user || this.isProcessing()) return;

        this.isProcessing.set(true);
        const newStatus = !user.isActive;

        // Use the appropriate use case based on the desired status
        const useCase = newStatus
            ? this.activateUserUseCase.execute(user.id)
            : this.deactivateUserUseCase.execute(user.id);

        useCase.subscribe({
            next: (updatedUserEntity) => {
                // Show success notification
                const statusText = newStatus ? 'activado' : 'desactivado';
                this.notificationService
                    .success(
                        'Estado actualizado',
                        `${user.username} ha sido ${statusText} exitosamente`
                    )
                    .subscribe();

                // Reload users to ensure the UI reflects the correct state
                this.loadUsers();

                // Reset modal state
                this.closeToggleModal();
            },
            error: (error: any) => {
                console.error('Error updating user status:', error);
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

    /**
     * Closes the toggle status modal and resets related state
     */
    private closeToggleModal(): void {
        this.showToggleModal.set(false);
        this.selectedUser.set(null);
        this.isProcessing.set(false);
    }

    /**
     * Handles modal cancellation
     */
    protected onCancelModal(): void {
        if (!this.isProcessing()) {
            this.closeToggleModal();
        }
    }

    /**
     * Modal Content Methods
     * ----------------------------------------
     */

    /**
     * Gets the title for the toggle status modal
     */
    protected getToggleModalTitle(): string {
        const user = this.selectedUser();
        const action = user?.isActive ? 'Desactivar' : 'Activar';
        return `${action} Usuario`;
    }

    /**
     * Gets the confirmation message for the toggle status modal
     */
    protected getToggleModalMessage(): string {
        const user = this.selectedUser();
        if (user) {
            const action = user.isActive ? 'desactivar' : 'activar';
            return `¿Estás seguro de que deseas ${action} a ${user.firstName} ${user.lastName} (${user.username})?`;
        }
        return '¿Estás seguro de que deseas cambiar el estado de este usuario?';
    }

    /**
     * Gets the text for the confirmation button in the toggle status modal
     */
    protected getToggleConfirmText(): string {
        const user = this.selectedUser();
        return user?.isActive ? 'Desactivar' : 'Activar';
    }

    /**
     * Gets the CSS class for the confirmation button in the toggle status modal
     */
    protected getToggleButtonClass(): string {
        const user = this.selectedUser();
        return user?.isActive ? 'btn-danger' : 'btn-primary';
    }
}
