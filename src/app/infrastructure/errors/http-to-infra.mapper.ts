import { HttpErrorResponse } from '@angular/common/http';
import { HttpErrorCode } from './http-error-code.enum';
import { AuthErrorCode } from './auth-error-code.enum';

export type InfraError =
    | { kind: 'HTTP'; code: HttpErrorCode; detail?: any }
    | { kind: 'AUTH'; code: AuthErrorCode; detail?: any };

export function mapHttpErrorToInfra(err: HttpErrorResponse): InfraError {
    if (err.status === 0) return { kind: 'HTTP', code: HttpErrorCode.NETWORK_ERROR };
    if (err.status === 401) {
        const d = err.error || {};
        if (d?.detail === 'token_expired')
            return { kind: 'AUTH', code: AuthErrorCode.ACCESS_TOKEN_EXPIRED, detail: d };
        return { kind: 'HTTP', code: HttpErrorCode.UNAUTHORIZED, detail: d };
    }
    if (err.status === 403)
        return { kind: 'HTTP', code: HttpErrorCode.FORBIDDEN, detail: err.error };
    if (err.status === 404)
        return { kind: 'HTTP', code: HttpErrorCode.NOT_FOUND, detail: err.error };
    if (err.status === 409)
        return { kind: 'HTTP', code: HttpErrorCode.CONFLICT, detail: err.error };
    if (err.status === 422)
        return { kind: 'HTTP', code: HttpErrorCode.UNPROCESSABLE_ENTITY, detail: err.error };
    if (err.status >= 500)
        return { kind: 'HTTP', code: HttpErrorCode.INTERNAL_SERVER_ERROR, detail: err.error };
    return { kind: 'HTTP', code: HttpErrorCode.BAD_REQUEST, detail: err.error };
}
