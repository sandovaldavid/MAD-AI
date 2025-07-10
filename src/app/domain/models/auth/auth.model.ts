export interface LoginRequest {
    identifier: string; // username or email
    password: string;
    remember_me: boolean;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    role_id?: number | null;
}

export interface RegisterResponse {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    status: string;
    is_email_confirmed: boolean;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user: UserInfo;
}

export interface UserInfo {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    role_name: string | null;
    created_at: string;
}

export interface RefreshTokenRequest {
    refresh_token: string;
}

export interface RefreshTokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user: UserInfo;
}

export interface LogoutRequest {
    refresh_token: string;
}
