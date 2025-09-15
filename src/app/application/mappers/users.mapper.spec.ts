import { TestBed } from '@angular/core/testing';
import { UsersMapper } from './users.mapper';
import { User } from '@domain/entities/user.entity';
import { ActivityPeriod } from '@domain/value-objects';

/**
 * Test suite for UsersMapper
 *
 * Tests the mapping funct      // Assert
      expect(result).toEqual(jasmine.objectContaining({
        id: 3,
        username: 'bob_manager',
        email: 'bob.manager@example.com',
        firstName: 'Bob',
        lastName: 'Manager',
        active: false,
        roleName: 'Manager',
      }));
      expect((result as any).createdAt).toEqual(new Date('2024-01-10T08:00:00Z'));
      expect((result as any).lastActivityAt).toEqual(new Date('2024-01-14T16:30:00Z'));en Domain User entities
 * and Application layer types following Clean Architecture principles.
 *
 * @layer Application
 * @since 1.0.0
 */
describe('UsersMapper', () => {
  let mapper: UsersMapper;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    mapper = TestBed.inject(UsersMapper);
  });

  it('should be created', () => {
    expect(mapper).toBeTruthy();
  });

  describe('calculateUserStatistics', () => {
    it('should calculate statistics for multiple users with different roles and activity', () => {
      // Arrange
      const mockRole1 = jasmine.createSpyObj('Role', [], {
        name: 'Admin',
        canLeadProjects: jasmine.createSpy().and.returnValue(true),
        isUniqueForTeam: jasmine.createSpy().and.returnValue(true),
      });

      const mockRole2 = jasmine.createSpyObj('Role', [], {
        name: 'User',
        canLeadProjects: jasmine.createSpy().and.returnValue(false),
        isUniqueForTeam: jasmine.createSpy().and.returnValue(false),
      });

      const mockRole3 = jasmine.createSpyObj('Role', [], {
        name: 'Manager',
        canLeadProjects: jasmine.createSpy().and.returnValue(true),
        isUniqueForTeam: jasmine.createSpy().and.returnValue(false),
      });

      const mockUser1 = jasmine.createSpyObj('User', [], {
        id: 1,
        username: { value: 'admin1' },
        email: { value: 'admin1@example.com' },
        firstName: { value: 'John' },
        lastName: { value: 'Admin' },
        active: true,
        role: mockRole1,
        createdAt: { value: new Date('2024-01-01') },
        updatedAt: { value: new Date('2024-01-15') },
        lastActivityAt: { value: new Date('2024-01-20') },
      });

      const mockUser2 = jasmine.createSpyObj('User', [], {
        id: 2,
        username: { value: 'user1' },
        email: { value: 'user1@example.com' },
        firstName: { value: 'Jane' },
        lastName: { value: 'User' },
        active: false,
        role: mockRole2,
        createdAt: { value: new Date('2024-01-05') },
        updatedAt: { value: new Date('2024-01-10') },
        lastActivityAt: { value: new Date('2024-01-12') },
      });

      const mockUser3 = jasmine.createSpyObj('User', [], {
        id: 3,
        username: { value: 'manager1' },
        email: { value: 'manager1@example.com' },
        firstName: { value: 'Bob' },
        lastName: { value: 'Manager' },
        active: true,
        role: mockRole3,
        createdAt: { value: new Date('2024-01-03') },
        updatedAt: { value: new Date('2024-01-18') },
        lastActivityAt: { value: new Date('2024-01-19') },
      });

      const users = [mockUser1, mockUser2, mockUser3];

      // Mock ActivityPeriod.recentActivity()
      spyOn(ActivityPeriod, 'recentActivity').and.returnValue({
        days: 30,
        getCutoffDate: jasmine.createSpy().and.returnValue(new Date('2024-01-01')),
        isWithinPeriod: jasmine.createSpy().and.callFake((date: Date) => {
          // Mock recent activity - consider dates from January 2024 as recent
          const cutoff = new Date('2023-12-01'); // Cutoff that includes all test dates
          return date >= cutoff;
        }),
        getDays: jasmine.createSpy().and.returnValue(30),
      } as any);

      // Act
      const result = mapper.calculateUserStatistics(users);

      // Assert
      expect(result).toEqual({
        totalUsers: 3,
        activeUsers: 2,
        inactiveUsers: 1,
        usersByRole: {
          Admin: 1,
          User: 1,
          Manager: 1,
        },
        recentActivity: {
          recentlyCreated: 3, // All users created within recent period
          recentlyUpdated: 3, // All users updated within recent period
          recentlyLoggedIn: 3, // All users active within recent period
        },
      });
    });

    it('should handle empty user array', () => {
      // Arrange
      const users: User[] = [];

      // Act
      const result = mapper.calculateUserStatistics(users);

      // Assert
      expect(result).toEqual({
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        usersByRole: {},
        recentActivity: {
          recentlyCreated: 0,
          recentlyUpdated: 0,
          recentlyLoggedIn: 0,
        },
      });
    });

    it('should handle users with missing activity dates', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj('Role', [], {
        name: 'User',
        canLeadProjects: jasmine.createSpy().and.returnValue(false),
        isUniqueForTeam: jasmine.createSpy().and.returnValue(false),
      });

      const mockUser1 = jasmine.createSpyObj('User', [], {
        id: 1,
        username: { value: 'user1' },
        email: { value: 'user1@example.com' },
        firstName: { value: 'John' },
        lastName: { value: 'Doe' },
        active: true,
        role: mockRole,
        createdAt: { value: new Date('2024-01-01') },
        updatedAt: undefined, // No updated date
        lastActivityAt: undefined, // No activity date
      });

      const mockUser2 = jasmine.createSpyObj('User', [], {
        id: 2,
        username: { value: 'user2' },
        email: { value: 'user2@example.com' },
        firstName: { value: 'Jane' },
        lastName: { value: 'Smith' },
        active: true,
        role: mockRole,
        createdAt: undefined, // No created date
        updatedAt: { value: new Date('2024-01-15') },
        lastActivityAt: { value: new Date('2024-01-20') },
      });

      const users = [mockUser1, mockUser2];

      // Mock ActivityPeriod.recentActivity()
      spyOn(ActivityPeriod, 'recentActivity').and.returnValue({
        days: 30,
        getCutoffDate: jasmine.createSpy().and.returnValue(new Date('2024-01-01')),
        isWithinPeriod: jasmine.createSpy().and.returnValue(true),
        getDays: jasmine.createSpy().and.returnValue(30),
      } as any);

      // Act
      const result = mapper.calculateUserStatistics(users);

      // Assert
      expect(result).toEqual({
        totalUsers: 2,
        activeUsers: 2,
        inactiveUsers: 0,
        usersByRole: {
          User: 2,
        },
        recentActivity: {
          recentlyCreated: 1, // Only user1 has created date
          recentlyUpdated: 1, // Only user2 has updated date
          recentlyLoggedIn: 1, // Only user2 has activity date
        },
      });
    });

    it('should correctly count users by role with multiple users per role', () => {
      // Arrange
      const mockAdminRole = jasmine.createSpyObj('Role', [], {
        name: 'Admin',
        canLeadProjects: jasmine.createSpy().and.returnValue(true),
        isUniqueForTeam: jasmine.createSpy().and.returnValue(true),
      });

      const mockUserRole = jasmine.createSpyObj('Role', [], {
        name: 'User',
        canLeadProjects: jasmine.createSpy().and.returnValue(false),
        isUniqueForTeam: jasmine.createSpy().and.returnValue(false),
      });

      const users = [
        jasmine.createSpyObj('User', [], {
          id: 1,
          username: { value: 'admin1' },
          email: { value: 'admin1@example.com' },
          firstName: { value: 'John' },
          lastName: { value: 'Admin' },
          active: true,
          role: mockAdminRole,
          createdAt: { value: new Date() },
          updatedAt: { value: new Date() },
          lastActivityAt: { value: new Date() },
        }),
        jasmine.createSpyObj('User', [], {
          id: 2,
          username: { value: 'admin2' },
          email: { value: 'admin2@example.com' },
          firstName: { value: 'Jane' },
          lastName: { value: 'Admin' },
          active: true,
          role: mockAdminRole,
          createdAt: { value: new Date() },
          updatedAt: { value: new Date() },
          lastActivityAt: { value: new Date() },
        }),
        jasmine.createSpyObj('User', [], {
          id: 3,
          username: { value: 'user1' },
          email: { value: 'user1@example.com' },
          firstName: { value: 'Bob' },
          lastName: { value: 'User' },
          active: true,
          role: mockUserRole,
          createdAt: { value: new Date() },
          updatedAt: { value: new Date() },
          lastActivityAt: { value: new Date() },
        }),
      ];

      // Mock ActivityPeriod.recentActivity()
      spyOn(ActivityPeriod, 'recentActivity').and.returnValue({
        days: 30,
        getCutoffDate: jasmine.createSpy().and.returnValue(new Date('2024-01-01')),
        isWithinPeriod: jasmine.createSpy().and.returnValue(true),
        getDays: jasmine.createSpy().and.returnValue(30),
      } as any);

      // Act
      const result = mapper.calculateUserStatistics(users);

      // Assert
      expect(result.usersByRole).toEqual({
        Admin: 2,
        User: 1,
      });
    });
  });

  describe('toUserSummary', () => {
    it('should transform User entity to summary format', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj('Role', [], {
        name: 'Admin',
        canLeadProjects: jasmine.createSpy().and.returnValue(true),
        isUniqueForTeam: jasmine.createSpy().and.returnValue(true),
      });

      const mockUser = jasmine.createSpyObj('User', [], {
        id: 1,
        username: { value: 'john_doe' },
        email: { value: 'john.doe@example.com' },
        firstName: { value: 'John' },
        lastName: { value: 'Doe' },
        active: true,
        role: mockRole,
        createdAt: { value: new Date('2024-01-01T10:00:00Z') },
        updatedAt: { value: new Date('2024-01-15T15:30:00Z') },
        lastActivityAt: { value: new Date('2024-01-20T12:45:00Z') },
      });

      // Act
      const result = mapper.toUserSummary(mockUser);

      // Assert
      expect(result).toEqual(
        jasmine.objectContaining({
          id: 1,
          username: 'john_doe',
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          active: true,
          roleName: 'Admin',
        })
      );
      expect((result as any).createdAt).toEqual(new Date('2024-01-01T10:00:00Z'));
      expect((result as any).lastActivityAt).toEqual(new Date('2024-01-20T12:45:00Z'));
    });

    it('should handle user with undefined dates', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj('Role', [], {
        name: 'User',
        canLeadProjects: jasmine.createSpy().and.returnValue(false),
        isUniqueForTeam: jasmine.createSpy().and.returnValue(false),
      });

      const mockUser = jasmine.createSpyObj('User', [], {
        id: 2,
        username: { value: 'jane_smith' },
        email: { value: 'jane.smith@example.com' },
        firstName: { value: 'Jane' },
        lastName: { value: 'Smith' },
        active: false,
        role: mockRole,
        createdAt: undefined,
        updatedAt: undefined,
        lastActivityAt: undefined,
      });

      // Act
      const result = mapper.toUserSummary(mockUser);

      // Assert
      expect(result).toEqual({
        id: 2,
        username: 'jane_smith',
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        active: false,
        roleName: 'User',
        createdAt: undefined,
        lastActivityAt: undefined,
      });
    });

    it('should handle inactive user with different role', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj('Role', [], {
        name: 'Manager',
        canLeadProjects: jasmine.createSpy().and.returnValue(true),
        isUniqueForTeam: jasmine.createSpy().and.returnValue(false),
      });

      const mockUser = jasmine.createSpyObj('User', [], {
        id: 3,
        username: { value: 'bob_manager' },
        email: { value: 'bob.manager@example.com' },
        firstName: { value: 'Bob' },
        lastName: { value: 'Manager' },
        active: false,
        role: mockRole,
        createdAt: { value: new Date('2024-01-10T08:00:00Z') },
        updatedAt: { value: new Date('2024-01-12T14:20:00Z') },
        lastActivityAt: { value: new Date('2024-01-14T16:30:00Z') },
      });

      // Act
      const result = mapper.toUserSummary(mockUser);

      // Assert
      expect(result).toEqual(
        jasmine.objectContaining({
          id: 3,
          username: 'bob_manager',
          email: 'bob.manager@example.com',
          firstName: 'Bob',
          lastName: 'Manager',
          active: false,
          roleName: 'Manager',
        })
      );
      expect((result as any).createdAt).toEqual(new Date('2024-01-10T08:00:00Z'));
      expect((result as any).lastActivityAt).toEqual(new Date('2024-01-14T16:30:00Z'));
    });
  });

  describe('toUserSummaries', () => {
    it('should transform array of User entities to summary format array', () => {
      // Arrange
      const mockRole1 = jasmine.createSpyObj('Role', [], {
        name: 'Admin',
        canLeadProjects: jasmine.createSpy().and.returnValue(true),
        isUniqueForTeam: jasmine.createSpy().and.returnValue(true),
      });

      const mockRole2 = jasmine.createSpyObj('Role', [], {
        name: 'User',
        canLeadProjects: jasmine.createSpy().and.returnValue(false),
        isUniqueForTeam: jasmine.createSpy().and.returnValue(false),
      });

      const mockUser1 = jasmine.createSpyObj('User', [], {
        id: 1,
        username: { value: 'admin1' },
        email: { value: 'admin1@example.com' },
        firstName: { value: 'John' },
        lastName: { value: 'Admin' },
        active: true,
        role: mockRole1,
        createdAt: { value: new Date('2024-01-01') },
        updatedAt: { value: new Date('2024-01-15') },
        lastActivityAt: { value: new Date('2024-01-20') },
      });

      const mockUser2 = jasmine.createSpyObj('User', [], {
        id: 2,
        username: { value: 'user1' },
        email: { value: 'user1@example.com' },
        firstName: { value: 'Jane' },
        lastName: { value: 'User' },
        active: false,
        role: mockRole2,
        createdAt: { value: new Date('2024-01-05') },
        updatedAt: { value: new Date('2024-01-10') },
        lastActivityAt: { value: new Date('2024-01-12') },
      });

      const users = [mockUser1, mockUser2];

      // Act
      const result = mapper.toUserSummaries(users);

      // Assert
      expect(result).toEqual([
        jasmine.objectContaining({
          id: 1,
          username: 'admin1',
          email: 'admin1@example.com',
          firstName: 'John',
          lastName: 'Admin',
          active: true,
          roleName: 'Admin',
        }),
        jasmine.objectContaining({
          id: 2,
          username: 'user1',
          email: 'user1@example.com',
          firstName: 'Jane',
          lastName: 'User',
          active: false,
          roleName: 'User',
        }),
      ]);
      expect((result[0] as any).createdAt).toEqual(new Date('2024-01-01'));
      expect((result[0] as any).lastActivityAt).toEqual(new Date('2024-01-20'));
      expect((result[1] as any).createdAt).toEqual(new Date('2024-01-05'));
      expect((result[1] as any).lastActivityAt).toEqual(new Date('2024-01-12'));
    });

    it('should handle empty array', () => {
      // Arrange
      const users: User[] = [];

      // Act
      const result = mapper.toUserSummaries(users);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle single user array', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj('Role', [], {
        name: 'Manager',
        canLeadProjects: jasmine.createSpy().and.returnValue(true),
        isUniqueForTeam: jasmine.createSpy().and.returnValue(false),
      });

      const mockUser = jasmine.createSpyObj('User', [], {
        id: 1,
        username: { value: 'manager1' },
        email: { value: 'manager1@example.com' },
        firstName: { value: 'Alice' },
        lastName: { value: 'Manager' },
        active: true,
        role: mockRole,
        createdAt: { value: new Date('2024-01-01') },
        updatedAt: { value: new Date('2024-01-15') },
        lastActivityAt: { value: new Date('2024-01-20') },
      });

      // Act
      const result = mapper.toUserSummaries([mockUser]);

      // Assert
      expect(result).toEqual([
        jasmine.objectContaining({
          id: 1,
          username: 'manager1',
          email: 'manager1@example.com',
          firstName: 'Alice',
          lastName: 'Manager',
          active: true,
          roleName: 'Manager',
        }),
      ]);
      expect((result[0] as any).createdAt).toEqual(new Date('2024-01-01'));
      expect((result[0] as any).lastActivityAt).toEqual(new Date('2024-01-20'));
    });
  });

  describe('createUserEvent', () => {
    it('should create user event with type and data', () => {
      // Arrange
      const eventType = 'USER_CREATED';
      const eventData = {
        userId: 1,
        username: 'john_doe',
        email: 'john.doe@example.com',
      };

      // Act
      const result = mapper.createUserEvent(eventType, eventData);

      // Assert
      expect(result).toEqual(
        jasmine.objectContaining({
          type: 'USER_CREATED',
          userId: 1,
          username: 'john_doe',
          email: 'john.doe@example.com',
          timestamp: jasmine.any(String),
        })
      );

      // Verify timestamp is valid ISO string
      expect(() => new Date(result.timestamp)).not.toThrow();
    });

    it('should create user event with empty data object', () => {
      // Arrange
      const eventType = 'USER_DELETED';
      const eventData = {};

      // Act
      const result = mapper.createUserEvent(eventType, eventData);

      // Assert
      expect(result).toEqual({
        type: 'USER_DELETED',
        timestamp: jasmine.any(String),
      });
    });

    it('should create user event with complex data', () => {
      // Arrange
      const eventType = 'USER_UPDATED';
      const eventData = {
        userId: 5,
        changes: {
          firstName: { from: 'John', to: 'Johnny' },
          lastName: { from: 'Doe', to: 'Smith' },
          role: { from: 'User', to: 'Manager' },
        },
        updatedBy: 'admin',
        reason: 'Profile update',
      };

      // Act
      const result = mapper.createUserEvent(eventType, eventData);

      // Assert
      expect(result).toEqual(
        jasmine.objectContaining({
          type: 'USER_UPDATED',
          userId: 5,
          changes: {
            firstName: { from: 'John', to: 'Johnny' },
            lastName: { from: 'Doe', to: 'Smith' },
            role: { from: 'User', to: 'Manager' },
          },
          updatedBy: 'admin',
          reason: 'Profile update',
          timestamp: jasmine.any(String),
        })
      );
    });

    it('should generate valid ISO timestamp', () => {
      // Arrange
      const eventType = 'TEST_EVENT';
      const eventData = { test: true };

      // Act
      const result = mapper.createUserEvent(eventType, eventData);

      // Assert
      const timestamp = result.timestamp;
      expect(typeof timestamp).toBe('string');

      // Verify it's a valid ISO string by parsing it
      const parsedDate = new Date(timestamp);
      expect(isNaN(parsedDate.getTime())).toBe(false);

      // Verify it's recent (within last minute)
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - parsedDate.getTime());
      expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
    });
  });

  describe('Integration and Complex Scenarios', () => {
    it('should handle complex user statistics with mixed activity dates', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj('Role', [], {
        name: 'User',
        canLeadProjects: jasmine.createSpy().and.returnValue(false),
        isUniqueForTeam: jasmine.createSpy().and.returnValue(false),
      });

      // Create users with different activity patterns
      const users = [
        // Recent activity (within 30 days)
        jasmine.createSpyObj('User', [], {
          id: 1,
          username: { value: 'recent1' },
          email: { value: 'recent1@example.com' },
          firstName: { value: 'Recent' },
          lastName: { value: 'User1' },
          active: true,
          role: mockRole,
          createdAt: { value: new Date() }, // Today
          updatedAt: { value: new Date() }, // Today
          lastActivityAt: { value: new Date() }, // Today
        }),
        // Old activity (more than 30 days ago)
        jasmine.createSpyObj('User', [], {
          id: 2,
          username: { value: 'old1' },
          email: { value: 'old1@example.com' },
          firstName: { value: 'Old' },
          lastName: { value: 'User1' },
          active: true,
          role: mockRole,
          createdAt: { value: new Date('2023-01-01') }, // Old
          updatedAt: { value: new Date('2023-01-01') }, // Old
          lastActivityAt: { value: new Date('2023-01-01') }, // Old
        }),
        // Mixed dates
        jasmine.createSpyObj('User', [], {
          id: 3,
          username: { value: 'mixed1' },
          email: { value: 'mixed1@example.com' },
          firstName: { value: 'Mixed' },
          lastName: { value: 'User1' },
          active: false,
          role: mockRole,
          createdAt: { value: new Date() }, // Recent
          updatedAt: { value: new Date('2023-01-01') }, // Old
          lastActivityAt: { value: new Date() }, // Recent
        }),
      ];

      // Mock ActivityPeriod with realistic behavior
      const mockActivityPeriod = {
        days: 30,
        getCutoffDate: jasmine
          .createSpy()
          .and.returnValue(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        isWithinPeriod: jasmine.createSpy().and.callFake((date: Date) => {
          const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return date >= cutoff;
        }),
        getDays: jasmine.createSpy().and.returnValue(30),
      };

      spyOn(ActivityPeriod, 'recentActivity').and.returnValue(mockActivityPeriod as any);

      // Act
      const result = mapper.calculateUserStatistics(users);

      // Assert
      expect(result.totalUsers).toBe(3);
      expect(result.activeUsers).toBe(2);
      expect(result.inactiveUsers).toBe(1);
      expect(result.usersByRole['User']).toBe(3);

      // Recent activity should only count recent dates
      expect(result.recentActivity.recentlyCreated).toBe(2); // Users 1 and 3
      expect(result.recentActivity.recentlyUpdated).toBe(1); // User 1 only
      expect(result.recentActivity.recentlyLoggedIn).toBe(2); // Users 1 and 3
    });

    it('should handle users with special characters in names and emails', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj('Role', [], {
        name: 'Special User',
        canLeadProjects: jasmine.createSpy().and.returnValue(false),
        isUniqueForTeam: jasmine.createSpy().and.returnValue(false),
      });

      const mockUser = jasmine.createSpyObj('User', [], {
        id: 1,
        username: { value: 'user@special.chars' },
        email: { value: 'user+tag@example-domain.co.uk' },
        firstName: { value: 'José María' },
        lastName: { value: "O'Connor-Smith" },
        active: true,
        role: mockRole,
        createdAt: { value: new Date('2024-01-01') },
        updatedAt: { value: new Date('2024-01-15') },
        lastActivityAt: { value: new Date('2024-01-20') },
      });

      // Act
      const result = mapper.toUserSummary(mockUser);

      // Assert
      expect(result.username).toBe('user@special.chars');
      expect(result.email).toBe('user+tag@example-domain.co.uk');
      expect(result.firstName).toBe('José María');
      expect(result.lastName).toBe("O'Connor-Smith");
      expect(result.roleName).toBe('Special User');
    });
  });

  describe('Type Safety and Interface Compliance', () => {
    it('should return UserStatistics object with correct structure', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj('Role', [], {
        name: 'TestRole',
        canLeadProjects: jasmine.createSpy().and.returnValue(false),
        isUniqueForTeam: jasmine.createSpy().and.returnValue(false),
      });

      const mockUser = jasmine.createSpyObj('User', [], {
        id: 1,
        username: { value: 'testuser' },
        email: { value: 'test@example.com' },
        firstName: { value: 'Test' },
        lastName: { value: 'User' },
        active: true,
        role: mockRole,
        createdAt: { value: new Date() },
        updatedAt: { value: new Date() },
        lastActivityAt: { value: new Date() },
      });

      spyOn(ActivityPeriod, 'recentActivity').and.returnValue({
        days: 30,
        getCutoffDate: jasmine.createSpy().and.returnValue(new Date()),
        isWithinPeriod: jasmine.createSpy().and.returnValue(true),
        getDays: jasmine.createSpy().and.returnValue(30),
      } as any);

      // Act
      const result = mapper.calculateUserStatistics([mockUser]);

      // Assert - Verify UserStatistics interface compliance
      expect(typeof result.totalUsers).toBe('number');
      expect(typeof result.activeUsers).toBe('number');
      expect(typeof result.inactiveUsers).toBe('number');
      expect(typeof result.usersByRole).toBe('object');
      expect(Array.isArray(Object.keys(result.usersByRole))).toBe(true);
      expect(typeof result.recentActivity).toBe('object');
      expect(typeof result.recentActivity.recentlyCreated).toBe('number');
      expect(typeof result.recentActivity.recentlyUpdated).toBe('number');
      expect(typeof result.recentActivity.recentlyLoggedIn).toBe('number');
    });

    it('should return user summary objects with correct structure', () => {
      // Arrange
      const mockRole = jasmine.createSpyObj('Role', [], {
        name: 'TestRole',
        canLeadProjects: jasmine.createSpy().and.returnValue(false),
        isUniqueForTeam: jasmine.createSpy().and.returnValue(false),
      });

      const mockUser = jasmine.createSpyObj('User', [], {
        id: 1,
        username: { value: 'testuser' },
        email: { value: 'test@example.com' },
        firstName: { value: 'Test' },
        lastName: { value: 'User' },
        active: true,
        role: mockRole,
        createdAt: { value: new Date() },
        updatedAt: { value: new Date() },
        lastActivityAt: { value: new Date() },
      });

      // Act
      const result = mapper.toUserSummary(mockUser);

      // Assert - Verify user summary structure
      expect(typeof result.id).toBe('number');
      expect(typeof result.username).toBe('string');
      expect(typeof result.email).toBe('string');
      expect(typeof result.firstName).toBe('string');
      expect(typeof result.lastName).toBe('string');
      expect(typeof result.active).toBe('boolean');
      expect(typeof result.roleName).toBe('string');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.lastActivityAt).toBeInstanceOf(Date);
    });

    it('should return user event objects with correct structure', () => {
      // Arrange
      const eventType = 'USER_TEST_EVENT';
      const eventData = { testId: 123, testData: 'test value' };

      // Act
      const result = mapper.createUserEvent(eventType, eventData);

      // Assert - Verify user event structure
      expect(typeof result.type).toBe('string');
      expect(result.type).toBe(eventType);
      expect(typeof result.timestamp).toBe('string');
      expect((result as any).testId).toBe(123);
      expect((result as any).testData).toBe('test value');

      // Verify timestamp is valid ISO string
      const parsedTimestamp = new Date(result.timestamp);
      expect(isNaN(parsedTimestamp.getTime())).toBe(false);
    });
  });
});
