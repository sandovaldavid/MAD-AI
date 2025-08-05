import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeIconsModule } from '@/app/fontawesome-icons';
import { GetHumanResourcesStatsUseCase } from '@application/use-cases/resource-management/get-human-resources-stats.use-case';
import { HumanResourcesStats as HumanResourcesStatsModel } from '@domain/models/resource-management/human-resources-stats.model';

@Component({
    selector: 'app-human-resources-stats',
    standalone: true,
    imports: [CommonModule, FontAwesomeIconsModule],
    templateUrl: './human-resources-stats.html',
    styleUrl: './human-resources-stats.css',
})
export class HumanResourcesStats implements OnInit {
    private readonly getStatsUseCase = inject(GetHumanResourcesStatsUseCase);
    stats = signal<HumanResourcesStatsModel | null>(null);

    ngOnInit(): void {
        this.getStatsUseCase.execute().subscribe((data) => this.stats.set(data));
    }
}
