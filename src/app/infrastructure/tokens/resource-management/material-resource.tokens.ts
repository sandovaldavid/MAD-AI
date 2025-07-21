import { InjectionToken } from '@angular/core';
import { MaterialResourceUseCases } from '@application/use-cases/resource-management/material-resource.use-case';
import { MaterialResourceRepositoryImpl } from '@infrastructure/repositories/resource-management/material-resource.repository.impl';
import { MaterialResourceApiService } from '@infrastructure/api/resource-management/material-resource.api';

export const MATERIAL_RESOURCE_REPOSITORY = new InjectionToken<any>(
  'MaterialResourceRepository'
);

export const MATERIAL_RESOURCE_PROVIDERS = [
  MaterialResourceUseCases,
  {
    provide: MATERIAL_RESOURCE_REPOSITORY,
    useClass: MaterialResourceRepositoryImpl,
  },
  MaterialResourceApiService,
];
