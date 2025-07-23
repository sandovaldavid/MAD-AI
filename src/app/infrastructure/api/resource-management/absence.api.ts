import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Absence } from '@domain/entities/resource-management/absence.entity';
import { PaginatedResponse } from '../../dto/paginated-response.dto';

@Injectable()
export class AbsenceApiService {
    private readonly http = inject(HttpClient);
    private readonly url = `${environment.API_URL}/resource_management/absences`;

    getAll(): Observable<Absence[]> {
        return this.http
            .get<PaginatedResponse<Absence>>(this.url)
            .pipe(map((response) => response.results));
    }

    getById(id: string): Observable<Absence> {
        return this.http.get<Absence>(`${this.url}/${id}`);
    }

    create(absence: Partial<Absence>): Observable<Absence> {
        return this.http.post<Absence>(this.url, absence);
    }

    update(id: string, absence: Partial<Absence>): Observable<Absence> {
        return this.http.put<Absence>(`${this.url}/${id}`, absence);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.url}/${id}`);
    }
}
