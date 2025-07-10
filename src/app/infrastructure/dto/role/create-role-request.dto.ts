export interface CreateRoleRequestDto {
    name: string;
    description: string;
    access_level: number;
    can_lead_projects?: boolean;
    is_unique_per_team?: boolean;
    created_by_user_id: number;
}
