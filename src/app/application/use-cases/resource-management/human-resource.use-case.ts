import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IHumanResourceRepository } from '@domain/repositories/resource-management/human-resource.repository';
import { HumanResource } from '@domain/entities/resource-management/human-resource.entity';
import { HUMAN_RESOURCE_REPOSITORY } from '@infrastructure/tokens/resource-management/human-resource.tokens';

@Injectable()
export class HumanResourceUseCases {
    constructor(
        @Inject(HUMAN_RESOURCE_REPOSITORY) private humanResourceRepository: IHumanResourceRepository
    ) {}

    getAllHumanResources(): Observable<HumanResource[]> {
        return this.humanResourceRepository.getAll();
    }

    getHumanResourceById(id: string): Observable<HumanResource> {
        return this.humanResourceRepository.getById(id);
    }

    createHumanResource(humanResource: Partial<HumanResource>): Observable<HumanResource> {
        return this.humanResourceRepository.create(humanResource);
    }

    updateHumanResource(
        id: string,
        humanResource: Partial<HumanResource>
    ): Observable<HumanResource> {
        return this.humanResourceRepository.update(id, humanResource);
    }

    deleteHumanResource(id: string): Observable<void> {
        return this.humanResourceRepository.delete(id);
    }
}
