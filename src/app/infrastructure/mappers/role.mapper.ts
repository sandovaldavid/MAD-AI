import { Role } from '@domain/entities/role.entity';
import { RoleDTO } from '../dtos/roles/roles.dto';

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
