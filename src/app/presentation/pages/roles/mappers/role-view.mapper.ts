import { Role } from '@domain/entities/role.entity';
import { RoleModel } from '../models/role.model';

export const RoleViewMapper = {
  toModel(e: Role): RoleModel {
    return {
      id: e.id,
      name: e.name,
      accessLevel: e.getAccessLevel().getValue(),
      isActive: e.isActive,
      description: e.description ?? '',
      userCount: e.userCount,
      displayName: `${e.name} (L${e.getAccessLevel().getValue()})`,
    };
  },
};
