import { InjectionToken } from '@angular/core';
import { ResourceUseCases } from '@application/use-cases/resource-management/resource.use-case';
import { ResourceRepositoryImpl } from '@infrastructure/repositories/resource-management/resource.repository.impl';
import { ResourceApiService } from '@infrastructure/api/resource-management/resource.api';

export const RESOURCE_REPOSITORY = new InjectionToken<any>('ResourceRepository');

export const RESOURCE_PROVIDERS = [
    ResourceUseCases,
    { provide: RESOURCE_REPOSITORY, useClass: ResourceRepositoryImpl },
    ResourceApiService,
];
