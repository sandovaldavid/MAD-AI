import { ResourceDetailRepositoryImpl } from '../repositories/resource-management/resource-detail.repository.impl';
import { ResourceTypeCacheRepositoryImpl } from '../repositories/resource-management/resource-type-cache.repository.impl';
import { RESOURCE_DETAIL_REPOSITORY } from '@domain/repositories/resource-management/resource-detail.repository';
import { RESOURCE_TYPE_CACHE_REPOSITORY } from '@domain/repositories/resource-management/resource-type-cache.repository';
import { HumanResourcesByRol } from '@presentation/resource_management/components/chart/human-resources-by-rol/human-resources-by-rol';
import { Provider } from '@angular/core';
import { ABSENCE_REPOSITORY } from './resource-management/absence.tokens';
import { AbsenceRepositoryImpl } from '../repositories/resource-management/absence.repository.impl';
import { HUMAN_RESOURCES_REPOSITORY } from '@infrastructure/tokens/resource-management/human-resources.repository.token';
import { HumanResourcesRepositoryImpl } from '@infrastructure/repositories/resource-management/human-resources.repository.impl';
import { HUMAN_RESOURCE_REPOSITORY } from './resource-management/human-resource.tokens';
import { HumanResourceRepositoryImpl } from '../repositories/resource-management/human-resource.repository.impl';
import { MATERIAL_RESOURCE_REPOSITORY } from './resource-management/material-resource.tokens';
import { MaterialResourceRepositoryImpl } from '../repositories/resource-management/material-resource.repository.impl';
import { RESOURCE_TYPE_REPOSITORY } from './resource-management/resource-type.tokens';
import { ResourceTypeRepositoryImpl } from '../repositories/resource-management/resource-type.repository.impl';
import { RESOURCE_REPOSITORY } from './resource-management/resource.tokens';
import { ResourceRepositoryImpl } from '@infrastructure/repositories/resource-management/resource.repository.impl';

// API Services
import { ResourceApiService } from '@infrastructure/api/resource-management/resource.api';
import { HumanResourceApiService } from '@infrastructure/api/resource-management/human-resource.api';
import { HumanResourcesApi } from '@infrastructure/api/resource-management/human-resources.api';
import { MaterialResourceApiService } from '@infrastructure/api/resource-management/material-resource.api';
import { AbsenceApiService } from '@infrastructure/api/resource-management/absence.api';
import { ResourceTypeApiService } from '@infrastructure/api/resource-management/resource-type.api';
import { RESOURCE_STATS_REPOSITORY } from './resource-management/resource-stats.tokens';
import { ResourceStatsRepositoryImpl } from '../repositories/resource-management/resource-stats.repository.impl';
import { MATERIAL_RESOURCE_STATS_REPOSITORY } from './resource-management/material-resource-stats.tokens';
import { MaterialResourceStatsRepositoryImpl } from '../repositories/resource-management/material-resource-stats.repository.impl';

// Use Cases
import { GetResourcesUseCase } from '@application/use-cases/resource-management/get-resources.use-case';
import { AbsenceUseCases } from '@application/use-cases/resource-management/absence.use-case';
import { HumanResourceUseCases } from '@application/use-cases/resource-management/human-resource.use-case';
import { MaterialResourceUseCases } from '@application/use-cases/resource-management/material-resource.use-case';
import { ResourceTypeUseCases } from '@application/use-cases/resource-management/resource-type.use-case';
import { GetResourceStatsUseCase } from '@application/use-cases/resource-management/get-resource-stats.use-case';
import { GetMaterialResourceStatsUseCase } from '@application/use-cases/resource-management/get-material-resource-stats.use-case';
import { SearchResourcesUseCase } from '@application/use-cases/resource-management/search-resources.use-case';

import { GetResourceDetailUseCase } from '@application/use-cases/resource-management/get-resource-detail.use-case';

import { ResourceTypeCacheUseCase } from '@application/use-cases/resource-management/resource-type-cache.use-case';

export const resourceManagementProviders: Provider[] = [
    // Repositories
    { provide: ABSENCE_REPOSITORY, useClass: AbsenceRepositoryImpl },
    { provide: HUMAN_RESOURCE_REPOSITORY, useClass: HumanResourceRepositoryImpl },
    { provide: MATERIAL_RESOURCE_REPOSITORY, useClass: MaterialResourceRepositoryImpl },
    { provide: RESOURCE_TYPE_REPOSITORY, useClass: ResourceTypeRepositoryImpl },
    { provide: RESOURCE_REPOSITORY, useClass: ResourceRepositoryImpl },
    { provide: RESOURCE_STATS_REPOSITORY, useClass: ResourceStatsRepositoryImpl },
    { provide: MATERIAL_RESOURCE_STATS_REPOSITORY, useClass: MaterialResourceStatsRepositoryImpl },
    { provide: HUMAN_RESOURCES_REPOSITORY, useClass: HumanResourcesRepositoryImpl },
    { provide: RESOURCE_DETAIL_REPOSITORY, useClass: ResourceDetailRepositoryImpl },
    { provide: RESOURCE_TYPE_CACHE_REPOSITORY, useClass: ResourceTypeCacheRepositoryImpl },
    HumanResourcesByRol,
    // API Services
    ResourceApiService,
    HumanResourceApiService,
    HumanResourcesApi,
    MaterialResourceApiService,
    AbsenceApiService,
    ResourceTypeApiService,
    // Use Cases
    GetResourcesUseCase,
    AbsenceUseCases,
    HumanResourceUseCases,
    MaterialResourceUseCases,
    ResourceTypeUseCases,
    GetResourceStatsUseCase,
    GetMaterialResourceStatsUseCase,
    SearchResourcesUseCase,
    GetResourceDetailUseCase,
    ResourceTypeCacheUseCase,
];
