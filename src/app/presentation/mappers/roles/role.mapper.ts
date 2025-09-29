import type { RoleSummary, RoleDetail } from '@application/mappers/role.mapper';
import type {
  RoleTableRowView,
  RoleCardView,
  RoleFormView,
  RoleDetailView,
} from '../../models/roles/role.models';
import {
  getRoleAccessLevelInfo,
  getRoleAccessLevelIcon,
} from '../../models/roles/accesLevel.models';

/**
 * Transformadores simples: datos del facade → interfaces de presentation
 */

export function transformToTableRowView(role: RoleSummary): RoleTableRowView {
  const levelInfo = getRoleAccessLevelInfo(role.accessLevel);

  return {
    id: role.id.toString(),
    name: role.name,
    displayName: role.name,
    description: role.description,
    userCount: role.userCount,
    accessLevel: role.accessLevel,
    statusBadge: {
      label: role.isActive ? 'Activo' : 'Inactivo',
      color: role.isActive ? levelInfo.color : 'secondary',
      icon: role.isActive ? 'check-circle' : 'x-circle',
    },
    createdAt: role.createdAt?.toLocaleDateString() || '',
    updatedAt: role.createdAt?.toLocaleDateString() || '',
  };
}

export function transformToCardView(role: RoleSummary): RoleCardView {
  return {
    id: role.id.toString(),
    name: role.name,
    displayName: role.name,
    description: role.description,
    accessLevel: role.accessLevel, // Direct access level, consistent with component
    userCount: role.userCount,
    permissionCount: 0, // Se puede obtener de otro facade si es necesario
    status: role.isActive ? 'active' : 'inactive',
  };
}

export function transformToFormView(role?: RoleSummary | RoleDetail): RoleFormView {
  const levelInfo = role ? getRoleAccessLevelInfo(role.accessLevel) : getRoleAccessLevelInfo(5);

  return {
    id: role?.id.toString(),
    name: role?.name || '',
    displayName: role?.name || '',
    description: role?.description || '',
    color: levelInfo.color,
    icon: getRoleAccessLevelIcon(role?.accessLevel || 5),
    accessLevel: role?.accessLevel || 5, // Default to lowest access level
    isActive: role?.isActive ?? true,
  };
}

export function transformToDetailView(role: RoleSummary | RoleDetail): RoleDetailView {
  const levelInfo = getRoleAccessLevelInfo(role.accessLevel);

  return {
    id: role.id.toString(),
    name: role.name,
    displayName: role.name,
    description: role.description,
    color: levelInfo.color,
    icon: getRoleAccessLevelIcon(role.accessLevel),
    createdAt: role.createdAt?.toLocaleDateString() || '',
    updatedAt: role.createdAt?.toLocaleDateString() || '', // Usar createdAt si no hay updatedAt
    createdBy: 'Sistema', // Se puede obtener de otro facade si es necesario
    accessLevel: role.accessLevel, // Access level for permission validation
    status: role.isActive ? 'active' : 'inactive',
  };
}
