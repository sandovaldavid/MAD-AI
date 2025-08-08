import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DeactivateUserUseCase } from '@application/use-cases/user/deactivate-user.use-case';
import { GetUserByIdUseCase } from '@application/use-cases/user/get-user-by-id.use-case';
import { UserEntity } from '@domain/entities/user.entity';
import { NotificationService } from '@core/services/notification.service';
import { Button } from '@shared/components/ui/button/button';

@Component({
    selector: 'app-delete-user',
    imports: [Button],
    templateUrl: './delete-user.html',
    styleUrl: './delete-user.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteUser implements OnInit {
    private readonly deactivateUserUseCase = inject(DeactivateUserUseCase);
    private readonly getUserByIdUseCase = inject(GetUserByIdUseCase);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly notificationService = inject(NotificationService);

    protected readonly isLoading = signal(false);
    protected readonly isLoadingUser = signal(true);
    protected readonly user = signal<UserEntity | null>(null);
    private userId: number = 0;

    ngOnInit(): void {
        // Get user ID from route parameters
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.userId = parseInt(id, 10);
            this.loadUser();
        } else {
            this.notificationService.error('Error', 'ID de usuario no válido').subscribe();
            this.router.navigate(['/users']);
        }
    }

    private loadUser(): void {
        this.isLoadingUser.set(true);

        this.getUserByIdUseCase.execute(this.userId).subscribe({
            next: (user) => {
                this.user.set(user);
                this.isLoadingUser.set(false);
            },
            error: (error) => {
                console.error('Error loading user:', error);
                this.notificationService
                    .error('Error', 'Error al cargar los datos del usuario')
                    .subscribe();
                this.isLoadingUser.set(false);
                this.router.navigate(['/users']);
            },
        });
    }

    protected onConfirmDelete(): void {
        if (!this.isLoading()) {
            this.isLoading.set(true);

            // Usar deactivateUserUseCase en lugar de deleteUserUseCase
            this.deactivateUserUseCase
                .execute(this.userId, 'Desactivado desde la interfaz de administración')
                .subscribe({
                    next: () => {
                        const userName = this.user()?.username || 'Usuario';
                        this.notificationService
                            .success(
                                'Usuario desactivado',
                                `${userName} ha sido desactivado exitosamente`
                            )
                            .subscribe();
                        this.router.navigate(['/users']);
                    },
                    error: (error: any) => {
                        console.error('Error deactivating user:', error);
                        this.notificationService
                            .error(
                                'Error',
                                'Error al desactivar el usuario. Por favor, intenta nuevamente.'
                            )
                            .subscribe();
                        this.isLoading.set(false);
                    },
                });
        }
    }

    protected onCancelDelete(): void {
        this.router.navigate(['/users']);
    }
}
