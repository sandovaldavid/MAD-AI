import { Component, ChangeDetectionStrategy, signal, OnInit, inject } from '@angular/core';
import { GetUserStatsUseCase } from '../../../../application/use-cases/user/get-user-stats.use-case';
import { UserStatsModel } from '../../../../domain/models/user/user-stats.model';

@Component({
  selector: 'app-user-stats',
  imports: [],
  templateUrl: './user-stats.html',
  styleUrl: './user-stats.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserStats implements OnInit {
  private readonly getUserStatsUseCase = inject(GetUserStatsUseCase);
  
  protected readonly userStats = signal<UserStatsModel | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadUserStats();
  }

  private loadUserStats(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.getUserStatsUseCase.execute().subscribe({
      next: (stats) => {
        this.userStats.set(stats);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar las estadísticas de usuarios');
        this.isLoading.set(false);
        console.error('Error loading user stats:', err);
      }
    });
  }

  protected refresh(): void {
    this.loadUserStats();
  }
}
