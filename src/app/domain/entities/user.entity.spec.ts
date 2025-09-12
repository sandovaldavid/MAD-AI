import { User } from './user.entity';
import { Role } from './role.entity';
import { Username, Email, FirstName, LastName } from '../value-objects';
import type { UserNotificationPreferences } from '../value-objects/user-notification-preferences.vo';

describe('User Entity', () => {
  let mockRole: Role;
  let mockNotificationPreferences: UserNotificationPreferences;

  beforeEach(() => {
    mockRole = Role.create({
      id: 1,
      name: 'TestRole',
      description: 'Test role for unit tests',
      accessLevel: 5,
      isActive: true,
    });

    mockNotificationPreferences = {
      email: true,
      system: false,
      task: false,
    };
  });

  describe('Creation', () => {
    it('should create a valid user with required fields', () => {
      const user = User.create({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        role: mockRole,
        notificationPreferences: mockNotificationPreferences,
      });

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(1);
      expect(user.username.value).toBe('testuser');
      expect(user.email.value).toBe('test@example.com');
      expect(user.firstName.value).toBe('John');
      expect(user.lastName.value).toBe('Doe');
      expect(user.active).toBe(true);
      expect(user.role).toBe(mockRole);
    });

    it('should create a user with optional fields', () => {
      const user = User.create({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        role: mockRole,
        notificationPreferences: mockNotificationPreferences,
        createdAt: '2023-01-01T00:00:00Z',
        isEmailConfirmed: true,
      });

      expect(user.createdAt).toBeDefined();
      expect(user.isEmailConfirmed).toBe(true);
    });

    it('should create a user with custom status', () => {
      const user = User.create({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        role: mockRole,
        notificationPreferences: mockNotificationPreferences,
        status: 'active',
      });

      expect(user.userStatus.value).toBe('active');
    });

    it('should throw ValidationError for invalid username', () => {
      expect(() => {
        User.create({
          id: 1,
          username: 'ab', // Too short
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          role: mockRole,
          notificationPreferences: mockNotificationPreferences,
        });
      }).toThrow();
    });

    it('should throw ValidationError with correct message for invalid username', () => {
      try {
        User.create({
          id: 1,
          username: 'ab', // Too short
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          role: mockRole,
          notificationPreferences: mockNotificationPreferences,
        });
        fail('Expected ValidationError to be thrown');
      } catch (error: any) {
        expect(error.constructor.name).toBe('_ValidationError');
        expect(error.message).toContain('username');
      }
    });

    it('should throw ValidationError for invalid email', () => {
      expect(() => {
        User.create({
          id: 1,
          username: 'testuser',
          email: 'invalid-email', // Invalid format
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          role: mockRole,
          notificationPreferences: mockNotificationPreferences,
        });
      }).toThrow();
    });

    it('should throw ValidationError with correct message for invalid email', () => {
      try {
        User.create({
          id: 1,
          username: 'testuser',
          email: 'invalid-email', // Invalid format
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          role: mockRole,
          notificationPreferences: mockNotificationPreferences,
        });
        fail('Expected ValidationError to be thrown');
      } catch (error: any) {
        expect(error.constructor.name).toBe('_ValidationError');
        expect(error.message).toContain('email');
      }
    });

    it('should throw ValidationError for invalid firstName', () => {
      expect(() => {
        User.create({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: '', // Invalid - empty
          lastName: 'Doe',
          isActive: true,
          role: mockRole,
          notificationPreferences: mockNotificationPreferences,
        });
      }).toThrow();
    });

    it('should throw ValidationError for invalid lastName', () => {
      expect(() => {
        User.create({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'John',
          lastName: '', // Invalid - empty
          isActive: true,
          role: mockRole,
          notificationPreferences: mockNotificationPreferences,
        });
      }).toThrow();
    });

    it('should throw ValidationError for missing role', () => {
      expect(() => {
        User.create({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          role: null as any, // Missing role
          notificationPreferences: mockNotificationPreferences,
        });
      }).toThrow();
    });

    it('should throw ValidationError for missing notificationPreferences', () => {
      expect(() => {
        User.create({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          role: mockRole,
          notificationPreferences: null as any, // Missing notificationPreferences
        });
      }).toThrow();
    });

    it('should throw ValidationError for invalid createdAt date', () => {
      expect(() => {
        User.create({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          role: mockRole,
          notificationPreferences: mockNotificationPreferences,
          createdAt: 'invalid-date', // Invalid date format
        });
      }).toThrow();
    });

    it('should throw ValidationError for invalid updatedAt date', () => {
      expect(() => {
        User.create({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          role: mockRole,
          notificationPreferences: mockNotificationPreferences,
          updatedAt: 'invalid-date', // Invalid date format
        });
      }).toThrow();
    });

    it('should throw ValidationError for invalid lastActivityAt date', () => {
      expect(() => {
        User.create({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          role: mockRole,
          notificationPreferences: mockNotificationPreferences,
          lastActivityAt: 'invalid-date', // Invalid date format
        });
      }).toThrow();
    });
  });

  describe('Business Logic', () => {
    let user: User;

    beforeEach(() => {
      user = User.create({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: false,
        role: mockRole,
        notificationPreferences: mockNotificationPreferences,
      });
    });

    describe('Account Management', () => {
      it('should activate user account', () => {
        user.activate();
        expect(user.active).toBe(true);
      });

      it('should deactivate user account', () => {
        user.activate(); // First activate
        user.deactivate();
        expect(user.active).toBe(false);
      });

      it('should not change state when activating already active user', () => {
        user.activate();
        const initialState = user.active;
        user.activate();
        expect(user.active).toBe(initialState);
      });

      it('should not change state when deactivating already inactive user', () => {
        const initialState = user.active;
        user.deactivate();
        expect(user.active).toBe(initialState);
      });
    });

    describe('Profile Management', () => {
      it('should change email', () => {
        const newEmail = Email.create('newemail@example.com');
        user.changeEmail(newEmail);
        expect(user.email).toBe(newEmail);
      });

      it('should change username', () => {
        const newUsername = Username.create('newusername');
        user.changeUsername(newUsername);
        expect(user.username).toBe(newUsername);
      });

      it('should update name', () => {
        const newFirstName = FirstName.create('Jane');
        const newLastName = LastName.create('Smith');
        user.updateName(newFirstName, newLastName);
        expect(user.firstName).toBe(newFirstName);
        expect(user.lastName).toBe(newLastName);
      });

      it('should update notification preferences', () => {
        const newPreferences: UserNotificationPreferences = {
          email: false,
          system: true,
          task: true,
        };
        user.updateNotificationPreferences(newPreferences);
        expect(user.notificationPreferences?.email).toBe(false);
        expect(user.notificationPreferences?.system).toBe(true);
        expect(user.notificationPreferences?.task).toBe(true);
      });

      it('should throw ValidationError when updating name with null firstName', () => {
        expect(() => {
          user.updateName(null as any, LastName.create('Smith'));
        }).toThrow();
      });

      it('should throw ValidationError when updating name with null lastName', () => {
        expect(() => {
          user.updateName(FirstName.create('Jane'), null as any);
        }).toThrow();
      });

      it('should throw ValidationError when changing email to null', () => {
        expect(() => {
          user.changeEmail(null as any);
        }).toThrow();
      });

      it('should throw ValidationError when changing username to null', () => {
        expect(() => {
          user.changeUsername(null as any);
        }).toThrow();
      });
    });

    describe('Role Management', () => {
      it('should change role', () => {
        const newRole = Role.create({
          id: 2,
          name: 'User',
          accessLevel: 5,
          isActive: true,
        });

        user.changeRole(newRole);
        expect(user.role).toBe(newRole);
      });

      it('should throw ValidationError when changing role to null', () => {
        expect(() => {
          user.changeRole(null as any);
        }).toThrow();
      });
    });

    describe('Permission Checks', () => {
      it('should delegate canDeleteUsers to role', () => {
        expect(user.canDeleteUsers()).toBe(mockRole.canDeleteUsers());
      });

      it('should delegate canLeadProjects to role', () => {
        expect(user.canLeadProjects()).toBe(mockRole.canLeadProjects());
      });

      it('should get permissions from role', () => {
        expect(user.getPermissions()).toEqual(mockRole.getPermissions());
      });
    });

    describe('Email Verification', () => {
      it('should return true for verified email when isEmailConfirmed is true', () => {
        const verifiedUser = User.create({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          role: mockRole,
          notificationPreferences: mockNotificationPreferences,
          isEmailConfirmed: true,
        });

        expect(verifiedUser.hasVerifiedEmail()).toBe(true);
      });

      it('should return false for unverified email when isEmailConfirmed is false', () => {
        const unverifiedUser = User.create({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          role: mockRole,
          notificationPreferences: mockNotificationPreferences,
          isEmailConfirmed: false,
        });

        expect(unverifiedUser.hasVerifiedEmail()).toBe(false);
      });
    });
  });

  describe('Equality', () => {
    it('should be equal to another user with same id', () => {
      const user1 = User.create({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        role: mockRole,
        notificationPreferences: mockNotificationPreferences,
      });

      const user2 = User.create({
        id: 1,
        username: 'differentuser',
        email: 'different@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        isActive: false,
        role: mockRole,
        notificationPreferences: mockNotificationPreferences,
      });

      expect(user1.equals(user2)).toBe(true);
    });

    it('should not be equal to another user with different id', () => {
      const user1 = User.create({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        role: mockRole,
        notificationPreferences: mockNotificationPreferences,
      });

      const user2 = User.create({
        id: 2,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        role: mockRole,
        notificationPreferences: mockNotificationPreferences,
      });

      expect(user1.equals(user2)).toBe(false);
    });

    it('should not be equal to null or undefined', () => {
      const user = User.create({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        role: mockRole,
        notificationPreferences: mockNotificationPreferences,
      });

      expect(user.equals(null)).toBe(false);
      expect(user.equals(undefined)).toBe(false);
    });
  });

  describe('String Representation', () => {
    it('should return meaningful string representation', () => {
      const user = User.create({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        role: mockRole,
        notificationPreferences: mockNotificationPreferences,
      });

      const stringRep = user.toString();
      expect(stringRep).toContain('testuser');
      expect(stringRep).toContain('test@example.com');
    });
  });

  describe('Getters', () => {
    let user: User;

    beforeEach(() => {
      user = User.create({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        role: mockRole,
        notificationPreferences: mockNotificationPreferences,
        createdAt: '2023-01-01T00:00:00Z',
        isEmailConfirmed: true,
      });
    });

    it('should return correct id', () => {
      expect(user.id).toBe(1);
    });

    it('should return correct username', () => {
      expect(user.username).toBeInstanceOf(Username);
      expect(user.username.value).toBe('testuser');
    });

    it('should return correct email', () => {
      expect(user.email).toBeInstanceOf(Email);
      expect(user.email.value).toBe('test@example.com');
    });

    it('should return correct firstName', () => {
      expect(user.firstName).toBeInstanceOf(FirstName);
      expect(user.firstName.value).toBe('John');
    });

    it('should return correct lastName', () => {
      expect(user.lastName).toBeInstanceOf(LastName);
      expect(user.lastName.value).toBe('Doe');
    });

    it('should return correct active status', () => {
      expect(user.active).toBe(true);
    });

    it('should return correct role', () => {
      expect(user.role).toBe(mockRole);
    });

    it('should return correct createdAt', () => {
      expect(user.createdAt).toBeDefined();
    });

    it('should return correct isEmailConfirmed', () => {
      expect(user.isEmailConfirmed).toBe(true);
    });

    it('should return correct status', () => {
      expect(user.status).toBeDefined();
    });

    it('should return correct userStatus', () => {
      expect(user.userStatus).toBeDefined();
    });

    it('should return correct notificationPreferences', () => {
      expect(user.notificationPreferences).toBeDefined();
    });

    it('should return correct updatedAt', () => {
      expect(user.updatedAt).toBeUndefined(); // Not set in this test
    });

    it('should return correct lastActivityAt', () => {
      expect(user.lastActivityAt).toBeUndefined(); // Not set in this test
    });
  });
});
