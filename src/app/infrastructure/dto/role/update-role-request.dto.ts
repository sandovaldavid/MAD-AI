export interface UpdateRoleRequestDto {
    name?: string;
    description?: string;
    access_level?: number;
    can_lead_projects?: boolean;
    is_unique_per_team?: boolean;
    is_active?: boolean;
}
