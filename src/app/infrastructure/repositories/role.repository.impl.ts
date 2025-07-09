import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RoleRepository } from '@domain/repositories/role.repository';
import { RoleListModel } from '@domain/models/role/role-list.model';
import { RoleModel } from '@domain/models/role/role.model';
import { AssignRoleModel } from '@domain/models/role/assign-role.model';
import { RoleApiService } from '../api/role.api';
import { RoleResponseDto } from '../dto/role/role-response.dto';
import { RoleDetailResponseDto } from '../dto/role/role-detail-response.dto';
import { AssignRoleRequestDto } from '../dto/role/assign-role-request.dto';
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
}
