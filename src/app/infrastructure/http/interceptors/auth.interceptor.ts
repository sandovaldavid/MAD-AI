import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, from } from 'rxjs';
import { TOKEN_STORE_PORT, SECURITY_EVENT_REPOSITORY } from '@di/tokens';
import { TokenSnapshotContract } from '@domain/repositories/session/token-store.contract';
import { SecurityEvent } from '@domain/repositories/system/security-event.repository';
import { API_ENDPOINTS_V1 } from '@infrastructure/config/api-endpoints.config';
import { HttpErrorTransformer } from '@infrastructure/errors/http-error-transformer';
import { InfrastructureError } from '@infrastructure/errors/infrastructure-error';

const AUTH_API_PREFIX = API_ENDPOINTS_V1.AUTH.BASE;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStore = inject(TOKEN_STORE_PORT);
  const securityLogger = inject(SECURITY_EVENT_REPOSITORY);
  const errorTransformer = inject(HttpErrorTransformer);

  const withHeader = (rq: HttpRequest<unknown>, token: string | null) =>
    token ? rq.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : rq;

  // Read tokens from storage
  return from(tokenStore.read()).pipe(
    switchMap((tokenSnapshot: TokenSnapshotContract | null) => {
      // Check if we have a valid access token
      const now = Math.floor(Date.now() / 1000);
      const hasValidToken =
        tokenSnapshot?.accessToken && tokenSnapshot.accessExp && tokenSnapshot.accessExp > now;

      return next(withHeader(req, hasValidToken ? tokenSnapshot?.accessToken || null : null)).pipe(
        catchError((err) => {
          // Transform HTTP errors to InfrastructureError
          let infrastructureError: InfrastructureError;

          if (err instanceof HttpErrorResponse) {
            infrastructureError = errorTransformer.transformWithDefaults(err, req.url, req.method);

            // Log security events for monitoring
            const eventType = securityLogger.classifyHttpError(err);
            const securityEvent: SecurityEvent = {
              type: eventType,
              details: {
                status: err.status,
                url: req.url,
                method: req.method,
                hasValidToken,
                timestamp: new Date().toISOString(),
                infrastructureError: infrastructureError.code,
              },
              timestamp: new Date(),
            };
            securityLogger.logSecurityEvent(securityEvent);

            // Handle 401 errors - clear invalid tokens for non-auth endpoints
            if (err.status === 401 && !req.url.startsWith(AUTH_API_PREFIX)) {
              // Clear invalid tokens - Application layer will handle re-authentication
              tokenStore.clear();
            }
          } else {
            // Non-HTTP errors (network errors, etc.)
            infrastructureError = errorTransformer.transformWithDefaults(err, req.url, req.method);
          }

          // Re-throw the InfrastructureError instead of the original error
          return throwError(() => infrastructureError);
        })
      );
    })
  );
};
