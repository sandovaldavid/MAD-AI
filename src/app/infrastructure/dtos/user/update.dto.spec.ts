/**
 * @fileoverview Update User DTO Tests - Infrastructure Layer
 *
 * @description Tests for Update User DTOs used in user update operations.
 * These tests validate request and response DTOs for user update endpoints.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-09-12
 */

import { UpdateUserRequestDTO, UpdateUserResponseDTO } from './update.dto';

describe('Update User DTOs - Infrastructure Tests', () => {
  describe('UpdateUserRequestDTO', () => {
    const mockUpdateUserRequest: UpdateUserRequestDTO = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      role_id: 3,
      status: 'active',
      email_notifications_enabled: true,
      system_notifications_enabled: true,
      task_notifications_enabled: false,
    };

    describe('structure validation', () => {
      it('should have all required properties', () => {
        // Then
        expect(mockUpdateUserRequest.first_name).toBeDefined();
        expect(mockUpdateUserRequest.last_name).toBeDefined();
        expect(mockUpdateUserRequest.email).toBeDefined();
        expect(mockUpdateUserRequest.role_id).toBeDefined();
        expect(mockUpdateUserRequest.status).toBeDefined();
        expect(mockUpdateUserRequest.email_notifications_enabled).toBeDefined();
        expect(mockUpdateUserRequest.system_notifications_enabled).toBeDefined();
        expect(mockUpdateUserRequest.task_notifications_enabled).toBeDefined();
      });

      it('should have correct property types', () => {
        // Then
        expect(typeof mockUpdateUserRequest.first_name).toBe('string');
        expect(typeof mockUpdateUserRequest.last_name).toBe('string');
        expect(typeof mockUpdateUserRequest.email).toBe('string');
        expect(typeof mockUpdateUserRequest.role_id).toBe('number');
        expect(typeof mockUpdateUserRequest.status).toBe('string');
        expect(typeof mockUpdateUserRequest.email_notifications_enabled).toBe('boolean');
        expect(typeof mockUpdateUserRequest.system_notifications_enabled).toBe('boolean');
        expect(typeof mockUpdateUserRequest.task_notifications_enabled).toBe('boolean');
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
          const request: UpdateUserRequestDTO = {
            ...mockUpdateUserRequest,
            email: email,
          };

          // Then
          expect(request.email).toBe(email);
          expect(typeof request.email).toBe('string');
        });
      });

      it('should accept various role IDs', () => {
        // Given
        const roleIds = [1, 2, 3, 5, 10, 100, 999];

        roleIds.forEach((roleId) => {
          const request: UpdateUserRequestDTO = {
            ...mockUpdateUserRequest,
            role_id: roleId,
          };

          // Then
          expect(request.role_id).toBe(roleId);
          expect(typeof request.role_id).toBe('number');
        });
      });

      it('should accept various status values', () => {
        // Given
        const statusValues = ['active', 'inactive', 'pending', 'suspended', 'verified'];

        statusValues.forEach((status) => {
          const request: UpdateUserRequestDTO = {
            ...mockUpdateUserRequest,
            status: status,
          };

          // Then
          expect(request.status).toBe(status);
          expect(typeof request.status).toBe('string');
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
          const request: UpdateUserRequestDTO = {
            ...mockUpdateUserRequest,
            email_notifications_enabled: config.email,
            system_notifications_enabled: config.system,
            task_notifications_enabled: config.task,
          };

          // Then
          expect(request.email_notifications_enabled).toBe(config.email);
          expect(request.system_notifications_enabled).toBe(config.system);
          expect(request.task_notifications_enabled).toBe(config.task);
        });
      });
    });

    describe('serialization', () => {
      it('should serialize to JSON correctly with all properties', () => {
        // When
        const json = JSON.stringify(mockUpdateUserRequest);
        const parsed = JSON.parse(json);

        // Then
        expect(parsed.first_name).toBe(mockUpdateUserRequest.first_name);
        expect(parsed.last_name).toBe(mockUpdateUserRequest.last_name);
        expect(parsed.email).toBe(mockUpdateUserRequest.email);
        expect(parsed.role_id).toBe(mockUpdateUserRequest.role_id);
        expect(parsed.status).toBe(mockUpdateUserRequest.status);
        expect(parsed.email_notifications_enabled).toBe(
          mockUpdateUserRequest.email_notifications_enabled
        );
        expect(parsed.system_notifications_enabled).toBe(
          mockUpdateUserRequest.system_notifications_enabled
        );
        expect(parsed.task_notifications_enabled).toBe(
          mockUpdateUserRequest.task_notifications_enabled
        );
        expect(parsed).toEqual(mockUpdateUserRequest);
      });

      it('should serialize with different notification preferences', () => {
        // Given
        const requestWithDifferentSettings: UpdateUserRequestDTO = {
          ...mockUpdateUserRequest,
          email_notifications_enabled: false,
          system_notifications_enabled: true,
          task_notifications_enabled: false,
        };

        // When
        const json = JSON.stringify(requestWithDifferentSettings);
        const parsed = JSON.parse(json);

        // Then
        expect(parsed.email_notifications_enabled).toBe(false);
        expect(parsed.system_notifications_enabled).toBe(true);
        expect(parsed.task_notifications_enabled).toBe(false);
        expect(parsed).toEqual(requestWithDifferentSettings);
      });

      it('should deserialize from JSON correctly', () => {
        // Given
        const jsonString = JSON.stringify(mockUpdateUserRequest);

        // When
        const parsed: UpdateUserRequestDTO = JSON.parse(jsonString);

        // Then
        expect(parsed).toEqual(mockUpdateUserRequest);
        expect(parsed.first_name).toBe('John');
        expect(parsed.email).toBe('john.doe@example.com');
        expect(parsed.role_id).toBe(3);
      });

      it('should preserve data types after serialization round-trip', () => {
        // When
        const json = JSON.stringify(mockUpdateUserRequest);
        const parsed: UpdateUserRequestDTO = JSON.parse(json);

        // Then
        expect(typeof parsed.first_name).toBe('string');
        expect(typeof parsed.last_name).toBe('string');
        expect(typeof parsed.email).toBe('string');
        expect(typeof parsed.role_id).toBe('number');
        expect(typeof parsed.status).toBe('string');
        expect(typeof parsed.email_notifications_enabled).toBe('boolean');
        expect(typeof parsed.system_notifications_enabled).toBe('boolean');
        expect(typeof parsed.task_notifications_enabled).toBe('boolean');
        expect(parsed).toEqual(mockUpdateUserRequest);
      });
    });

    describe('edge cases', () => {
      it('should handle zero and negative role IDs', () => {
        // Given
        const edgeRoleIds = [0, -1, -999];

        edgeRoleIds.forEach((roleId) => {
          const request: UpdateUserRequestDTO = {
            ...mockUpdateUserRequest,
            role_id: roleId,
          };

          // Then
          expect(request.role_id).toBe(roleId);
          expect(typeof request.role_id).toBe('number');
        });
      });

      it('should handle very large role IDs', () => {
        // Given
        const request: UpdateUserRequestDTO = {
          ...mockUpdateUserRequest,
          role_id: Number.MAX_SAFE_INTEGER,
        };

        // Then
        expect(request.role_id).toBe(Number.MAX_SAFE_INTEGER);
        expect(typeof request.role_id).toBe('number');
      });

      it('should handle empty string values', () => {
        // Given
        const requestWithEmptyStrings: UpdateUserRequestDTO = {
          ...mockUpdateUserRequest,
          first_name: '',
          last_name: '',
          email: '',
          status: '',
        };

        // Then
        expect(requestWithEmptyStrings.first_name).toBe('');
        expect(requestWithEmptyStrings.last_name).toBe('');
        expect(requestWithEmptyStrings.email).toBe('');
        expect(requestWithEmptyStrings.status).toBe('');
      });

      it('should handle special characters in string fields', () => {
        // Given
        const requestWithSpecialChars: UpdateUserRequestDTO = {
          ...mockUpdateUserRequest,
          first_name: 'José María',
          last_name: 'González-López',
          email: 'josé.maría@domain.com',
          status: 'active-verified',
        };

        // Then
        expect(requestWithSpecialChars.first_name).toContain('é');
        expect(requestWithSpecialChars.last_name).toContain('-');
        expect(requestWithSpecialChars.email).toContain('@');
        expect(requestWithSpecialChars.status).toContain('-');
      });

      it('should handle long string values', () => {
        // Given
        const requestWithLongValues: UpdateUserRequestDTO = {
          ...mockUpdateUserRequest,
          first_name: 'FirstName'.repeat(20),
          last_name: 'LastName'.repeat(20),
          email: 'very.long.email.address@very.long.domain.name.com',
          status: 'active-verified-complete-profile',
        };

        // Then
        expect(requestWithLongValues.first_name.length).toBe(180);
        expect(requestWithLongValues.last_name.length).toBe(160);
        expect(requestWithLongValues.email.length).toBeGreaterThan(30);
        expect(requestWithLongValues.status.length).toBeGreaterThan(20);
      });

      it('should handle all boolean notification flags as false', () => {
        // Given
        const requestWithAllFalse: UpdateUserRequestDTO = {
          ...mockUpdateUserRequest,
          email_notifications_enabled: false,
          system_notifications_enabled: false,
          task_notifications_enabled: false,
        };

        // Then
        expect(requestWithAllFalse.email_notifications_enabled).toBe(false);
        expect(requestWithAllFalse.system_notifications_enabled).toBe(false);
        expect(requestWithAllFalse.task_notifications_enabled).toBe(false);
      });

      it('should handle all boolean notification flags as true', () => {
        // Given
        const requestWithAllTrue: UpdateUserRequestDTO = {
          ...mockUpdateUserRequest,
          email_notifications_enabled: true,
          system_notifications_enabled: true,
          task_notifications_enabled: true,
        };

        // Then
        expect(requestWithAllTrue.email_notifications_enabled).toBe(true);
        expect(requestWithAllTrue.system_notifications_enabled).toBe(true);
        expect(requestWithAllTrue.task_notifications_enabled).toBe(true);
      });
    });

    describe('data consistency', () => {
      it('should maintain property integrity after serialization', () => {
        // Given
        const originalRequest: UpdateUserRequestDTO = { ...mockUpdateUserRequest };

        // When
        const json = JSON.stringify(originalRequest);
        const parsed: UpdateUserRequestDTO = JSON.parse(json);

        // Then
        expect(parsed.first_name).toBe(originalRequest.first_name);
        expect(parsed.last_name).toBe(originalRequest.last_name);
        expect(parsed.email).toBe(originalRequest.email);
        expect(parsed.role_id).toBe(originalRequest.role_id);
        expect(parsed.status).toBe(originalRequest.status);
        expect(parsed.email_notifications_enabled).toBe(
          originalRequest.email_notifications_enabled
        );
        expect(parsed.system_notifications_enabled).toBe(
          originalRequest.system_notifications_enabled
        );
        expect(parsed.task_notifications_enabled).toBe(originalRequest.task_notifications_enabled);
        expect(parsed).toEqual(originalRequest);
      });

      it('should handle comprehensive update data', () => {
        // Given
        const comprehensiveRequest: UpdateUserRequestDTO = {
          first_name: 'María José',
          last_name: 'González-Pérez',
          email: 'maria.jose@comprehensive.test.com',
          role_id: 42,
          status: 'active-verified',
          email_notifications_enabled: false,
          system_notifications_enabled: true,
          task_notifications_enabled: false,
        };

        // When
        const json = JSON.stringify(comprehensiveRequest);
        const parsed: UpdateUserRequestDTO = JSON.parse(json);

        // Then
        expect(parsed).toEqual(comprehensiveRequest);
        expect(parsed.first_name).toContain('í');
        expect(parsed.last_name).toContain('-');
        expect(parsed.email).toContain('comprehensive');
        expect(parsed.status).toContain('-');
        expect(parsed.email_notifications_enabled).toBe(false);
        expect(parsed.system_notifications_enabled).toBe(true);
        expect(parsed.task_notifications_enabled).toBe(false);
      });

      it('should maintain consistent notification preferences', () => {
        // Given
        const request: UpdateUserRequestDTO = {
          ...mockUpdateUserRequest,
          email_notifications_enabled: true,
          system_notifications_enabled: false,
          task_notifications_enabled: true,
        };

        // When
        const json = JSON.stringify(request);
        const parsed: UpdateUserRequestDTO = JSON.parse(json);

        // Then
        expect(parsed.email_notifications_enabled).toBe(true);
        expect(parsed.system_notifications_enabled).toBe(false);
        expect(parsed.task_notifications_enabled).toBe(true);
        expect(parsed).toEqual(request);
      });
    });
  });

  describe('UpdateUserResponseDTO', () => {
    const mockUpdateUserResponse: UpdateUserResponseDTO = {
      id: 123,
      username: 'john_doe_updated',
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe',
      full_name: 'John Doe',
      status: 'active',
      is_email_confirmed: true,
      profile_completed: true,
      email_notifications_enabled: true,
      system_notifications_enabled: false,
      task_notifications_enabled: true,
      is_active: true,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-16T14:22:30Z',
      role_id: 3,
      role_name: 'Senior Editor',
      last_activity_at: '2024-01-16T14:20:00Z',
    };

    describe('structure validation', () => {
      it('should have all required properties', () => {
        // Then
        expect(mockUpdateUserResponse.id).toBeDefined();
        expect(mockUpdateUserResponse.username).toBeDefined();
        expect(mockUpdateUserResponse.email).toBeDefined();
        expect(mockUpdateUserResponse.first_name).toBeDefined();
        expect(mockUpdateUserResponse.last_name).toBeDefined();
        expect(mockUpdateUserResponse.full_name).toBeDefined();
        expect(mockUpdateUserResponse.status).toBeDefined();
        expect(mockUpdateUserResponse.is_email_confirmed).toBeDefined();
        expect(mockUpdateUserResponse.profile_completed).toBeDefined();
        expect(mockUpdateUserResponse.email_notifications_enabled).toBeDefined();
        expect(mockUpdateUserResponse.system_notifications_enabled).toBeDefined();
        expect(mockUpdateUserResponse.task_notifications_enabled).toBeDefined();
        expect(mockUpdateUserResponse.is_active).toBeDefined();
        expect(mockUpdateUserResponse.created_at).toBeDefined();
        expect(mockUpdateUserResponse.updated_at).toBeDefined();
        expect(mockUpdateUserResponse.role_id).toBeDefined();
        expect(mockUpdateUserResponse.role_name).toBeDefined();
        expect(mockUpdateUserResponse.last_activity_at).toBeDefined();
      });

      it('should have correct property types', () => {
        // Then
        expect(typeof mockUpdateUserResponse.id).toBe('number');
        expect(typeof mockUpdateUserResponse.username).toBe('string');
        expect(typeof mockUpdateUserResponse.email).toBe('string');
        expect(typeof mockUpdateUserResponse.first_name).toBe('string');
        expect(typeof mockUpdateUserResponse.last_name).toBe('string');
        expect(typeof mockUpdateUserResponse.full_name).toBe('string');
        expect(typeof mockUpdateUserResponse.status).toBe('string');
        expect(typeof mockUpdateUserResponse.is_email_confirmed).toBe('boolean');
        expect(typeof mockUpdateUserResponse.profile_completed).toBe('boolean');
        expect(typeof mockUpdateUserResponse.email_notifications_enabled).toBe('boolean');
        expect(typeof mockUpdateUserResponse.system_notifications_enabled).toBe('boolean');
        expect(typeof mockUpdateUserResponse.task_notifications_enabled).toBe('boolean');
        expect(typeof mockUpdateUserResponse.is_active).toBe('boolean');
        expect(typeof mockUpdateUserResponse.created_at).toBe('string');
        expect(typeof mockUpdateUserResponse.updated_at).toBe('string');
        expect(typeof mockUpdateUserResponse.role_id).toBe('number');
        expect(typeof mockUpdateUserResponse.role_name).toBe('string');
        expect(typeof mockUpdateUserResponse.last_activity_at).toBe('string');
      });

      it('should handle last_activity_at timestamp', () => {
        // Given
        const responseWithActivity: UpdateUserResponseDTO = {
          ...mockUpdateUserResponse,
          last_activity_at: '2024-01-16T14:20:00Z',
        };

        // Then
        expect(responseWithActivity.last_activity_at).toBe('2024-01-16T14:20:00Z');
        expect(typeof responseWithActivity.last_activity_at).toBe('string');
      });

      it('should reflect updated timestamp being after created timestamp', () => {
        // Then - updated_at should be after created_at
        const createdDate = new Date(mockUpdateUserResponse.created_at);
        const updatedDate = new Date(mockUpdateUserResponse.updated_at);

        expect(updatedDate.getTime()).toBeGreaterThan(createdDate.getTime());
      });

      it('should accept various status values after update', () => {
        // Given
        const statusValues = ['active', 'inactive', 'pending', 'suspended', 'verified'];

        statusValues.forEach((status) => {
          const response: UpdateUserResponseDTO = {
            ...mockUpdateUserResponse,
            status: status,
          };

          // Then
          expect(response.status).toBe(status);
          expect(typeof response.status).toBe('string');
        });
      });

      it('should handle different notification preferences after update', () => {
        // Given
        const notificationConfigs = [
          { email: true, system: true, task: true },
          { email: false, system: false, task: false },
          { email: true, system: false, task: true },
          { email: false, system: true, task: false },
        ];

        notificationConfigs.forEach((config) => {
          const response: UpdateUserResponseDTO = {
            ...mockUpdateUserResponse,
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
        const json = JSON.stringify(mockUpdateUserResponse);
        const parsed = JSON.parse(json);

        // Then
        expect(parsed.id).toBe(mockUpdateUserResponse.id);
        expect(parsed.username).toBe(mockUpdateUserResponse.username);
        expect(parsed.email).toBe(mockUpdateUserResponse.email);
        expect(parsed.full_name).toBe(mockUpdateUserResponse.full_name);
        expect(parsed.status).toBe(mockUpdateUserResponse.status);
        expect(parsed.is_active).toBe(mockUpdateUserResponse.is_active);
        expect(parsed.role_id).toBe(mockUpdateUserResponse.role_id);
        expect(parsed.role_name).toBe(mockUpdateUserResponse.role_name);
        expect(parsed.updated_at).toBe(mockUpdateUserResponse.updated_at);
        expect(parsed.last_activity_at).toBe(mockUpdateUserResponse.last_activity_at);
        expect(parsed).toEqual(mockUpdateUserResponse);
      });

      it('should deserialize from JSON correctly', () => {
        // Given
        const jsonString = JSON.stringify(mockUpdateUserResponse);

        // When
        const parsed: UpdateUserResponseDTO = JSON.parse(jsonString);

        // Then
        expect(parsed).toEqual(mockUpdateUserResponse);
        expect(parsed.id).toBe(123);
        expect(parsed.username).toBe('john_doe_updated');
        expect(parsed.role_name).toBe('Senior Editor');
        expect(parsed.updated_at).toBe('2024-01-16T14:22:30Z');
      });

      it('should preserve data types after serialization round-trip', () => {
        // When
        const json = JSON.stringify(mockUpdateUserResponse);
        const parsed: UpdateUserResponseDTO = JSON.parse(json);

        // Then
        expect(typeof parsed.id).toBe('number');
        expect(typeof parsed.username).toBe('string');
        expect(typeof parsed.is_active).toBe('boolean');
        expect(typeof parsed.is_email_confirmed).toBe('boolean');
        expect(typeof parsed.profile_completed).toBe('boolean');
        expect(typeof parsed.role_id).toBe('number');
        expect(typeof parsed.updated_at).toBe('string');
        expect(parsed).toEqual(mockUpdateUserResponse);
      });

      it('should handle different last_activity_at timestamps in serialization', () => {
        // Given
        const responseWithDifferentActivity: UpdateUserResponseDTO = {
          ...mockUpdateUserResponse,
          last_activity_at: '2024-01-17T08:45:30Z',
        };

        // When
        const json = JSON.stringify(responseWithDifferentActivity);
        const parsed: UpdateUserResponseDTO = JSON.parse(json);

        // Then
        expect(parsed.last_activity_at).toBe('2024-01-17T08:45:30Z');
        expect(typeof parsed.last_activity_at).toBe('string');
        expect(parsed).toEqual(responseWithDifferentActivity);
      });
    });

    describe('edge cases', () => {
      it('should handle zero and negative user IDs', () => {
        // Given
        const edgeIds = [0, -1, -999];

        edgeIds.forEach((id) => {
          const response: UpdateUserResponseDTO = {
            ...mockUpdateUserResponse,
            id: id,
          };

          // Then
          expect(response.id).toBe(id);
          expect(typeof response.id).toBe('number');
        });
      });

      it('should handle very large user IDs', () => {
        // Given
        const response: UpdateUserResponseDTO = {
          ...mockUpdateUserResponse,
          id: Number.MAX_SAFE_INTEGER,
        };

        // Then
        expect(response.id).toBe(Number.MAX_SAFE_INTEGER);
        expect(typeof response.id).toBe('number');
      });

      it('should handle empty string values', () => {
        // Given
        const responseWithEmptyStrings: UpdateUserResponseDTO = {
          ...mockUpdateUserResponse,
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
        const responseWithAllFalse: UpdateUserResponseDTO = {
          ...mockUpdateUserResponse,
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

      it('should handle special characters in string fields', () => {
        // Given
        const responseWithSpecialChars: UpdateUserResponseDTO = {
          ...mockUpdateUserResponse,
          username: 'user_123-updated!',
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

      it('should handle various ISO date formats for update timestamps', () => {
        // Given
        const dateFormats = [
          '2024-01-16T14:22:30Z',
          '2023-12-31T23:59:59.999Z',
          '2024-06-15T14:30:45.123Z',
        ];

        dateFormats.forEach((date) => {
          const response: UpdateUserResponseDTO = {
            ...mockUpdateUserResponse,
            updated_at: date,
            last_activity_at: date,
          };

          // Then
          expect(response.updated_at).toBe(date);
          expect(response.last_activity_at).toBe(date);
        });
      });

      it('should handle role changes reflected in response', () => {
        // Given
        const roleUpdates = [
          { role_id: 1, role_name: 'Admin' },
          { role_id: 2, role_name: 'Editor' },
          { role_id: 3, role_name: 'Senior Editor' },
          { role_id: 4, role_name: 'Manager' },
          { role_id: 5, role_name: 'Super Admin' },
        ];

        roleUpdates.forEach(({ role_id, role_name }) => {
          const response: UpdateUserResponseDTO = {
            ...mockUpdateUserResponse,
            role_id: role_id,
            role_name: role_name,
          };

          // Then
          expect(response.role_id).toBe(role_id);
          expect(response.role_name).toBe(role_name);
        });
      });
    });

    describe('data consistency', () => {
      it('should maintain property integrity after serialization', () => {
        // Given
        const originalResponse: UpdateUserResponseDTO = { ...mockUpdateUserResponse };

        // When
        const json = JSON.stringify(originalResponse);
        const parsed: UpdateUserResponseDTO = JSON.parse(json);

        // Then
        expect(parsed.id).toBe(originalResponse.id);
        expect(parsed.username).toBe(originalResponse.username);
        expect(parsed.full_name).toBe(originalResponse.full_name);
        expect(parsed.status).toBe(originalResponse.status);
        expect(parsed.role_id).toBe(originalResponse.role_id);
        expect(parsed.role_name).toBe(originalResponse.role_name);
        expect(parsed.updated_at).toBe(originalResponse.updated_at);
        expect(parsed).toEqual(originalResponse);
      });

      it('should handle comprehensive update response data', () => {
        // Given
        const comprehensiveResponse: UpdateUserResponseDTO = {
          id: 999,
          username: 'comprehensive_updated_user',
          email: 'comprehensive@updated.com',
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
          updated_at: '2024-01-16T15:45:30Z',
          role_id: 4,
          role_name: 'Content Manager',
          last_activity_at: '2024-01-16T15:44:00Z',
        };

        // When
        const json = JSON.stringify(comprehensiveResponse);
        const parsed: UpdateUserResponseDTO = JSON.parse(json);

        // Then
        expect(parsed).toEqual(comprehensiveResponse);
        expect(parsed.first_name).toContain('í');
        expect(parsed.username).toContain('updated');
        expect(parsed.status).toContain('-');
        expect(parsed.email_notifications_enabled).toBe(false);
        expect(parsed.system_notifications_enabled).toBe(true);
        expect(parsed.last_activity_at).toBe('2024-01-16T15:44:00Z');

        // Verify update timestamp is after creation
        const createdTime = new Date(parsed.created_at).getTime();
        const updatedTime = new Date(parsed.updated_at).getTime();
        expect(updatedTime).toBeGreaterThan(createdTime);
      });

      it('should maintain consistency between name fields after update', () => {
        // Given
        const response: UpdateUserResponseDTO = {
          ...mockUpdateUserResponse,
          first_name: 'UpdatedFirst',
          last_name: 'UpdatedLast',
          full_name: 'UpdatedFirst UpdatedLast',
        };

        // Then
        expect(response.full_name).toBe(`${response.first_name} ${response.last_name}`);
        expect(response.full_name).toContain(response.first_name);
        expect(response.full_name).toContain(response.last_name);
      });

      it('should reflect profile completion state after update', () => {
        // Given
        const incompleteProfileResponse: UpdateUserResponseDTO = {
          ...mockUpdateUserResponse,
          profile_completed: false,
          is_email_confirmed: false,
          first_name: '',
          last_name: '',
        };

        // Then
        expect(incompleteProfileResponse.profile_completed).toBe(false);
        expect(incompleteProfileResponse.is_email_confirmed).toBe(false);
        expect(incompleteProfileResponse.first_name).toBe('');
        expect(incompleteProfileResponse.last_name).toBe('');
      });

      it('should maintain activity timestamp consistency', () => {
        // Given
        const response: UpdateUserResponseDTO = {
          ...mockUpdateUserResponse,
          updated_at: '2024-01-16T14:22:30Z',
          last_activity_at: '2024-01-16T14:20:00Z', // Activity before update
        };

        // Then
        const updatedTime = new Date(response.updated_at).getTime();
        const activityTime = new Date(response.last_activity_at as string).getTime();

        expect(updatedTime).toBeGreaterThan(activityTime);
      });
    });
  });
});
