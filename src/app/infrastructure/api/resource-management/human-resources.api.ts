import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { HumanResourcesStats } from '@domain/models/resource-management/human-resources-stats.model';

@Injectable()
export class HumanResourcesApi {
    private readonly http = inject(HttpClient);
    private readonly url = `${environment.API_URL}/resource_management/human-resources`;

    getStats(): Observable<HumanResourcesStats> {
        return this.http.get<HumanResourcesStats>(`${this.url}/stats/`);
    }
}
