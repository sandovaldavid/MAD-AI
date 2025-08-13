import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RolesFacade } from '@application/facades/roles.facade';

@Component({
    selector: 'app-role-detail',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './role-detail.html',
    styleUrl: './role-detail.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleDetail {
    private facade = inject(RolesFacade);
    private route = inject(ActivatedRoute);

    role = this.facade.current;
    loading = this.facade.loading;
    error = this.facade.error;

    constructor() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        void this.facade.load(id);
    }
}
