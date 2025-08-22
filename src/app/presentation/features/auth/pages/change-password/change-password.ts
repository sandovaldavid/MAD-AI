import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { AuthFacade } from '@application/facades/auth.facade';
import { ResetPasswordForm } from '../../forms/reset-password-form/reset-password-form';
import { Icon } from '@shared/ui/icon/icon';

@Component({
    selector: 'app-change-password',
    templateUrl: './change-password.html',
    styleUrl: './change-password.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ResetPasswordForm, RouterLink, Icon],
})
export class ChangePassword {
    private route = inject(ActivatedRoute);
    private authFacade = inject(AuthFacade);

    // Extract token from query parameters
    token = toSignal(this.route.queryParams.pipe(map((params) => params['token'] ?? '')), {
        initialValue: '',
    });

    auth = () => this.authFacade;
}
