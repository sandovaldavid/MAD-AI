export interface CreateUserModel {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role_id?: number;
    email_notifications_enabled?: boolean;
    system_notifications_enabled?: boolean;
    task_notifications_enabled?: boolean;
}
