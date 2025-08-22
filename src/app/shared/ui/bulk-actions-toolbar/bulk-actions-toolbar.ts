import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    output,
    signal,
    OnInit,
    OnDestroy,
    inject,
    ElementRef,
    Renderer2,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

// Shared UI Components
import { Button } from '@shared/ui/button/button';
import { Icon } from '@shared/ui/icon/icon';

/**
 * Available bulk actions for the toolbar
 */
export interface BulkAction {
    id: string;
    label: string;
    icon: string;
    description?: string;
    variant: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'ghost';
    requiresConfirmation?: boolean;
    minimumSelection?: number;
    maximumSelection?: number;
    hotkey?: string;
}

/**
 * Export format options
 */
export interface ExportFormat {
    id: string;
    label: string;
    icon: string;
    extension: string;
    mimeType: string;
}

/**
 * Statistics for selected items
 */
export interface SelectionStats {
    total: number;
    active?: number;
    totalUsers?: number;
    avgLevel?: number;
    [key: string]: any;
}

/**
 * Professional floating bulk actions toolbar component
 *
 * Features:
 * - Animated slide-up from bottom
 * - Quick actions for common operations
 * - Expandable advanced actions panel
 * - Export functionality with multiple formats
 * - Selection statistics display
 * - Keyboard shortcuts support
 * - Responsive design
 * - Professional UI/UX
 */
@Component({
    selector: 'ui-bulk-actions-toolbar',
    standalone: true,
    imports: [CommonModule, Button, Icon],
    templateUrl: './bulk-actions-toolbar.html',
    styleUrl: './bulk-actions-toolbar.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('slideUp', [
            state(
                'hidden',
                style({
                    transform: 'translateY(100%)',
                    opacity: 0,
                })
            ),
            state(
                'visible',
                style({
                    transform: 'translateY(0)',
                    opacity: 1,
                })
            ),
            transition('hidden => visible', [animate('300ms ease-out')]),
            transition('visible => hidden', [animate('200ms ease-in')]),
        ]),
        trigger('expandCollapse', [
            state(
                'collapsed',
                style({
                    height: '0px',
                    opacity: 0,
                })
            ),
            state(
                'expanded',
                style({
                    height: '*',
                    opacity: 1,
                })
            ),
            transition('collapsed => expanded', [animate('250ms ease-out')]),
            transition('expanded => collapsed', [animate('200ms ease-in')]),
        ]),
    ],
})
export class BulkActionsToolbar implements OnInit, OnDestroy {
    private elementRef = inject(ElementRef);
    private renderer = inject(Renderer2);

    // ============================================================================
    // Inputs
    // ============================================================================

    /** Number of selected items */
    selectedCount = input.required<number>();

    /** Quick actions to display in the main toolbar */
    quickActions = input<BulkAction[]>([]);

    /** Advanced actions available in the expanded panel */
    advancedActions = input<BulkAction[]>([]);

    /** Export formats available */
    exportFormats = input<ExportFormat[]>([]);

    /** Statistics for selected items */
    selectionStats = input<SelectionStats>({ total: 0 });

    /** Currently executing action ID */
    executingAction = input<string | null>(null);

    /** Custom title for the toolbar */
    title = input<string>('items selected');

    /** Enable/disable keyboard shortcuts */
    enableHotkeys = input<boolean>(true);

    /** Show export options */
    showExportOptions = input<boolean>(true);

    /** Show statistics */
    showStatistics = input<boolean>(true);

    /** Show advanced actions toggle */
    showAdvancedToggle = input<boolean>(true);

    /** Custom CSS classes */
    customClass = input<string>('');

    // ============================================================================
    // Outputs
    // ============================================================================

    /** Emitted when a quick action is triggered */
    quickActionTriggered = output<{ actionId: string; selectedCount: number }>();

    /** Emitted when an advanced action is triggered */
    advancedActionTriggered = output<{ actionId: string; selectedCount: number }>();

    /** Emitted when export is requested */
    exportRequested = output<{ format: string; selectedCount: number }>();

    /** Emitted when selection should be cleared */
    clearSelection = output<void>();

    /** Emitted when advanced panel is toggled */
    advancedToggled = output<boolean>();

    // ============================================================================
    // Internal State
    // ============================================================================

    private _isVisible = signal<boolean>(false);
    private _showAdvanced = signal<boolean>(false);
    private _showShortcutsHint = signal<boolean>(false);
    private _shortcutsHintTimer: ReturnType<typeof setTimeout> | null = null;
    private _keyboardListeners: (() => void)[] = [];

    // ============================================================================
    // Computed Properties
    // ============================================================================

    /** Whether the toolbar should be visible */
    readonly isVisible = computed(() => this.selectedCount() > 0);

    /** Whether advanced panel is shown */
    readonly showAdvanced = computed(() => this._showAdvanced());

    /** Whether shortcuts hint should be shown */
    readonly showShortcutsHint = computed(
        () => this.enableHotkeys() && this.isVisible() && this._showShortcutsHint()
    );

    /** Animation state for toolbar */
    readonly toolbarState = computed(() => (this.isVisible() ? 'visible' : 'hidden'));

    /** Animation state for advanced panel */
    readonly advancedState = computed(() => (this.showAdvanced() ? 'expanded' : 'collapsed'));

    /** Filtered quick actions based on selection count */
    readonly availableQuickActions = computed(() => {
        const count = this.selectedCount();
        return this.quickActions().filter(
            (action) =>
                (!action.minimumSelection || count >= action.minimumSelection) &&
                (!action.maximumSelection || count <= action.maximumSelection)
        );
    });

    /** Filtered advanced actions based on selection count */
    readonly availableAdvancedActions = computed(() => {
        const count = this.selectedCount();
        return this.advancedActions().filter(
            (action) =>
                (!action.minimumSelection || count >= action.minimumSelection) &&
                (!action.maximumSelection || count <= action.maximumSelection)
        );
    });

    /** Whether any advanced actions are available */
    readonly hasAdvancedActions = computed(() => this.availableAdvancedActions().length > 0);

    /** Selection summary text */
    readonly selectionSummary = computed(() => {
        const count = this.selectedCount();
        const title = this.title();
        return `${count} ${title}`;
    });

    // ============================================================================
    // Lifecycle
    // ============================================================================

    ngOnInit() {
        this.setupKeyboardShortcuts();
        this.positionToolbar();
        this.setupResponsiveLayout();

        // Show shortcuts hint briefly when toolbar first appears
        if (this.isVisible()) {
            setTimeout(() => this.showShortcutsHintBriefly(), 500);
        }
    }

    ngOnDestroy() {
        this.cleanupKeyboardShortcuts();
        this.hideShortcutsHint();
    }

    // ============================================================================
    // Public Methods
    // ============================================================================

    /**
     * Handle quick action click
     */
    onQuickAction(actionId: string) {
        if (this.executingAction() === actionId) return;

        this.quickActionTriggered.emit({
            actionId,
            selectedCount: this.selectedCount(),
        });
    }

    /**
     * Handle advanced action click
     */
    onAdvancedAction(actionId: string) {
        if (this.executingAction() === actionId) return;

        this.advancedActionTriggered.emit({
            actionId,
            selectedCount: this.selectedCount(),
        });
    }

    /**
     * Handle export request
     */
    onExport(format: string) {
        this.exportRequested.emit({
            format,
            selectedCount: this.selectedCount(),
        });
    }

    /**
     * Toggle advanced actions panel
     */
    toggleAdvanced() {
        const newState = !this._showAdvanced();
        this._showAdvanced.set(newState);
        this.advancedToggled.emit(newState);
    }

    /**
     * Clear selection
     */
    onClearSelection() {
        this.clearSelection.emit();
        this._showAdvanced.set(false);
    }

    /**
     * Get action button variant
     */
    getActionVariant(
        action: BulkAction
    ):
        | 'primary'
        | 'secondary'
        | 'danger'
        | 'ghost'
        | 'success'
        | 'warning'
        | 'info'
        | 'outline-primary'
        | 'outline-secondary' {
        if (this.executingAction() === action.id) {
            return 'ghost';
        }

        // Map BulkAction variants to Button variants
        switch (action.variant) {
            case 'primary':
                return 'primary';
            case 'secondary':
                return 'secondary';
            case 'danger':
                return 'danger';
            case 'warning':
                return 'warning';
            case 'success':
                return 'success';
            case 'ghost':
                return 'ghost';
            default:
                return 'ghost';
        }
    }

    /**
     * Check if action is executing
     */
    isActionExecuting(actionId: string): boolean {
        return this.executingAction() === actionId;
    }

    /**
     * Show shortcuts hint for a brief period
     */
    showShortcutsHintBriefly() {
        if (!this.enableHotkeys()) return;

        // Clear any existing timer
        if (this._shortcutsHintTimer) {
            clearTimeout(this._shortcutsHintTimer);
        }

        // Show hint
        this._showShortcutsHint.set(true);

        // Auto-hide after 4 seconds
        this._shortcutsHintTimer = setTimeout(() => {
            this._showShortcutsHint.set(false);
            this._shortcutsHintTimer = null;
        }, 4000) as any;
    }

    /**
     * Hide shortcuts hint immediately
     */
    hideShortcutsHint() {
        if (this._shortcutsHintTimer) {
            clearTimeout(this._shortcutsHintTimer);
            this._shortcutsHintTimer = null;
        }
        this._showShortcutsHint.set(false);
    }

    // ============================================================================
    // Private Methods
    // ============================================================================

    /**
     * Setup keyboard shortcuts
     */
    private setupKeyboardShortcuts() {
        if (!this.enableHotkeys()) return;

        const shortcuts = [
            { key: 'Escape', action: () => this.onClearSelection() },
            { key: 'e', action: () => this.toggleAdvanced() },
            { key: 'x', action: () => this.onClearSelection() },
        ];

        shortcuts.forEach((shortcut) => {
            const listener = this.renderer.listen('document', 'keydown', (event: KeyboardEvent) => {
                if (
                    this.isVisible() &&
                    event.key === shortcut.key &&
                    !event.ctrlKey &&
                    !event.altKey &&
                    !event.metaKey
                ) {
                    // Only trigger if not in an input field
                    const target = event.target as HTMLElement;
                    if (
                        target.tagName !== 'INPUT' &&
                        target.tagName !== 'TEXTAREA' &&
                        !target.isContentEditable
                    ) {
                        event.preventDefault();
                        shortcut.action();
                    }
                }
            });
            this._keyboardListeners.push(listener);
        });

        // Add number key shortcuts for quick actions
        this.availableQuickActions().forEach((action, index) => {
            if (action.hotkey) {
                const listener = this.renderer.listen(
                    'document',
                    'keydown',
                    (event: KeyboardEvent) => {
                        if (
                            this.isVisible() &&
                            event.key === action.hotkey &&
                            !event.ctrlKey &&
                            !event.altKey &&
                            !event.metaKey
                        ) {
                            const target = event.target as HTMLElement;
                            if (
                                target.tagName !== 'INPUT' &&
                                target.tagName !== 'TEXTAREA' &&
                                !target.isContentEditable
                            ) {
                                event.preventDefault();
                                this.onQuickAction(action.id);
                            }
                        }
                    }
                );
                this._keyboardListeners.push(listener);
            }
        });
    }

    /**
     * Cleanup keyboard shortcuts
     */
    private cleanupKeyboardShortcuts() {
        this._keyboardListeners.forEach((cleanup) => cleanup());
        this._keyboardListeners = [];
    }

    /**
     * Position toolbar at bottom center of screen with responsive width
     */
    private positionToolbar() {
        const element = this.elementRef.nativeElement;
        this.renderer.setStyle(element, 'position', 'fixed');
        this.renderer.setStyle(element, 'bottom', '20px');
        this.renderer.setStyle(element, 'left', '50%');
        this.renderer.setStyle(element, 'transform', 'translateX(-50%)');
        this.renderer.setStyle(element, 'z-index', '1000');

        // Remove fixed max-width, let CSS handle responsiveness
        // The CSS now handles width constraints properly
    }

    /**
     * Setup responsive layout adjustments based on content
     */
    private setupResponsiveLayout() {
        // Add data attributes for CSS styling based on action count
        const updateAttributes = () => {
            const quickActionsCount = this.availableQuickActions().length;
            const totalActionsCount = quickActionsCount + this.availableAdvancedActions().length;

            const element = this.elementRef.nativeElement;
            this.renderer.setAttribute(element, 'data-quick-actions', quickActionsCount.toString());
            this.renderer.setAttribute(element, 'data-total-actions', totalActionsCount.toString());

            // Add responsive class based on action count
            if (quickActionsCount > 4) {
                this.renderer.addClass(element, 'many-actions');
            } else {
                this.renderer.removeClass(element, 'many-actions');
            }
        };

        // Update attributes initially and when actions change
        updateAttributes();

        // Watch for changes in action counts (simplified approach)
        // In a real implementation, you might want to use effects for this
        setTimeout(updateAttributes, 100);
    }
}
