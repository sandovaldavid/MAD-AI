/**
 * @fileoverview RolesFacade - Comprehensive role management orchestrator
 *
 * This facade provides a complete role management solution following MAD-AI's
 * Clean Architecture principles. It orchestrates all role-related use cases
 * including CRUD operations, queries, state management, assignments, and bulk operations.
 *
 * Key Features:
 * - Reactive state management using Angular signals
 * - Comprehensive error handling with user-friendly messaging
 * - Cross-facade integration for notifications
 * - Optimistic updates with rollback on errors
 * - Client-side filtering and caching
 * - Bulk operations support
 * - Role assignment/unassignment management
 *
 * @architecture Clean Architecture - Application Layer
 * @dependencies Domain entities, use cases, and notification services
 * @consumers Role management components and related features
 */

// ============================================================================
// Angular Core Imports
// ============================================================================
import { Injectable, inject, signal, computed } from '@angular/core';

// ============================================================================
// Application Layer Imports (Use Cases)
// ============================================================================

// Core CRUD Use Cases
import { ListRoles } from '@application/use-cases/roles/list-roles.usecase';
import { GetRoleById } from '@application/use-cases/roles/get-role-by-id.usecase';
import { CreateRole } from '@application/use-cases/roles/create-role.usecase';
import { UpdateRole } from '@application/use-cases/roles/update-role.usecase';
import { DeleteRole } from '@application/use-cases/roles/delete-role.usecase';

// Query Use Cases
import { GetRoleByName } from '@application/use-cases/roles/get-role-by-name.usecase';
import { GetUsersByRole } from '@application/use-cases/roles/get-users-by-role.usecase';

// State Management Use Cases
import { ActivateRole } from '@application/use-cases/roles/activate-role.usecase';
import { DeactivateRole } from '@application/use-cases/roles/deactivate-role.usecase';

// Assignment Use Cases
import { AssignRoleToUser } from '@application/use-cases/roles/assign-role-to-user.usecase';
import { UnassignRoleFromUser } from '@application/use-cases/roles/unassign-role-from-user.usecase';

// Bulk Operations Use Cases
import { BulkCreateRoles } from '@application/use-cases/roles/bulk-create-roles.usecase';
import { BulkUpdateRoles } from '@application/use-cases/roles/bulk-update-roles.usecase';
import { BulkDeleteRoles } from '@application/use-cases/roles/bulk-delete-roles.usecase';

// Application Types
import type { FacadeOpts } from '@application/types/facade-opts';

// Error Handling
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';

// Cross-Facade Dependencies
import { NotificationsFacade } from '@application/facades/notifications.facade';
import { AuthFacade } from '@application/facades/auth.facade';

// Application Services
import { RoleExportService } from '@application/services/role-export.service';

// ============================================================================
// Domain Layer Imports
// ============================================================================
import { Role } from '@domain/entities/role.entity';
import type { User } from '@domain/entities/user.entity';
import { RoleName } from '@domain/value-objects/role-name.vo';
import { AccessLevel } from '@domain/value-objects/accesslevel.vo';

// ============================================================================
// Presentation Layer Imports
// ============================================================================
import type { RoleModel } from '@presentation/features/roles/models/role.model';
import { RoleViewMapper } from '@/app/presentation/features/roles/mappers/role-view.mapper';
import {
    RoleExportMapper,
    type RoleExportOptions,
    type RoleExportData,
} from '@/app/presentation/features/roles/mappers/role-export.mapper';

// ============================================================================
// Types for Role Operations
// ============================================================================
interface ListRolesParams {
    search?: string;
    active?: boolean;
}

/**
 * RolesFacade - Comprehensive role management orchestrator
 *
 * Serves as the primary interface for all role-related operations in the application.
 * This facade manages role state reactively using Angular signals and coordinates
 * between multiple use cases to provide a unified interface for role management.
 *
 * @example Basic role operations
 * ```typescript
 * export class RolesComponent {
 *   private rolesFacade = inject(RolesFacade);
 *
 *   roles = this.rolesFacade.roles;
 *   loading = this.rolesFacade.loading;
 *   error = this.rolesFacade.error;
 *
 *   async ngOnInit() {
 *     await this.rolesFacade.refresh();
 *   }
 *
 *   async createRole(data: any) {
 *     await this.rolesFacade.createRole(data);
 *   }
 * }
 * ```
 *
 * @example Role assignment
 * ```typescript
 * async assignRole(roleId: number, userId: number) {
 *   await this.rolesFacade.assignRoleToUser(roleId, userId);
 * }
 * ```
 *
 * @example Bulk operations
 * ```typescript
 * async bulkAssign(roleId: number, userIds: number[]) {
 *   await this.rolesFacade.bulkAssignRoleToUsers(roleId, userIds);
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class RolesFacade {
    // ============================================================================
    // Dependencies Injection
    // ============================================================================

    // Core CRUD Use Cases
    private readonly listRolesUC = inject(ListRoles);
    private readonly getRoleByIdUC = inject(GetRoleById);
    private readonly createRoleUC = inject(CreateRole);
    private readonly updateRoleUC = inject(UpdateRole);
    private readonly deleteRoleUC = inject(DeleteRole);

    // Query Use Cases
    private readonly getRoleByNameUC = inject(GetRoleByName);
    private readonly getUsersByRoleUC = inject(GetUsersByRole);

    // State Management Use Cases
    private readonly activateRoleUC = inject(ActivateRole);
    private readonly deactivateRoleUC = inject(DeactivateRole);

    // Assignment Use Cases
    private readonly assignRoleToUserUC = inject(AssignRoleToUser);
    private readonly unassignRoleFromUserUC = inject(UnassignRoleFromUser);

    // Bulk Operations Use Cases
    private readonly bulkCreateRolesUC = inject(BulkCreateRoles);
    private readonly bulkUpdateRolesUC = inject(BulkUpdateRoles);
    private readonly bulkDeleteRolesUC = inject(BulkDeleteRoles);

    // Error Transformer
    private readonly errorTransformer = inject(ApplicationErrorTransformer);

    // Cross-Facade Dependencies
    private readonly notifications = inject(NotificationsFacade);
    private readonly authFacade = inject(AuthFacade);

    // Application Services
    private readonly roleExportService = inject(RoleExportService);

    // ============================================================================
    // Private State Signals
    // ============================================================================

    /** Loading state for async operations */
    private readonly _loading = signal(false);

    /** Current error state */
    private readonly _error = signal<string | null>(null);

    /** List of roles */
    private readonly _roles = signal<RoleModel[]>([]);

    /** Current selected role */
    private readonly _currentRole = signal<RoleModel | null>(null);

    /** Users assigned to current role */
    private readonly _roleUsers = signal<User[]>([]);

    /** Current search/filter parameters */
    private readonly _currentFilters = signal<ListRolesParams | null>(null);

    // ============================================================================
    // Public Computed Properties (Reactive State)
    // ============================================================================

    /** Loading state for async operations */
    readonly loading = computed(() => this._loading());

    /** Current error state */
    readonly error = computed(() => this._error());

    /** List of roles */
    readonly roles = computed(() => this._roles());

    /** Current selected role */
    readonly currentRole = computed(() => this._currentRole());

    /** Users assigned to current role */
    readonly roleUsers = computed(() => this._roleUsers());

    /** Current search/filter parameters */
    readonly currentFilters = computed(() => this._currentFilters());

    /** Total count of roles */
    readonly totalRoles = computed(() => this._roles().length);

    /** Count of active roles */
    readonly activeRoles = computed(() => this._roles().filter((role) => role.isActive).length);

    /** Count of inactive roles */
    readonly inactiveRoles = computed(() => this._roles().filter((role) => !role.isActive).length);

    /** Whether any role is currently selected */
    readonly hasSelectedRole = computed(() => !!this._currentRole());

    // ============================================================================
    // Core CRUD Operations
    // ============================================================================

    /**
     * Refresh roles list with optional filters
     */
    async refresh(params?: ListRolesParams, opts?: FacadeOpts): Promise<void> {
        if (!opts?.skipLoading) {
            this._loading.set(true);
        }
        this._error.set(null);

        try {
            const entities = await this.listRolesUC.execute();
            this._currentFilters.set(params || null);

            // Apply client-side filtering if params provided
            const filteredEntities = params ? this.applyFilters(entities, params) : entities;

            const roleModels = filteredEntities.map(RoleViewMapper.toModel);
            this._roles.set(roleModels);
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._error.set(errorMessage);
            throw error;
        } finally {
            if (!opts?.skipLoading) {
                this._loading.set(false);
            }
        }
    }

    /**
     * Load specific role by ID and set as current
     */
    async loadRole(id: number, opts?: FacadeOpts): Promise<void> {
        if (!opts?.skipLoading) {
            this._loading.set(true);
        }
        this._error.set(null);

        try {
            const entity = await this.getRoleByIdUC.execute(id);
            const roleModel = RoleViewMapper.toModel(entity);
            this._currentRole.set(roleModel);
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._error.set(errorMessage);
            throw error;
        } finally {
            if (!opts?.skipLoading) {
                this._loading.set(false);
            }
        }
    }

    /**
     * Create new role
     */
    async createRole(
        roleData: {
            name: string;
            accessLevel: number;
            description: string;
            canLeadProjects?: boolean;
            isUniquePerTeam?: boolean;
        },
        opts?: FacadeOpts
    ): Promise<Role> {
        if (!opts?.skipLoading) {
            this._loading.set(true);
        }
        this._error.set(null);

        try {
            const entity = await this.createRoleUC.execute({
                name: roleData.name,
                accessLevel: roleData.accessLevel,
                description: roleData.description,
                canLeadProjects: roleData.canLeadProjects ?? false,
                isUniquePerTeam: roleData.isUniquePerTeam ?? false,
            });

            // Add to roles list
            const roleModel = RoleViewMapper.toModel(entity);
            this._roles.update((roles) => [roleModel, ...roles]);

            // Send success notification
            this.notifications.success(
                'Role created successfully',
                `Role "${roleData.name}" has been created.`
            );

            return entity;
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._error.set(errorMessage);
            throw error;
        } finally {
            if (!opts?.skipLoading) {
                this._loading.set(false);
            }
        }
    }

    /**
     * Update existing role
     */
    async updateRole(
        id: number,
        roleData: {
            name?: string;
            accessLevel?: number;
            description?: string;
            isActive?: boolean;
            canLeadProjects?: boolean;
            isUniquePerTeam?: boolean;
        },
        opts?: FacadeOpts
    ): Promise<Role> {
        if (!opts?.skipLoading) {
            this._loading.set(true);
        }
        this._error.set(null);

        try {
            const entity = await this.updateRoleUC.execute(id, roleData);
            const roleModel = RoleViewMapper.toModel(entity);

            // Update in roles list
            this._roles.update((roles) => roles.map((role) => (role.id === id ? roleModel : role)));

            // Update current role if it's the one being updated
            if (this._currentRole()?.id === id) {
                this._currentRole.set(roleModel);
            }

            // Send success notification
            this.notifications.success(
                'Role updated successfully',
                `Role "${entity.name}" has been updated.`
            );

            return entity;
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._error.set(errorMessage);
            throw error;
        } finally {
            if (!opts?.skipLoading) {
                this._loading.set(false);
            }
        }
    }

    /**
     * Delete role
     */
    async deleteRole(id: number, opts?: FacadeOpts): Promise<void> {
        if (!opts?.skipLoading) {
            this._loading.set(true);
        }
        this._error.set(null);

        try {
            console.log(`Deleting role with ID: ${id}`);
            await this.deleteRoleUC.execute(id);

            console.log(`Role with ID ${id} deleted successfully`);

            // Remove from roles list
            this._roles.update((roles) => roles.filter((role) => role.id !== id));

            // Clear current role if it was the deleted one
            if (this._currentRole()?.id === id) {
                this._currentRole.set(null);
                this._roleUsers.set([]);
            }

            // Send success notification
            this.notifications.success(
                'Role deleted successfully',
                'The role has been permanently removed.'
            );
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error as Error);

            this.notifications.notificationError(errorMessage, 'Failed to delete role');
        } finally {
            if (!opts?.skipLoading) {
                this._loading.set(false);
            }
        }
    }

    // ============================================================================
    // Query Operations
    // ============================================================================

    /**
     * Find role by name (without affecting state)
     */
    async findRoleByName(name: string): Promise<Role | null> {
        try {
            return await this.getRoleByNameUC.execute(name);
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._error.set(errorMessage);
            return null;
        }
    }

    /**
     * Load users assigned to a role
     */
    async loadRoleUsers(roleId: number, opts?: FacadeOpts): Promise<User[]> {
        if (!opts?.skipLoading) {
            this._loading.set(true);
        }

        try {
            const users = await this.getUsersByRoleUC.execute(roleId);
            this._roleUsers.set(users);
            return users;
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._error.set(errorMessage);
            throw error;
        } finally {
            if (!opts?.skipLoading) {
                this._loading.set(false);
            }
        }
    }

    // ============================================================================
    // State Management Operations
    // ============================================================================

    /**
     * Activate role
     */
    async activateRole(id: number, opts?: FacadeOpts): Promise<Role> {
        if (!opts?.skipLoading) {
            this._loading.set(true);
        }
        this._error.set(null);

        try {
            const entity = await this.activateRoleUC.execute(id);
            const roleModel = RoleViewMapper.toModel(entity);

            // Update in roles list
            this._roles.update((roles) => roles.map((role) => (role.id === id ? roleModel : role)));

            // Update current role if it's the one being activated
            if (this._currentRole()?.id === id) {
                this._currentRole.set(roleModel);
            }

            // Send success notification
            this.notifications.success('Role activated', `Role "${entity.name}" is now active.`);

            return entity;
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._error.set(errorMessage);
            throw error;
        } finally {
            if (!opts?.skipLoading) {
                this._loading.set(false);
            }
        }
    }

    /**
     * Deactivate role
     */
    async deactivateRole(id: number, opts?: FacadeOpts): Promise<Role> {
        if (!opts?.skipLoading) {
            this._loading.set(true);
        }
        this._error.set(null);

        try {
            const entity = await this.deactivateRoleUC.execute(id);
            const roleModel = RoleViewMapper.toModel(entity);

            // Update in roles list
            this._roles.update((roles) => roles.map((role) => (role.id === id ? roleModel : role)));

            // Update current role if it's the one being deactivated
            if (this._currentRole()?.id === id) {
                this._currentRole.set(roleModel);
            }

            // Send success notification
            this.notifications.success(
                'Role deactivated',
                `Role "${entity.name}" is now inactive.`
            );

            return entity;
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._error.set(errorMessage);
            throw error;
        } finally {
            if (!opts?.skipLoading) {
                this._loading.set(false);
            }
        }
    }

    /**
     * Toggle role activation status
     */
    async toggleRoleActivation(id: number, opts?: FacadeOpts): Promise<Role> {
        const currentRole = this._roles().find((role) => role.id === id);
        if (!currentRole) {
            throw new Error(`Role with ID ${id} not found`);
        }

        return currentRole.isActive
            ? await this.deactivateRole(id, opts)
            : await this.activateRole(id, opts);
    }

    // ============================================================================
    // Assignment Operations
    // ============================================================================

    /**
     * Assign role to user
     */
    async assignRoleToUser(roleId: number, userId: number, opts?: FacadeOpts): Promise<void> {
        if (!opts?.skipLoading) {
            this._loading.set(true);
        }
        this._error.set(null);

        try {
            await this.assignRoleToUserUC.execute({ roleId, userId });

            // Refresh role users if current role is affected
            if (this._currentRole()?.id === roleId) {
                await this.loadRoleUsers(roleId, { skipLoading: true });
            }

            // Send success notification
            this.notifications.success(
                'Role assigned',
                'Role has been successfully assigned to the user.'
            );
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._error.set(errorMessage);
            throw error;
        } finally {
            if (!opts?.skipLoading) {
                this._loading.set(false);
            }
        }
    }

    /**
     * Unassign role from user
     */
    async unassignRoleFromUser(roleId: number, userId: number, opts?: FacadeOpts): Promise<void> {
        if (!opts?.skipLoading) {
            this._loading.set(true);
        }
        this._error.set(null);

        try {
            await this.unassignRoleFromUserUC.execute({ roleId, userId });

            // Refresh role users if current role is affected
            if (this._currentRole()?.id === roleId) {
                await this.loadRoleUsers(roleId, { skipLoading: true });
            }

            // Send success notification
            this.notifications.success(
                'Role unassigned',
                'Role has been successfully unassigned from the user.'
            );
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._error.set(errorMessage);
            throw error;
        } finally {
            if (!opts?.skipLoading) {
                this._loading.set(false);
            }
        }
    }

    /**
     * Bulk assign role to multiple users
     */
    async bulkAssignRoleToUsers(
        roleId: number,
        userIds: number[],
        opts?: FacadeOpts
    ): Promise<void> {
        if (!opts?.skipLoading) {
            this._loading.set(true);
        }
        this._error.set(null);

        try {
            for (const userId of userIds) {
                await this.assignRoleToUserUC.execute({ roleId, userId });
            }

            // Refresh role users if current role is affected
            if (this._currentRole()?.id === roleId) {
                await this.loadRoleUsers(roleId, { skipLoading: true });
            }

            // Send success notification
            this.notifications.success(
                'Bulk assignment completed',
                `Role assigned to ${userIds.length} users successfully.`
            );
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._error.set(errorMessage);
            throw error;
        } finally {
            if (!opts?.skipLoading) {
                this._loading.set(false);
            }
        }
    }

    // ============================================================================
    // Bulk Operations
    // ============================================================================

    /**
     * Bulk create multiple roles
     */
    async bulkCreateRoles(
        rolesData: Array<{
            name: string;
            accessLevel: number;
            description: string;
            canLeadProjects?: boolean;
            isUniquePerTeam?: boolean;
        }>,
        opts?: FacadeOpts
    ): Promise<Role[]> {
        if (!opts?.skipLoading) {
            this._loading.set(true);
        }
        this._error.set(null);

        try {
            // Transform roles data to the format expected by the use case
            const request = {
                roles: rolesData.map((role) => ({
                    name: role.name,
                    accessLevel: role.accessLevel,
                    description: role.description,
                    canLeadProjects: role.canLeadProjects ?? false,
                    isUniquePerTeam: role.isUniquePerTeam ?? false,
                })),
                requestedBy: this.getCurrentUserId(), // Get from auth context
                continueOnError: true,
                validateOnly: false,
            };

            const response = await this.bulkCreateRolesUC.execute(request);

            // Extract successfully created roles from response
            const createdRoles = response.results
                .filter((result) => result.success && result.role)
                .map((result) => result.role!);

            // Add to roles list
            const roleModels = createdRoles.map(RoleViewMapper.toModel);
            this._roles.update((roles) => [...roleModels, ...roles]);

            // Send success notification with detailed summary
            const summary = response.summary;
            this.notifications.success(
                'Bulk creation completed',
                `Successfully created ${summary.successful} of ${summary.total} roles. ${
                    summary.failed > 0 ? `${summary.failed} failed.` : ''
                }`
            );

            return createdRoles;
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._error.set(errorMessage);
            throw error;
        } finally {
            if (!opts?.skipLoading) {
                this._loading.set(false);
            }
        }
    }

    /**
     * Bulk update multiple roles
     */
    async bulkUpdateRoles(
        updates: Array<{
            id: number;
            data: {
                name?: string;
                accessLevel?: number;
                description?: string;
                isActive?: boolean;
                canLeadProjects?: boolean;
                isUniquePerTeam?: boolean;
            };
        }>,
        opts?: FacadeOpts
    ): Promise<Role[]> {
        if (!opts?.skipLoading) {
            this._loading.set(true);
        }
        this._error.set(null);

        try {
            // Transform updates to the format expected by the use case
            const request = {
                roles: updates.map((update) => ({
                    id: update.id,
                    name: update.data.name,
                    accessLevel: update.data.accessLevel,
                    description: update.data.description,
                    canLeadProjects: update.data.canLeadProjects,
                    isUniquePerTeam: update.data.isUniquePerTeam,
                })),
                requestedBy: this.getCurrentUserId(), // Get from auth context
                continueOnError: true,
                optimisticLocking: false,
            };

            const response = await this.bulkUpdateRolesUC.execute(request);

            // Extract successfully updated roles from response
            const updatedRoles = response.results
                .filter((result) => result.success && result.updatedRole)
                .map((result) => result.updatedRole!);

            // Update roles in list
            const updatedRoleModels = updatedRoles.map(RoleViewMapper.toModel);
            this._roles.update((roles) => {
                const updatedMap = new Map(updatedRoleModels.map((role) => [role.id, role]));
                return roles.map((role) => updatedMap.get(role.id) || role);
            });

            // Update current role if it was updated
            const currentRole = this._currentRole();
            if (currentRole) {
                const updatedCurrent = updatedRoleModels.find((role) => role.id === currentRole.id);
                if (updatedCurrent) {
                    this._currentRole.set(updatedCurrent);
                }
            }

            // Send success notification with detailed summary
            const summary = response.summary;
            this.notifications.success(
                'Bulk update completed',
                `Successfully updated ${summary.successful} of ${summary.total} roles. ${
                    summary.failed > 0 ? `${summary.failed} failed.` : ''
                }`
            );

            return updatedRoles;
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._error.set(errorMessage);
            throw error;
        } finally {
            if (!opts?.skipLoading) {
                this._loading.set(false);
            }
        }
    }

    /**
     * Bulk delete multiple roles
     */
    async bulkDeleteRoles(roleIds: number[], opts?: FacadeOpts): Promise<void> {
        if (!opts?.skipLoading) {
            this._loading.set(true);
        }
        this._error.set(null);

        try {
            // Transform role IDs to the format expected by the use case
            const request = {
                roles: roleIds.map((id) => ({
                    id,
                    force: false, // Don't force delete by default
                })),
                requestedBy: this.getCurrentUserId(), // Get from auth context
                continueOnError: true,
                cascadeDelete: true, // Delete associated user assignments
            };

            const response = await this.bulkDeleteRolesUC.execute(request);

            // Remove successfully deleted roles from the list
            const deletedRoleIds = response.results
                .filter((result) => result.success)
                .map((result) => result.id);

            this._roles.update((roles) =>
                roles.filter((role) => !deletedRoleIds.includes(role.id))
            );

            // Clear current role if it was deleted
            const currentRole = this._currentRole();
            if (currentRole && deletedRoleIds.includes(currentRole.id)) {
                this._currentRole.set(null);
                this._roleUsers.set([]);
            }

            // Send success notification with detailed summary
            const summary = response.summary;
            this.notifications.success(
                'Bulk deletion completed',
                `Successfully deleted ${summary.successful} of ${summary.total} roles. ${
                    summary.failed > 0 ? `${summary.failed} failed.` : ''
                }`
            );
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._error.set(errorMessage);
            throw error;
        } finally {
            if (!opts?.skipLoading) {
                this._loading.set(false);
            }
        }
    }

    // ============================================================================
    // Export Operations
    // ============================================================================

    /**
     * Export roles to specified format
     * Uses RoleExportMapper for proper data transformation without Clean Architecture violations
     */
    async exportRoles(
        roleIds: number[],
        options: Partial<RoleExportOptions>,
        opts?: FacadeOpts
    ): Promise<void> {
        if (!opts?.skipLoading) {
            this._loading.set(true);
        }
        this._error.set(null);

        try {
            // Get roles from current state - these are already RoleModel instances
            const selectedRoleModels = this._roles().filter((roleModel) =>
                roleIds.includes(roleModel.id)
            );

            if (selectedRoleModels.length === 0) {
                throw new Error('No roles selected for export');
            }

            // Use the mapper to transform RoleModels to export data format
            const exportData: RoleExportData[] =
                RoleExportMapper.toExportFormat(selectedRoleModels);

            // Create proper export options using the mapper
            const exportOptions: RoleExportOptions = RoleExportMapper.createExportOptions({
                format: 'json', // Default format
                ...options, // Override with provided options
            });

            // Convert export data to domain entities only for the service call
            // This maintains Clean Architecture - domain conversion happens in Application layer
            const domainRoles = exportData.map((data) =>
                Role.create({
                    id: data.id,
                    name: RoleName.create(data.name),
                    accessLevel: AccessLevel.create(data.accessLevel),
                    isActive: data.isActive,
                    description: data.description || null,
                    userCount: data.userCount || 0,
                })
            );

            await this.roleExportService.exportRoles(domainRoles, exportOptions);

            // Send success notification
            this.notifications.success(
                'Export completed',
                `Successfully exported ${
                    selectedRoleModels.length
                } roles as ${exportOptions.format.toUpperCase()}.`
            );
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error as Error);
            this._error.set(errorMessage);
            this.notifications.notificationError(errorMessage, 'Export failed');
            throw error;
        } finally {
            if (!opts?.skipLoading) {
                this._loading.set(false);
            }
        }
    }

    // ============================================================================
    // Utility Methods
    // ============================================================================

    /**
     * Clear current error state
     */
    clearError(): void {
        this._error.set(null);
    }

    /**
     * Clear current role selection
     */
    clearCurrentRole(): void {
        this._currentRole.set(null);
        this._roleUsers.set([]);
    }

    /**
     * Reset facade state (useful for testing or cleanup)
     */
    reset(): void {
        this._loading.set(false);
        this._error.set(null);
        this._roles.set([]);
        this._currentRole.set(null);
        this._roleUsers.set([]);
        this._currentFilters.set(null);
    }

    /**
     * Get role statistics
     */
    getRoleStatistics() {
        const roles = this._roles();
        return {
            total: roles.length,
            active: roles.filter((role) => role.isActive).length,
            inactive: roles.filter((role) => !role.isActive).length,
            byAccessLevel: roles.reduce((acc, role) => {
                acc[role.accessLevel] = (acc[role.accessLevel] || 0) + 1;
                return acc;
            }, {} as Record<number, number>),
        };
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    /**
     * Get current user ID for operations requiring requestedBy
     */
    private getCurrentUserId(): number {
        const user = this.authFacade.user();
        if (!user) {
            throw new Error('User not authenticated. Please log in to perform this operation.');
        }
        return user.id;
    }

    /**
     * Apply client-side filters to roles list
     */
    private applyFilters(roles: Role[], params: ListRolesParams): Role[] {
        return roles.filter((role) => {
            const matchesSearch = params.search
                ? role.name.toLowerCase().includes(params.search.toLowerCase())
                : true;

            const matchesActive =
                params.active !== undefined && params.active !== null
                    ? role.isActive === params.active
                    : true;

            return matchesSearch && matchesActive;
        });
    }
}
