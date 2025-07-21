
import { Observable } from 'rxjs';
import { Absence } from '../../entities/resource-management/absence.entity';

export interface IAbsenceRepository {
  getAll(): Observable<Absence[]>;
  getById(id: number): Observable<Absence>;
  create(absence: Partial<Absence>): Observable<Absence>;
  update(id: number, absence: Partial<Absence>): Observable<Absence>;
  delete(id: number): Observable<void>;
}
