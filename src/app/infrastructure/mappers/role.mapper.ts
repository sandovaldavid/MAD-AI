import { Role } from '@domain/entities/role.entity';
import { RoleDTO } from '../dtos/roles/roles.dto';
import { UpdateRolePayload } from '@/app/domain/repositories/role.repository';
import { RequestUpdateRoleDTO } from '../dtos/roles/update.dto';

export const RoleMapper = {
    toEntity(dto: RoleDTO): Role {
        return Role.create({
            id: dto.id,
            name: dto.name,
            accessLevel: dto.access_level,
            isActive: dto.is_active,
            description: dto.description,
            userCount: dto.user_count,
        });
    },

    toDTO(entity: Role): RoleDTO {
        return {
            id: entity.id,
            name: entity.name,
            access_level: entity.accessLevel,
            is_active: entity.isActive,
            description: entity.description,
            user_count: entity.userCount,
        };
    },
};

/**
 * Transforma el payload de dominio al DTO de la API
 */
export const mapUpdatePayloadToDTO = (payload: UpdateRolePayload): RequestUpdateRoleDTO => {
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
