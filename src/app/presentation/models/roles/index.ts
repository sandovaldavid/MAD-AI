// Interfaces de vista para roles
export type {
  RoleTableRowView,
  RoleCardView,
  RoleFormView,
  RoleDetailView,
  StatusBadgeView,
  TableAction,
  RoleStatus,
  RoleSearchView,
  RoleFiltersView,
  DateRangeView,
  RoleSortField,
} from './role.models';

// Transformadores: facade data → presentation interfaces
export {
  transformToTableRowView,
  transformToCardView,
  transformToFormView,
  transformToDetailView,
} from '../../mappers/roles/role.mapper';

// Configuración de estilos y colores
export type { RoleAccessLevelColor, RoleAccessLevelInfo } from './accesLevel.models';
export {
  ROLE_ACCESS_LEVEL_CONFIG,
  ROLE_ACCESS_LEVEL_ICONS,
  getRoleAccessLevelInfo,
  getRoleAccessLevelIcon,
  getAccessLevelDescription,
} from './accesLevel.models';
