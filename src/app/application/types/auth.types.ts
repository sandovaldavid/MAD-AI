/**
 * Application Layer Types for Authentication Feature
 *
 * @description
 * Simplified types for authentication operations following Application Layer guidelines.
 * Uses simple interfaces instead of complex classes for better maintainability.
 *
 * @architecture
 * - Request types: Input data for use cases
 * - Response types: Output data from use cases
 * - Simple interfaces: No complex inheritance or static methods
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
 * Login operation result - simplified interface
 */
export interface LoginResult {
  session: Session;
  user: UserSummary;
  expiresAt?: Date;
}

/**
 * Registration operation result - simplified interface
 */
export interface RegisterResult {
  session: Session | null;
  user: UserSummary;
  emailConfirmationRequired?: boolean;
}

/**
 * Profile operation result - simplified interface
 */
export interface ProfileResult {
  user: UserSummary;
  lastLogin?: Date;
  preferences?: UserPreferences;
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
 * User summary for application layer responses
 */
export interface UserSummary {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  emailVerified: boolean;
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme?: 'light' | 'dark';
  language?: string;
  notifications?: {
    email: boolean;
    push: boolean;
  };
}

/**
 * Authentication status
 */
export interface AuthStatus {
  isAuthenticated: boolean;
  user?: UserSummary;
  sessionExpiresAt?: Date;
}

/**
 * Password reset status
 */
export interface PasswordResetStatus {
  email: string;
  tokenSent: boolean;
  expiresAt: Date;
}
