export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
    PENDING = 'pending',
}

export const USER_STATUS_LABELS = {
    [UserStatus.ACTIVE]: 'Activo',
    [UserStatus.INACTIVE]: 'Inactivo',
    [UserStatus.SUSPENDED]: 'Suspendido',
    [UserStatus.PENDING]: 'Pendiente',
} as const;
