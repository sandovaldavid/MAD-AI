/*
http://localhost:8004/api/v1/auth/users/
*/
export type ListUsersResponseDTO = UserDTO[];

export interface UserDTO {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  role_name: string;
  created_at: string;
}
