import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CreateUserUseCase } from '../../../../application/use-cases/user/create-user.use-case';
import { GetRolesUseCase } from '../../../../application/use-cases/role/get-roles.use-case';
import { CreateUserModel } from '../../../../domain/models/user/create-user.model';
import { RoleListModel } from '../../../../domain/models/role/role-list.model';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
    selector: 'app-create-user',
    imports: [ReactiveFormsModule],
    templateUrl: './create-user.html',
    styleUrl: './create-user.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateUser {
    private readonly formBuilder = inject(FormBuilder);
    private readonly createUserUseCase = inject(CreateUserUseCase);
    private readonly getRolesUseCase = inject(GetRolesUseCase);
    private readonly router = inject(Router);
    private readonly notificationService = inject(NotificationService);

    protected readonly isLoading = signal(false);
    protected readonly roles = signal<RoleListModel[]>([]);
    protected readonly form: FormGroup;

    constructor() {
        this.form = this.formBuilder.group({
            username: [
                '',
                [Validators.required, Validators.minLength(3), Validators.maxLength(150)],
            ],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            first_name: [
                '',
                [Validators.required, Validators.minLength(1), Validators.maxLength(150)],
            ],
            last_name: [
                '',
                [Validators.required, Validators.minLength(1), Validators.maxLength(150)],
            ],
            role_id: [null],
        });

        // Load available roles
        this.loadRoles();
    }

    private loadRoles(): void {
        this.getRolesUseCase.execute().subscribe({
            next: (roles) => {
                this.roles.set(roles.filter((role) => role.is_active));
            },
            error: (error) => {
                console.error('Error loading roles:', error);
                this.notificationService
                    .error('Error', 'Error al cargar los roles disponibles')
                    .subscribe();
            },
        });
    }

    protected onSubmit(): void {
        if (this.form.valid && !this.isLoading()) {
            this.isLoading.set(true);

            const userData: CreateUserModel = this.form.value;

            this.createUserUseCase.execute(userData).subscribe({
                next: (user) => {
                    this.notificationService
                        .success('Usuario creado', `Usuario ${user.username} creado exitosamente`)
                        .subscribe();
                    this.router.navigate(['/users']);
                },
                error: (error) => {
                    console.error('Error creating user:', error);
                    this.notificationService
                        .error('Error', 'Error al crear el usuario. Por favor, intenta nuevamente.')
                        .subscribe();
                    this.isLoading.set(false);
                },
            });
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
            username: 'Nombre de usuario',
            email: 'Email',
            password: 'Contraseña',
            first_name: 'Nombre',
            last_name: 'Apellido',
        };

        return labels[fieldName] || fieldName;
    }

    private markFormGroupTouched(): void {
        Object.keys(this.form.controls).forEach((key) => {
            this.form.get(key)?.markAsTouched();
        });
    }
}
