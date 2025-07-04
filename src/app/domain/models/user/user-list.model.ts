export interface UserListModel {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    role_name: string | null;
    created_at: string;
    full_name?: string;
    status?: string;
    is_email_confirmed?: boolean;
    profile_completed?: boolean;
    email_notifications_enabled?: boolean;
    system_notifications_enabled?: boolean;
    task_notifications_enabled?: boolean;
    updated_at?: string;
    role_id?: number;
    last_activity_at?: string;
}
