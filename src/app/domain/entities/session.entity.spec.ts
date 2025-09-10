/**
 * Domain Session Entity Tests - Following Domain Layer Testing Guidelines
 *
 * @description
 * Tests unitarios puros para la entidad Session del dominio.
 * Valida reglas de negocio, invariantes y métodos sin dependencias externas.
 */

import { Session, SessionId } from './session.entity';
import { User } from './user.entity';
import { AccessToken, RefreshToken } from '../value-objects/local-tokens.vo';
import { ValidationError } from '../errors/validation-error.entity';
import { ISODateTime } from '../value-objects/iso-datetime.vo';
import { Role } from './role.entity';
import { UserNotificationPreferencesVO } from '../value-objects/user-notification-preferences.vo';

describe('Session Entity - Domain Tests', () => {
  // Test data setup - Datos determinísticos
  const mockRole = Role.create({
    id: 1,
    name: 'TestRole',
    accessLevel: 5,
    isActive: true,
  });

  const mockNotificationPreferences = UserNotificationPreferencesVO.create({
    email: true,
    system: false,
    task: true,
  });

  const mockUser = User.create({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    role: mockRole,
    notificationPreferences: mockNotificationPreferences.toObject(),
  });

  const mockAccessToken = AccessToken.create(
    'access-token-123456789', // 21 chars, meets minimum of 16
    Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
  );

  const mockRefreshToken = RefreshToken.create('refresh-token-456789012345678901234567890'); // 38 chars, meets minimum of 32

  const validSessionData = {
    id: 'session-123' as SessionId,
    user: mockUser,
    accessToken: mockAccessToken,
    refreshToken: mockRefreshToken,
  };

  describe('Session Creation', () => {
    describe('successful creation', () => {
      it('should create session with valid data', () => {
        // Given - Valid session data
        const sessionData = validSessionData;

        // When - Creating session
        const session = Session.create(sessionData);

        // Then - Session should be created successfully
        expect(session).toBeTruthy();
        expect(session.id).toBe('session-123');
        expect(session.user).toBe(mockUser);
        expect(session.accessToken).toBe(mockAccessToken);
        expect(session.refreshToken).toBe(mockRefreshToken);
        expect(session.createdAt).toBeInstanceOf(ISODateTime);
      });

      it('should generate createdAt timestamp automatically', () => {
        // Given
        const beforeCreation = new Date();

        // When
        const session = Session.create(validSessionData);

        // Then
        const afterCreation = new Date();
        const sessionCreatedAt = new Date(session.createdAt.value);

        expect(sessionCreatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
        expect(sessionCreatedAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
      });

      it('should preserve immutability of core properties', () => {
        // Given
        const session = Session.create(validSessionData);
        const originalId = session.id;
        const originalUser = session.user;
        const originalAccessToken = session.accessToken;
        const originalRefreshToken = session.refreshToken;
        const originalCreatedAt = session.createdAt;

        // When - Attempting to access properties (they should be readonly)
        // Then - Properties should remain unchanged
        expect(session.id).toBe(originalId);
        expect(session.user).toBe(originalUser);
        expect(session.accessToken).toBe(originalAccessToken);
        expect(session.refreshToken).toBe(originalRefreshToken);
        expect(session.createdAt).toBe(originalCreatedAt);
      });
    });

    describe('validation errors', () => {
      it('should throw ValidationError for empty session ID', () => {
        // Given
        const invalidData = {
          ...validSessionData,
          id: '' as SessionId,
        };

        // When & Then
        expect(() => Session.create(invalidData)).toThrow();
      });

      it('should throw ValidationError for whitespace-only session ID', () => {
        // Given
        const invalidData = {
          ...validSessionData,
          id: '   ' as SessionId,
        };

        // When & Then
        expect(() => Session.create(invalidData)).toThrow();
      });

      it('should throw ValidationError for undefined session ID', () => {
        // Given
        const invalidData = {
          ...validSessionData,
          id: undefined as any,
        };

        // When & Then
        expect(() => Session.create(invalidData)).toThrow();
      });

      it('should throw ValidationError for missing user', () => {
        // Given
        const invalidData = {
          ...validSessionData,
          user: undefined as any,
        };

        // When & Then
        expect(() => Session.create(invalidData)).toThrow();
      });

      it('should throw ValidationError for missing access token', () => {
        // Given
        const invalidData = {
          ...validSessionData,
          accessToken: undefined as any,
        };

        // When & Then
        expect(() => Session.create(invalidData)).toThrow();
      });

      it('should throw ValidationError for missing refresh token', () => {
        // Given
        const invalidData = {
          ...validSessionData,
          refreshToken: undefined as any,
        };

        // When & Then
        expect(() => Session.create(invalidData)).toThrow();
      });

      it('should validate error details for empty session ID', () => {
        // Given
        const invalidData = {
          ...validSessionData,
          id: '' as SessionId,
        };

        // When & Then
        try {
          Session.create(invalidData);
          fail('Should have thrown ValidationError');
        } catch (error) {
          expect((error as ValidationError).constructor.name).toBe('_ValidationError');
          expect((error as ValidationError).message).toContain('Session ID is required');
        }
      });

      it('should validate error details for missing user', () => {
        // Given
        const invalidData = {
          ...validSessionData,
          user: undefined as any,
        };

        // When & Then
        try {
          Session.create(invalidData);
          fail('Should have thrown ValidationError');
        } catch (error) {
          expect((error as ValidationError).constructor.name).toBe('_ValidationError');
          expect((error as ValidationError).message).toContain('User is required');
        }
      });
    });
  });

  describe('Business Rules', () => {
    describe('isValid method', () => {
      it('should return true when access token has not expired', () => {
        // Given
        const futureExpTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        const accessToken = AccessToken.create('token-123456789012', futureExpTime); // 16 chars minimum

        const session = Session.create({
          ...validSessionData,
          accessToken,
        });

        const currentTime = Math.floor(Date.now() / 1000);

        // When
        const isValid = session.isValid(currentTime);

        // Then
        expect(isValid).toBe(true);
      });

      it('should return false when access token has expired', () => {
        // Given
        const pastExpTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
        const accessToken = AccessToken.create('token-123456789012', pastExpTime); // 16 chars minimum

        const session = Session.create({
          ...validSessionData,
          accessToken,
        });

        const currentTime = Math.floor(Date.now() / 1000);

        // When
        const isValid = session.isValid(currentTime);

        // Then
        expect(isValid).toBe(false);
      });

      it('should return true when access token has no expiration time', () => {
        // Given
        const accessToken = AccessToken.create('token-123456789012'); // 16 chars minimum
        // No expSeconds provided

        const session = Session.create({
          ...validSessionData,
          accessToken,
        });

        const currentTime = Math.floor(Date.now() / 1000);

        // When
        const isValid = session.isValid(currentTime);

        // Then
        expect(isValid).toBe(true);
      });

      it('should return false when current time equals expiration time', () => {
        // Given
        const expTime = Math.floor(Date.now() / 1000);
        const accessToken = AccessToken.create('token-123456789012', expTime); // 16 chars minimum

        const session = Session.create({
          ...validSessionData,
          accessToken,
        });

        // When
        const isValid = session.isValid(expTime);

        // Then
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Data Transformation', () => {
    describe('toPlainObject method', () => {
      it('should convert session to plain object with correct structure', () => {
        // Given
        const session = Session.create(validSessionData);

        // When
        const plainObject = session.toPlainObject();

        // Then
        expect(plainObject).toEqual({
          id: 'session-123',
          userId: '1',
          accessToken: 'access-token-123456789',
          refreshToken: 'refresh-token-456789012345678901234567890',
          createdAt: session.createdAt.value,
        });
      });

      it('should return object with string types for all fields', () => {
        // Given
        const session = Session.create(validSessionData);

        // When
        const plainObject = session.toPlainObject();

        // Then
        expect(typeof plainObject.id).toBe('string');
        expect(typeof plainObject.userId).toBe('string');
        expect(typeof plainObject.accessToken).toBe('string');
        expect(typeof plainObject.refreshToken).toBe('string');
        expect(typeof plainObject.createdAt).toBe('string');
      });

      it('should preserve data integrity in transformation', () => {
        // Given
        const session = Session.create(validSessionData);
        const originalId = session.id;
        const originalUserId = session.user.id;
        const originalAccessToken = session.accessToken.getValue();
        const originalRefreshToken = session.refreshToken.getValue();
        const originalCreatedAt = session.createdAt.value;

        // When
        const plainObject = session.toPlainObject();

        // Then
        expect(plainObject.id).toBe(originalId);
        expect(plainObject.userId).toBe(originalUserId.toString());
        expect(plainObject.accessToken).toBe(originalAccessToken);
        expect(plainObject.refreshToken).toBe(originalRefreshToken);
        expect(plainObject.createdAt).toBe(originalCreatedAt);
      });
    });
  });

  describe('Equality Comparison', () => {
    describe('equals method', () => {
      it('should return true for sessions with same ID', () => {
        // Given
        const session1 = Session.create(validSessionData);
        const session2 = Session.create(validSessionData);

        // When
        const areEqual = session1.equals(session2);

        // Then
        expect(areEqual).toBe(true);
      });

      it('should return false for sessions with different IDs', () => {
        // Given
        const session1 = Session.create(validSessionData);
        const session2 = Session.create({
          ...validSessionData,
          id: 'different-session-id' as SessionId,
        });

        // When
        const areEqual = session1.equals(session2);

        // Then
        expect(areEqual).toBe(false);
      });

      it('should return false when comparing with null', () => {
        // Given
        const session = Session.create(validSessionData);

        // When
        const areEqual = session.equals(null);

        // Then
        expect(areEqual).toBe(false);
      });

      it('should return false when comparing with undefined', () => {
        // Given
        const session = Session.create(validSessionData);

        // When
        const areEqual = session.equals(undefined);

        // Then
        expect(areEqual).toBe(false);
      });

      it('should ignore other properties when comparing by ID', () => {
        // Given
        const differentUser = User.create({
          id: 999,
          username: 'differentuser',
          email: 'different@example.com',
          firstName: 'Different',
          lastName: 'User',
          isActive: true,
          role: mockRole,
          notificationPreferences: mockNotificationPreferences.toObject(),
        });

        const session1 = Session.create(validSessionData);
        const session2 = Session.create({
          ...validSessionData,
          user: differentUser, // Different user but same ID
        });

        // When
        const areEqual = session1.equals(session2);

        // Then
        expect(areEqual).toBe(true); // Should be equal because ID is the same
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle session with very long ID', () => {
      // Given
      const longId = 'a'.repeat(1000) as SessionId;
      const sessionData = {
        ...validSessionData,
        id: longId,
      };

      // When
      const session = Session.create(sessionData);

      // Then
      expect(session.id).toBe(longId);
      expect(session.id.length).toBe(1000);
    });

    it('should handle session with special characters in ID', () => {
      // Given
      const specialId = 'session-123!@#$%^&*()_+-=[]{}|;:,.<>?' as SessionId;
      const sessionData = {
        ...validSessionData,
        id: specialId,
      };

      // When
      const session = Session.create(sessionData);

      // Then
      expect(session.id).toBe(specialId);
    });

    it('should handle session with unicode characters in ID', () => {
      // Given
      const unicodeId = 'session-123-ñáéíóú-中文-🚀' as SessionId;
      const sessionData = {
        ...validSessionData,
        id: unicodeId,
      };

      // When
      const session = Session.create(sessionData);

      // Then
      expect(session.id).toBe(unicodeId);
    });

    it('should handle validation with boundary expiration times', () => {
      // Given - Token expires exactly now
      const nowSeconds = Math.floor(Date.now() / 1000);
      const accessToken = AccessToken.create('token-123456789012', nowSeconds); // 16 chars minimum

      const session = Session.create({
        ...validSessionData,
        accessToken,
      });

      // When & Then - Should be invalid at exact expiration time
      expect(session.isValid(nowSeconds)).toBe(false);
      expect(session.isValid(nowSeconds - 1)).toBe(true);
      expect(session.isValid(nowSeconds + 1)).toBe(false);
    });
  });

  describe('Invariants', () => {
    it('should maintain session ID immutability', () => {
      // Given
      const session = Session.create(validSessionData);
      const originalId = session.id;

      // When - Try to access id multiple times
      const id1 = session.id;
      const id2 = session.id;
      const id3 = session.id;

      // Then - ID should always be the same
      expect(id1).toBe(originalId);
      expect(id2).toBe(originalId);
      expect(id3).toBe(originalId);
      expect(id1).toBe(id2);
      expect(id2).toBe(id3);
    });

    it('should maintain user reference immutability', () => {
      // Given
      const session = Session.create(validSessionData);
      const originalUser = session.user;

      // When - Access user multiple times
      const user1 = session.user;
      const user2 = session.user;

      // Then - Should always return the same user instance
      expect(user1).toBe(originalUser);
      expect(user2).toBe(originalUser);
      expect(user1).toBe(user2);
    });

    it('should maintain token references immutability', () => {
      // Given
      const session = Session.create(validSessionData);
      const originalAccessToken = session.accessToken;
      const originalRefreshToken = session.refreshToken;

      // When - Access tokens multiple times
      const accessToken1 = session.accessToken;
      const accessToken2 = session.accessToken;
      const refreshToken1 = session.refreshToken;
      const refreshToken2 = session.refreshToken;

      // Then - Should always return the same token instances
      expect(accessToken1).toBe(originalAccessToken);
      expect(accessToken2).toBe(originalAccessToken);
      expect(refreshToken1).toBe(originalRefreshToken);
      expect(refreshToken2).toBe(originalRefreshToken);
    });

    it('should maintain createdAt immutability', () => {
      // Given
      const session = Session.create(validSessionData);
      const originalCreatedAt = session.createdAt;

      // When - Access createdAt multiple times
      const createdAt1 = session.createdAt;
      const createdAt2 = session.createdAt;

      // Then - Should always return the same timestamp
      expect(createdAt1).toBe(originalCreatedAt);
      expect(createdAt2).toBe(originalCreatedAt);
      expect(createdAt1.value).toBe(createdAt2.value);
    });
  });
});
