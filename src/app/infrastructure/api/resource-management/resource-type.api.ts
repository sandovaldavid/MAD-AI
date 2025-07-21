import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResourceType } from '../../../domain/entities/resource-management/resource-type.entity';
import { environment } from '../../../../env/environment';

@Injectable()
export class ResourceTypeApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.API_URL}/resource_management/resource-types`;

  getAll(): Observable<ResourceType[]> {
    return this.http.get<ResourceType[]>(this.apiUrl);
  }

  getById(id: number): Observable<ResourceType> {
    return this.http.get<ResourceType>(`${this.apiUrl}/${id}`);
  }

  create(resourceType: Partial<ResourceType>): Observable<ResourceType> {
    return this.http.post<ResourceType>(this.apiUrl, resourceType);
  }

  update(id: number, resourceType: Partial<ResourceType>): Observable<ResourceType> {
    return this.http.put<ResourceType>(`${this.apiUrl}/${id}`, resourceType);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
