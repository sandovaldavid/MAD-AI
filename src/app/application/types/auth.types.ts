/**
 * Application Layer Types for Authentication Feature
 *
 * @description
 * This module contains request/response types, result patterns, and application-specific
 * contracts for the authentication feature. These types bridge the gap between the
 * presentation layer and the domain layer, providing clean interfaces for use cases
 * and facades while maintaining separation of concerns.
 *
 * @architecture
 * - Request types: Input data for use cases (from presentation layer)
 * - Response types: Output data from use cases (to presentation layer)
 * - Result patterns: Standardized success/failure handling
 * - Device info: Optional metadata for security and analytics
 *
 * @since 1.0.0
 * @layer Application
 */

import type { Identifier } from '@domain/contracts/auth.contract';
import type { Session } from '@domain/entities/session.entity';
import type { User } from '@domain/entities/user.entity';

// ==========================================
// REQUEST TYPES
// ==========================================

/**
 * Device information for security and analytics tracking
 */
export interface DeviceInfo {
  userAgent?: string;
  deviceId?: string;
  platform?: string;
  ipAddress?: string;
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
}

/**
 * Login request data for authentication use case
 */
export interface LoginRequest {
  /** User identifier (email or username) */
  identifier: Identifier;
  /** User password */
  password: string;
  /** Whether to persist session across browser restarts */
  rememberMe?: boolean;
  /** Optional device information for security tracking */
  deviceInfo?: DeviceInfo;
}

/**
 * User registration request data
 */
export interface RegisterRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  passwordConfirm: string;
  acceptTerms: boolean;
  roleId?: number;
  deviceInfo?: DeviceInfo;
}

/**
 * Password reset request data
 */
export interface PasswordResetRequest {
  email: string;
  redirectUrl?: string;
  deviceInfo?: DeviceInfo;
}

/**
 * Logout request data
 */
export interface LogoutRequest {
  logoutFromAllDevices?: boolean;
  reason?: string;
  deviceInfo?: DeviceInfo;
}

/**
 * Refresh session request data
 */
export interface RefreshSessionRequest {
  forceRefresh?: boolean;
  reason?: string;
  deviceInfo?: DeviceInfo;
}

/**
 * Password reset confirmation request data
 */
export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
  newPasswordConfirm: string;
  deviceInfo?: DeviceInfo;
}

/**
 * Email confirmation request data
 */
export interface EmailConfirmationRequest {
  token: string;
  deviceInfo?: DeviceInfo;
}

/**
 * Profile request data
 */
export interface ProfileRequest {
  includePermissions?: boolean;
  deviceInfo?: DeviceInfo;
}

// ==========================================
// RESULT TYPES
// ==========================================

/**
 * Base result class for application operations
 */
export abstract class ApplicationResult<T> {
  protected constructor(
    public readonly isSuccess: boolean,
    public readonly data?: T,
    public readonly error?: string,
    public readonly metadata?: Record<string, any>
  ) {}
}

/**
 * Login operation result
 */
export class LoginResult extends ApplicationResult<Session> {
  private constructor(
    isSuccess: boolean,
    data?: Session,
    error?: string,
    metadata?: Record<string, any>
  ) {
    super(isSuccess, data, error, metadata);
  }

  static success(session: Session, metadata?: Record<string, any>): LoginResult {
    return new LoginResult(true, session, undefined, metadata);
  }

  static failure(error: string, metadata?: Record<string, any>): LoginResult {
    return new LoginResult(false, undefined, error, metadata);
  }

  get session(): Session {
    if (!this.isSuccess || !this.data) {
      throw new Error('Cannot access session from failed login result');
    }
    return this.data;
  }
}

/**
 * Registration operation result
 */
export class RegisterResult extends ApplicationResult<Session | null> {
  private constructor(
    isSuccess: boolean,
    data?: Session | null,
    error?: string,
    metadata?: Record<string, any>
  ) {
    super(isSuccess, data, error, metadata);
  }

  static success(session: Session | null, metadata?: Record<string, any>): RegisterResult {
    return new RegisterResult(true, session, undefined, metadata);
  }

  static failure(error: string, metadata?: Record<string, any>): RegisterResult {
    return new RegisterResult(false, undefined, error, metadata);
  }

  get session(): Session | null {
    return this.isSuccess ? this.data || null : null;
  }
}

/**
 * Profile operation result
 */
export class ProfileResult extends ApplicationResult<User> {
  private constructor(
    isSuccess: boolean,
    data?: User,
    error?: string,
    metadata?: Record<string, any>
  ) {
    super(isSuccess, data, error, metadata);
  }

  static success(user: User, metadata?: Record<string, any>): ProfileResult {
    return new ProfileResult(true, user, undefined, metadata);
  }

  static failure(error: string, metadata?: Record<string, any>): ProfileResult {
    return new ProfileResult(false, undefined, error, metadata);
  }

  get user(): User {
    if (!this.isSuccess || !this.data) {
      throw new Error('Cannot access user from failed profile result');
    }
    return this.data;
  }
}

/**
 * Message operation result
 */
export class MessageResult extends ApplicationResult<string> {
  private constructor(
    isSuccess: boolean,
    data?: string,
    error?: string,
    metadata?: Record<string, any>
  ) {
    super(isSuccess, data, error, metadata);
  }

  static success(message: string, metadata?: Record<string, any>): MessageResult {
    return new MessageResult(true, message, undefined, metadata);
  }

  static failure(error: string, metadata?: Record<string, any>): MessageResult {
    return new MessageResult(false, undefined, error, metadata);
  }

  get message(): string {
    if (!this.isSuccess || !this.data) {
      throw new Error('Cannot access message from failed result');
    }
    return this.data;
  }
}

/**
 * Logout operation result
 */
export class LogoutResult extends ApplicationResult<boolean> {
  private constructor(
    isSuccess: boolean,
    data?: boolean,
    error?: string,
    metadata?: Record<string, any>
  ) {
    super(isSuccess, data, error, metadata);
  }

  static success(metadata?: Record<string, any>): LogoutResult {
    return new LogoutResult(true, true, undefined, metadata);
  }

  static failure(error: string, metadata?: Record<string, any>): LogoutResult {
    return new LogoutResult(false, false, error, metadata);
  }

  get logoutSuccessful(): boolean {
    return this.isSuccess && this.data === true;
  }
}

/**
 * Refresh session operation result
 */
export class RefreshSessionResult extends ApplicationResult<Session> {
  private constructor(
    isSuccess: boolean,
    data?: Session,
    error?: string,
    metadata?: Record<string, any>
  ) {
    super(isSuccess, data, error, metadata);
  }

  static success(session: Session, metadata?: Record<string, any>): RefreshSessionResult {
    return new RefreshSessionResult(true, session, undefined, metadata);
  }

  static failure(error: string, metadata?: Record<string, any>): RefreshSessionResult {
    return new RefreshSessionResult(false, undefined, error, metadata);
  }

  get session(): Session {
    if (!this.isSuccess || !this.data) {
      throw new Error('Cannot access session from failed refresh result');
    }
    return this.data;
  }
}

// ==========================================
// APPLICATION EVENTS
// ==========================================

/**
 * Application events for cross-cutting concerns
 */
export interface AuthApplicationEvent {
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'REGISTER_SUCCESS' | 'LOGOUT' | 'SESSION_EXPIRED';
  userId?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// ==========================================
// VALIDATION TYPES
// ==========================================

/**
 * Validation result for application inputs
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * Input validator interface
 */
export interface InputValidator<T> {
  validate(input: T): ValidationResult;
}
