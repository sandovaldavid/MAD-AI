import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Resource } from '@domain/entities/resource-management/resource.entity';
import { GetResourcesUseCase } from '@application/use-cases/resource-management/get-resources.use-case';
import { SearchResourcesUseCase } from '@application/use-cases/resource-management/search-resources.use-case';
import { FontAwesomeIconsModule } from '@/app/fontawesome-icons';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { ResourcesFilter } from '../../filters/resources-filter/resources-filter';
import { ResourceSearch } from '@domain/models/resource-management/resource-search.model';

@Component({
    selector: 'app-resources-table',
    standalone: true,
    imports: [CommonModule, FontAwesomeIconsModule, PaginationComponent, ResourcesFilter],
    templateUrl: './resources-table.html',
    styleUrls: ['./resources-table.css'],
})
export class ResourcesTable implements OnInit {
    private readonly getResourcesUseCase = inject(GetResourcesUseCase);
    private readonly searchResourcesUseCase = inject(SearchResourcesUseCase);

    resources = signal<Resource[]>([]);
    currentPage = signal(1);
    totalResources = signal(0);
    totalPages = signal(0);

    ngOnInit(): void {
        this.loadResources(this.currentPage());
    }

    loadResources(page: number): void {
        this.getResourcesUseCase.execute(page).subscribe((response) => {
            this.resources.set(response.results);
            this.totalResources.set(response.count);
            this.totalPages.set(Math.ceil(response.count / 20));
            this.currentPage.set(page);
        });
    }

    onPageChange(page: number): void {
        this.loadResources(page);
    }

    onFilterChange(criteria: ResourceSearch): void {
        this.searchResourcesUseCase.execute(criteria).subscribe((response) => {
            this.resources.set(response.results);
            this.totalResources.set(response.count);
            this.totalPages.set(Math.ceil(response.count / 20));
            this.currentPage.set(1);
        });
    }
}
