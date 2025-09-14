/**
 * Application Layer Types for Authentication Feature
 *
 * @description
 * Simplified types for authentication operations following Application Layer guidelines.
 * Uses simple interfaces for coordination between Presentation and Domain layers.
 *
 * @architecture
 * - Request types: Input data for use cases
 * - Response types: Return Domain entities directly (no UI-optimized summaries)
 * - Simple interfaces: No complex inheritance or business logic
 * - Presentation layer handles UI data transformation
 *
 * @since 1.0.0
 * @layer Application
 */

import type { Session } from '@domain/entities/session.entity';

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
  identifier: {
    type: 'email' | 'username';
    value: string;
  };
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
  confirmPassword: string;
  deviceInfo?: DeviceInfo;
}

/**
 * Email confirmation request data
 */
export interface EmailConfirmationRequest {
  token: string;
  deviceInfo?: DeviceInfo;
}

// ==========================================
// RESPONSE TYPES (Simplified Interfaces)
// ==========================================

/**
 * Login operation result - returns Domain entities directly
 */
export interface LoginResult {
  session: Session;
  expiresAt?: Date;
}

/**
 * Registration operation result - returns Domain entities directly
 */
export interface RegisterResult {
  session: Session | null;
  emailConfirmationRequired?: boolean;
}

/**
 * Profile operation result - returns Domain entities directly
 * Note: User entity should be obtained from session or separate query
 */
export interface ProfileResult {
  session: Session;
  lastLogin?: Date;
}

/**
 * Generic message operation result - simplified interface
 */
export interface MessageResult {
  message: string;
  type: 'success' | 'info' | 'warning';
}

/**
 * Logout operation result - simplified interface
 */
export interface LogoutResult {
  success: boolean;
  message?: string;
}

/**
 * Refresh session operation result - simplified interface
 */
export interface RefreshSessionResult {
  session: Session;
  refreshed: boolean;
  expiresAt: Date;
}

// ==========================================
// UTILITY TYPES
// ==========================================

/**
 * Authentication status - minimal coordination type
 */
export interface AuthStatus {
  isAuthenticated: boolean;
  sessionExpiresAt?: Date;
}

/**
 * Password reset status - minimal coordination type
 */
export interface PasswordResetStatus {
  email: string;
  tokenSent: boolean;
  expiresAt: Date;
}
