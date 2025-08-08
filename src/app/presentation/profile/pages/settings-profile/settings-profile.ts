import { Component, inject, signal, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { TitleService } from '@core/services/title.service';
import { GetUserByIdUseCase } from '@application/use-cases/user/get-user-by-id.use-case';
import { UpdateUserUseCase } from '@application/use-cases/user/update-user.use-case';
import { UserEntity } from '@domain/entities/user.entity';
import { UpdateUserData } from '@domain/models/user/user.dto';
import { SlideToggleComponent } from '@shared/components/ui/slide-toggle/slide-toggle.component';
import { Button } from '@shared/components/ui/button/button';
import { BellIcon } from '../../icons/bell.icon';
import { ShieldIcon } from '../../icons/shield.icon';

@Component({
    selector: 'app-settings-profile',
    standalone: true,
    imports: [ReactiveFormsModule, SlideToggleComponent, Button, BellIcon, ShieldIcon],
    templateUrl: './settings-profile.html',
    styleUrl: './settings-profile.css',
})
export class SettingsProfile {
    private readonly authService = inject(AuthService);
    private readonly fb = inject(FormBuilder);
    private readonly getUserByIdUseCase = inject(GetUserByIdUseCase);
    private readonly updateUserUseCase = inject(UpdateUserUseCase);
    private readonly notificationService = inject(NotificationService);
    private readonly titleService = inject(TitleService);
    private readonly router = inject(Router);

    protected readonly isLoading = signal(true);
    protected readonly detailedUser = signal<UserEntity | null>(null);
    protected settingsForm: FormGroup;

    private readonly loggedInUser = this.authService.user;

    constructor() {
        this.titleService.setTitle('Configuración de Perfil');
        this.settingsForm = this.fb.group({
            emailNotificationsEnabled: [false],
            systemNotificationsEnabled: [false],
            taskNotificationsEnabled: [false],
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
            const user = this.detailedUser();
            if (user) {
                this.populateForm(user);
            }
        });
    }

    private loadUserDetails(id: number): void {
        this.isLoading.set(true);
        this.getUserByIdUseCase.execute(id).subscribe({
            next: (user) => {
                this.detailedUser.set(user);
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
        this.settingsForm.patchValue({
            emailNotificationsEnabled: user.emailNotificationsEnabled,
            systemNotificationsEnabled: user.systemNotificationsEnabled,
            taskNotificationsEnabled: user.taskNotificationsEnabled,
        });
    }

    protected saveChanges(): void {
        if (this.settingsForm.invalid || this.isLoading()) {
            return;
        }

        const userId = this.loggedInUser()?.id;
        if (!userId) {
            this.notificationService.error('Error', 'ID de usuario no válido.').subscribe();
            return;
        }

        this.isLoading.set(true);
        const formValue = this.settingsForm.value;
        const currentUser = this.detailedUser();

        const updatedData: UpdateUserData = {};

        if (formValue.emailNotificationsEnabled !== currentUser?.emailNotificationsEnabled) {
            updatedData.emailNotificationsEnabled = formValue.emailNotificationsEnabled;
        }
        if (formValue.systemNotificationsEnabled !== currentUser?.systemNotificationsEnabled) {
            updatedData.systemNotificationsEnabled = formValue.systemNotificationsEnabled;
        }
        if (formValue.taskNotificationsEnabled !== currentUser?.taskNotificationsEnabled) {
            updatedData.taskNotificationsEnabled = formValue.taskNotificationsEnabled;
        }

        if (Object.keys(updatedData).length === 0) {
            this.notificationService
                .info('Sin cambios', 'No se detectaron cambios para guardar.')
                .subscribe();
            this.isLoading.set(false);
            this.settingsForm.markAsPristine();
            return;
        }

        this.updateUserUseCase.execute(userId, updatedData).subscribe({
            next: () => {
                this.notificationService
                    .success('Éxito', 'Tus preferencias han sido actualizadas.')
                    .subscribe();
                this.settingsForm.markAsPristine();
            },
            error: (err) => {
                console.error('Error updating settings:', err);
                this.notificationService
                    .error('Error', 'No se pudieron guardar los cambios.')
                    .subscribe();
            },
            complete: () => {
                this.isLoading.set(false);
            },
        });
    }
}
