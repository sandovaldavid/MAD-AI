import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '@domain/models/paginated-response.model';
import { Resource } from '@domain/entities/resource-management/resource.entity';
import { ResourceSearch } from '@domain/models/resource-management/resource-search.model';
import { RESOURCE_REPOSITORY } from '@infrastructure/tokens/resource-management/resource.tokens';

@Injectable({ providedIn: 'root' })
export class SearchResourcesUseCase {
    private readonly resourceRepository = inject(RESOURCE_REPOSITORY);

    execute(criteria: ResourceSearch): Observable<PaginatedResponse<Resource>> {
        return this.resourceRepository.search(criteria);
    }
}
