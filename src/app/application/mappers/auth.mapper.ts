import { Injectable } from '@angular/core';
import type { PasswordResetConfirmRequest } from '@application/types/auth.types';
import type { ResetPasswordContract } from '@domain/repositories/business/auth.contract';
import type { LoginRequest } from '@application/types/auth.types';
import type { CredentialsContract, Identifier } from '@domain/repositories/business/auth.contract';
import type { RegisterRequest } from '@application/types/auth.types';
import type { RegisterUserContract } from '@domain/repositories/business/auth.contract';

/**
 * Auth Mapper - Application Layer
 *
 * @description
 * Handles transformations between Application and Domain layers for authentication operations.
 * Follows the Application Layer guidelines for mappers.
 *
 * @architecture
 * - Maps Application types to Domain contracts
 * - Maps Domain entities to Application types
 * - Provides clean separation between layers
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class AuthMapper {
  /**
   * Maps PasswordResetConfirmRequest to ResetPasswordContract
   *
   * @param request - Application layer request
   * @returns Domain layer contract
   */
  static toResetPasswordContract(request: PasswordResetConfirmRequest): ResetPasswordContract {
    return {
      token: request.token,
      newPassword: request.newPassword,
      newPasswordConfirm: request.confirmPassword,
    };
  }

  /**
   * Maps LoginRequest to CredentialsContract
   *
   * @param request - Application layer request
   * @returns Domain layer contract
   */
  static toCredentialsContract(request: LoginRequest): CredentialsContract {
    // Convert string identifier to Identifier type for domain contract
    let identifier: Identifier;
    if (request.identifier.includes('@')) {
      identifier = { type: 'email', value: request.identifier };
    } else {
      identifier = { type: 'username', value: request.identifier };
    }
    return {
      identifier,
      password: request.password,
      rememberMe: request.rememberMe ?? false,
    };
  }

  /**
   * Maps ResetPasswordContract to PasswordResetConfirmRequest
   *
   * @param contract - Domain layer contract
   * @returns Application layer request
   */
  static toPasswordResetConfirmRequest(
    contract: ResetPasswordContract
  ): PasswordResetConfirmRequest {
    return {
      token: contract.token,
      newPassword: contract.newPassword,
      confirmPassword: contract.newPasswordConfirm,
    };
  }

  /**
   * Maps RegisterRequest to RegisterUserContract
   *
   * @param request - Application layer request
   * @returns Domain layer contract
   */
  static toRegisterUserContract(request: RegisterRequest): RegisterUserContract {
    return {
      username: request.username,
      email: request.email,
      password: request.password,
      passwordConfirm: request.passwordConfirm,
      firstName: request.firstName,
      lastName: request.lastName,
      roleId: request.roleId || null,
    };
  }
}
