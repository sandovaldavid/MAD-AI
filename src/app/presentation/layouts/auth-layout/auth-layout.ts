import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '@core/services/theme.service';

@Component({
    selector: 'app-auth-layout',
    standalone: true,
    imports: [RouterOutlet],
    templateUrl: './auth-layout.html',
    styleUrl: './auth-layout.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayout {
    private theme = inject(ThemeService);
    readonly isDark = this.theme.isDarkMode; // signal<boolean>
   
    toggleTheme() {
        this.theme.toggleTheme(); // cambia signal → OnPush re-renderiza
    }
}
