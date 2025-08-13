export interface RoleModel {
    id: number;
    displayName: string; // "Administrator (L1)"
    name: string; // limpio
    accessLevel: number; // 1..5
    isActive: boolean;
    description?: string;
    userCount?: number;
    badgeTone: 'success' | 'warning' | 'error' | 'info';
}
