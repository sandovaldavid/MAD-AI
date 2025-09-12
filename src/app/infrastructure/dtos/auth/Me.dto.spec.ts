import { MeResponseDTO } from './Me.dto';

describe('Me DTO - Infrastructure Tests', () => {
  const mockMeResponse: MeResponseDTO = {
    id: 123,
    username: 'john_doe',
    email: 'john@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: {
      id: 1,
      name: 'Admin',
      access_level: 100,
      is_active: true,
    },
    notification_preferences: {
      email_notifications: true,
      system_notifications: true,
      task_notifications: false,
    },
  };

  describe('MeResponseDTO', () => {
    describe('structure validation', () => {
      it('should have all required root properties', () => {
        // Then
        expect(mockMeResponse.id).toBeDefined();
        expect(mockMeResponse.username).toBeDefined();
        expect(mockMeResponse.email).toBeDefined();
        expect(mockMeResponse.first_name).toBeDefined();
        expect(mockMeResponse.last_name).toBeDefined();
        expect(mockMeResponse.role).toBeDefined();
        expect(mockMeResponse.notification_preferences).toBeDefined();
      });

      it('should have correct data types for root properties', () => {
        // Then
        expect(typeof mockMeResponse.id).toBe('number');
        expect(typeof mockMeResponse.username).toBe('string');
        expect(typeof mockMeResponse.email).toBe('string');
        expect(typeof mockMeResponse.first_name).toBe('string');
        expect(typeof mockMeResponse.last_name).toBe('string');
        expect(typeof mockMeResponse.role).toBe('object');
        expect(typeof mockMeResponse.notification_preferences).toBe('object');
      });

      it('should have all required role properties', () => {
        // Given
        const role = mockMeResponse.role;

        // Then
        expect(role.id).toBeDefined();
        expect(role.name).toBeDefined();
        expect(role.access_level).toBeDefined();
        expect(role.is_active).toBeDefined();
      });

      it('should have correct data types for role properties', () => {
        // Given
        const role = mockMeResponse.role;

        // Then
        expect(typeof role.id).toBe('number');
        expect(typeof role.name).toBe('string');
        expect(typeof role.access_level).toBe('number');
        expect(typeof role.is_active).toBe('boolean');
      });

      it('should have all required notification_preferences properties', () => {
        // Given
        const prefs = mockMeResponse.notification_preferences;

        // Then
        expect(prefs.email_notifications).toBeDefined();
        expect(prefs.system_notifications).toBeDefined();
        expect(prefs.task_notifications).toBeDefined();
      });

      it('should have correct data types for notification_preferences properties', () => {
        // Given
        const prefs = mockMeResponse.notification_preferences;

        // Then
        expect(typeof prefs.email_notifications).toBe('boolean');
        expect(typeof prefs.system_notifications).toBe('boolean');
        expect(typeof prefs.task_notifications).toBe('boolean');
      });
    });

    describe('serialization', () => {
      it('should serialize to JSON correctly', () => {
        // When
        const json = JSON.stringify(mockMeResponse);
        const parsed = JSON.parse(json);

        // Then
        expect(parsed.id).toBe(mockMeResponse.id);
        expect(parsed.username).toBe(mockMeResponse.username);
        expect(parsed.email).toBe(mockMeResponse.email);
        expect(parsed.role).toEqual(mockMeResponse.role);
        expect(parsed.notification_preferences).toEqual(mockMeResponse.notification_preferences);
      });

      it('should deserialize from JSON correctly', () => {
        // Given
        const jsonString = JSON.stringify(mockMeResponse);

        // When
        const parsed: MeResponseDTO = JSON.parse(jsonString);

        // Then
        expect(parsed).toEqual(mockMeResponse);
        expect(parsed.role.id).toBe(1);
        expect(parsed.notification_preferences.email_notifications).toBe(true);
      });

      it('should preserve nested object structure after serialization', () => {
        // When
        const json = JSON.stringify(mockMeResponse);
        const parsed: MeResponseDTO = JSON.parse(json);

        // Then
        expect(parsed.role).toEqual(mockMeResponse.role);
        expect(parsed.notification_preferences).toEqual(mockMeResponse.notification_preferences);
        expect(typeof parsed.role).toBe('object');
        expect(typeof parsed.notification_preferences).toBe('object');
      });

      it('should preserve data types after serialization round-trip', () => {
        // When
        const json = JSON.stringify(mockMeResponse);
        const parsed: MeResponseDTO = JSON.parse(json);

        // Then
        expect(typeof parsed.id).toBe('number');
        expect(typeof parsed.role.id).toBe('number');
        expect(typeof parsed.role.access_level).toBe('number');
        expect(typeof parsed.role.is_active).toBe('boolean');
        expect(typeof parsed.notification_preferences.email_notifications).toBe('boolean');
      });
    });

    describe('edge cases', () => {
      it('should handle empty string values', () => {
        // Given
        const responseWithEmptyStrings: MeResponseDTO = {
          ...mockMeResponse,
          username: '',
          email: '',
          first_name: '',
          last_name: '',
        };

        // Then
        expect(responseWithEmptyStrings.username).toBe('');
        expect(responseWithEmptyStrings.email).toBe('');
        expect(responseWithEmptyStrings.first_name).toBe('');
        expect(responseWithEmptyStrings.last_name).toBe('');
      });

      it('should handle zero and negative numeric values', () => {
        // Given
        const responseWithEdgeNumbers: MeResponseDTO = {
          ...mockMeResponse,
          id: 0,
          role: {
            ...mockMeResponse.role,
            id: -1,
            access_level: 0,
          },
        };

        // Then
        expect(responseWithEdgeNumbers.id).toBe(0);
        expect(responseWithEdgeNumbers.role.id).toBe(-1);
        expect(responseWithEdgeNumbers.role.access_level).toBe(0);
      });

      it('should handle special characters in string fields', () => {
        // Given
        const responseWithSpecialChars: MeResponseDTO = {
          ...mockMeResponse,
          username: 'user_with_émojis_🚀',
          email: 'special+chars@example.com',
          first_name: 'José',
          last_name: 'García-López',
          role: {
            ...mockMeResponse.role,
            name: 'Super Admin & Manager',
          },
        };

        // Then
        expect(responseWithSpecialChars.username).toBe('user_with_émojis_🚀');
        expect(responseWithSpecialChars.email).toBe('special+chars@example.com');
        expect(responseWithSpecialChars.first_name).toBe('José');
        expect(responseWithSpecialChars.last_name).toBe('García-López');
        expect(responseWithSpecialChars.role.name).toBe('Super Admin & Manager');
      });

      it('should handle all boolean combinations for role.is_active', () => {
        // Given
        const activeRole: MeResponseDTO = {
          ...mockMeResponse,
          role: { ...mockMeResponse.role, is_active: true },
        };
        const inactiveRole: MeResponseDTO = {
          ...mockMeResponse,
          role: { ...mockMeResponse.role, is_active: false },
        };

        // Then
        expect(activeRole.role.is_active).toBe(true);
        expect(inactiveRole.role.is_active).toBe(false);
      });

      it('should handle all boolean combinations for notification preferences', () => {
        // Given
        const allEnabledPrefs: MeResponseDTO = {
          ...mockMeResponse,
          notification_preferences: {
            email_notifications: true,
            system_notifications: true,
            task_notifications: true,
          },
        };
        const allDisabledPrefs: MeResponseDTO = {
          ...mockMeResponse,
          notification_preferences: {
            email_notifications: false,
            system_notifications: false,
            task_notifications: false,
          },
        };

        // Then
        expect(allEnabledPrefs.notification_preferences.email_notifications).toBe(true);
        expect(allEnabledPrefs.notification_preferences.system_notifications).toBe(true);
        expect(allEnabledPrefs.notification_preferences.task_notifications).toBe(true);

        expect(allDisabledPrefs.notification_preferences.email_notifications).toBe(false);
        expect(allDisabledPrefs.notification_preferences.system_notifications).toBe(false);
        expect(allDisabledPrefs.notification_preferences.task_notifications).toBe(false);
      });

      it('should handle very long string values', () => {
        // Given
        const longString = 'a'.repeat(1000);
        const responseWithLongStrings: MeResponseDTO = {
          ...mockMeResponse,
          username: longString,
          role: {
            ...mockMeResponse.role,
            name: longString,
          },
        };

        // Then
        expect(responseWithLongStrings.username).toBe(longString);
        expect(responseWithLongStrings.username.length).toBe(1000);
        expect(responseWithLongStrings.role.name).toBe(longString);
      });

      it('should handle extreme access_level values', () => {
        // Given
        const maxAccessLevel: MeResponseDTO = {
          ...mockMeResponse,
          role: {
            ...mockMeResponse.role,
            access_level: Number.MAX_SAFE_INTEGER,
          },
        };
        const minAccessLevel: MeResponseDTO = {
          ...mockMeResponse,
          role: {
            ...mockMeResponse.role,
            access_level: Number.MIN_SAFE_INTEGER,
          },
        };

        // Then
        expect(maxAccessLevel.role.access_level).toBe(Number.MAX_SAFE_INTEGER);
        expect(minAccessLevel.role.access_level).toBe(Number.MIN_SAFE_INTEGER);
      });
    });

    describe('data consistency', () => {
      it('should have positive user ID', () => {
        // Then
        expect(mockMeResponse.id).toBeGreaterThan(0);
      });

      it('should have valid email format structure', () => {
        // Then
        expect(mockMeResponse.email).toContain('@');
        expect(mockMeResponse.email.split('@').length).toBe(2);
      });

      it('should have consistent role data', () => {
        // Given
        const role = mockMeResponse.role;

        // Then
        expect(role.id).toBeGreaterThan(0);
        expect(role.name.length).toBeGreaterThan(0);
        expect(role.access_level).toBeGreaterThanOrEqual(0);
      });

      it('should have valid notification preferences structure', () => {
        // Given
        const prefs = mockMeResponse.notification_preferences;

        // Then
        expect(typeof prefs.email_notifications).toBe('boolean');
        expect(typeof prefs.system_notifications).toBe('boolean');
        expect(typeof prefs.task_notifications).toBe('boolean');
      });
    });

    describe('nested object manipulation', () => {
      it('should allow independent modification of role properties', () => {
        // Given
        const modifiedResponse: MeResponseDTO = {
          ...mockMeResponse,
          role: {
            ...mockMeResponse.role,
            name: 'Modified Role',
            access_level: 50,
          },
        };

        // Then
        expect(modifiedResponse.role.name).toBe('Modified Role');
        expect(modifiedResponse.role.access_level).toBe(50);
        expect(modifiedResponse.role.id).toBe(mockMeResponse.role.id); // Unchanged
        expect(modifiedResponse.role.is_active).toBe(mockMeResponse.role.is_active); // Unchanged
      });

      it('should allow independent modification of notification preferences', () => {
        // Given
        const modifiedResponse: MeResponseDTO = {
          ...mockMeResponse,
          notification_preferences: {
            ...mockMeResponse.notification_preferences,
            email_notifications: false,
            task_notifications: true,
          },
        };

        // Then
        expect(modifiedResponse.notification_preferences.email_notifications).toBe(false);
        expect(modifiedResponse.notification_preferences.task_notifications).toBe(true);
        expect(modifiedResponse.notification_preferences.system_notifications).toBe(
          mockMeResponse.notification_preferences.system_notifications
        ); // Unchanged
      });

      it('should maintain object references correctly', () => {
        // Given
        const response1: MeResponseDTO = JSON.parse(JSON.stringify(mockMeResponse));
        const response2: MeResponseDTO = JSON.parse(JSON.stringify(mockMeResponse));

        // When
        response1.role.name = 'Changed Role';

        // Then
        expect(response1.role.name).toBe('Changed Role');
        expect(response2.role.name).toBe(mockMeResponse.role.name); // Should remain unchanged
      });
    });

    describe('integration scenarios', () => {
      it('should handle complete user profile data', () => {
        // Given
        const completeProfile: MeResponseDTO = {
          id: 456,
          username: 'complete_user',
          email: 'complete@example.com',
          first_name: 'Complete',
          last_name: 'User',
          role: {
            id: 2,
            name: 'Editor',
            access_level: 75,
            is_active: true,
          },
          notification_preferences: {
            email_notifications: true,
            system_notifications: false,
            task_notifications: true,
          },
        };

        // When
        const json = JSON.stringify(completeProfile);
        const parsed: MeResponseDTO = JSON.parse(json);

        // Then
        expect(parsed).toEqual(completeProfile);
        expect(parsed.role.access_level).toBe(75);
        expect(parsed.notification_preferences.system_notifications).toBe(false);
      });

      it('should handle minimal valid user data', () => {
        // Given
        const minimalProfile: MeResponseDTO = {
          id: 1,
          username: 'min',
          email: 'a@b.c',
          first_name: '',
          last_name: '',
          role: {
            id: 1,
            name: 'User',
            access_level: 1,
            is_active: true,
          },
          notification_preferences: {
            email_notifications: false,
            system_notifications: false,
            task_notifications: false,
          },
        };

        // When
        const json = JSON.stringify(minimalProfile);
        const parsed: MeResponseDTO = JSON.parse(json);

        // Then
        expect(parsed).toEqual(minimalProfile);
        expect(parsed.first_name).toBe('');
        expect(parsed.last_name).toBe('');
      });
    });
  });
});
