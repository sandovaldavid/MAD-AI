export interface CreateRoleRequestDTO {
  name: string;
  description: string;
  access_level: number;
  can_lead_projects: boolean;
  is_unique_per_team: boolean;
  created_by_user_id: number;
}

export interface CreateRoleResponseDTO {
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
