import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthFacade } from '@application/facades/auth.facade';
import { RequestResetForm } from '../../forms/request-reset-form/request-reset-form';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RequestResetForm],
})
export class ResetPassword {
  private authFacade = inject(AuthFacade);

  auth = () => this.authFacade;
}
