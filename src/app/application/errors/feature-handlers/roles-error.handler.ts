import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import type { HttpErrorClassification } from '@core/cross-cutting/http';
import type { ErrorHandlingContext } from './auth-error.handler';

/**
 * Roles Management Feature Error Handler - Application Layer
 *
 * @description Handles roles-specific business logic for error processing.
 * Contains feature-specific knowledge and business rules for roles domain.
 *
 * @architecturalNotes
 * - Application Layer: Business logic allowed
 * - Contains roles feature-specific knowledge
 * - Orchestrates error handling for role management features
 */
@Injectable({
  providedIn: 'root',
})
export class RolesErrorHandler {
  private router = inject(Router);

  /**
   * Determines if this handler can process the error based on business context
   */
  canHandle(error: HttpErrorResponse, context?: ErrorHandlingContext): boolean {
    return context?.feature === 'roles' || this.isRoleManagementError(error);
  }

  /**
   * Processes roles management errors with business logic
   */
  handle(
    error: HttpErrorResponse,
    technicalClassification: HttpErrorClassification,
    context: ErrorHandlingContext
  ): RolesErrorResult {
    const userMessage = this.getUserMessage(error, context.operation);
    const recoveryActions = this.getRecoveryActions(error, context.operation);

    return {
      userMessage,
      recoveryActions,
      shouldRedirect: this.shouldRedirect(error, context.operation),
      redirectUrl: this.getRedirectUrl(error, context.operation),
      shouldRetry: technicalClassification.isRetryable && this.isBusinessRetryable(error),
      businessContext: {
        feature: 'roles',
        operation: context.operation,
        isPermissionRelated: this.isPermissionRelated(error),
        affectedResourceType: this.getAffectedResourceType(error, context.operation),
      },
    };
  }

  /**
   * Business logic: Determines if error is role management related
   */
  private isRoleManagementError(error: HttpErrorResponse): boolean {
    const url = error.url?.toLowerCase() || '';
    return url.includes('/roles') || url.includes('/permissions');
  }

  /**
   * Business logic: Generate user-friendly messages for roles errors
   */
  private getUserMessage(error: HttpErrorResponse, operation: string): string {
    switch (error.status) {
      case 403:
        return this.get403Message(operation);
      case 404:
        return this.get404Message(operation);
      case 409:
        return this.get409Message(operation);
      case 422:
        return this.get422Message(error, operation);
      case 500:
      case 502:
      case 503:
        return 'Error del servidor en gestión de roles. Intenta más tarde';
      default:
        return this.getDefaultMessage(operation);
    }
  }

  private get403Message(operation: string): string {
    const messages: Record<string, string> = {
      'create-role': 'No tienes permisos para crear roles',
      'update-role': 'No tienes permisos para modificar este rol',
      'delete-role': 'No tienes permisos para eliminar roles',
      'assign-role': 'No tienes permisos para asignar roles',
      'get-roles': 'No tienes permisos para ver los roles',
      'get-role': 'No tienes permisos para ver este rol',
    };
    return messages[operation] || 'No tienes permisos para gestionar roles';
  }

  private get404Message(operation: string): string {
    const messages: Record<string, string> = {
      'get-role': 'El rol solicitado no existe',
      'update-role': 'El rol que intentas modificar no existe',
      'delete-role': 'El rol que intentas eliminar no existe',
      'assign-role': 'El rol que intentas asignar no existe',
    };
    return messages[operation] || 'Rol no encontrado';
  }

  private get409Message(operation: string): string {
    const messages: Record<string, string> = {
      'create-role': 'Ya existe un rol con ese nombre',
      'update-role': 'El nombre del rol ya está en uso',
      'delete-role': 'No se puede eliminar el rol porque está en uso',
      'assign-role': 'El usuario ya tiene este rol asignado',
    };
    return messages[operation] || 'Conflicto en la gestión de roles';
  }

  private get422Message(error: HttpErrorResponse, operation: string): string {
    const errorBody = error.error;

    if (errorBody?.errors) {
      const firstError = Object.entries(errorBody.errors)[0];
      if (firstError) {
        return this.translateValidationError(firstError[0], firstError[1] as string, operation);
      }
    }

    if (errorBody?.detail) {
      return this.translateValidationError('general', errorBody.detail, operation);
    }

    const messages: Record<string, string> = {
      'create-role': 'Datos del rol inválidos',
      'update-role': 'Datos de actualización inválidos',
      'assign-role': 'Asignación de rol inválida',
    };
    return messages[operation] || 'Datos de validación incorrectos';
  }

  private translateValidationError(field: string, message: string, operation: string): string {
    const fieldLower = field.toLowerCase();
    const messageLower = message.toLowerCase();

    if (fieldLower.includes('name') || fieldLower.includes('nombre')) {
      if (messageLower.includes('required') || messageLower.includes('requerido')) {
        return 'El nombre del rol es requerido';
      }
      if (messageLower.includes('length') || messageLower.includes('longitud')) {
        return 'El nombre del rol debe tener entre 3 y 50 caracteres';
      }
      if (messageLower.includes('invalid') || messageLower.includes('inválido')) {
        return 'El nombre del rol contiene caracteres inválidos';
      }
    }

    if (fieldLower.includes('description') || fieldLower.includes('descripcion')) {
      return 'La descripción del rol es inválida';
    }

    if (fieldLower.includes('permissions') || fieldLower.includes('permisos')) {
      return 'Los permisos seleccionados son inválidos';
    }

    return `Error en ${field}: ${message}`;
  }

  private getDefaultMessage(operation: string): string {
    const messages: Record<string, string> = {
      'create-role': 'Error al crear el rol',
      'update-role': 'Error al actualizar el rol',
      'delete-role': 'Error al eliminar el rol',
      'get-roles': 'Error al cargar los roles',
      'get-role': 'Error al cargar el rol',
      'assign-role': 'Error al asignar el rol',
    };
    return messages[operation] || 'Error en la gestión de roles';
  }

  /**
   * Business logic: Determine recovery actions for roles errors
   */
  private getRecoveryActions(error: HttpErrorResponse, operation: string): string[] {
    const actions: string[] = [];

    switch (error.status) {
      case 403:
        actions.push('Contacta al administrador del sistema');
        actions.push('Verifica que tienes los permisos necesarios');
        break;
      case 404:
        if (operation.includes('get')) {
          actions.push('Refresca la lista de roles');
          actions.push('Verifica que el rol existe');
        }
        break;
      case 409:
        if (operation.includes('create') || operation.includes('update')) {
          actions.push('Usa un nombre diferente para el rol');
        }
        if (operation.includes('delete')) {
          actions.push('Primero desasigna el rol de todos los usuarios');
        }
        break;
      case 422:
        actions.push('Corrige los campos marcados como inválidos');
        actions.push('Verifica que el nombre del rol es único');
        break;
      case 500:
        actions.push('Intenta la operación más tarde');
        actions.push('Contacta soporte si el problema persiste');
        break;
    }

    return actions;
  }

  /**
   * Business logic: Should redirect based on roles error
   */
  private shouldRedirect(error: HttpErrorResponse, operation: string): boolean {
    return error.status === 403 && !operation.includes('get');
  }

  /**
   * Business logic: Where to redirect for roles errors
   */
  private getRedirectUrl(error: HttpErrorResponse, operation: string): string | null {
    if (this.shouldRedirect(error, operation)) {
      return '/dashboard'; // Redirect to safe area
    }
    return null;
  }

  /**
   * Business logic: Is error retryable from business perspective
   */
  private isBusinessRetryable(error: HttpErrorResponse): boolean {
    // Don't retry permission, validation, or conflict errors
    return ![403, 404, 409, 422].includes(error.status);
  }

  /**
   * Business logic: Is this a permission-related error
   */
  private isPermissionRelated(error: HttpErrorResponse): boolean {
    return error.status === 403;
  }

  /**
   * Business logic: What type of resource is affected
   */
  private getAffectedResourceType(error: HttpErrorResponse, operation: string): string {
    if (operation.includes('role')) return 'role';
    if (operation.includes('permission')) return 'permission';
    return 'unknown';
  }
}

/**
 * Result of roles error handling
 */
export interface RolesErrorResult {
  userMessage: string;
  recoveryActions: string[];
  shouldRedirect: boolean;
  redirectUrl: string | null;
  shouldRetry: boolean;
  businessContext: {
    feature: string;
    operation: string;
    isPermissionRelated: boolean;
    affectedResourceType: string;
  };
}
