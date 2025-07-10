import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RoleRepository } from '@domain/repositories/role.repository';
import { RoleEntity } from '@domain/entities/role.entity';
import { AssignRoleModel } from '@domain/models/role/assign-role.model';
import { UnassignRoleModel } from '@domain/models/role/unassign-role.model';
import { UpdateRoleModel } from '@domain/models/role/update-role.model';
import { CreateRoleModel } from '@domain/models/role/create-role.model';
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

    assignRole(assignRoleModel: AssignRoleModel): Observable<void> {
        const dto: AssignRoleRequestDto = {
            user_id: assignRoleModel.user_id,
            role_id: assignRoleModel.role_id,
            assigned_by_user_id: assignRoleModel.assigned_by_user_id,
        };
        return this.roleApi.assignRole(dto);
    }

    unassignRole(unassignRoleModel: UnassignRoleModel): Observable<void> {
        return this.roleApi.unassignRole({
            user_id: unassignRoleModel.user_id,
        });
    }

    updateRole(id: number, updateRoleModel: UpdateRoleModel): Observable<RoleEntity> {
        const dto: UpdateRoleRequestDto = {
            name: updateRoleModel.name,
            description: updateRoleModel.description,
            access_level: updateRoleModel.access_level,
            can_lead_projects: updateRoleModel.can_lead_projects,
            is_unique_per_team: updateRoleModel.is_unique_per_team,
            is_active: updateRoleModel.is_active,
        };
        return this.roleApi.updateRole(id, dto).pipe(map(this.mapUpdateRoleResponseToEntity));
    }

    createRole(createRoleModel: CreateRoleModel): Observable<RoleEntity> {
        const dto: CreateRoleRequestDto = {
            name: createRoleModel.name,
            description: createRoleModel.description,
            access_level: createRoleModel.access_level,
            can_lead_projects: createRoleModel.can_lead_projects ?? false,
            is_unique_per_team: createRoleModel.is_unique_per_team ?? false,
            created_by_user_id: createRoleModel.created_by_user_id,
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
