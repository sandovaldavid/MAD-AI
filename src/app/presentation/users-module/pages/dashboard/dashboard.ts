import { Component, ChangeDetectionStrategy } from '@angular/core';
import { UserStats } from '../../components/user-stats/user-stats';
import { UserTable } from '../../components/user-table/user-table';

@Component({
    selector: 'app-dashboard',
    imports: [UserStats, UserTable],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {}
