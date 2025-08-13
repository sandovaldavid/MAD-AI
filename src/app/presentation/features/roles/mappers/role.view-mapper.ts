import { Role } from '@domain/entities/role.entity';
import { RoleModel } from '../models/role.model';

export const RoleViewMapper = {
    toModel(e: Role): RoleModel {
        const tone: RoleModel['badgeTone'] =
            e.accessLevel <= 1
                ? 'success'
                : e.accessLevel <= 2
                ? 'info'
                : e.accessLevel <= 3
                ? 'warning'
                : 'error';

        return {
            id: e.id,
            name: e.name,
            accessLevel: e.accessLevel,
            isActive: e.isActive,
            description: e.description ?? '',
            userCount: e.userCount,
            displayName: `${e.name} (L${e.accessLevel})`,
            badgeTone: tone,
        };
    },
};
