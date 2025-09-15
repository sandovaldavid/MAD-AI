import { TestBed } from '@angular/core/testing';
import { SessionMapper } from './session.mapper';
import { UserStatus } from '@domain/enums/user-status.enum';
import type { SessionSnapshotContract } from '@domain/repositories/session/session-store.contract';

describe('SessionMapper', () => {
  let mapper: SessionMapper;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SessionMapper],
    });
    mapper = TestBed.inject(SessionMapper);
  });

  describe('toSessionSnapshot', () => {
    it('should map complete session with all user data to SessionSnapshotContract', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj('Role', [], {
        id: 1,
        name: 'Admin',
        accessLevel: 10,
      });

      const mockUser = jasmine.createSpyObj('User', [], {
        id: 123,
        username: { value: 'john_doe' },
        email: { value: 'john@example.com' },
        firstName: { value: 'John' },
        lastName: { value: 'Doe' },
        active: true,
        role: mockRole,
        status: { value: UserStatus.ACTIVE },
        isEmailConfirmed: true,
        updatedAt: { value: '2024-01-15T10:30:00Z' },
      });

      const mockAccessToken = jasmine.createSpyObj('AccessToken', [], {
        getValue: jasmine.createSpy().and.returnValue('access_token_value'),
        expSeconds: 1642150800,
      });

      const mockRefreshToken = jasmine.createSpyObj('RefreshToken', [], {
        getValue: jasmine.createSpy().and.returnValue('refresh_token_value'),
      });

      const mockSession = jasmine.createSpyObj('Session', [], {
        id: 'session-123',
        user: mockUser,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        createdAt: { value: '2024-01-14T09:00:00Z' },
      });

      // Act
      const result = SessionMapper.toSessionSnapshot(mockSession);

      // Assert
      expect(result).toEqual({
        user: {
          id: 123,
          username: 'john_doe',
          email: 'john@example.com',
          roleId: 1,
          roleName: 'Admin',
          accessLevel: 10,
          isEmailConfirmed: true,
          status: UserStatus.ACTIVE,
          updatedAt: '2024-01-15T10:30:00Z',
        },
        tokens: {
          accessToken: 'access_token_value',
          accessExp: 1642150800,
          refreshToken: 'refresh_token_value',
        },
        version: 1,
        updatedAt: jasmine.any(Number),
      });
    });

    it('should handle user without optional status and updatedAt', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj('Role', [], {
        id: 2,
        name: 'User',
        accessLevel: 20,
      });

      const mockUser = jasmine.createSpyObj('User', [], {
        id: 456,
        username: { value: 'jane_smith' },
        email: { value: 'jane@example.com' },
        firstName: { value: 'Jane' },
        lastName: { value: 'Smith' },
        active: true,
        role: mockRole,
        status: undefined, // No status
        isEmailConfirmed: false,
        updatedAt: undefined, // No updatedAt
      });

      const mockAccessToken = jasmine.createSpyObj('AccessToken', [], {
        getValue: jasmine.createSpy().and.returnValue('access_token_456'),
        expSeconds: undefined,
      });

      const mockRefreshToken = jasmine.createSpyObj('RefreshToken', [], {
        getValue: jasmine.createSpy().and.returnValue('refresh_token_456'),
      });

      const mockSession = jasmine.createSpyObj('Session', [], {
        id: 'session-456',
        user: mockUser,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        createdAt: { value: '2024-01-14T09:00:00Z' },
      });

      // Act
      const result = SessionMapper.toSessionSnapshot(mockSession);

      // Assert
      expect(result).toEqual({
        user: {
          id: 456,
          username: 'jane_smith',
          email: 'jane@example.com',
          roleId: 2,
          roleName: 'User',
          accessLevel: 20,
          isEmailConfirmed: false,
          status: undefined,
          updatedAt: undefined,
        },
        tokens: {
          accessToken: 'access_token_456',
          accessExp: undefined,
          refreshToken: 'refresh_token_456',
        },
        version: 1,
        updatedAt: jasmine.any(Number),
      });
    });

    it('should handle user with null optional fields', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj('Role', [], {
        id: 3,
        name: 'Manager',
        accessLevel: 15,
      });

      const mockUser = jasmine.createSpyObj('User', [], {
        id: 789,
        username: { value: 'bob_manager' },
        email: { value: 'bob@example.com' },
        firstName: { value: 'Bob' },
        lastName: { value: 'Manager' },
        active: true,
        role: mockRole,
        status: null, // Null status
        isEmailConfirmed: null, // Null email confirmation
        updatedAt: null, // Null updatedAt
      });

      const mockAccessToken = jasmine.createSpyObj('AccessToken', [], {
        getValue: jasmine.createSpy().and.returnValue('access_token_789'),
        expSeconds: 1642237200,
      });

      const mockRefreshToken = jasmine.createSpyObj('RefreshToken', [], {
        getValue: jasmine.createSpy().and.returnValue('refresh_token_789'),
      });

      const mockSession = jasmine.createSpyObj('Session', [], {
        id: 'session-789',
        user: mockUser,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        createdAt: { value: '2024-01-14T09:00:00Z' },
      });

      // Act
      const result = SessionMapper.toSessionSnapshot(mockSession);

      // Assert
      expect(result).toEqual({
        user: {
          id: 789,
          username: 'bob_manager',
          email: 'bob@example.com',
          roleId: 3,
          roleName: 'Manager',
          accessLevel: 15,
          isEmailConfirmed: null,
          status: undefined,
          updatedAt: undefined,
        },
        tokens: {
          accessToken: 'access_token_789',
          accessExp: 1642237200,
          refreshToken: 'refresh_token_789',
        },
        version: 1,
        updatedAt: jasmine.any(Number),
      });
    });

    it('should handle different role types and access levels', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj('Role', [], {
        id: 4,
        name: 'Viewer',
        accessLevel: 50, // High access level (lower privilege)
      });

      const mockUser = jasmine.createSpyObj('User', [], {
        id: 101,
        username: { value: 'viewer_user' },
        email: { value: 'viewer@example.com' },
        firstName: { value: 'Viewer' },
        lastName: { value: 'User' },
        active: true,
        role: mockRole,
        status: { value: UserStatus.ACTIVE },
        isEmailConfirmed: true,
        updatedAt: { value: '2024-01-15T10:30:00Z' },
      });

      const mockAccessToken = jasmine.createSpyObj('AccessToken', [], {
        getValue: jasmine.createSpy().and.returnValue('access_token_viewer'),
        expSeconds: 1642323600,
      });

      const mockRefreshToken = jasmine.createSpyObj('RefreshToken', [], {
        getValue: jasmine.createSpy().and.returnValue('refresh_token_viewer'),
      });

      const mockSession = jasmine.createSpyObj('Session', [], {
        id: 'session-viewer',
        user: mockUser,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        createdAt: { value: '2024-01-14T09:00:00Z' },
      });

      // Act
      const result = SessionMapper.toSessionSnapshot(mockSession);

      // Assert
      expect(result).toEqual({
        user: {
          id: 101,
          username: 'viewer_user',
          email: 'viewer@example.com',
          roleId: 4,
          roleName: 'Viewer',
          accessLevel: 50,
          isEmailConfirmed: true,
          status: UserStatus.ACTIVE,
          updatedAt: '2024-01-15T10:30:00Z',
        },
        tokens: {
          accessToken: 'access_token_viewer',
          accessExp: 1642323600,
          refreshToken: 'refresh_token_viewer',
        },
        version: 1,
        updatedAt: jasmine.any(Number),
      });
    });

    it('should handle tokens without expiration time', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj('Role', [], {
        id: 5,
        name: 'Guest',
        accessLevel: 100,
      });

      const mockUser = jasmine.createSpyObj('User', [], {
        id: 202,
        username: { value: 'guest_user' },
        email: { value: 'guest@example.com' },
        firstName: { value: 'Guest' },
        lastName: { value: 'User' },
        active: true,
        role: mockRole,
        status: { value: 'pending' },
        isEmailConfirmed: false,
        updatedAt: { value: '2024-01-15T10:30:00Z' },
      });

      const mockAccessToken = jasmine.createSpyObj('AccessToken', [], {
        getValue: jasmine.createSpy().and.returnValue('access_token_guest'),
        expSeconds: undefined,
      });

      const mockRefreshToken = jasmine.createSpyObj('RefreshToken', [], {
        getValue: jasmine.createSpy().and.returnValue('refresh_token_guest'),
      });

      const mockSession = jasmine.createSpyObj('Session', [], {
        id: 'session-guest',
        user: mockUser,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        createdAt: { value: '2024-01-14T09:00:00Z' },
      });

      // Act
      const result = SessionMapper.toSessionSnapshot(mockSession);

      // Assert
      expect(result).toEqual({
        user: {
          id: 202,
          username: 'guest_user',
          email: 'guest@example.com',
          roleId: 5,
          roleName: 'Guest',
          accessLevel: 100,
          isEmailConfirmed: false,
          status: UserStatus.PENDING,
          updatedAt: '2024-01-15T10:30:00Z',
        },
        tokens: {
          accessToken: 'access_token_guest',
          accessExp: undefined,
          refreshToken: 'refresh_token_guest',
        },
        version: 1,
        updatedAt: jasmine.any(Number),
      });
    });

    describe('Edge Cases and Error Handling', () => {
      it('should handle user with minimal required data', () => {
        // Arrange
        const mockRole = jasmine.createSpyObj('Role', [], {
          id: 6,
          name: 'Basic',
          accessLevel: 30,
        });

        const mockUser = jasmine.createSpyObj('User', [], {
          id: 303,
          username: { value: 'basic_user' },
          email: { value: 'basic@example.com' },
          firstName: { value: 'Basic' },
          lastName: { value: 'User' },
          active: true,
          role: mockRole,
          status: undefined,
          isEmailConfirmed: undefined,
          updatedAt: undefined,
        });

        const mockAccessToken = jasmine.createSpyObj('AccessToken', [], {
          getValue: jasmine.createSpy().and.returnValue('access_token_basic'),
          expSeconds: 1642410000,
        });

        const mockRefreshToken = jasmine.createSpyObj('RefreshToken', [], {
          getValue: jasmine.createSpy().and.returnValue('refresh_token_basic'),
        });

        const mockSession = jasmine.createSpyObj('Session', [], {
          id: 'session-basic',
          user: mockUser,
          accessToken: mockAccessToken,
          refreshToken: mockRefreshToken,
          createdAt: { value: '2024-01-14T09:00:00Z' },
        });

        // Act
        const result = SessionMapper.toSessionSnapshot(mockSession);

        // Assert
        expect(result).toEqual({
          user: {
            id: 303,
            username: 'basic_user',
            email: 'basic@example.com',
            roleId: 6,
            roleName: 'Basic',
            accessLevel: 30,
            isEmailConfirmed: undefined,
            status: undefined,
            updatedAt: undefined,
          },
          tokens: {
            accessToken: 'access_token_basic',
            accessExp: 1642410000,
            refreshToken: 'refresh_token_basic',
          },
          version: 1,
          updatedAt: jasmine.any(Number),
        });
      });

      it('should handle long token values', () => {
        // Arrange
        const longAccessToken =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        const longRefreshToken =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c_refresh';

        const mockRole = jasmine.createSpyObj('Role', [], {
          id: 7,
          name: 'Developer',
          accessLevel: 25,
        });

        const mockUser = jasmine.createSpyObj('User', [], {
          id: 404,
          username: { value: 'dev_user' },
          email: { value: 'dev@example.com' },
          firstName: { value: 'Dev' },
          lastName: { value: 'User' },
          active: true,
          role: mockRole,
          status: { value: UserStatus.ACTIVE },
          isEmailConfirmed: true,
          updatedAt: { value: '2024-01-15T10:30:00Z' },
        });

        const mockAccessToken = jasmine.createSpyObj('AccessToken', [], {
          getValue: jasmine.createSpy().and.returnValue(longAccessToken),
          expSeconds: 1642496400,
        });

        const mockRefreshToken = jasmine.createSpyObj('RefreshToken', [], {
          getValue: jasmine.createSpy().and.returnValue(longRefreshToken),
        });

        const mockSession = jasmine.createSpyObj('Session', [], {
          id: 'session-dev',
          user: mockUser,
          accessToken: mockAccessToken,
          refreshToken: mockRefreshToken,
          createdAt: { value: '2024-01-14T09:00:00Z' },
        });

        // Act
        const result = SessionMapper.toSessionSnapshot(mockSession);

        // Assert
        expect(result).toEqual({
          user: {
            id: 404,
            username: 'dev_user',
            email: 'dev@example.com',
            roleId: 7,
            roleName: 'Developer',
            accessLevel: 25,
            isEmailConfirmed: true,
            status: UserStatus.ACTIVE,
            updatedAt: '2024-01-15T10:30:00Z',
          },
          tokens: {
            accessToken: longAccessToken,
            accessExp: 1642496400,
            refreshToken: longRefreshToken,
          },
          version: 1,
          updatedAt: jasmine.any(Number),
        });
      });
    });

    describe('Integration and Complex Scenarios', () => {
      it('should handle complete session transformation with all data types', () => {
        // Arrange
        const mockRole = jasmine.createSpyObj('Role', [], {
          id: 8,
          name: 'SuperAdmin',
          accessLevel: 1, // Highest access level
        });

        const mockUser = jasmine.createSpyObj('User', [], {
          id: 999,
          username: { value: 'super_admin' },
          email: { value: 'admin@example.com' },
          firstName: { value: 'Super' },
          lastName: { value: 'Admin' },
          active: true,
          role: mockRole,
          status: { value: UserStatus.ACTIVE },
          isEmailConfirmed: true,
          updatedAt: { value: '2024-01-15T10:30:00Z' },
        });

        const mockAccessToken = jasmine.createSpyObj('AccessToken', [], {
          getValue: jasmine.createSpy().and.returnValue('super_access_token'),
          expSeconds: 1642582800,
        });

        const mockRefreshToken = jasmine.createSpyObj('RefreshToken', [], {
          getValue: jasmine.createSpy().and.returnValue('super_refresh_token'),
        });

        const mockSession = jasmine.createSpyObj('Session', [], {
          id: 'session-super',
          user: mockUser,
          accessToken: mockAccessToken,
          refreshToken: mockRefreshToken,
          createdAt: { value: '2024-01-14T09:00:00Z' },
        });

        // Act
        const result = SessionMapper.toSessionSnapshot(mockSession);

        // Assert
        expect(result).toEqual({
          user: {
            id: 999,
            username: 'super_admin',
            email: 'admin@example.com',
            roleId: 8,
            roleName: 'SuperAdmin',
            accessLevel: 1,
            isEmailConfirmed: true,
            status: UserStatus.ACTIVE,
            updatedAt: '2024-01-15T10:30:00Z',
          },
          tokens: {
            accessToken: 'super_access_token',
            accessExp: 1642582800,
            refreshToken: 'super_refresh_token',
          },
          version: 1,
          updatedAt: jasmine.any(Number),
        });

        // Verify that updatedAt is a recent timestamp
        expect(result.updatedAt).toBeGreaterThan(Date.now() - 1000); // Within last second
        expect(result.updatedAt).toBeLessThanOrEqual(Date.now());
      });

      it('should maintain data integrity across multiple transformations', () => {
        // Arrange
        const mockRole = jasmine.createSpyObj('Role', [], {
          id: 9,
          name: 'Tester',
          accessLevel: 40,
        });

        const mockUser = jasmine.createSpyObj('User', [], {
          id: 505,
          username: { value: 'test_user' },
          email: { value: 'test@example.com' },
          firstName: { value: 'Test' },
          lastName: { value: 'User' },
          active: true,
          role: mockRole,
          status: { value: UserStatus.ACTIVE },
          isEmailConfirmed: true,
          updatedAt: { value: '2024-01-15T10:30:00Z' },
        });

        const mockAccessToken = jasmine.createSpyObj('AccessToken', [], {
          getValue: jasmine.createSpy().and.returnValue('test_access_token'),
          expSeconds: 1642669200,
        });

        const mockRefreshToken = jasmine.createSpyObj('RefreshToken', [], {
          getValue: jasmine.createSpy().and.returnValue('test_refresh_token'),
        });

        const mockSession = jasmine.createSpyObj('Session', [], {
          id: 'session-test',
          user: mockUser,
          accessToken: mockAccessToken,
          refreshToken: mockRefreshToken,
          createdAt: { value: '2024-01-14T09:00:00Z' },
        });

        // Act - Transform multiple times to ensure consistency
        const result1 = SessionMapper.toSessionSnapshot(mockSession);
        const result2 = SessionMapper.toSessionSnapshot(mockSession);

        // Assert - Results should be identical except for updatedAt timestamp
        expect(result1.user).toEqual(result2.user);
        expect(result1.tokens).toEqual(result2.tokens);
        expect(result1.version).toEqual(result2.version);

        // updatedAt should be recent timestamps (may be identical if called in same millisecond)
        expect(result1.updatedAt).toBeGreaterThan(Date.now() - 2000); // Within last 2 seconds
        expect(result2.updatedAt).toBeGreaterThan(Date.now() - 2000);
        // Allow timestamps to be identical if generated in same millisecond
        expect(Math.abs(result1.updatedAt - result2.updatedAt)).toBeLessThanOrEqual(1);
      });
    });

    describe('Type Safety and Interface Compliance', () => {
      it('should return object conforming to SessionSnapshotContract interface', () => {
        // Arrange
        const mockRole = jasmine.createSpyObj('Role', [], {
          id: 10,
          name: 'ContractTest',
          accessLevel: 35,
        });

        const mockUser = jasmine.createSpyObj('User', [], {
          id: 606,
          username: { value: 'contract_user' },
          email: { value: 'contract@example.com' },
          firstName: { value: 'Contract' },
          lastName: { value: 'User' },
          active: true,
          role: mockRole,
          status: { value: UserStatus.ACTIVE },
          isEmailConfirmed: true,
          updatedAt: { value: '2024-01-15T10:30:00Z' },
        });

        const mockAccessToken = jasmine.createSpyObj('AccessToken', [], {
          getValue: jasmine.createSpy().and.returnValue('contract_access_token'),
          expSeconds: 1642755600,
        });

        const mockRefreshToken = jasmine.createSpyObj('RefreshToken', [], {
          getValue: jasmine.createSpy().and.returnValue('contract_refresh_token'),
        });

        const mockSession = jasmine.createSpyObj('Session', [], {
          id: 'session-contract',
          user: mockUser,
          accessToken: mockAccessToken,
          refreshToken: mockRefreshToken,
          createdAt: { value: '2024-01-14T09:00:00Z' },
        });

        // Act
        const result: SessionSnapshotContract = SessionMapper.toSessionSnapshot(mockSession);

        // Assert - Verify interface compliance
        expect(result.user).toBeDefined();
        expect(result.tokens).toBeDefined();
        expect(typeof result.user!.id).toBe('number');
        expect(typeof result.user!.username).toBe('string');
        expect(typeof result.user!.email).toBe('string');
        expect(typeof result.user!.roleId).toBe('number');
        expect(typeof result.user!.roleName).toBe('string');
        expect(typeof result.user!.accessLevel).toBe('number');
        expect(typeof result.user!.isEmailConfirmed).toBe('boolean');
        expect(typeof result.user!.status).toBe('string');
        expect(typeof result.user!.updatedAt).toBe('string');

        expect(typeof result.tokens!.accessToken).toBe('string');
        expect(typeof result.tokens!.accessExp).toBe('number');
        expect(typeof result.tokens!.refreshToken).toBe('string');

        expect(typeof result.version).toBe('number');
        expect(typeof result.updatedAt).toBe('number');

        // Verify specific values
        expect(result.version).toBe(1);
        expect(result.user!.id).toBe(606);
        expect(result.user!.username).toBe('contract_user');
        expect(result.user!.email).toBe('contract@example.com');
        expect(result.user!.roleId).toBe(10);
        expect(result.user!.roleName).toBe('ContractTest');
        expect(result.user!.accessLevel).toBe(35);
        expect(result.user!.isEmailConfirmed).toBe(true);
        expect(result.user!.status).toBe(UserStatus.ACTIVE);
        expect(result.user!.updatedAt).toBe('2024-01-15T10:30:00Z');
        expect(result.tokens!.accessToken).toBe('contract_access_token');
        expect(result.tokens!.accessExp).toBe(1642755600);
        expect(result.tokens!.refreshToken).toBe('contract_refresh_token');
      });
    });
  });
});
