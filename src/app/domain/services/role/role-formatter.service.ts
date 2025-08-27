import { Role } from '../../entities/role.entity';

/**
 * Role Formatting Service
 *
 * @description
 * Handles presentation-specific formatting and display of role entities.
 * This service contains logic that is NOT part of the Role entity invariants but
 * rather presentation/formatting rules.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
export class RoleFormatterService {
  /**
   * Creates a display label for the role
   *
   * @param role - The role to create label for
   * @returns Formatted role label
   *
   * @example
   * ```typescript
   * const role = Role.create({...});
   * const label = RoleFormatterService.getLabel(role);
   * console.log(label); // "Admin (L1)"
   * ```
   */
  static getLabel(role: Role): string {
    return `${role.name} (L${role.getAccessLevel().getValue()})`;
  }

  /**
   * Creates a short display label without access level
   *
   * @param role - The role to create short label for
   * @returns Short role label
   *
   * @example
   * ```typescript
   * const role = Role.create({...});
   * const shortLabel = RoleFormatterService.getShortLabel(role);
   * console.log(shortLabel); // "Admin"
   * ```
   */
  static getShortLabel(role: Role): string {
    return role.name;
  }

  /**
   * Creates a detailed display label with status and user count
   *
   * @param role - The role to create detailed label for
   * @returns Detailed role label
   *
   * @example
   * ```typescript
   * const role = Role.create({...});
   * const detailedLabel = RoleFormatterService.getDetailedLabel(role);
   * console.log(detailedLabel); // "Admin (L1) - Active - 5 users"
   * ```
   */
  static getDetailedLabel(role: Role): string {
    const status = role.isActive ? 'Active' : 'Inactive';
    const userText = role.userCount === 1 ? 'user' : 'users';
    return `${this.getLabel(role)} - ${status} - ${role.userCount} ${userText}`;
  }

  /**
   * Formats role for different display contexts
   *
   * @param role - The role to format
   * @param context - Display context
   * @returns Context-appropriate formatted role
   *
   * @example
   * ```typescript
   * const role = Role.create({...});
   * const label = RoleFormatterService.formatForContext(role, 'label');
   * const short = RoleFormatterService.formatForContext(role, 'short');
   * ```
   */
  static formatForContext(
    role: Role,
    context: 'label' | 'short' | 'detailed' | 'name-only'
  ): string {
    switch (context) {
      case 'label':
        return this.getLabel(role);
      case 'short':
        return this.getShortLabel(role);
      case 'detailed':
        return this.getDetailedLabel(role);
      case 'name-only':
        return role.name;
      default:
        return this.getLabel(role);
    }
  }

  /**
   * Creates display variants for UI purposes
   *
   * @param role - The role to create variants for
   * @returns Object with different display variants
   *
   * @example
   * ```typescript
   * const role = Role.create({...});
   * const variants = RoleFormatterService.getDisplayVariants(role);
   * console.log(variants.label); // "Admin (L1)"
   * console.log(variants.badge); // "Admin"
   * ```
   */
  static getDisplayVariants(role: Role): {
    name: string;
    label: string;
    short: string;
    detailed: string;
    badge: string;
    accessLevel: string;
  } {
    return {
      name: role.name,
      label: this.getLabel(role),
      short: this.getShortLabel(role),
      detailed: this.getDetailedLabel(role),
      badge: role.name,
      accessLevel: `L${role.getAccessLevel().getValue()}`,
    };
  }

  /**
   * Formats role status for display
   *
   * @param role - The role to get status for
   * @returns Formatted status
   */
  static getStatusLabel(role: Role): string {
    return role.isActive ? 'Active' : 'Inactive';
  }

  /**
   * Creates a summary string for the role
   *
   * @param role - The role to summarize
   * @returns Role summary
   *
   * @example
   * ```typescript
   * const role = Role.create({...});
   * const summary = RoleFormatterService.getSummary(role);
   * console.log(summary); // "Admin role with high-level access (L1), currently active with 5 assigned users"
   * ```
   */
  static getSummary(role: Role): string {
    const statusText = role.isActive ? 'active' : 'inactive';
    const userText = role.userCount === 1 ? 'user' : 'users';
    const levelValue = role.getAccessLevel().getValue();
    const accessLevelText =
      levelValue === 1 ? 'high-level' : levelValue <= 3 ? 'medium-level' : 'basic';

    return `${role.name} role with ${accessLevelText} access (L${levelValue}), currently ${statusText} with ${role.userCount} assigned ${userText}`;
  }
}
