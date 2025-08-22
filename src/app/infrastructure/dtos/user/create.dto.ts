export interface CreateUserRequestDTO {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role_id: number;
}

export interface CreateUserResponseDTO {
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
    last_activity_at: string | null;
}
