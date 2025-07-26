import { InjectionToken } from '@angular/core';
import { IMaterialResourceStatsRepository } from '@domain/repositories/resource-management/material-resource-stats.repository';

export const MATERIAL_RESOURCE_STATS_REPOSITORY =
    new InjectionToken<IMaterialResourceStatsRepository>('MaterialResourceStatsRepository');
