// infrastructure/http/error.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { mapHttpErrorToInfra } from '../errors/http-to-infra.mapper';

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err) => {
      if (err instanceof HttpErrorResponse) {
        return throwError(() => mapHttpErrorToInfra(err));
      }
      return throwError(() => err);
    })
  );
