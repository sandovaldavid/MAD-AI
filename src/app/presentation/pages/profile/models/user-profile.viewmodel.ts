/**
 * Maps status string to UI display text
 * @param status - Status value from facade
 * @returns User-friendly status text
 */
export function getStatusDisplayText(status?: string): string {
  if (!status) return 'Desconocido';

  switch (status.toLowerCase()) {
    case 'active':
      return 'Activo';
    case 'inactive':
      return 'Inactivo';
    case 'suspended':
      return 'Suspendido';
    case 'pending':
      return 'Activación pendiente';
    default:
      return status;
  }
}

/**
 * Maps status string to CSS class for styling
 * @param status - Status value from facade
 * @returns CSS class name
 */
export function getStatusCssClass(status?: string): string {
  if (!status) return 'status-unknown';

  switch (status.toLowerCase()) {
    case 'active':
      return 'status-active';
    case 'inactive':
      return 'status-inactive';
    case 'suspended':
      return 'status-suspended';
    case 'pending':
      return 'status-pending';
    default:
      return 'status-unknown';
  }
}

/**
 * Maps status string to icon name
 * @param status - Status value from facade
 * @returns Icon name
 */
export function getStatusIcon(status?: string): string {
  if (!status) return 'question-circle';

  switch (status.toLowerCase()) {
    case 'active':
      return 'check-circle';
    case 'inactive':
      return 'times-circle';
    case 'suspended':
      return 'ban';
    case 'pending':
      return 'clock';
    default:
      return 'question-circle';
  }
}
