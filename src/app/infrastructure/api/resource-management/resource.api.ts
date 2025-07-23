import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Resource } from '../../../domain/entities/resource-management/resource.entity';
import { environment } from '../../../../env/environment';
import { PaginatedResponse } from '../../dto/paginated-response.dto';

@Injectable()
export class ResourceApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.API_URL}/resource_management/resources`;

  getAll(page: number): Observable<PaginatedResponse<Resource>> {
    return this.http.get<PaginatedResponse<Resource>>(`${this.apiUrl}?page=${page}`);
  }

  getById(id: number): Observable<Resource> {
    return this.http.get<Resource>(`${this.apiUrl}/${id}`);
  }

  create(resource: Partial<Resource>): Observable<Resource> {
    return this.http.post<Resource>(this.apiUrl, resource);
  }

  update(id: number, resource: Partial<Resource>): Observable<Resource> {
    return this.http.put<Resource>(`${this.apiUrl}/${id}`, resource);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
