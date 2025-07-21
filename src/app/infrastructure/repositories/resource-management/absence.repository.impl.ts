
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IAbsenceRepository } from '../../../domain/repositories/resource-management/absence.repository';
import { Absence } from '../../../domain/entities/resource-management/absence.entity';
import { AbsenceApiService } from '../../api/resource-management/absence.api';

@Injectable()
export class AbsenceRepositoryImpl implements IAbsenceRepository {
  constructor(private apiService: AbsenceApiService) {}

  getAll(): Observable<Absence[]> {
    return this.apiService.getAll();
  }

  getById(id: number): Observable<Absence> {
    return this.apiService.getById(id);
  }

  create(absence: Partial<Absence>): Observable<Absence> {
    return this.apiService.create(absence);
  }

  update(id: number, absence: Partial<Absence>): Observable<Absence> {
    return this.apiService.update(id, absence);
  }

  delete(id: number): Observable<void> {
    return this.apiService.delete(id);
  }
}
