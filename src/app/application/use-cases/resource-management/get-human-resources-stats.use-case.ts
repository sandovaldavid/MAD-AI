import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HumanResourcesStats } from '@domain/models/resource-management/human-resources-stats.model';
import { HUMAN_RESOURCES_REPOSITORY } from '@infrastructure/tokens/resource-management/human-resources.repository.token';

@Injectable({ providedIn: 'root' })
export class GetHumanResourcesStatsUseCase {
    private readonly repository = inject(HUMAN_RESOURCES_REPOSITORY);

    execute(): Observable<HumanResourcesStats> {
        return this.repository.getStats();
    }
}
