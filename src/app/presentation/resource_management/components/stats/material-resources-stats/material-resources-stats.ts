import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeIconsModule } from '@/app/fontawesome-icons';
import { GetMaterialResourceStatsUseCase } from '@application/use-cases/resource-management/get-material-resource-stats.use-case';
import { MaterialResourceStats } from '@domain/models/resource-management/material-resource-stats.model';

@Component({
    selector: 'app-material-resources-stats',
    standalone: true,
    imports: [CommonModule, FontAwesomeIconsModule],
    templateUrl: './material-resources-stats.html',
    styleUrl: './material-resources-stats.css',
})
export class MaterialResourcesStats implements OnInit {
    private readonly getMaterialResourceStatsUseCase = inject(GetMaterialResourceStatsUseCase);

    stats = signal<MaterialResourceStats | null>(null);

    ngOnInit(): void {
        this.loadStats();
    }

    loadStats(): void {
        this.getMaterialResourceStatsUseCase.execute().subscribe((response) => {
            this.stats.set(response);
        });
    }
}
