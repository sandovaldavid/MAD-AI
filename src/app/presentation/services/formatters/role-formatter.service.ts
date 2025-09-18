import { inject, Injectable } from '@angular/core';
import { RolesFacade } from '@application/facades/role/role.facade';

/**
 * Role Formatting Service
 *
 * @description
 * Handles presentation-specific formatting and display of role entities.
 * This service delegates to Application layer for formatting logic to maintain
 * Clean Architecture separation.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
@Injectable({ providedIn: 'root' })
export class RoleFormatterService {
  private readonly rolesFacade = inject(RolesFacade);

  /**
   * Creates a display label for the role
   *
   * @param roleSummary - The role summary to create label for
   * @returns Formatted role label
   */
  getLabel(roleSummary: any): string {
    return this.rolesFacade.formatRoleLabel(roleSummary);
  }

  /**
   * Creates a short display label without access level
   *
   * @param roleSummary - The role summary to create short label for
   * @returns Short role label
   */
  getShortLabel(roleSummary: any): string {
    return this.rolesFacade.formatRoleShortLabel(roleSummary);
  }

  /**
   * Creates a detailed display label with status and user count
   *
   * @param roleSummary - The role summary to create detailed label for
   * @returns Detailed role label
   */
  getDetailedLabel(roleSummary: any): string {
    return this.rolesFacade.formatRoleDetailedLabel(roleSummary);
  }

  /**
   * Formats role for different display contexts
   *
   * @param roleSummary - The role summary to format
   * @param context - Display context
   * @returns Context-appropriate formatted role
   */
  formatForContext(
    roleSummary: any,
    context: 'label' | 'short' | 'detailed' | 'name-only'
  ): string {
    return this.rolesFacade.formatRoleForContext(roleSummary, context);
  }

  /**
   * Creates display variants for UI purposes
   *
   * @param roleSummary - The role summary to create variants for
   * @returns Object with different display variants
   */
  getDisplayVariants(roleSummary: any): {
    name: string;
    label: string;
    short: string;
    detailed: string;
    badge: string;
    accessLevel: string;
  } {
    return this.rolesFacade.getRoleDisplayVariants(roleSummary);
  }

  /**
   * Formats role status for display
   *
   * @param roleSummary - The role summary to get status for
   * @returns Formatted status
   */
  getStatusLabel(roleSummary: any): string {
    return this.rolesFacade.formatRoleStatus(roleSummary);
  }

  /**
   * Creates a summary string for the role
   *
   * @param roleSummary - The role summary to summarize
   * @returns Role summary
   */
  getSummary(roleSummary: any): string {
    return this.rolesFacade.formatRoleSummary(roleSummary);
  }
}
