/**
 * @fileoverview User Detail DTO Tests - Infrastructure Layer
 *
 * @description Tests for User Detail DTO used in user detail operations.
 * These tests validate response DTO for user detail endpoints.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-09-12
 */

import { UserDetailResponseDTO } from './detail.dto';

describe('User Detail DTO - Infrastructure Tests', () => {
  describe('UserDetailResponseDTO', () => {
    const mockUserDetailResponse: UserDetailResponseDTO = {
      id: 456,
      username: 'detail_user',
      email: 'detail.user@example.com',
      first_name: 'Detail',
      last_name: 'User',
      full_name: 'Detail User',
      status: 'active',
      is_email_confirmed: true,
      profile_completed: true,
      email_notifications_enabled: true,
      system_notifications_enabled: false,
      task_notifications_enabled: true,
      is_active: true,
      created_at: '2024-01-10T08:00:00Z',
      updated_at: '2024-01-18T16:30:00Z',
      role_id: 2,
      role_name: 'Content Editor',
      last_activity_at: '2024-01-18T15:45:30Z',
    };

    describe('structure validation', () => {
      it('should have all required properties', () => {
        // Then
        expect(mockUserDetailResponse.id).toBeDefined();
        expect(mockUserDetailResponse.username).toBeDefined();
        expect(mockUserDetailResponse.email).toBeDefined();
        expect(mockUserDetailResponse.first_name).toBeDefined();
        expect(mockUserDetailResponse.last_name).toBeDefined();
        expect(mockUserDetailResponse.full_name).toBeDefined();
        expect(mockUserDetailResponse.status).toBeDefined();
        expect(mockUserDetailResponse.is_email_confirmed).toBeDefined();
        expect(mockUserDetailResponse.profile_completed).toBeDefined();
        expect(mockUserDetailResponse.email_notifications_enabled).toBeDefined();
        expect(mockUserDetailResponse.system_notifications_enabled).toBeDefined();
        expect(mockUserDetailResponse.task_notifications_enabled).toBeDefined();
        expect(mockUserDetailResponse.is_active).toBeDefined();
        expect(mockUserDetailResponse.created_at).toBeDefined();
        expect(mockUserDetailResponse.updated_at).toBeDefined();
        expect(mockUserDetailResponse.role_id).toBeDefined();
        expect(mockUserDetailResponse.role_name).toBeDefined();
        expect(mockUserDetailResponse.last_activity_at).toBeDefined();
      });

      it('should have correct property types', () => {
        // Then
        expect(typeof mockUserDetailResponse.id).toBe('number');
        expect(typeof mockUserDetailResponse.username).toBe('string');
        expect(typeof mockUserDetailResponse.email).toBe('string');
        expect(typeof mockUserDetailResponse.first_name).toBe('string');
        expect(typeof mockUserDetailResponse.last_name).toBe('string');
        expect(typeof mockUserDetailResponse.full_name).toBe('string');
        expect(typeof mockUserDetailResponse.status).toBe('string');
        expect(typeof mockUserDetailResponse.is_email_confirmed).toBe('boolean');
        expect(typeof mockUserDetailResponse.profile_completed).toBe('boolean');
        expect(typeof mockUserDetailResponse.email_notifications_enabled).toBe('boolean');
        expect(typeof mockUserDetailResponse.system_notifications_enabled).toBe('boolean');
        expect(typeof mockUserDetailResponse.task_notifications_enabled).toBe('boolean');
        expect(typeof mockUserDetailResponse.is_active).toBe('boolean');
        expect(typeof mockUserDetailResponse.created_at).toBe('string');
        expect(typeof mockUserDetailResponse.updated_at).toBe('string');
        expect(typeof mockUserDetailResponse.role_id).toBe('number');
        expect(typeof mockUserDetailResponse.role_name).toBe('string');
        expect(typeof mockUserDetailResponse.last_activity_at).toBe('string');
      });

      it('should represent detailed user information', () => {
        // Then
        expect(mockUserDetailResponse.id).toBe(456);
        expect(mockUserDetailResponse.username).toBe('detail_user');
        expect(mockUserDetailResponse.email).toBe('detail.user@example.com');
        expect(mockUserDetailResponse.full_name).toBe('Detail User');
        expect(mockUserDetailResponse.role_name).toBe('Content Editor');
      });

      it('should accept various status values', () => {
        // Given
        const statusValues = ['active', 'inactive', 'pending', 'suspended', 'verified', 'blocked'];

        statusValues.forEach((status) => {
          const response: UserDetailResponseDTO = {
            ...mockUserDetailResponse,
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
          const response: UserDetailResponseDTO = {
            ...mockUserDetailResponse,
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

      it('should handle different profile completion states', () => {
        // Given
        const profileStates = [
          { completed: true, emailConfirmed: true },
          { completed: false, emailConfirmed: false },
          { completed: true, emailConfirmed: false },
          { completed: false, emailConfirmed: true },
        ];

        profileStates.forEach(({ completed, emailConfirmed }) => {
          const response: UserDetailResponseDTO = {
            ...mockUserDetailResponse,
            profile_completed: completed,
            is_email_confirmed: emailConfirmed,
          };

          // Then
          expect(response.profile_completed).toBe(completed);
          expect(response.is_email_confirmed).toBe(emailConfirmed);
        });
      });
    });

    describe('serialization', () => {
      it('should serialize to JSON correctly', () => {
        // When
        const json = JSON.stringify(mockUserDetailResponse);
        const parsed = JSON.parse(json);

        // Then
        expect(parsed.id).toBe(mockUserDetailResponse.id);
        expect(parsed.username).toBe(mockUserDetailResponse.username);
        expect(parsed.email).toBe(mockUserDetailResponse.email);
        expect(parsed.full_name).toBe(mockUserDetailResponse.full_name);
        expect(parsed.status).toBe(mockUserDetailResponse.status);
        expect(parsed.is_active).toBe(mockUserDetailResponse.is_active);
        expect(parsed.role_id).toBe(mockUserDetailResponse.role_id);
        expect(parsed.role_name).toBe(mockUserDetailResponse.role_name);
        expect(parsed.created_at).toBe(mockUserDetailResponse.created_at);
        expect(parsed.updated_at).toBe(mockUserDetailResponse.updated_at);
        expect(parsed.last_activity_at).toBe(mockUserDetailResponse.last_activity_at);
        expect(parsed).toEqual(mockUserDetailResponse);
      });

      it('should deserialize from JSON correctly', () => {
        // Given
        const jsonString = JSON.stringify(mockUserDetailResponse);

        // When
        const parsed: UserDetailResponseDTO = JSON.parse(jsonString);

        // Then
        expect(parsed).toEqual(mockUserDetailResponse);
        expect(parsed.id).toBe(456);
        expect(parsed.username).toBe('detail_user');
        expect(parsed.role_name).toBe('Content Editor');
        expect(parsed.last_activity_at).toBe('2024-01-18T15:45:30Z');
      });

      it('should preserve data types after serialization round-trip', () => {
        // When
        const json = JSON.stringify(mockUserDetailResponse);
        const parsed: UserDetailResponseDTO = JSON.parse(json);

        // Then
        expect(typeof parsed.id).toBe('number');
        expect(typeof parsed.username).toBe('string');
        expect(typeof parsed.is_active).toBe('boolean');
        expect(typeof parsed.is_email_confirmed).toBe('boolean');
        expect(typeof parsed.profile_completed).toBe('boolean');
        expect(typeof parsed.email_notifications_enabled).toBe('boolean');
        expect(typeof parsed.system_notifications_enabled).toBe('boolean');
        expect(typeof parsed.task_notifications_enabled).toBe('boolean');
        expect(typeof parsed.role_id).toBe('number');
        expect(typeof parsed.created_at).toBe('string');
        expect(typeof parsed.updated_at).toBe('string');
        expect(typeof parsed.last_activity_at).toBe('string');
        expect(parsed).toEqual(mockUserDetailResponse);
      });

      it('should serialize boolean notification preferences correctly', () => {
        // Given
        const responseWithMixedNotifications: UserDetailResponseDTO = {
          ...mockUserDetailResponse,
          email_notifications_enabled: false,
          system_notifications_enabled: true,
          task_notifications_enabled: false,
        };

        // When
        const json = JSON.stringify(responseWithMixedNotifications);
        const parsed: UserDetailResponseDTO = JSON.parse(json);

        // Then
        expect(parsed.email_notifications_enabled).toBe(false);
        expect(parsed.system_notifications_enabled).toBe(true);
        expect(parsed.task_notifications_enabled).toBe(false);
        expect(parsed).toEqual(responseWithMixedNotifications);
      });
    });

    describe('edge cases', () => {
      it('should handle zero and negative user IDs', () => {
        // Given
        const edgeIds = [0, -1, -999];

        edgeIds.forEach((id) => {
          const response: UserDetailResponseDTO = {
            ...mockUserDetailResponse,
            id: id,
          };

          // Then
          expect(response.id).toBe(id);
          expect(typeof response.id).toBe('number');
        });
      });

      it('should handle very large user IDs', () => {
        // Given
        const response: UserDetailResponseDTO = {
          ...mockUserDetailResponse,
          id: Number.MAX_SAFE_INTEGER,
        };

        // Then
        expect(response.id).toBe(Number.MAX_SAFE_INTEGER);
        expect(typeof response.id).toBe('number');
      });

      it('should handle empty string values', () => {
        // Given
        const responseWithEmptyStrings: UserDetailResponseDTO = {
          ...mockUserDetailResponse,
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
        const responseWithAllFalse: UserDetailResponseDTO = {
          ...mockUserDetailResponse,
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
        const responseWithAllTrue: UserDetailResponseDTO = {
          ...mockUserDetailResponse,
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
        const responseWithSpecialChars: UserDetailResponseDTO = {
          ...mockUserDetailResponse,
          username: 'detail_user-123!',
          first_name: 'José María',
          last_name: 'González-López',
          full_name: 'José María González-López',
          email: 'josé.maría@domain.com',
          status: 'active-verified-complete',
          role_name: 'Senior Content Manager & Editor',
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
          '2024-01-18T16:30:00Z',
          '2023-12-31T23:59:59.999Z',
          '2024-06-15T14:30:45.123Z',
        ];

        dateFormats.forEach((date) => {
          const response: UserDetailResponseDTO = {
            ...mockUserDetailResponse,
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

      it('should handle long string values', () => {
        // Given
        const responseWithLongValues: UserDetailResponseDTO = {
          ...mockUserDetailResponse,
          username: 'very_long_username_that_exceeds_normal_length_limits',
          first_name: 'VeryLongFirstName'.repeat(10),
          last_name: 'VeryLongLastName'.repeat(10),
          full_name: 'VeryLongFirstName'.repeat(10) + ' ' + 'VeryLongLastName'.repeat(10),
          email: 'very.long.email.address.with.many.dots@very.long.domain.name.with.subdomains.com',
          status: 'active-verified-email-confirmed-profile-completed',
          role_name: 'Senior Content Manager and Editor with Special Permissions',
        };

        // Then
        expect(responseWithLongValues.username.length).toBeGreaterThan(40);
        expect(responseWithLongValues.first_name.length).toBeGreaterThan(100);
        expect(responseWithLongValues.last_name.length).toBeGreaterThan(100);
        expect(responseWithLongValues.full_name.length).toBeGreaterThan(200);
        expect(responseWithLongValues.email.length).toBeGreaterThan(50);
        expect(responseWithLongValues.status.length).toBeGreaterThan(30);
        expect(responseWithLongValues.role_name.length).toBeGreaterThan(40);
      });

      it('should handle edge case role IDs', () => {
        // Given
        const edgeRoleIds = [0, -1, 999999];

        edgeRoleIds.forEach((roleId) => {
          const response: UserDetailResponseDTO = {
            ...mockUserDetailResponse,
            role_id: roleId,
          };

          // Then
          expect(response.role_id).toBe(roleId);
          expect(typeof response.role_id).toBe('number');
        });
      });
    });

    describe('data consistency', () => {
      it('should maintain property integrity after serialization', () => {
        // Given
        const originalResponse: UserDetailResponseDTO = { ...mockUserDetailResponse };

        // When
        const json = JSON.stringify(originalResponse);
        const parsed: UserDetailResponseDTO = JSON.parse(json);

        // Then
        expect(parsed.id).toBe(originalResponse.id);
        expect(parsed.username).toBe(originalResponse.username);
        expect(parsed.full_name).toBe(originalResponse.full_name);
        expect(parsed.status).toBe(originalResponse.status);
        expect(parsed.role_id).toBe(originalResponse.role_id);
        expect(parsed.role_name).toBe(originalResponse.role_name);
        expect(parsed.created_at).toBe(originalResponse.created_at);
        expect(parsed.updated_at).toBe(originalResponse.updated_at);
        expect(parsed.last_activity_at).toBe(originalResponse.last_activity_at);
        expect(parsed).toEqual(originalResponse);
      });

      it('should handle comprehensive detail response data', () => {
        // Given
        const comprehensiveResponse: UserDetailResponseDTO = {
          id: 999,
          username: 'comprehensive_detail_user',
          email: 'comprehensive@detail.test.com',
          first_name: 'María Elena',
          last_name: 'González-Martínez',
          full_name: 'María Elena González-Martínez',
          status: 'active-verified-premium',
          is_email_confirmed: true,
          profile_completed: true,
          email_notifications_enabled: false,
          system_notifications_enabled: true,
          task_notifications_enabled: false,
          is_active: true,
          created_at: '2024-01-10T08:00:00Z',
          updated_at: '2024-01-20T10:15:30Z',
          role_id: 5,
          role_name: 'Premium Content Manager',
          last_activity_at: '2024-01-20T10:10:00Z',
        };

        // When
        const json = JSON.stringify(comprehensiveResponse);
        const parsed: UserDetailResponseDTO = JSON.parse(json);

        // Then
        expect(parsed).toEqual(comprehensiveResponse);
        expect(parsed.first_name).toContain('í');
        expect(parsed.username).toContain('comprehensive');
        expect(parsed.status).toContain('-');
        expect(parsed.email_notifications_enabled).toBe(false);
        expect(parsed.system_notifications_enabled).toBe(true);
        expect(parsed.last_activity_at).toBe('2024-01-20T10:10:00Z');

        // Verify timestamps are in correct order
        const createdTime = new Date(parsed.created_at).getTime();
        const updatedTime = new Date(parsed.updated_at).getTime();
        const activityTime = new Date(parsed.last_activity_at).getTime();

        expect(updatedTime).toBeGreaterThan(createdTime);
        expect(activityTime).toBeLessThanOrEqual(updatedTime);
      });

      it('should maintain consistency between name fields', () => {
        // Given
        const response: UserDetailResponseDTO = {
          ...mockUserDetailResponse,
          first_name: 'DetailFirst',
          last_name: 'DetailLast',
          full_name: 'DetailFirst DetailLast',
        };

        // Then
        expect(response.full_name).toBe(`${response.first_name} ${response.last_name}`);
        expect(response.full_name).toContain(response.first_name);
        expect(response.full_name).toContain(response.last_name);
      });

      it('should reflect complete profile information', () => {
        // Given
        const completeProfileResponse: UserDetailResponseDTO = {
          ...mockUserDetailResponse,
          profile_completed: true,
          is_email_confirmed: true,
          first_name: 'Complete',
          last_name: 'Profile',
          full_name: 'Complete Profile',
        };

        // Then
        expect(completeProfileResponse.profile_completed).toBe(true);
        expect(completeProfileResponse.is_email_confirmed).toBe(true);
        expect(completeProfileResponse.first_name).not.toBe('');
        expect(completeProfileResponse.last_name).not.toBe('');
        expect(completeProfileResponse.full_name).not.toBe('');
      });

      it('should maintain activity timestamp relationships', () => {
        // Given
        const response: UserDetailResponseDTO = {
          ...mockUserDetailResponse,
          created_at: '2024-01-10T08:00:00Z',
          updated_at: '2024-01-20T10:15:30Z',
          last_activity_at: '2024-01-20T10:10:00Z',
        };

        // Then - Verify logical timestamp relationships
        const createdTime = new Date(response.created_at).getTime();
        const updatedTime = new Date(response.updated_at).getTime();
        const activityTime = new Date(response.last_activity_at).getTime();

        expect(createdTime).toBeLessThan(updatedTime);
        expect(createdTime).toBeLessThan(activityTime);
        expect(activityTime).toBeLessThanOrEqual(updatedTime); // Activity can be before or at update time
      });

      it('should preserve notification preferences consistency', () => {
        // Given - Test different notification combinations
        const notificationCombinations = [
          { email: true, system: true, task: true }, // All enabled
          { email: false, system: false, task: false }, // All disabled
          { email: true, system: false, task: true }, // Mixed preferences
          { email: false, system: true, task: false }, // System only
        ];

        notificationCombinations.forEach((prefs) => {
          const response: UserDetailResponseDTO = {
            ...mockUserDetailResponse,
            email_notifications_enabled: prefs.email,
            system_notifications_enabled: prefs.system,
            task_notifications_enabled: prefs.task,
          };

          // When
          const json = JSON.stringify(response);
          const parsed: UserDetailResponseDTO = JSON.parse(json);

          // Then
          expect(parsed.email_notifications_enabled).toBe(prefs.email);
          expect(parsed.system_notifications_enabled).toBe(prefs.system);
          expect(parsed.task_notifications_enabled).toBe(prefs.task);
        });
      });
    });
  });
});
