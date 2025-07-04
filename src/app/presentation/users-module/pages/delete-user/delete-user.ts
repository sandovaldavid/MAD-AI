import { Component, ChangeDetectionStrategy, signal, inject, OnInit, input } from '@angular/core';
import { Router } from '@angular/router';
import { DeleteUserUseCase } from '../../../../application/use-cases/user/delete-user.use-case';
import { GetUsersUseCase } from '../../../../application/use-cases/user/get-users.use-case';
import { UserListModel } from '../../../../domain/models/user/user-list.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { ModalConfirmation } from '../../../../shared/components/ui/modal-confirmation/modal-confirmation';

@Component({
  selector: 'app-delete-user',
  imports: [ModalConfirmation],
  templateUrl: './delete-user.html',
  styleUrl: './delete-user.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteUser implements OnInit {
  private readonly deleteUserUseCase = inject(DeleteUserUseCase);
  private readonly getUsersUseCase = inject(GetUsersUseCase);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  // Input for user ID from route
  readonly userId = input.required<number>();

  protected readonly isLoading = signal(false);
  protected readonly isLoadingUser = signal(true);
  protected readonly user = signal<UserListModel | null>(null);
  protected readonly showConfirmModal = signal(true);

  ngOnInit(): void {
    this.loadUser();
  }

  private loadUser(): void {
    this.isLoadingUser.set(true);
    
    this.getUsersUseCase.execute().subscribe({
      next: (users) => {
        const foundUser = users.find(u => u.id === this.userId());
        if (foundUser) {
          this.user.set(foundUser);
        } else {
          this.notificationService.error('Error', 'Usuario no encontrado').subscribe();
          this.router.navigate(['/users']);
        }
        this.isLoadingUser.set(false);
      },
      error: (error) => {
        console.error('Error loading user:', error);
        this.notificationService.error('Error', 'Error al cargar los datos del usuario').subscribe();
        this.isLoadingUser.set(false);
        this.router.navigate(['/users']);
      }
    });
  }

  protected onConfirmDelete(): void {
    if (!this.isLoading()) {
      this.isLoading.set(true);

      this.deleteUserUseCase.execute(this.userId()).subscribe({
        next: () => {
          const userName = this.user()?.username || 'Usuario';
          this.notificationService.success('Usuario eliminado', `${userName} ha sido eliminado exitosamente`).subscribe();
          this.router.navigate(['/users']);
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.notificationService.error('Error', 'Error al eliminar el usuario. Por favor, intenta nuevamente.').subscribe();
          this.isLoading.set(false);
        }
      });
    }
  }

  protected onCancelDelete(): void {
    this.router.navigate(['/users']);
  }

  protected getConfirmationTitle(): string {
    return 'Eliminar Usuario';
  }

  protected getConfirmationMessage(): string {
    const user = this.user();
    if (user) {
      return `¿Estás seguro de que deseas eliminar a ${user.first_name} ${user.last_name} (${user.username})? Esta acción no se puede deshacer.`;
    }
    return '¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.';
  }
}
