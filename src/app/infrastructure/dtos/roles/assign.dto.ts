export interface AssignRoleRequestDTO {
    user_id: number;
    role_id: number;
    assigned_by_user_id: number;
}

export interface AssignRoleResponseDTO {
    message: string;
}
