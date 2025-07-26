import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GeneralStatistics } from '@domain/models/resource-management/resource-stats.model';
import { RESOURCE_STATS_REPOSITORY } from '@infrastructure/tokens/resource-management/resource-stats.tokens';

@Injectable({ providedIn: 'root' })
export class GetResourceStatsUseCase {
    private readonly resourceStatsRepository = inject(RESOURCE_STATS_REPOSITORY);

    execute(): Observable<GeneralStatistics> {
        return this.resourceStatsRepository.getStats();
    }
}
