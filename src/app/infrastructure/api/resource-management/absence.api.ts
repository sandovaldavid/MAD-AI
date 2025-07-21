import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { Absence } from '../../../domain/entities/resource-management/absence.entity';

@Injectable()
export class AbsenceApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.API_URL}/absences`;

  getAll(): Observable<Absence[]> {
    return this.http.get<Absence[]>(this.url);
  }

  getById(id: number): Observable<Absence> {
    return this.http.get<Absence>(`${this.url}/${id}`);
  }

  create(absence: Partial<Absence>): Observable<Absence> {
    return this.http.post<Absence>(this.url, absence);
  }

  update(id: number, absence: Partial<Absence>): Observable<Absence> {
    return this.http.put<Absence>(`${this.url}/${id}`, absence);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
