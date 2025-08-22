import {
    Component,
    Input,
    Output,
    EventEmitter,
    computed,
    signal,
    inject,
    OnInit,
    ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Application layer imports
import { RolesFacade } from '@application/facades/roles.facade';

// Presentation layer imports
import { RoleModel } from '../../models/role.model';
import { RoleSelectorComponent, RoleSelectionEvent } from '../role-selector/role-selector';

export interface UserRoleAssignmentData {
    userId: number;
    username: string;
    email: string;
    currentRoleId: number | null;
    newRoleId: number | null;
}

@Component({
    selector: 'app-user-role-assignment-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RoleSelectorComponent],
    templateUrl: './user-role-assignment-form.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserRoleAssignmentFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly rolesFacade = inject(RolesFacade);

    // Input properties
    @Input() userData: UserRoleAssignmentData | null = null;
    @Input() allowSameRole: boolean = false;

    // Output events
    @Output() roleAssigned = new EventEmitter<{
        userId: number;
        newRoleId: number;
        reason?: string;
    }>();
    @Output() cancelled = new EventEmitter<void>();

    // Form definition
    readonly assignmentForm: FormGroup = this.fb.group({
        roleId: [null, [Validators.required]],
        reason: [''],
    });

    // Internal state
    private readonly _selectedRoleId = signal<number | null>(null);
    private readonly _loading = signal(false);
    private readonly _error = signal<string | null>(null);
    private readonly _success = signal<string | null>(null);

    // Computed properties
    readonly selectedRoleId = computed(() => this._selectedRoleId());
    readonly loading = computed(() => this._loading() || this.rolesFacade.loading());
    readonly error = computed(() => this._error() || this.rolesFacade.error());
    readonly success = computed(() => this._success());

    readonly currentRole = computed(() => {
        if (!this.userData?.currentRoleId) return null;
        return (
            this.rolesFacade.roles().find((role) => role.id === this.userData!.currentRoleId) ||
            null
        );
    });

    readonly selectedRole = computed(() => {
        const selectedId = this._selectedRoleId();
        if (!selectedId) return null;
        return this.rolesFacade.roles().find((role) => role.id === selectedId) || null;
    });

    readonly excludedRoleIds = computed(() => {
        if (this.allowSameRole || !this.userData?.currentRoleId) return [];
        return [this.userData.currentRoleId];
    });

    readonly hasRoleChanged = computed(() => {
        const selectedId = this._selectedRoleId();
        return selectedId !== null && selectedId !== this.userData?.currentRoleId;
    });

    readonly hasValidSelection = computed(() => {
        return this._selectedRoleId() !== null;
    });

    readonly roleError = computed(() => {
        const control = this.assignmentForm.get('roleId');
        if (control?.errors && control.touched) {
            if (control.errors['required']) {
                return 'Please select a role';
            }
        }
        return null;
    });

    async ngOnInit() {
        // Load roles if needed
        if (this.rolesFacade.roles().length === 0) {
            await this.rolesFacade.refresh();
        }

        // Set initial form values
        if (this.userData?.newRoleId) {
            this._selectedRoleId.set(this.userData.newRoleId);
            this.assignmentForm.patchValue({
                roleId: this.userData.newRoleId,
            });
        }
    }

    onRoleSelectionChange(event: RoleSelectionEvent) {
        const roleId = event.role?.id || null;
        this._selectedRoleId.set(roleId);
        this.assignmentForm.patchValue({ roleId });
        this._error.set(null);
    }

    onRoleSelect(role: RoleModel) {
        console.log('Role selected:', role);
        this._success.set(null);
    }

    async onSubmit() {
        if (!this.assignmentForm.valid || !this.userData || !this.hasValidSelection()) {
            return;
        }

        this._loading.set(true);
        this._error.set(null);
        this._success.set(null);

        try {
            const formData = this.assignmentForm.value;

            // Emit the assignment event
            this.roleAssigned.emit({
                userId: this.userData.userId,
                newRoleId: formData.roleId,
                reason: formData.reason || undefined,
            });

            this._success.set('Role assigned successfully!');

            // Reset form after a short delay
            setTimeout(() => {
                this.resetForm();
            }, 2000);
        } catch (error: any) {
            this._error.set(error?.message || 'Failed to assign role');
        } finally {
            this._loading.set(false);
        }
    }

    onCancel() {
        this.resetForm();
        this.cancelled.emit();
    }

    private resetForm() {
        this.assignmentForm.reset();
        this._selectedRoleId.set(null);
        this._error.set(null);
        this._success.set(null);
    }
}
