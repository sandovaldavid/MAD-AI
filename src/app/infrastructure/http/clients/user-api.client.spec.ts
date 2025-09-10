import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UserApiClient } from './user-api.client';
import { API_ENDPOINTS_V1 } from '@infrastructure/config/api-endpoints.config';
import {
  ListUsersResponseDTO,
  CreateUserRequestDTO,
  CreateUserResponseDTO,
  UpdateUserRequestDTO,
  UpdateUserResponseDTO,
  UserDetailResponseDTO,
  ChangePasswordRequestDTO,
  ChangePasswordResponseDTO,
  DeactivateUserResponseDTO,
} from '@infrastructure/dtos/user';

describe('UserApiClient - Infrastructure Tests', () => {
  let client: UserApiClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserApiClient, provideHttpClient(), provideHttpClientTesting()],
    });

    client = TestBed.inject(UserApiClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Instantiation and Dependency Injection', () => {
    it('should be created successfully', () => {
      // Then
      expect(client).toBeTruthy();
      expect(client).toBeInstanceOf(UserApiClient);
    });

    it('should inject HttpClient dependency correctly', () => {
      // Then
      expect((client as any).http).toBeTruthy();
    });

    it('should be provided as root service', () => {
      // Given
      const secondInstance = TestBed.inject(UserApiClient);

      // Then
      expect(secondInstance).toBe(client); // Same instance (singleton)
    });

    it('should work with different TestBed configurations', () => {
      // Given
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          // UserApiClient not explicitly provided, should use providedIn: 'root'
          provideHttpClient(),
          provideHttpClientTesting(),
        ],
      });

      // When
      const newClient = TestBed.inject(UserApiClient);
      const newHttpMock = TestBed.inject(HttpTestingController);

      // Then
      expect(newClient).toBeTruthy();
      expect(newClient).toBeInstanceOf(UserApiClient);

      // Test that it actually works
      newClient.list().subscribe();
      const req = newHttpMock.expectOne(API_ENDPOINTS_V1.USERS.LIST);
      expect(req).toBeTruthy();
      req.flush([]);
      newHttpMock.verify();
    });
  });

  describe('Complete Method Coverage', () => {
    it('should have all public methods defined', () => {
      // Verify all expected methods exist
      expect(typeof client.list).toBe('function');
      expect(typeof client.getById).toBe('function');
      expect(typeof client.getByEmail).toBe('function');
      expect(typeof client.getByUsername).toBe('function');
      expect(typeof client.create).toBe('function');
      expect(typeof client.update).toBe('function');
      expect(typeof client.delete).toBe('function');
      expect(typeof client.activate).toBe('function');
      expect(typeof client.deactivate).toBe('function');
      expect(typeof client.changePassword).toBe('function');
      expect(typeof client.changeRole).toBe('function');
    });

    it('should exercise every method at least once', () => {
      // Call every method to ensure full coverage
      const createRequest: CreateUserRequestDTO = {
        username: 'test',
        email: 'test@test.com',
        password: 'test',
        first_name: 'Test',
        last_name: 'User',
        role_id: 1,
      };
      const updateRequest: UpdateUserRequestDTO = {
        first_name: 'Updated',
        last_name: 'User',
        email: 'updated@test.com',
        role_id: 1,
        status: 'active',
        email_notifications_enabled: true,
        system_notifications_enabled: true,
        task_notifications_enabled: true,
      };
      const passwordRequest: ChangePasswordRequestDTO = {
        current_password: 'old',
        new_password: 'new',
        new_password_confirm: 'new',
      };

      // Execute all methods
      client.list().subscribe();
      client.list({ search: 'test' }).subscribe();
      client.getById(1).subscribe();
      client.getByEmail('test@test.com').subscribe();
      client.getByUsername('testuser').subscribe();
      client.create(createRequest).subscribe();
      client.update(1, updateRequest).subscribe();
      client.delete(1).subscribe();
      client.activate(1).subscribe();
      client.deactivate(1).subscribe();
      client.changePassword(passwordRequest).subscribe();
      client.changeRole(1, 2).subscribe();

      // Verify all requests were made
      const requests = httpMock.match(() => true);
      expect(requests.length).toBe(12);

      // Flush all requests
      requests.forEach((req) => req.flush({}));
    });
  });

  describe('list', () => {
    it('should make GET request to list users without filters', () => {
      // Given
      const mockResponse: ListUsersResponseDTO = [
        {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          is_active: true,
          role_name: 'Admin',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      // When
      client.list().subscribe((response) => {
        // Then
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(API_ENDPOINTS_V1.USERS.LIST);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockResponse);
    });

    it('should make GET request to list users with filters', () => {
      // Given
      const filters = {
        search: 'john',
        status: 'active',
        role_id: 2,
        limit: 20,
        offset: 10,
      };
      const mockResponse: ListUsersResponseDTO = [];

      // When
      client.list(filters).subscribe((response) => {
        // Then
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne((request) => {
        return (
          request.url === API_ENDPOINTS_V1.USERS.LIST &&
          request.params.get('search') === 'john' &&
          request.params.get('status') === 'active' &&
          request.params.get('role_id') === '2' &&
          request.params.get('limit') === '20' &&
          request.params.get('offset') === '10'
        );
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle list users HTTP errors', () => {
      // Given
      const errorMessage = 'Server error';

      // When
      client.list().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          // Then
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(API_ENDPOINTS_V1.USERS.LIST);
      req.flush(errorMessage, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getById', () => {
    it('should make GET request to get user by ID', () => {
      // Given
      const userId = 123;
      const mockResponse: UserDetailResponseDTO = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
        status: 'active',
        is_email_confirmed: true,
        profile_completed: true,
        email_notifications_enabled: true,
        system_notifications_enabled: true,
        task_notifications_enabled: true,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        role_id: 1,
        role_name: 'Admin',
        last_activity_at: '2024-01-01T00:00:00Z',
      };

      // When
      client.getById(userId).subscribe((response) => {
        // Then
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(API_ENDPOINTS_V1.USERS.DETAIL(userId));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle getById HTTP errors', () => {
      // Given
      const userId = 999;
      const errorMessage = 'User not found';

      // When
      client.getById(userId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          // Then
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(API_ENDPOINTS_V1.USERS.DETAIL(userId));
      req.flush(errorMessage, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getByEmail', () => {
    it('should make GET request to get user by email', () => {
      // Given
      const email = 'test@example.com';
      const mockResponse: UserDetailResponseDTO = {
        id: 1,
        username: 'testuser',
        email: email,
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
        status: 'active',
        is_email_confirmed: true,
        profile_completed: true,
        email_notifications_enabled: true,
        system_notifications_enabled: true,
        task_notifications_enabled: true,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        role_id: 1,
        role_name: 'Admin',
        last_activity_at: '2024-01-01T00:00:00Z',
      };

      // When
      client.getByEmail(email).subscribe((response) => {
        // Then
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne((request) => {
        return request.url === API_ENDPOINTS_V1.USERS.LIST && request.params.get('email') === email;
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getByUsername', () => {
    it('should make GET request to get user by username', () => {
      // Given
      const username = 'testuser';
      const mockResponse: UserDetailResponseDTO = {
        id: 1,
        username: username,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
        status: 'active',
        is_email_confirmed: true,
        profile_completed: true,
        email_notifications_enabled: true,
        system_notifications_enabled: true,
        task_notifications_enabled: true,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        role_id: 1,
        role_name: 'Admin',
        last_activity_at: '2024-01-01T00:00:00Z',
      };

      // When
      client.getByUsername(username).subscribe((response) => {
        // Then
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne((request) => {
        return (
          request.url === API_ENDPOINTS_V1.USERS.LIST && request.params.get('username') === username
        );
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('create', () => {
    it('should make POST request to create user', () => {
      // Given
      const userData: CreateUserRequestDTO = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User',
        role_id: 2,
      };
      const mockResponse: CreateUserResponseDTO = {
        id: 123,
        username: userData.username,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        full_name: `${userData.first_name} ${userData.last_name}`,
        status: 'active',
        is_email_confirmed: false,
        profile_completed: false,
        email_notifications_enabled: true,
        system_notifications_enabled: true,
        task_notifications_enabled: true,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        role_id: userData.role_id,
        role_name: 'User',
        last_activity_at: null,
      };

      // When
      client.create(userData).subscribe((response) => {
        // Then
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(API_ENDPOINTS_V1.USERS.CREATE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(userData);
      req.flush(mockResponse);
    });

    it('should handle create user HTTP errors', () => {
      // Given
      const userData: CreateUserRequestDTO = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
        first_name: 'Existing',
        last_name: 'User',
        role_id: 2,
      };
      const errorMessage = 'User already exists';

      // When
      client.create(userData).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          // Then
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(API_ENDPOINTS_V1.USERS.CREATE);
      req.flush(errorMessage, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('update', () => {
    it('should make PUT request to update user', () => {
      // Given
      const userId = 123;
      const userData: UpdateUserRequestDTO = {
        first_name: 'Updated',
        last_name: 'Name',
        email: 'updated@example.com',
        role_id: 1,
        status: 'active',
        email_notifications_enabled: true,
        system_notifications_enabled: true,
        task_notifications_enabled: true,
      };
      const mockResponse: UpdateUserResponseDTO = {
        id: userId,
        username: 'testuser',
        email: userData.email!,
        first_name: userData.first_name!,
        last_name: userData.last_name!,
        full_name: `${userData.first_name} ${userData.last_name}`,
        status: 'active',
        is_email_confirmed: true,
        profile_completed: true,
        email_notifications_enabled: true,
        system_notifications_enabled: true,
        task_notifications_enabled: true,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
        role_id: 1,
        role_name: 'Admin',
        last_activity_at: '2024-01-01T00:00:00Z',
      };

      // When
      client.update(userId, userData).subscribe((response) => {
        // Then
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(API_ENDPOINTS_V1.USERS.UPDATE(userId));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(userData);
      req.flush(mockResponse);
    });

    it('should handle update user HTTP errors', () => {
      // Given
      const userId = 999;
      const userData: UpdateUserRequestDTO = {
        first_name: 'Updated',
        last_name: 'User',
        email: 'user@example.com',
        role_id: 1,
        status: 'active',
        email_notifications_enabled: true,
        system_notifications_enabled: true,
        task_notifications_enabled: true,
      };
      const errorMessage = 'User not found';

      // When
      client.update(userId, userData).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          // Then
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(API_ENDPOINTS_V1.USERS.UPDATE(userId));
      req.flush(errorMessage, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('delete', () => {
    it('should make DELETE request to delete user', () => {
      // Given
      const userId = 123;

      // When
      client.delete(userId).subscribe((response) => {
        // Then
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne(API_ENDPOINTS_V1.USERS.DELETE(userId));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle delete user HTTP errors', () => {
      // Given
      const userId = 999;
      const errorMessage = 'User not found';

      // When
      client.delete(userId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          // Then
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(API_ENDPOINTS_V1.USERS.DELETE(userId));
      req.flush(errorMessage, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('activate', () => {
    it('should make POST request to activate user', () => {
      // Given
      const userId = 123;
      const mockResponse: DeactivateUserResponseDTO = {
        message: 'User activated successfully',
      };

      // When
      client.activate(userId).subscribe((response) => {
        // Then
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(API_ENDPOINTS_V1.USERS.ACTIVATE(userId));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });

  describe('deactivate', () => {
    it('should make POST request to deactivate user', () => {
      // Given
      const userId = 123;
      const mockResponse: DeactivateUserResponseDTO = {
        message: 'User deactivated successfully',
      };

      // When
      client.deactivate(userId).subscribe((response) => {
        // Then
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(API_ENDPOINTS_V1.USERS.DEACTIVATE(userId));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });

  describe('changePassword', () => {
    it('should make POST request to change password', () => {
      // Given
      const passwordData: ChangePasswordRequestDTO = {
        current_password: 'oldpassword',
        new_password: 'newpassword123',
        new_password_confirm: 'newpassword123',
      };
      const mockResponse: ChangePasswordResponseDTO = {
        message: 'Password changed successfully',
      };

      // When
      client.changePassword(passwordData).subscribe((response) => {
        // Then
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(API_ENDPOINTS_V1.USERS.CHANGE_PASSWORD);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(passwordData);
      req.flush(mockResponse);
    });

    it('should handle change password HTTP errors', () => {
      // Given
      const passwordData: ChangePasswordRequestDTO = {
        current_password: 'wrongpassword',
        new_password: 'newpassword123',
        new_password_confirm: 'newpassword123',
      };
      const errorMessage = 'Current password is incorrect';

      // When
      client.changePassword(passwordData).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          // Then
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(API_ENDPOINTS_V1.USERS.CHANGE_PASSWORD);
      req.flush(errorMessage, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('changeRole', () => {
    it('should make POST request to change user role', () => {
      // Given
      const userId = 123;
      const roleId = 2;

      // When
      client.changeRole(userId, roleId).subscribe((response) => {
        // Then
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne(API_ENDPOINTS_V1.USERS.CHANGE_ROLE(userId));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ role_id: roleId });
      req.flush(null);
    });

    it('should handle change role HTTP errors', () => {
      // Given
      const userId = 999;
      const roleId = 2;
      const errorMessage = 'User not found';

      // When
      client.changeRole(userId, roleId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          // Then
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(API_ENDPOINTS_V1.USERS.CHANGE_ROLE(userId));
      req.flush(errorMessage, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('Enhanced Error Handling', () => {
    it('should handle various HTTP error statuses for list operation', () => {
      const testCases = [
        { status: 401, statusText: 'Unauthorized', expectedError: 'Authentication required' },
        { status: 403, statusText: 'Forbidden', expectedError: 'Access denied' },
        { status: 500, statusText: 'Internal Server Error', expectedError: 'Server error' },
      ];

      testCases.forEach((testCase) => {
        // When
        client.list().subscribe({
          next: () => fail(`Should have failed with ${testCase.status}`),
          error: (error) => {
            expect(error.status).toBe(testCase.status);
            expect(error.statusText).toBe(testCase.statusText);
          },
        });

        // Then
        const req = httpMock.expectOne(API_ENDPOINTS_V1.USERS.LIST);
        req.flush(
          { message: testCase.expectedError },
          {
            status: testCase.status,
            statusText: testCase.statusText,
          }
        );
      });
    });

    it('should handle network errors gracefully', () => {
      const networkErrorScenarios = [
        { status: 0, statusText: '', description: 'Network error' },
        { status: 504, statusText: 'Gateway Timeout', description: 'Request timeout' },
      ];

      networkErrorScenarios.forEach((scenario) => {
        // When
        client.getById(1).subscribe({
          next: () => fail(`Should have failed with ${scenario.description}`),
          error: (error) => {
            expect(error.status).toBe(scenario.status);
          },
        });

        // Then
        const req = httpMock.expectOne(API_ENDPOINTS_V1.USERS.DETAIL(1));
        req.flush('', { status: scenario.status, statusText: scenario.statusText });
      });
    });
  });

  describe('Integration and Edge Cases', () => {
    it('should handle empty responses gracefully', () => {
      // When
      client.list().subscribe((response) => {
        expect(response).toEqual([]);
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.USERS.LIST);
      req.flush([]); // Empty array response
    });

    it('should handle special characters in request data', () => {
      // Given
      const specialCharRequest: CreateUserRequestDTO = {
        username: 'test@user+special.chars_123',
        email: 'tëst@éxàmple.com',
        password: 'p\u00e1ss🔐w\u00f6rd!@#$%^&*()',
        first_name: 'Tëst',
        last_name: 'Üser',
        role_id: 1,
      };

      // When
      client.create(specialCharRequest).subscribe();

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.USERS.CREATE);
      expect(req.request.body).toEqual(specialCharRequest);
      expect(req.request.body.password).toContain('🔐');
      req.flush({});
    });

    it('should maintain type safety for all method responses', () => {
      // When - Test that TypeScript types are maintained
      client.list().subscribe((response: ListUsersResponseDTO) => {
        expect(Array.isArray(response)).toBe(true);
      });

      client.getById(1).subscribe((response: UserDetailResponseDTO) => {
        expect(response.id).toBeDefined();
        expect(response.username).toBeDefined();
        expect(response.email).toBeDefined();
      });

      // Then
      const listReq = httpMock.expectOne(API_ENDPOINTS_V1.USERS.LIST);
      listReq.flush([]);

      const getByIdReq = httpMock.expectOne(API_ENDPOINTS_V1.USERS.DETAIL(1));
      getByIdReq.flush({
        id: 1,
        username: 'test',
        email: 'test@test.com',
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
        status: 'active',
        is_email_confirmed: true,
        profile_completed: true,
        email_notifications_enabled: true,
        system_notifications_enabled: true,
        task_notifications_enabled: true,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        role_id: 1,
        role_name: 'Admin',
        last_activity_at: '2024-01-01T00:00:00Z',
      });
    });
  });
});
