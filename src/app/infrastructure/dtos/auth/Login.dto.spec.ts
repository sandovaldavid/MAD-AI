import { LoginRequestDTO, LoginResponseDTO, Identifier } from './Login.dto';

describe('Login DTOs - Infrastructure Tests', () => {
  describe('Identifier Type', () => {
    it('should accept string identifier', () => {
      // Given
      const identifier: Identifier = 'user@example.com';

      // Then
      expect(typeof identifier).toBe('string');
      expect(identifier).toBe('user@example.com');
    });

    it('should accept email object identifier', () => {
      // Given
      const identifier: Identifier = { email: 'user@example.com' };

      // Then
      expect(typeof identifier).toBe('object');
      expect(identifier).toEqual({ email: 'user@example.com' });
      expect('email' in identifier).toBe(true);
    });

    it('should accept username object identifier', () => {
      // Given
      const identifier: Identifier = { username: 'john_doe' };

      // Then
      expect(typeof identifier).toBe('object');
      expect(identifier).toEqual({ username: 'john_doe' });
      expect('username' in identifier).toBe(true);
    });
  });

  describe('LoginRequestDTO', () => {
    describe('structure validation', () => {
      it('should have required properties', () => {
        // Given
        const loginRequest: LoginRequestDTO = {
          identifier: 'user@example.com',
          password: 'password123',
        };

        // Then
        expect(loginRequest.identifier).toBeDefined();
        expect(loginRequest.password).toBeDefined();
        expect(typeof loginRequest.identifier).toBe('string');
        expect(typeof loginRequest.password).toBe('string');
      });

      it('should accept optional remember_me property', () => {
        // Given
        const loginRequest: LoginRequestDTO = {
          identifier: 'user@example.com',
          password: 'password123',
          remember_me: true,
        };

        // Then
        expect(loginRequest.remember_me).toBe(true);
        expect(typeof loginRequest.remember_me).toBe('boolean');
      });

      it('should work without optional remember_me property', () => {
        // Given
        const loginRequest: LoginRequestDTO = {
          identifier: 'user@example.com',
          password: 'password123',
        };

        // Then
        expect(loginRequest.remember_me).toBeUndefined();
      });

      it('should accept email object as identifier', () => {
        // Given
        const loginRequest: LoginRequestDTO = {
          identifier: { email: 'user@example.com' },
          password: 'password123',
        };

        // Then
        expect(typeof loginRequest.identifier).toBe('object');
        expect(loginRequest.identifier).toEqual({ email: 'user@example.com' });
      });

      it('should accept username object as identifier', () => {
        // Given
        const loginRequest: LoginRequestDTO = {
          identifier: { username: 'john_doe' },
          password: 'password123',
        };

        // Then
        expect(typeof loginRequest.identifier).toBe('object');
        expect(loginRequest.identifier).toEqual({ username: 'john_doe' });
      });
    });

    describe('serialization', () => {
      it('should serialize to JSON correctly with string identifier', () => {
        // Given
        const loginRequest: LoginRequestDTO = {
          identifier: 'user@example.com',
          password: 'password123',
          remember_me: true,
        };

        // When
        const json = JSON.stringify(loginRequest);
        const parsed = JSON.parse(json);

        // Then
        expect(parsed.identifier).toBe('user@example.com');
        expect(parsed.password).toBe('password123');
        expect(parsed.remember_me).toBe(true);
      });

      it('should serialize to JSON correctly with email object identifier', () => {
        // Given
        const loginRequest: LoginRequestDTO = {
          identifier: { email: 'user@example.com' },
          password: 'password123',
        };

        // When
        const json = JSON.stringify(loginRequest);
        const parsed = JSON.parse(json);

        // Then
        expect(parsed.identifier).toEqual({ email: 'user@example.com' });
        expect(parsed.password).toBe('password123');
      });

      it('should deserialize from JSON correctly', () => {
        // Given
        const jsonString = JSON.stringify({
          identifier: 'user@example.com',
          password: 'password123',
          remember_me: false,
        });

        // When
        const parsed: LoginRequestDTO = JSON.parse(jsonString);

        // Then
        expect(parsed.identifier).toBe('user@example.com');
        expect(parsed.password).toBe('password123');
        expect(parsed.remember_me).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle empty string identifier', () => {
        // Given
        const loginRequest: LoginRequestDTO = {
          identifier: '',
          password: 'password123',
        };

        // Then
        expect(loginRequest.identifier).toBe('');
        expect(typeof loginRequest.identifier).toBe('string');
      });

      it('should handle empty password', () => {
        // Given
        const loginRequest: LoginRequestDTO = {
          identifier: 'user@example.com',
          password: '',
        };

        // Then
        expect(loginRequest.password).toBe('');
        expect(typeof loginRequest.password).toBe('string');
      });

      it('should handle special characters in password', () => {
        // Given
        const specialPassword = 'P@ssw0rd!#$%^&*()';
        const loginRequest: LoginRequestDTO = {
          identifier: 'user@example.com',
          password: specialPassword,
        };

        // Then
        expect(loginRequest.password).toBe(specialPassword);
      });

      it('should handle unicode characters in identifier', () => {
        // Given
        const unicodeEmail = 'üser@éxample.com';
        const loginRequest: LoginRequestDTO = {
          identifier: unicodeEmail,
          password: 'password123',
        };

        // Then
        expect(loginRequest.identifier).toBe(unicodeEmail);
      });
    });
  });

  describe('LoginResponseDTO', () => {
    const mockLoginResponse: LoginResponseDTO = {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      token_type: 'Bearer',
      expires_in: 3600,
      user: {
        id: 123,
        username: 'john_doe',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        status: 'active',
        is_email_confirmed: true,
        profile_completed: true,
        email_notifications_enabled: true,
        system_notifications_enabled: true,
        task_notifications_enabled: false,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
        role_id: 1,
        role_name: 'Admin',
        last_activity_at: '2025-01-02T12:00:00Z',
      },
    };

    describe('structure validation', () => {
      it('should have all required token properties', () => {
        // Then
        expect(mockLoginResponse.access_token).toBeDefined();
        expect(mockLoginResponse.refresh_token).toBeDefined();
        expect(mockLoginResponse.token_type).toBeDefined();
        expect(mockLoginResponse.expires_in).toBeDefined();
        expect(typeof mockLoginResponse.access_token).toBe('string');
        expect(typeof mockLoginResponse.refresh_token).toBe('string');
        expect(typeof mockLoginResponse.token_type).toBe('string');
        expect(typeof mockLoginResponse.expires_in).toBe('number');
      });

      it('should have all required user properties', () => {
        // Given
        const user = mockLoginResponse.user;

        // Then
        expect(user.id).toBeDefined();
        expect(user.username).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.first_name).toBeDefined();
        expect(user.last_name).toBeDefined();
        expect(user.full_name).toBeDefined();
        expect(user.status).toBeDefined();
        expect(user.role_id).toBeDefined();
        expect(user.role_name).toBeDefined();

        expect(typeof user.id).toBe('number');
        expect(typeof user.username).toBe('string');
        expect(typeof user.email).toBe('string');
        expect(typeof user.role_id).toBe('number');
        expect(typeof user.role_name).toBe('string');
      });

      it('should have all boolean user properties', () => {
        // Given
        const user = mockLoginResponse.user;

        // Then
        expect(typeof user.is_email_confirmed).toBe('boolean');
        expect(typeof user.profile_completed).toBe('boolean');
        expect(typeof user.email_notifications_enabled).toBe('boolean');
        expect(typeof user.system_notifications_enabled).toBe('boolean');
        expect(typeof user.task_notifications_enabled).toBe('boolean');
        expect(typeof user.is_active).toBe('boolean');
      });

      it('should have all date string properties', () => {
        // Given
        const user = mockLoginResponse.user;

        // Then
        expect(typeof user.created_at).toBe('string');
        expect(typeof user.updated_at).toBe('string');
        expect(typeof user.last_activity_at).toBe('string');
      });
    });

    describe('serialization', () => {
      it('should serialize to JSON correctly', () => {
        // When
        const json = JSON.stringify(mockLoginResponse);
        const parsed = JSON.parse(json);

        // Then
        expect(parsed.access_token).toBe(mockLoginResponse.access_token);
        expect(parsed.refresh_token).toBe(mockLoginResponse.refresh_token);
        expect(parsed.token_type).toBe(mockLoginResponse.token_type);
        expect(parsed.expires_in).toBe(mockLoginResponse.expires_in);
        expect(parsed.user).toEqual(mockLoginResponse.user);
      });

      it('should deserialize from JSON correctly', () => {
        // Given
        const jsonString = JSON.stringify(mockLoginResponse);

        // When
        const parsed: LoginResponseDTO = JSON.parse(jsonString);

        // Then
        expect(parsed).toEqual(mockLoginResponse);
        expect(parsed.user.id).toBe(123);
        expect(parsed.user.email).toBe('john@example.com');
        expect(parsed.expires_in).toBe(3600);
      });

      it('should preserve data types after serialization round-trip', () => {
        // When
        const json = JSON.stringify(mockLoginResponse);
        const parsed: LoginResponseDTO = JSON.parse(json);

        // Then
        expect(typeof parsed.expires_in).toBe('number');
        expect(typeof parsed.user.id).toBe('number');
        expect(typeof parsed.user.is_active).toBe('boolean');
        expect(typeof parsed.user.email).toBe('string');
      });
    });

    describe('edge cases', () => {
      it('should handle empty token strings', () => {
        // Given
        const responseWithEmptyTokens: LoginResponseDTO = {
          ...mockLoginResponse,
          access_token: '',
          refresh_token: '',
        };

        // Then
        expect(responseWithEmptyTokens.access_token).toBe('');
        expect(responseWithEmptyTokens.refresh_token).toBe('');
      });

      it('should handle zero expires_in', () => {
        // Given
        const responseWithZeroExpiry: LoginResponseDTO = {
          ...mockLoginResponse,
          expires_in: 0,
        };

        // Then
        expect(responseWithZeroExpiry.expires_in).toBe(0);
        expect(typeof responseWithZeroExpiry.expires_in).toBe('number');
      });

      it('should handle user with minimal data', () => {
        // Given
        const responseWithMinimalUser: LoginResponseDTO = {
          ...mockLoginResponse,
          user: {
            ...mockLoginResponse.user,
            first_name: '',
            last_name: '',
            full_name: '',
          },
        };

        // Then
        expect(responseWithMinimalUser.user.first_name).toBe('');
        expect(responseWithMinimalUser.user.last_name).toBe('');
        expect(responseWithMinimalUser.user.full_name).toBe('');
      });

      it('should handle special characters in user data', () => {
        // Given
        const responseWithSpecialChars: LoginResponseDTO = {
          ...mockLoginResponse,
          user: {
            ...mockLoginResponse.user,
            username: 'user_with_émojis_🚀',
            email: 'special+chars@example.com',
            first_name: 'José',
            last_name: 'García-López',
          },
        };

        // Then
        expect(responseWithSpecialChars.user.username).toBe('user_with_émojis_🚀');
        expect(responseWithSpecialChars.user.email).toBe('special+chars@example.com');
        expect(responseWithSpecialChars.user.first_name).toBe('José');
        expect(responseWithSpecialChars.user.last_name).toBe('García-López');
      });

      it('should handle boolean edge cases', () => {
        // Given
        const responseWithFalseFlags: LoginResponseDTO = {
          ...mockLoginResponse,
          user: {
            ...mockLoginResponse.user,
            is_email_confirmed: false,
            profile_completed: false,
            is_active: false,
          },
        };

        // Then
        expect(responseWithFalseFlags.user.is_email_confirmed).toBe(false);
        expect(responseWithFalseFlags.user.profile_completed).toBe(false);
        expect(responseWithFalseFlags.user.is_active).toBe(false);
      });
    });

    describe('data consistency', () => {
      it('should maintain consistency between user properties', () => {
        // Given
        const user = mockLoginResponse.user;

        // Then
        expect(user.full_name).toBe(`${user.first_name} ${user.last_name}`);
        expect(user.is_active).toBe(true);
        expect(user.status).toBe('active');
      });

      it('should have valid date formats', () => {
        // Given
        const user = mockLoginResponse.user;

        // Then
        expect(new Date(user.created_at)).toBeInstanceOf(Date);
        expect(new Date(user.updated_at)).toBeInstanceOf(Date);
        expect(new Date(user.last_activity_at)).toBeInstanceOf(Date);
        expect(isNaN(new Date(user.created_at).getTime())).toBe(false);
      });

      it('should have positive numeric values where appropriate', () => {
        // Then
        expect(mockLoginResponse.user.id).toBeGreaterThan(0);
        expect(mockLoginResponse.user.role_id).toBeGreaterThan(0);
        expect(mockLoginResponse.expires_in).toBeGreaterThan(0);
      });
    });
  });
});
