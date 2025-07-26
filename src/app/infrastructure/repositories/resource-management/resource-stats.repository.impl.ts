import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GeneralStatistics } from '@domain/models/resource-management/resource-stats.model';
import { IResourceStatsRepository } from '@domain/repositories/resource-management/resource-stats.repository';
import { FullStatsResponseDTO } from '../../dto/resource-management/resource-stats.dto';
import { environment } from '@/env/environment';

@Injectable({ providedIn: 'root' })
export class ResourceStatsRepositoryImpl extends IResourceStatsRepository {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.API_URL}/resource_management/resources/stats/`;

    getStats(): Observable<GeneralStatistics> {
        return this.http.get<FullStatsResponseDTO>(this.apiUrl).pipe(
            map((dto) => {
                const generalStats = dto.estadisticas_generales.estadisticas_generales;
                return {
                    estadisticas_generales: {
                        total_recursos: generalStats.total_recursos,
                        recursos_activos: generalStats.recursos_activos,
                        recursos_disponibles: generalStats.recursos_disponibles,
                        recursos_asignados: generalStats.recursos_asignados,
                    },
                    total_recursos: dto.estadisticas_generales.total_recursos,
                    totales: dto.totales,
                };
            })
        );
    }
}
