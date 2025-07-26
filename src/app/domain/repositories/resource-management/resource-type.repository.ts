import { Observable } from 'rxjs';
import { ResourceType } from '../../models/resource-management/resource-type.model';
import { PaginatedResponse } from '../../models/paginated-response.model';

export interface IResourceTypeRepository {
    getAll(): Observable<PaginatedResponse<ResourceType>>;
    getById(id: number): Observable<ResourceType>;
    create(resourceType: Partial<ResourceType>): Observable<ResourceType>;
    update(id: number, resourceType: Partial<ResourceType>): Observable<ResourceType>;
    delete(id: number): Observable<void>;
}
