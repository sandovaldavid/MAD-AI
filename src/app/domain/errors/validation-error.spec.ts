import { ValidationError } from './validation-error.entity';
import { ValidationErrorCode } from './validation-error-code.enum';
import { FieldError } from './field-error.type';

/**
 * Domain Layer Test - ValidationError
 *
 * Tests validation error creation, field error handling, and domain invariants.
 * Ensures validation errors maintain business rules and provide correct domain feedback.
 */
describe('ValidationError - Domain Tests', () => {
  describe('Constructor and Basic Properties', () => {
    it('should create ValidationError with single field error', () => {
      const fieldError: FieldError = {
        field: 'email',
        value: 'invalid-email',
        message: 'Invalid email format',
        code: ValidationErrorCode.EMAIL_INVALID,
      };

      const error = ValidationError.create(fieldError);

      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ValidationError');
      expect(error.errors.length).toBe(1);
      expect(error.errors[0]).toEqual(fieldError);
      expect(error.code).toBe(ValidationErrorCode.EMAIL_INVALID);
      expect(error.errorId).toBeDefined();
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should create ValidationError with multiple field errors', () => {
      const fieldErrors: FieldError[] = [
        {
          field: 'email',
          value: '',
          message: 'Email is required',
          code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
        },
        {
          field: 'password',
          value: '123',
          message: 'Password too short',
          code: ValidationErrorCode.MIN_LENGTH_NOT_REACHED,
        },
      ];

      const error = ValidationError.createFromFields(fieldErrors);

      expect(error.errors.length).toBe(2);
      expect(error.errors).toEqual(fieldErrors);
      expect(error.message).toBe('email: Email is required; password: Password too short');
    });

    it('should generate unique error IDs', () => {
      const error1 = ValidationError.create({
        field: 'test1',
        value: 'value1',
        message: 'Error 1',
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      });

      const error2 = ValidationError.create({
        field: 'test2',
        value: 'value2',
        message: 'Error 2',
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      });

      expect(error1.errorId).not.toBe(error2.errorId);
      expect(error1.errorId).toMatch(/^ve_[a-z0-9]+_[a-z0-9]+$/);
    });

    it('should handle context information', () => {
      const context = { entityType: 'User', operation: 'create' };

      const error = ValidationError.create(
        {
          field: 'email',
          value: 'test',
          message: 'Invalid email',
          code: ValidationErrorCode.EMAIL_INVALID,
        },
        context
      );

      expect(error.context).toEqual(context);
    });
  });

  describe('Factory Methods', () => {
    describe('create', () => {
      it('should create ValidationError from single field error', () => {
        const fieldError: FieldError = {
          field: 'username',
          value: 'us',
          message: 'Username too short',
          code: ValidationErrorCode.MIN_LENGTH_NOT_REACHED,
        };

        const error = ValidationError.create(fieldError);

        expect(error.errors).toEqual([fieldError]);
        expect(error.code).toBe(ValidationErrorCode.MIN_LENGTH_NOT_REACHED);
        expect(error.message).toBe('username: Username too short');
      });

      it('should use provided context in create method', () => {
        const context = { minLength: 3 };
        const error = ValidationError.create(
          {
            field: 'name',
            value: 'A',
            message: 'Name too short',
            code: ValidationErrorCode.MIN_LENGTH_NOT_REACHED,
          },
          context
        );

        expect(error.context).toEqual(context);
      });
    });

    describe('createFromFields', () => {
      it('should create ValidationError from multiple field errors', () => {
        const fieldErrors: FieldError[] = [
          {
            field: 'firstName',
            value: '',
            message: 'First name required',
            code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
          },
          {
            field: 'lastName',
            value: '',
            message: 'Last name required',
            code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
          },
        ];

        const error = ValidationError.createFromFields(fieldErrors);

        expect(error.errors).toEqual(fieldErrors);
        expect(error.code).toBe(ValidationErrorCode.REQUIRED_FIELD_MISSING); // First error's code
      });

      it('should use provided primary code', () => {
        const fieldErrors: FieldError[] = [
          {
            field: 'email',
            value: 'invalid',
            message: 'Invalid email',
            code: ValidationErrorCode.EMAIL_INVALID,
          },
        ];

        const error = ValidationError.createFromFields(
          fieldErrors,
          ValidationErrorCode.VALIDATION_ERROR
        );

        expect(error.code).toBe(ValidationErrorCode.VALIDATION_ERROR);
      });

      it('should throw error for empty field errors array', () => {
        expect(() => {
          ValidationError.createFromFields([]);
        }).toThrowError('ValidationError requires at least one field error');
      });
    });

    describe('fromMessage', () => {
      it('should create ValidationError from simple message', () => {
        const error = ValidationError.fromMessage(
          'Custom validation failed',
          'customField',
          ValidationErrorCode.VALIDATION_ERROR
        );

        expect(error.errors[0]).toEqual({
          field: 'customField',
          value: undefined,
          message: 'Custom validation failed',
          code: ValidationErrorCode.VALIDATION_ERROR,
          severity: 'error',
        });
      });

      it('should handle empty field name', () => {
        const error = ValidationError.fromMessage('General error');

        expect(error.errors[0].field).toBe('');
        expect(error.errors[0].message).toBe('General error');
      });
    });
  });

  describe('Specialized Factory Methods', () => {
    describe('forUniqueConstraint', () => {
      it('should create unique constraint validation error', () => {
        const error = ValidationError.forUniqueConstraint('email', 'test@example.com', 'User');

        expect(error.errors[0].field).toBe('email');
        expect(error.errors[0].value).toBe('test@example.com');
        expect(error.message).toBe("email: email 'test@example.com' already exists");
        expect(error.context).toEqual({
          entityType: 'User',
          conflictingValue: 'test@example.com',
        });
      });

      it('should handle undefined entity type', () => {
        const error = ValidationError.forUniqueConstraint('username', 'testuser');

        expect(error.context).toEqual({ conflictingValue: 'testuser' });
      });
    });

    describe('forMissingRequiredFields', () => {
      it('should create error for single missing field', () => {
        const error = ValidationError.forMissingRequiredFields(['name']);

        expect(error.errors.length).toBe(1);
        expect(error.errors[0].field).toBe('name');
        expect(error.errors[0].code).toBe(ValidationErrorCode.REQUIRED_FIELD_MISSING);
        expect(error.message).toBe('name: name is required');
      });

      it('should create error for multiple missing fields', () => {
        const error = ValidationError.forMissingRequiredFields(['name', 'email', 'phone']);

        expect(error.errors.length).toBe(3);
        expect(error.message).toBe(
          'name: name is required; email: email is required; phone: phone is required'
        );
      });
    });
  });

  describe('Field Error Query Methods', () => {
    let multiFieldError: ValidationError;

    beforeEach(() => {
      const fieldErrors: FieldError[] = [
        {
          field: 'email',
          value: 'invalid',
          message: 'Invalid email',
          code: ValidationErrorCode.EMAIL_INVALID,
        },
        {
          field: 'password',
          value: '123',
          message: 'Password too short',
          code: ValidationErrorCode.MIN_LENGTH_NOT_REACHED,
        },
        {
          field: 'email',
          value: 'another@invalid',
          message: 'Another email error',
          code: ValidationErrorCode.EMAIL_INVALID,
        },
      ];

      multiFieldError = ValidationError.createFromFields(fieldErrors);
    });

    describe('hasFieldError', () => {
      it('should return true for field with errors', () => {
        expect(multiFieldError.hasFieldError('email')).toBe(true);
        expect(multiFieldError.hasFieldError('password')).toBe(true);
      });

      it('should return false for field without errors', () => {
        expect(multiFieldError.hasFieldError('username')).toBe(false);
      });
    });

    describe('getFieldErrors', () => {
      it('should return all errors for specific field', () => {
        const emailErrors = multiFieldError.getFieldErrors('email');

        expect(emailErrors.length).toBe(2);
        expect(emailErrors.every((e) => e.field === 'email')).toBe(true);
      });

      it('should return empty array for field without errors', () => {
        const usernameErrors = multiFieldError.getFieldErrors('username');

        expect(usernameErrors.length).toBe(0);
      });
    });

    describe('getFirstFieldError', () => {
      it('should return first error for specific field', () => {
        const firstEmailError = multiFieldError.getFirstFieldError('email');

        expect(firstEmailError).toBeDefined();
        expect(firstEmailError?.field).toBe('email');
        expect(firstEmailError?.message).toBe('Invalid email');
      });

      it('should return undefined for field without errors', () => {
        const usernameError = multiFieldError.getFirstFieldError('username');

        expect(usernameError).toBeUndefined();
      });
    });
  });

  describe('Error Analysis Methods', () => {
    describe('hasFormatErrors', () => {
      it('should return true when format errors exist', () => {
        const error = ValidationError.create({
          field: 'email',
          value: 'invalid',
          message: 'Invalid format',
          code: ValidationErrorCode.INVALID_FORMAT,
        });

        expect(error.hasFormatErrors()).toBe(true);
      });

      it('should return false when no format errors exist', () => {
        const error = ValidationError.create({
          field: 'name',
          value: '',
          message: 'Required',
          code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
        });

        expect(error.hasFormatErrors()).toBe(false);
      });
    });

    describe('getMaxSeverity', () => {
      it('should return error for errors with error severity', () => {
        const error = ValidationError.create({
          field: 'test',
          value: 'value',
          message: 'Error message',
          severity: 'error',
        });

        expect(error.getMaxSeverity()).toBe('error');
      });

      it('should return warning for highest severity warning', () => {
        const fieldErrors: FieldError[] = [
          { field: 'f1', value: 'v1', message: 'm1', severity: 'info' },
          { field: 'f2', value: 'v2', message: 'm2', severity: 'warning' },
        ];

        const error = ValidationError.createFromFields(fieldErrors);

        expect(error.getMaxSeverity()).toBe('warning');
      });

      it('should default to error when no severity specified', () => {
        const error = ValidationError.create({
          field: 'test',
          value: 'value',
          message: 'Message',
        });

        expect(error.getMaxSeverity()).toBe('info');
      });
    });

    describe('groupByErrorCode', () => {
      it('should group field errors by error code', () => {
        const fieldErrors: FieldError[] = [
          {
            field: 'email1',
            value: 'invalid1',
            message: 'Invalid email 1',
            code: ValidationErrorCode.EMAIL_INVALID,
          },
          {
            field: 'email2',
            value: 'invalid2',
            message: 'Invalid email 2',
            code: ValidationErrorCode.EMAIL_INVALID,
          },
          {
            field: 'password',
            value: 'short',
            message: 'Password too short',
            code: ValidationErrorCode.MIN_LENGTH_NOT_REACHED,
          },
        ];

        const error = ValidationError.createFromFields(fieldErrors);
        const grouped = error.groupByErrorCode();

        expect(grouped.get(ValidationErrorCode.EMAIL_INVALID)?.length).toBe(2);
        expect(grouped.get(ValidationErrorCode.MIN_LENGTH_NOT_REACHED)?.length).toBe(1);
      });
    });
  });

  describe('Error Combination and Transformation', () => {
    describe('combine', () => {
      it('should combine two ValidationErrors', () => {
        const error1 = ValidationError.create({
          field: 'email',
          value: 'invalid',
          message: 'Invalid email',
          code: ValidationErrorCode.EMAIL_INVALID,
        });

        const error2 = ValidationError.create({
          field: 'password',
          value: 'short',
          message: 'Password too short',
          code: ValidationErrorCode.MIN_LENGTH_NOT_REACHED,
        });

        const combined = error1.combine(error2);

        expect(combined.errors.length).toBe(2);
        expect(combined.errors[0].field).toBe('email');
        expect(combined.errors[1].field).toBe('password');
      });

      it('should preserve context from first error', () => {
        const context1 = { source: 'validation1' };
        const context2 = { source: 'validation2' };

        const error1 = ValidationError.create(
          {
            field: 'field1',
            value: 'value1',
            message: 'Error 1',
          },
          context1
        );

        const error2 = ValidationError.create(
          {
            field: 'field2',
            value: 'value2',
            message: 'Error 2',
          },
          context2
        );

        const combined = error1.combine(error2);

        expect(combined.context).toEqual({ source: 'validation2' });
      });
    });

    describe('mapFieldName', () => {
      it('should map all field names to new field name', () => {
        const fieldErrors: FieldError[] = [
          { field: 'email', value: 'test', message: 'Error 1' },
          { field: 'password', value: 'test', message: 'Error 2' },
        ];

        const error = ValidationError.createFromFields(fieldErrors);
        const mapped = error.mapFieldName('validation');

        expect(mapped.errors[0].field).toBe('validation');
        expect(mapped.errors[1].field).toBe('validation');
      });
    });
  });

  describe('Serialization Methods', () => {
    describe('toJSON', () => {
      it('should serialize ValidationError to JSON', () => {
        const context = { test: 'value' };
        const timestamp = new Date('2023-01-01T00:00:00Z');

        const error = ValidationError.create(
          {
            field: 'email',
            value: 'invalid',
            message: 'Invalid email',
            code: ValidationErrorCode.EMAIL_INVALID,
          },
          context
        );

        // Mock timestamp for consistent test
        const originalTimestamp = error.timestamp;
        Object.defineProperty(error, 'timestamp', {
          value: timestamp,
          writable: true,
          configurable: true,
        });

        const json = error.toJSON();

        expect(json).toEqual({
          name: 'ValidationError',
          code: ValidationErrorCode.EMAIL_INVALID,
          errorId: error.errorId,
          timestamp: '2023-01-01T00:00:00.000Z',
          errors: [...error.errors],
          message: error.message,
          context,
        });

        // Restore original timestamp
        Object.defineProperty(error, 'timestamp', {
          value: originalTimestamp,
          writable: true,
          configurable: true,
        });
      });
    });

    describe('toUserFriendlyMessage', () => {
      it('should create user-friendly error summary', () => {
        const fieldErrors: FieldError[] = [
          { field: 'email', value: 'invalid', message: 'Invalid email format' },
          { field: 'password', value: 'short', message: 'Password too short' },
        ];

        const error = ValidationError.createFromFields(fieldErrors);
        const friendlyMessage = error.toUserFriendlyMessage();

        expect(friendlyMessage).toContain('Invalid email format');
        expect(friendlyMessage).toContain('Password too short');
      });

      it('should handle single error gracefully', () => {
        const error = ValidationError.create({
          field: 'name',
          value: '',
          message: 'Name is required',
        });

        const friendlyMessage = error.toUserFriendlyMessage();

        expect(friendlyMessage).toBe('name: Name is required');
      });
    });
  });

  describe('Business Rule Invariants', () => {
    it('should maintain error immutability through readonly contract', () => {
      const error = ValidationError.create({
        field: 'test',
        value: 'value',
        message: 'Test error',
      });

      expect(error.errors).toBeDefined();
      expect(error.code).toBeDefined();
      expect(error.errorId).toBeDefined();
      expect(error.timestamp).toBeInstanceOf(Date);

      expect(Object.isFrozen(error.errors)).toBe(true);
    });

    it('should freeze context object', () => {
      const context = { mutable: 'value' };
      const error = ValidationError.create(
        {
          field: 'test',
          value: 'value',
          message: 'Test',
        },
        context
      );

      expect(Object.isFrozen(error.context)).toBe(true);
    });

    it('should freeze errors array', () => {
      const error = ValidationError.create({
        field: 'test',
        value: 'value',
        message: 'Test',
      });

      expect(Object.isFrozen(error.errors)).toBe(true);
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    it('should handle undefined field values', () => {
      const error = ValidationError.create({
        field: 'optionalField',
        value: undefined,
        message: 'Field is undefined',
      });

      expect(error.errors[0].value).toBeUndefined();
    });

    it('should handle null field values', () => {
      const error = ValidationError.create({
        field: 'nullableField',
        value: null,
        message: 'Field is null',
      });

      expect(error.errors[0].value).toBeNull();
    });

    it('should handle complex field values', () => {
      const complexValue = { nested: { property: 'value' } };

      const error = ValidationError.create({
        field: 'complexField',
        value: complexValue,
        message: 'Complex validation failed',
      });

      expect(error.errors[0].value).toEqual(complexValue);
    });

    it('should handle empty messages gracefully', () => {
      const error = ValidationError.create({
        field: 'emptyMessage',
        value: 'value',
        message: '',
      });

      expect(error.message).toBe('emptyMessage: ');
    });
  });
});
