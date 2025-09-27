/**
 * User Export Types - Application Layer
 *
 * @description Type definitions for user export functionality in the Application Layer.
 * These types define the contracts between Application services and external consumers.
 *
 * @note Default configurations and business rules should be defined in the Domain layer.
 * Application layer only provides technical coordination types.
 *
 * @architecture
 * - Defines data structures for user export operations
 * - Provides configuration options for export customization
 * - Ensures type safety across export workflows
 * - Delegates business decisions to Domain layer
 *
 * @since 1.0.0
 * @layer Application
 */

/**
 * Data structure for user export operations.
 * Represents the flattened data structure used for export formats (PDF, CSV, JSON).
 */
export interface UserExportData {
  /** Optional user ID for identification */
  id?: string;
  /** User display name (required field) */
  displayName: string;
  /** User email address */
  email?: string;
  /** Username for system access */
  username?: string;
  /** User role in Spanish for user display */
  role?: string;
  /** User status in Spanish for user display */
  status?: string;
  /** Whether user is active */
  isActive?: boolean;
  /** Last activity timestamp */
  lastActivity?: string;
  /** Account creation date */
  createdAt?: string;
}

/**
 * Configuration options for user export operations.
 * Technical configuration only - business rules should be in Domain layer.
 */
export interface UserExportConfig {
  /** Whether to include user IDs in export */
  includeId?: boolean;
  /** Whether to include email addresses */
  includeEmail?: boolean;
  /** Whether to include usernames */
  includeUsername?: boolean;
  /** Whether to include user roles */
  includeRole?: boolean;
  /** Whether to include user status */
  includeStatus?: boolean;
  /** Whether to include last activity information */
  includeLastActivity?: boolean;
  /** Whether to include account creation dates */
  includeCreatedAt?: boolean;
  /** Custom title for the export document */
  customTitle?: string;
  /** Export format specification */
  format?: 'pdf' | 'csv' | 'json' | 'excel';
}

/**
 * Supported export formats with their file extensions.
 * Technical constants only.
 */
export const USER_EXPORT_FORMATS = {
  pdf: 'pdf',
  csv: 'csv',
  json: 'json',
  excel: 'xlsx',
} as const;

/**
 * Type for export format keys.
 */
export type UserExportFormat = keyof typeof USER_EXPORT_FORMATS;

/**
 * File extension for a given export format.
 */
export type UserExportFileExtension = (typeof USER_EXPORT_FORMATS)[UserExportFormat];
