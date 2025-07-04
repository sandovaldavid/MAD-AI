import { Component, ChangeDetectionStrategy, signal, input, output } from '@angular/core';

@Component({
  selector: 'app-modal-confirmation',
  imports: [],
  templateUrl: './modal-confirmation.html',
  styleUrl: './modal-confirmation.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalConfirmation {
  // Inputs
  readonly isOpen = input<boolean>(false);
  readonly title = input<string>('Confirmar acción');
  readonly message = input<string>('¿Estás seguro de que deseas continuar?');
  readonly confirmText = input<string>('Confirmar');
  readonly cancelText = input<string>('Cancelar');
  readonly confirmButtonClass = input<string>('btn-danger');
  readonly isLoading = input<boolean>(false);

  // Outputs
  readonly confirm = output<void>();
  readonly cancel = output<void>();

  protected onConfirm(): void {
    if (!this.isLoading()) {
      this.confirm.emit();
    }
  }

  protected onCancel(): void {
    if (!this.isLoading()) {
      this.cancel.emit();
    }
  }

  protected onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}
