// application/errors/application-error.ts
import { ApplicationErrorCode } from './error-codes.enum';

export class ApplicationError extends Error {
  public readonly code: ApplicationErrorCode;
  public readonly userMessage: string;
  public readonly context?: Record<string, unknown>;
  public readonly suggestedAction?: string;
  public readonly timestamp: Date;
  public readonly errorId: string;
  public readonly retryable: boolean;

  constructor(
    code: ApplicationErrorCode,
    technicalMessage: string,
    userMessage: string,
    context?: Record<string, unknown>,
    suggestedAction?: string,
    retryable = false
  ) {
    super(technicalMessage);
    this.name = 'ApplicationError';
    this.code = code;
    this.userMessage = userMessage;
    this.context = context;
    this.suggestedAction = suggestedAction;
    this.timestamp = new Date();
    this.errorId = this.generateErrorId();
    this.retryable = retryable;
  }

  // Auth feature factory methods
  static authenticationFailed(): ApplicationError {
    return new ApplicationError(
      ApplicationErrorCode.AUTH_FAILED,
      'User authentication failed',
      'Invalid email or password',
      undefined,
      'Please check your credentials and try again'
    );
  }

  static sessionExpired(): ApplicationError {
    return new ApplicationError(
      ApplicationErrorCode.SESSION_EXPIRED,
      'User session has expired',
      'Your session has expired for security reasons',
      undefined,
      'Please log in again to continue'
    );
  }

  static userNotFound(email?: string): ApplicationError {
    return new ApplicationError(
      ApplicationErrorCode.USER_NOT_FOUND,
      'User not found in system',
      'No account found with this email address',
      { email },
      'Please check the email address or register a new account'
    );
  }

  static accountLocked(userId: string, unlockTime?: Date): ApplicationError {
    return new ApplicationError(
      ApplicationErrorCode.ACCOUNT_LOCKED,
      'User account is locked',
      'Your account has been temporarily locked due to multiple failed login attempts',
      { userId, unlockTime },
      unlockTime
        ? `Please try again after ${unlockTime.toLocaleString()}`
        : 'Contact support to unlock your account'
    );
  }

  // User Management factory methods
  static insufficientPermissions(requiredRole: string, userRole?: string): ApplicationError {
    return new ApplicationError(
      ApplicationErrorCode.INSUFFICIENT_PERMISSIONS,
      'User lacks required permissions',
      'You do not have permission to perform this action',
      { requiredRole, userRole },
      'Contact your administrator if you need additional permissions'
    );
  }

  static userAlreadyExists(email: string): ApplicationError {
    return new ApplicationError(
      ApplicationErrorCode.USER_ALREADY_EXISTS,
      'User with email already exists',
      'An account with this email address already exists',
      { email },
      'Try logging in instead, or use a different email address'
    );
  }

  // System factory methods
  static serviceUnavailable(service: string, retryAfter?: number): ApplicationError {
    return new ApplicationError(
      ApplicationErrorCode.SERVICE_UNAVAILABLE,
      `Service ${service} is currently unavailable`,
      'The service is temporarily unavailable. Please try again later.',
      { service, retryAfter },
      retryAfter !== undefined
        ? `Please try again in ${retryAfter} seconds`
        : 'Please try again in a few minutes',
      true
    );
  }

  static invalidInput(details: string): ApplicationError {
    return new ApplicationError(
      ApplicationErrorCode.INVALID_INPUT,
      `Invalid input provided: ${details}`,
      'The information provided is not valid',
      { details },
      'Please check your input and try again'
    );
  }

  static unexpectedError(): ApplicationError {
    return new ApplicationError(
      ApplicationErrorCode.UNEXPECTED_ERROR,
      'An unexpected error occurred',
      'Something went wrong. Please try again.',
      undefined,
      'If the problem persists, please contact support',
      true
    );
  }

  private generateErrorId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `app_${timestamp}_${random}`;
  }
}
