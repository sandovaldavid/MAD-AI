import { TestBed } from '@angular/core/testing';
import { LocalStorageSessionStore } from './local-storage-session-store.service';
import { TOKEN_STORE_PORT, AUTH_USER_STORE_PORT } from '@di/tokens';
import type { TokenStoreRepository } from '@domain/repositories/session/token-store.repository';
import type { AuthUserStoreRepository } from '@domain/repositories/session/auth-user-store.repository';
import type { SessionSnapshotContract } from '@/app/domain/repositories/session/session-store.contract';
import type { TokenSnapshotContract } from '@domain/repositories/session/token-store.contract';
import type { AuthUserSnapshotContract } from '@domain/repositories/session/auth-user-store.contract';

describe('LocalStorageSessionStore - Infrastructure Tests', () => {
  let service: LocalStorageSessionStore;
  let mockTokenStore: jasmine.SpyObj<TokenStoreRepository>;
  let mockUserStore: jasmine.SpyObj<AuthUserStoreRepository>;

  const mockTokenData: TokenSnapshotContract = {
    accessToken: 'access-token-123',
    accessExp: 1692180600,
    refreshToken: 'refresh-token-456',
  };

  const mockUserData: AuthUserSnapshotContract = {
    id: 123,
    username: 'john_doe',
    email: 'test@example.com',
    roleId: 456,
    roleName: 'user',
    accessLevel: 50,
    isEmailConfirmed: true,
  };

  const mockSessionData: SessionSnapshotContract = {
    user: mockUserData,
    tokens: mockTokenData,
    version: 1,
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    // Create spies for dependencies
    mockTokenStore = jasmine.createSpyObj('TokenStoreRepository', ['read', 'write', 'clear']);
    mockUserStore = jasmine.createSpyObj('AuthUserStoreRepository', ['read', 'write', 'clear']);

    TestBed.configureTestingModule({
      providers: [
        LocalStorageSessionStore,
        { provide: TOKEN_STORE_PORT, useValue: mockTokenStore },
        { provide: AUTH_USER_STORE_PORT, useValue: mockUserStore },
      ],
    });

    service = TestBed.inject(LocalStorageSessionStore);
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should inject token store dependency', () => {
      expect(mockTokenStore).toBeTruthy();
    });

    it('should inject user store dependency', () => {
      expect(mockUserStore).toBeTruthy();
    });
  });

  describe('readAll', () => {
    it('should return complete session when both stores have data', async () => {
      // Given
      mockTokenStore.read.and.returnValue(Promise.resolve(mockTokenData));
      mockUserStore.read.and.returnValue(Promise.resolve(mockUserData));

      // When
      const result = await service.readAll();

      // Then
      expect(result).toBeTruthy();
      expect(result!.user).toEqual(mockUserData);
      expect(result!.tokens).toEqual(mockTokenData);
      expect(result!.version).toBe(1);
      expect(result!.updatedAt).toBeInstanceOf(Number);
      expect(mockTokenStore.read).toHaveBeenCalled();
      expect(mockUserStore.read).toHaveBeenCalled();
    });

    it('should return null when token store has no data', async () => {
      // Given
      mockTokenStore.read.and.returnValue(Promise.resolve(null));
      mockUserStore.read.and.returnValue(Promise.resolve(mockUserData));

      // When
      const result = await service.readAll();

      // Then
      expect(result).toBeNull();
      expect(mockTokenStore.read).toHaveBeenCalled();
      expect(mockUserStore.read).toHaveBeenCalled();
    });

    it('should return null when user store has no data', async () => {
      // Given
      mockTokenStore.read.and.returnValue(Promise.resolve(mockTokenData));
      mockUserStore.read.and.returnValue(Promise.resolve(null));

      // When
      const result = await service.readAll();

      // Then
      expect(result).toBeNull();
      expect(mockTokenStore.read).toHaveBeenCalled();
      expect(mockUserStore.read).toHaveBeenCalled();
    });

    it('should return null when both stores have no data', async () => {
      // Given
      mockTokenStore.read.and.returnValue(Promise.resolve(null));
      mockUserStore.read.and.returnValue(Promise.resolve(null));

      // When
      const result = await service.readAll();

      // Then
      expect(result).toBeNull();
      expect(mockTokenStore.read).toHaveBeenCalled();
      expect(mockUserStore.read).toHaveBeenCalled();
    });

    it('should handle token store read errors gracefully', async () => {
      // Given
      mockTokenStore.read.and.returnValue(Promise.reject(new Error('Token store error')));
      mockUserStore.read.and.returnValue(Promise.resolve(mockUserData));
      spyOn(console, 'error');

      // When
      const result = await service.readAll();

      // Then
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to read session data:',
        jasmine.any(Error)
      );
    });

    it('should handle user store read errors gracefully', async () => {
      // Given
      mockTokenStore.read.and.returnValue(Promise.resolve(mockTokenData));
      mockUserStore.read.and.returnValue(Promise.reject(new Error('User store error')));
      spyOn(console, 'error');

      // When
      const result = await service.readAll();

      // Then
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to read session data:',
        jasmine.any(Error)
      );
    });
  });

  describe('writeAll', () => {
    it('should store session data atomically', async () => {
      // Given
      mockTokenStore.write.and.returnValue(Promise.resolve());
      mockUserStore.write.and.returnValue(Promise.resolve());

      // When
      await service.writeAll(mockSessionData);

      // Then
      expect(mockTokenStore.write).toHaveBeenCalledWith(mockTokenData);
      expect(mockUserStore.write).toHaveBeenCalledWith(mockUserData);
    });

    it('should clear all data when null is passed', async () => {
      // Given
      mockTokenStore.clear.and.returnValue(Promise.resolve());
      mockUserStore.clear.and.returnValue(Promise.resolve());

      // When
      await service.writeAll(null);

      // Then
      expect(mockTokenStore.clear).toHaveBeenCalled();
      expect(mockUserStore.clear).toHaveBeenCalled();
    });

    it('should throw error when session data is missing user', async () => {
      // Given
      const invalidSession = {
        ...mockSessionData,
        user: null as any,
      };
      spyOn(console, 'error');

      // When & Then
      await expectAsync(service.writeAll(invalidSession)).toBeRejectedWithError(
        'Invalid session snapshot: missing required user or tokens data'
      );

      expect(console.error).toHaveBeenCalledWith(
        'Failed to write session data:',
        jasmine.any(Error)
      );
    });

    it('should throw error when session data is missing tokens', async () => {
      // Given
      const invalidSession = {
        ...mockSessionData,
        tokens: null as any,
      };
      spyOn(console, 'error');

      // When & Then
      await expectAsync(service.writeAll(invalidSession)).toBeRejectedWithError(
        'Invalid session snapshot: missing required user or tokens data'
      );

      expect(console.error).toHaveBeenCalledWith(
        'Failed to write session data:',
        jasmine.any(Error)
      );
    });

    it('should handle token store write errors', async () => {
      // Given
      mockTokenStore.write.and.returnValue(Promise.reject(new Error('Token store write error')));
      mockUserStore.write.and.returnValue(Promise.resolve());
      spyOn(console, 'error');

      // When & Then
      await expectAsync(service.writeAll(mockSessionData)).toBeRejectedWithError(
        'Token store write error'
      );

      expect(console.error).toHaveBeenCalledWith(
        'Failed to write session data:',
        jasmine.any(Error)
      );
    });

    it('should handle user store write errors', async () => {
      // Given
      mockTokenStore.write.and.returnValue(Promise.resolve());
      mockUserStore.write.and.returnValue(Promise.reject(new Error('User store write error')));
      spyOn(console, 'error');

      // When & Then
      await expectAsync(service.writeAll(mockSessionData)).toBeRejectedWithError(
        'User store write error'
      );

      expect(console.error).toHaveBeenCalledWith(
        'Failed to write session data:',
        jasmine.any(Error)
      );
    });
  });

  describe('clearAll', () => {
    it('should clear both stores atomically', async () => {
      // Given
      mockTokenStore.clear.and.returnValue(Promise.resolve());
      mockUserStore.clear.and.returnValue(Promise.resolve());

      // When
      await service.clearAll();

      // Then
      expect(mockTokenStore.clear).toHaveBeenCalled();
      expect(mockUserStore.clear).toHaveBeenCalled();
    });

    it('should handle token store clear errors', async () => {
      // Given
      mockTokenStore.clear.and.returnValue(Promise.reject(new Error('Token clear error')));
      mockUserStore.clear.and.returnValue(Promise.resolve());
      spyOn(console, 'error');

      // When & Then
      await expectAsync(service.clearAll()).toBeRejectedWithError('Token clear error');

      expect(console.error).toHaveBeenCalledWith(
        'Failed to clear session data:',
        jasmine.any(Error)
      );
    });

    it('should handle user store clear errors', async () => {
      // Given
      mockTokenStore.clear.and.returnValue(Promise.resolve());
      mockUserStore.clear.and.returnValue(Promise.reject(new Error('User clear error')));
      spyOn(console, 'error');

      // When & Then
      await expectAsync(service.clearAll()).toBeRejectedWithError('User clear error');

      expect(console.error).toHaveBeenCalledWith(
        'Failed to clear session data:',
        jasmine.any(Error)
      );
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete session lifecycle', async () => {
      // Given - Setup successful operations
      mockTokenStore.read.and.returnValue(Promise.resolve(null));
      mockUserStore.read.and.returnValue(Promise.resolve(null));
      mockTokenStore.write.and.returnValue(Promise.resolve());
      mockUserStore.write.and.returnValue(Promise.resolve());
      mockTokenStore.clear.and.returnValue(Promise.resolve());
      mockUserStore.clear.and.returnValue(Promise.resolve());

      // When & Then - Initial read should return null
      let result = await service.readAll();
      expect(result).toBeNull();

      // When & Then - Write session data
      await service.writeAll(mockSessionData);
      expect(mockTokenStore.write).toHaveBeenCalledWith(mockTokenData);
      expect(mockUserStore.write).toHaveBeenCalledWith(mockUserData);

      // When & Then - Setup stores to return data and read again
      mockTokenStore.read.and.returnValue(Promise.resolve(mockTokenData));
      mockUserStore.read.and.returnValue(Promise.resolve(mockUserData));
      result = await service.readAll();
      expect(result).toBeTruthy();
      expect(result!.user).toEqual(mockUserData);
      expect(result!.tokens).toEqual(mockTokenData);

      // When & Then - Clear all data
      await service.clearAll();
      expect(mockTokenStore.clear).toHaveBeenCalled();
      expect(mockUserStore.clear).toHaveBeenCalled();
    });

    it('should maintain data consistency during partial failures', async () => {
      // Given - Token store succeeds, user store fails
      mockTokenStore.write.and.returnValue(Promise.resolve());
      mockUserStore.write.and.returnValue(Promise.reject(new Error('User store failure')));
      spyOn(console, 'error');

      // When & Then
      await expectAsync(service.writeAll(mockSessionData)).toBeRejectedWithError(
        'User store failure'
      );

      // Verify token store was called (atomic operation attempted)
      expect(mockTokenStore.write).toHaveBeenCalledWith(mockTokenData);
      expect(mockUserStore.write).toHaveBeenCalledWith(mockUserData);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to write session data:',
        jasmine.any(Error)
      );
    });

    it('should handle concurrent operations gracefully', async () => {
      // Given
      mockTokenStore.read.and.returnValue(Promise.resolve(mockTokenData));
      mockUserStore.read.and.returnValue(Promise.resolve(mockUserData));
      mockTokenStore.write.and.returnValue(Promise.resolve());
      mockUserStore.write.and.returnValue(Promise.resolve());

      // When - Simulate concurrent read and write operations
      const readPromise = service.readAll();
      const writePromise = service.writeAll(mockSessionData);

      // Then - Both operations should complete successfully
      const [readResult] = await Promise.all([readPromise, writePromise]);

      expect(readResult).toBeTruthy();
      expect(readResult!.user).toEqual(mockUserData);
      expect(readResult!.tokens).toEqual(mockTokenData);
      expect(mockTokenStore.write).toHaveBeenCalledWith(mockTokenData);
      expect(mockUserStore.write).toHaveBeenCalledWith(mockUserData);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined session data', async () => {
      // Given
      mockTokenStore.clear.and.returnValue(Promise.resolve());
      mockUserStore.clear.and.returnValue(Promise.resolve());

      // When
      await service.writeAll(undefined as any);

      // Then
      expect(mockTokenStore.clear).toHaveBeenCalled();
      expect(mockUserStore.clear).toHaveBeenCalled();
    });

    it('should handle session data with extra properties', async () => {
      // Given
      const sessionWithExtra = {
        ...mockSessionData,
        extraProperty: 'should be ignored',
      } as any;
      mockTokenStore.write.and.returnValue(Promise.resolve());
      mockUserStore.write.and.returnValue(Promise.resolve());

      // When
      await service.writeAll(sessionWithExtra);

      // Then - Should only pass the expected data to stores
      expect(mockTokenStore.write).toHaveBeenCalledWith(mockTokenData);
      expect(mockUserStore.write).toHaveBeenCalledWith(mockUserData);
    });

    it('should handle stores returning different data types', async () => {
      // Given - Stores return unexpected data
      mockTokenStore.read.and.returnValue(Promise.resolve({} as any));
      mockUserStore.read.and.returnValue(Promise.resolve({} as any));

      // When
      const result = await service.readAll();

      // Then - Should still construct session with whatever data is available
      expect(result).toBeTruthy();
      expect(result!.user).toEqual(jasmine.any(Object));
      expect(result!.tokens).toEqual(jasmine.any(Object));
      expect(result!.version).toBe(1);
    });
  });
});
