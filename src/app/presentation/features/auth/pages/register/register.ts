import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { RegisterForm } from '../../forms/register-form/register-form';
import { Icon } from '@shared/ui/icon/icon';

@Component({
    selector: 'app-register',
    standalone: true,
    templateUrl: './register.html',
    styleUrl: './register.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RegisterForm, Icon],
})
export class Register {
    private router = inject(Router);

    onRegistrationSuccess() {
        // The register form component already handles navigation
        console.log('Registration completed successfully');
    }

    navigateToLogin() {
        this.router.navigate(['/auth/login']);
    }
}
