import { LoginResponseDTO } from './Login.dto';

export interface RegisterRequestDTO {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  role_id?: number | null;
}

export type RegisterResponseDTO = LoginResponseDTO;
