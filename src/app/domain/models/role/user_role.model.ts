export interface UserRoleModel {
    id: number;
    name: string;
    description: string;
    access_level: number;
    is_active: boolean;
    user_count: number;
}
