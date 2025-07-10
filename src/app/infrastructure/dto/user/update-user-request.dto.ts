export interface UpdateUserRequestDto {
    first_name?: string;
    last_name?: string;
    email?: string;
    role_id?: number;
    status?: string;
    email_notifications_enabled?: boolean;
    system_notifications_enabled?: boolean;
    task_notifications_enabled?: boolean;
}
