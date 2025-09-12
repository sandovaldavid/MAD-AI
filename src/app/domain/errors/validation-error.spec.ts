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

      it('should handle field errors with undefined codes', () => {
        const fieldErrors: FieldError[] = [
          {
            field: 'testField',
            value: 'testValue',
            message: 'Test error without code',
            // No code property - should be undefined
          },
        ];

        const error = ValidationError.createFromFields(fieldErrors);

        expect(error.code).toBe(ValidationErrorCode.VALIDATION_ERROR); // Default fallback
        expect(error.errors[0].code).toBeUndefined();
      });

      it('should handle primary code selection with generic validation error', () => {
        const fieldErrors: FieldError[] = [
          {
            field: 'email',
            value: 'invalid',
            message: 'Invalid email',
            code: ValidationErrorCode.VALIDATION_ERROR, // Generic code
          },
        ];

        const error = ValidationError.createFromFields(
          fieldErrors,
          ValidationErrorCode.EMAIL_INVALID // More specific code
        );

        expect(error.code).toBe(ValidationErrorCode.EMAIL_INVALID);
      });

      it('should use first error code when no primary code and first error has undefined code', () => {
        const fieldErrors: FieldError[] = [
          {
            field: 'field1',
            value: 'value1',
            message: 'Error without code',
            // No code - undefined
          },
          {
            field: 'field2',
            value: 'value2',
            message: 'Error with code',
            code: ValidationErrorCode.EMAIL_INVALID,
          },
        ];

        const error = ValidationError.createFromFields(fieldErrors);

        expect(error.code).toBe(ValidationErrorCode.VALIDATION_ERROR); // Fallback when first code is undefined
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

      it('should handle various value types in unique constraints', () => {
        const numericValue = 12345;
        const error = ValidationError.forUniqueConstraint('userId', numericValue, 'User');

        expect(error.errors[0].value).toBe(numericValue);
        expect(error.message).toBe("userId: userId '12345' already exists");
        expect(error.context).toEqual({
          entityType: 'User',
          conflictingValue: numericValue,
        });
      });

      it('should handle null values in unique constraints', () => {
        const nullValue = null;
        const error = ValidationError.forUniqueConstraint('optionalField', nullValue);

        expect(error.errors[0].value).toBe(nullValue);
        expect(error.message).toBe("optionalField: optionalField 'null' already exists");
        expect(error.context).toEqual({ conflictingValue: nullValue });
      });

      it('should create proper field error structure for unique constraints', () => {
        const error = ValidationError.forUniqueConstraint('email', 'test@example.com', 'User');

        expect(error.errors[0]).toEqual({
          field: 'email',
          value: 'test@example.com',
          message: "email 'test@example.com' already exists",
          code: ValidationErrorCode.FIELD_NOT_UNIQUE,
          severity: 'error',
          context: {
            entityType: 'User',
            conflictingValue: 'test@example.com',
          },
        });
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

      it('should return true for EMAIL_INVALID format errors', () => {
        const error = ValidationError.create({
          field: 'email',
          value: 'invalid-email',
          message: 'Invalid email format',
          code: ValidationErrorCode.EMAIL_INVALID,
        });

        expect(error.hasFormatErrors()).toBe(true);
      });

      it('should handle mixed error types with some format errors', () => {
        const fieldErrors: FieldError[] = [
          {
            field: 'name',
            value: '',
            message: 'Name required',
            code: ValidationErrorCode.REQUIRED_FIELD_MISSING, // Not a format error
          },
          {
            field: 'email',
            value: 'invalid',
            message: 'Invalid email',
            code: ValidationErrorCode.EMAIL_INVALID, // Format error
          },
        ];

        const error = ValidationError.createFromFields(fieldErrors);

        expect(error.hasFormatErrors()).toBe(true);
      });

      it('should return false when all errors are non-format errors', () => {
        const fieldErrors: FieldError[] = [
          {
            field: 'name',
            value: '',
            message: 'Name required',
            code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
          },
          {
            field: 'password',
            value: 'short',
            message: 'Password too short',
            code: ValidationErrorCode.MIN_LENGTH_NOT_REACHED,
          },
        ];

        const error = ValidationError.createFromFields(fieldErrors);

        expect(error.hasFormatErrors()).toBe(false);
      });

      it('should handle errors with undefined codes gracefully', () => {
        const fieldErrors: FieldError[] = [
          {
            field: 'field1',
            value: 'value1',
            message: 'Error without code',
            // No code property - undefined
          },
          {
            field: 'field2',
            value: 'value2',
            message: 'Another error without code',
            // No code property - undefined
          },
        ];

        const error = ValidationError.createFromFields(fieldErrors);

        expect(error.hasFormatErrors()).toBe(false); // Undefined codes are not format errors
      });

      it('should return false for errors with explicitly undefined codes', () => {
        const error = ValidationError.create({
          field: 'test',
          value: 'value',
          message: 'Error with undefined code',
          code: undefined,
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

      it('should default to info when no severity specified', () => {
        const error = ValidationError.create({
          field: 'test',
          value: 'value',
          message: 'Message',
        });

        expect(error.getMaxSeverity()).toBe('info');
      });

      it('should return error for mixed severities with error present', () => {
        const fieldErrors: FieldError[] = [
          { field: 'f1', value: 'v1', message: 'm1', severity: 'info' },
          { field: 'f2', value: 'v2', message: 'm2', severity: 'warning' },
          { field: 'f3', value: 'v3', message: 'm3', severity: 'error' },
        ];

        const error = ValidationError.createFromFields(fieldErrors);

        expect(error.getMaxSeverity()).toBe('error');
      });

      it('should return info for all info severity errors', () => {
        const fieldErrors: FieldError[] = [
          { field: 'f1', value: 'v1', message: 'm1', severity: 'info' },
          { field: 'f2', value: 'v2', message: 'm2', severity: 'info' },
        ];

        const error = ValidationError.createFromFields(fieldErrors);

        expect(error.getMaxSeverity()).toBe('info');
      });

      it('should handle undefined severity as default info', () => {
        const fieldErrors: FieldError[] = [
          { field: 'f1', value: 'v1', message: 'm1' }, // No severity - undefined
          { field: 'f2', value: 'v2', message: 'm2', severity: 'info' },
        ];

        const error = ValidationError.createFromFields(fieldErrors);

        expect(error.getMaxSeverity()).toBe('info');
      });

      it('should prioritize error over warning and info', () => {
        const fieldErrors: FieldError[] = [
          { field: 'f1', value: 'v1', message: 'm1', severity: 'warning' },
          { field: 'f2', value: 'v2', message: 'm2' }, // undefined severity
          { field: 'f3', value: 'v3', message: 'm3', severity: 'error' },
          { field: 'f4', value: 'v4', message: 'm4', severity: 'info' },
        ];

        const error = ValidationError.createFromFields(fieldErrors);

        expect(error.getMaxSeverity()).toBe('error');
      });

      it('should handle edge case with single undefined severity', () => {
        const error = ValidationError.create({
          field: 'test',
          value: 'value',
          message: 'Message without severity',
          // severity is undefined
        });

        expect(error.getMaxSeverity()).toBe('info'); // Default fallback
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

      it('should handle field errors with undefined codes using fallback', () => {
        const fieldErrors: FieldError[] = [
          {
            field: 'field1',
            value: 'value1',
            message: 'Error without code',
            // No code property - undefined
          },
          {
            field: 'field2',
            value: 'value2',
            message: 'Another error without code',
            // No code property - undefined
          },
          {
            field: 'field3',
            value: 'value3',
            message: 'Error with code',
            code: ValidationErrorCode.EMAIL_INVALID,
          },
        ];

        const error = ValidationError.createFromFields(fieldErrors);
        const grouped = error.groupByErrorCode();

        // Undefined codes should be grouped under VALIDATION_ERROR fallback
        expect(grouped.get(ValidationErrorCode.VALIDATION_ERROR)?.length).toBe(2);
        expect(grouped.get(ValidationErrorCode.EMAIL_INVALID)?.length).toBe(1);
      });

      it('should handle mixed defined and undefined error codes', () => {
        const fieldErrors: FieldError[] = [
          {
            field: 'email',
            value: 'invalid',
            message: 'Invalid email',
            code: ValidationErrorCode.EMAIL_INVALID,
          },
          {
            field: 'undefinedField',
            value: 'value',
            message: 'Error without code',
            // No code - will be undefined
          },
        ];

        const error = ValidationError.createFromFields(fieldErrors);
        const grouped = error.groupByErrorCode();

        expect(grouped.size).toBe(2); // Two different groups
        expect(grouped.get(ValidationErrorCode.EMAIL_INVALID)?.length).toBe(1);
        expect(grouped.get(ValidationErrorCode.VALIDATION_ERROR)?.length).toBe(1);
      });

      it('should handle empty error list gracefully', () => {
        const fieldErrors: FieldError[] = [
          {
            field: 'single',
            value: 'value',
            message: 'Single error',
            code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
          },
        ];

        const error = ValidationError.createFromFields(fieldErrors);
        const grouped = error.groupByErrorCode();

        expect(grouped.size).toBe(1);
        expect(grouped.get(ValidationErrorCode.REQUIRED_FIELD_MISSING)?.length).toBe(1);
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

      it('should preserve context from both errors', () => {
        const context1 = { source: 'validation1', field1: 'value1' };
        const context2 = { source: 'validation2', field2: 'value2' };

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

        expect(combined.context).toEqual({
          source: 'validation2', // Second overwrites first for same keys
          field1: 'value1',
          field2: 'value2',
        });
      });

      it('should use more specific error code when first is generic', () => {
        const genericError = ValidationError.create({
          field: 'field1',
          value: 'value1',
          message: 'Generic error',
          code: ValidationErrorCode.VALIDATION_ERROR, // Generic code
        });

        const specificError = ValidationError.create({
          field: 'field2',
          value: 'value2',
          message: 'Specific error',
          code: ValidationErrorCode.EMAIL_INVALID, // Specific code
        });

        const combined = genericError.combine(specificError);

        expect(combined.code).toBe(ValidationErrorCode.EMAIL_INVALID); // More specific code
      });

      it('should preserve first error code when it is not generic', () => {
        const specificError1 = ValidationError.create({
          field: 'email',
          value: 'invalid',
          message: 'Invalid email',
          code: ValidationErrorCode.EMAIL_INVALID, // Specific code
        });

        const specificError2 = ValidationError.create({
          field: 'password',
          value: 'short',
          message: 'Short password',
          code: ValidationErrorCode.MIN_LENGTH_NOT_REACHED, // Different specific code
        });

        const combined = specificError1.combine(specificError2);

        expect(combined.code).toBe(ValidationErrorCode.EMAIL_INVALID); // First code preserved
      });

      it('should handle combining errors with undefined contexts', () => {
        const error1 = ValidationError.create({
          field: 'field1',
          value: 'value1',
          message: 'Error 1',
        }); // No context

        const error2 = ValidationError.create(
          {
            field: 'field2',
            value: 'value2',
            message: 'Error 2',
          },
          { context: 'value' }
        ); // With context

        const combined = error1.combine(error2);

        expect(combined.context).toEqual({ context: 'value' });
      });

      it('should combine errors from multiple fields correctly', () => {
        const multiFieldError1 = ValidationError.createFromFields([
          {
            field: 'email',
            value: 'invalid1',
            message: 'Invalid email 1',
            code: ValidationErrorCode.EMAIL_INVALID,
          },
          {
            field: 'name',
            value: 'short',
            message: 'Name too short',
            code: ValidationErrorCode.MIN_LENGTH_NOT_REACHED,
          },
        ]);

        const multiFieldError2 = ValidationError.createFromFields([
          {
            field: 'email',
            value: 'invalid2',
            message: 'Invalid email 2',
            code: ValidationErrorCode.EMAIL_INVALID,
          },
          {
            field: 'password',
            value: 'weak',
            message: 'Weak password',
            code: ValidationErrorCode.INVALID_FORMAT,
          },
        ]);

        const combined = multiFieldError1.combine(multiFieldError2);

        expect(combined.errors.length).toBe(4);
        expect(combined.hasFieldError('email')).toBe(true);
        expect(combined.hasFieldError('name')).toBe(true);
        expect(combined.hasFieldError('password')).toBe(true);
        expect(combined.getFieldErrors('email').length).toBe(2);
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

      it('should serialize and deserialize maintaining integrity', () => {
        const original = ValidationError.create({
          field: 'email',
          value: 'invalid',
          message: 'Invalid email',
          code: ValidationErrorCode.EMAIL_INVALID,
        });
        const json = original.toJSON();
        const parsed = JSON.parse(JSON.stringify(json));

        expect(parsed.errorId).toBe(original.errorId);
        expect(parsed.code).toBe(original.code);
        expect(parsed.errors.length).toBe(original.errors.length);
        expect(parsed.message).toBe(original.message);
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

      it('should handle errors with empty field names as General', () => {
        const fieldErrors: FieldError[] = [
          { field: '', value: 'value1', message: 'Error with empty field' },
          { field: 'email', value: 'invalid', message: 'Invalid email' },
        ];

        const error = ValidationError.createFromFields(fieldErrors);
        const friendlyMessage = error.toUserFriendlyMessage();

        // Empty field names are treated as 'General' and General errors don't have field prefixes
        expect(friendlyMessage).toContain('Error with empty field');
        expect(friendlyMessage).toContain('email: Invalid email');
      });

      it('should handle errors with undefined/null field names as General', () => {
        const fieldErrors: FieldError[] = [
          { field: undefined as any, value: 'value1', message: 'Error without field' },
          { field: null as any, value: 'value2', message: 'Error with null field' },
          { field: 'name', value: '', message: 'Name required' },
        ];

        const error = ValidationError.createFromFields(fieldErrors);
        const friendlyMessage = error.toUserFriendlyMessage();

        // Undefined/null fields become 'General' and General errors don't have field prefixes
        expect(friendlyMessage).toContain('Error without field, Error with null field');
        expect(friendlyMessage).toContain('name: Name required');
      });

      it('should group multiple errors for same field', () => {
        const fieldErrors: FieldError[] = [
          { field: 'password', value: 'weak', message: 'Password too weak' },
          { field: 'password', value: 'weak', message: 'Password too short' },
          { field: 'email', value: 'invalid', message: 'Invalid email format' },
        ];

        const error = ValidationError.createFromFields(fieldErrors);
        const friendlyMessage = error.toUserFriendlyMessage();

        expect(friendlyMessage).toContain('password: Password too weak, Password too short');
        expect(friendlyMessage).toContain('email: Invalid email format');
      });

      it('should handle mixed General and specific field errors', () => {
        const fieldErrors: FieldError[] = [
          { field: '', value: 'value', message: 'General error 1' },
          { field: 'email', value: 'invalid', message: 'Invalid email' },
          { field: '', value: 'value2', message: 'General error 2' },
        ];

        const error = ValidationError.createFromFields(fieldErrors);
        const friendlyMessage = error.toUserFriendlyMessage();

        expect(friendlyMessage).toContain('General error 1, General error 2'); // No field prefix for General
        expect(friendlyMessage).toContain('email: Invalid email');
      });

      it('should handle only General errors without field prefixes', () => {
        const fieldErrors: FieldError[] = [
          { field: '', value: 'value1', message: 'System validation failed' },
          { field: null as any, value: 'value2', message: 'Business rule violation' },
        ];

        const error = ValidationError.createFromFields(fieldErrors);
        const friendlyMessage = error.toUserFriendlyMessage();

        expect(friendlyMessage).toBe('System validation failed, Business rule violation');
        expect(friendlyMessage).not.toContain('General:'); // No field prefix for General-only messages
      });

      it('should preserve message order within fields', () => {
        const fieldErrors: FieldError[] = [
          { field: 'password', value: 'weak', message: 'First error' },
          { field: 'email', value: 'invalid', message: 'Email error' },
          { field: 'password', value: 'weak', message: 'Second error' },
          { field: 'password', value: 'weak', message: 'Third error' },
        ];

        const error = ValidationError.createFromFields(fieldErrors);
        const friendlyMessage = error.toUserFriendlyMessage();

        expect(friendlyMessage).toContain('password: First error, Second error, Third error');
      });

      it('should handle special characters in messages', () => {
        const fieldErrors: FieldError[] = [
          { field: 'data', value: 'invalid', message: 'Contains invalid characters: @#$%' },
          { field: 'json', value: '{}', message: 'JSON parsing failed: {"error": "syntax"}' },
        ];

        const error = ValidationError.createFromFields(fieldErrors);
        const friendlyMessage = error.toUserFriendlyMessage();

        expect(friendlyMessage).toContain('Contains invalid characters: @#$%');
        expect(friendlyMessage).toContain('JSON parsing failed: {"error": "syntax"}');
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

  describe('Constructor and Message Generation Edge Cases', () => {
    it('should handle field errors with empty field names', () => {
      const fieldErrors: FieldError[] = [
        {
          field: '',
          value: 'value1',
          message: 'Error with empty field',
        },
        {
          field: 'normalField',
          value: 'value2',
          message: 'Normal field error',
        },
      ];

      const error = ValidationError.createFromFields(fieldErrors);

      expect(error.message).toBe('Error with empty field; normalField: Normal field error');
    });

    it('should handle field errors with no field property', () => {
      const fieldErrors: FieldError[] = [
        {
          field: undefined as any, // Simulate missing field
          value: 'value',
          message: 'Error without field',
        },
      ];

      const error = ValidationError.createFromFields(fieldErrors);

      expect(error.message).toBe('Error without field'); // No field prefix when field is falsy
    });

    it('should generate unique error IDs consistently', () => {
      const errors = Array.from({ length: 10 }, () =>
        ValidationError.create({
          field: 'test',
          value: 'value',
          message: 'Test error',
        })
      );

      const errorIds = errors.map((e) => e.errorId);
      const uniqueIds = new Set(errorIds);

      expect(uniqueIds.size).toBe(errorIds.length); // All IDs should be unique
      errorIds.forEach((id) => {
        expect(id).toMatch(/^ve_[a-z0-9]+_[a-z0-9]+$/); // Verify format
      });
    });

    it('should handle Error.captureStackTrace availability', () => {
      // This test verifies that the constructor handles cases where Error.captureStackTrace may not exist
      const originalCaptureStackTrace = Error.captureStackTrace;

      try {
        // Temporarily remove captureStackTrace to test the conditional
        (Error as any).captureStackTrace = undefined;

        const error = ValidationError.create({
          field: 'test',
          value: 'value',
          message: 'Test error',
        });

        expect(error).toBeInstanceOf(ValidationError);
        expect(error.stack).toBeDefined(); // Stack should still be set by Error constructor
      } finally {
        // Restore original function
        Error.captureStackTrace = originalCaptureStackTrace;
      }
    });

    it('should handle context freezing correctly', () => {
      const mutableContext = {
        prop1: 'value1',
        nested: { prop2: 'value2' },
      };

      const error = ValidationError.create(
        {
          field: 'test',
          value: 'value',
          message: 'Test error',
        },
        mutableContext
      );

      expect(Object.isFrozen(error.context)).toBe(true);
      expect(error.context).not.toBe(mutableContext); // Should be a copy
      expect(error.context).toEqual(mutableContext); // But with same values
    });

    it('should handle undefined context gracefully', () => {
      const error = ValidationError.create({
        field: 'test',
        value: 'value',
        message: 'Test error',
      }); // No context provided

      expect(error.context).toBeUndefined();
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

    it('should handle whitespace-only messages', () => {
      const error = ValidationError.create({
        field: 'whitespaceMessage',
        value: 'value',
        message: '   ',
      });

      expect(error.message).toBe('whitespaceMessage:    ');
    });

    it('should handle very long field names and messages', () => {
      const longFieldName = 'a'.repeat(100);
      const longMessage = 'This is a very long error message that goes on and on and on '.repeat(
        10
      );

      const error = ValidationError.create({
        field: longFieldName,
        value: 'value',
        message: longMessage,
      });

      expect(error.errors[0].field).toBe(longFieldName);
      expect(error.errors[0].message).toBe(longMessage);
      expect(error.message).toBe(`${longFieldName}: ${longMessage}`);
    });
  });
});
