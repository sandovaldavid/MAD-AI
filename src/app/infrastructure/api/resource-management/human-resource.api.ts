import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { HumanResource } from '../../../domain/entities/resource-management/human-resource.entity';

@Injectable()
export class HumanResourceApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.API_URL}/resource_management/human-resources`;

  getAll(): Observable<HumanResource[]> {
    return this.http.get<HumanResource[]>(this.url);
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
