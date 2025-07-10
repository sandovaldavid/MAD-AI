export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
    PENDING = 'pending',
    DEACTIVATED = 'deactivated',
    BLOCKED = 'blocked',
}

export const USER_STATUS_LABELS = {
    [UserStatus.ACTIVE]: 'Activo',
    [UserStatus.INACTIVE]: 'Inactivo',
    [UserStatus.SUSPENDED]: 'Suspendido',
    [UserStatus.PENDING]: 'Pendiente',
    [UserStatus.DEACTIVATED]: 'Desactivado',
    [UserStatus.BLOCKED]: 'Bloqueado',
} as const;
