import {
    Component,
    ChangeDetectionStrategy,
    signal,
    inject,
    effect,
    computed,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UpdateUserUseCase } from '@application/use-cases/user/update-user.use-case';
import { GetUserByIdUseCase } from '@application/use-cases/user/get-user-by-id.use-case';
import { GetRolesUseCase } from '@application/use-cases/role/get-roles.use-case';
import { UpdateUserData } from '@domain/models/user/user.dto';
import { UserEntity } from '@domain/entities/user.entity';
import { RoleEntity } from '@domain/entities/role.entity';
import { UserStatus, USER_STATUS_LABELS } from '@domain/enums/user_status.enum';
import { NotificationService } from '@core/services/notification.service';
import { TitleService } from '@core/services/title.service';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';
import { Button } from '@shared/components/ui/button/button';
import { SlideToggleComponent } from '@shared/components/ui/slide-toggle/slide-toggle.component';
import { UserIcon } from '../../icons/user.icon/user.icon';
import { ShieldIcon } from '../../icons/shield.icon/shield.icon';
import { BellIcon } from '../../icons/bell.icon/bell.icon';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-update-user',
    imports: [
        ReactiveFormsModule,
        InputComponent,
        SelectComponent,
        Button,
        SlideToggleComponent,
        UserIcon,
        ShieldIcon,
        BellIcon,
    ],
    templateUrl: './update-user.html',
    styleUrl: './update-user.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateUser {
    private readonly formBuilder = inject(FormBuilder);
    private readonly updateUserUseCase = inject(UpdateUserUseCase);
    private readonly getUserByIdUseCase = inject(GetUserByIdUseCase);
    private readonly getRolesUseCase = inject(GetRolesUseCase);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly notificationService = inject(NotificationService);
    private readonly titleService = inject(TitleService);

    protected readonly isLoading = signal(false);
    protected readonly isLoadingUser = signal(true);
    protected readonly user = signal<UserEntity | null>(null);
    protected readonly roles = signal<RoleEntity[]>([]);
    private readonly userId = signal<number | null>(null);
    public readonly form: FormGroup;

    // Computed properties for better performance
    protected readonly roleOptions = computed(() =>
        this.roles().map((role) => ({
            value: role.id,
            label: role.name,
            disabled: !role.isActive,
        }))
    );

    protected readonly userFullName = computed(() => {
        const userData = this.user();
        return userData ? userData.fullName : '';
    });

    constructor() {
        this.form = this.formBuilder.group({
            firstName: [
                '',
                [Validators.required, Validators.minLength(1), Validators.maxLength(150)],
            ],
            lastName: [
                '',
                [Validators.required, Validators.minLength(1), Validators.maxLength(150)],
            ],
            email: ['', [Validators.required, Validators.email]],
            roleId: [null],
            isActive: [true],
            status: [UserStatus.ACTIVE],
            emailNotificationsEnabled: [true],
            systemNotificationsEnabled: [true],
            taskNotificationsEnabled: [true],
        });

        // Get userId from route params on initialization
        const params = this.route.snapshot.paramMap;
        const id = params.get('id');
        if (id) {
            const userId = Number(id);
            this.userId.set(userId);
            this.loadUserAndRoles(userId);
        }

        // Update title when user data is loaded
        effect(() => {
            const userData = this.user();
            if (userData) {
                this.titleService.setTitle(`Editar Usuario: ${userData.fullName}`);
            }
        });
    }

    private loadUserAndRoles(id: number): void {
        this.isLoadingUser.set(true);

        forkJoin({
            user: this.getUserByIdUseCase.execute(id),
            roles: this.getRolesUseCase.execute(),
        }).subscribe({
            next: ({ user, roles }) => {
                this.user.set(user);
                this.roles.set(roles.filter((role) => role.isActive));
                this.populateForm(user);
                this.isLoadingUser.set(false);
            },
            error: (error) => {
                console.error('Error loading user and roles:', error);
                this.notificationService
                    .error('Error', 'Error al cargar los datos del usuario')
                    .subscribe();
                this.isLoadingUser.set(false);
            },
        });
    }

    private loadUser(id: number): void {
        this.isLoadingUser.set(true);

        this.getUserByIdUseCase.execute(id).subscribe({
            next: (user) => {
                this.user.set(user);
                this.populateForm(user);
                this.isLoadingUser.set(false);
            },
            error: (error) => {
                console.error('Error loading user:', error);
                this.notificationService
                    .error('Error', 'Error al cargar los datos del usuario')
                    .subscribe();
                this.isLoadingUser.set(false);
            },
        });
    }

    private populateForm(user: UserEntity): void {
        this.form.patchValue({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isActive: user.isActive,
            roleId: user.roleId,
            status: user.status,
            emailNotificationsEnabled: user.emailNotificationsEnabled,
            systemNotificationsEnabled: user.systemNotificationsEnabled,
            taskNotificationsEnabled: user.taskNotificationsEnabled,
        });
    }

    protected onSubmit(): void {
        if (this.form.valid && !this.isLoading()) {
            const id = this.userId();
            if (!id) {
                this.notificationService.error('Error', 'ID de usuario no válido').subscribe();
                return;
            }

            this.isLoading.set(true);

            const userData: UpdateUserData = {};
            const formValue = this.form.value;
            const currentUser = this.user();

            // Only include changed fields
            if (formValue.firstName !== currentUser?.firstName) {
                userData.firstName = formValue.firstName;
            }
            if (formValue.lastName !== currentUser?.lastName) {
                userData.lastName = formValue.lastName;
            }
            if (formValue.email !== currentUser?.email) {
                userData.email = formValue.email;
            }
            if (formValue.isActive !== currentUser?.isActive) {
                userData.isActive = formValue.isActive;
            }
            if (formValue.roleId && formValue.roleId !== currentUser?.roleId) {
                userData.roleId = formValue.roleId;
            }
            if (formValue.status !== currentUser?.status) {
                userData.status = formValue.status;
            }
            if (
                formValue.emailNotificationsEnabled !== currentUser?.emailNotificationsEnabled
            ) {
                userData.emailNotificationsEnabled = formValue.emailNotificationsEnabled;
            }
            if (
                formValue.systemNotificationsEnabled !== currentUser?.systemNotificationsEnabled
            ) {
                userData.systemNotificationsEnabled = formValue.systemNotificationsEnabled;
            }
            if (formValue.taskNotificationsEnabled !== currentUser?.taskNotificationsEnabled) {
                userData.taskNotificationsEnabled = formValue.taskNotificationsEnabled;
            }

            if (Object.keys(userData).length > 0) {
                this.updateUserUseCase.execute(id, userData).subscribe({
                    next: (user) => {
                        this.notificationService
                            .success(
                                'Usuario actualizado',
                                `Usuario ${user.username} actualizado exitosamente`
                            )
                            .subscribe();
                        this.router.navigate(['/users']);
                    },
                    error: (error) => {
                        console.error('Error updating user:', error);
                        this.notificationService
                            .error(
                                'Error',
                                'Error al actualizar el usuario. Por favor, intenta nuevamente.'
                            )
                            .subscribe();
                        this.isLoading.set(false);
                    },
                });
            } else {
                this.notificationService
                    .info('Sin cambios', 'No se detectaron cambios para actualizar')
                    .subscribe();
                this.isLoading.set(false);
            }
        } else {
            this.markFormGroupTouched();
        }
    }

    protected onCancel(): void {
        this.router.navigate(['/users']);
    }

    protected getFieldError(fieldName: string): string | null {
        const field = this.form.get(fieldName);

        if (field?.errors && field.touched) {
            if (field.errors['required']) return `${this.getFieldLabel(fieldName)} es requerido`;
            if (field.errors['email']) return 'Email debe tener un formato válido';
            if (field.errors['minlength'])
                return `${this.getFieldLabel(fieldName)} debe tener al menos ${
                    field.errors['minlength'].requiredLength
                } caracteres`;
            if (field.errors['maxlength'])
                return `${this.getFieldLabel(fieldName)} no puede exceder ${
                    field.errors['maxlength'].requiredLength
                } caracteres`;
        }

        return null;
    }

    private getFieldLabel(fieldName: string): string {
        const labels: { [key: string]: string } = {
            firstName: 'Nombre',
            lastName: 'Apellido',
            email: 'Email',
            status: 'Estado',
            emailNotificationsEnabled: 'Notificaciones por email',
            systemNotificationsEnabled: 'Notificaciones del sistema',
            taskNotificationsEnabled: 'Notificaciones de tareas',
        };

        return labels[fieldName] || fieldName;
    }

    private markFormGroupTouched(): void {
        Object.keys(this.form.controls).forEach((key) => {
            this.form.get(key)?.markAsTouched();
        });
    }

    protected getUserStatusOptions() {
        return Object.values(UserStatus).map(status => ({
            value: status,
            label: USER_STATUS_LABELS[status]
        }));
    }
}
