import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IAbsenceRepository } from '@domain/repositories/resource-management/absence.repository';
import { Absence } from '@domain/entities/resource-management/absence.entity';
import { ABSENCE_REPOSITORY } from '@infrastructure/tokens/resource-management/absence.tokens';

@Injectable()
export class AbsenceUseCases {
    constructor(@Inject(ABSENCE_REPOSITORY) private absenceRepository: IAbsenceRepository) {}

    getAllAbsences(): Observable<Absence[]> {
        return this.absenceRepository.getAll();
    }

    getAbsenceById(id: number): Observable<Absence> {
        return this.absenceRepository.getById(id);
    }

    createAbsence(absence: Partial<Absence>): Observable<Absence> {
        return this.absenceRepository.create(absence);
    }

    updateAbsence(id: number, absence: Partial<Absence>): Observable<Absence> {
        return this.absenceRepository.update(id, absence);
    }

    deleteAbsence(id: number): Observable<void> {
        return this.absenceRepository.delete(id);
    }
}
