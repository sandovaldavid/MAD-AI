import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MaterialResourceStats } from '@domain/models/resource-management/material-resource-stats.model';
import { IMaterialResourceStatsRepository } from '@domain/repositories/resource-management/material-resource-stats.repository';
import { MaterialResourceStatsDTO } from '../../dto/resource-management/material-resource-stats.dto';
import { environment } from '@/env/environment';

@Injectable({ providedIn: 'root' })
export class MaterialResourceStatsRepositoryImpl extends IMaterialResourceStatsRepository {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.API_URL}/resource_management/material-resources/inventory-statistics/`;

    getStats(): Observable<MaterialResourceStats> {
        return this.http.get<MaterialResourceStatsDTO>(this.apiUrl);
    }
}
