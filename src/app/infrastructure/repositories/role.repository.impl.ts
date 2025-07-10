import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RoleRepository } from '@domain/repositories/role.repository';
import { RoleEntity } from '@domain/entities/role.entity';
import {
    AssignRoleData,
    UnassignRoleData,
    UpdateRoleData,
    CreateRoleData,
} from '@domain/models/role/role.dto';
import { RoleApiService } from '../api/role.api';
import { RoleResponseDto } from '../dto/role/role-response.dto';
import { RoleDetailResponseDto } from '../dto/role/role-detail-response.dto';
import { AssignRoleRequestDto } from '../dto/role/assign-role-request.dto';
import { UpdateRoleRequestDto } from '../dto/role/update-role-request.dto';
import { UpdateRoleResponseDto } from '../dto/role/update-role-response.dto';
import { CreateRoleRequestDto } from '../dto/role/create-role-request.dto';
import { CreateRoleResponseDto } from '../dto/role/create-role-response.dto';
import { RoleAccessLevel } from '@domain/enums/role-access-level.enum';

@Injectable({
    providedIn: 'root',
})
export class RoleRepositoryImpl extends RoleRepository {
    constructor(private readonly roleApi: RoleApiService) {
        super();
    }

    getRoles(): Observable<RoleEntity[]> {
        return this.roleApi
            .getRoles()
            .pipe(map((roles) => roles.map(this.mapRoleResponseToEntity)));
    }

    getRoleById(id: number): Observable<RoleEntity> {
        return this.roleApi.getRoleById(id).pipe(map(this.mapRoleDetailResponseToEntity));
    }

    assignRole(assignRoleData: AssignRoleData): Observable<void> {
        const dto: AssignRoleRequestDto = {
            user_id: assignRoleData.userId,
            role_id: assignRoleData.roleId,
            assigned_by_user_id: assignRoleData.assignedByUserId,
        };
        return this.roleApi.assignRole(dto);
    }

    unassignRole(unassignRoleData: UnassignRoleData): Observable<void> {
        return this.roleApi.unassignRole({
            user_id: unassignRoleData.userId,
        });
    }

    updateRole(id: number, updateRoleData: UpdateRoleData): Observable<RoleEntity> {
        const dto: UpdateRoleRequestDto = {
            name: updateRoleData.name,
            description: updateRoleData.description,
            access_level: updateRoleData.accessLevel,
            can_lead_projects: updateRoleData.canLeadProjects,
            is_unique_per_team: updateRoleData.isUniquePerTeam,
            is_active: updateRoleData.isActive,
        };
        return this.roleApi.updateRole(id, dto).pipe(map(this.mapUpdateRoleResponseToEntity));
    }

    createRole(createRoleData: CreateRoleData): Observable<RoleEntity> {
        const dto: CreateRoleRequestDto = {
            name: createRoleData.name,
            description: createRoleData.description,
            access_level: createRoleData.accessLevel,
            can_lead_projects: createRoleData.canLeadProjects ?? false,
            is_unique_per_team: createRoleData.isUniquePerTeam ?? false,
            created_by_user_id: createRoleData.createdByUserId,
        };
        return this.roleApi.createRole(dto).pipe(map(this.mapCreateRoleResponseToEntity));
    }

    deleteRole(id: number): Observable<void> {
        return this.roleApi.deleteRole(id);
    }

    private mapRoleResponseToEntity(dto: RoleResponseDto): RoleEntity {
        return new RoleEntity({
            id: dto.id,
            name: dto.name,
            description: dto.description,
            accessLevel: dto.access_level as RoleAccessLevel,
            isActive: dto.is_active,
            userCount: dto.user_count,
            createdAt: new Date(),
        });
    }

    private mapRoleDetailResponseToEntity(dto: RoleDetailResponseDto): RoleEntity {
        return new RoleEntity({
            id: dto.id,
            name: dto.name,
            description: dto.description,
            accessLevel: dto.access_level as RoleAccessLevel,
            canLeadProjects: dto.can_lead_projects,
            isUniquePerTeam: dto.is_unique_per_team,
            isActive: dto.is_active,
            createdAt: new Date(dto.created_at),
            userCount: dto.user_count,
        });
    }

    private mapUpdateRoleResponseToEntity(dto: UpdateRoleResponseDto): RoleEntity {
        return new RoleEntity({
            id: dto.id,
            name: dto.name,
            description: dto.description,
            accessLevel: dto.access_level as RoleAccessLevel,
            canLeadProjects: dto.can_lead_projects,
            isUniquePerTeam: dto.is_unique_per_team,
            isActive: dto.is_active,
            createdAt: new Date(dto.created_at),
            userCount: dto.user_count,
        });
    }

    private mapCreateRoleResponseToEntity(dto: CreateRoleResponseDto): RoleEntity {
        return new RoleEntity({
            id: dto.id,
            name: dto.name,
            description: dto.description,
            accessLevel: dto.access_level as RoleAccessLevel,
            canLeadProjects: dto.can_lead_projects,
            isUniquePerTeam: dto.is_unique_per_team,
            isActive: dto.is_active,
            createdAt: new Date(dto.created_at),
            userCount: dto.user_count,
        });
    }
}
