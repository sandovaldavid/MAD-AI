/**
 * @fileoverview Auth Presentation Models
 *
 * This file contains the presentation layer models for authentication-related views.
 * These models are specifically designed for UI components and are decoupled
 * from application and domain layer types.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2025-01-01
 */

export interface LoginFormView {
  email: string;
  password: string;
  rememberMe: boolean;
  isLoading: boolean;
  showPassword: boolean;
}

export interface RegisterFormView {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  isLoading: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
}

export interface ResetPasswordFormView {
  email: string;
  isLoading: boolean;
  emailSent: boolean;
}

export interface ChangePasswordFormView {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  isLoading: boolean;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
}

export interface VerifyEmailView {
  email: string;
  verificationCode: string;
  isLoading: boolean;
  resendDisabled: boolean;
  countdown: number;
}

export interface AuthLayoutView {
  title: string;
  subtitle: string;
  backgroundImage?: string;
  logoUrl: string;
  showFooter: boolean;
  footerLinks: FooterLinkView[];
}

export interface FooterLinkView {
  label: string;
  url: string;
  external?: boolean;
}

// Form validation types
export interface LoginFormValidation {
  email: ValidationState;
  password: ValidationState;
}

export interface RegisterFormValidation {
  firstName: ValidationState;
  lastName: ValidationState;
  email: ValidationState;
  username: ValidationState;
  password: ValidationState;
  confirmPassword: ValidationState;
  acceptTerms: ValidationState;
}

export interface ChangePasswordFormValidation {
  currentPassword: ValidationState;
  newPassword: ValidationState;
  confirmPassword: ValidationState;
}

export interface ValidationState {
  isValid: boolean;
  message?: string;
  showError: boolean;
}

// Auth state views
export interface AuthStateView {
  isAuthenticated: boolean;
  isLoading: boolean;
  user?: UserSummaryView;
  lastLogin?: string;
  sessionExpiresAt?: string;
}

export interface UserSummaryView {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  role: string;
  permissions: string[];
}

// Error views
export interface AuthErrorView {
  type: 'login' | 'register' | 'reset-password' | 'change-password' | 'verify-email';
  title: string;
  message: string;
  suggestions?: string[];
  showRetry?: boolean;
  showContactSupport?: boolean;
}

// Success views
export interface AuthSuccessView {
  type: 'login' | 'register' | 'reset-password' | 'change-password' | 'verify-email';
  title: string;
  message: string;
  nextAction?: {
    label: string;
    url: string;
  };
  autoRedirect?: {
    url: string;
    countdown: number;
  };
}

// Loading states
export interface AuthLoadingView {
  message: string;
  showSpinner: boolean;
  showProgress?: boolean;
  progress?: number;
}

// Navigation guards
export interface AuthGuardView {
  isAuthenticated: boolean;
  isLoading: boolean;
  requiredRole?: string;
  userRole?: string;
  redirectUrl?: string;
  errorMessage?: string;
}

// Password strength indicator
export interface PasswordStrengthView {
  score: 0 | 1 | 2 | 3 | 4; // 0 = very weak, 4 = very strong
  label: string;
  color: BadgeColor;
  requirements: PasswordRequirementView[];
}

export interface PasswordRequirementView {
  text: string;
  met: boolean;
}

export type BadgeColor = 'danger' | 'warning' | 'info' | 'success';

// Social login
export interface SocialLoginView {
  provider: 'google' | 'github' | 'microsoft' | 'linkedin';
  label: string;
  icon: string;
  color: string;
  isLoading: boolean;
  disabled?: boolean;
}

// Remember me options
export interface RememberMeView {
  enabled: boolean;
  duration: '1h' | '24h' | '7d' | '30d' | '90d';
  label: string;
  description: string;
}

// Two-factor authentication
export interface TwoFactorView {
  enabled: boolean;
  method: 'app' | 'sms' | 'email';
  setupRequired: boolean;
  qrCode?: string;
  secret?: string;
  verificationCode: string;
  isLoading: boolean;
}

// Account recovery
export interface AccountRecoveryView {
  step: 'request' | 'verify' | 'reset';
  email: string;
  verificationCode: string;
  newPassword: string;
  confirmPassword: string;
  isLoading: boolean;
  tokenValid: boolean;
  tokenExpired?: boolean;
}

// Session management
export interface SessionView {
  id: string;
  device: string;
  browser: string;
  location: string;
  ipAddress: string;
  lastActivity: string;
  isCurrentSession: boolean;
  canTerminate: boolean;
}

export interface SessionManagementView {
  currentSession: SessionView;
  otherSessions: SessionView[];
  isLoading: boolean;
}

// Terms and conditions
export interface TermsView {
  version: string;
  lastUpdated: string;
  content: string;
  accepted: boolean;
  acceptanceDate?: string;
}

// Privacy policy
export interface PrivacyView {
  version: string;
  lastUpdated: string;
  content: string;
  accepted: boolean;
  acceptanceDate?: string;
}

// Notification preferences
export interface AuthNotificationPreferencesView {
  emailNotifications: boolean;
  securityAlerts: boolean;
  loginNotifications: boolean;
  marketingEmails: boolean;
}

// Account settings
export interface AccountSettingsView {
  profile: UserSummaryView;
  security: SecuritySettingsView;
  notifications: AuthNotificationPreferencesView;
  privacy: PrivacySettingsView;
}

export interface SecuritySettingsView {
  twoFactorEnabled: boolean;
  passwordLastChanged: string;
  loginAttempts: number;
  accountLocked: boolean;
  trustedDevices: TrustedDeviceView[];
}

export interface TrustedDeviceView {
  id: string;
  name: string;
  type: string;
  lastUsed: string;
  trusted: boolean;
}

export interface PrivacySettingsView {
  profileVisibility: 'public' | 'private' | 'team';
  dataSharing: boolean;
  analyticsTracking: boolean;
  cookiePreferences: CookiePreferencesView;
}

export interface CookiePreferencesView {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}
