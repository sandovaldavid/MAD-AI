
import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { IconUser } from '../../icons/icon-user';
import { IconMail } from '../../icons/icon-mail';
import { IconBadge } from '../../icons/icon-badge';
import { IconStatus } from '../../icons/icon-status';
import { IconCalendar } from '../../icons/icon-calendar';

@Component({
    selector: 'app-detail-profile',
    imports: [DatePipe, IconUser, IconMail, IconBadge, IconStatus, IconCalendar],
    templateUrl: './detail-profile.html',
    styleUrl: './detail-profile.css',
})
export class DetailProfile {
    private readonly authService = inject(AuthService);
    protected readonly user = this.authService.user;
}
