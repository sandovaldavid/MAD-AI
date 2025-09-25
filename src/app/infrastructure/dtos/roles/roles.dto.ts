export type RolesResponseDTO = RoleDTO[];

export interface RoleDTO {
  id: number;
  name: string;
  description: string;
  access_level: number;
  is_active: boolean;
  user_count: number;
  created_at: string;
}
