import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';
import { Credentials, LocalTokens } from '../models/auth/auth.model';
import { MessageResult, RegisterData, ResetPasswordData } from '../models/auth/auth.model';

export interface AuthRepository {
    login(creds: Credentials): Promise<Session>;
    logout(): Promise<void>;
    refresh(): Promise<Session>;
    me(): Promise<User>;
    getLocalTokens(): LocalTokens;
    setLocalTokens(s: LocalTokens): void;
    register(data: RegisterData): Promise<Session>;
    confirmEmail(token: string): Promise<MessageResult>;
    requestPasswordReset(email: string): Promise<MessageResult>;
    confirmPasswordReset(data: ResetPasswordData): Promise<MessageResult>;
}
