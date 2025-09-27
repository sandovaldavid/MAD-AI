/**
 * Colores disponibles para los estados de usuario
 * Basados en la paleta de colores del sistema
 */
export type UserStatusColor =
  | 'successful' // Activo (verde)
  | 'error' // Inactivo/Suspendido (rojo)
  | 'warning' // Pendiente (amarillo)
  | 'neutral'; // Estados neutrales/desconocidos (gris)

/**
 * Estados de usuario disponibles en el sistema
 */
export type UserStatusType = 'active' | 'inactive' | 'pending' | 'suspended';

/**
 * Información completa del estado de usuario incluyendo estilos
 */
export interface UserStatusInfo {
  status: UserStatusType;
  color: UserStatusColor;
  label: string;
  description: string;
  iconName: string;
  iconBg: string;
  iconColor: string;
  badgeClasses: string;
  ringClasses: string;
}

/**
 * Configuración de colores para cada estado de usuario
 */
export const USER_STATUS_CONFIG: Record<UserStatusType, UserStatusInfo> = {
  active: {
    status: 'active',
    color: 'successful',
    label: 'Activo',
    description: 'Usuario con acceso completo al sistema',
    iconName: 'check-circle',
    iconBg: 'bg-successful-100 dark:bg-successful-900',
    iconColor: 'text-successful-600 dark:text-successful-100',
    badgeClasses:
      'bg-successful-100 text-successful-800 border-successful-200 dark:bg-successful-800 dark:text-successful-200 dark:border-successful-700',
    ringClasses: 'ring-successful-500/20 dark:ring-successful-400/20',
  },
  inactive: {
    status: 'inactive',
    color: 'error',
    label: 'Inactivo',
    description: 'Usuario sin acceso al sistema',
    iconName: 'x-circle',
    iconBg: 'bg-error-100 dark:bg-error-900',
    iconColor: 'text-error-600 dark:text-error-100',
    badgeClasses:
      'bg-error-100 text-error-800 border-error-200 dark:bg-error-800 dark:text-error-200 dark:border-error-700',
    ringClasses: 'ring-error-500/20 dark:ring-error-400/20',
  },
  pending: {
    status: 'pending',
    color: 'warning',
    label: 'Pendiente',
    description: 'Usuario pendiente de activación',
    iconName: 'clock',
    iconBg: 'bg-warning-100 dark:bg-warning-900',
    iconColor: 'text-warning-600 dark:text-warning-100',
    badgeClasses:
      'bg-warning-100 text-warning-800 border-warning-200 dark:bg-warning-800 dark:text-warning-200 dark:border-warning-700',
    ringClasses: 'ring-warning-500/20 dark:ring-warning-400/20',
  },
  suspended: {
    status: 'suspended',
    color: 'error',
    label: 'Suspendido',
    description: 'Usuario temporalmente suspendido',
    iconName: 'no-symbol',
    iconBg: 'bg-error-100 dark:bg-error-900',
    iconColor: 'text-error-600 dark:text-error-100',
    badgeClasses:
      'bg-error-100 text-error-800 border-error-200 dark:bg-error-800 dark:text-error-200 dark:border-error-700',
    ringClasses: 'ring-error-500/20 dark:ring-error-400/20',
  },
};

/**
 * Niveles de actividad de usuario con colores asociados
 */
export type UserActivityLevel = 'very-active' | 'active' | 'moderate' | 'inactive';

export interface UserActivityInfo {
  level: UserActivityLevel;
  color: UserStatusColor;
  label: string;
  description: string;
  iconName: string;
  badgeClasses: string;
}

export const USER_ACTIVITY_CONFIG: Record<UserActivityLevel, UserActivityInfo> = {
  'very-active': {
    level: 'very-active',
    color: 'successful',
    label: 'Muy Activo',
    description: 'Usuario muy activo en el sistema',
    iconName: 'fire',
    badgeClasses:
      'bg-successful-100 text-successful-800 border-successful-200 dark:bg-successful-800 dark:text-successful-200 dark:border-successful-700',
  },
  active: {
    level: 'active',
    color: 'successful',
    label: 'Activo',
    description: 'Usuario activo en el sistema',
    iconName: 'lightning-bolt',
    badgeClasses:
      'bg-successful-100 text-successful-800 border-successful-200 dark:bg-successful-800 dark:text-successful-200 dark:border-successful-700',
  },
  moderate: {
    level: 'moderate',
    color: 'warning',
    label: 'Moderado',
    description: 'Usuario con actividad moderada',
    iconName: 'signal',
    badgeClasses:
      'bg-warning-100 text-warning-800 border-warning-200 dark:bg-warning-800 dark:text-warning-200 dark:border-warning-700',
  },
  inactive: {
    level: 'inactive',
    color: 'neutral',
    label: 'Inactivo',
    description: 'Usuario sin actividad reciente',
    iconName: 'pause',
    badgeClasses:
      'bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700',
  },
};

/**
 * Función helper para obtener la información de un estado de usuario
 */
export function getUserStatusInfo(status: UserStatusType): UserStatusInfo {
  return USER_STATUS_CONFIG[status] || USER_STATUS_CONFIG.inactive;
}

/**
 * Función helper para obtener la información de un estado por CSS class
 */
export function getUserStatusInfoByCssClass(cssClass: string): UserStatusInfo {
  const statusType = cssClass as UserStatusType;
  return getUserStatusInfo(statusType);
}

/**
 * Función helper para obtener el icono de un estado de usuario
 */
export function getUserStatusIcon(status: UserStatusType): string {
  return USER_STATUS_CONFIG[status]?.iconName || USER_STATUS_CONFIG.inactive.iconName;
}

/**
 * Función helper para obtener las clases de badge de un estado
 */
export function getUserStatusBadgeClasses(status: UserStatusType): string {
  return USER_STATUS_CONFIG[status]?.badgeClasses || USER_STATUS_CONFIG.inactive.badgeClasses;
}

/**
 * Función helper para obtener la información de actividad de usuario
 */
export function getUserActivityInfo(level: UserActivityLevel): UserActivityInfo {
  return USER_ACTIVITY_CONFIG[level] || USER_ACTIVITY_CONFIG.inactive;
}

/**
 * Función helper para obtener las clases de badge de actividad
 */
export function getUserActivityBadgeClasses(level: UserActivityLevel): string {
  return USER_ACTIVITY_CONFIG[level]?.badgeClasses || USER_ACTIVITY_CONFIG.inactive.badgeClasses;
}

/**
 * Función helper para mapear un valor string a UserStatusType
 */
export function mapStringToUserStatus(value: string): UserStatusType {
  const normalizedValue = value.toLowerCase().trim();

  switch (normalizedValue) {
    case 'active':
    case 'activo':
      return 'active';
    case 'inactive':
    case 'inactivo':
      return 'inactive';
    case 'pending':
    case 'pendiente':
      return 'pending';
    case 'suspended':
    case 'suspendido':
      return 'suspended';
    default:
      return 'inactive';
  }
}
