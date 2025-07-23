import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Resource } from '@domain/entities/resource-management/resource.entity';
import { GetResourcesUseCase } from '@application/use-cases/resource-management/get-resources.use-case';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'app-resources-table',
    imports: [CommonModule, FontAwesomeModule],
    templateUrl: './resources-table.html',
    styleUrl: './resources-table.css',
})
export class ResourcesTable implements OnInit {
    private readonly getResourcesUseCase = inject(GetResourcesUseCase);

    resources$!: Observable<Resource[]>;

    ngOnInit(): void {
        this.resources$ = this.getResourcesUseCase.execute();
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'available':
                return 'bg-green-200 text-green-800';
            case 'assigned':
                return 'bg-yellow-200 text-yellow-800';
            case 'maintenance':
                return 'bg-blue-200 text-blue-800';
            case 'unavailable':
                return 'bg-red-200 text-red-800';
            default:
                return 'bg-gray-200 text-gray-800';
        }
    }
}
