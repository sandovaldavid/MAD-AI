/**
 * Colores disponibles para los niveles de acceso de roles
 * Basados en la paleta de colores del sistema
 */
export type RoleAccessLevelColor =
  | 'error' // Nivel 1 - Crítico (acceso total)
  | 'warning' // Nivel 2 - Alto (gestión administrativa)
  | 'info' // Nivel 3 - Medio (operaciones moderadas)
  | 'secondary' // Nivel 4 - Bajo (operaciones básicas)
  | 'successful'; // Nivel 5 - Mínimo (solo consulta)

/**
 * Información completa del nivel de acceso incluyendo estilos
 */
export interface RoleAccessLevelInfo {
  color: RoleAccessLevelColor;
  label: string;
  description: string;
  iconBg: string;
  iconColor: string;
  badgeClasses: string;
  ringClasses: string;
}

/**
 * Configuración de colores para cada nivel de acceso
 * Nivel 1 = Máximo acceso (Crítico)
 * Nivel 5 = Mínimo acceso (Solo consulta)
 */
export const ROLE_ACCESS_LEVEL_CONFIG: Record<number, RoleAccessLevelInfo> = {
  1: {
    color: 'error',
    label: 'Crítico',
    description: 'Acceso total al sistema',
    iconBg: 'bg-error-100 dark:bg-error-900',
    iconColor: 'text-error-600 dark:text-error-100',
    badgeClasses: 'bg-error-100 text-error-800 dark:bg-error-800 dark:text-error-100',
    ringClasses: 'ring-error-500/20 dark:ring-error-400/20',
  },
  2: {
    color: 'warning',
    label: 'Alto',
    description: 'Gestión administrativa',
    iconBg: 'bg-warning-100 dark:bg-warning-900',
    iconColor: 'text-warning-600 dark:text-warning-100',
    badgeClasses: 'bg-warning-100 text-warning-800 dark:bg-warning-800 dark:text-warning-100',
    ringClasses: 'ring-warning-500/20 dark:ring-warning-400/20',
  },
  3: {
    color: 'info',
    label: 'Medio',
    description: 'Operaciones moderadas',
    iconBg: 'bg-info-100 dark:bg-info-900',
    iconColor: 'text-info-600 dark:text-info-100',
    badgeClasses: 'bg-info-100 text-info-800 dark:bg-info-800 dark:text-info-100',
    ringClasses: 'ring-info-500/20 dark:ring-info-400/20',
  },
  4: {
    color: 'secondary',
    label: 'Bajo',
    description: 'Operaciones básicas',
    iconBg: 'bg-secondary-100 dark:bg-secondary-900',
    iconColor: 'text-secondary-600 dark:text-secondary-100',
    badgeClasses:
      'bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-100',
    ringClasses: 'ring-secondary-500/20 dark:ring-secondary-400/20',
  },
  5: {
    color: 'successful',
    label: 'Mínimo',
    description: 'Solo consulta',
    iconBg: 'bg-successful-100 dark:bg-successful-900',
    iconColor: 'text-successful-600 dark:text-successful-100',
    badgeClasses:
      'bg-successful-100 text-successful-800 dark:bg-successful-800 dark:text-successful-100',
    ringClasses: 'ring-successful-500/20 dark:ring-successful-400/20',
  },
};

/**
 * Iconos asociados a cada nivel de acceso
 */
export const ROLE_ACCESS_LEVEL_ICONS: Record<number, string> = {
  1: 'crown', // Crítico
  2: 'shield-check', // Alto
  3: 'shield', // Medio
  4: 'user-group', // Bajo
  5: 'eye', // Mínimo (solo vista)
};

/**
 * Función helper para obtener la información de un nivel de acceso
 */
export function getRoleAccessLevelInfo(level: number): RoleAccessLevelInfo {
  return ROLE_ACCESS_LEVEL_CONFIG[level] || ROLE_ACCESS_LEVEL_CONFIG[5];
}

/**
 * Función helper para obtener el icono de un nivel de acceso
 */
export function getRoleAccessLevelIcon(level: number): string {
  return ROLE_ACCESS_LEVEL_ICONS[level] || ROLE_ACCESS_LEVEL_ICONS[5];
}
