import { InjectionToken } from '@angular/core';
import { HumanResourceUseCases } from '@application/use-cases/resource-management/human-resource.use-case';
import { HumanResourceRepositoryImpl } from '@infrastructure/repositories/resource-management/human-resource.repository.impl';
import { HumanResourceApiService } from '@infrastructure/api/resource-management/human-resource.api';

export const HUMAN_RESOURCE_REPOSITORY = new InjectionToken<any>('HumanResourceRepository');

export const HUMAN_RESOURCE_PROVIDERS = [
    HumanResourceUseCases,
    { provide: HUMAN_RESOURCE_REPOSITORY, useClass: HumanResourceRepositoryImpl },
    HumanResourceApiService,
];
