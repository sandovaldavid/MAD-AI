import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { LocalStorageAuthUserStore } from './local-storage-auth-user-store.service';
import { AuthUserSnapshotContract } from '@domain/repositories/session/auth-user-store.contract';
import { UserStatus } from '@domain/enums/user-status.enum';

describe('LocalStorageAuthUserStore - Infrastructure Tests', () => {
  let service: LocalStorageAuthUserStore;
  let mockLocalStorage: { [key: string]: string };
  let getItemSpy: jasmine.Spy;
  let setItemSpy: jasmine.Spy;
  let removeItemSpy: jasmine.Spy;

  const STORAGE_KEY = 'mad-ai.auth.user.v1';

  const mockUserData: AuthUserSnapshotContract = {
    id: 123,
    username: 'john_doe',
    email: 'john@example.com',
    roleId: 456,
    roleName: 'Developer',
    accessLevel: 50,
    isEmailConfirmed: true,
    status: UserStatus.ACTIVE,
    updatedAt: '2025-08-16T10:30:00Z',
  };

  beforeEach(() => {
    mockLocalStorage = {};

    // Setup localStorage spies
    getItemSpy = spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      return mockLocalStorage[key] || null;
    });
    setItemSpy = spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });
    removeItemSpy = spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
      delete mockLocalStorage[key];
    });

    TestBed.configureTestingModule({
      providers: [LocalStorageAuthUserStore, { provide: PLATFORM_ID, useValue: 'browser' }],
    });

    service = TestBed.inject(LocalStorageAuthUserStore);
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should detect browser platform correctly', () => {
      // This is tested implicitly through other tests that verify localStorage calls
      expect(service).toBeInstanceOf(LocalStorageAuthUserStore);
    });
  });

  describe('read', () => {
    it('should return null when no data is stored', async () => {
      // Given
      // localStorage is empty by default

      // When
      const result = await service.read();

      // Then
      expect(result).toBeNull();
      expect(getItemSpy).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('should return parsed user data when valid JSON is stored', async () => {
      // Given
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(mockUserData);

      // When
      const result = await service.read();

      // Then
      expect(result).toEqual(mockUserData);
      expect(getItemSpy).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('should return null and log warning when invalid JSON is stored', async () => {
      // Given
      mockLocalStorage[STORAGE_KEY] = 'invalid-json-data';
      spyOn(console, 'warn');

      // When
      const result = await service.read();

      // Then
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        jasmine.stringMatching(/LocalStorageAuthUserStore: Error reading from localStorage/),
        jasmine.any(Error)
      );
    });

    it('should return null when localStorage throws an error', async () => {
      // Given
      getItemSpy.and.throwError('Storage access denied');
      spyOn(console, 'warn');

      // When
      const result = await service.read();

      // Then
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        jasmine.stringMatching(/LocalStorageAuthUserStore: Error reading from localStorage/),
        jasmine.any(Error)
      );
    });

    it('should handle user data with minimal properties', async () => {
      // Given
      const minimalUserData: AuthUserSnapshotContract = {
        id: 789,
        username: 'minimal_user',
        email: 'minimal@example.com',
      };
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(minimalUserData);

      // When
      const result = await service.read();

      // Then
      expect(result).toEqual(minimalUserData);
      expect(result!.id).toBe(789);
      expect(result!.username).toBe('minimal_user');
      expect(result!.email).toBe('minimal@example.com');
    });

    it('should handle user data with all optional properties', async () => {
      // Given
      const completeUserData: AuthUserSnapshotContract = {
        ...mockUserData,
        roleId: 999,
        roleName: 'Admin',
        accessLevel: 100,
        isEmailConfirmed: false,
        status: UserStatus.INACTIVE,
        updatedAt: '2025-09-12T15:45:00Z',
      };
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(completeUserData);

      // When
      const result = await service.read();

      // Then
      expect(result).toEqual(completeUserData);
      expect(result!.roleId).toBe(999);
      expect(result!.roleName).toBe('Admin');
      expect(result!.accessLevel).toBe(100);
      expect(result!.isEmailConfirmed).toBe(false);
      expect(result!.status).toBe(UserStatus.INACTIVE);
    });
  });

  describe('write', () => {
    it('should store user data as JSON string', async () => {
      // Given
      // mockUserData is already defined

      // When
      await service.write(mockUserData);

      // Then
      expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(mockUserData));
    });

    it('should clear storage when null is passed', async () => {
      // Given
      // Setup existing data first
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(mockUserData);

      // When
      await service.write(null);

      // Then
      expect(removeItemSpy).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('should handle localStorage write errors gracefully', async () => {
      // Given
      setItemSpy.and.throwError('Storage quota exceeded');
      spyOn(console, 'warn');

      // When
      await service.write(mockUserData);

      // Then
      expect(console.warn).toHaveBeenCalledWith(
        jasmine.stringMatching(/LocalStorageAuthUserStore: Error writing to localStorage/),
        jasmine.any(Error)
      );
    });

    it('should store user data with special characters', async () => {
      // Given
      const userWithSpecialChars: AuthUserSnapshotContract = {
        id: 456,
        username: 'user_with_émojis_🚀',
        email: 'special+chars@example.com',
        roleName: 'Développeur Senior',
      };

      // When
      await service.write(userWithSpecialChars);

      // Then
      expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(userWithSpecialChars));
    });

    it('should handle large user data objects', async () => {
      // Given
      const largeUserData: AuthUserSnapshotContract = {
        ...mockUserData,
        username: 'a'.repeat(1000), // Very long username
        email: 'very.long.email.address.with.many.characters@example.com',
      };

      // When
      await service.write(largeUserData);

      // Then
      expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(largeUserData));
    });
  });

  describe('clear', () => {
    it('should remove user data from localStorage', async () => {
      // Given
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(mockUserData);

      // When
      await service.clear();

      // Then
      expect(removeItemSpy).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('should handle localStorage remove errors gracefully', async () => {
      // Given
      removeItemSpy.and.throwError('Storage access error');
      spyOn(console, 'warn');

      // When
      await service.clear();

      // Then
      expect(console.warn).toHaveBeenCalledWith(
        jasmine.stringMatching(/LocalStorageAuthUserStore: Error removing from localStorage/),
        jasmine.any(Error)
      );
    });

    it('should work when no data exists to clear', async () => {
      // Given
      // localStorage is empty by default

      // When & Then
      await expectAsync(service.clear()).toBeResolved();
      expect(removeItemSpy).toHaveBeenCalledWith(STORAGE_KEY);
    });
  });

  describe('server-side rendering support', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [LocalStorageAuthUserStore, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      service = TestBed.inject(LocalStorageAuthUserStore);
    });

    it('should return null when reading on server', async () => {
      // When
      const result = await service.read();

      // Then
      expect(result).toBeNull();
      expect(getItemSpy).not.toHaveBeenCalled();
    });

    it('should do nothing when writing on server', async () => {
      // When
      await service.write(mockUserData);

      // Then
      expect(setItemSpy).not.toHaveBeenCalled();
      expect(removeItemSpy).not.toHaveBeenCalled();
    });

    it('should do nothing when clearing on server', async () => {
      // When
      await service.clear();

      // Then
      expect(removeItemSpy).not.toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete user lifecycle', async () => {
      // Given - Start with empty storage
      let result = await service.read();
      expect(result).toBeNull();

      // When - Write user data
      await service.write(mockUserData);

      // Then - Should be able to read it back
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(mockUserData);
      result = await service.read();
      expect(result).toEqual(mockUserData);

      // When - Update user data
      const updatedUserData = { ...mockUserData, accessLevel: 75 };
      await service.write(updatedUserData);

      // Then - Should reflect the update
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(updatedUserData);
      result = await service.read();
      expect(result!.accessLevel).toBe(75);

      // When - Clear user data
      await service.clear();
      delete mockLocalStorage[STORAGE_KEY];

      // Then - Should return null
      result = await service.read();
      expect(result).toBeNull();
    });

    it('should handle rapid successive operations', async () => {
      // Given
      const operations = [
        () => service.write(mockUserData),
        () => service.read(),
        () => service.write({ ...mockUserData, accessLevel: 99 }),
        () => service.clear(),
        () => service.read(),
      ];

      // When - Execute operations rapidly
      const results = await Promise.all(operations.map((op) => op()));

      // Then - All operations should complete without errors
      expect(results).toBeDefined();
      expect(setItemSpy).toHaveBeenCalled();
      expect(removeItemSpy).toHaveBeenCalled();
    });

    it('should maintain data consistency during storage errors', async () => {
      // Given - Setup intermittent storage errors
      let callCount = 0;
      setItemSpy.and.callFake((key: string, value: string) => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Intermittent storage error');
        }
        mockLocalStorage[key] = value;
      });
      spyOn(console, 'warn');

      // When - Attempt multiple writes
      await service.write(mockUserData); // Should succeed
      await service.write({ ...mockUserData, accessLevel: 80 }); // Should fail
      await service.write({ ...mockUserData, accessLevel: 90 }); // Should succeed

      // Then - Errors should be handled gracefully
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(setItemSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle undefined user data', async () => {
      // When
      await service.write(undefined as any);

      // Then - Should treat as null and clear
      expect(removeItemSpy).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('should handle user data with null values', async () => {
      // Given
      const userWithNulls: AuthUserSnapshotContract = {
        id: 123,
        username: 'test_user',
        email: 'test@example.com',
        roleId: null,
        roleName: null,
        accessLevel: null,
        isEmailConfirmed: null,
        status: null,
        updatedAt: null,
      };

      // When
      await service.write(userWithNulls);

      // Then
      expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(userWithNulls));
    });

    it('should handle corrupted JSON data gracefully', async () => {
      // Given
      mockLocalStorage[STORAGE_KEY] = '{"id":123,"username":"test","email":';
      spyOn(console, 'warn');

      // When
      const result = await service.read();

      // Then
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        jasmine.stringMatching(/LocalStorageAuthUserStore: Error reading from localStorage/),
        jasmine.any(SyntaxError)
      );
    });

    it('should handle empty string in localStorage', async () => {
      // Given
      mockLocalStorage[STORAGE_KEY] = '';

      // When
      const result = await service.read();

      // Then
      expect(result).toBeNull();
    });

    it('should handle whitespace-only string in localStorage', async () => {
      // Given
      mockLocalStorage[STORAGE_KEY] = '   \n\t   ';
      spyOn(console, 'warn');

      // When
      const result = await service.read();

      // Then
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle circular reference objects gracefully', async () => {
      // Given
      const circularUser: any = {
        id: 123,
        username: 'circular_user',
        email: 'circular@example.com',
      };
      circularUser.self = circularUser; // Create circular reference

      spyOn(console, 'warn');

      // When
      await service.write(circularUser);

      // Then - JSON.stringify should fail and be handled gracefully
      expect(console.warn).toHaveBeenCalledWith(
        jasmine.stringMatching(/LocalStorageAuthUserStore: Error writing to localStorage/),
        jasmine.any(Error)
      );
    });
  });

  describe('data validation and security', () => {
    it('should preserve data types during serialization round-trip', async () => {
      // Given
      const typedUserData: AuthUserSnapshotContract = {
        id: 123,
        username: 'typed_user',
        email: 'typed@example.com',
        roleId: 456,
        accessLevel: 75,
        isEmailConfirmed: true,
        status: UserStatus.ACTIVE,
      };

      // When
      await service.write(typedUserData);
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(typedUserData);
      const result = await service.read();

      // Then
      expect(result).toEqual(typedUserData);
      expect(typeof result!.id).toBe('number');
      expect(typeof result!.username).toBe('string');
      expect(typeof result!.email).toBe('string');
      expect(typeof result!.roleId).toBe('number');
      expect(typeof result!.accessLevel).toBe('number');
      expect(typeof result!.isEmailConfirmed).toBe('boolean');
    });

    it('should handle user data with extra properties', async () => {
      // Given
      const userWithExtra = {
        ...mockUserData,
        extraProperty: 'should be preserved',
        anotherExtra: { nested: 'object' },
      } as any;

      // When
      await service.write(userWithExtra);
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(userWithExtra);
      const result = await service.read();

      // Then - Extra properties should be preserved
      expect(result).toEqual(userWithExtra);
      expect((result as any).extraProperty).toBe('should be preserved');
      expect((result as any).anotherExtra).toEqual({ nested: 'object' });
    });
  });
});
