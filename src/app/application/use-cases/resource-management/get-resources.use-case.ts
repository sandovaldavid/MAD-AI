import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '@domain/models/paginated-response.model';
import { Resource } from '@domain/entities/resource-management/resource.entity';
import { RESOURCE_REPOSITORY } from '@infrastructure/tokens/resource-management/resource.tokens';

@Injectable({ providedIn: 'root' })
export class GetResourcesUseCase {
    private readonly resourceRepository = inject(RESOURCE_REPOSITORY);

    execute(page: number): Observable<PaginatedResponse<Resource>> {
        return this.resourceRepository.getAll(page);
    }
}
