import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { LocalStorageTokenStore } from './local-storage-token-store.service';
import { TokenSnapshotContract } from '@domain/repositories/session/token-store.contract';

describe('LocalStorageTokenStore', () => {
  let service: LocalStorageTokenStore;
  let mockLocalStorage: { [key: string]: string };
  let getItemSpy: jasmine.Spy;
  let setItemSpy: jasmine.Spy;
  let removeItemSpy: jasmine.Spy;

  const STORAGE_KEY = 'mad-ai.auth.tokens.v1';

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
      providers: [
        LocalStorageTokenStore,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(LocalStorageTokenStore);
  });

  describe('read', () => {
    it('should return null when no data is stored', async () => {
      const result = await service.read();
      
      expect(result).toBeNull();
      expect(getItemSpy).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('should return parsed token data when valid JSON is stored', async () => {
      const tokenData: TokenSnapshotContract = {
        accessToken: 'access-token-123',
        accessExp: 1692180600,
        refreshToken: 'refresh-token-456'
      };
      
      mockLocalStorage[STORAGE_KEY] = JSON.stringify(tokenData);
      
      const result = await service.read();
      
      expect(result).toEqual(tokenData);
      expect(getItemSpy).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('should return null and log warning when invalid JSON is stored', async () => {
      mockLocalStorage[STORAGE_KEY] = 'invalid-json';
      spyOn(console, 'warn');
      
      const result = await service.read();
      
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        jasmine.stringMatching(/LocalStorageTokenStore: Error reading from localStorage/),
        jasmine.any(Error)
      );
    });

    it('should return null when localStorage throws an error', async () => {
      getItemSpy.and.throwError('Storage error');
      spyOn(console, 'warn');
      
      const result = await service.read();
      
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        jasmine.stringMatching(/LocalStorageTokenStore: Error reading from localStorage/),
        jasmine.any(Error)
      );
    });
  });

  describe('write', () => {
    it('should store token data as JSON string', async () => {
      const tokenData: TokenSnapshotContract = {
        accessToken: 'access-token-123',
        accessExp: 1692180600,
        refreshToken: 'refresh-token-456'
      };
      
      await service.write(tokenData);
      
      expect(setItemSpy).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify(tokenData)
      );
    });

    it('should clear storage when null is passed', async () => {
      await service.write(null);
      
      expect(removeItemSpy).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('should handle localStorage errors gracefully', async () => {
      setItemSpy.and.throwError('Storage full');
      spyOn(console, 'warn');
      
      const tokenData: TokenSnapshotContract = {
        accessToken: 'access-token-123',
        accessExp: 1692180600,
        refreshToken: null
      };
      
      await service.write(tokenData);
      
      expect(console.warn).toHaveBeenCalledWith(
        jasmine.stringMatching(/LocalStorageTokenStore: Error writing to localStorage/),
        jasmine.any(Error)
      );
    });
  });

  describe('clear', () => {
    it('should remove token data from localStorage', async () => {
      await service.clear();
      
      expect(removeItemSpy).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('should handle localStorage errors gracefully', async () => {
      removeItemSpy.and.throwError('Storage error');
      spyOn(console, 'warn');
      
      await service.clear();
      
      expect(console.warn).toHaveBeenCalledWith(
        jasmine.stringMatching(/LocalStorageTokenStore: Error removing from localStorage/),
        jasmine.any(Error)
      );
    });
  });

  describe('server-side rendering', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          LocalStorageTokenStore,
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });
      service = TestBed.inject(LocalStorageTokenStore);
    });

    it('should return null when reading on server', async () => {
      const result = await service.read();
      
      expect(result).toBeNull();
      expect(getItemSpy).not.toHaveBeenCalled();
    });

    it('should do nothing when writing on server', async () => {
      const tokenData: TokenSnapshotContract = {
        accessToken: 'access-token-123',
        accessExp: 1692180600,
        refreshToken: 'refresh-token-456'
      };
      
      await service.write(tokenData);
      
      expect(setItemSpy).not.toHaveBeenCalled();
    });

    it('should do nothing when clearing on server', async () => {
      await service.clear();
      
      expect(removeItemSpy).not.toHaveBeenCalled();
    });
  });
});