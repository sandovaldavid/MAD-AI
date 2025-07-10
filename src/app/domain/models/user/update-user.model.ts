export interface UpdateUserModel {
    first_name?: string;
    last_name?: string;
    email?: string;
    role_id?: number;
    is_active?: boolean;
    status?: string;
    email_notifications_enabled?: boolean;
    system_notifications_enabled?: boolean;
    task_notifications_enabled?: boolean;
}
