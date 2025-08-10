export interface LogoutRequestDTO {
    refresh_token: string;
}
export interface LogoutResponseDTO {
    message: string; // "Logged out successfully"
}
