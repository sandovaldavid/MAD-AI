import type {
  LoginResponseDTO,
  MeResponseDTO,
  RefreshResponseDTO,
  RegisterResponseDTO,
} from '../dtos/auth';
import { User } from '@domain/entities/user.entity';
import { Session } from '@domain/entities/session.entity';
import { AccessToken, RefreshToken } from '@domain/value-objects/local-tokens.vo';
import { Role } from '@domain/entities/role.entity';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY } from '@di/tokens';

@Injectable({
  providedIn: 'root',
})
export class AuthMapper {
  private readonly roleRepository = inject<RoleRepository>(ROLE_REPOSITORY);

  async loginUserToEntity(dto: LoginResponseDTO['user']): Promise<User> {
    // Get complete Role entity
    const role = await this.roleRepository.getById(dto.role_id);

    return User.create({
      id: dto.id,
      username: dto.username,
      email: dto.email,
      firstName: dto.first_name,
      lastName: dto.last_name,
      role: role,
      isActive: dto.is_active,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
      lastActivityAt: dto.last_activity_at,
    });
  }

  registerUserToEntity(dto: RegisterResponseDTO['user']): User {
    const role = Role.create({
      id: dto.role_id,
      name: dto.role_name,
    });

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
      lastActivityAt: dto.last_activity_at,
    });
  }

  meToEntity(dto: MeResponseDTO): User {
    const roleDto = dto.role;
    const role = Role.create({
      id: roleDto.id,
      name: roleDto.name,
      accessLevel: roleDto.access_level,
      isActive: roleDto.is_active,
    });

    return User.create({
      id: dto.id,
      username: dto.username,
      email: dto.email,
      firstName: dto.first_name,
      lastName: dto.last_name,
      isActive: dto.role.is_active,
      role,
      notificationPreferences: {
        email: dto.notification_preferences.email_notifications,
        system: dto.notification_preferences.system_notifications,
        task: dto.notification_preferences.task_notifications,
      },
    });
  }

  toSession(params: {
    accessToken: string;
    refreshToken: string;
    accessExpEpochSeconds: number;
    user: User;
  }): Session {
    const access = AccessToken.create(params.accessToken, params.accessExpEpochSeconds);
    const refresh = RefreshToken.create(params.refreshToken);
    return Session.create({ user: params.user, access, refresh });
  }

  tokensFromLogin(dto: LoginResponseDTO, nowEpoch: number) {
    return {
      accessToken: dto.access_token,
      refreshToken: dto.refresh_token,
      accessExp: nowEpoch + (dto.expires_in ?? 0),
    };
  }

  tokensFromRefresh(dto: RefreshResponseDTO, nowEpoch: number) {
    return {
      accessToken: dto.access_token,
      refreshToken: dto.refresh_token,
      accessExp: nowEpoch + (dto.expires_in ?? 0),
    };
  }

  tokensFromRegister(dto: RegisterResponseDTO, nowEpoch: number) {
    return {
      accessToken: dto.access_token,
      refreshToken: dto.refresh_token,
      accessExp: nowEpoch + (dto.expires_in ?? 0),
    };
  }
}
