export interface RefreshRequestDTO {
  refresh_token: string;
}

export interface RefreshResponseDTO {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer' | string;
  expires_in: number;
}
