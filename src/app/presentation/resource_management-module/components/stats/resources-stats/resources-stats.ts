import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeIconsModule } from '@/app/fontawesome-icons';
import { GetResourceStatsUseCase } from '@application/use-cases/resource-management/get-resource-stats.use-case';
import { ResourceStats } from '@domain/models/resource-management/resource-stats.model';

@Component({
    selector: 'app-resources-stats',
    imports: [CommonModule, FontAwesomeIconsModule],
    templateUrl: './resources-stats.html',
    styleUrl: './resources-stats.css',
})
export class ResourcesStats implements OnInit {
    private readonly getResourceStatsUseCase = inject(GetResourceStatsUseCase);

    stats = signal<ResourceStats | null>(null);

    ngOnInit(): void {
        this.loadStats();
    }

    loadStats(): void {
        this.getResourceStatsUseCase.execute().subscribe((response) => {
            this.stats.set(response.estadisticas_generales);
        });
    }
}
