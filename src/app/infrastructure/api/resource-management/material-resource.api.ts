import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MaterialResource } from '@domain/entities/resource-management/material-resource.entity';
import { PaginatedResponse } from '../../dto/paginated-response.dto';

@Injectable()
export class MaterialResourceApiService {
    private readonly http = inject(HttpClient);
    private readonly url = `${environment.API_URL}/resource_management/material-resources`;

    getAll(): Observable<MaterialResource[]> {
        return this.http
            .get<PaginatedResponse<MaterialResource>>(this.url)
            .pipe(map((response) => response.results));
    }

    getById(id: string): Observable<MaterialResource> {
        return this.http.get<MaterialResource>(`${this.url}/${id}`);
    }

    create(materialResource: Partial<MaterialResource>): Observable<MaterialResource> {
        return this.http.post<MaterialResource>(this.url, materialResource);
    }

    update(id: string, materialResource: Partial<MaterialResource>): Observable<MaterialResource> {
        return this.http.put<MaterialResource>(`${this.url}/${id}`, materialResource);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.url}/${id}`);
    }
}
