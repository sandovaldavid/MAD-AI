import { Injectable, inject, signal, computed } from '@angular/core';
import { ListRoles } from '@application/use-cases/roles/list-roles.usecase';
import { GetRoleById } from '@application/use-cases/roles/get-role-by-id.usecase';
import { CreateRole } from '@application/use-cases/roles/create-role.usecase';
import { UpdateRole } from '@application/use-cases/roles/update-role.usecase';
import { DeleteRole } from '@application/use-cases/roles/delete-role.usecase';
import { GetRoleByName } from '@application/use-cases/roles/get-role-by-name.usecase';
import { GetUsersByRole } from '@application/use-cases/roles/get-users-by-role.usecase';
import { ActivateRole } from '@application/use-cases/roles/activate-role.usecase';
import { DeactivateRole } from '@application/use-cases/roles/deactivate-role.usecase';
import { AssignRoleToUser } from '@application/use-cases/roles/assign-role-to-user.usecase';
import { UnassignRoleFromUser } from '@application/use-cases/roles/unassign-role-from-user.usecase';
import { BulkCreateRoles } from '@application/use-cases/roles/bulk-create-roles.usecase';
import { BulkUpdateRoles } from '@application/use-cases/roles/bulk-update-roles.usecase';
import { BulkDeleteRoles } from '@application/use-cases/roles/bulk-delete-roles.usecase';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { NotificationsFacade } from '@application/facades/notifications.facade';
import { AuthFacade } from '@application/facades/auth.facade';
import { RoleExportService } from '@/app/application/services/role-export-report.service';
import { Role } from '@domain/entities/role.entity';
import type { User } from '@domain/entities/user.entity';
import { RoleApplicationMapper, type RoleSummary } from '@/app/application/mappers/role.mapper';
import type { RoleExportConfig } from '@application/types/role-export.types';
import type { FacadeOpts } from '@application/types/facade-opts';
import type {
  BulkCreateRolesRequest,
  BulkUpdateRolesRequest,
  BulkDeleteRolesRequest,
} from '@application/types/roles.types';
interface ListRolesParams {
  search?: string;
  active?: boolean;
}

/**
 * Facade para la gestión de roles en la capa Application
 *
 * Proporciona una interfaz simplificada para la capa Presentation, coordinando
 * múltiples use cases relacionados con la gestión de roles. Maneja el estado
 * reactivo y transforma datos entre Application y Presentation layers.
 *
 * **Responsabilidades:**
 * - Coordinar use cases de gestión de roles
 * - Gestionar estado reactivo para la UI
 * - Transformar datos Application → Presentation
 * - Manejar errores y notificaciones
 * - Proporcionar API simplificada para componentes
 *
 * **Principio:** NO contiene lógica de negocio, solo orquesta use cases
 *
 * @example
 * ```typescript
 * constructor(private rolesFacade: RolesFacade) {}
 *
 * async ngOnInit() {
 *   await this.rolesFacade.refresh();
 *   this.roles$ = this.rolesFacade.roles;
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class RolesFacade {
  private readonly listRolesUC = inject(ListRoles);
  private readonly getRoleByIdUC = inject(GetRoleById);
  private readonly createRoleUC = inject(CreateRole);
  private readonly updateRoleUC = inject(UpdateRole);
  private readonly deleteRoleUC = inject(DeleteRole);
  private readonly getRoleByNameUC = inject(GetRoleByName);
  private readonly getUsersByRoleUC = inject(GetUsersByRole);
  private readonly activateRoleUC = inject(ActivateRole);
  private readonly deactivateRoleUC = inject(DeactivateRole);
  private readonly assignRoleToUserUC = inject(AssignRoleToUser);
  private readonly unassignRoleFromUserUC = inject(UnassignRoleFromUser);
  private readonly bulkCreateRolesUC = inject(BulkCreateRoles);
  private readonly bulkUpdateRolesUC = inject(BulkUpdateRoles);
  private readonly bulkDeleteRolesUC = inject(BulkDeleteRoles);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly notifications = inject(NotificationsFacade);
  private readonly authFacade = inject(AuthFacade);
  private readonly roleExportService = inject(RoleExportService);

  /** Loading state for async operations */
  private readonly _loading = signal(false);

  /** Current error state */
  private readonly _error = signal<string | null>(null);

  /** List of roles */
  private readonly _roles = signal<RoleSummary[]>([]);

  /** Current selected role */
  private readonly _currentRole = signal<RoleSummary | null>(null);

  /** Users assigned to current role */
  private readonly _roleUsers = signal<User[]>([]);

  /** Current search/filter parameters */
  private readonly _currentFilters = signal<ListRolesParams | null>(null);

  /**
   * Estado de carga para operaciones asíncronas
   * @returns {boolean} true si hay operaciones en progreso
   */
  readonly loading = computed(() => this._loading());

  /**
   * Estado de error actual
   * @returns {string | null} Mensaje de error o null si no hay error
   */
  readonly error = computed(() => this._error());

  /**
   * Lista de roles disponibles
   * @returns {RoleSummary[]} Array de resúmenes de roles
   */
  readonly roles = computed(() => this._roles());

  /**
   * Rol actualmente seleccionado
   * @returns {RoleSummary | null} Rol seleccionado o null
   */
  readonly currentRole = computed(() => this._currentRole());

  /**
   * Usuarios asignados al rol actual
   * @returns {User[]} Array de usuarios asignados al rol seleccionado
   */
  readonly roleUsers = computed(() => this._roleUsers());

  /**
   * Parámetros de búsqueda/filtro actuales
   * @returns {ListRolesParams | null} Parámetros aplicados o null
   */
  readonly currentFilters = computed(() => this._currentFilters());

  /**
   * Conteo total de roles
   * @returns {number} Número total de roles en el sistema
   */
  readonly totalRoles = computed(() => this._roles().length);

  /**
   * Conteo de roles activos
   * @returns {number} Número de roles con estado activo
   */
  readonly activeRoles = computed(() => this._roles().filter((role) => role.isActive).length);

  /**
   * Conteo de roles inactivos
   * @returns {number} Número de roles con estado inactivo
   */
  readonly inactiveRoles = computed(() => this._roles().filter((role) => !role.isActive).length);

  /**
   * Indica si hay un rol seleccionado actualmente
   * @returns {boolean} true si hay un rol seleccionado
   */
  readonly hasSelectedRole = computed(() => !!this._currentRole());

  /**
   * Refresca la lista de roles con filtros opcionales
   *
   * Coordina el use case ListRoles para obtener todos los roles del sistema,
   * aplica filtros del lado cliente si se proporcionan, y actualiza el estado
   * reactivo con los resultados transformados.
   *
   * @param {ListRolesParams} [params] - Parámetros de filtrado opcionales
   * @param {ListRolesParams} params.search - Término de búsqueda por nombre
   * @param {ListRolesParams} params.active - Filtrar por estado activo/inactivo
   * @param {FacadeOpts} [opts] - Opciones adicionales para la operación
   * @returns {Promise<void>} Promesa que se resuelve cuando se completa el refresh
   *
   * @example
   * ```typescript
   * // Refrescar todos los roles
   * await rolesFacade.refresh();
   *
   * // Refrescar con filtros
   * await rolesFacade.refresh({ search: 'admin', active: true });
   * ```
   */
  async refresh(params?: ListRolesParams, opts?: FacadeOpts): Promise<void> {
    return this.executeOperation(async () => {
      const entities = await this.listRolesUC.execute();
      this._currentFilters.set(params || null);

      // Apply client-side filtering if params provided
      const filteredEntities = params ? this.applyFilters(entities, params) : entities;

      const roleModels = filteredEntities.map(RoleApplicationMapper.toRoleSummary);
      this._roles.set(roleModels);
    }, opts);
  }

  /**
   * Carga un rol específico por ID y lo establece como rol actual
   *
   * Coordina el use case GetRoleById para obtener un rol específico,
   * lo transforma al formato de aplicación y actualiza el estado
   * del rol actualmente seleccionado.
   *
   * @param {number} id - ID del rol a cargar
   * @param {FacadeOpts} [opts] - Opciones adicionales para la operación
   * @returns {Promise<void>} Promesa que se resuelve cuando se carga el rol
   *
   * @throws {ApplicationError} Si el rol no existe o no hay permisos
   *
   * @example
   * ```typescript
   * await rolesFacade.loadRole(123);
   * console.log(rolesFacade.currentRole()); // Rol cargado
   * ```
   */
  async loadRole(id: number, opts?: FacadeOpts): Promise<void> {
    return this.executeOperation(async () => {
      const entity = await this.getRoleByIdUC.execute({ id, requesterId: this.getCurrentUserId() });
      const roleModel = RoleApplicationMapper.toRoleSummary(entity);
      this._currentRole.set(roleModel);
    }, opts);
  }

  /**
   * Crea un nuevo rol en el sistema
   *
   * Coordina el use case CreateRole para crear un nuevo rol con los datos
   * proporcionados, actualiza el estado reactivo agregando el nuevo rol
   * a la lista, y envía una notificación de éxito.
   *
   * @param {object} roleData - Datos del rol a crear
   * @param {string} roleData.name - Nombre del rol
   * @param {number} roleData.accessLevel - Nivel de acceso del rol
   * @param {string} roleData.description - Descripción del rol
   * @param {boolean} [roleData.canLeadProjects=false] - Si puede liderar proyectos
   * @param {boolean} [roleData.isUniquePerTeam=false] - Si es único por equipo
   * @param {FacadeOpts} [opts] - Opciones adicionales para la operación
   * @returns {Promise<Role>} Promesa que resuelve con la entidad del rol creado
   *
   * @throws {ApplicationError} Si faltan datos requeridos o hay errores de validación
   *
   * @example
   * ```typescript
   * const newRole = await rolesFacade.createRole({
   *   name: 'Project Manager',
   *   accessLevel: 3,
   *   description: 'Manages project teams',
   *   canLeadProjects: true
   * });
   * ```
   */
  async createRole(
    roleData: {
      name: string;
      accessLevel: number;
      description: string;
      canLeadProjects?: boolean;
      isUniquePerTeam?: boolean;
    },
    opts?: FacadeOpts
  ): Promise<Role> {
    return this.executeOperation(async () => {
      const entity = await this.createRoleUC.execute({
        name: roleData.name,
        accessLevel: roleData.accessLevel,
        description: roleData.description,
        canLeadProjects: roleData.canLeadProjects ?? false,
        isUniquePerTeam: roleData.isUniquePerTeam ?? false,
      });

      // Update reactive state
      const roleModel = RoleApplicationMapper.toRoleSummary(entity);
      this._roles.update((roles) => [roleModel, ...roles]);

      // Send success notification
      this.notifications.success(
        'Role created successfully',
        `Role "${roleData.name}" has been created.`
      );

      return entity;
    }, opts);
  }

  /**
   * Actualiza un rol existente
   *
   * Coordina el use case UpdateRole para modificar un rol existente con
   * los datos proporcionados, actualiza el estado reactivo reemplazando
   * el rol en la lista y en la selección actual si corresponde.
   *
   * @param {number} id - ID del rol a actualizar
   * @param {object} roleData - Datos a actualizar (todos opcionales)
   * @param {string} [roleData.name] - Nuevo nombre del rol
   * @param {number} [roleData.accessLevel] - Nuevo nivel de acceso
   * @param {string} [roleData.description] - Nueva descripción
   * @param {boolean} [roleData.isActive] - Nuevo estado activo/inactivo
   * @param {boolean} [roleData.canLeadProjects] - Si puede liderar proyectos
   * @param {boolean} [roleData.isUniquePerTeam] - Si es único por equipo
   * @param {FacadeOpts} [opts] - Opciones adicionales para la operación
   * @returns {Promise<Role>} Promesa que resuelve con la entidad del rol actualizado
   *
   * @throws {ApplicationError} Si el rol no existe o no hay permisos
   *
   * @example
   * ```typescript
   * await rolesFacade.updateRole(123, {
   *   name: 'Senior Project Manager',
   *   accessLevel: 4,
   *   description: 'Manages complex projects'
   * });
   * ```
   */
  async updateRole(
    id: number,
    roleData: {
      name?: string;
      accessLevel?: number;
      description?: string;
      isActive?: boolean;
      canLeadProjects?: boolean;
      isUniquePerTeam?: boolean;
    },
    opts?: FacadeOpts
  ): Promise<Role> {
    return this.executeOperation(async () => {
      const entity = await this.updateRoleUC.execute({
        id,
        ...roleData,
        requesterId: this.getCurrentUserId(),
      });
      const roleModel = RoleApplicationMapper.toRoleSummary(entity);

      // Update reactive state
      this._roles.update((roles) => roles.map((role) => (role.id === id ? roleModel : role)));
      if (this._currentRole()?.id === id) {
        this._currentRole.set(roleModel);
      }

      // Send success notification
      this.notifications.success(
        'Role updated successfully',
        `Role "${entity.name}" has been updated.`
      );

      return entity;
    }, opts);
  }

  /**
   * Elimina un rol del sistema
   *
   * Coordina el use case DeleteRole para eliminar permanentemente un rol,
   * actualiza el estado reactivo removiendo el rol de la lista y limpiando
   * la selección actual si el rol eliminado era el seleccionado.
   *
   * @param {number} id - ID del rol a eliminar
   * @param {FacadeOpts} [opts] - Opciones adicionales para la operación
   * @returns {Promise<void>} Promesa que se resuelve cuando se elimina el rol
   *
   * @throws {ApplicationError} Si el rol no existe o no hay permisos para eliminarlo
   *
   * @example
   * ```typescript
   * await rolesFacade.deleteRole(123);
   * // El rol se elimina de la lista y se limpia la selección si era el actual
   * ```
   */
  async deleteRole(id: number, opts?: FacadeOpts): Promise<void> {
    return this.executeOperation(async () => {
      await this.deleteRoleUC.execute({
        id,
        requesterId: this.getCurrentUserId(),
      });

      // Update reactive state
      this._roles.update((roles) => roles.filter((role) => role.id !== id));
      if (this._currentRole()?.id === id) {
        this._currentRole.set(null);
        this._roleUsers.set([]);
      }

      // Send success notification
      this.notifications.success(
        'Role deleted successfully',
        'The role has been permanently removed.'
      );
    }, opts);
  }

  /**
   * Busca un rol por nombre sin afectar el estado
   *
   * Coordina el use case GetRoleByName para encontrar un rol específico
   * por su nombre. Este método no modifica el estado reactivo del facade,
   * solo retorna el resultado de la búsqueda.
   *
   * @param {string} name - Nombre del rol a buscar
   * @returns {Promise<Role | null>} Promesa que resuelve con el rol encontrado o null
   *
   * @example
   * ```typescript
   * const adminRole = await rolesFacade.findRoleByName('Administrator');
   * if (adminRole) {
   *   console.log('Admin role found:', adminRole.name);
   * }
   * ```
   */
  async findRoleByName(name: string): Promise<Role | null> {
    try {
      return await this.getRoleByNameUC.execute({
        name,
        requesterId: this.getCurrentUserId(),
      });
    } catch (error: unknown) {
      const errorMessage = this.errorTransformer.transform(error as Error);
      this._error.set(errorMessage.message);
      return null;
    }
  }

  /**
   * Carga los usuarios asignados a un rol
   *
   * Coordina el use case GetUsersByRole para obtener todos los usuarios
   * asignados a un rol específico y actualiza el estado reactivo con
   * la lista de usuarios.
   *
   * @param {number} roleId - ID del rol para el cual cargar usuarios
   * @param {FacadeOpts} [opts] - Opciones adicionales para la operación
   * @returns {Promise<User[]>} Promesa que resuelve con array de usuarios asignados
   *
   * @throws {ApplicationError} Si el rol no existe o no hay permisos
   *
   * @example
   * ```typescript
   * const users = await rolesFacade.loadRoleUsers(123);
   * console.log(`${users.length} users assigned to this role`);
   * ```
   */
  async loadRoleUsers(roleId: number, opts?: FacadeOpts): Promise<User[]> {
    return this.executeOperation(async () => {
      const users = await this.getUsersByRoleUC.execute({
        roleId,
        requesterId: this.getCurrentUserId(),
      });
      this._roleUsers.set(users);
      return users;
    }, opts);
  }

  /**
   * Activa un rol inactivo
   *
   * Coordina el use case ActivateRole para cambiar el estado de un rol
   * a activo, actualiza el estado reactivo y envía una notificación
   * de éxito.
   *
   * @param {number} id - ID del rol a activar
   * @param {FacadeOpts} [opts] - Opciones adicionales para la operación
   * @returns {Promise<Role>} Promesa que resuelve con la entidad del rol activado
   *
   * @throws {ApplicationError} Si el rol no existe, ya está activo o no hay permisos
   *
   * @example
   * ```typescript
   * await rolesFacade.activateRole(123);
   * // El rol ahora está activo y se actualiza en la lista
   * ```
   */
  async activateRole(id: number, opts?: FacadeOpts): Promise<Role> {
    return this.executeOperation(async () => {
      const entity = await this.activateRoleUC.execute({
        id,
        requesterId: this.getCurrentUserId(),
      });
      const roleModel = RoleApplicationMapper.toRoleSummary(entity);

      // Update reactive state
      this._roles.update((roles) => roles.map((role) => (role.id === id ? roleModel : role)));
      if (this._currentRole()?.id === id) {
        this._currentRole.set(roleModel);
      }

      // Send success notification
      this.notifications.success('Role activated', `Role "${entity.name}" is now active.`);

      return entity;
    }, opts);
  }

  /**
   * Desactiva un rol activo
   *
   * Coordina el use case DeactivateRole para cambiar el estado de un rol
   * a inactivo, actualiza el estado reactivo y envía una notificación
   * de éxito.
   *
   * @param {number} id - ID del rol a desactivar
   * @param {FacadeOpts} [opts] - Opciones adicionales para la operación
   * @returns {Promise<Role>} Promesa que resuelve con la entidad del rol desactivado
   *
   * @throws {ApplicationError} Si el rol no existe, ya está inactivo o no hay permisos
   *
   * @example
   * ```typescript
   * await rolesFacade.deactivateRole(123);
   * // El rol ahora está inactivo y se actualiza en la lista
   * ```
   */
  async deactivateRole(id: number, opts?: FacadeOpts): Promise<Role> {
    return this.executeOperation(async () => {
      const entity = await this.deactivateRoleUC.execute({
        id,
        requesterId: this.getCurrentUserId(),
      });
      const roleModel = RoleApplicationMapper.toRoleSummary(entity);

      // Update reactive state
      this._roles.update((roles) => roles.map((role) => (role.id === id ? roleModel : role)));
      if (this._currentRole()?.id === id) {
        this._currentRole.set(roleModel);
      }

      // Send success notification
      this.notifications.success('Role deactivated', `Role "${entity.name}" is now inactive.`);

      return entity;
    }, opts);
  }

  /**
   * Alterna el estado de activación de un rol
   *
   * Determina el estado actual del rol y ejecuta la operación opuesta:
   * si está activo lo desactiva, si está inactivo lo activa.
   *
   * @param {number} id - ID del rol cuyo estado se va a alternar
   * @param {FacadeOpts} [opts] - Opciones adicionales para la operación
   * @returns {Promise<Role>} Promesa que resuelve con la entidad del rol actualizado
   *
   * @throws {Error} Si el rol no se encuentra en la lista actual
   * @throws {ApplicationError} Si no hay permisos para cambiar el estado
   *
   * @example
   * ```typescript
   * // Si el rol está activo, lo desactiva
   * await rolesFacade.toggleRoleActivation(123);
   *
   * // Si el rol está inactivo, lo activa
   * await rolesFacade.toggleRoleActivation(123);
   * ```
   */
  async toggleRoleActivation(id: number, opts?: FacadeOpts): Promise<Role> {
    const currentRole = this._roles().find((role) => role.id === id);
    if (!currentRole) {
      throw new Error(`Role with ID ${id} not found`);
    }

    return currentRole.isActive
      ? await this.deactivateRole(id, opts)
      : await this.activateRole(id, opts);
  }

  /**
   * Asigna un rol a un usuario
   *
   * Coordina el use case AssignRoleToUser para asignar un rol específico
   * a un usuario, actualiza la lista de usuarios del rol si corresponde,
   * y envía una notificación de éxito.
   *
   * @param {number} roleId - ID del rol a asignar
   * @param {number} userId - ID del usuario al que asignar el rol
   * @param {FacadeOpts} [opts] - Opciones adicionales para la operación
   * @returns {Promise<void>} Promesa que se resuelve cuando se completa la asignación
   *
   * @throws {ApplicationError} Si el rol o usuario no existen, o no hay permisos
   *
   * @example
   * ```typescript
   * await rolesFacade.assignRoleToUser(123, 456);
   * // El rol 123 se asigna al usuario 456
   * ```
   */
  async assignRoleToUser(roleId: number, userId: number, opts?: FacadeOpts): Promise<void> {
    return this.executeOperation(async () => {
      await this.assignRoleToUserUC.execute({
        roleId,
        userId,
        assignedByUserId: this.getCurrentUserId(),
      });

      // Refresh role users if current role is affected
      if (this._currentRole()?.id === roleId) {
        await this.loadRoleUsers(roleId, { skipLoading: true });
      }

      // Send success notification
      this.notifications.success(
        'Role assigned',
        'Role has been successfully assigned to the user.'
      );
    }, opts);
  }

  /**
   * Unassign role from user
   */
  async unassignRoleFromUser(roleId: number, userId: number, opts?: FacadeOpts): Promise<void> {
    return this.executeOperation(async () => {
      await this.unassignRoleFromUserUC.execute({
        roleId,
        userId,
        unassignedByUserId: this.getCurrentUserId(),
      });

      // Refresh role users if current role is affected
      if (this._currentRole()?.id === roleId) {
        await this.loadRoleUsers(roleId, { skipLoading: true });
      }

      // Send success notification
      this.notifications.success(
        'Role unassigned',
        'Role has been successfully unassigned from the user.'
      );
    }, opts);
  }

  /**
   * Asigna un rol a múltiples usuarios de forma masiva
   *
   * Coordina el use case AssignRoleToUser para asignar un rol específico
   * a múltiples usuarios en una sola operación, actualiza la lista de
   * usuarios del rol si corresponde, y envía una notificación de éxito.
   *
   * @param {number} roleId - ID del rol a asignar
   * @param {number[]} userIds - Array de IDs de usuarios a los que asignar el rol
   * @param {FacadeOpts} [opts] - Opciones adicionales para la operación
   * @returns {Promise<void>} Promesa que se resuelve cuando se completa la asignación masiva
   *
   * @throws {ApplicationError} Si el rol no existe o no hay permisos
   *
   * @example
   * ```typescript
   * await rolesFacade.bulkAssignRoleToUsers(123, [456, 789, 101]);
   * // El rol 123 se asigna a los usuarios 456, 789 y 101
   * ```
   */
  async bulkAssignRoleToUsers(roleId: number, userIds: number[], opts?: FacadeOpts): Promise<void> {
    return this.executeOperation(async () => {
      for (const userId of userIds) {
        await this.assignRoleToUserUC.execute({
          roleId,
          userId,
          assignedByUserId: this.getCurrentUserId(),
        });
      }

      // Refresh role users if current role is affected
      if (this._currentRole()?.id === roleId) {
        await this.loadRoleUsers(roleId, { skipLoading: true });
      }

      // Send success notification
      this.notifications.success(
        'Bulk assignment completed',
        `Role assigned to ${userIds.length} users successfully.`
      );
    }, opts);
  }

  /**
   * Crea múltiples roles de forma masiva
   *
   * Coordina el use case BulkCreateRoles para crear múltiples roles en una
   * sola operación, maneja errores de forma controlada, actualiza el estado
   * reactivo refrescando la lista completa, y envía una notificación con
   * el resultado de la operación.
   *
   * @param {object[]} rolesData - Array de datos de roles a crear
   * @param {string} rolesData[].name - Nombre del rol
   * @param {number} rolesData[].accessLevel - Nivel de acceso del rol
   * @param {string} rolesData[].description - Descripción del rol
   * @param {boolean} [rolesData[].canLeadProjects=false] - Si puede liderar proyectos
   * @param {boolean} [rolesData[].isUniquePerTeam=false] - Si es único por equipo
   * @param {FacadeOpts} [opts] - Opciones adicionales para la operación
   * @returns {Promise<Role[]>} Promesa que resuelve con array vacío (actualización por refresh)
   *
   * @throws {ApplicationError} Si hay errores críticos en la operación masiva
   *
   * @example
   * ```typescript
   * const rolesToCreate = [
   *   { name: 'Manager', accessLevel: 3, description: 'Team manager' },
   *   { name: 'Developer', accessLevel: 2, description: 'Software developer' }
   * ];
   * await rolesFacade.bulkCreateRoles(rolesToCreate);
   * ```
   */
  async bulkCreateRoles(
    rolesData: {
      name: string;
      accessLevel: number;
      description: string;
      canLeadProjects?: boolean;
      isUniquePerTeam?: boolean;
    }[],
    opts?: FacadeOpts
  ): Promise<Role[]> {
    return this.executeOperation(async () => {
      const request: BulkCreateRolesRequest = {
        roles: rolesData,
        requesterId: this.getCurrentUserId(),
        continueOnError: true,
        validateOnly: false,
      };

      const response = await this.bulkCreateRolesUC.execute(request);

      // Update reactive state - BulkCreateRolesResult only has counters
      this.notifications.success(
        `Successfully created ${response.successful} roles, ${response.failed} failed`
      );

      // Refresh roles list to get updated data
      await this.refresh(undefined, { skipLoading: true });

      return [];
    }, opts);
  }

  /**
   * Bulk update multiple roles
   */
  async bulkUpdateRoles(
    updates: {
      id: number;
      data: {
        name?: string;
        accessLevel?: number;
        description?: string;
        isActive?: boolean;
        canLeadProjects?: boolean;
        isUniquePerTeam?: boolean;
      };
    }[],
    opts?: FacadeOpts
  ): Promise<Role[]> {
    return this.executeOperation(async () => {
      const request: BulkUpdateRolesRequest = {
        updates: updates.map((update) => ({
          id: update.id,
          updates: {
            name: update.data.name,
            accessLevel: update.data.accessLevel,
            description: update.data.description,
            canLeadProjects: update.data.canLeadProjects,
            isUniquePerTeam: update.data.isUniquePerTeam,
          },
        })),
        requesterId: this.getCurrentUserId(),
        continueOnError: true,
      };

      const response = await this.bulkUpdateRolesUC.execute(request);

      // Update reactive state
      const updatedRoles = response.results
        .filter((result) => result.success && result.updatedRole)
        .map((result) => result.updatedRole as Role); // Cast to Role type

      const updatedRoleSummarys = updatedRoles.map(RoleApplicationMapper.toRoleSummary);
      this._roles.update((roles) => {
        const updatedMap = new Map(updatedRoleSummarys.map((role) => [role.id, role]));
        return roles.map((role) => updatedMap.get(role.id) || role);
      });

      // Update current role if it was updated
      const currentRole = this._currentRole();
      if (currentRole) {
        const updatedCurrent = updatedRoleSummarys.find((role) => role.id === currentRole.id);
        if (updatedCurrent) {
          this._currentRole.set(updatedCurrent);
        }
      }

      // Send success notification
      const summary = response.summary;
      this.notifications.success(
        'Bulk update completed',
        `Successfully updated ${summary.successful} of ${summary.total} roles. ${
          summary.failed > 0 ? `${summary.failed} failed.` : ''
        }`
      );

      return updatedRoles;
    }, opts);
  }

  /**
   * Bulk delete multiple roles
   */
  async bulkDeleteRoles(roleIds: number[], opts?: FacadeOpts): Promise<void> {
    return this.executeOperation(async () => {
      const request: BulkDeleteRolesRequest = {
        roleIds,
        requesterId: this.getCurrentUserId(),
        continueOnError: true,
      };

      const response = await this.bulkDeleteRolesUC.execute(request);

      // Update reactive state - BulkDeleteRolesResult only has counters
      this._roles.update((roles) => roles.filter((role) => !roleIds.includes(role.id)));

      // Clear current role if it was deleted
      const currentRole = this._currentRole();
      if (currentRole && roleIds.includes(currentRole.id)) {
        this._currentRole.set(null);
        this._roleUsers.set([]);
      }

      // Send success notification
      this.notifications.success(
        'Bulk deletion completed',
        `Successfully deleted ${response.successful} of ${response.total} roles. ${
          response.failed > 0 ? `${response.failed} failed.` : ''
        }`
      );
    }, opts);
  }

  /**
   * Export roles to specified format
   */
  async exportRoles(
    roleIds: number[],
    options: Partial<RoleExportConfig>,
    opts?: FacadeOpts
  ): Promise<void> {
    return this.executeOperation(async () => {
      const selectedRoleSummarys = this._roles().filter((roleModel) =>
        roleIds.includes(roleModel.id)
      );

      if (selectedRoleSummarys.length === 0) {
        throw new Error('No roles selected for export');
      }

      const domainRoles = selectedRoleSummarys.map((summary) =>
        Role.create({
          id: summary.id,
          name: summary.name,
          accessLevel: summary.accessLevel,
          isActive: summary.isActive,
          description: summary.description || null,
          userCount: summary.userCount || 0,
        })
      );

      const exportOptions: RoleExportConfig = {
        format: 'csv',
        includeId: true,
        includeAccessLevel: true,
        includeStatus: true,
        includeDescription: true,
        includeUserCount: true,
        ...options,
      };

      await this.roleExportService.exportRoles(domainRoles, exportOptions);

      this.notifications.success(
        'Export completed',
        `Successfully exported ${
          selectedRoleSummarys.length
        } roles as ${(exportOptions.format || 'CSV').toUpperCase()}.`
      );
    }, opts);
  }

  /**
   * Limpia el estado de error actual
   *
   * Resetea el estado de error del facade a null, útil para
   * limpiar mensajes de error después de que el usuario los haya visto.
   *
   * @example
   * ```typescript
   * // Después de mostrar el error al usuario
   * rolesFacade.clearError();
   * ```
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Limpia la selección del rol actual
   *
   * Resetea el rol actualmente seleccionado y limpia la lista
   * de usuarios asociados al rol, útil para resetear el estado
   * de navegación del usuario.
   *
   * @example
   * ```typescript
   * // Al cambiar de vista o cerrar un modal
   * rolesFacade.clearCurrentRole();
   * ```
   */
  clearCurrentRole(): void {
    this._currentRole.set(null);
    this._roleUsers.set([]);
  }

  /**
   * Resetea completamente el estado del facade
   *
   * Limpia todos los estados reactivos del facade: loading, error,
   * lista de roles, rol actual, usuarios del rol y filtros actuales.
   * Útil para inicializar o resetear completamente el estado.
   *
   * @example
   * ```typescript
   * // Al desmontar un componente o cambiar de contexto
   * rolesFacade.reset();
   * ```
   */
  reset(): void {
    this._loading.set(false);
    this._error.set(null);
    this._roles.set([]);
    this._currentRole.set(null);
    this._roleUsers.set([]);
    this._currentFilters.set(null);
  }

  /**
   * Obtiene estadísticas de los roles actuales
   *
   * Calcula estadísticas agregadas de los roles en el estado actual,
   * incluyendo conteos por estado y distribución por nivel de acceso.
   *
   * @returns {object} Objeto con estadísticas de roles
   * @returns {number} return.total - Total de roles
   * @returns {number} return.active - Número de roles activos
   * @returns {number} return.inactive - Número de roles inactivos
   * @returns {Record<number, number>} return.byAccessLevel - Distribución por nivel de acceso
   *
   * @example
   * ```typescript
   * const stats = rolesFacade.getRoleStatistics();
   * console.log(`Total roles: ${stats.total}, Active: ${stats.active}`);
   * ```
   */
  getRoleStatistics() {
    const roles = this._roles();
    return {
      total: roles.length,
      active: roles.filter((role) => role.isActive).length,
      inactive: roles.filter((role) => !role.isActive).length,
      byAccessLevel: roles.reduce(
        (acc, role) => {
          acc[role.accessLevel] = (acc[role.accessLevel] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>
      ),
    };
  }

  /**
   * Ejecuta una operación con manejo común de errores y estado de carga
   *
   * Método auxiliar que envuelve operaciones asíncronas con manejo
   * automático de estado de carga, errores y notificaciones. Proporciona
   * un patrón consistente para todas las operaciones del facade.
   *
   * @private
   * @template T - Tipo del resultado de la operación
   * @param {() => Promise<T>} operation - Función que ejecuta la operación
   * @param {FacadeOpts} [opts] - Opciones para controlar el comportamiento
   * @returns {Promise<T>} Resultado de la operación
   *
   * @throws {ApplicationError} Error transformado por el error transformer
   *
   * @example
   * ```typescript
   * return this.executeOperation(async () => {
   *   const result = await this.someUseCase.execute(params);
   *   // lógica específica
   *   return result;
   * }, opts);
   * ```
   */
  private async executeOperation<T>(operation: () => Promise<T>, opts?: FacadeOpts): Promise<T> {
    if (!opts?.skipLoading) {
      this._loading.set(true);
    }
    this._error.set(null);

    try {
      return await operation();
    } catch (error: unknown) {
      const errorMessage = this.errorTransformer.transform(error as Error);
      this._error.set(errorMessage.message);
      throw error;
    } finally {
      if (!opts?.skipLoading) {
        this._loading.set(false);
      }
    }
  }

  /**
   * Obtiene el ID del usuario actual para operaciones que requieren requestedBy
   *
   * Método auxiliar que obtiene el ID del usuario actualmente autenticado
   * desde el AuthFacade. Se utiliza en operaciones que requieren tracking
   * del usuario que realiza la acción.
   *
   * @private
   * @returns {number} ID del usuario actualmente autenticado
   *
   * @throws {Error} Si no hay usuario autenticado
   *
   * @example
   * ```typescript
   * const requesterId = this.getCurrentUserId();
   * await this.someUseCase.execute({ ...params, requesterId });
   * ```
   */
  private getCurrentUserId(): number {
    const user = this.authFacade.user();
    if (!user) {
      throw new Error('User not authenticated. Please log in to perform this operation.');
    }
    return user.id;
  }

  /**
   * Aplica filtros del lado cliente a la lista de roles
   *
   * Método auxiliar que filtra la lista de roles según los parámetros
   * proporcionados. Soporta filtrado por término de búsqueda (en nombre)
   * y por estado activo/inactivo.
   *
   * @private
   * @param {Role[]} roles - Lista de roles a filtrar
   * @param {ListRolesParams} params - Parámetros de filtrado
   * @returns {Role[]} Lista de roles filtrados
   *
   * @example
   * ```typescript
   * const filteredRoles = this.applyFilters(allRoles, {
   *   search: 'admin',
   *   active: true
   * });
   * ```
   */
  private applyFilters(roles: Role[], params: ListRolesParams): Role[] {
    return roles.filter((role) => {
      const matchesSearch = params.search
        ? role.name.toLowerCase().includes(params.search.toLowerCase())
        : true;

      const matchesActive =
        params.active !== undefined && params.active !== null
          ? role.isActive === params.active
          : true;

      return matchesSearch && matchesActive;
    });
  }
}
