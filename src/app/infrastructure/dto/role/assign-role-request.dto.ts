export interface AssignRoleRequestDto {
    user_id: number;
    role_id: number;
    assigned_by_user_id?: number;
}
