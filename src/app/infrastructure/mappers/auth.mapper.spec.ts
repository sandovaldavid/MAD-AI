import { TestBed } from '@angular/core/testing';
import { AuthMapper } from './auth.mapper';
import type {
  LoginResponseDTO,
  MeResponseDTO,
  RefreshResponseDTO,
  RegisterResponseDTO,
} from '../dtos/auth';

describe('AuthMapper', () => {
  let mapper: AuthMapper;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthMapper],
    });
    mapper = TestBed.inject(AuthMapper);
  });

  describe('loginUserToEntity', () => {
    it('should transform LoginResponseDTO user to User entity', async () => {
      // Arrange
      const userDto: LoginResponseDTO['user'] = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
        status: 'active',
        is_email_confirmed: true,
        profile_completed: true,
        email_notifications_enabled: true,
        system_notifications_enabled: false,
        task_notifications_enabled: true,
        role_id: 2,
        role_name: 'Manager',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        last_activity_at: '2024-01-03T00:00:00Z',
      };

      // Act
      const result = await mapper.loginUserToEntity(userDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.role.id).toBe(2);
      expect(result.role.name).toBe('Manager');
    });
  });

  describe('registerUserToEntity', () => {
    it('should transform RegisterResponseDTO user to User entity', () => {
      // Arrange
      const userDto: RegisterResponseDTO['user'] = {
        id: 3,
        username: 'newuser',
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'User',
        full_name: 'New User',
        status: 'active',
        is_email_confirmed: false,
        profile_completed: false,
        email_notifications_enabled: true,
        system_notifications_enabled: true,
        task_notifications_enabled: false,
        role_id: 1,
        role_name: 'BasicUser',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        last_activity_at: '2024-01-01T00:00:00Z',
      };

      // Act
      const result = mapper.registerUserToEntity(userDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(3);
      expect(result.role.id).toBe(1);
      expect(result.role.name).toBe('BasicUser');
    });
  });

  describe('meToEntity', () => {
    it('should transform MeResponseDTO to User entity', () => {
      // Arrange
      const meDto: MeResponseDTO = {
        id: 1,
        username: 'currentuser',
        email: 'current@example.com',
        first_name: 'Current',
        last_name: 'User',
        role: {
          id: 2,
          name: 'Manager',
          access_level: 5,
          is_active: true,
        },
        notification_preferences: {
          email_notifications: true,
          system_notifications: false,
          task_notifications: true,
        },
      };

      // Act
      const result = mapper.meToEntity(meDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.role.id).toBe(2);
      expect(result.role.name).toBe('Manager');
    });
  });

  describe('tokensFromLogin', () => {
    it('should extract token data from LoginResponseDTO', () => {
      // Arrange
      const loginDto: LoginResponseDTO = {
        access_token: 'access-123',
        refresh_token: 'refresh-456',
        token_type: 'Bearer',
        expires_in: 3600,
        user: {
          id: 1,
          username: 'user',
          email: 'user@test.com',
          first_name: 'Test',
          last_name: 'User',
          full_name: 'Test User',
          status: 'active',
          is_email_confirmed: true,
          profile_completed: true,
          email_notifications_enabled: true,
          system_notifications_enabled: true,
          task_notifications_enabled: true,
          role_id: 1,
          role_name: 'BasicUser',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          last_activity_at: '2024-01-01T00:00:00Z',
        },
      };
      const nowEpoch = 1640995200;

      // Act
      const result = mapper.tokensFromLogin(loginDto, nowEpoch);

      // Assert
      expect(result).toEqual({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        accessExp: 1640998800, // nowEpoch + 3600
      });
    });
  });

  describe('tokensFromRefresh', () => {
    it('should extract token data from RefreshResponseDTO', () => {
      // Arrange
      const refreshDto: RefreshResponseDTO = {
        access_token: 'new-access-789',
        refresh_token: 'new-refresh-012',
        token_type: 'Bearer',
        expires_in: 7200,
      };
      const nowEpoch = 1640995200;

      // Act
      const result = mapper.tokensFromRefresh(refreshDto, nowEpoch);

      // Assert
      expect(result).toEqual({
        accessToken: 'new-access-789',
        refreshToken: 'new-refresh-012',
        accessExp: 1641002400, // nowEpoch + 7200
      });
    });
  });

  describe('tokensFromRegister', () => {
    it('should extract token data from RegisterResponseDTO', () => {
      // Arrange
      const registerDto: RegisterResponseDTO = {
        access_token: 'register-access-345',
        refresh_token: 'register-refresh-678',
        token_type: 'Bearer',
        expires_in: 1800,
        user: {
          id: 2,
          username: 'newuser',
          email: 'new@test.com',
          first_name: 'New',
          last_name: 'User',
          full_name: 'New User',
          status: 'active',
          is_email_confirmed: false,
          profile_completed: false,
          email_notifications_enabled: true,
          system_notifications_enabled: false,
          task_notifications_enabled: true,
          role_id: 1,
          role_name: 'BasicUser',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          last_activity_at: '2024-01-01T00:00:00Z',
        },
      };
      const nowEpoch = 1640995200;

      // Act
      const result = mapper.tokensFromRegister(registerDto, nowEpoch);

      // Assert
      expect(result).toEqual({
        accessToken: 'register-access-345',
        refreshToken: 'register-refresh-678',
        accessExp: 1640997000, // nowEpoch + 1800
      });
    });

    it('should handle undefined expires_in from RegisterResponseDTO', () => {
      // Arrange
      const registerDto: RegisterResponseDTO = {
        access_token: 'register-access-345',
        refresh_token: 'register-refresh-678',
        token_type: 'Bearer',
        expires_in: undefined as any,
        user: {
          id: 2,
          username: 'newuser',
          email: 'new@test.com',
          first_name: 'New',
          last_name: 'User',
          full_name: 'New User',
          status: 'active',
          is_email_confirmed: false,
          profile_completed: false,
          email_notifications_enabled: true,
          system_notifications_enabled: false,
          task_notifications_enabled: true,
          role_id: 1,
          role_name: 'BasicUser',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          last_activity_at: '2024-01-01T00:00:00Z',
        },
      };
      const nowEpoch = 1640995200;

      // Act
      const result = mapper.tokensFromRegister(registerDto, nowEpoch);

      // Assert
      expect(result).toEqual({
        accessToken: 'register-access-345',
        refreshToken: 'register-refresh-678',
        accessExp: 1640995200, // nowEpoch + 0 (undefined expires_in becomes 0)
      });
    });
  });

  describe('toSession', () => {
    it('should create Session from token parameters and user', async () => {
      // Arrange
      const userDto: LoginResponseDTO['user'] = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
        status: 'active',
        is_email_confirmed: true,
        profile_completed: true,
        email_notifications_enabled: true,
        system_notifications_enabled: false,
        task_notifications_enabled: true,
        role_id: 2,
        role_name: 'Manager',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        last_activity_at: '2024-01-03T00:00:00Z',
      };
      const user = await mapper.loginUserToEntity(userDto);

      const sessionParams = {
        accessToken: 'access-token-123456789012345678901234567890',
        refreshToken: 'refresh-token-456789012345678901234567890',
        accessExpEpochSeconds: 1641002400,
        user: user,
      };

      // Act
      const result = mapper.toSession(sessionParams);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.user).toBe(user);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should handle minimal valid token strings in toSession', async () => {
      // Arrange
      const userDto: LoginResponseDTO['user'] = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
        status: 'active',
        is_email_confirmed: true,
        profile_completed: true,
        email_notifications_enabled: true,
        system_notifications_enabled: false,
        task_notifications_enabled: true,
        role_id: 2,
        role_name: 'Manager',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        last_activity_at: '2024-01-03T00:00:00Z',
      };
      const user = await mapper.loginUserToEntity(userDto);

      const sessionParams = {
        accessToken: 'minimal-access-token-123456789012345678901234567890',
        refreshToken: 'minimal-refresh-token-123456789012345678901234567890',
        accessExpEpochSeconds: 0,
        user: user,
      };

      // Act
      const result = mapper.toSession(sessionParams);

      // Assert
      expect(result).toBeDefined();
      expect(result.user).toBe(user);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    describe('loginUserToEntity edge cases', () => {
      it('should handle missing optional fields', async () => {
        // Arrange
        const userDto: LoginResponseDTO['user'] = {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          full_name: 'Test User',
          status: 'active',
          is_email_confirmed: true,
          profile_completed: true,
          email_notifications_enabled: true,
          system_notifications_enabled: false,
          task_notifications_enabled: true,
          role_id: 2,
          role_name: 'Manager',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          last_activity_at: undefined as any, // Edge case: undefined last_activity_at
        };

        // Act
        const result = await mapper.loginUserToEntity(userDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe(1);
        expect(result.role.id).toBe(2);
      });

      it('should handle inactive users', async () => {
        // Arrange
        const userDto: LoginResponseDTO['user'] = {
          id: 1,
          username: 'inactiveuser',
          email: 'inactive@example.com',
          first_name: 'Inactive',
          last_name: 'User',
          full_name: 'Inactive User',
          status: 'inactive',
          is_email_confirmed: false,
          profile_completed: false,
          email_notifications_enabled: false,
          system_notifications_enabled: false,
          task_notifications_enabled: false,
          role_id: 1,
          role_name: 'BasicUser',
          is_active: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          last_activity_at: '2024-01-03T00:00:00Z',
        };

        // Act
        const result = await mapper.loginUserToEntity(userDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.active).toBe(false);
        expect(result.role.isActive).toBe(true); // Role is assumed active during login
      });
    });

    describe('meToEntity edge cases', () => {
      it('should handle role with minimal data', () => {
        // Arrange
        const meDto: MeResponseDTO = {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: {
            id: 1,
            name: 'BasicRole',
            access_level: undefined as any, // Edge case: undefined access_level
            is_active: false,
          },
          notification_preferences: {
            email_notifications: false,
            system_notifications: false,
            task_notifications: false,
          },
        };

        // Act
        const result = mapper.meToEntity(meDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.role.accessLevel).toBe(5); // Default value when undefined is passed
        expect(result.role.isActive).toBe(false);
        expect(result.notificationPreferences?.email).toBe(false);
        expect(result.notificationPreferences?.system).toBe(false);
        expect(result.notificationPreferences?.task).toBe(false);
      });

      it('should handle role with maximum access level', () => {
        // Arrange
        const meDto: MeResponseDTO = {
          id: 1,
          username: 'superadmin',
          email: 'super@example.com',
          first_name: 'Super',
          last_name: 'Admin',
          role: {
            id: 1,
            name: 'SuperManager',
            access_level: 10, // Maximum access level
            is_active: true,
          },
          notification_preferences: {
            email_notifications: true,
            system_notifications: true,
            task_notifications: true,
          },
        };

        // Act
        const result = mapper.meToEntity(meDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.role.accessLevel).toBe(10);
        expect(result.role.isActive).toBe(true);
      });
    });

    describe('Token extraction edge cases', () => {
      it('should handle zero expires_in in tokensFromLogin', () => {
        // Arrange
        const loginDto: LoginResponseDTO = {
          access_token: 'access-123',
          refresh_token: 'refresh-456',
          token_type: 'Bearer',
          expires_in: 0, // Edge case: zero expiration
          user: {
            id: 1,
            username: 'user',
            email: 'user@test.com',
            first_name: 'Test',
            last_name: 'User',
            full_name: 'Test User',
            status: 'active',
            is_email_confirmed: true,
            profile_completed: true,
            email_notifications_enabled: true,
            system_notifications_enabled: true,
            task_notifications_enabled: true,
            role_id: 1,
            role_name: 'BasicUser',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            last_activity_at: '2024-01-01T00:00:00Z',
          },
        };
        const nowEpoch = 1640995200;

        // Act
        const result = mapper.tokensFromLogin(loginDto, nowEpoch);

        // Assert
        expect(result).toEqual({
          accessToken: 'access-123',
          refreshToken: 'refresh-456',
          accessExp: 1640995200, // nowEpoch + 0
        });
      });

      it('should handle negative expires_in in tokensFromRefresh', () => {
        // Arrange
        const refreshDto: RefreshResponseDTO = {
          access_token: 'new-access-789',
          refresh_token: 'new-refresh-012',
          token_type: 'Bearer',
          expires_in: -100, // Edge case: negative expiration
        };
        const nowEpoch = 1640995200;

        // Act
        const result = mapper.tokensFromRefresh(refreshDto, nowEpoch);

        // Assert
        expect(result).toEqual({
          accessToken: 'new-access-789',
          refreshToken: 'new-refresh-012',
          accessExp: 1640995100, // nowEpoch - 100
        });
      });

      it('should handle very large expires_in values', () => {
        // Arrange
        const loginDto: LoginResponseDTO = {
          access_token: 'access-123',
          refresh_token: 'refresh-456',
          token_type: 'Bearer',
          expires_in: Number.MAX_SAFE_INTEGER, // Edge case: very large expiration
          user: {
            id: 1,
            username: 'user',
            email: 'user@test.com',
            first_name: 'Test',
            last_name: 'User',
            full_name: 'Test User',
            status: 'active',
            is_email_confirmed: true,
            profile_completed: true,
            email_notifications_enabled: true,
            system_notifications_enabled: true,
            task_notifications_enabled: true,
            role_id: 1,
            role_name: 'BasicUser',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            last_activity_at: '2024-01-01T00:00:00Z',
          },
        };
        const nowEpoch = 1640995200;

        // Act
        const result = mapper.tokensFromLogin(loginDto, nowEpoch);

        // Assert
        expect(result.accessToken).toBe('access-123');
        expect(result.refreshToken).toBe('refresh-456');
        expect(result.accessExp).toBe(nowEpoch + Number.MAX_SAFE_INTEGER);
      });
    });

    describe('Data integrity tests', () => {
      it('should maintain data consistency in bidirectional transformations', async () => {
        // This test ensures that transforming data doesn't lose or corrupt information
        // Note: Not all mappers have bidirectional methods, so we test what's available

        // Test token extraction consistency
        const loginDto: LoginResponseDTO = {
          access_token: 'consistent-access-token',
          refresh_token: 'consistent-refresh-token',
          token_type: 'Bearer',
          expires_in: 3600,
          user: {
            id: 99,
            username: 'consistency_test',
            email: 'consistency@test.com',
            first_name: 'Consistency',
            last_name: 'Test',
            full_name: 'Consistency Test',
            status: 'active',
            is_email_confirmed: true,
            profile_completed: true,
            email_notifications_enabled: true,
            system_notifications_enabled: true,
            task_notifications_enabled: true,
            role_id: 5,
            role_name: 'Tester',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            last_activity_at: '2024-01-01T00:00:00Z',
          },
        };
        const nowEpoch = 1640995200;

        // Act
        const tokens = mapper.tokensFromLogin(loginDto, nowEpoch);
        const user = await mapper.loginUserToEntity(loginDto.user);

        // Assert - verify data integrity
        expect(tokens.accessToken).toBe(loginDto.access_token);
        expect(tokens.refreshToken).toBe(loginDto.refresh_token);
        expect(tokens.accessExp).toBe(nowEpoch + loginDto.expires_in!);
        expect(user.id).toBe(loginDto.user.id);
        expect(user.role.id).toBe(loginDto.user.role_id);
        expect(user.role.name).toBe(loginDto.user.role_name);
      });
    });
  });
});
