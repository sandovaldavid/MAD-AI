/**
 * @fileoverview Users List DTO Tests - Infrastructure Layer
 *
 * @description Tests for the simplified Users list DTOs used for listing endpoints.
 * These DTOs represent a lighter version of user data for list views.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-09-12
 */

import { ListUsersResponseDTO, UserDTO } from './users.dto';

describe('Users List DTOs - Infrastructure Tests', () => {
  describe('UserDTO (List Version)', () => {
    const mockListUserDTO: UserDTO = {
      id: 1,
      username: 'john_doe',
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe',
      is_active: true,
      role_name: 'Administrator',
      created_at: '2024-01-15T10:30:00Z',
    };

    describe('structure validation', () => {
      it('should have all required properties', () => {
        // Then
        expect(mockListUserDTO.id).toBeDefined();
        expect(mockListUserDTO.username).toBeDefined();
        expect(mockListUserDTO.email).toBeDefined();
        expect(mockListUserDTO.first_name).toBeDefined();
        expect(mockListUserDTO.last_name).toBeDefined();
        expect(mockListUserDTO.is_active).toBeDefined();
        expect(mockListUserDTO.role_name).toBeDefined();
        expect(mockListUserDTO.created_at).toBeDefined();
      });

      it('should have correct property types', () => {
        // Then
        expect(typeof mockListUserDTO.id).toBe('number');
        expect(typeof mockListUserDTO.username).toBe('string');
        expect(typeof mockListUserDTO.email).toBe('string');
        expect(typeof mockListUserDTO.first_name).toBe('string');
        expect(typeof mockListUserDTO.last_name).toBe('string');
        expect(typeof mockListUserDTO.is_active).toBe('boolean');
        expect(typeof mockListUserDTO.role_name).toBe('string');
        expect(typeof mockListUserDTO.created_at).toBe('string');
      });

      it('should accept various role names', () => {
        // Given
        const roleNames = [
          'Administrator',
          'Editor',
          'Viewer',
          'Guest',
          'Super Admin',
          'Content Manager',
        ];

        roleNames.forEach((roleName) => {
          const user: UserDTO = {
            ...mockListUserDTO,
            role_name: roleName,
          };

          // Then
          expect(user.role_name).toBe(roleName);
          expect(typeof user.role_name).toBe('string');
        });
      });

      it('should accept valid email formats in list view', () => {
        // Given
        const validEmails = [
          'simple@domain.com',
          'test.user+tag@example.org',
          'user123@subdomain.domain.co.uk',
          'firstname.lastname@company-name.com',
        ];

        validEmails.forEach((email) => {
          const user: UserDTO = {
            ...mockListUserDTO,
            email: email,
          };

          // Then
          expect(user.email).toBe(email);
          expect(typeof user.email).toBe('string');
        });
      });
    });

    describe('serialization', () => {
      it('should serialize to JSON correctly', () => {
        // When
        const json = JSON.stringify(mockListUserDTO);
        const parsed = JSON.parse(json);

        // Then
        expect(parsed.id).toBe(mockListUserDTO.id);
        expect(parsed.username).toBe(mockListUserDTO.username);
        expect(parsed.email).toBe(mockListUserDTO.email);
        expect(parsed.first_name).toBe(mockListUserDTO.first_name);
        expect(parsed.last_name).toBe(mockListUserDTO.last_name);
        expect(parsed.is_active).toBe(mockListUserDTO.is_active);
        expect(parsed.role_name).toBe(mockListUserDTO.role_name);
        expect(parsed.created_at).toBe(mockListUserDTO.created_at);
        expect(parsed).toEqual(mockListUserDTO);
      });

      it('should deserialize from JSON correctly', () => {
        // Given
        const jsonString = JSON.stringify(mockListUserDTO);

        // When
        const parsed: UserDTO = JSON.parse(jsonString);

        // Then
        expect(parsed).toEqual(mockListUserDTO);
        expect(parsed.id).toBe(1);
        expect(parsed.username).toBe('john_doe');
        expect(parsed.role_name).toBe('Administrator');
      });

      it('should preserve data types after serialization round-trip', () => {
        // When
        const json = JSON.stringify(mockListUserDTO);
        const parsed: UserDTO = JSON.parse(json);

        // Then
        expect(typeof parsed.id).toBe('number');
        expect(typeof parsed.username).toBe('string');
        expect(typeof parsed.email).toBe('string');
        expect(typeof parsed.is_active).toBe('boolean');
        expect(typeof parsed.role_name).toBe('string');
        expect(typeof parsed.created_at).toBe('string');
        expect(parsed).toEqual(mockListUserDTO);
      });
    });

    describe('edge cases', () => {
      it('should handle zero and negative user IDs', () => {
        // Given
        const edgeIds = [0, -1, -999, -123456];

        edgeIds.forEach((id) => {
          const user: UserDTO = {
            ...mockListUserDTO,
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
          ...mockListUserDTO,
          id: Number.MAX_SAFE_INTEGER,
        };

        // Then
        expect(user.id).toBe(Number.MAX_SAFE_INTEGER);
        expect(typeof user.id).toBe('number');
      });

      it('should handle empty string values', () => {
        // Given
        const userWithEmptyStrings: UserDTO = {
          ...mockListUserDTO,
          username: '',
          first_name: '',
          last_name: '',
          role_name: '',
        };

        // Then
        expect(userWithEmptyStrings.username).toBe('');
        expect(userWithEmptyStrings.first_name).toBe('');
        expect(userWithEmptyStrings.last_name).toBe('');
        expect(userWithEmptyStrings.role_name).toBe('');
      });

      it('should handle special characters in string fields', () => {
        // Given
        const userWithSpecialChars: UserDTO = {
          ...mockListUserDTO,
          username: 'user_123-special!',
          first_name: 'José María',
          last_name: 'González-López',
          email: 'josé.maría@domain.com',
          role_name: 'Content Manager & Editor',
        };

        // Then
        expect(userWithSpecialChars.username).toContain('!');
        expect(userWithSpecialChars.first_name).toContain('é');
        expect(userWithSpecialChars.last_name).toContain('-');
        expect(userWithSpecialChars.email).toContain('@');
        expect(userWithSpecialChars.role_name).toContain('&');
      });

      it('should handle boolean states correctly', () => {
        // Given
        const activeUser: UserDTO = { ...mockListUserDTO, is_active: true };
        const inactiveUser: UserDTO = { ...mockListUserDTO, is_active: false };

        // Then
        expect(activeUser.is_active).toBe(true);
        expect(inactiveUser.is_active).toBe(false);
        expect(typeof activeUser.is_active).toBe('boolean');
        expect(typeof inactiveUser.is_active).toBe('boolean');
      });

      it('should handle various date formats', () => {
        // Given
        const dateFormats = [
          '2024-01-15T10:30:00Z',
          '2023-12-31T23:59:59.999Z',
          '2024-06-15T14:30:45.123Z',
          '2024-02-29T12:00:00.000Z', // Leap year
        ];

        dateFormats.forEach((date) => {
          const user: UserDTO = {
            ...mockListUserDTO,
            created_at: date,
          };

          // Then
          expect(user.created_at).toBe(date);
          expect(typeof user.created_at).toBe('string');
        });
      });
    });

    describe('data consistency', () => {
      it('should maintain property integrity after serialization', () => {
        // Given
        const originalUser: UserDTO = { ...mockListUserDTO };

        // When
        const json = JSON.stringify(originalUser);
        const parsed: UserDTO = JSON.parse(json);

        // Then
        expect(parsed.id).toBe(originalUser.id);
        expect(parsed.username).toBe(originalUser.username);
        expect(parsed.email).toBe(originalUser.email);
        expect(parsed.role_name).toBe(originalUser.role_name);
        expect(parsed.created_at).toBe(originalUser.created_at);
        expect(parsed).toEqual(originalUser);
      });

      it('should handle cross-field validation scenarios', () => {
        // Given - Example: inactive user with recent creation date
        const inactiveRecentUser: UserDTO = {
          ...mockListUserDTO,
          is_active: false,
          created_at: new Date().toISOString(),
        };

        // Then
        expect(inactiveRecentUser.is_active).toBe(false);
        expect(inactiveRecentUser.created_at).toBeDefined();
        expect(typeof inactiveRecentUser.created_at).toBe('string');
      });
    });
  });

  describe('ListUsersResponseDTO', () => {
    const mockUsersArray: UserDTO[] = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        first_name: 'Admin',
        last_name: 'User',
        is_active: true,
        role_name: 'Administrator',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        username: 'editor',
        email: 'editor@example.com',
        first_name: 'Editor',
        last_name: 'User',
        is_active: true,
        role_name: 'Editor',
        created_at: '2024-01-02T00:00:00Z',
      },
    ];

    describe('structure validation', () => {
      it('should be an array type', () => {
        // Given
        const listResponse: ListUsersResponseDTO = mockUsersArray;

        // Then
        expect(Array.isArray(listResponse)).toBe(true);
        expect(listResponse.length).toBe(2);
      });

      it('should contain valid UserDTO objects', () => {
        // Given
        const listResponse: ListUsersResponseDTO = mockUsersArray;

        // Then
        listResponse.forEach((user) => {
          expect(typeof user.id).toBe('number');
          expect(typeof user.username).toBe('string');
          expect(typeof user.email).toBe('string');
          expect(typeof user.first_name).toBe('string');
          expect(typeof user.last_name).toBe('string');
          expect(typeof user.is_active).toBe('boolean');
          expect(typeof user.role_name).toBe('string');
          expect(typeof user.created_at).toBe('string');
        });
      });
    });

    describe('serialization', () => {
      it('should serialize array to JSON correctly', () => {
        // Given
        const listResponse: ListUsersResponseDTO = mockUsersArray;

        // When
        const json = JSON.stringify(listResponse);
        const parsed = JSON.parse(json);

        // Then
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed.length).toBe(2);
        expect(parsed[0].id).toBe(mockUsersArray[0].id);
        expect(parsed[0].username).toBe(mockUsersArray[0].username);
        expect(parsed[1].role_name).toBe(mockUsersArray[1].role_name);
        expect(parsed).toEqual(mockUsersArray);
      });

      it('should deserialize array from JSON correctly', () => {
        // Given
        const jsonString = JSON.stringify(mockUsersArray);

        // When
        const parsed: ListUsersResponseDTO = JSON.parse(jsonString);

        // Then
        expect(parsed).toEqual(mockUsersArray);
        expect(parsed.length).toBe(2);
        expect(parsed[0].username).toBe('admin');
        expect(parsed[1].username).toBe('editor');
      });

      it('should preserve data types after serialization round-trip', () => {
        // Given
        const listResponse: ListUsersResponseDTO = mockUsersArray;

        // When
        const json = JSON.stringify(listResponse);
        const parsed: ListUsersResponseDTO = JSON.parse(json);

        // Then
        parsed.forEach((user, index) => {
          expect(typeof user.id).toBe('number');
          expect(typeof user.is_active).toBe('boolean');
          expect(typeof user.role_name).toBe('string');
          expect(user).toEqual(mockUsersArray[index]);
        });
      });
    });

    describe('edge cases', () => {
      it('should handle empty array', () => {
        // Given
        const emptyList: ListUsersResponseDTO = [];

        // Then
        expect(Array.isArray(emptyList)).toBe(true);
        expect(emptyList.length).toBe(0);
      });

      it('should handle single user array', () => {
        // Given
        const singleUserList: ListUsersResponseDTO = [mockUsersArray[0]];

        // Then
        expect(singleUserList.length).toBe(1);
        expect(singleUserList[0].id).toBe(1);
        expect(singleUserList[0].username).toBe('admin');
      });

      it('should handle large array of users', () => {
        // Given
        const largeUserList: ListUsersResponseDTO = Array.from({ length: 1000 }, (_, i) => ({
          id: i + 1,
          username: `user${i}`,
          email: `user${i}@test.com`,
          first_name: `First${i}`,
          last_name: `Last${i}`,
          is_active: i % 2 === 0, // Alternate active/inactive
          role_name: i % 3 === 0 ? 'Admin' : i % 3 === 1 ? 'Editor' : 'Viewer',
          created_at: '2024-01-01T00:00:00Z',
        }));

        // Then
        expect(largeUserList.length).toBe(1000);
        expect(largeUserList[0].username).toBe('user0');
        expect(largeUserList[999].username).toBe('user999');
        expect(largeUserList.filter((u) => u.is_active).length).toBe(500);
        expect(largeUserList.filter((u) => u.role_name === 'Admin').length).toBe(334); // Every 3rd user
      });

      it('should handle mixed user states', () => {
        // Given
        const mixedStatesList: ListUsersResponseDTO = [
          { ...mockUsersArray[0], is_active: true },
          { ...mockUsersArray[1], is_active: false },
          {
            id: 3,
            username: '',
            email: 'empty@test.com',
            first_name: '',
            last_name: '',
            is_active: true,
            role_name: 'Guest',
            created_at: '2024-01-03T00:00:00Z',
          },
        ];

        // Then
        expect(mixedStatesList.length).toBe(3);
        expect(mixedStatesList[0].is_active).toBe(true);
        expect(mixedStatesList[1].is_active).toBe(false);
        expect(mixedStatesList[2].username).toBe('');
        expect(mixedStatesList[2].role_name).toBe('Guest');
      });

      it('should handle users with same properties', () => {
        // Given
        const duplicateUsersList: ListUsersResponseDTO = [
          mockUsersArray[0],
          { ...mockUsersArray[0], id: 999 }, // Same data but different ID
          mockUsersArray[0], // Exact duplicate
        ];

        // Then
        expect(duplicateUsersList.length).toBe(3);
        expect(duplicateUsersList[0].id).toBe(1);
        expect(duplicateUsersList[1].id).toBe(999);
        expect(duplicateUsersList[2].id).toBe(1);
        expect(duplicateUsersList[0].username).toBe(duplicateUsersList[1].username);
        expect(duplicateUsersList[0]).toEqual(duplicateUsersList[2]);
      });
    });

    describe('data consistency', () => {
      it('should maintain array structure and order', () => {
        // Given
        const originalList: ListUsersResponseDTO = [...mockUsersArray];

        // When
        const json = JSON.stringify(originalList);
        const parsed: ListUsersResponseDTO = JSON.parse(json);

        // Then
        expect(parsed.length).toBe(originalList.length);
        expect(parsed[0]).toEqual(originalList[0]);
        expect(parsed[1]).toEqual(originalList[1]);
        expect(parsed).toEqual(originalList);
      });

      it('should handle array mutations appropriately', () => {
        // Given
        const mutableList: ListUsersResponseDTO = [...mockUsersArray];
        const originalLength = mutableList.length;

        // When adding to array (simulating API response with more data)
        const newUser: UserDTO = {
          id: 3,
          username: 'newuser',
          email: 'new@test.com',
          first_name: 'New',
          last_name: 'User',
          is_active: true,
          role_name: 'Viewer',
          created_at: '2024-01-03T00:00:00Z',
        };
        mutableList.push(newUser);

        // Then
        expect(mutableList.length).toBe(originalLength + 1);
        expect(mutableList[2]).toEqual(newUser);
        expect(mutableList[2].username).toBe('newuser');
      });

      it('should handle filtering operations', () => {
        // Given
        const listWithMixedStates: ListUsersResponseDTO = [
          { ...mockUsersArray[0], is_active: true },
          { ...mockUsersArray[1], is_active: false },
          {
            id: 3,
            username: 'inactive_user',
            email: 'inactive@test.com',
            first_name: 'Inactive',
            last_name: 'User',
            is_active: false,
            role_name: 'Viewer',
            created_at: '2024-01-03T00:00:00Z',
          },
        ];

        // When filtering active users
        const activeUsers = listWithMixedStates.filter((user) => user.is_active);
        const inactiveUsers = listWithMixedStates.filter((user) => !user.is_active);

        // Then
        expect(activeUsers.length).toBe(1);
        expect(inactiveUsers.length).toBe(2);
        expect(activeUsers[0].username).toBe('admin');
        expect(inactiveUsers.map((u) => u.username)).toEqual(['editor', 'inactive_user']);
      });
    });
  });
});
