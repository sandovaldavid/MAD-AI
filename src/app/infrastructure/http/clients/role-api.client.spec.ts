import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RoleApiClient } from './role-api.client';
import { API_ENDPOINTS_V1 } from '@infrastructure/config/api-endpoints.config';
import {
  UnassignRoleRequestDTO,
  UnassignRoleResponseDTO,
  AssignRoleRequestDTO,
  AssignRoleResponseDTO,
  RoleDetailResponseDTO,
  RolesResponseDTO,
  RequestUpdateRoleDTO,
  ResponseUpdateRoleDTO,
  CreateRoleRequestDTO,
  CreateRoleResponseDTO,
  DeleteRoleResponseDTO,
} from '@infrastructure/dtos/roles';

describe('RoleApiClient - Infrastructure Tests', () => {
  let client: RoleApiClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), RoleApiClient],
    });

    client = TestBed.inject(RoleApiClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Instantiation and Dependency Injection', () => {
    it('should be created successfully', () => {
      expect(client).toBeTruthy();
      expect(client).toBeInstanceOf(RoleApiClient);
    });

    it('should inject HttpClient dependency correctly', () => {
      expect((client as any).http).toBeTruthy();
      expect(typeof (client as any).http.request).toBe('function');
    });

    it('should be provided as root service', () => {
      const secondInstance = TestBed.inject(RoleApiClient);
      expect(secondInstance).toBe(client); // Same instance (singleton)
    });

    it('should work with different TestBed configurations', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting()],
      });

      const newClient = TestBed.inject(RoleApiClient);
      const newHttpMock = TestBed.inject(HttpTestingController);

      expect(newClient).toBeTruthy();
      expect(newClient).toBeInstanceOf(RoleApiClient);

      // Test that it actually works
      newClient.list().subscribe();
      const req = newHttpMock.expectOne(API_ENDPOINTS_V1.ROLES.LIST);
      expect(req).toBeTruthy();
      req.flush([]);
      newHttpMock.verify();
    });

    it('should maintain singleton pattern across different injection contexts', () => {
      const context1 = TestBed.inject(RoleApiClient);
      const context2 = TestBed.inject(RoleApiClient);

      const areSameInstance = context1 === context2;
      const areSameType = context1.constructor === context2.constructor;

      expect(areSameInstance).toBe(true);
      expect(areSameType).toBe(true);
      expect(Object.getPrototypeOf(context1)).toBe(Object.getPrototypeOf(context2));
    });

    it('should properly initialize with Angular DI metadata', () => {
      expect(client).toBeTruthy();
      expect(typeof RoleApiClient).toBe('function');
      expect(RoleApiClient.name).toMatch(/RoleApiClient/);
      expect(Object.getOwnPropertyDescriptor(RoleApiClient.prototype, 'constructor')).toBeDefined();
    });
  });

  describe('list', () => {
    it('should make GET request to list roles without filters', () => {
      // Given
      const mockResponse: RolesResponseDTO = [
        {
          id: 1,
          name: 'Admin',
          description: 'Administrator role',
          access_level: 5,
          is_active: true,
          user_count: 3,
        },
        {
          id: 2,
          name: 'User',
          description: 'Standard user role',
          access_level: 1,
          is_active: true,
          user_count: 10,
        },
      ];

      // When
      client.list().subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.LIST);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockResponse);
    });

    it('should make GET request to list roles with search filter', () => {
      // Given
      const filters = { search: 'admin' };
      const mockResponse: RolesResponseDTO = [
        {
          id: 1,
          name: 'Admin',
          description: 'Administrator role',
          access_level: 5,
          is_active: true,
          user_count: 3,
        },
      ];

      // When
      client.list(filters).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      // Then
      const req = httpMock.expectOne((req) => req.url === API_ENDPOINTS_V1.ROLES.LIST);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('search')).toBe('admin');
      req.flush(mockResponse);
    });

    it('should make GET request to list roles with all filters', () => {
      // Given
      const filters = {
        search: 'user',
        is_active: true,
        access_level: 2,
      };
      const mockResponse: RolesResponseDTO = [];

      // When
      client.list(filters).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      // Then
      const req = httpMock.expectOne((req) => req.url === API_ENDPOINTS_V1.ROLES.LIST);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('search')).toBe('user');
      expect(req.request.params.get('is_active')).toBe('true');
      expect(req.request.params.get('access_level')).toBe('2');
      req.flush(mockResponse);
    });

    it('should make GET request to list roles with is_active false', () => {
      // Given - Test the is_active: false branch (line 62-63)
      const filters = { is_active: false };
      const mockResponse: RolesResponseDTO = [];

      // When
      client.list(filters).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      // Then
      const req = httpMock.expectOne((req) => req.url === API_ENDPOINTS_V1.ROLES.LIST);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('is_active')).toBe('false');
      req.flush(mockResponse);
    });

    it('should make GET request to list roles with access_level zero', () => {
      // Given - Test the access_level edge case but 0 is falsy, so it won't be added
      const filters = { access_level: 0 };
      const mockResponse: RolesResponseDTO = [];

      // When
      client.list(filters).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      // Then - access_level 0 is falsy so it won't be added to params
      const req = httpMock.expectOne((req) => req.url === API_ENDPOINTS_V1.ROLES.LIST);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('access_level')).toBe(null);
      req.flush(mockResponse);
    });

    it('should make GET request to list roles with valid access_level', () => {
      // Given - Test with non-zero access_level that will be added
      const filters = { access_level: 1 };
      const mockResponse: RolesResponseDTO = [];

      // When
      client.list(filters).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      // Then - access_level 1 should be added to params
      const req = httpMock.expectOne((req) => req.url === API_ENDPOINTS_V1.ROLES.LIST);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('access_level')).toBe('1');
      req.flush(mockResponse);
    });

    it('should handle undefined vs null filters correctly', () => {
      // Given - Test undefined handling
      const filters = {
        search: undefined,
        is_active: undefined,
        access_level: undefined,
      };

      // When
      client.list(filters).subscribe();

      // Then - No params should be set for undefined values
      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.LIST);
      expect(req.request.params.keys().length).toBe(0);
      req.flush([]);
    });

    it('should make GET request with complex filter combinations', () => {
      // Given - Test all branches together
      const filters = {
        search: 'manager',
        is_active: true,
        access_level: 3,
      };
      const mockResponse: RolesResponseDTO = [
        {
          id: 3,
          name: 'Manager',
          description: 'Project manager role',
          access_level: 3,
          is_active: true,
          user_count: 5,
        },
      ];

      // When
      client.list(filters).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      // Then
      const req = httpMock.expectOne((req) => req.url === API_ENDPOINTS_V1.ROLES.LIST);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('search')).toBe('manager');
      expect(req.request.params.get('is_active')).toBe('true');
      expect(req.request.params.get('access_level')).toBe('3');
      req.flush(mockResponse);
    });

    it('should handle empty string search filter', () => {
      // Given - Test edge case with empty string
      const filters = { search: '' };

      // When
      client.list(filters).subscribe();

      // Then - Empty string should not be added as param
      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.LIST);
      expect(req.request.params.keys().length).toBe(0);
      req.flush([]);
    });

    it('should handle list HTTP errors', () => {
      // When
      client.list().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.LIST);
      req.flush(
        { message: 'Internal server error' },
        { status: 500, statusText: 'Internal Server Error' }
      );
    });
  });

  describe('getById', () => {
    it('should make GET request to get role by ID', () => {
      // Given
      const roleId = 1;
      const mockResponse: RoleDetailResponseDTO = {
        id: 1,
        name: 'Admin',
        description: 'Administrator role',
        access_level: 5,
        can_lead_projects: true,
        is_unique_per_team: false,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        user_count: 3,
      };

      // When
      client.getById(roleId).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.DETAIL(roleId));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle getById HTTP errors', () => {
      // Given
      const roleId = 999;

      // When
      client.getById(roleId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.DETAIL(roleId));
      req.flush({ message: 'Role not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('create', () => {
    it('should make POST request to create role', () => {
      // Given
      const createRequest: CreateRoleRequestDTO = {
        name: 'Manager',
        description: 'Project manager role',
        access_level: 3,
        can_lead_projects: true,
        is_unique_per_team: true,
        created_by_user_id: 1,
      };
      const expectedResponse: CreateRoleResponseDTO = {
        id: 3,
        name: 'Manager',
        description: 'Project manager role',
        access_level: 3,
        can_lead_projects: true,
        is_unique_per_team: true,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        user_count: 0,
      };

      // When
      client.create(createRequest).subscribe((response) => {
        expect(response).toEqual(expectedResponse);
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.CREATE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(expectedResponse);
    });

    it('should handle create HTTP errors', () => {
      // Given
      const createRequest: CreateRoleRequestDTO = {
        name: 'Admin', // Duplicate name
        description: 'Another admin role',
        access_level: 5,
        can_lead_projects: true,
        is_unique_per_team: false,
        created_by_user_id: 1,
      };

      // When
      client.create(createRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.CREATE);
      req.flush({ message: 'Role name already exists' }, { status: 409, statusText: 'Conflict' });
    });
  });

  describe('update', () => {
    it('should make PUT request to update role', () => {
      // Given
      const roleId = 1;
      const updateRequest: RequestUpdateRoleDTO = {
        name: 'Super Admin',
        description: 'Updated administrator role',
        access_level: 6,
      };
      const expectedResponse: ResponseUpdateRoleDTO = {
        id: 1,
        name: 'Super Admin',
        description: 'Updated administrator role',
        access_level: 6,
        can_lead_projects: true,
        is_unique_per_team: false,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        user_count: 3,
      };

      // When
      client.update(roleId, updateRequest).subscribe((response) => {
        expect(response).toEqual(expectedResponse);
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.UPDATE(roleId));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      req.flush(expectedResponse);
    });

    it('should handle update HTTP errors', () => {
      // Given
      const roleId = 999;
      const updateRequest: RequestUpdateRoleDTO = {
        name: 'Non-existent Role',
      };

      // When
      client.update(roleId, updateRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.UPDATE(roleId));
      req.flush({ message: 'Role not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('delete', () => {
    it('should make DELETE request to delete role', () => {
      // Given
      const roleId = 1;
      const expectedResponse: DeleteRoleResponseDTO = {
        message: 'Role deleted successfully',
      };

      // When
      client.delete(roleId).subscribe((response) => {
        expect(response).toEqual(expectedResponse);
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.DELETE(roleId));
      expect(req.request.method).toBe('DELETE');
      req.flush(expectedResponse);
    });

    it('should handle delete HTTP errors', () => {
      // Given
      const roleId = 999;

      // When
      client.delete(roleId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.DELETE(roleId));
      req.flush({ message: 'Role not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('assign', () => {
    it('should make POST request to assign role to user', () => {
      // Given
      const assignRequest: AssignRoleRequestDTO = {
        user_id: 1,
        role_id: 2,
        assigned_by_user_id: 3,
      };
      const expectedResponse: AssignRoleResponseDTO = {
        message: 'Role assigned successfully',
      };

      // When
      client.assign(assignRequest).subscribe((response) => {
        expect(response).toEqual(expectedResponse);
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.ASSIGN);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(assignRequest);
      req.flush(expectedResponse);
    });

    it('should handle assign HTTP errors', () => {
      // Given
      const assignRequest: AssignRoleRequestDTO = {
        user_id: 999, // Non-existent user
        role_id: 2,
        assigned_by_user_id: 3,
      };

      // When
      client.assign(assignRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.ASSIGN);
      req.flush({ message: 'User not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('unassign', () => {
    it('should make POST request to unassign role from user', () => {
      // Given
      const unassignRequest: UnassignRoleRequestDTO = {
        user_id: 1,
      };
      const expectedResponse: UnassignRoleResponseDTO = {
        message: 'Role unassigned successfully',
      };

      // When
      client.unassign(unassignRequest).subscribe((response) => {
        expect(response).toEqual(expectedResponse);
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.UNASSIGN);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(unassignRequest);
      req.flush(expectedResponse);
    });

    it('should handle unassign HTTP errors', () => {
      // Given
      const unassignRequest: UnassignRoleRequestDTO = {
        user_id: 999, // Non-existent user
      };

      // When
      client.unassign(unassignRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.UNASSIGN);
      req.flush({ message: 'User not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('Enhanced Error Handling', () => {
    it('should handle network connectivity errors', () => {
      client.list().subscribe({
        next: () => fail('Should have failed with network error'),
        error: (error) => {
          expect(error.status).toBe(0);
          expect(error.statusText).toBeDefined();
        },
      });

      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.LIST);
      req.flush('', { status: 0, statusText: '' });
    });

    it('should handle server timeout errors comprehensively', () => {
      const timeoutScenarios = [
        { status: 408, statusText: 'Request Timeout' },
        { status: 502, statusText: 'Bad Gateway' },
        { status: 503, statusText: 'Service Unavailable' },
        { status: 504, statusText: 'Gateway Timeout' },
      ];

      timeoutScenarios.forEach((scenario) => {
        client.getById(1).subscribe({
          next: () => fail(`Should have failed with ${scenario.statusText}`),
          error: (error) => {
            expect(error.status).toBe(scenario.status);
            expect(error.statusText).toBe(scenario.statusText);
          },
        });

        const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.DETAIL(1));
        req.flush('', { status: scenario.status, statusText: scenario.statusText });
      });
    });

    it('should handle resource exhaustion errors', () => {
      const resourceErrors = [
        {
          status: 413,
          statusText: 'Payload Too Large',
          body: { error: 'Request entity too large' },
        },
        { status: 429, statusText: 'Too Many Requests', body: { error: 'Rate limit exceeded' } },
        { status: 507, statusText: 'Insufficient Storage', body: { error: 'Server storage full' } },
      ];

      resourceErrors.forEach((errorCase) => {
        client
          .create({
            name: 'Test Role',
            description: 'Test description',
            access_level: 1,
            can_lead_projects: false,
            is_unique_per_team: false,
            created_by_user_id: 1,
          })
          .subscribe({
            next: () => fail(`Should have failed with ${errorCase.statusText}`),
            error: (error) => {
              expect(error.status).toBe(errorCase.status);
              expect(error.error).toEqual(errorCase.body);
            },
          });

        const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.CREATE);
        req.flush(errorCase.body, { status: errorCase.status, statusText: errorCase.statusText });
      });
    });

    it('should handle malformed server responses', () => {
      const malformedScenarios = [
        { response: 'not json at all', contentType: 'application/json' },
        { response: '{"incomplete": json', contentType: 'application/json' },
        { response: 'null', contentType: 'application/json' },
        { response: '[]', contentType: 'application/json' },
      ];

      malformedScenarios.forEach((scenario) => {
        client.list().subscribe({
          next: (response) => {
            expect(response).toBe(scenario.response as any);
          },
          error: () => fail('Should not have errored in test environment'),
        });

        const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.LIST);
        req.flush(scenario.response, { headers: { 'Content-Type': scenario.contentType } });
      });
    });
  });

  describe('Observable Lifecycle Management', () => {
    it('should properly handle subscription lifecycle', () => {
      let responseReceived = false;
      let errorReceived = false;
      let completeCalled = false;

      const subscription = client.list().subscribe({
        next: () => {
          responseReceived = true;
        },
        error: () => {
          errorReceived = true;
        },
        complete: () => {
          completeCalled = true;
        },
      });

      expect(subscription.closed).toBe(false);

      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.LIST);
      req.flush([]);

      expect(responseReceived).toBe(true);
      expect(errorReceived).toBe(false);
      expect(completeCalled).toBe(true);
      expect(subscription.closed).toBe(true);
    });

    it('should handle subscription unsubscription before response', () => {
      let responseReceived = false;

      const subscription = client.getById(1).subscribe({
        next: () => {
          responseReceived = true;
        },
      });

      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.DETAIL(1));

      expect(subscription.closed).toBe(false);

      subscription.unsubscribe();
      expect(subscription.closed).toBe(true);

      expect(responseReceived).toBe(false);
    });

    it('should handle Observable stream error scenarios', () => {
      let errorReceived = false;
      let completeCalled = false;

      client.update(1, { name: 'Updated Role' }).subscribe({
        next: () => fail('Should not succeed'),
        error: () => {
          errorReceived = true;
        },
        complete: () => {
          completeCalled = true;
        },
      });

      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.UPDATE(1));
      req.flush('', { status: 500, statusText: 'Internal Server Error' });

      expect(errorReceived).toBe(true);
      expect(completeCalled).toBe(false);
    });
  });

  describe('Integration and Edge Cases', () => {
    it('should handle large payloads', () => {
      const largeCreateRequest = {
        name: 'A'.repeat(255),
        description: 'B'.repeat(1000),
        access_level: 5,
        can_lead_projects: true,
        is_unique_per_team: false,
        created_by_user_id: 1,
      };

      client.create(largeCreateRequest).subscribe();

      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.CREATE);
      expect(req.request.body).toEqual(largeCreateRequest);
      expect(req.request.body.name.length).toBe(255);
      expect(req.request.body.description.length).toBe(1000);
      req.flush({});
    });

    it('should handle special characters in request data', () => {
      const specialCharRequest = {
        name: 'Róle with émojis 🎭 and spëcial chars',
        description: 'Tëst with ünicöde: ñáéíóú and symbols: @#$%^&*()',
        access_level: 2,
        can_lead_projects: false,
        is_unique_per_team: true,
        created_by_user_id: 1,
      };

      client.create(specialCharRequest).subscribe();

      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.CREATE);
      expect(req.request.body).toEqual(specialCharRequest);
      expect(req.request.body.name).toContain('🎭');
      expect(req.request.body.description).toContain('ünicöde');
      req.flush({});
    });

    it('should handle concurrent role operations', () => {
      const responses: any[] = [];
      const errors: any[] = [];

      // Execute multiple operations concurrently
      client.list().subscribe({
        next: (response: any) => responses.push({ operation: 'list', response }),
        error: (error: any) => errors.push({ operation: 'list', error }),
      });

      client.getById(1).subscribe({
        next: (response: any) => responses.push({ operation: 'getById', response }),
        error: (error: any) => errors.push({ operation: 'getById', error }),
      });

      client
        .create({
          name: 'New Role',
          description: 'Test role',
          access_level: 1,
          can_lead_projects: false,
          is_unique_per_team: false,
          created_by_user_id: 1,
        })
        .subscribe({
          next: (response: any) => responses.push({ operation: 'create', response }),
          error: (error: any) => errors.push({ operation: 'create', error }),
        });

      // All requests should be made
      const allRequests = httpMock.match(() => true);
      expect(allRequests.length).toBe(3);

      // Flush all responses
      allRequests.forEach((req) => req.flush({}));

      // Verify all responses received
      expect(responses.length).toBe(3);
      expect(errors.length).toBe(0);
    });

    it('should maintain type safety for all method responses', () => {
      client.list({ search: 'admin' }).subscribe((response: RolesResponseDTO) => {
        expect(Array.isArray(response)).toBe(true);
      });

      client.getById(1).subscribe((response: RoleDetailResponseDTO) => {
        expect(response.id).toBeDefined();
        expect(response.name).toBeDefined();
        expect(response.access_level).toBeDefined();
      });

      const listReq = httpMock.expectOne((req) => req.url === API_ENDPOINTS_V1.ROLES.LIST);
      listReq.flush([
        {
          id: 1,
          name: 'Admin',
          description: 'Administrator role',
          access_level: 5,
          is_active: true,
          user_count: 3,
        },
      ]);

      const getByIdReq = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.DETAIL(1));
      getByIdReq.flush({
        id: 1,
        name: 'Admin',
        description: 'Administrator role',
        access_level: 5,
        can_lead_projects: true,
        is_unique_per_team: false,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        user_count: 3,
      });
    });

    it('should handle empty responses gracefully', () => {
      client.delete(1).subscribe((response) => {
        expect(response).toEqual({} as DeleteRoleResponseDTO);
      });

      const req = httpMock.expectOne(API_ENDPOINTS_V1.ROLES.DELETE(1));
      req.flush({});
    });
  });

  describe('Complete Method Coverage', () => {
    it('should have all public methods defined', () => {
      expect(typeof client.list).toBe('function');
      expect(typeof client.getById).toBe('function');
      expect(typeof client.create).toBe('function');
      expect(typeof client.update).toBe('function');
      expect(typeof client.delete).toBe('function');
      expect(typeof client.assign).toBe('function');
      expect(typeof client.unassign).toBe('function');
    });

    it('should exercise every method at least once', () => {
      const createRequest = {
        name: 'Test Role',
        description: 'Test description',
        access_level: 1,
        can_lead_projects: false,
        is_unique_per_team: false,
        created_by_user_id: 1,
      };
      const updateRequest = { name: 'Updated Role' };
      const assignRequest = { user_id: 1, role_id: 2, assigned_by_user_id: 3 };
      const unassignRequest = { user_id: 1 };

      // Execute all methods
      client.list().subscribe();
      client.getById(1).subscribe();
      client.create(createRequest).subscribe();
      client.update(1, updateRequest).subscribe();
      client.delete(1).subscribe();
      client.assign(assignRequest).subscribe();
      client.unassign(unassignRequest).subscribe();

      // Verify all requests were made
      const requests = httpMock.match(() => true);
      expect(requests.length).toBe(7);

      // Flush all requests
      requests.forEach((req) => req.flush({}));
    });
  });
});
