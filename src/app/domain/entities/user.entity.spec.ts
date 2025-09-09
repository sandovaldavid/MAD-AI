import { User } from './user.entity';
import { Role } from './role.entity';
import {
  Email,
  Username,
  FirstName,
  LastName,
  ISODateTime,
  UserStatusVO,
  UserNotificationPreferencesVO,
  AccessLevel,
} from '../value-objects';
import type { UserNotificationPreferences } from '../value-objects/user-notification-preferences.vo';
import { ValidationError } from '../errors/validation-error.entity';
import { ValidationErrorCode } from '../errors/validation-error-code.enum';
import { DomainEvent } from '../events/domain-event.entity';
import { DomainEventType } from '../events/domain-event.enum';

/**
 * User Entity - Domain Layer Tests
 *
 * Tests for User entity that contains business logic for user management.
 * These are pure unit tests without any external dependencies or mocks.
 *
 * Business Rul      const minimalUser = User.create({
        id: 23,
        username: 'minimal',
        email: 'minimal@microsoft.com',
        firstName: 'Min',
        lastName: 'Mal',
        isActive: false,
        role: userRole,
        status: 'inactive',
        isEmailConfirmed: false,
        profileCompleted: true,
        notificationPreferences: {
          email: false,
          system: false,
          task: false,
        },
      });ser creation with comprehensive validation
 * - Business rule validations (username, email domain, name policies)
 * - User activation/deactivation with domain events
 * - Profile modifications (email, username, role) with domain events
 * - Permission checks through specifications
 * - Domain event management
 * - Entity equality and string representation
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
describe('User Entity - Domain Tests', () => {
  let validUser: User;
  let deactivatedUser: User;
  let adminRole: Role;
  let userRole: Role;

  beforeEach(() => {
    // Create admin role with system creation flag
    adminRole = Role.create(
      {
        id: 1,
        name: 'LEAD DEVELOPER',
        accessLevel: 5,
        isActive: true,
      },
      true
    ); // System creation flag

    // Create user role
    userRole = Role.create({
      id: 2,
      name: 'CONTRIBUTOR',
      accessLevel: 1,
      isActive: true,
    });

    const notificationPreferences: UserNotificationPreferences = {
      email: true,
      system: false,
      task: true,
    };

    validUser = User.create({
      id: 1,
      username: 'john_doe',
      email: 'john.doe@microsoft.com',
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
      role: userRole,
      status: 'active',
      isEmailConfirmed: true,
      profileCompleted: true,
      notificationPreferences,
    });

    deactivatedUser = User.create({
      id: 2,
      username: 'jane_smith',
      email: 'jane.smith@microsoft.com',
      firstName: 'Jane',
      lastName: 'Smith',
      isActive: false,
      role: userRole,
      status: 'inactive',
      isEmailConfirmed: true,
      profileCompleted: true,
      notificationPreferences,
    });
  });

  describe('User Creation and Validation', () => {
    describe('Valid User Creation', () => {
      it('should create user with all valid properties', () => {
        const notificationPreferences: UserNotificationPreferences = {
          email: true,
          system: true,
          task: false,
        };

        const user = User.create({
          id: 3,
          username: 'test_user',
          email: 'test@microsoft.com',
          firstName: 'Test',
          lastName: 'User',
          isActive: true,
          role: userRole,
          status: 'active',
          isEmailConfirmed: true,
          profileCompleted: true,
          notificationPreferences,
        });

        expect(user).toBeInstanceOf(User);
        expect(user.id).toBe(3);
        expect(user.username.value).toBe('test_user');
        expect(user.email.value).toBe('test@microsoft.com');
        expect(user.firstName.value).toBe('Test');
        expect(user.lastName.value).toBe('User');
        expect(user.active).toBe(true);
        expect(user.getRole.name).toBe('Contributor');
      });

      it('should create user with optional properties', () => {
        const user = User.create({
          id: 4,
          username: 'minimal_user',
          email: 'minimal@microsoft.com',
          firstName: 'Minimal',
          lastName: 'User',
          isActive: true,
          role: userRole,
          status: 'active',
          isEmailConfirmed: true,
          profileCompleted: true,
          notificationPreferences: {
            email: true,
            system: false,
            task: false,
          },
        });

        expect(user.status).toBeDefined();
        expect(user.isEmailConfirmed).toBe(true);
        expect(user.createdAt).toBeUndefined();
      });

      it('should create user with timestamps', () => {
        const createdAt = '2024-01-01T10:00:00.000Z';
        const updatedAt = '2024-01-02T10:00:00.000Z';

        const user = User.create({
          id: 5,
          username: 'timestamp_user',
          email: 'timestamp@microsoft.com',
          firstName: 'Timestamp',
          lastName: 'User',
          isActive: true,
          role: userRole,
          createdAt,
          updatedAt,
          status: 'active',
          isEmailConfirmed: true,
          profileCompleted: true,
          notificationPreferences: {
            email: true,
            system: false,
            task: false,
          },
        });

        expect(user.createdAt?.value).toBe(createdAt);
        expect(user.updatedAt?.value).toBe(updatedAt);
      });
    });

    describe('Value Object Validation', () => {
      it('should reject invalid email format', () => {
        expect(() => {
          User.create({
            id: 6,
            username: 'invalid_email',
            email: 'invalid-email',
            firstName: 'Invalid',
            lastName: 'Email',
            isActive: true,
            role: userRole,
            isEmailConfirmed: true,
            profileCompleted: true,
            notificationPreferences: {
              email: true,
              system: false,
              task: false,
            },
          });
        }).toThrow();
      });

      it('should reject invalid username format', () => {
        expect(() => {
          User.create({
            id: 7,
            username: 'invalid username',
            email: 'valid@microsoft.com',
            firstName: 'Invalid',
            lastName: 'Username',
            isActive: true,
            role: userRole,
            isEmailConfirmed: true,
            profileCompleted: true,
            notificationPreferences: {
              email: true,
              system: false,
              task: false,
            },
          });
        }).toThrow();
      });

      it('should reject invalid firstName format', () => {
        expect(() => {
          User.create({
            id: 8,
            username: 'valid_user',
            email: 'valid@microsoft.com',
            firstName: '',
            lastName: 'Valid',
            isActive: true,
            role: userRole,
            isEmailConfirmed: true,
            profileCompleted: true,
            notificationPreferences: {
              email: true,
              system: false,
              task: false,
            },
          });
        }).toThrow();
      });

      it('should reject invalid lastName format', () => {
        expect(() => {
          User.create({
            id: 9,
            username: 'valid_user',
            email: 'valid@microsoft.com',
            firstName: 'Valid',
            lastName: '',
            isActive: true,
            role: userRole,
            isEmailConfirmed: true,
            profileCompleted: true,
            notificationPreferences: {
              email: true,
              system: false,
              task: false,
            },
          });
        }).toThrow();
      });

      it('should reject invalid timestamp format', () => {
        expect(() => {
          User.create({
            id: 10,
            username: 'timestamp_user',
            email: 'timestamp@microsoft.com',
            firstName: 'Timestamp',
            lastName: 'User',
            isActive: true,
            role: userRole,
            createdAt: 'invalid-date',
            isEmailConfirmed: true,
            profileCompleted: true,
            notificationPreferences: {
              email: true,
              system: false,
              task: false,
            },
          });
        }).toThrow();
      });
    });

    describe('Required Fields Validation', () => {
      it('should reject missing role', () => {
        expect(() => {
          User.create({
            id: 11,
            username: 'no_role_user',
            email: 'norole@microsoft.com',
            firstName: 'No',
            lastName: 'Role',
            isActive: true,
            role: null as any,
            isEmailConfirmed: true,
            profileCompleted: true,
            notificationPreferences: {
              email: true,
              system: false,
              task: false,
            },
          });
        }).toThrow();
      });

      it('should reject missing notificationPreferences', () => {
        expect(() => {
          User.create({
            id: 12,
            username: 'no_prefs_user',
            email: 'noprefs@microsoft.com',
            firstName: 'No',
            lastName: 'Prefs',
            isActive: true,
            role: userRole,
            isEmailConfirmed: true,
            profileCompleted: true,
            notificationPreferences: null as any,
          });
        }).toThrow();
      });
    });

    describe('Business Rules Validation', () => {
      it('should reject reserved username', () => {
        expect(() => {
          User.create({
            id: 13,
            username: 'admin', // Assuming 'admin' is reserved
            email: 'admin@microsoft.com',
            firstName: 'Admin',
            lastName: 'User',
            isActive: true,
            role: userRole,
            isEmailConfirmed: true,
            profileCompleted: true,
            notificationPreferences: {
              email: true,
              system: false,
              task: false,
            },
          });
        }).toThrow();
      });

      it('should reject username with weak security', () => {
        expect(() => {
          User.create({
            id: 14,
            username: '123', // Assuming this fails security validation
            email: 'weak@microsoft.com',
            firstName: 'Weak',
            lastName: 'Security',
            isActive: true,
            role: userRole,
            isEmailConfirmed: true,
            profileCompleted: true,
            notificationPreferences: {
              email: true,
              system: false,
              task: false,
            },
          });
        }).toThrow();
      });

      it('should reject firstName with suspicious phonetic pattern', () => {
        expect(() => {
          User.create({
            id: 15,
            username: 'suspicious_user',
            email: 'suspicious@microsoft.com',
            firstName: 'Admin', // Assuming this triggers phonetic validation
            lastName: 'User',
            isActive: true,
            role: userRole,
            isEmailConfirmed: true,
            profileCompleted: true,
            notificationPreferences: {
              email: true,
              system: false,
              task: false,
            },
          });
        }).toThrow();
      });

      it('should reject email from blocked domain', () => {
        expect(() => {
          User.create({
            id: 16,
            username: 'blocked_domain',
            email: 'user@temp-mail.org', // Assuming this domain is blocked
            firstName: 'Blocked',
            lastName: 'Domain',
            isActive: true,
            role: userRole,
            isEmailConfirmed: true,
            profileCompleted: true,
            notificationPreferences: {
              email: true,
              system: false,
              task: false,
            },
          });
        }).toThrow();
      });

      it('should reject user without complete profile', () => {
        expect(() => {
          User.create({
            id: 17,
            username: 'incomplete_profile',
            email: 'incomplete@microsoft.com',
            firstName: 'Incomplete',
            lastName: 'Profile',
            isActive: true,
            role: userRole,
            status: 'pending', // Assuming this makes profile incomplete
            isEmailConfirmed: true,
            profileCompleted: false,
            notificationPreferences: {
              email: true,
              system: false,
              task: false,
            },
          });
        }).toThrow();
      });

      it('should reject inactive user without confirmed email', () => {
        expect(() => {
          User.create({
            id: 18,
            username: 'inactive_unconfirmed',
            email: 'inactive@microsoft.com',
            firstName: 'Inactive',
            lastName: 'Unconfirmed',
            isActive: false,
            role: userRole,
            isEmailConfirmed: false,
            profileCompleted: true,
            notificationPreferences: {
              email: true,
              system: false,
              task: false,
            },
          });
        }).toThrow();
      });
    });
  });

  describe('Domain Events Management', () => {
    it('should start with empty domain events', () => {
      expect(validUser.getDomainEvents()).toEqual([]);
    });

    it('should add domain event when user is activated', () => {
      const inactiveUser = User.create({
        id: 19,
        username: 'inactive_user',
        email: 'inactive@microsoft.com',
        firstName: 'Inactive',
        lastName: 'User',
        isActive: false,
        role: userRole,
        status: 'inactive',
        isEmailConfirmed: true,
        profileCompleted: true,
        notificationPreferences: {
          email: true,
          system: false,
          task: false,
        },
      });

      inactiveUser.activate();

      const events = inactiveUser.getDomainEvents();
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe(DomainEventType.USER_ACCOUNT_ACTIVATED);
      expect(events[0].aggregateId).toBe('19');
    });

    it('should add domain event when user is deactivated', () => {
      validUser.deactivate();

      const events = validUser.getDomainEvents();
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe(DomainEventType.USER_ACCOUNT_DEACTIVATED);
      expect(events[0].aggregateId).toBe('1');
    });

    it('should add domain event when email is changed', () => {
      const newEmail = Email.create('newemail@microsoft.com');
      validUser.changeEmail(newEmail);

      const events = validUser.getDomainEvents();
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe(DomainEventType.USER_PROFILE_MODIFIED);
      expect(events[0].eventData['oldEmail']).toBe('john.doe@microsoft.com');
      expect(events[0].eventData['newEmail']).toBe('newemail@microsoft.com');
    });

    it('should add domain event when username is changed', () => {
      const newUsername = Username.create('new_username');
      validUser.changeUsername(newUsername);

      const events = validUser.getDomainEvents();
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe(DomainEventType.USER_PROFILE_MODIFIED);
      expect(events[0].eventData['oldUsername']).toBe('john_doe');
      expect(events[0].eventData['newUsername']).toBe('new_username');
    });

    it('should add domain event when role is changed', () => {
      validUser.changeRole(adminRole);

      const events = validUser.getDomainEvents();
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe(DomainEventType.USER_ROLE_CHANGED);
      expect(events[0].eventData['oldRoleName']).toBe('Contributor');
      expect(events[0].eventData['newRoleName']).toBe('Lead Developer');
    });

    it('should add domain event when notification preferences are updated', () => {
      const newPreferences: UserNotificationPreferences = {
        email: false,
        system: true,
        task: false,
      };

      validUser.updateNotificationPreferences(newPreferences);

      const events = validUser.getDomainEvents();
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe(DomainEventType.USER_PREFERENCES_UPDATED);
    });

    it('should clear domain events after publishing', () => {
      validUser.deactivate();
      expect(validUser.getDomainEvents().length).toBe(1);

      validUser.clearDomainEvents();
      expect(validUser.getDomainEvents()).toEqual([]);
    });

    it('should not add duplicate events for same operation', () => {
      const inactiveUser = User.create({
        id: 20,
        username: 'duplicate_test',
        email: 'duplicate@microsoft.com',
        firstName: 'Duplicate',
        lastName: 'Test',
        isActive: false,
        role: userRole,
        status: 'inactive',
        isEmailConfirmed: true,
        profileCompleted: true,
        notificationPreferences: {
          email: true,
          system: false,
          task: false,
        },
      });

      inactiveUser.activate();
      inactiveUser.activate(); // Should not add another event

      expect(inactiveUser.getDomainEvents().length).toBe(1);
    });
  });

  describe('User State Transitions', () => {
    describe('Activation/Deactivation', () => {
      it('should activate inactive user', () => {
        expect(deactivatedUser.active).toBe(false);

        deactivatedUser.activate();

        expect(deactivatedUser.active).toBe(true);
        expect(deactivatedUser.getDomainEvents().length).toBe(1);
      });

      it('should not activate already active user', () => {
        expect(validUser.active).toBe(true);

        validUser.activate();

        expect(validUser.active).toBe(true);
        expect(validUser.getDomainEvents()).toEqual([]);
      });

      it('should deactivate active user', () => {
        expect(validUser.active).toBe(true);

        validUser.deactivate();

        expect(validUser.active).toBe(false);
        expect(validUser.getDomainEvents().length).toBe(1);
      });

      it('should not deactivate already inactive user', () => {
        expect(deactivatedUser.active).toBe(false);

        deactivatedUser.deactivate();

        expect(deactivatedUser.active).toBe(false);
        expect(deactivatedUser.getDomainEvents()).toEqual([]);
      });
    });

    describe('Profile Modifications', () => {
      it('should change email successfully', () => {
        const newEmail = Email.create('changed@microsoft.com');

        validUser.changeEmail(newEmail);

        expect(validUser.email.value).toBe('changed@microsoft.com');
        expect(validUser.getDomainEvents().length).toBe(1);
      });

      it('should reject null email change', () => {
        expect(() => {
          validUser.changeEmail(null as any);
        }).toThrow();
      });

      it('should change username successfully', () => {
        const newUsername = Username.create('changed_username');

        validUser.changeUsername(newUsername);

        expect(validUser.username.value).toBe('changed_username');
        expect(validUser.getDomainEvents().length).toBe(1);
      });

      it('should reject null username change', () => {
        expect(() => {
          validUser.changeUsername(null as any);
        }).toThrow();
      });

      it('should change role successfully', () => {
        validUser.changeRole(adminRole);

        expect(validUser.getRole.name).toBe('Lead Developer');
        expect(validUser.getDomainEvents().length).toBe(1);
      });

      it('should reject null role change', () => {
        expect(() => {
          validUser.changeRole(null as any);
        }).toThrow();
      });

      it('should update name successfully', () => {
        const newFirstName = FirstName.create('Updated');
        const newLastName = LastName.create('Name');

        validUser.updateName(newFirstName, newLastName);

        expect(validUser.firstName.value).toBe('Updated');
        expect(validUser.lastName.value).toBe('Name');
      });

      it('should reject null firstName in updateName', () => {
        expect(() => {
          validUser.updateName(null as any, LastName.create('Test'));
        }).toThrow();
      });

      it('should reject null lastName in updateName', () => {
        expect(() => {
          validUser.updateName(FirstName.create('Test'), null as any);
        }).toThrow();
      });

      it('should update notification preferences successfully', () => {
        const newPreferences: UserNotificationPreferences = {
          email: false,
          system: true,
          task: true,
        };

        validUser.updateNotificationPreferences(newPreferences);

        expect(validUser.notificationPreferences?.email).toBe(false);
        expect(validUser.notificationPreferences?.system).toBe(true);
        expect(validUser.getDomainEvents().length).toBe(1);
      });
    });
  });

  describe('Permission Checks', () => {
    it('should check delete users permission for admin role', () => {
      const adminUser = User.create({
        id: 21,
        username: 'admin_user',
        email: 'admin@microsoft.com',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        role: adminRole,
        status: 'active',
        isEmailConfirmed: true,
        profileCompleted: true,
        notificationPreferences: {
          email: true,
          system: false,
          task: false,
        },
      });

      expect(adminUser.canDeleteUsers()).toBe(false);
    });

    it('should check delete users permission for regular user role', () => {
      expect(validUser.canDeleteUsers()).toBe(true);
    });

    it('should check project leadership permission', () => {
      expect(validUser.canLeadProjects()).toBe(true); // CONTRIBUTOR role can lead projects
    });

    it('should check project leadership permission for admin', () => {
      const adminUser = User.create({
        id: 22,
        username: 'admin_leader',
        email: 'adminleader@microsoft.com',
        firstName: 'Admin',
        lastName: 'Leader',
        isActive: true,
        role: adminRole,
        status: 'active',
        isEmailConfirmed: true,
        profileCompleted: true,
        notificationPreferences: {
          email: true,
          system: false,
          task: false,
        },
      });

      expect(adminUser.canLeadProjects()).toBe(false);
    });
  });

  describe('Status and Verification Checks', () => {
    it('should return correct email verification status', () => {
      expect(validUser.hasVerifiedEmail()).toBe(true);
      expect(deactivatedUser.hasVerifiedEmail()).toBe(true);
    });

    it('should return correct user status', () => {
      expect(validUser.getUserStatus.value).toBe('active');
      expect(deactivatedUser.getUserStatus.value).toBe('inactive');
    });
  });

  describe('Entity Operations', () => {
    describe('Equality', () => {
      it('should return true for same user instance', () => {
        expect(validUser.equals(validUser)).toBe(true);
      });

      it('should return true for user with same id', () => {
        const sameIdUser = User.create({
          id: 1, // Same ID as validUser
          username: 'different_user',
          email: 'different@microsoft.com',
          firstName: 'Different',
          lastName: 'User',
          isActive: true,
          role: userRole,
          status: 'active',
          isEmailConfirmed: true,
          notificationPreferences: {
            email: true,
            system: false,
            task: false,
          },
        });

        expect(validUser.equals(sameIdUser)).toBe(true);
      });

      it('should return false for different user', () => {
        expect(validUser.equals(deactivatedUser)).toBe(false);
      });

      it('should return false for null or undefined', () => {
        expect(validUser.equals(null)).toBe(false);
        expect(validUser.equals(undefined)).toBe(false);
      });
    });

    describe('String Representation', () => {
      it('should return correct string representation', () => {
        const expectedString =
          'User(1, john_doe, john.doe@microsoft.com, John Doe, Active: true, Role: Contributor)';
        expect(validUser.toString()).toBe(expectedString);
      });

      it('should return correct string for inactive user', () => {
        const expectedString =
          'User(2, jane_smith, jane.smith@microsoft.com, Jane Smith, Active: false, Role: Contributor)';
        expect(deactivatedUser.toString()).toBe(expectedString);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle user with minimum required data', () => {
      const minimalUser = User.create({
        id: 23,
        username: 'minimal',
        email: 'minimal@microsoft.com',
        firstName: 'Min',
        lastName: 'Mal',
        isActive: false,
        role: userRole,
        status: 'inactive',
        isEmailConfirmed: true,
        profileCompleted: true,
        notificationPreferences: {
          email: false,
          system: false,
          task: false,
        },
      });

      expect(minimalUser).toBeInstanceOf(User);
      expect(minimalUser.active).toBe(false);
      expect(minimalUser.hasVerifiedEmail()).toBe(true);
    });

    it('should handle user with maximum optional data', () => {
      const fullUser = User.create({
        id: 24,
        username: 'full_user',
        email: 'full@microsoft.com',
        firstName: 'Full',
        lastName: 'User',
        isActive: true,
        role: adminRole,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
        lastActivityAt: '2024-01-03T00:00:00.000Z',
        status: 'active',
        isEmailConfirmed: true,
        profileCompleted: true,
        notificationPreferences: {
          email: true,
          system: true,
          task: true,
        },
      });

      expect(fullUser).toBeInstanceOf(User);
      expect(fullUser.createdAt).toBeDefined();
      expect(fullUser.updatedAt).toBeDefined();
      expect(fullUser.lastActivityAt).toBeDefined();
      expect(fullUser.getUserStatus.value).toBe('active');
      expect(fullUser.hasVerifiedEmail()).toBe(true);
    });

    it('should handle multiple domain events', () => {
      const testUser = User.create({
        id: 25,
        username: 'multi_event',
        email: 'multievent@microsoft.com',
        firstName: 'Multi',
        lastName: 'Event',
        isActive: false,
        role: userRole,
        status: 'inactive',
        isEmailConfirmed: true,
        profileCompleted: true,
        notificationPreferences: {
          email: true,
          system: false,
          task: false,
        },
      });

      testUser.activate();
      testUser.changeEmail(Email.create('changed@microsoft.com'));
      testUser.changeRole(adminRole);

      const events = testUser.getDomainEvents();
      expect(events.length).toBe(3);
      expect(events[0].eventType).toBe(DomainEventType.USER_ACCOUNT_ACTIVATED);
      expect(events[1].eventType).toBe(DomainEventType.USER_PROFILE_MODIFIED);
      expect(events[2].eventType).toBe(DomainEventType.USER_ROLE_CHANGED);
    });

    it('should maintain immutability of value objects', () => {
      const originalEmail = validUser.email.value;
      const newEmail = Email.create('modified@microsoft.com');

      validUser.changeEmail(newEmail);

      expect(validUser.email.value).toBe('modified@microsoft.com');
      expect(originalEmail).toBe('john.doe@microsoft.com'); // Original unchanged
    });
  });
});
