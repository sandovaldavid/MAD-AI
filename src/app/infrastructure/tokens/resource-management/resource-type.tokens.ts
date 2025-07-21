import { InjectionToken } from '@angular/core';
import { ResourceTypeUseCases } from '@application/use-cases/resource-management/resource-type.use-case';
import { ResourceTypeRepositoryImpl } from '@infrastructure/repositories/resource-management/resource-type.repository.impl';
import { ResourceTypeApiService } from '@infrastructure/api/resource-management/resource-type.api';

export const RESOURCE_TYPE_REPOSITORY = new InjectionToken<any>('ResourceTypeRepository');

export const RESOURCE_TYPE_PROVIDERS = [
    ResourceTypeUseCases,
    { provide: RESOURCE_TYPE_REPOSITORY, useClass: ResourceTypeRepositoryImpl },
    ResourceTypeApiService,
];
