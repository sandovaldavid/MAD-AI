/**
 * Role Export Types - Application Layer
 *
 * @description Type definitions for role export functionality in the Application Layer.
 * These types define the contracts between Application services and external consumers.
 *
 * @note Default configurations and business rules should be defined in the Domain layer.
 * Application layer only provides technical coordination types.
 *
 * @architecture
 * - Defines data structures for role export operations
 * - Provides configuration options for export customization
 * - Ensures type safety across export workflows
 * - Delegates business decisions to Domain layer
 *
 * @since 1.0.0
 * @layer Application
 */

/**
 * Data structure for role export operations.
 * Represents the flattened data structure used for export formats (PDF, CSV, JSON).
 */
export interface RoleExportData {
  /** Optional role ID for identification */
  id?: string;
  /** Role name (required field) */
  name: string;
  /** Human-readable access level name */
  accessLevel?: string;
  /** Role status in Spanish for user display */
  status?: string;
  /** Role description or default value */
  description?: string;
  /** Number of users assigned to this role */
  userCount?: number;
}

/**
 * Configuration options for role export operations.
 * Technical configuration only - business rules should be in Domain layer.
 */
export interface RoleExportConfig {
  /** Whether to include role IDs in export */
  includeId?: boolean;
  /** Whether to include access level information */
  includeAccessLevel?: boolean;
  /** Whether to include role status */
  includeStatus?: boolean;
  /** Whether to include role descriptions */
  includeDescription?: boolean;
  /** Whether to include user count per role */
  includeUserCount?: boolean;
  /** Custom title for the export document */
  customTitle?: string;
  /** Export format specification */
  format?: 'pdf' | 'csv' | 'json' | 'xlsx';
}

/**
 * Supported export formats with their file extensions.
 * Technical constants only.
 */
export const EXPORT_FORMATS = {
  pdf: 'pdf',
  csv: 'csv',
  json: 'json',
  excel: 'xlsx',
} as const;

/**
 * Type for export format keys.
 */
export type ExportFormat = keyof typeof EXPORT_FORMATS;

/**
 * File extension for a given export format.
 */
export type ExportFileExtension = (typeof EXPORT_FORMATS)[ExportFormat];
