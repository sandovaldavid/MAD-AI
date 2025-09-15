import { TestBed } from '@angular/core/testing';
import { HttpRequest } from '@angular/common/http';
import { HttpAuthService } from './http-auth.service';
import { CLOCK_PORT, AUTH_REPOSITORY, TOKEN_STORE_PORT } from '@di/tokens';
import { InfrastructureError } from '@infrastructure/errors/infrastructure-error';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { TokenStoreRepository } from '@domain/repositories/session/token-store.repository';
import type { TokenSnapshotContract } from '@domain/repositories/session/token-store.contract';
import type { Session } from '@domain/entities/session.entity';

/**
 * Test suite for HttpAuthService - Infrastructure Layer Authentication
 *
 * @description Tests HTTP authentication concerns using concrete Angular HTTP technology.
 * This test suite validates the Infrastructure layer implementation for authentication
 * with mocked dependencies to ensure proper token management and HTTP header handling.
 *
 * @coverage 80% minimum for Infrastructure layer services
 * @layer Infrastructure
 */

describe('HttpAuthService - Infrastructure Tests', () => {
  let service: HttpAuthService;
  let mockAuthRepository: jasmine.SpyObj<AuthRepository>;
  let mockClock: jasmine.SpyObj<ClockPort>;
  let mockTokenStore: jasmine.SpyObj<TokenStoreRepository>;

  // Mock data
  const mockTokens: TokenSnapshotContract = {
    accessToken: 'mock-access-token',
    accessExp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    refreshToken: 'mock-refresh-token',
  };

  const mockExpiredTokens: TokenSnapshotContract = {
    accessToken: 'mock-expired-token',
    accessExp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    refreshToken: 'mock-refresh-token',
  };

  const mockSession = {
    getUser: jasmine.createSpy('getUser').and.returnValue({ id: 'user-123' }),
    accessToken: {
      getValue: jasmine.createSpy('getValue').and.returnValue('new-access-token'),
      expSeconds: Math.floor(Date.now() / 1000) + 7200,
    },
    refreshToken: {
      getValue: jasmine.createSpy('getValue').and.returnValue('new-refresh-token'),
    },
  } as unknown as Session;

  beforeEach(() => {
    // Create mocks
    mockAuthRepository = jasmine.createSpyObj('AuthRepository', [
      'login',
      'refresh',
      'logout',
      'register',
      'confirmEmail',
      'resetPassword',
      'changePassword',
    ]);

    mockClock = jasmine.createSpyObj('ClockPort', ['nowEpochSeconds']);

    mockTokenStore = jasmine.createSpyObj('TokenStoreRepository', ['read', 'write']);

    TestBed.configureTestingModule({
      providers: [
        HttpAuthService,
        { provide: AUTH_REPOSITORY, useValue: mockAuthRepository },
        { provide: CLOCK_PORT, useValue: mockClock },
        { provide: TOKEN_STORE_PORT, useValue: mockTokenStore },
      ],
    });

    service = TestBed.inject(HttpAuthService);
  });

  afterEach(() => {
    // Reset all spies
    Object.values(mockAuthRepository).forEach((spy) => {
      if (typeof spy === 'function' && spy.calls) {
        spy.calls.reset();
      }
    });
    Object.values(mockClock).forEach((spy) => {
      if (typeof spy === 'function' && spy.calls) {
        spy.calls.reset();
      }
    });
    Object.values(mockTokenStore).forEach((spy) => {
      if (typeof spy === 'function' && spy.calls) {
        spy.calls.reset();
      }
    });
  });

  describe('withAuth method', () => {
    it('should add authorization header when auth header is provided', () => {
      // Given
      const request = new HttpRequest('GET', '/api/test');
      const authHeader = { Authorization: 'Bearer test-token' };

      // When
      const result = service.withAuth(request, authHeader);

      // Then
      expect(result.headers.get('Authorization')).toBe('Bearer test-token');
      expect(result.url).toBe('/api/test');
      expect(result.method).toBe('GET');
    });

    it('should not modify request when auth header is null', () => {
      // Given
      const request = new HttpRequest('GET', '/api/test');

      // When
      const result = service.withAuth(request, null);

      // Then
      expect(result.headers.get('Authorization')).toBeNull();
      expect(result.url).toBe('/api/test');
      expect(result.method).toBe('GET');
    });

    it('should not modify request when auth header has no Authorization property', () => {
      // Given
      const request = new HttpRequest('GET', '/api/test');
      const authHeader = {} as any;

      // When
      const result = service.withAuth(request, authHeader);

      // Then
      expect(result.headers.get('Authorization')).toBeNull();
    });

    it('should preserve existing headers while adding authorization', () => {
      // Given
      const request = new HttpRequest('GET', '/api/test');

      // When
      const result = service.withAuth(request, { Authorization: 'Bearer test-token' });

      // Then
      expect(result.headers.get('Authorization')).toBe('Bearer test-token');
      expect(result.url).toBe('/api/test');
    });
  });

  describe('ensureFreshAccess$ method', () => {
    beforeEach(() => {
      mockClock.nowEpochSeconds.and.returnValue(Math.floor(Date.now() / 1000));
    });

    it('should return null header when no tokens are stored', (done) => {
      // Given
      mockTokenStore.read.and.resolveTo(null);

      // When
      service.ensureFreshAccess$().subscribe((header) => {
        // Then
        expect(header).toBeNull();
        expect(mockTokenStore.read).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should return existing header when access token is fresh', (done) => {
      // Given
      const currentTime = Math.floor(Date.now() / 1000);
      const freshTokens = {
        ...mockTokens,
        accessExp: currentTime + 120, // Expires in 2 minutes
      };
      mockTokenStore.read.and.resolveTo(freshTokens);
      mockClock.nowEpochSeconds.and.returnValue(currentTime);

      // When
      service.ensureFreshAccess$().subscribe((header) => {
        // Then
        expect(header).toEqual({ Authorization: 'Bearer mock-access-token' });
        expect(mockTokenStore.read).toHaveBeenCalledTimes(1);
        expect(mockAuthRepository.refresh).not.toHaveBeenCalled();
        done();
      });
    });

    it('should refresh token when access token is close to expiration', (done) => {
      // Given
      const currentTime = Math.floor(Date.now() / 1000);
      const expiringTokens = {
        ...mockTokens,
        accessExp: currentTime + 30, // Expires in 30 seconds
      };
      mockTokenStore.read.and.resolveTo(expiringTokens);
      mockClock.nowEpochSeconds.and.returnValue(currentTime);
      mockAuthRepository.refresh.and.resolveTo(mockSession);
      mockTokenStore.write.and.resolveTo(undefined);

      // When
      service.ensureFreshAccess$().subscribe((header) => {
        // Then
        expect(header).toEqual({ Authorization: 'Bearer new-access-token' });
        expect(mockAuthRepository.refresh).toHaveBeenCalledWith('mock-refresh-token');
        expect(mockTokenStore.write).toHaveBeenCalledWith({
          accessToken: 'new-access-token',
          accessExp: mockSession.accessToken.expSeconds,
          refreshToken: 'new-refresh-token',
        });
        done();
      });
    });

    it('should handle concurrent refresh requests with single refresh call', (done) => {
      // Given
      const currentTime = Math.floor(Date.now() / 1000);
      const expiringTokens = {
        ...mockTokens,
        accessExp: currentTime + 30,
      };
      mockTokenStore.read.and.resolveTo(expiringTokens);
      mockClock.nowEpochSeconds.and.returnValue(currentTime);
      mockAuthRepository.refresh.and.resolveTo(mockSession);
      mockTokenStore.write.and.resolveTo(undefined);

      // When - Multiple concurrent requests
      const observable1 = service.ensureFreshAccess$();
      const observable2 = service.ensureFreshAccess$();

      // Then - Both should get the same result
      observable1.subscribe((header1) => {
        expect(header1).toEqual({ Authorization: 'Bearer new-access-token' });
      });

      observable2.subscribe((header2) => {
        expect(header2).toEqual({ Authorization: 'Bearer new-access-token' });
        expect(mockAuthRepository.refresh).toHaveBeenCalledTimes(1); // Only once
        done();
      });
    });

    it('should handle refresh failure gracefully and return null', (done) => {
      // Given
      const currentTime = Math.floor(Date.now() / 1000);
      const expiringTokens = {
        ...mockTokens,
        accessExp: currentTime + 30,
      };
      mockTokenStore.read.and.resolveTo(expiringTokens);
      mockClock.nowEpochSeconds.and.returnValue(currentTime);
      mockAuthRepository.refresh.and.rejectWith(new Error('Refresh failed'));

      // When
      service.ensureFreshAccess$().subscribe((header) => {
        // Then
        expect(header).toBeNull();
        expect(mockAuthRepository.refresh).toHaveBeenCalledWith('mock-refresh-token');
        done();
      });
    });

    it('should throw InfrastructureError when token store read fails in ensureFreshAccess$', (done) => {
      // Given
      const storageError = new Error('Storage read failed');
      mockTokenStore.read.and.rejectWith(storageError);

      // When
      service.ensureFreshAccess$().subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          // Then
          expect(error).toBeInstanceOf(InfrastructureError);
          expect(error.code).toBe('TOKEN_STORAGE_READ_FAILED');
          expect(error.type).toBe('API');
          expect(error.retryable).toBe(true);
          expect(error.originalError).toBe(storageError);
          done();
        },
      });
    });

    it('should handle missing refresh token gracefully in ensureFreshAccess$ when refresh is needed', (done) => {
      // Given
      const currentTime = Math.floor(Date.now() / 1000);
      const tokensWithoutRefresh = {
        accessToken: 'mock-access-token',
        accessExp: currentTime + 30, // Token expires soon, needs refresh
        refreshToken: null,
      };
      mockTokenStore.read.and.resolveTo(tokensWithoutRefresh);
      mockClock.nowEpochSeconds.and.returnValue(currentTime);

      // When
      service.ensureFreshAccess$().subscribe({
        next: (header) => {
          // Then
          expect(header).toBeNull(); // Should return null when no refresh token available
          expect(mockAuthRepository.refresh).not.toHaveBeenCalled(); // Should not attempt refresh
          done();
        },
        error: (error) => {
          fail('Should not throw error for missing refresh token');
          done();
        },
      });
    });
  });

  describe('forceRefreshOnce$ method', () => {
    beforeEach(() => {
      mockClock.nowEpochSeconds.and.returnValue(Math.floor(Date.now() / 1000));
    });

    it('should successfully refresh tokens and return new header', (done) => {
      // Given
      mockTokenStore.read.and.resolveTo(mockTokens);
      mockAuthRepository.refresh.and.resolveTo(mockSession);
      mockTokenStore.write.and.resolveTo(undefined);

      // When
      service.forceRefreshOnce$().subscribe((header) => {
        // Then
        expect(header).toEqual({ Authorization: 'Bearer new-access-token' });
        expect(mockAuthRepository.refresh).toHaveBeenCalledWith('mock-refresh-token');
        expect(mockTokenStore.write).toHaveBeenCalledWith({
          accessToken: 'new-access-token',
          accessExp: mockSession.accessToken.expSeconds,
          refreshToken: 'new-refresh-token',
        });
        done();
      });
    });

    it('should handle missing refresh token gracefully in forceRefreshOnce$', (done) => {
      // Given
      const tokensWithoutRefresh = {
        accessToken: 'mock-access-token',
        accessExp: Math.floor(Date.now() / 1000) + 3600,
        refreshToken: null,
      };
      mockTokenStore.read.and.resolveTo(tokensWithoutRefresh);

      // When
      service.forceRefreshOnce$().subscribe({
        next: (header) => {
          // Then
          expect(header).toBeNull(); // Should return null when no refresh token
          expect(mockAuthRepository.refresh).not.toHaveBeenCalled(); // Should not attempt refresh
          done();
        },
        error: (error) => {
          fail('Should not throw error for missing refresh token');
          done();
        },
      });
    });

    it('should handle refresh failure gracefully and return null', (done) => {
      // Given
      mockTokenStore.read.and.resolveTo(mockTokens);
      mockAuthRepository.refresh.and.rejectWith(new Error('Refresh failed'));

      // When
      service.forceRefreshOnce$().subscribe((header) => {
        // Then
        expect(header).toBeNull();
        expect(mockAuthRepository.refresh).toHaveBeenCalledWith('mock-refresh-token');
        done();
      });
    });

    it('should handle token store read failure gracefully in forceRefreshOnce$', (done) => {
      // Given
      const storageError = new Error('Storage read failed');
      mockTokenStore.read.and.rejectWith(storageError);

      // When
      service.forceRefreshOnce$().subscribe({
        next: (header) => {
          // Then
          expect(header).toBeNull(); // Should return null when storage fails
          expect(mockAuthRepository.refresh).not.toHaveBeenCalled(); // Should not attempt refresh
          done();
        },
        error: (error) => {
          fail('Should not throw error for storage read failure');
          done();
        },
      });
    });
  });

  describe('Token transformation methods', () => {
    it('should transform Session to TokenSnapshotContract correctly', () => {
      // Given
      const session = {
        accessToken: {
          getValue: jasmine.createSpy('getValue').and.returnValue('access-token-value'),
          expSeconds: 1234567890,
        },
        refreshToken: {
          getValue: jasmine.createSpy('getValue').and.returnValue('refresh-token-value'),
        },
      } as unknown as Session;

      // When
      const result = (service as any).sessionToTokenSnapshot(session);

      // Then
      expect(result).toEqual({
        accessToken: 'access-token-value',
        accessExp: 1234567890,
        refreshToken: 'refresh-token-value',
      });
      expect(session.accessToken.getValue).toHaveBeenCalledTimes(1);
      expect(session.refreshToken.getValue).toHaveBeenCalledTimes(1);
    });

    it('should build authorization header correctly', () => {
      // When
      const result = (service as any).buildHeader(mockTokens);

      // Then
      expect(result).toEqual({ Authorization: 'Bearer mock-access-token' });
    });

    it('should return null when building header with no access token', () => {
      // Given
      const tokensWithoutAccess = {
        accessToken: null,
        accessExp: Math.floor(Date.now() / 1000) + 3600,
        refreshToken: 'mock-refresh-token',
      };

      // When
      const result = (service as any).buildHeader(tokensWithoutAccess);

      // Then
      expect(result).toBeNull();
    });

    it('should return null when building header with null tokens', () => {
      // When
      const result = (service as any).buildHeader(null);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle token store write failure during refresh gracefully', (done) => {
      // Given
      const currentTime = Math.floor(Date.now() / 1000);
      const expiringTokens = {
        ...mockTokens,
        accessExp: currentTime + 30,
      };
      mockTokenStore.read.and.resolveTo(expiringTokens);
      mockClock.nowEpochSeconds.and.returnValue(currentTime);
      mockAuthRepository.refresh.and.resolveTo(mockSession);
      mockTokenStore.write.and.rejectWith(new Error('Storage write failed'));

      // When
      service.ensureFreshAccess$().subscribe((header) => {
        // Then - Should return null when write fails during refresh
        expect(header).toBeNull();
        expect(mockAuthRepository.refresh).toHaveBeenCalledWith('mock-refresh-token');
        expect(mockTokenStore.write).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should not trigger refresh when accessExp is undefined', (done) => {
      // Given
      const tokensWithoutExp = {
        accessToken: 'mock-access-token',
        accessExp: undefined,
        refreshToken: 'mock-refresh-token',
      };
      mockTokenStore.read.and.resolveTo(tokensWithoutExp);
      mockClock.nowEpochSeconds.and.returnValue(Math.floor(Date.now() / 1000));

      // When
      service.ensureFreshAccess$().subscribe((header) => {
        // Then - Should return header without refresh since accessExp is undefined
        expect(header).toEqual({ Authorization: 'Bearer mock-access-token' });
        expect(mockAuthRepository.refresh).not.toHaveBeenCalled(); // Should not attempt refresh
        done();
      });
    });

    it('should handle race conditions in concurrent refresh scenarios', (done) => {
      // Given
      const currentTime = Math.floor(Date.now() / 1000);
      const expiringTokens = {
        ...mockTokens,
        accessExp: currentTime + 30,
      };
      mockTokenStore.read.and.resolveTo(expiringTokens);
      mockClock.nowEpochSeconds.and.returnValue(currentTime);

      // Simulate slow first refresh
      let refreshCallCount = 0;
      mockAuthRepository.refresh.and.callFake(() => {
        refreshCallCount++;
        if (refreshCallCount === 1) {
          return new Promise((resolve) => {
            setTimeout(() => resolve(mockSession), 100);
          });
        }
        return Promise.resolve(mockSession);
      });

      mockTokenStore.write.and.resolveTo(undefined);

      // When - Multiple concurrent requests
      const observable1 = service.ensureFreshAccess$();
      const observable2 = service.ensureFreshAccess$();
      const observable3 = service.ensureFreshAccess$();

      // Then - All should get the same result from single refresh
      Promise.all([observable1.toPromise(), observable2.toPromise(), observable3.toPromise()]).then(
        (results) => {
          results.forEach((header) => {
            expect(header).toEqual({ Authorization: 'Bearer new-access-token' });
          });
          expect(mockAuthRepository.refresh).toHaveBeenCalledTimes(1);
          done();
        }
      );
    });
  });

  describe('Integration with Angular dependency injection', () => {
    it('should be properly injectable with TestBed', () => {
      // Given & When & Then
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(HttpAuthService);
    });

    it('should use injected dependencies correctly', () => {
      // Given
      mockTokenStore.read.and.resolveTo(mockTokens);

      // When
      (service as any).getLocalTokens();

      // Then
      expect(mockTokenStore.read).toHaveBeenCalledTimes(1);
    });
  });
});
