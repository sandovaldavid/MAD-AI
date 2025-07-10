import { RoleAccessLevel } from '../../enums/role-access-level.enum';

export interface RoleModel {
    id: number;
    name: string;
    description: string;
    access_level: RoleAccessLevel;
    can_lead_projects: boolean;
    is_unique_per_team: boolean;
    is_active: boolean;
    created_at: string;
    user_count: number;
}
