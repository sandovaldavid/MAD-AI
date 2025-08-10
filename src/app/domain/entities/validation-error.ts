import { ValidationErrorCode } from '../enums/validation-error-code.enum';

import type { FieldError } from '../models/field-error.model';

export class ValidationError extends Error {
    public readonly errors: FieldError[];
    public readonly code: ValidationErrorCode;

    constructor(
        errors: FieldError[] | FieldError | string,
        code: ValidationErrorCode = ValidationErrorCode.VALIDATION_ERROR
    ) {
        let errorList: FieldError[];
        if (typeof errors === 'string') {
            errorList = [{ field: '', value: undefined, message: errors, code }];
        } else if (Array.isArray(errors)) {
            errorList = errors;
        } else {
            errorList = [errors];
        }
        super(errorList.map((e) => `${e.field}: ${e.message} (value: ${e.value})`).join('; '));
        this.name = 'ValidationError';
        this.errors = errorList;
        this.code = code;
        Error.captureStackTrace?.(this, ValidationError);
    }

    toJSON() {
        return {
            name: this.name,
            code: this.code,
            errors: this.errors,
            message: this.message,
        };
    }
}
