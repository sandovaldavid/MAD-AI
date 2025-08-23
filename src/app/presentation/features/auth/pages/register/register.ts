import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { AuthFacade } from '@application/facades/auth.facade';

import { RegisterForm } from '../../forms/register-form/register-form';
import { Icon } from '@shared/ui/icon/icon';

@Component({
    selector: 'app-register',
    standalone: true,
    templateUrl: './register.html',
    styleUrl: './register.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RegisterForm, Icon, NgOptimizedImage],
})
export class Register implements OnInit {
    private router = inject(Router);
    private auth = inject(AuthFacade);

    ngOnInit(): void {
        // Clear any previous auth errors and loading state when entering register page
        // This ensures clean state for registration process
        this.auth.clearAuthState();
    }

    onRegistrationSuccess() {
        // The register form component already handles navigation
        console.log('Registration completed successfully');
    }

    navigateToLogin() {
        this.router.navigate(['/auth/login']);
    }
}
