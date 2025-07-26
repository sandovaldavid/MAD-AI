import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MaterialResourceStats } from '@domain/models/resource-management/material-resource-stats.model';
import { MATERIAL_RESOURCE_STATS_REPOSITORY } from '@infrastructure/tokens/resource-management/material-resource-stats.tokens';

@Injectable({ providedIn: 'root' })
export class GetMaterialResourceStatsUseCase {
    private readonly materialResourceStatsRepository = inject(MATERIAL_RESOURCE_STATS_REPOSITORY);

    execute(): Observable<MaterialResourceStats> {
        return this.materialResourceStatsRepository.getStats();
    }
}
