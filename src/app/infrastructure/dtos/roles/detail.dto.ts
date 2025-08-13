export interface RoleDetailResponseDTO {
    id: number;
    name: string;
    description: string;
    access_level: number;
    can_lead_projects: boolean;
    is_unique_per_team: boolean;
    is_active: boolean;
    created_at: string;
    user_count: number;
}
