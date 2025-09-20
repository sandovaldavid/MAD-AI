/**
 * Confirmation Modal Component - Composite Component
 *
 * @description
 * Reusable modal component for confirmation dialogs, alerts, and other modal content.
 * Provides customizable confirmation actions with proper accessibility and keyboard support.
 * Used for critical actions like user deletion, data changes, etc.
 *
 * @responsibilities
 * - Display modal overlay and content
 * - Handle confirmation and cancellation actions
 * - Provide accessible modal interactions
 * - Support keyboard navigation (ESC key)
 * - Focus management and trap
 * - Customizable content and action buttons
 *
 * @architecture
 * Composite Component following MAD-AI patterns:
 * - Combines UI atoms for modal functionality
 * - Reusable across different confirmation contexts
 * - Communicates through @Input/@Output only
 * - No application state or business logic
 * - Pure presentation component
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Presentation
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Shared UI Components
import { Button } from '../../ui/button/button';
import { Icon } from '../../ui/icon/icon';

/**
 * Modal action button configuration
 */
export interface ModalAction {
  readonly label: string;
  readonly variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  readonly action: 'confirm' | 'cancel' | 'custom';
  readonly customAction?: string;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly icon?: string;
}

/**
 * Modal configuration
 */
export interface ModalConfig {
  readonly title: string;
  readonly description?: string;
  readonly icon?: string;
  readonly iconVariant?: 'success' | 'warning' | 'error' | 'info';
  readonly size?: 'sm' | 'md' | 'lg' | 'xl';
  readonly closable?: boolean;
  readonly closeOnBackdrop?: boolean;
  readonly closeOnEscape?: boolean;
  readonly actions: ModalAction[];
}

/**
 * Modal action event
 */
export interface ModalActionEvent {
  readonly action: 'confirm' | 'cancel' | 'close' | 'custom';
  readonly customAction?: string;
}

/**
 * Default modal configuration
 */
export const DEFAULT_MODAL_CONFIG: Partial<ModalConfig> = {
  size: 'md',
  closable: true,
  closeOnBackdrop: true,
  closeOnEscape: true,
  iconVariant: 'info',
};

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule, Button, Icon],
  templateUrl: './confirmation-modal.html',
  styleUrl: './confirmation-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationModal implements OnInit, OnDestroy {
  // ============================================================================
  // Template References
  // ============================================================================

  @ViewChild('modalContainer', { static: false }) modalContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('firstFocusable', { static: false }) firstFocusable!: ElementRef<HTMLElement>;

  // ============================================================================
  // Input Properties
  // ============================================================================

  /**
   * Whether the modal is visible
   */
  @Input() visible = false;

  /**
   * Modal configuration
   */
  @Input() config: ModalConfig = {
    title: 'Confirm Action',
    size: 'md',
    closable: true,
    closeOnBackdrop: true,
    closeOnEscape: true,
    actions: [
      { label: 'Cancel', variant: 'secondary', action: 'cancel' },
      { label: 'Confirm', variant: 'primary', action: 'confirm' },
    ],
  };

  /**
   * Loading state for the entire modal
   */
  @Input() loading = false;

  /**
   * Custom CSS classes for the modal
   */
  @Input() customClass = '';

  // ============================================================================
  // Output Events
  // ============================================================================

  /**
   * Emitted when an action is triggered
   */
  @Output() actionTriggered = new EventEmitter<ModalActionEvent>();

  /**
   * Emitted when modal is opened
   */
  @Output() modalOpened = new EventEmitter<void>();

  /**
   * Emitted when modal is closed
   */
  @Output() modalClosed = new EventEmitter<void>();

  // ============================================================================
  // Component State
  // ============================================================================

  private previousActiveElement: Element | null = null;

  // ============================================================================
  // Host Listeners
  // ============================================================================

  /**
   * Handle ESC key to close modal
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.visible && this.config.closeOnEscape) {
      event.preventDefault();
      this.onClose();
    } else if (event.key === 'Tab' && this.visible) {
      this.handleTabKey(event);
    }
  }

  /**
   * Handle Tab key navigation
   */
  private handleTabKey(event: KeyboardEvent): void {
    if (!this.modalContainer) {
      return;
    }

    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  // ============================================================================
  // Lifecycle Hooks
  // ============================================================================

  ngOnInit(): void {
    if (this.visible) {
      this.handleModalOpen();
    }
  }

  ngOnDestroy(): void {
    this.restoreFocus();
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle backdrop click
   */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && this.config.closeOnBackdrop) {
      this.onClose();
    }
  }

  /**
   * Handle action button click
   */
  onAction(action: ModalAction): void {
    if (action.disabled || action.loading || this.loading) {
      return;
    }

    const event: ModalActionEvent = {
      action: action.action,
      customAction: action.customAction,
    };

    this.actionTriggered.emit(event);

    // Auto-close modal for confirm/cancel actions
    if (action.action === 'confirm' || action.action === 'cancel') {
      this.handleModalClose();
    }
  }

  /**
   * Handle close button click
   */
  onClose(): void {
    const event: ModalActionEvent = { action: 'close' };
    this.actionTriggered.emit(event);
    this.handleModalClose();
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get modal title ID for accessibility
   */
  getModalTitleId(): string {
    return `modal-title-${this.config.title.toLowerCase().replace(/\s+/g, '-')}`;
  }

  /**
   * Get modal description ID for accessibility
   */
  getModalDescriptionId(): string {
    return `modal-description-${this.config.title.toLowerCase().replace(/\s+/g, '-')}`;
  }

  /**
   * Get modal size CSS class
   */
  getModalSizeClass(): string {
    switch (this.config.size) {
      case 'sm':
        return 'modal--sm';
      case 'lg':
        return 'modal--lg';
      case 'xl':
        return 'modal--xl';
      case 'md':
      default:
        return 'modal--md';
    }
  }

  /**
   * Get icon for modal type
   */
  getModalIcon(): string {
    if (this.config.icon) {
      return this.config.icon;
    }

    switch (this.config.iconVariant) {
      case 'success':
        return 'check-circle';
      case 'warning':
        return 'exclamation-triangle';
      case 'error':
        return 'x-circle';
      case 'info':
      default:
        return 'information-circle';
    }
  }

  /**
   * Get icon CSS class for variant
   */
  getIconClass(): string {
    switch (this.config.iconVariant) {
      case 'success':
        return 'text-successful-500';
      case 'warning':
        return 'text-warning-500';
      case 'error':
        return 'text-error-500';
      case 'info':
      default:
        return 'text-info-500';
    }
  }

  /**
   * Get focusable elements within modal
   */
  private getFocusableElements(): HTMLElement[] {
    if (!this.modalContainer) {
      return [];
    }

    const focusableSelectors = [
      'button:not([disabled])',
      '[href]:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
    ].join(', ');

    return Array.from(this.modalContainer.nativeElement.querySelectorAll(focusableSelectors));
  }

  /**
   * Handle modal open
   */
  private handleModalOpen(): void {
    // Store current focus
    this.previousActiveElement = document.activeElement;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Focus first focusable element
    setTimeout(() => {
      const focusableElements = this.getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    });

    this.modalOpened.emit();
  }

  /**
   * Handle modal close
   */
  private handleModalClose(): void {
    // Restore body scroll
    document.body.style.overflow = '';

    // Restore focus
    this.restoreFocus();

    this.modalClosed.emit();
  }

  /**
   * Restore focus to previous element
   */
  private restoreFocus(): void {
    if (this.previousActiveElement && this.previousActiveElement instanceof HTMLElement) {
      this.previousActiveElement.focus();
    }
  }

  // ============================================================================
  // Change Detection
  // ============================================================================

  ngOnChanges(): void {
    if (this.visible) {
      this.handleModalOpen();
    } else {
      this.handleModalClose();
    }
  }
}
