import { RoleAccessLevel } from '../../enums/role-access-level.enum';

export interface RoleListModel {
    id: number;
    name: string;
    description: string;
    access_level: RoleAccessLevel;
    is_active: boolean;
    user_count: number;
}
