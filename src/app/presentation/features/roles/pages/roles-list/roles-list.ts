import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RolesFacade } from '@application/facades/roles.facade';

@Component({
    selector: 'app-roles-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './roles-list.html',
    styleUrl: './roles-list.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesList {
    private facade = inject(RolesFacade);
    readonly loading = this.facade.loading;
    readonly roles = this.facade.roles;
    readonly error = this.facade.error;

    search = signal('');
    activeFilter = signal<boolean | null>(null);

    constructor() {
        effect(() => {
            void this.facade.refresh({
                search: this.search(),
                active: this.activeFilter() || undefined,
            });
        });
    }

    onToggleActive(rid: number) {}
    onDelete(rid: number) {
        void this.facade.delete(rid);
    }
}
