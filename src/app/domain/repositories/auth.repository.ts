import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';
import { Credentials, LocalTokens } from '../types/auth';
import { MessageResult, RegisterData, ResetPasswordData } from '../types/auth';

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
