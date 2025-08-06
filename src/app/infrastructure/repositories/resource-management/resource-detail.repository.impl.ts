import { Injectable } from '@angular/core';
import { ResourceDetailRepository } from '@domain/repositories/resource-management/resource-detail.repository';
import { ResourceDetail } from '@domain/models/resource-management/resource-detail.model';
import { MaterialResourceDetail } from '@domain/models/resource-management/material-resource-detail.model';
import { HumanResourceDetail } from '@domain/models/resource-management/human-resource-detail.model';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@/env/environment';

@Injectable({ providedIn: 'root' })
export class ResourceDetailRepositoryImpl implements ResourceDetailRepository {
    constructor(private http: HttpClient) {}

    private readonly apiUrl = `${environment.API_URL}/resource_management`;

    async getResourceDetail(id: number): Promise<ResourceDetail> {
        return await firstValueFrom(
            this.http.get<ResourceDetail>(`${this.apiUrl}/resources/${id}/`)
        );
    }

    async getMaterialResourceDetail(resourceId: number): Promise<MaterialResourceDetail> {
        return await firstValueFrom(
            this.http.get<MaterialResourceDetail>(
                `${this.apiUrl}/material-resources/${resourceId}/`
            )
        );
    }

    async getHumanResourceDetail(resourceId: number): Promise<HumanResourceDetail> {
        return await firstValueFrom(
            this.http.get<HumanResourceDetail>(
                `${this.apiUrl}/human-resources/${resourceId}/`
            )
        );
    }
}
