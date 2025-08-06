import { inject } from '@angular/core';
import {
    RESOURCE_DETAIL_REPOSITORY,
    ResourceDetailRepository,
} from '@domain/repositories/resource-management/resource-detail.repository';
import { ResourceDetail } from '@domain/models/resource-management/resource-detail.model';
import { MaterialResourceDetail } from '@domain/models/resource-management/material-resource-detail.model';
import { HumanResourceDetail } from '@domain/models/resource-management/human-resource-detail.model';

export class GetResourceDetailUseCase {
    private readonly repository = inject(RESOURCE_DETAIL_REPOSITORY) as ResourceDetailRepository;

    async execute(id: number): Promise<ResourceDetail> {
        return this.repository.getResourceDetail(id);
    }

    async getMaterialDetail(resourceId: number): Promise<MaterialResourceDetail> {
        return this.repository.getMaterialResourceDetail(resourceId);
    }

    async getHumanDetail(resourceId: number): Promise<HumanResourceDetail> {
        return this.repository.getHumanResourceDetail(resourceId);
    }
}
