export interface ChangePasswordRequestDTO {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface ChangePasswordResponseDTO {
  message: string;
}
