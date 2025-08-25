export interface ResetPasswordConfirmRequestDTO {
  token: string;
  new_password: string;
  new_password_confirm: string;
}

export interface ResetPasswordConfirmResponseDTO {
  message: string;
}
