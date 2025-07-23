import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HumanResource } from '@domain/entities/resource-management/human-resource.entity';
import { PaginatedResponse } from '../../dto/paginated-response.dto';

@Injectable()
export class HumanResourceApiService {
    private readonly http = inject(HttpClient);
    private readonly url = `${environment.API_URL}/resource_management/human-resources`;

    getAll(): Observable<HumanResource[]> {
        return this.http
            .get<PaginatedResponse<HumanResource>>(this.url)
            .pipe(map((response) => response.results));
    }

    getById(id: string): Observable<HumanResource> {
        return this.http.get<HumanResource>(`${this.url}/${id}`);
    }

    create(humanResource: Partial<HumanResource>): Observable<HumanResource> {
        return this.http.post<HumanResource>(this.url, humanResource);
    }

    update(id: string, humanResource: Partial<HumanResource>): Observable<HumanResource> {
        return this.http.put<HumanResource>(`${this.url}/${id}`, humanResource);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.url}/${id}`);
    }
}
