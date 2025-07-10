import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { TitleService } from '@core/services/title.service';
import { RoleTable } from '../../components/role-table/role-table';
import { Button } from '@shared/components/ui/button/button';

@Component({
    selector: 'app-roles',
    imports: [RoleTable, Button],
    templateUrl: './roles.html',
    styleUrl: './roles.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Roles implements OnInit {
    private readonly titleService = inject(TitleService);
    private readonly router = inject(Router);

    ngOnInit(): void {
        this.titleService.setTitle('Gestión de Roles');
    }

    goBack(): void {
        this.router.navigate(['/users']);
    }
}
