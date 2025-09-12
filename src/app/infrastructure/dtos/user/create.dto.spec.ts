/**
 * @fileoverview Create User DTO Tests - Infrastructure Layer
 *
 * @description Tests for Create User DTOs used in user creation operations.
 * These tests validate request and response DTOs for user creation endpoints.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-09-12
 */

import { CreateUserRequestDTO, CreateUserResponseDTO } from './create.dto';

describe('Create User DTOs - Infrastructure Tests', () => {
  describe('CreateUserRequestDTO', () => {
    const mockCreateUserRequest: CreateUserRequestDTO = {
      username: 'john_doe',
      email: 'john.doe@example.com',
      password: 'SecurePassword123!',
      first_name: 'John',
      last_name: 'Doe',
      role_id: 2,
    };

    describe('structure validation', () => {
      it('should have all required properties', () => {
        // Then
        expect(mockCreateUserRequest.username).toBeDefined();
        expect(mockCreateUserRequest.email).toBeDefined();
        expect(mockCreateUserRequest.password).toBeDefined();
        expect(mockCreateUserRequest.first_name).toBeDefined();
        expect(mockCreateUserRequest.last_name).toBeDefined();
        expect(mockCreateUserRequest.role_id).toBeDefined();
      });

      it('should have correct property types', () => {
        // Then
        expect(typeof mockCreateUserRequest.username).toBe('string');
        expect(typeof mockCreateUserRequest.email).toBe('string');
        expect(typeof mockCreateUserRequest.password).toBe('string');
        expect(typeof mockCreateUserRequest.first_name).toBe('string');
        expect(typeof mockCreateUserRequest.last_name).toBe('string');
        expect(typeof mockCreateUserRequest.role_id).toBe('number');
      });

      it('should accept valid usernames', () => {
        // Given
        const validUsernames = [
          'john_doe',
          'jane123',
          'user-name',
          'test.user',
          'admin',
          'super_admin_user',
        ];

        validUsernames.forEach((username) => {
          const request: CreateUserRequestDTO = {
            ...mockCreateUserRequest,
            username: username,
          };

          // Then
          expect(request.username).toBe(username);
          expect(typeof request.username).toBe('string');
        });
      });

      it('should accept valid email formats', () => {
        // Given
        const validEmails = [
          'user@domain.com',
          'test.email+tag@example.org',
          'user123@subdomain.domain.co.uk',
          'firstname.lastname@company.com',
        ];

        validEmails.forEach((email) => {
          const request: CreateUserRequestDTO = {
            ...mockCreateUserRequest,
            email: email,
          };

          // Then
          expect(request.email).toBe(email);
          expect(typeof request.email).toBe('string');
        });
      });

      it('should accept various role IDs', () => {
        // Given
        const roleIds = [1, 2, 3, 10, 100, 999];

        roleIds.forEach((roleId) => {
          const request: CreateUserRequestDTO = {
            ...mockCreateUserRequest,
            role_id: roleId,
          };

          // Then
          expect(request.role_id).toBe(roleId);
          expect(typeof request.role_id).toBe('number');
        });
      });
    });

    describe('serialization', () => {
      it('should serialize to JSON correctly', () => {
        // When
        const json = JSON.stringify(mockCreateUserRequest);
        const parsed = JSON.parse(json);

        // Then
        expect(parsed.username).toBe(mockCreateUserRequest.username);
        expect(parsed.email).toBe(mockCreateUserRequest.email);
        expect(parsed.password).toBe(mockCreateUserRequest.password);
        expect(parsed.first_name).toBe(mockCreateUserRequest.first_name);
        expect(parsed.last_name).toBe(mockCreateUserRequest.last_name);
        expect(parsed.role_id).toBe(mockCreateUserRequest.role_id);
        expect(parsed).toEqual(mockCreateUserRequest);
      });

      it('should deserialize from JSON correctly', () => {
        // Given
        const jsonString = JSON.stringify(mockCreateUserRequest);

        // When
        const parsed: CreateUserRequestDTO = JSON.parse(jsonString);

        // Then
        expect(parsed).toEqual(mockCreateUserRequest);
        expect(parsed.username).toBe('john_doe');
        expect(parsed.email).toBe('john.doe@example.com');
        expect(parsed.role_id).toBe(2);
      });

      it('should preserve data types after serialization round-trip', () => {
        // When
        const json = JSON.stringify(mockCreateUserRequest);
        const parsed: CreateUserRequestDTO = JSON.parse(json);

        // Then
        expect(typeof parsed.username).toBe('string');
        expect(typeof parsed.email).toBe('string');
        expect(typeof parsed.password).toBe('string');
        expect(typeof parsed.first_name).toBe('string');
        expect(typeof parsed.last_name).toBe('string');
        expect(typeof parsed.role_id).toBe('number');
        expect(parsed).toEqual(mockCreateUserRequest);
      });
    });

    describe('edge cases', () => {
      it('should handle zero and negative role IDs', () => {
        // Given
        const edgeRoleIds = [0, -1, -999];

        edgeRoleIds.forEach((roleId) => {
          const request: CreateUserRequestDTO = {
            ...mockCreateUserRequest,
            role_id: roleId,
          };

          // Then
          expect(request.role_id).toBe(roleId);
          expect(typeof request.role_id).toBe('number');
        });
      });

      it('should handle very large role IDs', () => {
        // Given
        const request: CreateUserRequestDTO = {
          ...mockCreateUserRequest,
          role_id: Number.MAX_SAFE_INTEGER,
        };

        // Then
        expect(request.role_id).toBe(Number.MAX_SAFE_INTEGER);
        expect(typeof request.role_id).toBe('number');
      });

      it('should handle empty string values', () => {
        // Given
        const requestWithEmptyStrings: CreateUserRequestDTO = {
          ...mockCreateUserRequest,
          username: '',
          first_name: '',
          last_name: '',
          password: '',
        };

        // Then
        expect(requestWithEmptyStrings.username).toBe('');
        expect(requestWithEmptyStrings.first_name).toBe('');
        expect(requestWithEmptyStrings.last_name).toBe('');
        expect(requestWithEmptyStrings.password).toBe('');
      });

      it('should handle special characters in string fields', () => {
        // Given
        const requestWithSpecialChars: CreateUserRequestDTO = {
          ...mockCreateUserRequest,
          username: 'user_123-special!',
          first_name: 'José María',
          last_name: 'González-López',
          email: 'josé.maría@domain.com',
          password: 'P@ssw0rd!#$%',
        };

        // Then
        expect(requestWithSpecialChars.username).toContain('!');
        expect(requestWithSpecialChars.first_name).toContain('é');
        expect(requestWithSpecialChars.last_name).toContain('-');
        expect(requestWithSpecialChars.email).toContain('@');
        expect(requestWithSpecialChars.password).toContain('#');
      });

      it('should handle long string values', () => {
        // Given
        const longValues = {
          username: 'a'.repeat(150),
          first_name: 'FirstName'.repeat(20),
          last_name: 'LastName'.repeat(20),
          password: 'SecurePassword!123'.repeat(10),
        };

        const requestWithLongValues: CreateUserRequestDTO = {
          ...mockCreateUserRequest,
          ...longValues,
        };

        // Then
        expect(requestWithLongValues.username.length).toBe(150);
        expect(requestWithLongValues.first_name.length).toBe(180);
        expect(requestWithLongValues.last_name.length).toBe(160);
        expect(requestWithLongValues.password.length).toBe(180);
      });

      it('should handle various password formats', () => {
        // Given
        const passwords = [
          'simple',
          'Complex123!',
          'Very@Long#Password$With%Many&Characters',
          '12345',
          'UPPERCASE',
          'lowercase',
          'MixedCaseWithNumbers123',
        ];

        passwords.forEach((password) => {
          const request: CreateUserRequestDTO = {
            ...mockCreateUserRequest,
            password: password,
          };

          // Then
          expect(request.password).toBe(password);
          expect(typeof request.password).toBe('string');
        });
      });
    });

    describe('data consistency', () => {
      it('should maintain property integrity after serialization', () => {
        // Given
        const originalRequest: CreateUserRequestDTO = { ...mockCreateUserRequest };

        // When
        const json = JSON.stringify(originalRequest);
        const parsed: CreateUserRequestDTO = JSON.parse(json);

        // Then
        expect(parsed.username).toBe(originalRequest.username);
        expect(parsed.email).toBe(originalRequest.email);
        expect(parsed.password).toBe(originalRequest.password);
        expect(parsed.role_id).toBe(originalRequest.role_id);
        expect(parsed).toEqual(originalRequest);
      });

      it('should handle comprehensive user data', () => {
        // Given
        const comprehensiveRequest: CreateUserRequestDTO = {
          username: 'comprehensive_user_123',
          email: 'comprehensive.user@domain.co.uk',
          password: 'VerySecure!Password123#',
          first_name: 'María José',
          last_name: 'González-Pérez',
          role_id: 42,
        };

        // When
        const json = JSON.stringify(comprehensiveRequest);
        const parsed: CreateUserRequestDTO = JSON.parse(json);

        // Then
        expect(parsed).toEqual(comprehensiveRequest);
        expect(parsed.username).toContain('_');
        expect(parsed.email).toContain('.co.uk');
        expect(parsed.first_name).toContain('í');
        expect(parsed.last_name).toContain('-');
        expect(parsed.password).toContain('#');
      });
    });
  });

  describe('CreateUserResponseDTO', () => {
    const mockCreateUserResponse: CreateUserResponseDTO = {
      id: 123,
      username: 'john_doe',
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe',
      full_name: 'John Doe',
      status: 'active',
      is_email_confirmed: false,
      profile_completed: false,
      email_notifications_enabled: true,
      system_notifications_enabled: true,
      task_notifications_enabled: true,
      is_active: true,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      role_id: 2,
      role_name: 'Editor',
      last_activity_at: null,
    };

    describe('structure validation', () => {
      it('should have all required properties', () => {
        // Then
        expect(mockCreateUserResponse.id).toBeDefined();
        expect(mockCreateUserResponse.username).toBeDefined();
        expect(mockCreateUserResponse.email).toBeDefined();
        expect(mockCreateUserResponse.first_name).toBeDefined();
        expect(mockCreateUserResponse.last_name).toBeDefined();
        expect(mockCreateUserResponse.full_name).toBeDefined();
        expect(mockCreateUserResponse.status).toBeDefined();
        expect(mockCreateUserResponse.is_email_confirmed).toBeDefined();
        expect(mockCreateUserResponse.profile_completed).toBeDefined();
        expect(mockCreateUserResponse.email_notifications_enabled).toBeDefined();
        expect(mockCreateUserResponse.system_notifications_enabled).toBeDefined();
        expect(mockCreateUserResponse.task_notifications_enabled).toBeDefined();
        expect(mockCreateUserResponse.is_active).toBeDefined();
        expect(mockCreateUserResponse.created_at).toBeDefined();
        expect(mockCreateUserResponse.updated_at).toBeDefined();
        expect(mockCreateUserResponse.role_id).toBeDefined();
        expect(mockCreateUserResponse.role_name).toBeDefined();
      });

      it('should have correct property types', () => {
        // Then
        expect(typeof mockCreateUserResponse.id).toBe('number');
        expect(typeof mockCreateUserResponse.username).toBe('string');
        expect(typeof mockCreateUserResponse.email).toBe('string');
        expect(typeof mockCreateUserResponse.first_name).toBe('string');
        expect(typeof mockCreateUserResponse.last_name).toBe('string');
        expect(typeof mockCreateUserResponse.full_name).toBe('string');
        expect(typeof mockCreateUserResponse.status).toBe('string');
        expect(typeof mockCreateUserResponse.is_email_confirmed).toBe('boolean');
        expect(typeof mockCreateUserResponse.profile_completed).toBe('boolean');
        expect(typeof mockCreateUserResponse.email_notifications_enabled).toBe('boolean');
        expect(typeof mockCreateUserResponse.system_notifications_enabled).toBe('boolean');
        expect(typeof mockCreateUserResponse.task_notifications_enabled).toBe('boolean');
        expect(typeof mockCreateUserResponse.is_active).toBe('boolean');
        expect(typeof mockCreateUserResponse.created_at).toBe('string');
        expect(typeof mockCreateUserResponse.updated_at).toBe('string');
        expect(typeof mockCreateUserResponse.role_id).toBe('number');
        expect(typeof mockCreateUserResponse.role_name).toBe('string');
      });

      it('should handle null last_activity_at correctly', () => {
        // Then
        expect(mockCreateUserResponse.last_activity_at).toBeNull();
      });

      it('should accept various status values', () => {
        // Given
        const statusValues = ['active', 'inactive', 'pending', 'suspended', 'deleted'];

        statusValues.forEach((status) => {
          const response: CreateUserResponseDTO = {
            ...mockCreateUserResponse,
            status: status,
          };

          // Then
          expect(response.status).toBe(status);
          expect(typeof response.status).toBe('string');
        });
      });

      it('should handle different notification preferences', () => {
        // Given
        const notificationConfigs = [
          { email: true, system: true, task: true },
          { email: false, system: false, task: false },
          { email: true, system: false, task: true },
          { email: false, system: true, task: false },
        ];

        notificationConfigs.forEach((config) => {
          const response: CreateUserResponseDTO = {
            ...mockCreateUserResponse,
            email_notifications_enabled: config.email,
            system_notifications_enabled: config.system,
            task_notifications_enabled: config.task,
          };

          // Then
          expect(response.email_notifications_enabled).toBe(config.email);
          expect(response.system_notifications_enabled).toBe(config.system);
          expect(response.task_notifications_enabled).toBe(config.task);
        });
      });
    });

    describe('serialization', () => {
      it('should serialize to JSON correctly', () => {
        // When
        const json = JSON.stringify(mockCreateUserResponse);
        const parsed = JSON.parse(json);

        // Then
        expect(parsed.id).toBe(mockCreateUserResponse.id);
        expect(parsed.username).toBe(mockCreateUserResponse.username);
        expect(parsed.email).toBe(mockCreateUserResponse.email);
        expect(parsed.full_name).toBe(mockCreateUserResponse.full_name);
        expect(parsed.status).toBe(mockCreateUserResponse.status);
        expect(parsed.is_active).toBe(mockCreateUserResponse.is_active);
        expect(parsed.role_id).toBe(mockCreateUserResponse.role_id);
        expect(parsed.role_name).toBe(mockCreateUserResponse.role_name);
        expect(parsed.last_activity_at).toBe(mockCreateUserResponse.last_activity_at);
        expect(parsed).toEqual(mockCreateUserResponse);
      });

      it('should deserialize from JSON correctly', () => {
        // Given
        const jsonString = JSON.stringify(mockCreateUserResponse);

        // When
        const parsed: CreateUserResponseDTO = JSON.parse(jsonString);

        // Then
        expect(parsed).toEqual(mockCreateUserResponse);
        expect(parsed.id).toBe(123);
        expect(parsed.username).toBe('john_doe');
        expect(parsed.role_name).toBe('Editor');
        expect(parsed.last_activity_at).toBeNull();
      });

      it('should preserve data types after serialization round-trip', () => {
        // When
        const json = JSON.stringify(mockCreateUserResponse);
        const parsed: CreateUserResponseDTO = JSON.parse(json);

        // Then
        expect(typeof parsed.id).toBe('number');
        expect(typeof parsed.username).toBe('string');
        expect(typeof parsed.is_active).toBe('boolean');
        expect(typeof parsed.is_email_confirmed).toBe('boolean');
        expect(typeof parsed.profile_completed).toBe('boolean');
        expect(typeof parsed.role_id).toBe('number');
        expect(parsed.last_activity_at).toBeNull();
        expect(parsed).toEqual(mockCreateUserResponse);
      });

      it('should handle non-null last_activity_at in serialization', () => {
        // Given
        const responseWithActivity: CreateUserResponseDTO = {
          ...mockCreateUserResponse,
          last_activity_at: '2024-01-15T09:15:30Z',
        };

        // When
        const json = JSON.stringify(responseWithActivity);
        const parsed: CreateUserResponseDTO = JSON.parse(json);

        // Then
        expect(parsed.last_activity_at).toBe('2024-01-15T09:15:30Z');
        expect(typeof parsed.last_activity_at).toBe('string');
        expect(parsed).toEqual(responseWithActivity);
      });
    });

    describe('edge cases', () => {
      it('should handle zero and negative user IDs', () => {
        // Given
        const edgeIds = [0, -1, -999];

        edgeIds.forEach((id) => {
          const response: CreateUserResponseDTO = {
            ...mockCreateUserResponse,
            id: id,
          };

          // Then
          expect(response.id).toBe(id);
          expect(typeof response.id).toBe('number');
        });
      });

      it('should handle very large user IDs', () => {
        // Given
        const response: CreateUserResponseDTO = {
          ...mockCreateUserResponse,
          id: Number.MAX_SAFE_INTEGER,
        };

        // Then
        expect(response.id).toBe(Number.MAX_SAFE_INTEGER);
        expect(typeof response.id).toBe('number');
      });

      it('should handle empty string values', () => {
        // Given
        const responseWithEmptyStrings: CreateUserResponseDTO = {
          ...mockCreateUserResponse,
          username: '',
          first_name: '',
          last_name: '',
          full_name: '',
          status: '',
          role_name: '',
        };

        // Then
        expect(responseWithEmptyStrings.username).toBe('');
        expect(responseWithEmptyStrings.first_name).toBe('');
        expect(responseWithEmptyStrings.last_name).toBe('');
        expect(responseWithEmptyStrings.full_name).toBe('');
        expect(responseWithEmptyStrings.status).toBe('');
        expect(responseWithEmptyStrings.role_name).toBe('');
      });

      it('should handle all boolean flags as false', () => {
        // Given
        const responseWithAllFalse: CreateUserResponseDTO = {
          ...mockCreateUserResponse,
          is_email_confirmed: false,
          profile_completed: false,
          email_notifications_enabled: false,
          system_notifications_enabled: false,
          task_notifications_enabled: false,
          is_active: false,
        };

        // Then
        expect(responseWithAllFalse.is_email_confirmed).toBe(false);
        expect(responseWithAllFalse.profile_completed).toBe(false);
        expect(responseWithAllFalse.email_notifications_enabled).toBe(false);
        expect(responseWithAllFalse.system_notifications_enabled).toBe(false);
        expect(responseWithAllFalse.task_notifications_enabled).toBe(false);
        expect(responseWithAllFalse.is_active).toBe(false);
      });

      it('should handle all boolean flags as true', () => {
        // Given
        const responseWithAllTrue: CreateUserResponseDTO = {
          ...mockCreateUserResponse,
          is_email_confirmed: true,
          profile_completed: true,
          email_notifications_enabled: true,
          system_notifications_enabled: true,
          task_notifications_enabled: true,
          is_active: true,
        };

        // Then
        expect(responseWithAllTrue.is_email_confirmed).toBe(true);
        expect(responseWithAllTrue.profile_completed).toBe(true);
        expect(responseWithAllTrue.email_notifications_enabled).toBe(true);
        expect(responseWithAllTrue.system_notifications_enabled).toBe(true);
        expect(responseWithAllTrue.task_notifications_enabled).toBe(true);
        expect(responseWithAllTrue.is_active).toBe(true);
      });

      it('should handle special characters in string fields', () => {
        // Given
        const responseWithSpecialChars: CreateUserResponseDTO = {
          ...mockCreateUserResponse,
          username: 'user_123-special!',
          first_name: 'José María',
          last_name: 'González-López',
          full_name: 'José María González-López',
          email: 'josé.maría@domain.com',
          status: 'active-verified',
          role_name: 'Content Manager & Editor',
        };

        // Then
        expect(responseWithSpecialChars.username).toContain('!');
        expect(responseWithSpecialChars.first_name).toContain('é');
        expect(responseWithSpecialChars.last_name).toContain('-');
        expect(responseWithSpecialChars.full_name).toContain('í');
        expect(responseWithSpecialChars.email).toContain('@');
        expect(responseWithSpecialChars.status).toContain('-');
        expect(responseWithSpecialChars.role_name).toContain('&');
      });

      it('should handle various ISO date formats', () => {
        // Given
        const dateFormats = [
          '2024-01-15T10:30:00Z',
          '2023-12-31T23:59:59.999Z',
          '2024-06-15T14:30:45.123Z',
        ];

        dateFormats.forEach((date) => {
          const response: CreateUserResponseDTO = {
            ...mockCreateUserResponse,
            created_at: date,
            updated_at: date,
            last_activity_at: date,
          };

          // Then
          expect(response.created_at).toBe(date);
          expect(response.updated_at).toBe(date);
          expect(response.last_activity_at).toBe(date);
        });
      });
    });

    describe('data consistency', () => {
      it('should maintain property integrity after serialization', () => {
        // Given
        const originalResponse: CreateUserResponseDTO = { ...mockCreateUserResponse };

        // When
        const json = JSON.stringify(originalResponse);
        const parsed: CreateUserResponseDTO = JSON.parse(json);

        // Then
        expect(parsed.id).toBe(originalResponse.id);
        expect(parsed.username).toBe(originalResponse.username);
        expect(parsed.full_name).toBe(originalResponse.full_name);
        expect(parsed.status).toBe(originalResponse.status);
        expect(parsed.role_id).toBe(originalResponse.role_id);
        expect(parsed.role_name).toBe(originalResponse.role_name);
        expect(parsed).toEqual(originalResponse);
      });

      it('should handle comprehensive response data', () => {
        // Given
        const comprehensiveResponse: CreateUserResponseDTO = {
          id: 999,
          username: 'comprehensive_user',
          email: 'comprehensive@test.com',
          first_name: 'María',
          last_name: 'González',
          full_name: 'María González',
          status: 'active-verified',
          is_email_confirmed: true,
          profile_completed: true,
          email_notifications_enabled: false,
          system_notifications_enabled: true,
          task_notifications_enabled: false,
          is_active: true,
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:35:00Z',
          role_id: 3,
          role_name: 'Senior Editor',
          last_activity_at: '2024-01-15T10:32:15Z',
        };

        // When
        const json = JSON.stringify(comprehensiveResponse);
        const parsed: CreateUserResponseDTO = JSON.parse(json);

        // Then
        expect(parsed).toEqual(comprehensiveResponse);
        expect(parsed.first_name).toContain('í');
        expect(parsed.status).toContain('-');
        expect(parsed.email_notifications_enabled).toBe(false);
        expect(parsed.system_notifications_enabled).toBe(true);
        expect(parsed.last_activity_at).toBe('2024-01-15T10:32:15Z');
      });

      it('should maintain consistency between name fields', () => {
        // Given
        const response: CreateUserResponseDTO = {
          ...mockCreateUserResponse,
          first_name: 'John',
          last_name: 'Doe',
          full_name: 'John Doe',
        };

        // Then
        expect(response.full_name).toBe(`${response.first_name} ${response.last_name}`);
        expect(response.full_name).toContain(response.first_name);
        expect(response.full_name).toContain(response.last_name);
      });

      it('should handle edge case of mismatched full_name', () => {
        // Given - API might return inconsistent data
        const inconsistentResponse: CreateUserResponseDTO = {
          ...mockCreateUserResponse,
          first_name: 'John',
          last_name: 'Doe',
          full_name: 'Jane Smith', // Inconsistent with first/last name
        };

        // Then - DTO should still preserve exactly what API returned
        expect(inconsistentResponse.first_name).toBe('John');
        expect(inconsistentResponse.last_name).toBe('Doe');
        expect(inconsistentResponse.full_name).toBe('Jane Smith');
        expect(inconsistentResponse.full_name).not.toBe(
          `${inconsistentResponse.first_name} ${inconsistentResponse.last_name}`
        );
      });
    });
  });
});
