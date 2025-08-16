import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { firstValueFrom, catchError } from 'rxjs';
import { RoleRepository } from '@domain/repositories/role.repository';
import { Role } from '@domain/entities/role.entity';
import { RoleDTO } from '../dtos/roles/roles.dto';
import { RoleMapper, mapUpdatePayloadToDTO } from '../mappers/role.mapper';
import { environment } from '@/env/environment';
import type {
    AssignRolePayload,
    UnassignRolePayload,
    UpdateRolePayload,
} from '@domain/repositories/role.repository';
import type { AssignRoleRequestDTO } from '../dtos/roles/assign.dto';
import type { UnassignRoleRequestDTO } from '../dtos/roles/unassign.dto';
import { RequestUpdateRoleDTO } from '../dtos/roles/update.dto';
import { CreateRoleRequestDTO } from '../dtos/roles/create.dto';

const API = `${environment.API_URL}/auth/roles`;

export class HttpRoleRepository implements RoleRepository {
    private http = inject(HttpClient);

    async list(params?: { search?: string; active?: boolean }): Promise<Role[]> {
        try {
            // Construir parámetros de consulta
            let httpParams = new HttpParams();
            if (params?.search) {
                httpParams = httpParams.set('search', params.search);
            }
            if (params?.active !== undefined) {
                httpParams = httpParams.set('active', params.active.toString());
            }

            const dtos = await firstValueFrom(
                this.http
                    .get<RoleDTO[]>(`${API}/`, { params: httpParams })
                    .pipe(catchError(this.handleError))
            );
            return dtos.map(RoleMapper.toEntity);
        } catch (error) {
            throw this.transformError(error);
        }
    }

    async getById(id: number): Promise<Role> {
        try {
            const dto = await firstValueFrom(
                this.http.get<RoleDTO>(`${API}/${id}/`).pipe(catchError(this.handleError))
            );
            return RoleMapper.toEntity(dto);
        } catch (error) {
            throw this.transformError(error);
        }
    }

    async create(payload: {
        name: string;
        accessLevel: number;
        description?: string;
    }): Promise<Role> {
        try {
            // Usar DTO completo para el request - los campos faltantes con valores por defecto
            const requestDto: CreateRoleRequestDTO = {
                name: payload.name,
                access_level: payload.accessLevel,
                description: payload.description ?? '',
                can_lead_projects: false, // Valor por defecto
                is_unique_per_team: false, // Valor por defecto
                created_by_user_id: 1, // TODO: Obtener del contexto de usuario actual
            };

            const dto = await firstValueFrom(
                this.http.post<RoleDTO>(API, requestDto).pipe(catchError(this.handleError))
            );
            return RoleMapper.toEntity(dto);
        } catch (error) {
            throw this.transformError(error);
        }
    }

    async update(id: number, payload: UpdateRolePayload): Promise<Role> {
        try {
            // Usar el mapper centralizado para transformar payload del dominio a DTO de la API
            const requestDto: RequestUpdateRoleDTO = mapUpdatePayloadToDTO(payload);

            const dto = await firstValueFrom(
                this.http
                    .put<RoleDTO>(`${API}/${id}/update/`, requestDto)
                    .pipe(catchError(this.handleError))
            );
            return RoleMapper.toEntity(dto);
        } catch (error) {
            throw this.transformError(error);
        }
    }

    async delete(id: number): Promise<void> {
        try {
            await firstValueFrom(
                this.http.delete<void>(`${API}/${id}/`).pipe(catchError(this.handleError))
            );
        } catch (error) {
            throw this.transformError(error);
        }
    }

    async assign(p: AssignRolePayload): Promise<void> {
        try {
            if (p.assignedByUserId == null) {
                throw new Error('assignedByUserId requerido');
            }

            const body: AssignRoleRequestDTO = {
                user_id: p.userId,
                role_id: p.roleId,
                assigned_by_user_id: p.assignedByUserId,
            };

            await firstValueFrom(
                this.http.post<void>(`${API}/assign/`, body).pipe(catchError(this.handleError))
            );
        } catch (error) {
            throw this.transformError(error);
        }
    }

    async unassign(p: UnassignRolePayload): Promise<void> {
        try {
            const body: UnassignRoleRequestDTO = { user_id: p.userId };
            await firstValueFrom(
                this.http.post<void>(`${API}/unassign/`, body).pipe(catchError(this.handleError))
            );
        } catch (error) {
            throw this.transformError(error);
        }
    }

    /**
     * Maneja errores HTTP y los transforma a observables de error
     */
    private handleError = (error: HttpErrorResponse) => {
        console.error('HTTP Error:', error);
        throw error;
    };

    /**
     * Transforma errores HTTP a errores de dominio
     */
    private transformError(error: any): Error {
        if (error instanceof HttpErrorResponse) {
            switch (error.status) {
                case 400:
                    return new Error('Datos inválidos proporcionados');
                case 401:
                    return new Error('No autorizado para realizar esta operación');
                case 403:
                    return new Error('No tiene permisos para realizar esta operación');
                case 404:
                    return new Error('Rol no encontrado');
                case 409:
                    return new Error('El rol ya existe o está en uso');
                case 500:
                    return new Error('Error interno del servidor');
                default:
                    return new Error(`Error del servidor: ${error.status}`);
            }
        }

        if (error instanceof Error) {
            return error;
        }

        return new Error('Error desconocido');
    }
}
