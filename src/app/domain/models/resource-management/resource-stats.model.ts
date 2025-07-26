export interface ResourceStats {
    total_recursos: number;
    recursos_activos: number;
    recursos_disponibles: number;
    recursos_asignados: number;
}

export interface GeneralStatistics {
    estadisticas_generales: ResourceStats;
    total_recursos: number;
}
