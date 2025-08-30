export type Identifier = string | { email: string } | { username: string };

export interface LoginRequestDTO {
  identifier: Identifier;
  password: string;
  remember_me?: boolean;
}

export type LoginResponseDTO = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    status: string;
    is_email_confirmed: boolean;
    profile_completed: boolean;
    email_notifications_enabled: boolean;
    system_notifications_enabled: boolean;
    task_notifications_enabled: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    role_id: number;
    role_name: string;
    last_activity_at: string;
  };
};
