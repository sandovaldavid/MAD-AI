import { Component, ChangeDetectionStrategy, signal, inject, effect } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GetUserByIdUseCase } from '@application/use-cases/user/get-user-by-id.use-case';
import { UserListModel } from '@domain/models/user/user-list.model';
import { DatePipe } from '@angular/common';
import { TitleService } from '@core/services/title.service';

@Component({
    selector: 'app-detail-user',
    imports: [DatePipe],
    templateUrl: './detail-user.html',
    styleUrl: './detail-user.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailUser {
    private readonly getUserByIdUseCase = inject(GetUserByIdUseCase);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly titleService = inject(TitleService);

    protected readonly user = signal<UserListModel | null>(null);
    protected readonly isLoading = signal(true);
    protected readonly error = signal<string | null>(null);
    private readonly userId = signal<number | null>(null);

    constructor() {
        // Get userId from route params on initialization
        const params = this.route.snapshot.paramMap;
        const id = params.get('id');
        if (id) {
            const userId = Number(id);
            this.userId.set(userId);
            this.loadUser(userId);
        }

        // Update title when user data is loaded
        effect(() => {
            const userData = this.user();
            if (userData) {
                this.titleService.setTitle(
                    `Perfil de ${userData.full_name}`
                );
            }
        });
    }

    private loadUser(id: number): void {
        this.isLoading.set(true);
        this.error.set(null);

        this.getUserByIdUseCase.execute(id).subscribe({
            next: (user) => {
                this.user.set(user);
                this.isLoading.set(false);
            },
            error: (err) => {
                this.error.set('Error al cargar los datos del usuario');
                this.isLoading.set(false);
                console.error('Error loading user:', err);
            },
        });
    }

    protected goBack(): void {
        this.router.navigate(['/users']);
    }

    protected navigateToEdit(): void {
        const id = this.userId();
        if (id) {
            this.router.navigate(['/users', id, 'edit']);
        }
    }

    protected getStatusBadgeClass(isActive: boolean): string {
        return isActive ? 'status-badge-active' : 'status-badge-inactive';
    }

    protected getStatusText(isActive: boolean): string {
        return isActive ? 'Activo' : 'Inactivo';
    }
}
