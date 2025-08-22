import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { firstValueFrom, catchError } from 'rxjs';
import { RoleRepository } from '@domain/repositories/business/role.repository';
import { Role } from '@domain/entities/role.entity';
import { RoleDTO } from '../dtos/roles/roles.dto';
import { RoleMapper, mapUpdatePayloadToDTO } from '../mappers/role.mapper';
import { environment } from '@/env/environment';
import type {
    RoleAssignmentContract,
    UpdateRolePatchContract,
    CreateRoleContract,
} from '@domain/contracts/role.contract';
import type { AssignRoleRequestDTO } from '../dtos/roles/assign.dto';
import type { UnassignRoleRequestDTO } from '../dtos/roles/unassign.dto';
import { RequestUpdateRoleDTO } from '../dtos/roles/update.dto';
import { CreateRoleRequestDTO } from '../dtos/roles/create.dto';
import { InfraErrorToDomainMapper } from '../errors/infra-to-domain.mapper';
import { mapHttpErrorToInfra, type InfraError } from '../errors/http-to-infra.mapper';
import { AUTH_USER_STORE_PORT } from '@di/tokens';
import type { AuthUserStorePort } from '@domain/repositories/session/session-store.repository';

const API = `${environment.API_URL}/auth/roles`;

export class HttpRoleRepository implements RoleRepository {
    private http = inject(HttpClient);
    private errorMapper = inject(InfraErrorToDomainMapper);
    private userStore = inject<AuthUserStorePort>(AUTH_USER_STORE_PORT);

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
        } catch (infraError: unknown) {
            const domainError = this.errorMapper.mapError(infraError as InfraError, {
                operation: 'list',
                entityType: 'Role',
            });
            throw domainError;
        }
    }

    async getById(id: number): Promise<Role> {
        try {
            const dto = await firstValueFrom(
                this.http.get<RoleDTO>(`${API}/${id}/`).pipe(catchError(this.handleError))
            );
            return RoleMapper.toEntity(dto);
        } catch (infraError: unknown) {
            const domainError = this.errorMapper.mapError(infraError as InfraError, {
                operation: 'getById',
                entityType: 'Role',
                field: 'id',
            });
            throw domainError;
        }
    }

    async create(spec: CreateRoleContract): Promise<Role> {
        try {
            // Get current user ID from the authenticated user store
            const currentUserSnapshot = await this.userStore.read();
            if (!currentUserSnapshot?.id) {
                throw new Error('Cannot create role: No authenticated user found');
            }

            // Use complete DTO for the request with proper user context
            const requestDto: CreateRoleRequestDTO = {
                name: spec.name,
                access_level: spec.accessLevel,
                description: spec.description,
                can_lead_projects: spec.canLeadProjects,
                is_unique_per_team: spec.isUniquePerTeam,
                created_by_user_id: currentUserSnapshot.id, // Current authenticated user ID
            };

            const dto = await firstValueFrom(
                this.http
                    .post<RoleDTO>(`${API}/create/`, requestDto)
                    .pipe(catchError(this.handleError))
            );
            
            return RoleMapper.toEntity(dto);
        } catch (infraError: unknown) {
            const domainError = this.errorMapper.mapError(infraError as InfraError, {
                operation: 'create',
                entityType: 'Role',
                field: 'name',
            });
            throw domainError;
        }
    }

    async update(id: number, payload: UpdateRolePatchContract): Promise<Role> {
        try {
            // Usar el mapper centralizado para transformar payload del dominio a DTO de la API
            const requestDto: RequestUpdateRoleDTO = mapUpdatePayloadToDTO(payload);

            const dto = await firstValueFrom(
                this.http
                    .put<RoleDTO>(`${API}/${id}/update/`, requestDto)
                    .pipe(catchError(this.handleError))
            );
            return RoleMapper.toEntity(dto);
        } catch (infraError: unknown) {
            const domainError = this.errorMapper.mapError(infraError as InfraError, {
                operation: 'update',
                entityType: 'Role',
                field: 'id',
            });
            throw domainError;
        }
    }

    async delete(id: number): Promise<void> {
        try {
            await firstValueFrom(
                this.http.delete<void>(`${API}/${id}/delete/`).pipe(catchError(this.handleError))
            );
        } catch (infraError: unknown) {
            const domainError = this.errorMapper.mapError(infraError as InfraError, {
                operation: 'delete',
                entityType: 'Role',
                field: 'id',
            });
            throw domainError;
        }
    }

    async assign(p: RoleAssignmentContract): Promise<void> {
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
        } catch (infraError: unknown) {
            const domainError = this.errorMapper.mapError(infraError as InfraError, {
                operation: 'assign',
                entityType: 'Role',
                field: 'roleId',
            });
            throw domainError;
        }
    }

    async unassign(p: { roleId: number; userId: number }): Promise<void> {
        try {
            const body: UnassignRoleRequestDTO = { user_id: p.userId };
            await firstValueFrom(
                this.http.post<void>(`${API}/unassign/`, body).pipe(catchError(this.handleError))
            );
        } catch (infraError: unknown) {
            const domainError = this.errorMapper.mapError(infraError as InfraError, {
                operation: 'unassign',
                entityType: 'Role',
                field: 'roleId',
            });
            throw domainError;
        }
    }

    /**
     * Handles HTTP errors and transforms them to infrastructure errors
     */
    private handleError = (error: HttpErrorResponse) => {
        console.error('HTTP Error:', error);
        const infraError = mapHttpErrorToInfra(error);
        throw infraError;
    };
}
