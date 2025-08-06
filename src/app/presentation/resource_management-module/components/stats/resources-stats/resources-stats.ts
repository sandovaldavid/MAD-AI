import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ResourceStats } from '@domain/models/resource-management/resource-stats.model';

@Component({
    selector: 'app-resources-stats',
    standalone: true,
    imports: [CommonModule, FontAwesomeModule],
    templateUrl: './resources-stats.html',
    styleUrl: './resources-stats.css',
})
export class ResourcesStats {
    stats = input<ResourceStats | null>(null);
}
