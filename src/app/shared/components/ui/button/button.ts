import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    output,
    ElementRef,
    inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type {
    ButtonVariant,
    ButtonSize,
    ButtonType,
    IconName,
    IconPosition,
} from '@domain/ui/button';
import {
    PlusIcon,
    EditIcon,
    DeleteIcon,
    RefreshIcon,
    SaveIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    DownloadIcon,
    UploadIcon,
    SearchIcon,
    XIcon,
    CheckIcon,
    EyeIcon,
    CheckCircleIcon,
    XCircleIcon,
    TrashIcon,
    UsersIcon,
    ICON_MAP,
} from './icons';

@Component({
    selector: 'app-button',
    templateUrl: './button.html',
    styleUrl: './button.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        PlusIcon,
        EditIcon,
        DeleteIcon,
        RefreshIcon,
        SaveIcon,
        ArrowLeftIcon,
        ArrowRightIcon,
        DownloadIcon,
        UploadIcon,
        SearchIcon,
        XIcon,
        CheckIcon,
        EyeIcon,
        CheckCircleIcon,
        XCircleIcon,
        TrashIcon,
        UsersIcon,
    ],
})
export class Button {
    private readonly elementRef = inject(ElementRef);

    // Inputs using the new signal-based API
    variant = input<ButtonVariant>('primary');
    size = input<ButtonSize>('md');
    type = input<ButtonType>('button');
    disabled = input<boolean>(false);
    loading = input<boolean>(false);
    fullWidth = input<boolean>(false);
    iconOnly = input<boolean>(false);

    // Icon inputs
    icon = input<IconName | null>(null);
    iconPosition = input<IconPosition>('left');

    // Outputs using the new signal-based API
    clicked = output<void>();

    // Computed properties
    protected readonly buttonClasses = computed(() => {
        const baseClasses = 'btn-base';
        const variantClasses = {
            primary: 'btn-primary',
            secondary: 'btn-secondary',
            outline: 'btn-outline',
            ghost: 'btn-ghost',
            destructive: 'btn-destructive',
        };
        const sizeClasses = {
            sm: 'btn-sm',
            md: 'btn-md',
            lg: 'btn-lg',
        };

        // Get classes from host element (applied via class="..." in template)
        const hostClasses = this.elementRef.nativeElement.className || '';

        // Filter host classes to only include utility classes (color, spacing, etc.)
        // Exclude component-specific classes that might conflict
        const filteredHostClasses = hostClasses
            .split(' ')
            .filter((cls: string) => {
                // Include color classes, hover states, dark mode, etc.
                return (
                    cls.includes('text-') ||
                    cls.includes('hover:') ||
                    cls.includes('focus:') ||
                    cls.includes('dark:') ||
                    cls.includes('bg-') ||
                    cls.includes('border-') ||
                    cls.includes('shadow-') ||
                    cls.includes('opacity-') ||
                    cls.includes('transition-') ||
                    (cls.startsWith('!') && (cls.includes('text-') || cls.includes('bg-')))
                );
            })
            .join(' ');

        return [
            baseClasses,
            variantClasses[this.variant()],
            sizeClasses[this.size()],
            this.disabled() || this.loading() ? 'btn-disabled' : '',
            this.loading() ? 'btn-loading' : '',
            this.fullWidth() ? 'btn-full-width' : '',
            this.iconOnly() ? 'btn-icon-only' : '',
            filteredHostClasses, // Apply filtered host classes to internal button
        ]
            .filter(Boolean)
            .join(' ');
    });

    protected readonly isDisabled = computed(() => {
        return this.disabled() || this.loading();
    });

    protected readonly iconComponent = computed(() => {
        const iconName = this.icon();
        return iconName ? ICON_MAP[iconName] : null;
    });

    protected readonly hasIcon = computed(() => {
        return this.icon() !== null;
    });

    protected readonly hasContent = computed(() => {
        return !this.iconOnly();
    });

    // Event handlers
    protected onClick(): void {
        if (!this.isDisabled()) {
            this.clicked.emit();
        }
    }
}
