import type {
  LoginResponseDTO,
  MeResponseDTO,
  RefreshResponseDTO,
  RegisterResponseDTO,
} from '../dtos/auth';
import { User } from '@domain/entities/user.entity';
import { Role } from '@domain/entities/role.entity';
import { Session } from '@domain/entities/session.entity';
import { AccessToken, RefreshToken } from '@domain/value-objects/local-tokens.vo';
import { Email } from '@domain/value-objects/email.vo';
import { Username } from '@domain/value-objects/username.vo';
import { FirstName } from '@domain/value-objects/firstname.vo';
import { LastName } from '@domain/value-objects/lastname.vo';
import { RoleName } from '@domain/value-objects/role-name.vo';
import { AccessLevel } from '@domain/value-objects/accesslevel.vo';
import { ISODateTime } from '@domain/value-objects/iso-datetime.vo';
import { UserNotificationPreferences } from '@domain/value-objects/user-notification-preferences.vo';

function mapRole(name: string, id: number, accessLevel?: number, isActive = true) {
  return Role.create({
    id,
    name: RoleName.create(name),
    accessLevel: AccessLevel.create(accessLevel ?? 1),
    isActive,
    description: name,
  });
}

export const AuthMapper = {
  loginUserToEntity(dto: LoginResponseDTO['user']): User {
    const role = mapRole(dto.role_name, dto.role_id);
    return User.create({
      id: dto.id,
      username: Username.create(dto.username),
      email: Email.create(dto.email),
      firstName: FirstName.create(dto.first_name),
      lastName: LastName.create(dto.last_name),
      role,
      isActive: dto.is_active,
      createdAt: dto.created_at ? ISODateTime.create(dto.created_at) : undefined,
      updatedAt: dto.updated_at ? ISODateTime.create(dto.updated_at) : undefined,
      lastActivityAt: dto.last_activity_at ? ISODateTime.create(dto.last_activity_at) : undefined,
    });
  },

  registerUserToEntity(dto: RegisterResponseDTO['user']): User {
    const role = mapRole(dto.role_name, dto.role_id);
    return User.create({
      id: dto.id,
      username: Username.create(dto.username),
      email: Email.create(dto.email),
      firstName: FirstName.create(dto.first_name),
      lastName: LastName.create(dto.last_name),
      role,
      isActive: dto.is_active,
      createdAt: dto.created_at ? ISODateTime.create(dto.created_at) : undefined,
      updatedAt: dto.updated_at ? ISODateTime.create(dto.updated_at) : undefined,
      lastActivityAt: dto.last_activity_at ? ISODateTime.create(dto.last_activity_at) : undefined,
    });
  },

  meToEntity(dto: MeResponseDTO): User {
    const role = mapRole(dto.role?.name, dto.role?.id, dto.role?.access_level, dto.role?.is_active);
    return User.create({
      id: dto.id,
      username: Username.create(dto.username),
      email: Email.create(dto.email),
      firstName: FirstName.create(dto.first_name),
      lastName: LastName.create(dto.last_name),
      isActive: dto.role?.is_active ?? true,
      role,
      notificationPreferences: UserNotificationPreferences.createDefault(),
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
