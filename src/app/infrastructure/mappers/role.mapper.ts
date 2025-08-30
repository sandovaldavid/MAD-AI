import { Role } from '@domain/entities/role.entity';
import { Injectable } from '@angular/core';
import { RoleDTO } from '../dtos/roles/roles.dto';
import { UpdateRolePatchContract } from '@domain/repositories/business/role.contract';
import { RequestUpdateRoleDTO } from '../dtos/roles/update.dto';

/**
 * Injectable mapper utility for Role entity and DTO transformations.
 *
 * @description Provides methods for converting between Role DTOs (from API)
 * and Role domain entities, maintaining data integrity and validation.
 */
@Injectable({
  providedIn: 'root',
})
export class RoleMapper {
  // Empty constructor - this mapper doesn't require dependencies for data transformation

  /**
   * Converts a Role DTO from the API to a Role domain entity.
   */
  toEntity(dto: RoleDTO): Role {
    return Role.create({
      id: dto.id,
      name: dto.name,
      accessLevel: dto.access_level,
      isActive: dto.is_active,
      description: dto.description,
      userCount: dto.user_count,
    });
  }

  /**
   * Converts a Role domain entity back to DTO format.
   */
  toDTO(entity: Role): RoleDTO {
    return {
      id: entity.id,
      name: entity.name,
      access_level: entity.getAccessLevel().getValue(),
      is_active: entity.isActive,
      description: entity.description,
      user_count: entity.userCount,
    };
  }
}

/**
 * Transforma el payload de dominio al DTO de la API
 */
export const mapUpdatePayloadToDTO = (payload: UpdateRolePatchContract): RequestUpdateRoleDTO => {
  const dto: RequestUpdateRoleDTO = {};

  if (payload.name !== undefined) {
    dto.name = payload.name;
  }
  if (payload.description !== undefined) {
    dto.description = payload.description;
  }
  if (payload.accessLevel !== undefined) {
    dto.access_level = payload.accessLevel;
  }
  if (payload.canLeadProjects !== undefined) {
    dto.can_lead_projects = payload.canLeadProjects;
  }
  if (payload.isUniquePerTeam !== undefined) {
    dto.is_unique_per_team = payload.isUniquePerTeam;
  }
  if (payload.isActive !== undefined) {
    dto.is_active = payload.isActive;
  }

  return dto;
};
