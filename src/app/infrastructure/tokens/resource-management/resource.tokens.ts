import { InjectionToken } from '@angular/core';
import { ResourceUseCases } from '@application/use-cases/resource-management/resource.use-case';
import { ResourceRepositoryImpl } from '@infrastructure/repositories/resource-management/resource.repository.impl';
import { ResourceApiService } from '@infrastructure/api/resource-management/resource.api';
import { IResourceRepository } from '@domain/repositories/resource-management/resource.repository';

export const RESOURCE_REPOSITORY = new InjectionToken<IResourceRepository>('ResourceRepository');

export const RESOURCE_PROVIDERS = [
    ResourceUseCases,
    { provide: RESOURCE_REPOSITORY, useClass: ResourceRepositoryImpl },
    ResourceApiService,
];
