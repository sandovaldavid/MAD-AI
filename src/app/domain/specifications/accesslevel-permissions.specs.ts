import { AccessLevel } from '../value-objects/accesslevel.vo';

/**
 * Domain Specification - AccessLevel Permissions
 *
 * Encapsula las reglas de negocio para determinar permisos basados en niveles de acceso.
 * Esta lógica compleja se separa del Value Object para mantener la pureza del dominio.
 */
export class AccessLevelPermissionsSpec {
  /**
   * Determina si el nivel puede gestionar el sistema completo
   */
  static canManageSystem(accessLevel: AccessLevel): boolean {
    return accessLevel.getValue() === 1;
  }

  /**
   * Determina si el nivel puede gestionar usuarios
   */
  static canManageUsers(accessLevel: AccessLevel): boolean {
    return accessLevel.getValue() <= 3;
  }

  /**
   * Determina si el nivel puede gestionar proyectos
   */
  static canManageProjects(accessLevel: AccessLevel): boolean {
    return accessLevel.getValue() <= 3;
  }

  /**
   * Determina si el nivel puede acceder al panel de administración
   */
  static canAccessAdmin(accessLevel: AccessLevel): boolean {
    return accessLevel.getValue() <= 4;
  }

  /**
   * Determina si el nivel puede eliminar usuarios
   */
  static canDeleteUsers(accessLevel: AccessLevel): boolean {
    return accessLevel.getValue() <= 2;
  }

  /**
   * Determina si el nivel puede liderar proyectos
   */
  static canLeadProjects(accessLevel: AccessLevel): boolean {
    return accessLevel.getValue() <= 4;
  }

  /**
   * Determina si el nivel es único para el equipo
   */
  static isUniqueForTeam(accessLevel: AccessLevel): boolean {
    return accessLevel.getValue() >= 4;
  }

  /**
   * Obtiene todos los permisos aplicables para el nivel
   */
  static getPermissions(accessLevel: AccessLevel): string[] {
    const perms = [];
    if (this.canManageSystem(accessLevel)) perms.push('manage_system');
    if (this.canManageUsers(accessLevel)) perms.push('manage_users');
    if (this.canManageProjects(accessLevel)) perms.push('manage_projects');
    if (this.canAccessAdmin(accessLevel)) perms.push('access_admin');
    if (this.canDeleteUsers(accessLevel)) perms.push('delete_users');
    if (this.canLeadProjects(accessLevel)) perms.push('lead_projects');
    if (this.isUniqueForTeam(accessLevel)) perms.push('unique_for_team');
    return perms;
  }
}
