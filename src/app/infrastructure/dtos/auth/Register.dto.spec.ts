import { RegisterRequestDTO, RegisterResponseDTO } from './Register.dto';
import { LoginResponseDTO } from './Login.dto';

describe('Register DTOs - Infrastructure Tests', () => {
  describe('RegisterRequestDTO', () => {
    const mockRegisterRequest: RegisterRequestDTO = {
      username: 'john_doe',
      email: 'john@example.com',
      password: 'SecurePassword123!',
      password_confirm: 'SecurePassword123!',
      first_name: 'John',
      last_name: 'Doe',
      role_id: 2,
    };

    describe('structure validation', () => {
      it('should have all required properties', () => {
        // Then
        expect(mockRegisterRequest.username).toBeDefined();
        expect(mockRegisterRequest.email).toBeDefined();
        expect(mockRegisterRequest.password).toBeDefined();
        expect(mockRegisterRequest.password_confirm).toBeDefined();
        expect(mockRegisterRequest.first_name).toBeDefined();
        expect(mockRegisterRequest.last_name).toBeDefined();
      });

      it('should have correct data types for required properties', () => {
        // Then
        expect(typeof mockRegisterRequest.username).toBe('string');
        expect(typeof mockRegisterRequest.email).toBe('string');
        expect(typeof mockRegisterRequest.password).toBe('string');
        expect(typeof mockRegisterRequest.password_confirm).toBe('string');
        expect(typeof mockRegisterRequest.first_name).toBe('string');
        expect(typeof mockRegisterRequest.last_name).toBe('string');
      });

      it('should accept optional role_id as number', () => {
        // Given
        const requestWithRoleId: RegisterRequestDTO = {
          ...mockRegisterRequest,
          role_id: 3,
        };

        // Then
        expect(requestWithRoleId.role_id).toBe(3);
        expect(typeof requestWithRoleId.role_id).toBe('number');
      });

      it('should accept optional role_id as null', () => {
        // Given
        const requestWithNullRole: RegisterRequestDTO = {
          ...mockRegisterRequest,
          role_id: null,
        };

        // Then
        expect(requestWithNullRole.role_id).toBeNull();
      });

      it('should work without optional role_id property', () => {
        // Given
        const requestWithoutRole: RegisterRequestDTO = {
          username: 'jane_doe',
          email: 'jane@example.com',
          password: 'Password123!',
          password_confirm: 'Password123!',
          first_name: 'Jane',
          last_name: 'Doe',
        };

        // Then
        expect(requestWithoutRole.role_id).toBeUndefined();
        expect(requestWithoutRole.username).toBe('jane_doe');
      });

      it('should accept valid email formats', () => {
        // Given
        const validEmails = [
          'user@example.com',
          'user.name@example.com',
          'user+tag@example.co.uk',
          'user123@sub.example.org',
        ];

        // Then
        validEmails.forEach((email) => {
          const request: RegisterRequestDTO = {
            ...mockRegisterRequest,
            email,
          };
          expect(request.email).toBe(email);
          expect(request.email).toContain('@');
        });
      });

      it('should accept matching passwords', () => {
        // Given
        const password = 'MatchingPassword123!';
        const request: RegisterRequestDTO = {
          ...mockRegisterRequest,
          password,
          password_confirm: password,
        };

        // Then
        expect(request.password).toBe(request.password_confirm);
      });
    });

    describe('serialization', () => {
      it('should serialize to JSON correctly', () => {
        // When
        const json = JSON.stringify(mockRegisterRequest);
        const parsed = JSON.parse(json);

        // Then
        expect(parsed.username).toBe(mockRegisterRequest.username);
        expect(parsed.email).toBe(mockRegisterRequest.email);
        expect(parsed.password).toBe(mockRegisterRequest.password);
        expect(parsed.password_confirm).toBe(mockRegisterRequest.password_confirm);
        expect(parsed.first_name).toBe(mockRegisterRequest.first_name);
        expect(parsed.last_name).toBe(mockRegisterRequest.last_name);
        expect(parsed.role_id).toBe(mockRegisterRequest.role_id);
      });

      it('should deserialize from JSON correctly', () => {
        // Given
        const jsonString = JSON.stringify(mockRegisterRequest);

        // When
        const parsed: RegisterRequestDTO = JSON.parse(jsonString);

        // Then
        expect(parsed).toEqual(mockRegisterRequest);
        expect(parsed.role_id).toBe(2);
      });

      it('should preserve data types after serialization round-trip', () => {
        // When
        const json = JSON.stringify(mockRegisterRequest);
        const parsed: RegisterRequestDTO = JSON.parse(json);

        // Then
        expect(typeof parsed.username).toBe('string');
        expect(typeof parsed.email).toBe('string');
        expect(typeof parsed.password).toBe('string');
        expect(typeof parsed.password_confirm).toBe('string');
        expect(typeof parsed.first_name).toBe('string');
        expect(typeof parsed.last_name).toBe('string');
        expect(typeof parsed.role_id).toBe('number');
      });

      it('should handle null role_id in serialization', () => {
        // Given
        const requestWithNullRole: RegisterRequestDTO = {
          ...mockRegisterRequest,
          role_id: null,
        };

        // When
        const json = JSON.stringify(requestWithNullRole);
        const parsed: RegisterRequestDTO = JSON.parse(json);

        // Then
        expect(parsed.role_id).toBeNull();
      });

      it('should handle undefined role_id in serialization', () => {
        // Given
        const { role_id, ...requestWithoutRole } = mockRegisterRequest;

        // When
        const json = JSON.stringify(requestWithoutRole);
        const parsed: RegisterRequestDTO = JSON.parse(json);

        // Then
        expect(parsed.role_id).toBeUndefined();
      });
    });

    describe('edge cases', () => {
      it('should handle empty string values', () => {
        // Given
        const requestWithEmptyStrings: RegisterRequestDTO = {
          username: '',
          email: '',
          password: '',
          password_confirm: '',
          first_name: '',
          last_name: '',
          role_id: 1,
        };

        // Then
        expect(requestWithEmptyStrings.username).toBe('');
        expect(requestWithEmptyStrings.email).toBe('');
        expect(requestWithEmptyStrings.password).toBe('');
        expect(requestWithEmptyStrings.password_confirm).toBe('');
        expect(requestWithEmptyStrings.first_name).toBe('');
        expect(requestWithEmptyStrings.last_name).toBe('');
      });

      it('should handle special characters in string fields', () => {
        // Given
        const requestWithSpecialChars: RegisterRequestDTO = {
          username: 'user_with_émojis_🚀',
          email: 'special+chars@example.com',
          password: 'P@ssw0rd!#$%^&*()',
          password_confirm: 'P@ssw0rd!#$%^&*()',
          first_name: 'José',
          last_name: 'García-López',
          role_id: 1,
        };

        // Then
        expect(requestWithSpecialChars.username).toBe('user_with_émojis_🚀');
        expect(requestWithSpecialChars.email).toBe('special+chars@example.com');
        expect(requestWithSpecialChars.password).toBe('P@ssw0rd!#$%^&*()');
        expect(requestWithSpecialChars.first_name).toBe('José');
        expect(requestWithSpecialChars.last_name).toBe('García-López');
      });

      it('should handle very long string values', () => {
        // Given
        const longString = 'a'.repeat(1000);
        const requestWithLongStrings: RegisterRequestDTO = {
          username: longString,
          email: `${longString}@example.com`,
          password: longString,
          password_confirm: longString,
          first_name: longString,
          last_name: longString,
        };

        // Then
        expect(requestWithLongStrings.username.length).toBe(1000);
        expect(requestWithLongStrings.first_name.length).toBe(1000);
        expect(requestWithLongStrings.password.length).toBe(1000);
      });

      it('should handle zero role_id', () => {
        // Given
        const requestWithZeroRole: RegisterRequestDTO = {
          ...mockRegisterRequest,
          role_id: 0,
        };

        // Then
        expect(requestWithZeroRole.role_id).toBe(0);
        expect(typeof requestWithZeroRole.role_id).toBe('number');
      });

      it('should handle negative role_id', () => {
        // Given
        const requestWithNegativeRole: RegisterRequestDTO = {
          ...mockRegisterRequest,
          role_id: -1,
        };

        // Then
        expect(requestWithNegativeRole.role_id).toBe(-1);
        expect(typeof requestWithNegativeRole.role_id).toBe('number');
      });

      it('should handle very large role_id', () => {
        // Given
        const requestWithLargeRole: RegisterRequestDTO = {
          ...mockRegisterRequest,
          role_id: Number.MAX_SAFE_INTEGER,
        };

        // Then
        expect(requestWithLargeRole.role_id).toBe(Number.MAX_SAFE_INTEGER);
      });

      it('should handle mismatched passwords', () => {
        // Given
        const requestWithMismatchedPasswords: RegisterRequestDTO = {
          ...mockRegisterRequest,
          password: 'Password123!',
          password_confirm: 'DifferentPassword456!',
        };

        // Then
        expect(requestWithMismatchedPasswords.password).not.toBe(
          requestWithMismatchedPasswords.password_confirm
        );
        expect(requestWithMismatchedPasswords.password).toBe('Password123!');
        expect(requestWithMismatchedPasswords.password_confirm).toBe('DifferentPassword456!');
      });

      it('should handle unicode characters in all fields', () => {
        // Given
        const requestWithUnicode: RegisterRequestDTO = {
          username: 'üser_näme_🌟',
          email: 'üser@éxample.com',
          password: 'Pässwörd123!🔐',
          password_confirm: 'Pässwörd123!🔐',
          first_name: 'Jöhn',
          last_name: 'Döe',
          role_id: 1,
        };

        // Then
        expect(requestWithUnicode.username).toBe('üser_näme_🌟');
        expect(requestWithUnicode.email).toBe('üser@éxample.com');
        expect(requestWithUnicode.password).toBe('Pässwörd123!🔐');
        expect(requestWithUnicode.first_name).toBe('Jöhn');
        expect(requestWithUnicode.last_name).toBe('Döe');
      });
    });

    describe('data validation scenarios', () => {
      it('should handle common username patterns', () => {
        // Given
        const usernamePatterns = [
          'user123',
          'user_name',
          'user-name',
          'user.name',
          'UserName',
          'user@domain', // Some systems allow email as username
        ];

        // Then
        usernamePatterns.forEach((username) => {
          const request: RegisterRequestDTO = {
            ...mockRegisterRequest,
            username,
          };
          expect(request.username).toBe(username);
        });
      });

      it('should handle various email formats', () => {
        // Given
        const emailFormats = [
          'simple@example.com',
          'user.name@example.com',
          'user+tag@example.com',
          'user123@sub.example.org',
          'user@example-domain.com',
          'user@123.456.789.012', // IP address domain
        ];

        // Then
        emailFormats.forEach((email) => {
          const request: RegisterRequestDTO = {
            ...mockRegisterRequest,
            email,
          };
          expect(request.email).toBe(email);
          expect(request.email).toContain('@');
        });
      });

      it('should handle different password complexity patterns', () => {
        // Given
        const passwordPatterns = [
          'SimplePass123',
          'Complex!P@ssw0rd#2023',
          'pass_with_underscores_123',
          'PassWithMixedCASE123',
          'P@$$w0rd!@#$%^&*()',
        ];

        // Then
        passwordPatterns.forEach((password) => {
          const request: RegisterRequestDTO = {
            ...mockRegisterRequest,
            password,
            password_confirm: password,
          };
          expect(request.password).toBe(password);
          expect(request.password_confirm).toBe(password);
        });
      });

      it('should handle name variations', () => {
        // Given
        const nameVariations = [
          { first: 'John', last: 'Doe' },
          { first: 'María José', last: 'García López' },
          { first: 'Jean-Pierre', last: "O'Connor" },
          { first: '李', last: '小明' },
          { first: 'محمد', last: 'الأحمد' },
        ];

        // Then
        nameVariations.forEach(({ first, last }) => {
          const request: RegisterRequestDTO = {
            ...mockRegisterRequest,
            first_name: first,
            last_name: last,
          };
          expect(request.first_name).toBe(first);
          expect(request.last_name).toBe(last);
        });
      });
    });
  });

  describe('RegisterResponseDTO', () => {
    describe('type alias validation', () => {
      it('should be equivalent to LoginResponseDTO', () => {
        // Given
        const loginResponse: LoginResponseDTO = {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          token_type: 'Bearer',
          expires_in: 3600,
          user: {
            id: 123,
            username: 'new_user',
            email: 'new@example.com',
            first_name: 'New',
            last_name: 'User',
            full_name: 'New User',
            status: 'active',
            is_email_confirmed: false,
            profile_completed: true,
            email_notifications_enabled: true,
            system_notifications_enabled: true,
            task_notifications_enabled: false,
            is_active: true,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
            role_id: 2,
            role_name: 'User',
            last_activity_at: '2025-01-01T00:00:00Z',
          },
        };

        // When - Assign LoginResponseDTO to RegisterResponseDTO
        const registerResponse: RegisterResponseDTO = loginResponse;

        // Then
        expect(registerResponse).toEqual(loginResponse);
        expect(registerResponse.access_token).toBeDefined();
        expect(registerResponse.user).toBeDefined();
      });

      it('should have all LoginResponseDTO properties', () => {
        // Given
        const registerResponse: RegisterResponseDTO = {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          token_type: 'Bearer',
          expires_in: 3600,
          user: {
            id: 456,
            username: 'registered_user',
            email: 'registered@example.com',
            first_name: 'Registered',
            last_name: 'User',
            full_name: 'Registered User',
            status: 'active',
            is_email_confirmed: false,
            profile_completed: false,
            email_notifications_enabled: true,
            system_notifications_enabled: true,
            task_notifications_enabled: true,
            is_active: true,
            created_at: '2025-01-01T12:00:00Z',
            updated_at: '2025-01-01T12:00:00Z',
            role_id: 2,
            role_name: 'User',
            last_activity_at: '2025-01-01T12:00:00Z',
          },
        };

        // Then
        expect(registerResponse.access_token).toBeDefined();
        expect(registerResponse.refresh_token).toBeDefined();
        expect(registerResponse.token_type).toBeDefined();
        expect(registerResponse.expires_in).toBeDefined();
        expect(registerResponse.user).toBeDefined();
        expect(registerResponse.user.id).toBeDefined();
        expect(registerResponse.user.username).toBeDefined();
        expect(registerResponse.user.email).toBeDefined();
      });

      it('should serialize and deserialize like LoginResponseDTO', () => {
        // Given
        const registerResponse: RegisterResponseDTO = {
          access_token: 'register-access-token',
          refresh_token: 'register-refresh-token',
          token_type: 'Bearer',
          expires_in: 7200,
          user: {
            id: 789,
            username: 'serialized_user',
            email: 'serialized@example.com',
            first_name: 'Serialized',
            last_name: 'User',
            full_name: 'Serialized User',
            status: 'active',
            is_email_confirmed: true,
            profile_completed: true,
            email_notifications_enabled: false,
            system_notifications_enabled: true,
            task_notifications_enabled: false,
            is_active: true,
            created_at: '2025-01-01T18:00:00Z',
            updated_at: '2025-01-01T18:00:00Z',
            role_id: 1,
            role_name: 'Admin',
            last_activity_at: '2025-01-01T18:00:00Z',
          },
        };

        // When
        const json = JSON.stringify(registerResponse);
        const parsed: RegisterResponseDTO = JSON.parse(json);

        // Then
        expect(parsed).toEqual(registerResponse);
        expect(parsed.user.username).toBe('serialized_user');
        expect(parsed.expires_in).toBe(7200);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete registration flow data structures', () => {
      // Given
      const request: RegisterRequestDTO = {
        username: 'integration_user',
        email: 'integration@example.com',
        password: 'IntegrationPass123!',
        password_confirm: 'IntegrationPass123!',
        first_name: 'Integration',
        last_name: 'User',
        role_id: 2,
      };

      const response: RegisterResponseDTO = {
        access_token: 'integration-access-token',
        refresh_token: 'integration-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
        user: {
          id: 999,
          username: request.username,
          email: request.email,
          first_name: request.first_name,
          last_name: request.last_name,
          full_name: `${request.first_name} ${request.last_name}`,
          status: 'active',
          is_email_confirmed: false,
          profile_completed: true,
          email_notifications_enabled: true,
          system_notifications_enabled: true,
          task_notifications_enabled: true,
          is_active: true,
          created_at: '2025-01-01T20:00:00Z',
          updated_at: '2025-01-01T20:00:00Z',
          role_id: request.role_id ?? 2,
          role_name: 'User',
          last_activity_at: '2025-01-01T20:00:00Z',
        },
      };

      // When
      const requestJson = JSON.stringify(request);
      const responseJson = JSON.stringify(response);
      const parsedRequest: RegisterRequestDTO = JSON.parse(requestJson);
      const parsedResponse: RegisterResponseDTO = JSON.parse(responseJson);

      // Then
      expect(parsedRequest).toEqual(request);
      expect(parsedResponse).toEqual(response);
      expect(parsedResponse.user.username).toBe(parsedRequest.username);
      expect(parsedResponse.user.email).toBe(parsedRequest.email);
      expect(parsedResponse.user.role_id).toBe(parsedRequest.role_id ?? 2);
    });

    it('should maintain data consistency between request and response', () => {
      // Given
      const request: RegisterRequestDTO = {
        username: 'consistency_test',
        email: 'consistency@example.com',
        password: 'ConsistentPass123!',
        password_confirm: 'ConsistentPass123!',
        first_name: 'Consistent',
        last_name: 'Test',
      };

      // When - Simulate successful registration response
      const response: RegisterResponseDTO = {
        access_token: 'consistent-access-token',
        refresh_token: 'consistent-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
        user: {
          id: 1001,
          username: request.username,
          email: request.email,
          first_name: request.first_name,
          last_name: request.last_name,
          full_name: `${request.first_name} ${request.last_name}`,
          status: 'active',
          is_email_confirmed: false,
          profile_completed: false,
          email_notifications_enabled: true,
          system_notifications_enabled: true,
          task_notifications_enabled: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          role_id: 2, // Default role
          role_name: 'User',
          last_activity_at: new Date().toISOString(),
        },
      };

      // Then
      expect(response.user.username).toBe(request.username);
      expect(response.user.email).toBe(request.email);
      expect(response.user.first_name).toBe(request.first_name);
      expect(response.user.last_name).toBe(request.last_name);
      expect(response.user.full_name).toBe(`${request.first_name} ${request.last_name}`);
    });
  });
});
