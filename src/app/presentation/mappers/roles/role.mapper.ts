import type { RoleSummary, RoleDetail } from '@application/mappers/role.mapper';
import type {
  RoleTableRowView,
  RoleCardView,
  RoleFormView,
  RoleDetailView,
  StatusBadgeView,
  TableAction,
} from '../../models/roles/role.models';
import { getRoleAccessLevelInfo, getRoleAccessLevelIcon } from '../../models/roles/accesLevel.models';

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
    statusBadge: {
      label: role.isActive ? 'Activo' : 'Inactivo',
      color: role.isActive ? levelInfo.color : 'secondary',
      icon: role.isActive ? 'check-circle' : 'x-circle',
    },
    createdAt: role.createdAt?.toLocaleDateString() || '',
    updatedAt: role.createdAt?.toLocaleDateString() || '', // Usar createdAt si no hay updatedAt
    actions: createTableActions(role),
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

// Helpers internos
function createTableActions(role: RoleSummary): TableAction[] {
  const actions: TableAction[] = [
    {
      label: 'Ver',
      icon: 'eye',
      color: 'primary',
      action: 'view',
    },
  ];

  // Lógica basada en niveles de acceso:
  // Nivel 1-2 (Crítico/Alto): Solo visualización por seguridad
  // Nivel 3 (Medio): Permite edición limitada
  // Nivel 4-5 (Bajo/Mínimo): Permite edición y eliminación completa
  
  if (role.accessLevel >= 3) {
    // Edición permitida para niveles 3, 4 y 5
    actions.push({
      label: 'Editar',
      icon: 'pencil',
      color: 'warning',
      action: 'edit',
      disabled: role.accessLevel <= 2, // Niveles críticos no se pueden editar
      tooltip: role.accessLevel <= 2 ? 'Los roles de alto nivel no se pueden editar por seguridad' : undefined,
    });

    // Eliminación solo para niveles 4 y 5 (roles menos críticos)
    if (role.accessLevel >= 4) {
      actions.push({
        label: 'Eliminar',
        icon: 'trash',
        color: 'danger',
        action: 'delete',
        disabled: role.userCount > 0,
        tooltip: role.userCount > 0 
          ? 'No se puede eliminar rol con usuarios asignados' 
          : undefined,
      });
    }
  }

  return actions;
}
