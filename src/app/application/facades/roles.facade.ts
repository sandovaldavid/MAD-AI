import { Injectable, inject, signal, computed } from '@angular/core';
import { ListRoles } from '../use-cases/roles/list-roles.usecase';
import { GetRoleById } from '../use-cases/roles/get-role-by-id.usecase';
import { CreateRole } from '../use-cases/roles/create-role.usecase';
import { UpdateRole } from '../use-cases/roles/update-role.usecase';
import { DeleteRole } from '../use-cases/roles/delete-role.usecase';
import { RoleViewMapper } from '@presentation/features/roles/mappers/role.view-mapper';
import { RoleModel } from '@presentation/features/roles/models/role.model';
import { createFacadeErrorHandler } from '@core/errors/facade-error.handler';
import { NotificationsFacade } from './notifications.facade';
import type { ListRolesParams } from '@domain/repositories/role.repository';

@Injectable({ providedIn: 'root' })
export class RolesFacade {
    private listRoles = inject(ListRoles);
    private getById = inject(GetRoleById);
    private createUC = inject(CreateRole);
    private updateUC = inject(UpdateRole);
    private deleteUC = inject(DeleteRole);
    private notify = inject(NotificationsFacade);

    // Enhanced error handling for roles feature
    private errorHandler = createFacadeErrorHandler('roles');

    private _loading = signal(false);
    private _error = signal<string | null>(null);
    private _roles = signal<RoleModel[]>([]);
    private _current = signal<RoleModel | null>(null);

    readonly loading = computed(() => this._loading());
    readonly error = computed(() => this._error());
    readonly roles = computed(() => this._roles());
    readonly current = computed(() => this._current());

    async refresh(params?: ListRolesParams) {
        this._loading.set(true);
        this._error.set(null);
        try {
            const entities = await this.listRoles.execute();
            console.log('Roles fetched:', entities);
            console.log('Filter params:', params);
            const filteredEntities = entities.filter((role) => {
                const matchesSearch = params?.search
                    ? role.name.toLowerCase().includes(params.search.toLowerCase())
                    : true;
                const matchesActive =
                    params?.active !== undefined && params.active !== null
                        ? role.isActive === params.active
                        : true;
                return matchesSearch && matchesActive;
            });
            this._roles.set(filteredEntities.map(RoleViewMapper.toModel));
        } catch (e: any) {
            const errorMessage = this.errorHandler.transformError(e, 'get-roles');
            this._error.set(errorMessage);
            this.notify.error(errorMessage);
        } finally {
            this._loading.set(false);
        }
    }

    async load(id: number) {
        this._loading.set(true);
        this._error.set(null);
        try {
            this._current.set(RoleViewMapper.toModel(await this.getById.execute(id)));
        } catch (e: any) {
            const errorMessage = this.errorHandler.transformError(e, 'get-role');
            this._error.set(errorMessage);
            this.notify.error(errorMessage);
        } finally {
            this._loading.set(false);
        }
    }

    async create(p: { name: string; accessLevel: number; description?: string }) {
        this._loading.set(true);
        this._error.set(null);
        try {
            const entity = await this.createUC.execute(p);
            this._roles.update((list) => [RoleViewMapper.toModel(entity), ...list]);
            this.notify.success(`Rol "${p.name}" creado exitosamente`);
            return entity;
        } catch (e: any) {
            const errorMessage = this.errorHandler.transformError(e, 'create-role');
            this._error.set(errorMessage);
            this.notify.error(errorMessage);
            throw e;
        } finally {
            this._loading.set(false);
        }
    }

    async update(
        id: number,
        p: { name?: string; accessLevel?: number; description?: string; isActive?: boolean }
    ) {
        this._loading.set(true);
        this._error.set(null);
        try {
            const entity = await this.updateUC.execute(id, p);
            const updated = RoleViewMapper.toModel(entity);
            this._roles.update((list) => list.map((r) => (r.id === id ? updated : r)));
            if (this._current()?.id === id) this._current.set(updated);
            this.notify.success(`Rol actualizado exitosamente`);
            return entity;
        } catch (e: any) {
            const errorMessage = this.errorHandler.transformError(e, 'update-role');
            this._error.set(errorMessage);
            this.notify.error(errorMessage);
            throw e;
        } finally {
            this._loading.set(false);
        }
    }

    async toggleStatus(id: number, active: boolean) {
        this._loading.set(true);
        this._error.set(null);
        try {
            const entity = await this.updateUC.execute(id, { isActive: !active });

            // Actualizar la lista local con el nuevo estado
            const updated = RoleViewMapper.toModel(entity);
            this._roles.update((list) => list.map((r) => (r.id === id ? updated : r)));

            // Actualizar el rol actual si es el mismo
            if (this._current()?.id === id) {
                this._current.set(updated);
            }

            this.notify.success(
                `Rol ${entity.name} ${active ? 'desactivado' : 'activado'} exitosamente`
            );
        } catch (e: any) {
            const errorMessage = this.errorHandler.transformError(e, 'toggle-role-status');
            this._error.set(errorMessage);
            this.notify.error(errorMessage);
            throw e;
        } finally {
            this._loading.set(false);
        }
    }

    async delete(id: number) {
        this._loading.set(true);
        this._error.set(null);
        try {
            await this.deleteUC.execute(id);
            this._roles.update((list) => list.filter((r) => r.id !== id));
            if (this._current()?.id === id) this._current.set(null);
            this.notify.success('Rol eliminado exitosamente');
        } catch (e: any) {
            const errorMessage = this.errorHandler.transformError(e, 'delete-role');
            this._error.set(errorMessage);
            this.notify.error(errorMessage);
            throw e;
        } finally {
            this._loading.set(false);
        }
    }

    async detail(id: number) {
        this._loading.set(true);
        this._error.set(null);
        try {
            const entity = await this.getById.execute(id);
            this._current.set(RoleViewMapper.toModel(entity));
        } catch (e: any) {
            const errorMessage = this.errorHandler.transformError(e, 'get-role');
            this._error.set(errorMessage);
            this.notify.error(errorMessage);
        } finally {
            this._loading.set(false);
        }
    }
}
