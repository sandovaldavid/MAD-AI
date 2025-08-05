import { InjectionToken } from '@angular/core';
import { HumanResourcesRepository } from '@domain/repositories/resource-management/human-resources.repository';

export const HUMAN_RESOURCES_REPOSITORY = new InjectionToken<HumanResourcesRepository>(
    'HumanResourcesRepository'
);
