import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { IconUser } from '../../icons/icon-user';
import { IconMail } from '../../icons/icon-mail';
import { IconBadge } from '../../icons/icon-badge';
import { IconCalendar } from '../../icons/icon-calendar';
import { CheckCircleIcon } from '../../icons/check-circle.icon';
import { XCircleIcon } from '../../icons/x-circle.icon';
import { Button } from '@/app/shared/components/ui/button/button';
import { Router } from '@angular/router';
import { EditIcon } from '../../icons/edit.icon';

@Component({
    selector: 'app-detail-profile',
    imports: [
        Button,
        DatePipe,
        IconUser,
        IconMail,
        IconBadge,
        IconCalendar,
        CheckCircleIcon,
        XCircleIcon,
        EditIcon,
    ],
    templateUrl: './detail-profile.html',
    styleUrl: './detail-profile.css',
})
export class DetailProfile {
    private readonly authService = inject(AuthService);
    protected readonly user = this.authService.user;
    private readonly router = inject(Router);

    get fullName(): string {
        const user = this.user();
        if (!user) return '';
        return `${user.first_name} ${user.last_name}`.trim();
    }

    protected getStatusBadgeClass(isActive: boolean): string {
        return isActive ? 'status-badge-active' : 'status-badge-inactive';
    }

    protected getStatusText(isActive: boolean): string {
        return isActive ? 'Activo' : 'Inactivo';
    }

    protected getUserInitials(firstName: string, lastName: string): string {
        if (!firstName || !lastName) return '';
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }

    protected goBack(): void {
        this.router.navigate(['/dashboard']);
    }

    protected navigateToEdit(): void {
        this.router.navigate(['/profile/update']);
    }
}
