import {
    Component,
    ChangeDetectionStrategy,
    inject,
    OnInit,
    signal,
    computed,
    effect,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

import { TitleService } from '@core/services/title.service';
import { NotificationService } from '@core/services/notification.service';
import { GetRoleByIdUseCase } from '@app/application/use-cases/role/get-role-by-id.use-case';
import { UpdateRoleUseCase } from '@app/application/use-cases/role/update-role.use-case';

import { RoleModel } from '@domain/models/role/role.model';
import { UpdateRoleModel } from '@domain/models/role/update-role.model';
import { RoleAccessLevel, ROLE_ACCESS_LEVEL_LABELS } from '@domain/enums/role-access-level.enum';

import { Button } from '@shared/components/ui/button/button';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';
import { SlideToggleComponent } from '@shared/components/ui/slide-toggle/slide-toggle.component';

import { ShieldIcon } from '../../../icons/shield.icon/shield.icon';
import { InfoIcon } from '../../../icons/info.icon/info.icon';
import { SettingsIcon } from '../../../icons/settings.icon/settings.icon';
import { CheckCircleIcon } from '../../../icons/check-circle.icon/check-circle.icon';
import { XCircleIcon } from '../../../icons/x-circle.icon/x-circle.icon';

@Component({
    selector: 'app-update-role',
    imports: [
        ReactiveFormsModule,
        Button,
        InputComponent,
        SelectComponent,
        SlideToggleComponent,
        ShieldIcon,
        InfoIcon,
        SettingsIcon,
        CheckCircleIcon,
        XCircleIcon,
    ],
    templateUrl: './update-role.html',
    styleUrl: './update-role.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateRole implements OnInit {
    private readonly titleService = inject(TitleService);
    private readonly notificationService = inject(NotificationService);
    private readonly getRoleByIdUseCase = inject(GetRoleByIdUseCase);
    private readonly updateRoleUseCase = inject(UpdateRoleUseCase);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly formBuilder = inject(FormBuilder);

    // Signals
    protected readonly isLoading = signal(false);
    protected readonly isUpdating = signal(false);
    protected readonly error = signal<string | null>(null);
    protected readonly role = signal<RoleModel | null>(null);
    protected readonly roleId = signal<number | null>(null);

    // Form
    protected readonly updateForm: FormGroup;

    // Computed properties
    protected readonly formIsValid = computed(() => this.updateForm.valid);
    protected readonly hasChanges = computed(() => {
        if (!this.role() || !this.updateForm) return false;
        
        const formValue = this.updateForm.value;
        const originalRole = this.role()!;
        
        return (
            formValue.name !== originalRole.name ||
            formValue.description !== originalRole.description ||
            formValue.access_level !== originalRole.access_level ||
            formValue.can_lead_projects !== originalRole.can_lead_projects ||
            formValue.is_unique_per_team !== originalRole.is_unique_per_team ||
            formValue.is_active !== originalRole.is_active
        );
    });

    // Access level options
    protected readonly accessLevelOptions = [
        { value: RoleAccessLevel.ADMINISTRATOR, label: ROLE_ACCESS_LEVEL_LABELS[RoleAccessLevel.ADMINISTRATOR] },
        { value: RoleAccessLevel.PROJECT_MANAGER, label: ROLE_ACCESS_LEVEL_LABELS[RoleAccessLevel.PROJECT_MANAGER] },
        { value: RoleAccessLevel.TEAM_LEAD, label: ROLE_ACCESS_LEVEL_LABELS[RoleAccessLevel.TEAM_LEAD] },
        { value: RoleAccessLevel.DEVELOPER, label: ROLE_ACCESS_LEVEL_LABELS[RoleAccessLevel.DEVELOPER] },
        { value: RoleAccessLevel.USER, label: ROLE_ACCESS_LEVEL_LABELS[RoleAccessLevel.USER] },
    ];

    constructor() {
        this.updateForm = this.formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
            description: ['', [Validators.required, Validators.minLength(1)]],
            access_level: [RoleAccessLevel.USER, [Validators.required, Validators.min(1), Validators.max(5)]],
            can_lead_projects: [false],
            is_unique_per_team: [false],
            is_active: [true],
        });

        // Effect to update form when role data is loaded
        effect(() => {
            const roleData = this.role();
            if (roleData) {
                this.updateForm.patchValue({
                    name: roleData.name,
                    description: roleData.description,
                    access_level: roleData.access_level,
                    can_lead_projects: roleData.can_lead_projects,
                    is_unique_per_team: roleData.is_unique_per_team,
                    is_active: roleData.is_active,
                });
            }
        });
    }

    ngOnInit(): void {
        this.titleService.setTitle('Editar Rol');
        this.loadRoleId();
    }

    private loadRoleId(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            const id = parseInt(idParam, 10);
            if (!isNaN(id)) {
                this.roleId.set(id);
                this.loadRoleData(id);
            } else {
                this.handleError('ID de rol inválido');
            }
        } else {
            this.handleError('ID de rol no encontrado');
        }
    }

    private loadRoleData(id: number): void {
        this.isLoading.set(true);
        this.error.set(null);

        this.getRoleByIdUseCase
            .execute(id)
            .pipe(
                catchError((error) => {
                    console.error('Error loading role:', error);
                    this.handleError('Error al cargar el rol. Por favor, intenta nuevamente.');
                    return of(null);
                }),
                finalize(() => this.isLoading.set(false))
            )
            .subscribe((role) => {
                if (role) {
                    this.role.set(role);
                    this.titleService.setTitle(`Editar Rol: ${role.name}`);
                }
            });
    }

    protected refresh(): void {
        const id = this.roleId();
        if (id) {
            this.loadRoleData(id);
        }
    }

    protected onSubmit(): void {
        if (!this.updateForm.valid || !this.hasChanges() || this.isUpdating()) {
            return;
        }

        const id = this.roleId();
        if (!id) {
            this.handleError('ID de rol no encontrado');
            return;
        }

        this.isUpdating.set(true);
        this.error.set(null);

        const formValue = this.updateForm.value;
        const updateData: UpdateRoleModel = {
            name: formValue.name,
            description: formValue.description,
            access_level: formValue.access_level,
            can_lead_projects: formValue.can_lead_projects,
            is_unique_per_team: formValue.is_unique_per_team,
            is_active: formValue.is_active,
        };

        this.updateRoleUseCase
            .execute(id, updateData)
            .pipe(
                catchError((error) => {
                    console.error('Error updating role:', error);
                    this.handleError('Error al actualizar el rol. Por favor, intenta nuevamente.');
                    return of(null);
                }),
                finalize(() => this.isUpdating.set(false))
            )
            .subscribe((updatedRole) => {
                if (updatedRole) {
                    this.role.set(updatedRole);
                    this.notificationService.success('Éxito', 'Rol actualizado exitosamente');
                    this.router.navigate(['/users/roles', id]);
                }
            });
    }

    protected goBack(): void {
        this.router.navigate(['/users/roles']);
    }

    protected navigateToDetail(): void {
        const id = this.roleId();
        if (id) {
            this.router.navigate(['/users/roles', id]);
        }
    }

    protected getAccessLevelLabel(level: RoleAccessLevel): string {
        return ROLE_ACCESS_LEVEL_LABELS[level] || 'Desconocido';
    }

    protected getAccessLevelBadgeClass(level: RoleAccessLevel): string {
        const levelClasses = {
            [RoleAccessLevel.ADMINISTRATOR]: 'access-level-1',
            [RoleAccessLevel.PROJECT_MANAGER]: 'access-level-2',
            [RoleAccessLevel.TEAM_LEAD]: 'access-level-3',
            [RoleAccessLevel.DEVELOPER]: 'access-level-4',
            [RoleAccessLevel.USER]: 'access-level-5',
        };
        return levelClasses[level] || 'access-level-5';
    }

    protected getStatusText(isActive: boolean): string {
        return isActive ? 'Activo' : 'Inactivo';
    }

    protected getStatusClass(isActive: boolean): string {
        return isActive ? 'status-active' : 'status-inactive';
    }

    private handleError(message: string): void {
        this.error.set(message);
        this.notificationService.error('Error', message);
    }
}
