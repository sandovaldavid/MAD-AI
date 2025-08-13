import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RoleRepository } from '@domain/repositories/role.repository';
import { Role } from '@domain/entities/role.entity';
import { RoleDTO } from '../dtos/roles/roles.dto';
import { RoleMapper } from '../mappers/role.mapper';
import { environment } from '@/env/environment.prod';
import type { AssignRolePayload, UnassignRolePayload } from '@domain/repositories/role.repository';
import type { AssignRoleRequestDTO } from '../dtos/roles/assign.dto';
import type { UnassignRoleRequestDTO } from '../dtos/roles/unassign.dto';

const API = `${environment.API_URL}/roles`;

export class HttpRoleRepository implements RoleRepository {
    private http = inject(HttpClient);

    async list(params?: { search?: string; active?: boolean | null }): Promise<Role[]> {
        const dtos = await firstValueFrom(
            this.http.get<RoleDTO[]>(API, {
                params: { search: params?.search ?? '', active: params?.active ?? '' },
            })
        );
        return dtos.map(RoleMapper.toEntity);
    }

    async getById(id: number): Promise<Role> {
        const dto = await firstValueFrom(this.http.get<RoleDTO>(`${API}/${id}/`));
        return RoleMapper.toEntity(dto);
    }

    async create(payload: {
        name: string;
        accessLevel: number;
        description?: string;
    }): Promise<Role> {
        const dto = await firstValueFrom(
            this.http.post<RoleDTO>(API, {
                name: payload.name,
                access_level: payload.accessLevel,
                description: payload.description ?? '',
            })
        );
        return RoleMapper.toEntity(dto);
    }

    async update(
        id: number,
        payload: { name?: string; accessLevel?: number; description?: string }
    ): Promise<Role> {
        const dto = await firstValueFrom(
            this.http.put<RoleDTO>(`${API}/${id}/`, {
                name: payload.name,
                access_level: payload.accessLevel,
                description: payload.description,
            })
        );
        return RoleMapper.toEntity(dto);
    }

    async delete(id: number): Promise<void> {
        await firstValueFrom(this.http.delete<void>(`${API}/${id}/`));
    }

    async assign(p: AssignRolePayload): Promise<void> {
        if (p.assignedByUserId == null) throw new Error('assignedByUserId requerido');
        const body: AssignRoleRequestDTO = {
            user_id: p.userId,
            role_id: p.roleId,
            assigned_by_user_id: p.assignedByUserId,
        };
        await firstValueFrom(this.http.post<void>(`${API}/assign/`, body));
    }

    async unassign(p: UnassignRolePayload): Promise<void> {
        const body: UnassignRoleRequestDTO = { user_id: p.userId };
        await firstValueFrom(this.http.post<void>(`${API}/unassign/`, body));
    }
}
