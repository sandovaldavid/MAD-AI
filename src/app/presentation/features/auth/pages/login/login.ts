import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { LoginForm } from '@presentation/features/auth/forms/login-form/login-form';
import { AuthFacade } from '@application/facades/auth.facade';

@Component({
    selector: 'app-login',
    templateUrl: './login.html',
    styleUrl: './login.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LoginForm],
})
export class Login implements OnInit {
    auth = inject(AuthFacade);

    ngOnInit(): void {
        // Clear any previous auth errors and loading state when entering login page
        // This fixes the issue where expired session errors persist on login form
        this.auth.clearAuthState();
    }
}
