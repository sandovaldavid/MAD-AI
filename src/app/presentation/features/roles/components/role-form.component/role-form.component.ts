import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RolesFacade } from '@application/facades/roles.facade';

@Component({
    selector: 'app-role-form',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './role-form.component.html',
    styleUrl: './role-form.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleFormComponent {
    private facade = inject(RolesFacade);
    name = signal('');
    accessLevel = signal(3);
    description = signal('');

    async submit() {
        await this.facade.create({
            name: this.name(),
            accessLevel: Number(this.accessLevel()),
            description: this.description() || undefined,
        });
        // limpiar / navegar…
    }
}
