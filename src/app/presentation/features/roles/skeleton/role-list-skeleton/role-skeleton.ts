import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-role-skeleton',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './role-list-skeleton.html',
    styleUrls: ['./role-list-skeleton.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleSkeleton {
    readonly skeletonItems = Array(6).fill(0); // Show 6 skeleton cards by default
}
