import { Component, inject, signal, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { TitleService } from '@core/services/title.service';
import { GetUserByIdUseCase } from '@application/use-cases/user/get-user-by-id.use-case';
import { UpdateUserUseCase } from '@application/use-cases/user/update-user.use-case';
import { UserEntity } from '@domain/entities/user.entity';
import { UpdateUserData } from '@domain/models/user/user.dto';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { Button } from '@shared/components/ui/button/button';
import { IconUser } from '../../icons/icon-user';
import { IconMail } from '../../icons/icon-mail';

@Component({
    selector: 'app-update-profile',
    standalone: true,
    imports: [ReactiveFormsModule, InputComponent, Button, IconUser, IconMail],
    templateUrl: './update-profile.html',
    styleUrl: './update-profile.css',
})
export class UpdateProfile {
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly getUserByIdUseCase = inject(GetUserByIdUseCase);
    private readonly updateUserUseCase = inject(UpdateUserUseCase);
    private readonly notificationService = inject(NotificationService);
    private readonly titleService = inject(TitleService);
    private readonly router = inject(Router);

    protected readonly isLoading = signal(true);
    protected readonly user = signal<UserEntity | null>(null);
    protected updateForm: FormGroup;

    private readonly loggedInUser = this.authService.user;

    constructor() {
        this.titleService.setTitle('Actualizar Perfil');
        this.updateForm = this.fb.group({
            firstName: ['', [Validators.required, Validators.maxLength(50)]],
            lastName: ['', [Validators.required, Validators.maxLength(50)]],
            email: ['', [Validators.required, Validators.email]],
        });

        const userId = this.loggedInUser()?.id;
        if (userId) {
            this.loadUserDetails(userId);
        } else {
            this.isLoading.set(false);
            this.notificationService
                .error('Error', 'No se pudo obtener el ID del usuario.')
                .subscribe();
        }

        effect(() => {
            const userData = this.user();
            if (userData) {
                this.populateForm(userData);
            }
        });
    }

    private loadUserDetails(id: number): void {
        this.isLoading.set(true);
        this.getUserByIdUseCase.execute(id).subscribe({
            next: (user) => {
                this.user.set(user);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading user details:', err);
                this.notificationService
                    .error('Error', 'No se pudieron cargar los datos del perfil.')
                    .subscribe();
                this.isLoading.set(false);
            },
        });
    }

    private populateForm(user: UserEntity): void {
        this.updateForm.patchValue({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
        });
    }

    protected saveChanges(): void {
        if (this.updateForm.invalid || this.isLoading()) {
            return;
        }

        const userId = this.loggedInUser()?.id;
        if (!userId) {
            this.notificationService.error('Error', 'ID de usuario no válido.').subscribe();
            return;
        }

        this.isLoading.set(true);
        const formValue = this.updateForm.value;
        const currentUser = this.user();

        const updatedData: UpdateUserData = {};

        if (formValue.firstName !== currentUser?.firstName) {
            updatedData.firstName = formValue.firstName;
        }
        if (formValue.lastName !== currentUser?.lastName) {
            updatedData.lastName = formValue.lastName;
        }
        if (formValue.email !== currentUser?.email) {
            updatedData.email = formValue.email;
        }

        if (Object.keys(updatedData).length === 0) {
            this.notificationService
                .info('Sin cambios', 'No se detectaron cambios para guardar.')
                .subscribe();
            this.isLoading.set(false);
            this.updateForm.markAsPristine();
            return;
        }

        this.updateUserUseCase.execute(userId, updatedData).subscribe({
            next: (updatedUser) => {
                this.notificationService
                    .success('Éxito', 'Tu perfil ha sido actualizado.')
                    .subscribe();

                // Actualizar el estado del usuario en AuthService
                this.authService.updateUserData({
                    first_name: updatedUser.firstName,
                    last_name: updatedUser.lastName,
                    email: updatedUser.email,
                });

                this.updateForm.markAsPristine();
                this.router.navigate(['/profile']);
            },
            error: (err) => {
                console.error('Error updating profile:', err);
                this.notificationService
                    .error('Error', 'No se pudieron guardar los cambios.')
                    .subscribe();
            },
            complete: () => {
                this.isLoading.set(false);
            },
        });
    }

    protected onCancel(): void {
        this.router.navigate(['/profile']);
    }
}
