import { InjectionToken } from '@angular/core';
import { IResourceStatsRepository } from '@domain/repositories/resource-management/resource-stats.repository';

export const RESOURCE_STATS_REPOSITORY = new InjectionToken<IResourceStatsRepository>(
    'ResourceStatsRepository'
);
