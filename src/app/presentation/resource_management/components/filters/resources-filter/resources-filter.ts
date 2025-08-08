import { Component, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ResourceSearch } from '@domain/models/resource-management/resource-search.model';
import { ResourceType } from '@domain/models/resource-management/resource-type.model';
import { ResourceTypeUseCases } from '@application/use-cases/resource-management/resource-type.use-case';

@Component({
    selector: 'app-resources-filter',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './resources-filter.html',
    styleUrls: ['./resources-filter.css'],
})
export class ResourcesFilter implements OnInit {
    @Output() filterChange = new EventEmitter<ResourceSearch>();

    private readonly fb = inject(FormBuilder);
    private readonly resourceTypeUseCases = inject(ResourceTypeUseCases);

    resourceTypes = signal<ResourceType[]>([]);

    filterForm = this.fb.group({
        name: [''],
        resource_type_id: [null as number | null],
        availability_status: [''],
    });

    ngOnInit(): void {
        this.loadResourceTypes();
    }

    loadResourceTypes(): void {
        this.resourceTypeUseCases.getAllResourceTypes().subscribe((response) => {
            this.resourceTypes.set(response.results);
        });
    }

    onSubmit(): void {
        const rawValue = this.filterForm.getRawValue();
        const cleanCriteria: ResourceSearch = {};

        // Clean up the criteria to remove empty, null, or undefined values
        (Object.keys(rawValue) as Array<keyof typeof rawValue>).forEach((key) => {
            const value = rawValue[key];

            if (value !== '' && value !== null && value !== undefined) {
                (cleanCriteria as any)[key] = value;
            }
        });
        this.filterChange.emit(cleanCriteria);
    }

    resetFilter(): void {
        this.filterForm.reset();
        this.filterChange.emit({});
    }
}
