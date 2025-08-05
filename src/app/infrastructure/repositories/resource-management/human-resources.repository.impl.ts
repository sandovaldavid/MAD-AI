import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HumanResourcesRepository } from '@domain/repositories/resource-management/human-resources.repository';
import { HumanResourcesStats } from '@domain/models/resource-management/human-resources-stats.model';
import { HumanResourcesApi } from '@infrastructure/api/resource-management/human-resources.api';

@Injectable({ providedIn: 'root' })
export class HumanResourcesRepositoryImpl implements HumanResourcesRepository {
    constructor(private readonly api: HumanResourcesApi) {}

    getStats(): Observable<HumanResourcesStats> {
        return this.api.getStats();
    }
}
