import { Injectable } from '@angular/core';
import { ApplicationError } from './application-error';
import { ValidationError } from '@domain/errors/validation-error.entity';
import { BusinessRuleError } from '@domain/errors/business-rule-error.entity';
import { InfrastructureError } from '@infrastructure/errors/infrastructure-error';
import { LogContext } from '@core/interfaces/logger.interface';
import { LoggerService } from '@core/services/logger.service';
import { ApplicationErrorCode } from './error-codes.enum';

@Injectable({ providedIn: 'root' })
export class ApplicationErrorTransformer {
  constructor(private logger: LoggerService) {}

  transform(error: unknown, context?: LogContext): ApplicationError {
    // Log usando la interface correcta
    this.logger.error('Transforming error in Application layer', {
      operation: 'error-transformation',
      correlationId: context?.correlationId,
      userId: context?.userId,
      ...context,
    });

    // Domain ValidationError - pass through with context
    if (error instanceof ValidationError) {
      return this.transformValidationError(error, context);
    }

    // Domain BusinessRuleError - transform to user-friendly Application error
    if (error instanceof BusinessRuleError) {
      return this.transformBusinessRuleError(error, context);
    }

    // Infrastructure errors - transform based on type
    if (error instanceof InfrastructureError) {
      return this.transformInfrastructureError(error, context);
    }

    // Application errors - pass through
    if (error instanceof ApplicationError) {
      return error;
    }

    // Unknown errors
    this.logger.error('Unknown error type encountered', {
      operation: 'error-transformation',
      correlationId: context?.correlationId,
    });

    return ApplicationError.unexpectedError();
  }

  private transformValidationError(error: ValidationError, context?: LogContext): ApplicationError {
    const fieldErrors = error.errors.map((e) => `${e.field}: ${e.message}`).join('; ');

    this.logger.warn('Validation error transformed', {
      operation: 'validation-error-transform',
      correlationId: context?.correlationId,
    });

    return new ApplicationError(
      ApplicationErrorCode.INVALID_INPUT,
      `Validation failed: ${error.message}`,
      `Please correct the following: ${fieldErrors}`,
      {
        validationErrors: error.errors,
        errorId: error.errorId,
      },
      'Please review and correct the highlighted fields'
    );
  }

  private transformBusinessRuleError(
    error: BusinessRuleError,
    context?: LogContext
  ): ApplicationError {
    this.logger.warn('Business rule error transformed', {
      operation: 'business-rule-error-transform',
      correlationId: context?.correlationId,
    });

    switch (error.code) {
      case 'ROLE_HAS_ASSIGNED_USERS':
        return new ApplicationError(
          ApplicationErrorCode.ROLE_IN_USE,
          error.message,
          'This role cannot be deleted because it is assigned to active users',
          error.context,
          'Remove all users from this role before deleting it'
        );

      case 'RESOURCE_IN_USE':
        return new ApplicationError(
          ApplicationErrorCode.INVALID_USER_STATE,
          error.message,
          'This resource cannot be modified because it is currently in use',
          error.context,
          'Please wait until the resource is available or contact an administrator'
        );

      default:
        return new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          error.message,
          'The requested operation violates business rules',
          error.context,
          'Please review your request and try again'
        );
    }
  }

  private transformInfrastructureError(
    error: InfrastructureError,
    context?: LogContext
  ): ApplicationError {
    this.logger.warn('Infrastructure error transformed', {
      operation: 'infrastructure-error-transform',
      correlationId: context?.correlationId,
    });

    switch (error.type) {
      case 'HTTP':
        return this.transformHttpError(error);
      case 'NETWORK':
        return ApplicationError.serviceUnavailable('network', 30);
      case 'CONNECTIVITY':
        return ApplicationError.serviceUnavailable('connection', 60);
      case 'API':
        return this.transformApiError(error);
      default:
        return ApplicationError.unexpectedError();
    }
  }

  private transformHttpError(error: InfrastructureError): ApplicationError {
    switch (error.statusCode) {
      case 401:
        return ApplicationError.authenticationFailed();
      case 403:
        return ApplicationError.insufficientPermissions('authorized user');
      case 404:
        return ApplicationError.userNotFound();
      case 429:
        return new ApplicationError(
          ApplicationErrorCode.RATE_LIMIT_EXCEEDED,
          'Rate limit exceeded',
          'Too many requests. Please slow down.',
          { endpoint: error.endpoint },
          'Please wait a moment before trying again',
          true
        );
      case 500:
      case 502:
      case 503:
        return ApplicationError.serviceUnavailable('server', 60);
      default:
        return ApplicationError.unexpectedError();
    }
  }

  private transformApiError(error: InfrastructureError): ApplicationError {
    if (error.code === 'API_VERSION_NOT_SUPPORTED') {
      return ApplicationError.serviceUnavailable('API', 0);
    }

    return ApplicationError.unexpectedError();
  }
}
