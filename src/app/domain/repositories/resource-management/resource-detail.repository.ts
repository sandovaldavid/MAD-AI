import { InjectionToken } from '@angular/core';
export const RESOURCE_DETAIL_REPOSITORY = new InjectionToken<ResourceDetailRepository>(
    'ResourceDetailRepository'
);
import { ResourceDetail } from '../../models/resource-management/resource-detail.model';
import { MaterialResourceDetail } from '../../models/resource-management/material-resource-detail.model';
import { HumanResourceDetail } from '../../models/resource-management/human-resource-detail.model';

export interface ResourceDetailRepository {
    getResourceDetail(id: number): Promise<ResourceDetail>;
    getMaterialResourceDetail(resourceId: number): Promise<MaterialResourceDetail>;
    getHumanResourceDetail(resourceId: number): Promise<HumanResourceDetail>;
}
