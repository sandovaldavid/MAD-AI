import { ResourceTotals } from './resource-totals.model';
import { ResourcesByType } from './resource-type-stats.model';

export interface ResourceStats {
    total_recursos: number;
    recursos_activos: number;
    recursos_disponibles: number;
    recursos_asignados: number;
}

export interface GeneralStatistics {
    estadisticas_generales: ResourceStats;
    total_recursos: number;
    totales: ResourceTotals;
    por_tipo: ResourcesByType;
}
