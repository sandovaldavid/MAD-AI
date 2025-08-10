import { UserStatus } from '../enums/user_status.enum';

export interface AuthUserSnapshot {
    id: number;
    username: string;
    email: string;
    role_id?: number | null;
    role_name?: string | null;
    access_level?: number | null;
    is_email_confirmed?: boolean | null;
    status?: UserStatus | null;
    updated_at?: string | null;
}

export interface AuthUserStorePort {
    read(): AuthUserSnapshot | null;
    write(snapshot: AuthUserSnapshot | null): void;
    clear(): void;
}
