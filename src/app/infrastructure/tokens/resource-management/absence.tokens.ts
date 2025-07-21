import { InjectionToken } from '@angular/core';
import { AbsenceUseCases } from '@application/use-cases/resource-management/absence.use-case';
import { AbsenceRepositoryImpl } from '@infrastructure/repositories/resource-management/absence.repository.impl';
import { AbsenceApiService } from '@infrastructure/api/resource-management/absence.api';

export const ABSENCE_REPOSITORY = new InjectionToken<any>('AbsenceRepository');

export const ABSENCE_PROVIDERS = [
    AbsenceUseCases,
    { provide: ABSENCE_REPOSITORY, useClass: AbsenceRepositoryImpl },
    AbsenceApiService,
];
