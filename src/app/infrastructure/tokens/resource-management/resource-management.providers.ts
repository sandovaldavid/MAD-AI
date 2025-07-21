import { Provider } from '@angular/core';
import { ABSENCE_REPOSITORY } from './absence.tokens';
import { AbsenceRepositoryImpl } from '../../repositories/resource-management/absence.repository.impl';
import { HUMAN_RESOURCE_REPOSITORY } from './human-resource.tokens';
import { HumanResourceRepositoryImpl } from '../../repositories/resource-management/human-resource.repository.impl';
import { MATERIAL_RESOURCE_REPOSITORY } from './material-resource.tokens';
import { MaterialResourceRepositoryImpl } from '../../repositories/resource-management/material-resource.repository.impl';
import { RESOURCE_TYPE_REPOSITORY } from './resource-type.tokens';
import { ResourceTypeRepositoryImpl } from '../../repositories/resource-management/resource-type.repository.impl';
import { RESOURCE_REPOSITORY } from './resource.tokens';
import { ResourceRepositoryImpl } from '../../repositories/resource-management/resource.repository.impl';

// Import use cases
import { AbsenceUseCases } from '@application/use-cases/resource-management/absence.use-case';
import { HumanResourceUseCases } from '@application/use-cases/resource-management/human-resource.use-case';
import { MaterialResourceUseCases } from '@application/use-cases/resource-management/material-resource.use-case';
import { ResourceTypeUseCases } from '@application/use-cases/resource-management/resource-type.use-case';
import { ResourceUseCases } from '@application/use-cases/resource-management/resource.use-case';

export const resourceManagementProviders: Provider[] = [
    { provide: ABSENCE_REPOSITORY, useClass: AbsenceRepositoryImpl },
    { provide: HUMAN_RESOURCE_REPOSITORY, useClass: HumanResourceRepositoryImpl },
    { provide: MATERIAL_RESOURCE_REPOSITORY, useClass: MaterialResourceRepositoryImpl },
    { provide: RESOURCE_TYPE_REPOSITORY, useClass: ResourceTypeRepositoryImpl },
    { provide: RESOURCE_REPOSITORY, useClass: ResourceRepositoryImpl },
    // Use cases
    AbsenceUseCases,
    HumanResourceUseCases,
    MaterialResourceUseCases,
    ResourceTypeUseCases,
    ResourceUseCases,
];
