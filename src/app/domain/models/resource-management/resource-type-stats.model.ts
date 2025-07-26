export interface ResourceTypeStats {
    tipo_id: number;
    total: number;
    activos: number;
    asignados: number;
    disponibles: number;
}

export interface ResourcesByType {
    [key: string]: ResourceTypeStats;
}
