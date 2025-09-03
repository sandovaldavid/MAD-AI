import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RoleRepository } from '@domain/repositories/business/role.repository';
import { Role } from '@domain/entities/role.entity';
import { RoleMapper, mapUpdatePayloadToDTO } from '@infrastructure/mappers/role.mapper';
import type {
  RoleAssignmentContract,
  UpdateRolePatchContract,
  CreateRoleContract,
} from '@domain/repositories/business/role.contract';
import type { AssignRoleRequestDTO } from '@infrastructure/dtos/roles/assign.dto';
import type { UnassignRoleRequestDTO } from '@infrastructure/dtos/roles/unassign.dto';
import { RequestUpdateRoleDTO } from '@infrastructure/dtos/roles/update.dto';
import { CreateRoleRequestDTO } from '@infrastructure/dtos/roles/create.dto';
import { HttpErrorTransformer } from '@infrastructure/errors/http-error-transformer';
import { RoleApiClient } from '@infrastructure/http/clients/role-api.client';

@Injectable()
export class HttpRoleRepository implements RoleRepository {
  private roleClient = inject(RoleApiClient);
  private errorTransformer = inject(HttpErrorTransformer);
  private roleMapper = inject(RoleMapper);

  async list(params?: { search?: string; active?: boolean }): Promise<Role[]> {
    try {
      const dtos = await firstValueFrom(this.roleClient.list(params));
      return dtos.map((dto) => this.roleMapper.toEntity(dto));
    } catch (httpError: unknown) {
      throw this.errorTransformer.transformWithDefaults(httpError, 'LIST_ROLES', 'LIST_ROLES');
    }
  }

  async getById(id: number): Promise<Role> {
    try {
      const dto = await firstValueFrom(this.roleClient.getById(id));
      return this.roleMapper.toEntity(dto);
    } catch (httpError: unknown) {
      throw this.errorTransformer.transformWithDefaults(
        httpError,
        'GET_ROLE_BY_ID',
        'GET_ROLE_BY_ID'
      );
    }
  }

  async create(spec: CreateRoleContract): Promise<Role> {
    try {
      const requestDto: CreateRoleRequestDTO = {
        name: spec.name,
        access_level: spec.accessLevel ?? 0,
        description: spec.description ?? '',
        can_lead_projects: spec.canLeadProjects ?? false,
        is_unique_per_team: spec.isUniquePerTeam ?? false,
        created_by_user_id: spec.createdByUserId,
      };

      const dto = await firstValueFrom(this.roleClient.create(requestDto));

      return this.roleMapper.toEntity(dto);
    } catch (httpError: unknown) {
      throw this.errorTransformer.transformWithDefaults(httpError, 'CREATE_ROLE', 'CREATE_ROLE');
    }
  }

  async update(id: number, payload: UpdateRolePatchContract): Promise<Role> {
    try {
      const requestDto: RequestUpdateRoleDTO = mapUpdatePayloadToDTO(payload);

      const dto = await firstValueFrom(this.roleClient.update(id, requestDto));
      return this.roleMapper.toEntity(dto);
    } catch (httpError: unknown) {
      throw this.errorTransformer.transformWithDefaults(httpError, 'UPDATE_ROLE', 'UPDATE_ROLE');
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await firstValueFrom(this.roleClient.delete(id));
    } catch (httpError: unknown) {
      throw this.errorTransformer.transformWithDefaults(httpError, 'DELETE_ROLE', 'DELETE_ROLE');
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

      await firstValueFrom(this.roleClient.assign(body));
    } catch (httpError: unknown) {
      throw this.errorTransformer.transformWithDefaults(httpError, 'ASSIGN_ROLE', 'ASSIGN_ROLE');
    }
  }

  async unassign(p: { roleId: number; userId: number }): Promise<void> {
    try {
      const body: UnassignRoleRequestDTO = { user_id: p.userId };
      await firstValueFrom(this.roleClient.unassign(body));
    } catch (httpError: unknown) {
      throw this.errorTransformer.transformWithDefaults(
        httpError,
        'UNASSIGN_ROLE',
        'UNASSIGN_ROLE'
      );
    }
  }
}
