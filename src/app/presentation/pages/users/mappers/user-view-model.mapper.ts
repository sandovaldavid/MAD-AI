import { Injectable } from '@angular/core';
import { User } from '@domain/entities/user.entity';
import { RoleSummary } from '@application/mappers/role.mapper';
import { UserViewModel, RoleInfo } from '../models/user-view.model';
import { UserStatusDisplay } from '../types/user-ui.types';

@Injectable({
  providedIn: 'root',
})
export class UserViewModelMapper {
  mapToViewModel(user: User, roles: RoleSummary[]): UserViewModel {
    const displayName = `${user.firstName.value} ${user.lastName.value}`.trim();
    const initials = displayName
      .split(' ')
      .map((name) => name.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);

    const userRole = roles.find((r) => r.name === user.role.name);
    const roleInfo: RoleInfo = {
      name: user.role.name,
      isActive: userRole ? userRole.isActive : false, // Assume false if role not found
      accessLevel: user.role.accessLevel,
    };

    const status: UserStatusDisplay = {
      value: user.active ? 'active' : 'inactive',
      label: user.active ? 'Activo' : 'Inactivo',
      cssClass: user.active ? 'status-active' : 'status-inactive',
      iconName: user.active ? 'check-circle' : 'x-circle',
      description: user.active ? 'Usuario activo' : 'Usuario inactivo',
    };

    const lastActivity = user.lastActivityAt ? new Date(user.lastActivityAt.value) : undefined;
    const lastActivityDisplay = lastActivity
      ? lastActivity.toLocaleDateString()
      : undefined;

    return {
      id: user.id,
      displayName,
      email: user.email.value,
      username: user.username.value,
      role: roleInfo,
      status,
      initials,
      lastActivity,
      lastActivityDisplay,
      createdAt: user.createdAt ? new Date(user.createdAt.value) : new Date(),
      isActive: user.active,
      canEdit: user.role.accessLevel <= 2,
      canDelete: user.role.accessLevel === 1,
    };
  }

  mapToViewModels(users: User[], roles: RoleSummary[]): UserViewModel[] {
    return users.map((user) => this.mapToViewModel(user, roles));
  }
}
