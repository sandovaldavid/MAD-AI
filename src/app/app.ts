import {
    Component,
    inject,
    OnInit,
    ChangeDetectionStrategy,
    signal,
    computed,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppInitializationService } from '@core/services/app-initialization.service';
import { AuthLoadingComponent } from '@shared/components/auth-loading/auth-loading.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, AuthLoadingComponent],
    templateUrl: './app.html',
    styleUrl: './app.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
    protected readonly title = 'MAD-AI-NEW';
    private readonly appInitializationService = inject(AppInitializationService);

    // Señal local para el estado de inicialización
    private readonly _isInitialized = signal(false);
    protected readonly isInitialized = computed(() => this._isInitialized());

    async ngOnInit(): Promise<void> {
        await this.appInitializationService.initialize();
        this._isInitialized.set(true);
    }
}
