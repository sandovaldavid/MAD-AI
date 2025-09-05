export type ErrorType =
  | 'network'
  | 'server'
  | 'validation'
  | 'not-found'
  | 'forbidden'
  | 'unauthorized'
  | 'generic';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export type ErrorActionStyle = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ErrorAction {
  label: string;
  action: () => void;
  style: ErrorActionStyle;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
}

export interface ErrorDisplayConfig {
  type: ErrorType;
  severity: ErrorSeverity;
  title: string;
  message: string;
  icon?: string;
  actions: ErrorAction[];
  showDetails?: boolean;
  details?: string;
  showIcon?: boolean;
  compact?: boolean;
}

export interface ErrorIconConfig {
  type: ErrorType;
  severity: ErrorSeverity;
  customIcon?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ErrorDetailsConfig {
  details: string;
  expanded: boolean;
  collapsible: boolean;
}
