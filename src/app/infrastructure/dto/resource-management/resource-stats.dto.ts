export interface ResourceStatsValuesDTO {
    total_recursos: number;
    recursos_activos: number;
    recursos_disponibles: number;
    recursos_asignados: number;
    carga_promedio: number;
    carga_maxima: number;
    carga_minima: number;
}

export interface GeneralStatisticsDTO {
    estadisticas_generales: ResourceStatsValuesDTO;
    total_recursos: number;
}

export interface FullStatsResponseDTO {
    totales: Record<string, number>;
    por_tipo: Record<string, any>;
    estadisticas_generales: GeneralStatisticsDTO;
}
