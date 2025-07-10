export interface UserListModel {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    role_name?: string;
    created_at: string;
}
