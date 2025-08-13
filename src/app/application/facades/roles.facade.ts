import { inject, signal, computed } from '@angular/core';
import { ListRoles } from '../use-cases/roles/list-roles.usecase';
import { GetRoleById } from '../use-cases/roles/get-role-by-id.usecase';
import { CreateRole } from '../use-cases/roles/create-role.usecase';
import { UpdateRole } from '../use-cases/roles/update-role.usecase';
import { DeleteRole } from '../use-cases/roles/delete-role.usecase';
import { RoleViewMapper } from '@presentation/features/roles/mappers/role.view-mapper';
import { RoleModel } from '@presentation/features/roles/models/role.model';
import type { ListRolesParams } from '@domain/repositories/role.repository';

export class RolesFacade {
    private listRoles = inject(ListRoles);
    private getById = inject(GetRoleById);
    private createUC = inject(CreateRole);
    private updateUC = inject(UpdateRole);
    private deleteUC = inject(DeleteRole);

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
            const entities = await this.listRoles.execute(params);
            this._roles.set(entities.map(RoleViewMapper.toModel));
        } catch (e: any) {
            this._error.set(e?.message ?? 'Error');
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
            this._error.set(e?.message ?? 'Error');
        } finally {
            this._loading.set(false);
        }
    }

    async create(p: { name: string; accessLevel: number; description?: string }) {
        const entity = await this.createUC.execute(p);
        this._roles.update((list) => [RoleViewMapper.toModel(entity), ...list]);
    }

    async update(id: number, p: { name?: string; accessLevel?: number; description?: string }) {
        const entity = await this.updateUC.execute(id, p);
        const updated = RoleViewMapper.toModel(entity);
        this._roles.update((list) => list.map((r) => (r.id === id ? updated : r)));
        if (this._current()?.id === id) this._current.set(updated);
    }

    async delete(id: number) {
        await this.deleteUC.execute(id);
        this._roles.update((list) => list.filter((r) => r.id !== id));
        if (this._current()?.id === id) this._current.set(null);
    }
}
