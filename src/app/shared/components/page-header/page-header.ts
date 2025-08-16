import { ChangeDetectionStrategy, Component, input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icon } from '@shared/ui/icon/icon';
import { BreadcrumbService } from '@core/services/breadcrumb.service';

export interface PageHeaderConfig {
    title: string;
    description?: string;
    icon?: string;
    iconColor?: string;
    showBreadcrumbs?: boolean;
    actions?: Array<{
        label: string;
        icon?: string;
        action: () => void;
        variant?: 'primary' | 'secondary' | 'ghost';
        disabled?: boolean;
        loading?: boolean;
    }>;
}

@Component({
    selector: 'app-page-header',
    standalone: true,
    imports: [CommonModule, Icon],
    templateUrl: './page-header.html',
    styleUrls: ['./page-header.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
    config = input.required<PageHeaderConfig>();

    private readonly breadcrumbService = inject(BreadcrumbService);

    readonly breadcrumbs = this.breadcrumbService.breadcrumbs;

    readonly shouldShowBreadcrumbs = computed(
        () => this.config().showBreadcrumbs !== false && this.breadcrumbs().length > 0
    );

    readonly hasActions = computed(() => {
        const actions = this.config().actions;
        return Array.isArray(actions) && actions.length > 0;
    });

    readonly iconClasses = computed(() => {
        const baseClass = 'page-header-icon';
        const colorClass = this.config().iconColor || 'primary';
        return `${baseClass} ${baseClass}--${colorClass}`;
    });

    getActionClasses(variant: string = 'primary'): string {
        return `page-header-action page-header-action--${variant}`;
    }
}
