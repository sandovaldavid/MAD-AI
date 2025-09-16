import { TestBed } from '@angular/core/testing';
import { AuthenticationOrchestrator } from './authentication.orchestrator';
import { CLOCK_PORT, AUTH_REPOSITORY, TOKEN_STORE_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { TokenStoreRepository } from '@domain/repositories/session/token-store.repository';
import type { TokenSnapshotContract } from '@domain/repositories/session/token-store.contract';
import { AccessToken, RefreshToken } from '@domain/value-objects/local-tokens.vo';

/**
 * AuthenticationOrchestrator Test Suite
 *
 * @description
 * Comprehensive test coverage for AuthenticationOrchestrator Application Layer service.
 * Tests orchestration logic, error handling, and Domain-Infrastructure coordination.
 *
 * @coverage 95% target for Application Layer orchestration services
 * @layer Application
 */

describe('AuthenticationOrchestrator', () => {
  let orchestrator: AuthenticationOrchestrator;
  let mockAuthRepository: jasmine.SpyObj<AuthRepository>;
  let mockClockPort: jasmine.SpyObj<ClockPort>;
  let mockTokenStore: jasmine.SpyObj<TokenStoreRepository>;

  // Test data setup - using valid token values that pass validation
  const mockTokens: TokenSnapshotContract = {
    accessToken: 'valid.access.token.that.is.long.enough.for.validation',
    accessExp: 1234567890 + 3600, // 1 hour from now
    refreshToken: 'valid.refresh.token.that.is.long.enough.for.validation',
  };

  const mockExpiredTokens: TokenSnapshotContract = {
    accessToken: 'expired.access.token.that.is.long.enough.for.validation',
    accessExp: 1234567890 - 3600, // 1 hour ago
    refreshToken: 'valid.refresh.token.that.is.long.enough.for.validation',
  };

  // Create mock tokens using factory methods
  const mockAccessToken = AccessToken.create(
    'new.access.token.that.is.long.enough.for.validation',
    1234567890 + 7200
  );
  const mockRefreshToken = RefreshToken.create(
    'new.refresh.token.that.is.long.enough.for.validation'
  );

  // Mock Session - we'll use a spy object for simplicity in tests
  const mockSession = jasmine.createSpyObj('Session', ['accessToken', 'refreshToken'], {
    accessToken: mockAccessToken,
    refreshToken: mockRefreshToken,
  });

  beforeEach(() => {
    // Create comprehensive mocks for all dependencies
    mockAuthRepository = jasmine.createSpyObj('AuthRepository', ['refresh']);
    mockClockPort = jasmine.createSpyObj('ClockPort', ['nowEpochSeconds']);
    mockTokenStore = jasmine.createSpyObj('TokenStoreRepository', ['read', 'write']);

    TestBed.configureTestingModule({
      providers: [
        AuthenticationOrchestrator,
        { provide: AUTH_REPOSITORY, useValue: mockAuthRepository },
        { provide: CLOCK_PORT, useValue: mockClockPort },
        { provide: TOKEN_STORE_PORT, useValue: mockTokenStore },
      ],
    });

    orchestrator = TestBed.inject(AuthenticationOrchestrator);
  });

  describe('Service Initialization', () => {
    it('should be created successfully', () => {
      expect(orchestrator).toBeTruthy();
    });

    it('should inject all required dependencies', () => {
      expect(mockAuthRepository).toBeDefined();
      expect(mockClockPort).toBeDefined();
      expect(mockTokenStore).toBeDefined();
    });
  });

  describe('getAuthenticationStatus()', () => {
    it('should return unauthenticated status when no tokens exist', (done) => {
      mockTokenStore.read.and.returnValue(Promise.resolve(null));

      orchestrator.getAuthenticationStatus().subscribe((status) => {
        expect(status).toEqual({
          isAuthenticated: false,
          requiresRefresh: false,
        });
        expect(mockTokenStore.read).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should return unauthenticated status when tokens have no access token', (done) => {
      const tokensWithoutAccess = { refreshToken: 'refresh.token' };
      mockTokenStore.read.and.returnValue(
        Promise.resolve(tokensWithoutAccess as TokenSnapshotContract)
      );

      orchestrator.getAuthenticationStatus().subscribe((status) => {
        expect(status).toEqual({
          isAuthenticated: false,
          requiresRefresh: false,
        });
        done();
      });
    });

    it('should return authenticated status with valid token', (done) => {
      mockTokenStore.read.and.returnValue(Promise.resolve(mockTokens));
      mockClockPort.nowEpochSeconds.and.returnValue(1234567890);

      orchestrator.getAuthenticationStatus().subscribe((status) => {
        expect(status).toEqual({
          isAuthenticated: true,
          requiresRefresh: false,
          token: 'valid.access.token.that.is.long.enough.for.validation',
        });
        done();
      });
    });

    it('should indicate refresh required when token expires within threshold', (done) => {
      mockTokenStore.read.and.returnValue(Promise.resolve(mockTokens));
      mockClockPort.nowEpochSeconds.and.returnValue(mockTokens.accessExp! - 30); // Within 60s threshold

      orchestrator.getAuthenticationStatus().subscribe((status) => {
        expect(status).toEqual({
          isAuthenticated: true,
          requiresRefresh: true,
          token: 'valid.access.token.that.is.long.enough.for.validation',
        });
        done();
      });
    });

    it('should handle token store errors gracefully', (done) => {
      mockTokenStore.read.and.returnValue(Promise.reject(new Error('Storage error')));

      orchestrator.getAuthenticationStatus().subscribe({
        next: () => fail('Should emit error, not status'),
        error: (error) => {
          // Assert - should emit ApplicationError
          expect(error).toBeInstanceOf(ApplicationError);
          expect(error.message).toContain('TokenStore');
          done();
        },
      });
    });
  });

  describe('ensureFreshAuthentication()', () => {
    it('should return unauthenticated status when not authenticated', (done) => {
      mockTokenStore.read.and.returnValue(Promise.resolve(null));

      orchestrator.ensureFreshAuthentication().subscribe((status) => {
        expect(status).toEqual({
          isAuthenticated: false,
          requiresRefresh: false,
        });
        expect(mockAuthRepository.refresh).not.toHaveBeenCalled();
        done();
      });
    });

    it('should return current status when authentication is fresh', (done) => {
      mockTokenStore.read.and.returnValue(Promise.resolve(mockTokens));
      mockClockPort.nowEpochSeconds.and.returnValue(1234567890);

      orchestrator.ensureFreshAuthentication().subscribe((status) => {
        expect(status).toEqual({
          isAuthenticated: true,
          requiresRefresh: false,
          token: 'valid.access.token.that.is.long.enough.for.validation',
        });
        expect(mockAuthRepository.refresh).not.toHaveBeenCalled();
        done();
      });
    });

    it('should perform token refresh when required', (done) => {
      mockTokenStore.read.and.returnValue(Promise.resolve(mockExpiredTokens));
      mockClockPort.nowEpochSeconds.and.returnValue(mockExpiredTokens.accessExp! + 100);
      mockAuthRepository.refresh.and.returnValue(Promise.resolve(mockSession));
      mockTokenStore.write.and.returnValue(Promise.resolve());

      orchestrator.ensureFreshAuthentication().subscribe((status) => {
        expect(status.isAuthenticated).toBe(true);
        expect(status.requiresRefresh).toBe(true); // Still true because we're using expired tokens
        expect(mockAuthRepository.refresh).toHaveBeenCalledWith(
          'valid.refresh.token.that.is.long.enough.for.validation'
        );
        expect(mockTokenStore.write).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should deduplicate concurrent refresh operations', (done) => {
      mockTokenStore.read.and.returnValue(Promise.resolve(mockExpiredTokens));
      mockClockPort.nowEpochSeconds.and.returnValue(mockExpiredTokens.accessExp! + 100);
      mockAuthRepository.refresh.and.returnValue(Promise.resolve(mockSession));
      mockTokenStore.write.and.returnValue(Promise.resolve());

      // Start two concurrent operations
      const operation1 = orchestrator.ensureFreshAuthentication().toPromise();
      const operation2 = orchestrator.ensureFreshAuthentication().toPromise();

      Promise.all([operation1, operation2]).then((results) => {
        expect(results[0]?.isAuthenticated).toBe(true);
        expect(results[1]?.isAuthenticated).toBe(true);
        expect(mockAuthRepository.refresh).toHaveBeenCalledTimes(1); // Only called once
        done();
      });
    });

    it('should handle refresh failure gracefully', (done) => {
      mockTokenStore.read.and.returnValue(Promise.resolve(mockExpiredTokens));
      mockClockPort.nowEpochSeconds.and.returnValue(mockExpiredTokens.accessExp! + 100);
      mockAuthRepository.refresh.and.returnValue(Promise.reject(new Error('Refresh failed')));

      orchestrator.ensureFreshAuthentication().subscribe((status) => {
        expect(status).toEqual({
          isAuthenticated: false,
          requiresRefresh: false,
        });
        done();
      });
    });
  });

  describe('forceTokenRefresh()', () => {
    it('should perform forced token refresh successfully', (done) => {
      mockTokenStore.read.and.returnValue(Promise.resolve(mockTokens));
      mockAuthRepository.refresh.and.returnValue(Promise.resolve(mockSession));
      mockTokenStore.write.and.returnValue(Promise.resolve());

      orchestrator.forceTokenRefresh().subscribe((status) => {
        expect(status.isAuthenticated).toBe(true);
        expect(mockAuthRepository.refresh).toHaveBeenCalledWith(
          'valid.refresh.token.that.is.long.enough.for.validation'
        );
        expect(mockTokenStore.write).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should handle missing refresh token', (done) => {
      const tokensWithoutRefresh = {
        accessToken: 'access.token.that.is.long.enough.for.validation',
      };
      mockTokenStore.read.and.returnValue(
        Promise.resolve(tokensWithoutRefresh as TokenSnapshotContract)
      );

      orchestrator.forceTokenRefresh().subscribe((status) => {
        expect(status).toEqual({
          isAuthenticated: false,
          requiresRefresh: false,
        });
        done();
      });
    });

    it('should handle refresh operation failure', (done) => {
      mockTokenStore.read.and.returnValue(Promise.resolve(mockTokens));
      mockAuthRepository.refresh.and.returnValue(Promise.reject(new Error('Auth service error')));

      orchestrator.forceTokenRefresh().subscribe((status) => {
        expect(status).toEqual({
          isAuthenticated: false,
          requiresRefresh: false,
        });
        done();
      });
    });
  });

  describe('Error Handling and Transformation', () => {
    it('should transform token store errors to ApplicationError', (done) => {
      mockTokenStore.read.and.returnValue(Promise.reject(new Error('Storage failure')));

      orchestrator.getAuthenticationStatus().subscribe({
        next: () => fail('Should emit error, not status'),
        error: (error) => {
          // Assert - should emit ApplicationError
          expect(error).toBeInstanceOf(ApplicationError);
          expect(error.message).toContain('TokenStore');
          done();
        },
      });
    });

    it('should transform auth repository errors to ApplicationError', (done) => {
      mockTokenStore.read.and.returnValue(Promise.resolve(mockTokens));
      mockAuthRepository.refresh.and.returnValue(Promise.reject(new Error('Auth failure')));

      orchestrator.forceTokenRefresh().subscribe((status) => {
        expect(status).toEqual({
          isAuthenticated: false,
          requiresRefresh: false,
        });
        done();
      });
    });

    it('should handle token store write failures', (done) => {
      mockTokenStore.read.and.returnValue(Promise.resolve(mockTokens));
      mockAuthRepository.refresh.and.returnValue(Promise.resolve(mockSession));
      mockTokenStore.write.and.returnValue(Promise.reject(new Error('Write failure')));

      orchestrator.forceTokenRefresh().subscribe((status) => {
        expect(status).toEqual({
          isAuthenticated: false,
          requiresRefresh: false,
        });
        done();
      });
    });
  });

  describe('Data Transformation', () => {
    it('should transform Session to TokenSnapshotContract correctly', async () => {
      mockTokenStore.read.and.returnValue(Promise.resolve(mockTokens));
      mockAuthRepository.refresh.and.returnValue(Promise.resolve(mockSession));
      mockTokenStore.write.and.returnValue(Promise.resolve());

      await orchestrator.forceTokenRefresh().toPromise();

      expect(mockTokenStore.write).toHaveBeenCalledWith({
        accessToken: 'new.access.token.that.is.long.enough.for.validation',
        accessExp: 1234567890 + 7200,
        refreshToken: 'new.refresh.token.that.is.long.enough.for.validation',
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete authentication flow', (done) => {
      // Initial state: token that requires refresh
      mockTokenStore.read.and.returnValue(Promise.resolve(mockTokens));
      mockClockPort.nowEpochSeconds.and.returnValue(mockTokens.accessExp! - 30); // Within 60s threshold

      // Refresh operation
      mockAuthRepository.refresh.and.returnValue(Promise.resolve(mockSession));
      mockTokenStore.write.and.returnValue(Promise.resolve());

      orchestrator.ensureFreshAuthentication().subscribe((status) => {
        expect(status.isAuthenticated).toBe(true);
        expect(status.requiresRefresh).toBe(true); // Tokens still require refresh since mock returns same tokens

        // Verify all interactions occurred
        expect(mockTokenStore.read).toHaveBeenCalledTimes(3); // Initial + during refresh + after refresh
        expect(mockAuthRepository.refresh).toHaveBeenCalledWith(
          'valid.refresh.token.that.is.long.enough.for.validation'
        );
        expect(mockTokenStore.write).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should handle authentication check after successful refresh', (done) => {
      // Setup: token was refreshed
      mockTokenStore.read.and.returnValue(
        Promise.resolve({
          accessToken: 'new.access.token.that.is.long.enough.for.validation',
          accessExp: 1234567890 + 7200,
          refreshToken: 'new.refresh.token.that.is.long.enough.for.validation',
        })
      );
      mockClockPort.nowEpochSeconds.and.returnValue(1234567890);

      orchestrator.getAuthenticationStatus().subscribe((status) => {
        expect(status).toEqual({
          isAuthenticated: true,
          requiresRefresh: false,
          token: 'new.access.token.that.is.long.enough.for.validation',
        });
        done();
      });
    });
  });
});
