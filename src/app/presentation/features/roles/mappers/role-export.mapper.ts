/**
 * @fileoverview Role Export Mapper - Transforms presentation models for export operations
 *
 * This mapper handles the transformation between the presentation layer's RoleModel
 * and the format expected by the export service, ensuring proper Clean Architecture
 * compliance by keeping domain knowledge out of the presentation layer.
 *
 * @architecture Clean Architecture - Presentation Layer
 * @dependencies RoleModel from presentation layer
 * @consumers Export-related components and services
 */

import { RoleModel } from '../models/role.model';

/**
 * Export format options for role data
 */
export interface RoleExportOptions {
  includeId?: boolean;
  includeAccessLevel?: boolean;
  includeStatus?: boolean;
  includeDescription?: boolean;
  includeUserCount?: boolean;
  customTitle?: string;
  format: 'pdf' | 'csv' | 'json';
}

/**
 * Simplified role data structure for export operations
 * This avoids creating domain entities in the presentation layer
 */
export interface RoleExportData {
  id: number;
  name: string;
  accessLevel: number;
  isActive: boolean;
  description?: string;
  userCount?: number;
}

/**
 * Role Export Mapper
 *
 * Provides transformation methods for role data export operations
 * without violating Clean Architecture principles.
 */
export const RoleExportMapper = {
  /**
   * Transform role models to export format
   *
   * @param roleModels - Array of role models from presentation layer
   * @returns Array of export-ready role data
   */
  toExportFormat(roleModels: RoleModel[]): RoleExportData[] {
    return roleModels.map((roleModel) => ({
      id: roleModel.id,
      name: roleModel.name,
      accessLevel: roleModel.accessLevel,
      isActive: roleModel.isActive,
      description: roleModel.description,
      userCount: roleModel.userCount,
    }));
  },

  /**
   * Transform single role model to export format
   *
   * @param roleModel - Single role model from presentation layer
   * @returns Export-ready role data
   */
  toSingleExportFormat(roleModel: RoleModel): RoleExportData {
    return {
      id: roleModel.id,
      name: roleModel.name,
      accessLevel: roleModel.accessLevel,
      isActive: roleModel.isActive,
      description: roleModel.description,
      userCount: roleModel.userCount,
    };
  },

  /**
   * Create export options with defaults
   *
   * @param options - Partial export options
   * @returns Complete export options with defaults
   */
  createExportOptions(options: Partial<RoleExportOptions>): RoleExportOptions {
    const currentDate = new Date().toLocaleDateString();
    return {
      includeId: true,
      includeAccessLevel: true,
      includeStatus: true,
      includeDescription: true,
      includeUserCount: true,
      customTitle: `Roles Export - ${currentDate}`,
      format: 'json',
      ...options,
    };
  },
};
