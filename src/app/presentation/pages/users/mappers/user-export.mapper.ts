/**
 * @fileoverview User Export Mapper - Transforms presentation models for export operations
 *
 * This mapper handles the transformation between the presentation layer's UserDisplayData
 * and the format expected by the export service, ensuring proper Clean Architecture
 * compliance by keeping domain knowledge out of the presentation layer.
 *
 * @architecture Clean Architecture - Presentation Layer
 * @dependencies UserDisplayData from presentation layer
 * @consumers Export-related components and services
 */

import { UserDisplayData } from '../types/user-ui.types';

/**
 * Export format options for user data
 */
export interface UserExportOptions {
  includeId?: boolean;
  includeEmail?: boolean;
  includeUsername?: boolean;
  includeRole?: boolean;
  includeStatus?: boolean;
  includeLastActivity?: boolean;
  includeCreatedAt?: boolean;
  customTitle?: string;
  format: 'pdf' | 'csv' | 'json';
}

/**
 * Simplified user data structure for export operations
 * This avoids creating domain entities in the presentation layer
 */
export interface UserExportData {
  id: number;
  displayName: string;
  email: string;
  username: string;
  role: string;
  isActive: boolean;
  status: string;
  lastActivity?: string;
  createdAt?: string;
}

/**
 * User Export Mapper
 *
 * Provides transformation methods for user data export operations
 * without violating Clean Architecture principles.
 */
export const UserExportMapper = {
  /**
   * Transform user display data to export format
   *
   * @param userDisplayData - Array of user display data from presentation layer
   * @returns Array of export-ready user data
   */
  toExportFormat(userDisplayData: UserDisplayData[]): UserExportData[] {
    return userDisplayData.map((userDisplay) => ({
      id: userDisplay.id,
      displayName: userDisplay.displayName,
      email: userDisplay.email,
      username: userDisplay.username,
      role: userDisplay.role,
      isActive: userDisplay.isActive,
      status: userDisplay.isActive ? 'Activo' : 'Inactivo',
      lastActivity: userDisplay.lastActivity,
      createdAt: userDisplay.createdAt,
    }));
  },

  /**
   * Transform single user display data to export format
   *
   * @param userDisplay - Single user display data from presentation layer
   * @returns Export-ready user data
   */
  toSingleExportFormat(userDisplay: UserDisplayData): UserExportData {
    return {
      id: userDisplay.id,
      displayName: userDisplay.displayName,
      email: userDisplay.email,
      username: userDisplay.username,
      role: userDisplay.role,
      isActive: userDisplay.isActive,
      status: userDisplay.isActive ? 'Activo' : 'Inactivo',
      lastActivity: userDisplay.lastActivity,
      createdAt: userDisplay.createdAt,
    };
  },

  /**
   * Create export options with defaults
   *
   * @param options - Partial export options
   * @returns Complete export options with defaults
   */
  createExportOptions(options: Partial<UserExportOptions>): UserExportOptions {
    const currentDate = new Date().toLocaleDateString();
    return {
      includeId: true,
      includeEmail: true,
      includeUsername: true,
      includeRole: true,
      includeStatus: true,
      includeLastActivity: true,
      includeCreatedAt: true,
      customTitle: `Users Export - ${currentDate}`,
      format: 'json',
      ...options,
    };
  },
};
