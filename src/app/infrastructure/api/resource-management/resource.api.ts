import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Resource } from '../../../domain/entities/resource-management/resource.entity';
import { environment } from '../../../../env/environment';

@Injectable()
export class ResourceApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.API_URL}/resource_management/resources`;

  getAll(): Observable<Resource[]> {
    return this.http.get<Resource[]>(this.apiUrl);
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
