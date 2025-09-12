/**
 * @fileoverview User DTO Tests - Infrastructure Layer
 *
 * @description Comprehensive tests for User Data Transfer Objects following
 * the MAD-AI testing strategy. These tests validate DTO structure, serialization,
 * and API contract compliance.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-09-12
 */

import { UserDTO, UserListResponseDTO, UserListFilterDTO } from './user.dto';

describe('User DTOs - Infrastructure Tests', () => {
  describe('UserDTO', () => {
    const mockUserDTO: UserDTO = {
      id: 123,
      username: 'john_doe',
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe',
      is_active: true,
      is_verified: true,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T11:45:00Z',
      last_login: '2024-01-15T08:45:00Z',
      roles: [
        {
          id: 2,
          name: 'Editor',
          description: 'Can edit content',
          access_level: 2,
          is_active: true,
          user_count: 10,
        },
      ],
    };

    describe('structure validation', () => {
      it('should have all required properties', () => {
        // Then
        expect(mockUserDTO.id).toBeDefined();
        expect(mockUserDTO.username).toBeDefined();
        expect(mockUserDTO.email).toBeDefined();
        expect(mockUserDTO.first_name).toBeDefined();
        expect(mockUserDTO.last_name).toBeDefined();
        expect(mockUserDTO.is_active).toBeDefined();
        expect(mockUserDTO.is_verified).toBeDefined();
        expect(mockUserDTO.created_at).toBeDefined();
        expect(mockUserDTO.updated_at).toBeDefined();
        expect(mockUserDTO.roles).toBeDefined();
      });

      it('should have correct property types', () => {
        // Then
        expect(typeof mockUserDTO.id).toBe('number');
        expect(typeof mockUserDTO.username).toBe('string');
        expect(typeof mockUserDTO.email).toBe('string');
        expect(typeof mockUserDTO.first_name).toBe('string');
        expect(typeof mockUserDTO.last_name).toBe('string');
        expect(typeof mockUserDTO.is_active).toBe('boolean');
        expect(typeof mockUserDTO.is_verified).toBe('boolean');
        expect(typeof mockUserDTO.created_at).toBe('string');
        expect(typeof mockUserDTO.updated_at).toBe('string');
        expect(Array.isArray(mockUserDTO.roles)).toBe(true);
      });

      it('should handle null last_login correctly', () => {
        // Given
        const userWithNullLogin: UserDTO = {
          ...mockUserDTO,
          last_login: null,
        };

        // Then
        expect(userWithNullLogin.last_login).toBeNull();
        expect(
          typeof userWithNullLogin.last_login === 'object' ||
            typeof userWithNullLogin.last_login === 'string'
        ).toBe(true);
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
          const user: UserDTO = {
            ...mockUserDTO,
            email: email,
          };

          // Then
          expect(user.email).toBe(email);
          expect(typeof user.email).toBe('string');
        });
      });

      it('should accept valid ISO date formats', () => {
        // Given
        const validDates = [
          '2024-01-15T10:30:00Z',
          '2024-12-31T23:59:59.999Z',
          '2023-06-15T14:30:45.123Z',
        ];

        validDates.forEach((date) => {
          const user: UserDTO = {
            ...mockUserDTO,
            created_at: date,
            updated_at: date,
            last_login: date,
          };

          // Then
          expect(user.created_at).toBe(date);
          expect(user.updated_at).toBe(date);
          expect(user.last_login).toBe(date);
        });
      });
    });

    describe('serialization', () => {
      it('should serialize to JSON correctly', () => {
        // When
        const json = JSON.stringify(mockUserDTO);
        const parsed = JSON.parse(json);

        // Then
        expect(parsed.id).toBe(mockUserDTO.id);
        expect(parsed.username).toBe(mockUserDTO.username);
        expect(parsed.email).toBe(mockUserDTO.email);
        expect(parsed.first_name).toBe(mockUserDTO.first_name);
        expect(parsed.last_name).toBe(mockUserDTO.last_name);
        expect(parsed.is_active).toBe(mockUserDTO.is_active);
        expect(parsed.is_verified).toBe(mockUserDTO.is_verified);
        expect(parsed.created_at).toBe(mockUserDTO.created_at);
        expect(parsed.updated_at).toBe(mockUserDTO.updated_at);
        expect(parsed.last_login).toBe(mockUserDTO.last_login);
        expect(parsed.roles).toEqual(mockUserDTO.roles);
        expect(parsed).toEqual(mockUserDTO);
      });

      it('should deserialize from JSON correctly', () => {
        // Given
        const jsonString = JSON.stringify(mockUserDTO);

        // When
        const parsed: UserDTO = JSON.parse(jsonString);

        // Then
        expect(parsed).toEqual(mockUserDTO);
        expect(parsed.id).toBe(123);
        expect(parsed.username).toBe('john_doe');
        expect(parsed.email).toBe('john.doe@example.com');
        expect(parsed.roles.length).toBe(1);
      });

      it('should preserve data types after serialization round-trip', () => {
        // When
        const json = JSON.stringify(mockUserDTO);
        const parsed: UserDTO = JSON.parse(json);

        // Then
        expect(typeof parsed.id).toBe('number');
        expect(typeof parsed.username).toBe('string');
        expect(typeof parsed.email).toBe('string');
        expect(typeof parsed.is_active).toBe('boolean');
        expect(typeof parsed.is_verified).toBe('boolean');
        expect(Array.isArray(parsed.roles)).toBe(true);
        expect(parsed).toEqual(mockUserDTO);
      });

      it('should handle null values in serialization', () => {
        // Given
        const userWithNulls: UserDTO = {
          ...mockUserDTO,
          last_login: null,
        };

        // When
        const json = JSON.stringify(userWithNulls);
        const parsed: UserDTO = JSON.parse(json);

        // Then
        expect(parsed.last_login).toBeNull();
        expect(parsed).toEqual(userWithNulls);
      });
    });

    describe('edge cases', () => {
      it('should handle zero and negative user IDs', () => {
        // Given
        const edgeIds = [0, -1, -999];

        edgeIds.forEach((id) => {
          const user: UserDTO = {
            ...mockUserDTO,
            id: id,
          };

          // Then
          expect(user.id).toBe(id);
          expect(typeof user.id).toBe('number');
        });
      });

      it('should handle very large user IDs', () => {
        // Given
        const user: UserDTO = {
          ...mockUserDTO,
          id: Number.MAX_SAFE_INTEGER,
        };

        // Then
        expect(user.id).toBe(Number.MAX_SAFE_INTEGER);
        expect(typeof user.id).toBe('number');
      });

      it('should handle empty string values', () => {
        // Given
        const userWithEmptyStrings: UserDTO = {
          ...mockUserDTO,
          username: '',
          first_name: '',
          last_name: '',
        };

        // Then
        expect(userWithEmptyStrings.username).toBe('');
        expect(userWithEmptyStrings.first_name).toBe('');
        expect(userWithEmptyStrings.last_name).toBe('');
      });

      it('should handle empty roles array', () => {
        // Given
        const userWithNoRoles: UserDTO = {
          ...mockUserDTO,
          roles: [],
        };

        // Then
        expect(userWithNoRoles.roles).toEqual([]);
        expect(Array.isArray(userWithNoRoles.roles)).toBe(true);
        expect(userWithNoRoles.roles.length).toBe(0);
      });

      it('should handle multiple roles', () => {
        // Given
        const userWithMultipleRoles: UserDTO = {
          ...mockUserDTO,
          roles: [
            {
              id: 1,
              name: 'Admin',
              description: 'Administrator',
              access_level: 1,
              is_active: true,
              user_count: 5,
            },
            {
              id: 2,
              name: 'Editor',
              description: 'Content Editor',
              access_level: 2,
              is_active: true,
              user_count: 10,
            },
            {
              id: 3,
              name: 'Viewer',
              description: 'Read Only',
              access_level: 3,
              is_active: true,
              user_count: 20,
            },
          ],
        };

        // Then
        expect(userWithMultipleRoles.roles.length).toBe(3);
        expect(userWithMultipleRoles.roles[0].name).toBe('Admin');
        expect(userWithMultipleRoles.roles[1].name).toBe('Editor');
        expect(userWithMultipleRoles.roles[2].name).toBe('Viewer');
      });

      it('should handle special characters in string fields', () => {
        // Given
        const userWithSpecialChars: UserDTO = {
          ...mockUserDTO,
          username: 'user_123-special!',
          first_name: 'José María',
          last_name: 'González-López',
          email: 'josé.maría@domain.com',
        };

        // Then
        expect(userWithSpecialChars.username).toContain('!');
        expect(userWithSpecialChars.first_name).toContain('é');
        expect(userWithSpecialChars.last_name).toContain('-');
        expect(userWithSpecialChars.email).toContain('@');
      });

      it('should handle boolean edge cases', () => {
        // Given
        const activeUser: UserDTO = { ...mockUserDTO, is_active: true, is_verified: true };
        const inactiveUser: UserDTO = { ...mockUserDTO, is_active: false, is_verified: false };

        // Then
        expect(activeUser.is_active).toBe(true);
        expect(activeUser.is_verified).toBe(true);
        expect(inactiveUser.is_active).toBe(false);
        expect(inactiveUser.is_verified).toBe(false);
      });
    });

    describe('data consistency', () => {
      it('should maintain property integrity after serialization', () => {
        // Given
        const originalUser: UserDTO = { ...mockUserDTO };

        // When
        const json = JSON.stringify(originalUser);
        const parsed: UserDTO = JSON.parse(json);

        // Then
        expect(parsed.id).toBe(originalUser.id);
        expect(parsed.username).toBe(originalUser.username);
        expect(parsed.email).toBe(originalUser.email);
        expect(parsed.roles).toEqual(originalUser.roles);
        expect(parsed).toEqual(originalUser);
      });

      it('should handle readonly property constraints', () => {
        // Given
        const user: UserDTO = { ...mockUserDTO };

        // Then - readonly properties should exist and be accessible
        expect(user.id).toBeDefined();
        expect(user.username).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.created_at).toBeDefined();
        expect(user.updated_at).toBeDefined();
      });
    });
  });

  describe('UserListFilterDTO', () => {
    describe('structure validation', () => {
      it('should handle empty filter object', () => {
        // Given
        const emptyFilter: UserListFilterDTO = {};

        // Then
        expect(Object.keys(emptyFilter).length).toBe(0);
      });

      it('should have correct optional property types', () => {
        // Given
        const filter: UserListFilterDTO = {
          is_active: true,
          role_id: 5,
          search: 'john',
          limit: 10,
          offset: 0,
          ordering: 'username',
        };

        // Then
        expect(typeof filter.is_active).toBe('boolean');
        expect(typeof filter.role_id).toBe('number');
        expect(typeof filter.search).toBe('string');
        expect(typeof filter.limit).toBe('number');
        expect(typeof filter.offset).toBe('number');
        expect(typeof filter.ordering).toBe('string');
      });

      it('should accept partial filter configurations', () => {
        // Given
        const partialFilters = [
          { is_active: true },
          { role_id: 2 },
          { search: 'admin' },
          { limit: 25 },
          { ordering: '-created_at' },
          { is_active: true, limit: 5 },
          { search: 'user', ordering: 'last_name' },
        ];

        partialFilters.forEach((filter) => {
          // When creating partial filter
          const userFilter: UserListFilterDTO = filter;

          // Then
          Object.keys(filter).forEach((key) => {
            expect(userFilter[key as keyof UserListFilterDTO]).toBeDefined();
          });
        });
      });
    });

    describe('serialization', () => {
      it('should serialize filter to JSON correctly', () => {
        // Given
        const filter: UserListFilterDTO = {
          is_active: true,
          role_id: 3,
          search: 'test user',
          limit: 20,
          offset: 40,
          ordering: '-created_at',
        };

        // When
        const json = JSON.stringify(filter);
        const parsed = JSON.parse(json);

        // Then
        expect(parsed.is_active).toBe(filter.is_active);
        expect(parsed.role_id).toBe(filter.role_id);
        expect(parsed.search).toBe(filter.search);
        expect(parsed.limit).toBe(filter.limit);
        expect(parsed.offset).toBe(filter.offset);
        expect(parsed.ordering).toBe(filter.ordering);
        expect(parsed).toEqual(filter);
      });

      it('should handle serialization of partial filters', () => {
        // Given
        const partialFilter: UserListFilterDTO = {
          is_active: false,
          search: 'admin',
        };

        // When
        const json = JSON.stringify(partialFilter);
        const parsed: UserListFilterDTO = JSON.parse(json);

        // Then
        expect(parsed.is_active).toBe(false);
        expect(parsed.search).toBe('admin');
        expect(parsed.role_id).toBeUndefined();
        expect(parsed.limit).toBeUndefined();
        expect(parsed.offset).toBeUndefined();
        expect(parsed.ordering).toBeUndefined();
      });
    });

    describe('edge cases', () => {
      it('should handle zero and negative pagination values', () => {
        // Given
        const filter: UserListFilterDTO = {
          limit: 0,
          offset: -5,
        };

        // Then
        expect(filter.limit).toBe(0);
        expect(filter.offset).toBe(-5);
      });

      it('should handle very large pagination values', () => {
        // Given
        const filter: UserListFilterDTO = {
          limit: 999999,
          offset: Number.MAX_SAFE_INTEGER,
        };

        // Then
        expect(filter.limit).toBe(999999);
        expect(filter.offset).toBe(Number.MAX_SAFE_INTEGER);
      });

      it('should handle empty and special characters in search', () => {
        // Given
        const searchValues = ['', 'user@domain.com', 'josé maría', 'user-123_test'];

        searchValues.forEach((searchValue) => {
          const filter: UserListFilterDTO = {
            search: searchValue,
          };

          // Then
          expect(filter.search).toBe(searchValue);
          expect(typeof filter.search).toBe('string');
        });
      });

      it('should handle various ordering formats', () => {
        // Given
        const orderingValues = [
          'username',
          '-username',
          'created_at',
          '-created_at',
          'last_name',
          '-last_name',
        ];

        orderingValues.forEach((ordering) => {
          const filter: UserListFilterDTO = {
            ordering: ordering,
          };

          // Then
          expect(filter.ordering).toBe(ordering);
          expect(typeof filter.ordering).toBe('string');
        });
      });
    });
  });

  describe('UserListResponseDTO', () => {
    const mockUserListResponse: UserListResponseDTO = {
      count: 150,
      next: 'http://localhost:8004/api/v1/users/?limit=20&offset=20',
      previous: null,
      results: [
        {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          first_name: 'Admin',
          last_name: 'User',
          is_active: true,
          is_verified: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          last_login: '2024-01-15T10:00:00Z',
          roles: [],
        },
      ],
    };

    describe('structure validation', () => {
      it('should have all required properties', () => {
        // Then
        expect(mockUserListResponse.count).toBeDefined();
        expect(mockUserListResponse.results).toBeDefined();
        expect(typeof mockUserListResponse.count).toBe('number');
        expect(Array.isArray(mockUserListResponse.results)).toBe(true);
      });

      it('should handle pagination URLs correctly', () => {
        // Given
        const responseWithPagination: UserListResponseDTO = {
          count: 100,
          next: 'http://localhost:8004/api/v1/users/?limit=10&offset=10',
          previous: 'http://localhost:8004/api/v1/users/?limit=10&offset=0',
          results: [],
        };

        // Then
        expect(typeof responseWithPagination.next).toBe('string');
        expect(typeof responseWithPagination.previous).toBe('string');
        expect(responseWithPagination.next).toContain('offset=10');
        expect(responseWithPagination.previous).toContain('offset=0');
      });

      it('should handle null pagination URLs', () => {
        // Given
        const firstPageResponse: UserListResponseDTO = {
          count: 5,
          next: null,
          previous: null,
          results: [],
        };

        // Then
        expect(firstPageResponse.next).toBeNull();
        expect(firstPageResponse.previous).toBeNull();
      });
    });

    describe('serialization', () => {
      it('should serialize list response to JSON correctly', () => {
        // When
        const json = JSON.stringify(mockUserListResponse);
        const parsed = JSON.parse(json);

        // Then
        expect(parsed.count).toBe(mockUserListResponse.count);
        expect(parsed.next).toBe(mockUserListResponse.next);
        expect(parsed.previous).toBe(mockUserListResponse.previous);
        expect(parsed.results).toEqual(mockUserListResponse.results);
        expect(parsed).toEqual(mockUserListResponse);
      });

      it('should deserialize list response from JSON correctly', () => {
        // Given
        const jsonString = JSON.stringify(mockUserListResponse);

        // When
        const parsed: UserListResponseDTO = JSON.parse(jsonString);

        // Then
        expect(parsed).toEqual(mockUserListResponse);
        expect(parsed.count).toBe(150);
        expect(parsed.results.length).toBe(1);
      });
    });

    describe('edge cases', () => {
      it('should handle empty results array', () => {
        // Given
        const emptyResponse: UserListResponseDTO = {
          count: 0,
          next: null,
          previous: null,
          results: [],
        };

        // Then
        expect(emptyResponse.results).toEqual([]);
        expect(emptyResponse.results.length).toBe(0);
        expect(emptyResponse.count).toBe(0);
      });

      it('should handle large result sets', () => {
        // Given
        const largeResults = Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          username: `user${i}`,
          email: `user${i}@example.com`,
          first_name: `First${i}`,
          last_name: `Last${i}`,
          is_active: true,
          is_verified: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          last_login: null,
          roles: [],
        }));

        const largeResponse: UserListResponseDTO = {
          count: 1000,
          next: 'http://localhost:8004/api/v1/users/?limit=100&offset=100',
          previous: null,
          results: largeResults,
        };

        // Then
        expect(largeResponse.results.length).toBe(100);
        expect(largeResponse.count).toBe(1000);
        expect(largeResponse.results[0].username).toBe('user0');
        expect(largeResponse.results[99].username).toBe('user99');
      });
    });

    describe('data consistency', () => {
      it('should maintain pagination consistency', () => {
        // Given
        const response: UserListResponseDTO = {
          count: 25,
          next: null,
          previous: null,
          results: Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            username: `user${i}`,
            email: `user${i}@test.com`,
            first_name: 'Test',
            last_name: 'User',
            is_active: true,
            is_verified: false,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            last_login: null,
            roles: [],
          })),
        };

        // Then
        expect(response.results.length).toBe(response.count);
        expect(response.next).toBeNull();
        expect(response.previous).toBeNull();
      });
    });
  });
});
