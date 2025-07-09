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
import { UpdateUserModel } from '@domain/models/user/update-user.model';
import { UserListModel } from '@domain/models/user/user-list.model';
import { RoleListModel } from '@domain/models/role/role-list.model';
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
    protected readonly user = signal<UserListModel | null>(null);
    protected readonly roles = signal<RoleListModel[]>([]);
    private readonly userId = signal<number | null>(null);
    protected readonly form: FormGroup;

    // Computed properties for better performance
    protected readonly roleOptions = computed(() =>
        this.roles().map((role) => ({
            value: role.id,
            label: role.name,
            disabled: !role.is_active,
        }))
    );

    protected readonly userFullName = computed(() => {
        const userData = this.user();
        return userData ? `${userData.first_name} ${userData.last_name}` : '';
    });

    constructor() {
        this.form = this.formBuilder.group({
            first_name: [
                '',
                [Validators.required, Validators.minLength(1), Validators.maxLength(150)],
            ],
            last_name: [
                '',
                [Validators.required, Validators.minLength(1), Validators.maxLength(150)],
            ],
            email: ['', [Validators.required, Validators.email]],
            role_id: [null],
            is_active: [true],
            status: [''],
            email_notifications_enabled: [true],
            system_notifications_enabled: [true],
            task_notifications_enabled: [true],
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
                this.titleService.setTitle(`Editar Usuario: ${userData.first_name} ${userData.last_name}`);
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
                this.roles.set(roles.filter((role) => role.is_active));
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

    private populateForm(user: UserListModel): void {
        this.form.patchValue({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            is_active: user.is_active,
            role_id: user.role_id,
            status: user.status || '',
            email_notifications_enabled: user.email_notifications_enabled ?? true,
            system_notifications_enabled: user.system_notifications_enabled ?? true,
            task_notifications_enabled: user.task_notifications_enabled ?? true,
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

            const userData: UpdateUserModel = {};
            const formValue = this.form.value;
            const currentUser = this.user();

            // Only include changed fields
            if (formValue.first_name !== currentUser?.first_name) {
                userData.first_name = formValue.first_name;
            }
            if (formValue.last_name !== currentUser?.last_name) {
                userData.last_name = formValue.last_name;
            }
            if (formValue.email !== currentUser?.email) {
                userData.email = formValue.email;
            }
            if (formValue.is_active !== currentUser?.is_active) {
                userData.is_active = formValue.is_active;
            }
            if (formValue.role_id && formValue.role_id !== currentUser?.role_id) {
                userData.role_id = formValue.role_id;
            }
            if (formValue.status !== currentUser?.status) {
                userData.status = formValue.status;
            }
            if (
                formValue.email_notifications_enabled !== currentUser?.email_notifications_enabled
            ) {
                userData.email_notifications_enabled = formValue.email_notifications_enabled;
            }
            if (
                formValue.system_notifications_enabled !== currentUser?.system_notifications_enabled
            ) {
                userData.system_notifications_enabled = formValue.system_notifications_enabled;
            }
            if (formValue.task_notifications_enabled !== currentUser?.task_notifications_enabled) {
                userData.task_notifications_enabled = formValue.task_notifications_enabled;
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
            first_name: 'Nombre',
            last_name: 'Apellido',
            email: 'Email',
            status: 'Estado',
            email_notifications_enabled: 'Notificaciones por email',
            system_notifications_enabled: 'Notificaciones del sistema',
            task_notifications_enabled: 'Notificaciones de tareas',
        };

        return labels[fieldName] || fieldName;
    }

    private markFormGroupTouched(): void {
        Object.keys(this.form.controls).forEach((key) => {
            this.form.get(key)?.markAsTouched();
        });
    }
}
