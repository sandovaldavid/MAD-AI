import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Resource } from '@domain/entities/resource-management/resource.entity';
import { RESOURCE_REPOSITORY } from '@domain/repositories/resource-management/resource.repository';
import { PaginatedResponse } from '@domain/models/paginated-response.model';

@Injectable()
export class GetResourcesUseCase {
    private readonly resourceRepository = inject(RESOURCE_REPOSITORY);

    execute(page: number): Observable<PaginatedResponse<Resource>> {
        return this.resourceRepository.getAll(page);
    }
}
