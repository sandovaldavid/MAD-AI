import { Component, ChangeDetectionStrategy } from '@angular/core';
import { UserStats } from '../../components/user-stats/user-stats';
import { UserTable } from '../../components/user-table/user-table';
import { UserListIcon } from '../../icons/user-list.icon/user-list.icon';

@Component({
    selector: 'app-dashboard',
    imports: [UserStats, UserTable,UserListIcon],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {}
