import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserStats } from '../../components/user-stats/user-stats';
import { UserTable } from '../../components/user-table/user-table';
import { UserListIcon } from '../../icons/user-list.icon/user-list.icon';
import { UserStatisticsIcon } from '../../icons/user-statistics.icon/user-statistics.icon';
import { Button } from '@/app/shared/components/ui/button/button';

@Component({
    selector: 'app-dashboard',
    imports: [UserStats, UserTable, UserListIcon, UserStatisticsIcon, Button],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
    private readonly router = inject(Router);

    protected goRoles(): void {
        this.router.navigate(['/users/roles']);
    }
}
