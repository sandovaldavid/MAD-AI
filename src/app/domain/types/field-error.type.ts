import { ValidationErrorCode } from '../enums/validation-error-code.enum';

export interface FieldError {
    field: string;
    value: any;
    message: string;
    code?: ValidationErrorCode;
}
