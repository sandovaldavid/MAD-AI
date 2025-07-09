import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RoleRepository } from '@domain/repositories/role.repository';
import { RoleListModel } from '@domain/models/role/role-list.model';
import { RoleModel } from '@domain/models/role/role.model';
import { AssignRoleModel } from '@domain/models/role/assign-role.model';
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
export class RoleRepositoryImpl implements RoleRepository {
    constructor(private readonly roleApi: RoleApiService) {}

    getRoles(): Observable<RoleListModel[]> {
        return this.roleApi.getRoles().pipe(map((roles) => roles.map(this.mapRoleResponseToModel)));
    }

    getRoleById(id: number): Observable<RoleModel> {
        return this.roleApi.getRoleById(id).pipe(map(this.mapRoleDetailResponseToModel));
    }

    assignRole(assignRoleModel: AssignRoleModel): Observable<void> {
        const dto: AssignRoleRequestDto = {
            user_id: assignRoleModel.user_id,
            role_id: assignRoleModel.role_id,
            assigned_by_user_id: assignRoleModel.assigned_by_user_id,
        };
        return this.roleApi.assignRole(dto);
    }

    updateRole(id: number, updateRoleModel: UpdateRoleModel): Observable<RoleModel> {
        const dto: UpdateRoleRequestDto = {
            name: updateRoleModel.name,
            description: updateRoleModel.description,
            access_level: updateRoleModel.access_level,
            can_lead_projects: updateRoleModel.can_lead_projects,
            is_unique_per_team: updateRoleModel.is_unique_per_team,
            is_active: updateRoleModel.is_active,
        };
        return this.roleApi.updateRole(id, dto).pipe(map(this.mapUpdateRoleResponseToModel));
    }

    createRole(createRoleModel: CreateRoleModel): Observable<RoleModel> {
        const dto: CreateRoleRequestDto = {
            name: createRoleModel.name,
            description: createRoleModel.description,
            access_level: createRoleModel.access_level,
            can_lead_projects: createRoleModel.can_lead_projects ?? false,
            is_unique_per_team: createRoleModel.is_unique_per_team ?? false,
            created_by_user_id: createRoleModel.created_by_user_id,
        };
        return this.roleApi.createRole(dto).pipe(map(this.mapCreateRoleResponseToModel));
    }

    deleteRole(id: number): Observable<void> {
        return this.roleApi.deleteRole(id);
    }

    private mapRoleResponseToModel(dto: RoleResponseDto): RoleListModel {
        return {
            id: dto.id,
            name: dto.name,
            description: dto.description,
            access_level: dto.access_level as RoleAccessLevel,
            is_active: dto.is_active,
            user_count: dto.user_count,
        };
    }

    private mapRoleDetailResponseToModel(dto: RoleDetailResponseDto): RoleModel {
        return {
            id: dto.id,
            name: dto.name,
            description: dto.description,
            access_level: dto.access_level as RoleAccessLevel,
            can_lead_projects: dto.can_lead_projects,
            is_unique_per_team: dto.is_unique_per_team,
            is_active: dto.is_active,
            created_at: dto.created_at,
            user_count: dto.user_count,
        };
    }

    private mapUpdateRoleResponseToModel(dto: UpdateRoleResponseDto): RoleModel {
        return {
            id: dto.id,
            name: dto.name,
            description: dto.description,
            access_level: dto.access_level as RoleAccessLevel,
            can_lead_projects: dto.can_lead_projects,
            is_unique_per_team: dto.is_unique_per_team,
            is_active: dto.is_active,
            created_at: dto.created_at,
            user_count: dto.user_count,
        };
    }

    private mapCreateRoleResponseToModel(dto: CreateRoleResponseDto): RoleModel {
        return {
            id: dto.id,
            name: dto.name,
            description: dto.description,
            access_level: dto.access_level as RoleAccessLevel,
            can_lead_projects: dto.can_lead_projects,
            is_unique_per_team: dto.is_unique_per_team,
            is_active: dto.is_active,
            created_at: dto.created_at,
            user_count: dto.user_count,
        };
    }
}
