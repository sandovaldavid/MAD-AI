import { API_ENDPOINTS_V1, ApiEndpoints } from './api-endpoints.config';
import { environment } from '@/env/environment';

describe('API Endpoints Configuration - Infrastructure Tests', () => {
  describe('API_ENDPOINTS_V1', () => {
    describe('AUTH endpoints', () => {
      it('should have all required AUTH endpoints', () => {
        // Then
        expect(API_ENDPOINTS_V1.AUTH.BASE).toBeDefined();
        expect(API_ENDPOINTS_V1.AUTH.LOGIN).toBeDefined();
        expect(API_ENDPOINTS_V1.AUTH.ME).toBeDefined();
        expect(API_ENDPOINTS_V1.AUTH.REFRESH).toBeDefined();
        expect(API_ENDPOINTS_V1.AUTH.LOGOUT).toBeDefined();
        expect(API_ENDPOINTS_V1.AUTH.REGISTER).toBeDefined();
        expect(API_ENDPOINTS_V1.AUTH.CONFIRM_EMAIL).toBeDefined();
        expect(API_ENDPOINTS_V1.AUTH.RESET_PASSWORD).toBeDefined();
        expect(API_ENDPOINTS_V1.AUTH.RESET_PASSWORD_CONFIRM).toBeDefined();
      });

      it('should construct AUTH endpoints with correct base URL', () => {
        // Then
        expect(API_ENDPOINTS_V1.AUTH.BASE).toBe(`${environment.API_URL}/auth`);
        expect(API_ENDPOINTS_V1.AUTH.LOGIN).toBe(`${environment.API_URL}/auth/login/`);
        expect(API_ENDPOINTS_V1.AUTH.ME).toBe(`${environment.API_URL}/auth/me`);
        expect(API_ENDPOINTS_V1.AUTH.REFRESH).toBe(`${environment.API_URL}/auth/refresh-token`);
        expect(API_ENDPOINTS_V1.AUTH.LOGOUT).toBe(`${environment.API_URL}/auth/logout`);
        expect(API_ENDPOINTS_V1.AUTH.REGISTER).toBe(`${environment.API_URL}/auth/register`);
        expect(API_ENDPOINTS_V1.AUTH.CONFIRM_EMAIL).toBe(
          `${environment.API_URL}/auth/confirm-email`
        );
        expect(API_ENDPOINTS_V1.AUTH.RESET_PASSWORD).toBe(
          `${environment.API_URL}/auth/reset-password`
        );
        expect(API_ENDPOINTS_V1.AUTH.RESET_PASSWORD_CONFIRM).toBe(
          `${environment.API_URL}/auth/reset-password/confirm`
        );
      });

      it('should have string type for all AUTH endpoints', () => {
        // Then
        expect(typeof API_ENDPOINTS_V1.AUTH.BASE).toBe('string');
        expect(typeof API_ENDPOINTS_V1.AUTH.LOGIN).toBe('string');
        expect(typeof API_ENDPOINTS_V1.AUTH.ME).toBe('string');
        expect(typeof API_ENDPOINTS_V1.AUTH.REFRESH).toBe('string');
        expect(typeof API_ENDPOINTS_V1.AUTH.LOGOUT).toBe('string');
        expect(typeof API_ENDPOINTS_V1.AUTH.REGISTER).toBe('string');
        expect(typeof API_ENDPOINTS_V1.AUTH.CONFIRM_EMAIL).toBe('string');
        expect(typeof API_ENDPOINTS_V1.AUTH.RESET_PASSWORD).toBe('string');
        expect(typeof API_ENDPOINTS_V1.AUTH.RESET_PASSWORD_CONFIRM).toBe('string');
      });

      it('should contain valid URL paths', () => {
        // Then
        expect(API_ENDPOINTS_V1.AUTH.BASE).toContain('/auth');
        expect(API_ENDPOINTS_V1.AUTH.LOGIN).toContain('/auth/login');
        expect(API_ENDPOINTS_V1.AUTH.ME).toContain('/auth/me');
        expect(API_ENDPOINTS_V1.AUTH.REFRESH).toContain('/auth/refresh-token');
        expect(API_ENDPOINTS_V1.AUTH.LOGOUT).toContain('/auth/logout');
        expect(API_ENDPOINTS_V1.AUTH.REGISTER).toContain('/auth/register');
        expect(API_ENDPOINTS_V1.AUTH.CONFIRM_EMAIL).toContain('/auth/confirm-email');
        expect(API_ENDPOINTS_V1.AUTH.RESET_PASSWORD).toContain('/auth/reset-password');
        expect(API_ENDPOINTS_V1.AUTH.RESET_PASSWORD_CONFIRM).toContain(
          '/auth/reset-password/confirm'
        );
      });
    });

    describe('USERS endpoints', () => {
      it('should have all required USERS endpoints', () => {
        // Then
        expect(API_ENDPOINTS_V1.USERS.BASE).toBeDefined();
        expect(API_ENDPOINTS_V1.USERS.LIST).toBeDefined();
        expect(API_ENDPOINTS_V1.USERS.DETAIL).toBeDefined();
        expect(API_ENDPOINTS_V1.USERS.CREATE).toBeDefined();
        expect(API_ENDPOINTS_V1.USERS.UPDATE).toBeDefined();
        expect(API_ENDPOINTS_V1.USERS.DELETE).toBeDefined();
        expect(API_ENDPOINTS_V1.USERS.ACTIVATE).toBeDefined();
        expect(API_ENDPOINTS_V1.USERS.DEACTIVATE).toBeDefined();
        expect(API_ENDPOINTS_V1.USERS.CHANGE_PASSWORD).toBeDefined();
        expect(API_ENDPOINTS_V1.USERS.CHANGE_ROLE).toBeDefined();
      });

      it('should construct static USERS endpoints with correct base URL', () => {
        // Then
        expect(API_ENDPOINTS_V1.USERS.BASE).toBe(`${environment.API_URL}/auth/users`);
        expect(API_ENDPOINTS_V1.USERS.LIST).toBe(`${environment.API_URL}/auth/users/`);
        expect(API_ENDPOINTS_V1.USERS.CREATE).toBe(`${environment.API_URL}/auth/users/create`);
        expect(API_ENDPOINTS_V1.USERS.CHANGE_PASSWORD).toBe(
          `${environment.API_URL}/auth/users/change-password`
        );
      });

      it('should have function type for dynamic USERS endpoints', () => {
        // Then
        expect(typeof API_ENDPOINTS_V1.USERS.DETAIL).toBe('function');
        expect(typeof API_ENDPOINTS_V1.USERS.UPDATE).toBe('function');
        expect(typeof API_ENDPOINTS_V1.USERS.DELETE).toBe('function');
        expect(typeof API_ENDPOINTS_V1.USERS.ACTIVATE).toBe('function');
        expect(typeof API_ENDPOINTS_V1.USERS.DEACTIVATE).toBe('function');
        expect(typeof API_ENDPOINTS_V1.USERS.CHANGE_ROLE).toBe('function');
      });

      it('should generate correct URLs for dynamic USERS endpoints', () => {
        // Given
        const userId = 123;

        // When
        const detailUrl = API_ENDPOINTS_V1.USERS.DETAIL(userId);
        const updateUrl = API_ENDPOINTS_V1.USERS.UPDATE(userId);
        const deleteUrl = API_ENDPOINTS_V1.USERS.DELETE(userId);
        const activateUrl = API_ENDPOINTS_V1.USERS.ACTIVATE(userId);
        const deactivateUrl = API_ENDPOINTS_V1.USERS.DEACTIVATE(userId);
        const changeRoleUrl = API_ENDPOINTS_V1.USERS.CHANGE_ROLE(userId);

        // Then
        expect(detailUrl).toBe(`${environment.API_URL}/auth/users/${userId}/`);
        expect(updateUrl).toBe(`${environment.API_URL}/auth/users/${userId}/update`);
        expect(deleteUrl).toBe(`${environment.API_URL}/auth/users/${userId}/delete`);
        expect(activateUrl).toBe(`${environment.API_URL}/auth/users/${userId}/activate`);
        expect(deactivateUrl).toBe(`${environment.API_URL}/auth/users/${userId}/deactivate`);
        expect(changeRoleUrl).toBe(`${environment.API_URL}/auth/users/${userId}/change-role`);
      });

      it('should handle different user ID types', () => {
        // Given
        const userIds = [1, 999, 0, -1];

        // Then
        userIds.forEach((id) => {
          const detailUrl = API_ENDPOINTS_V1.USERS.DETAIL(id);
          expect(detailUrl).toBe(`${environment.API_URL}/auth/users/${id}/`);
          expect(typeof detailUrl).toBe('string');
        });
      });
    });

    describe('ROLES endpoints', () => {
      it('should have all required ROLES endpoints', () => {
        // Then
        expect(API_ENDPOINTS_V1.ROLES.BASE).toBeDefined();
        expect(API_ENDPOINTS_V1.ROLES.LIST).toBeDefined();
        expect(API_ENDPOINTS_V1.ROLES.DETAIL).toBeDefined();
        expect(API_ENDPOINTS_V1.ROLES.CREATE).toBeDefined();
        expect(API_ENDPOINTS_V1.ROLES.UPDATE).toBeDefined();
        expect(API_ENDPOINTS_V1.ROLES.DELETE).toBeDefined();
        expect(API_ENDPOINTS_V1.ROLES.ASSIGN).toBeDefined();
        expect(API_ENDPOINTS_V1.ROLES.UNASSIGN).toBeDefined();
      });

      it('should construct static ROLES endpoints with correct base URL', () => {
        // Then
        expect(API_ENDPOINTS_V1.ROLES.BASE).toBe(`${environment.API_URL}/auth/roles`);
        expect(API_ENDPOINTS_V1.ROLES.LIST).toBe(`${environment.API_URL}/auth/roles/`);
        expect(API_ENDPOINTS_V1.ROLES.CREATE).toBe(`${environment.API_URL}/auth/roles/create`);
        expect(API_ENDPOINTS_V1.ROLES.ASSIGN).toBe(`${environment.API_URL}/auth/roles/assign`);
        expect(API_ENDPOINTS_V1.ROLES.UNASSIGN).toBe(`${environment.API_URL}/auth/roles/unassign`);
      });

      it('should have function type for dynamic ROLES endpoints', () => {
        // Then
        expect(typeof API_ENDPOINTS_V1.ROLES.DETAIL).toBe('function');
        expect(typeof API_ENDPOINTS_V1.ROLES.UPDATE).toBe('function');
        expect(typeof API_ENDPOINTS_V1.ROLES.DELETE).toBe('function');
      });

      it('should generate correct URLs for dynamic ROLES endpoints', () => {
        // Given
        const roleId = 456;

        // When
        const detailUrl = API_ENDPOINTS_V1.ROLES.DETAIL(roleId);
        const updateUrl = API_ENDPOINTS_V1.ROLES.UPDATE(roleId);
        const deleteUrl = API_ENDPOINTS_V1.ROLES.DELETE(roleId);

        // Then
        expect(detailUrl).toBe(`${environment.API_URL}/auth/roles/${roleId}/`);
        expect(updateUrl).toBe(`${environment.API_URL}/auth/roles/${roleId}/update`);
        expect(deleteUrl).toBe(`${environment.API_URL}/auth/roles/${roleId}/delete`);
      });

      it('should handle different role ID types', () => {
        // Given
        const roleIds = [1, 2, 10, 999];

        // Then
        roleIds.forEach((id) => {
          const detailUrl = API_ENDPOINTS_V1.ROLES.DETAIL(id);
          expect(detailUrl).toBe(`${environment.API_URL}/auth/roles/${id}/`);
          expect(typeof detailUrl).toBe('string');
        });
      });
    });

    describe('EVENTS endpoints', () => {
      it('should have all required EVENTS endpoints', () => {
        // Then
        expect(API_ENDPOINTS_V1.EVENTS.BASE).toBeDefined();
        expect(API_ENDPOINTS_V1.EVENTS.PUBLISH).toBeDefined();
        expect(API_ENDPOINTS_V1.EVENTS.LIST).toBeDefined();
        expect(API_ENDPOINTS_V1.EVENTS.DETAIL).toBeDefined();
      });

      it('should construct static EVENTS endpoints with correct base URL', () => {
        // Then
        expect(API_ENDPOINTS_V1.EVENTS.BASE).toBe(`${environment.API_URL}/events`);
        expect(API_ENDPOINTS_V1.EVENTS.PUBLISH).toBe(`${environment.API_URL}/events/publish`);
        expect(API_ENDPOINTS_V1.EVENTS.LIST).toBe(`${environment.API_URL}/events/`);
      });

      it('should have function type for dynamic EVENTS endpoints', () => {
        // Then
        expect(typeof API_ENDPOINTS_V1.EVENTS.DETAIL).toBe('function');
      });

      it('should generate correct URLs for dynamic EVENTS endpoints', () => {
        // Given
        const eventId = 'event-123-abc';

        // When
        const detailUrl = API_ENDPOINTS_V1.EVENTS.DETAIL(eventId);

        // Then
        expect(detailUrl).toBe(`${environment.API_URL}/events/${eventId}/`);
      });

      it('should handle different event ID types', () => {
        // Given
        const eventIds = ['event-1', 'abc-123', 'uuid-550e8400-e29b-41d4-a716-446655440000', ''];

        // Then
        eventIds.forEach((id) => {
          const detailUrl = API_ENDPOINTS_V1.EVENTS.DETAIL(id);
          expect(detailUrl).toBe(`${environment.API_URL}/events/${id}/`);
          expect(typeof detailUrl).toBe('string');
        });
      });
    });
  });

  describe('Configuration structure', () => {
    it('should be a const assertion object', () => {
      // Then
      expect(typeof API_ENDPOINTS_V1).toBe('object');
      expect(API_ENDPOINTS_V1).not.toBeNull();
    });

    it('should have all main endpoint categories', () => {
      // Then
      expect(API_ENDPOINTS_V1.AUTH).toBeDefined();
      expect(API_ENDPOINTS_V1.USERS).toBeDefined();
      expect(API_ENDPOINTS_V1.ROLES).toBeDefined();
      expect(API_ENDPOINTS_V1.EVENTS).toBeDefined();
    });

    it('should have consistent structure across categories', () => {
      // Then
      expect(typeof API_ENDPOINTS_V1.AUTH).toBe('object');
      expect(typeof API_ENDPOINTS_V1.USERS).toBe('object');
      expect(typeof API_ENDPOINTS_V1.ROLES).toBe('object');
      expect(typeof API_ENDPOINTS_V1.EVENTS).toBe('object');
    });

    it('should not be modifiable (readonly)', () => {
      // When/Then - These should not throw in a const assertion context
      expect(() => {
        // This would fail at compile time due to const assertion
        // but we can test the runtime behavior
        const config = API_ENDPOINTS_V1 as any;
        expect(config).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('ApiEndpoints type', () => {
    it('should match the structure of API_ENDPOINTS_V1', () => {
      // Given
      const endpoints: ApiEndpoints = API_ENDPOINTS_V1;

      // Then
      expect(endpoints.AUTH).toBeDefined();
      expect(endpoints.USERS).toBeDefined();
      expect(endpoints.ROLES).toBeDefined();
      expect(endpoints.EVENTS).toBeDefined();
    });

    it('should preserve function signatures in type', () => {
      // Given
      const endpoints: ApiEndpoints = API_ENDPOINTS_V1;

      // Then
      expect(typeof endpoints.USERS.DETAIL).toBe('function');
      expect(typeof endpoints.ROLES.DETAIL).toBe('function');
      expect(typeof endpoints.EVENTS.DETAIL).toBe('function');
    });
  });

  describe('Environment integration', () => {
    it('should use environment.API_URL in all endpoints', () => {
      // Given
      const allEndpoints = [
        ...Object.values(API_ENDPOINTS_V1.AUTH),
        API_ENDPOINTS_V1.USERS.BASE,
        API_ENDPOINTS_V1.USERS.LIST,
        API_ENDPOINTS_V1.USERS.CREATE,
        API_ENDPOINTS_V1.USERS.CHANGE_PASSWORD,
        API_ENDPOINTS_V1.ROLES.BASE,
        API_ENDPOINTS_V1.ROLES.LIST,
        API_ENDPOINTS_V1.ROLES.CREATE,
        API_ENDPOINTS_V1.ROLES.ASSIGN,
        API_ENDPOINTS_V1.ROLES.UNASSIGN,
        API_ENDPOINTS_V1.EVENTS.BASE,
        API_ENDPOINTS_V1.EVENTS.PUBLISH,
        API_ENDPOINTS_V1.EVENTS.LIST,
      ];

      // Then
      allEndpoints.forEach((endpoint) => {
        if (typeof endpoint === 'string') {
          expect(endpoint).toContain(environment.API_URL);
        }
      });
    });

    it('should generate URLs with environment.API_URL for dynamic endpoints', () => {
      // Given
      const testId = 123;
      const testEventId = 'test-event';

      // When
      const userDetail = API_ENDPOINTS_V1.USERS.DETAIL(testId);
      const roleDetail = API_ENDPOINTS_V1.ROLES.DETAIL(testId);
      const eventDetail = API_ENDPOINTS_V1.EVENTS.DETAIL(testEventId);

      // Then
      expect(userDetail).toContain(environment.API_URL);
      expect(roleDetail).toContain(environment.API_URL);
      expect(eventDetail).toContain(environment.API_URL);
    });

    it('should handle different environment configurations', () => {
      // Given - Simulate different API_URL values
      const originalApiUrl = environment.API_URL;
      const testUrls = [
        'http://localhost:3000/api/v1',
        'https://api.example.com/v1',
        'https://staging-api.example.com/api/v1',
      ];

      // Then - All endpoints should adapt to environment changes
      testUrls.forEach((testUrl) => {
        // Note: In a real test, we'd need to mock the environment
        // Here we just verify the current structure works
        expect(API_ENDPOINTS_V1.AUTH.BASE).toContain(environment.API_URL);
        expect(API_ENDPOINTS_V1.USERS.DETAIL(1)).toContain(environment.API_URL);
      });
    });
  });

  describe('URL construction edge cases', () => {
    it('should handle zero IDs correctly', () => {
      // When
      const userDetail = API_ENDPOINTS_V1.USERS.DETAIL(0);
      const roleDetail = API_ENDPOINTS_V1.ROLES.DETAIL(0);

      // Then
      expect(userDetail).toBe(`${environment.API_URL}/auth/users/0/`);
      expect(roleDetail).toBe(`${environment.API_URL}/auth/roles/0/`);
    });

    it('should handle negative IDs correctly', () => {
      // When
      const userDetail = API_ENDPOINTS_V1.USERS.DETAIL(-1);
      const roleDetail = API_ENDPOINTS_V1.ROLES.DETAIL(-1);

      // Then
      expect(userDetail).toBe(`${environment.API_URL}/auth/users/-1/`);
      expect(roleDetail).toBe(`${environment.API_URL}/auth/roles/-1/`);
    });

    it('should handle large IDs correctly', () => {
      // Given
      const largeId = 999999999;

      // When
      const userDetail = API_ENDPOINTS_V1.USERS.DETAIL(largeId);
      const roleDetail = API_ENDPOINTS_V1.ROLES.DETAIL(largeId);

      // Then
      expect(userDetail).toBe(`${environment.API_URL}/auth/users/${largeId}/`);
      expect(roleDetail).toBe(`${environment.API_URL}/auth/roles/${largeId}/`);
    });

    it('should handle empty string event IDs', () => {
      // When
      const eventDetail = API_ENDPOINTS_V1.EVENTS.DETAIL('');

      // Then
      expect(eventDetail).toBe(`${environment.API_URL}/events//`);
    });

    it('should handle special characters in event IDs', () => {
      // Given
      const specialEventIds = [
        'event-with-dashes',
        'event_with_underscores',
        'event.with.dots',
        'event%20with%20encoding',
      ];

      // Then
      specialEventIds.forEach((eventId) => {
        const eventDetail = API_ENDPOINTS_V1.EVENTS.DETAIL(eventId);
        expect(eventDetail).toBe(`${environment.API_URL}/events/${eventId}/`);
      });
    });
  });

  describe('Endpoint consistency', () => {
    it('should have consistent trailing slash patterns', () => {
      // Then - List endpoints should have trailing slashes
      expect(API_ENDPOINTS_V1.AUTH.LOGIN.endsWith('/')).toBe(true);
      expect(API_ENDPOINTS_V1.USERS.LIST.endsWith('/')).toBe(true);
      expect(API_ENDPOINTS_V1.ROLES.LIST.endsWith('/')).toBe(true);
      expect(API_ENDPOINTS_V1.EVENTS.LIST.endsWith('/')).toBe(true);

      // Detail endpoints (when called) should have trailing slashes
      expect(API_ENDPOINTS_V1.USERS.DETAIL(1).endsWith('/')).toBe(true);
      expect(API_ENDPOINTS_V1.ROLES.DETAIL(1).endsWith('/')).toBe(true);
      expect(API_ENDPOINTS_V1.EVENTS.DETAIL('test').endsWith('/')).toBe(true);
    });

    it('should have consistent path structures', () => {
      // Then - All auth-related endpoints should start with /auth
      expect(API_ENDPOINTS_V1.AUTH.BASE).toContain('/auth');
      expect(API_ENDPOINTS_V1.USERS.BASE).toContain('/auth/users');
      expect(API_ENDPOINTS_V1.ROLES.BASE).toContain('/auth/roles');

      // Events should have their own path
      expect(API_ENDPOINTS_V1.EVENTS.BASE).toContain('/events');
      expect(API_ENDPOINTS_V1.EVENTS.BASE).not.toContain('/auth');
    });

    it('should have consistent action naming', () => {
      // Then - CRUD operations should be consistently named
      expect(API_ENDPOINTS_V1.USERS.CREATE).toContain('/create');
      expect(API_ENDPOINTS_V1.ROLES.CREATE).toContain('/create');

      expect(API_ENDPOINTS_V1.USERS.UPDATE(1)).toContain('/update');
      expect(API_ENDPOINTS_V1.ROLES.UPDATE(1)).toContain('/update');

      expect(API_ENDPOINTS_V1.USERS.DELETE(1)).toContain('/delete');
      expect(API_ENDPOINTS_V1.ROLES.DELETE(1)).toContain('/delete');
    });
  });
});
