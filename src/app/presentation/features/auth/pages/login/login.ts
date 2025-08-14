import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoginForm } from '@/app/presentation/features/auth/forms/login-form/login-form';
import { AuthFacade } from '@/app/application/facades/auth.facade';

@Component({
    selector: 'app-login',
    templateUrl: './login.html',
    styleUrl: './login.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LoginForm],
})
export class Login {
    auth = inject(AuthFacade);
}
