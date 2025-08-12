import type {
    LoginResponseDTO,
    MeResponseDTO,
    RefreshResponseDTO,
    RegisterResponseDTO,
} from '../dtos/auth';
import { User } from '@domain/entities/user.entity';
import { Role } from '@domain/entities/role.entity';
import { Session } from '@domain/entities/session.entity';
import { AccessToken } from '@domain/value-objects/access-token.vo';
import { RefreshToken } from '@domain/value-objects/refresh-token.vo';

function mapRole(name: string, id: number, accessLevel?: number, isActive = true) {
    return Role.create({
        id,
        name,
        accessLevel,
        isActive,
        description: name,
    });
}

export const AuthMapper = {
    loginUserToEntity(dto: LoginResponseDTO['user']): User {
        const role = mapRole(dto.role_name, dto.role_id);
        return User.create({
            id: dto.id,
            username: dto.username,
            email: dto.email,
            firstName: dto.first_name,
            lastName: dto.last_name,
            role,
            isActive: dto.is_active,
            createdAt: dto.created_at,
            updatedAt: dto.updated_at,
            lastActivityAt: dto.last_activity_at ?? null,
        });
    },

    registerUserToEntity(dto: RegisterResponseDTO['user']): User {
        const role = mapRole(dto.role_name, dto.role_id);
        return User.create({
            id: dto.id,
            username: dto.username,
            email: dto.email,
            firstName: dto.first_name,
            lastName: dto.last_name,
            role,
            isActive: dto.is_active,
            createdAt: dto.created_at,
            updatedAt: dto.updated_at,
            lastActivityAt: dto.last_activity_at ?? null,
        });
    },

    meToEntity(dto: MeResponseDTO): User {
        const role = mapRole(
            dto.role?.name,
            dto.role?.id,
            dto.role?.access_level,
            dto.role?.is_active
        );
        return User.create({
            id: dto.id,
            username: dto.username,
            email: dto.email,
            firstName: dto.first_name,
            lastName: dto.last_name,
            isActive: dto.role?.is_active ?? true,
            role,
            notificationPreferences: {
                email: dto.notification_preferences.email_notifications,
                system: dto.notification_preferences.system_notifications,
                task: dto.notification_preferences.task_notifications,
            },
        });
    },

    toSession(params: {
        accessToken: string;
        refreshToken: string;
        accessExpEpochSeconds: number;
        user: User;
    }): Session {
        const access = AccessToken.create(params.accessToken, params.accessExpEpochSeconds);
        const refresh = RefreshToken.create(params.refreshToken);
        return Session.create({ user: params.user, access, refresh });
    },

    tokensFromLogin(dto: LoginResponseDTO, nowEpoch: number) {
        return {
            accessToken: dto.access_token,
            refreshToken: dto.refresh_token,
            accessExp: nowEpoch + (dto.expires_in ?? 0),
        };
    },

    tokensFromRefresh(dto: RefreshResponseDTO, nowEpoch: number) {
        return {
            accessToken: dto.access_token,
            refreshToken: dto.refresh_token,
            accessExp: nowEpoch + (dto.expires_in ?? 0),
        };
    },

    tokensFromRegister(dto: RegisterResponseDTO, nowEpoch: number) {
        return {
            accessToken: dto.access_token,
            refreshToken: dto.refresh_token,
            accessExp: nowEpoch + (dto.expires_in ?? 0),
        };
    },
};
