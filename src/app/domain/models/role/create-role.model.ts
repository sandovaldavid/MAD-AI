import { RoleAccessLevel } from '../../enums/role-access-level.enum';

export interface CreateRoleModel {
    name: string;
    description: string;
    access_level: RoleAccessLevel;
    can_lead_projects?: boolean;
    is_unique_per_team?: boolean;
    created_by_user_id: number;
}
