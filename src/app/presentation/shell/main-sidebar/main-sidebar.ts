import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { NavigationFacade } from '@application/facades/navigation.facade';
import { LayoutService } from '@core/services/layout.service';
import { NavRailToggler } from '../nav-rail-toggler/nav-rail-toggler';
import { NavRailSection } from '../nav-rail-section/nav-rail-section';
import { NavRailFooter } from '../nav-rail-footer/nav-rail-footer';

@Component({
    selector: 'app-main-sidebar',
    standalone: true,
    imports: [
        CommonModule,
        NavRailToggler,
        NavRailSection,
        NavRailFooter
    ],
    templateUrl: './main-sidebar.html',
    styleUrl: './main-sidebar.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainSidebar {
    private readonly layoutService = inject(LayoutService);
    private readonly navigationFacade = inject(NavigationFacade);

    // Computed properties from services
    readonly isCollapsed = computed(() => this.layoutService.sidebarCollapsed());
    readonly navigationSections = computed(() => this.navigationFacade.sections());

    // Computed UI properties
    readonly sidebarAriaLabel = computed(() =>
        this.isCollapsed() ? 'Menú de navegación colapsado' : 'Menú de navegación expandido'
    );

    onToggleCollapse(): void {
        this.layoutService.toggleSidebarCollapsed();
    }
}
