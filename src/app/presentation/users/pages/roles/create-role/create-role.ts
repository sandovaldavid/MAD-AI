import {
    Component,
    ChangeDetectionStrategy,
    inject,
    OnInit,
    signal,
    computed,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

import { TitleService } from '@core/services/title.service';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@core/services/auth.service';
import { CreateRoleUseCase } from '@application/use-cases/role/create-role.use-case';

import { CreateRoleData } from '@domain/models/role/role.dto';
import { RoleAccessLevel, ROLE_ACCESS_LEVEL_LABELS } from '@domain/enums/role-access-level.enum';

import { Button } from '@shared/components/ui/button/button';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';
import { SlideToggleComponent } from '@shared/components/ui/slide-toggle/slide-toggle.component';

import { ShieldIcon } from '../../../icons/shield.icon/shield.icon';
import { InfoIcon } from '../../../icons/info.icon/info.icon';
import { SettingsIcon } from '../../../icons/settings.icon/settings.icon';

@Component({
    selector: 'app-create-role',
    imports: [
        ReactiveFormsModule,
        Button,
        InputComponent,
        SelectComponent,
        SlideToggleComponent,
        ShieldIcon,
        InfoIcon,
        SettingsIcon,
    ],
    templateUrl: './create-role.html',
    styleUrl: './create-role.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateRole implements OnInit {
    private readonly titleService = inject(TitleService);
    private readonly notificationService = inject(NotificationService);
    private readonly authService = inject(AuthService);
    private readonly createRoleUseCase = inject(CreateRoleUseCase);
    private readonly router = inject(Router);
    private readonly formBuilder = inject(FormBuilder);

    // Signals
    protected readonly isCreating = signal(false);
    protected readonly error = signal<string | null>(null);
    protected readonly isSubmitted = signal(false);

    // Form
    protected readonly createForm: FormGroup;

    // Computed properties for better performance and reactivity
    protected readonly formIsValid = computed(() => this.createForm.valid);
    protected readonly selectedAccessLevel = computed(
        () => this.createForm.get('accessLevel')?.value
    );
    protected readonly canSubmit = computed(() => 
        this.formIsValid() && !this.isCreating()
    );
    protected readonly formErrorsCount = computed(() => {
        const form = this.createForm;
        return Object.keys(form.controls).filter(key => {
            const control = form.get(key);
            return control?.errors && (control.touched || this.isSubmitted());
        }).length;
    });

    // Access level options
    protected readonly accessLevelOptions = [
        {
            value: RoleAccessLevel.ADMINISTRATOR,
            label: ROLE_ACCESS_LEVEL_LABELS[RoleAccessLevel.ADMINISTRATOR],
        },
        {
            value: RoleAccessLevel.PROJECT_MANAGER,
            label: ROLE_ACCESS_LEVEL_LABELS[RoleAccessLevel.PROJECT_MANAGER],
        },
        {
            value: RoleAccessLevel.TEAM_LEAD,
            label: ROLE_ACCESS_LEVEL_LABELS[RoleAccessLevel.TEAM_LEAD],
        },
        {
            value: RoleAccessLevel.DEVELOPER,
            label: ROLE_ACCESS_LEVEL_LABELS[RoleAccessLevel.DEVELOPER],
        },
        { value: RoleAccessLevel.USER, label: ROLE_ACCESS_LEVEL_LABELS[RoleAccessLevel.USER] },
    ];

    constructor() {
        this.createForm = this.formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
            description: ['', [Validators.required, Validators.minLength(1)]],
            accessLevel: [
                RoleAccessLevel.USER,
                [Validators.required, Validators.min(1), Validators.max(5)],
            ],
            canLeadProjects: [false],
            isUniquePerTeam: [false],
        });
    }

    ngOnInit(): void {
        this.titleService.setTitle('Crear Nuevo Rol');
    }

    protected onSubmit(): void {
        this.isSubmitted.set(true);

        if (!this.canSubmit()) {
            return;
        }

        // Get current user ID (this would come from AuthService)
        const currentUserId = this.getCurrentUserId();
        if (!currentUserId) {
            this.handleError('No se pudo obtener el usuario actual');
            return;
        }

        this.isCreating.set(true);
        this.error.set(null);

        const formValue = this.createForm.value;
        const createData: CreateRoleData = {
            name: formValue.name,
            description: formValue.description,
            accessLevel: formValue.accessLevel,
            canLeadProjects: formValue.canLeadProjects || false,
            isUniquePerTeam: formValue.isUniquePerTeam || false,
            createdByUserId: currentUserId,
        };

        this.createRoleUseCase
            .execute(createData)
            .pipe(
                catchError((error) => {
                    console.error('Error creating role:', error);
                    this.handleError('Error al crear el rol. Por favor, intenta nuevamente.');
                    return of(null);
                }),
                finalize(() => this.isCreating.set(false))
            )
            .subscribe((createdRole) => {
                if (createdRole) {
                    this.notificationService
                        .success('Éxito', `Rol "${createdRole.name}" creado exitosamente`)
                        .subscribe();
                    this.router.navigate(['/users/roles', createdRole.id]);
                }
            });
    }

    protected resetForm(): void {
        this.isSubmitted.set(false);
        this.createForm.reset({
            name: '',
            description: '',
            accessLevel: RoleAccessLevel.USER,
            canLeadProjects: false,
            isUniquePerTeam: false,
        });
        this.error.set(null);
    }

    protected goBack(): void {
        this.router.navigate(['/users/roles']);
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

    protected shouldShowError(fieldName: string): boolean {
        const field = this.createForm.get(fieldName);
        return !!(field && field.errors && (field.touched || this.isSubmitted()));
    }

    protected getFieldErrorMessage(fieldName: string): string {
        if (!this.shouldShowError(fieldName)) {
            return '';
        }

        const field = this.createForm.get(fieldName);
        if (!field || !field.errors) {
            return '';
        }

        const errors = field.errors;

        switch (fieldName) {
            case 'name':
                if (errors['required']) return 'El nombre es requerido';
                if (errors['minlength']) return 'El nombre debe tener al menos 1 carácter';
                if (errors['maxlength']) return 'El nombre no puede exceder 100 caracteres';
                break;
            case 'description':
                if (errors['required']) return 'La descripción es requerida';
                break;
            case 'accessLevel':
                if (errors['required']) return 'El nivel de acceso es requerido';
                break;
        }

        return '';
    }

    private getCurrentUserId(): number | null {
        // This is a placeholder - in a real app, this would come from AuthService
        // For now, we'll return a mock user ID
        return 1; // TODO: Replace with actual user ID from AuthService
    }

    private handleError(message: string): void {
        this.error.set(message);
        this.notificationService.error('Error', message).subscribe();
    }
}
