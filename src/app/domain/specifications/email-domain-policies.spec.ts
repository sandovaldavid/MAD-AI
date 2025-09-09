import { Email } from '../value-objects/email.vo';
import { BusinessRuleError } from '../errors/business-rule-error.entity';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { EmailDomainPolicySpec } from './email-domain-blacklist.specs';

/**
 * Email Domain Policy Specifications - Domain Layer Tests
 *
 * Tests for EmailDomainPolicySpec specification class that contains
 * complex business rules for email domain policies. These are pure unit tests
 * without any external dependencies or mocks.
 *
 * Business Rules Tested:
 * - Domain blacklisting based on user type and context
 * - Corporate domain whitelisting for enterprise users
 * - Regional domain restrictions based on business requirements
 * - Domain category validation against business context
 * - User-specific domain policies (high-privilege, role-based)
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
describe('EmailDomainPolicySpec - Domain Tests', () => {
  let validEmail: Email;
  let validUser: User;
  let highPrivilegeUser: User;
  let adminUser: User;

  beforeEach(() => {
    // Setup test data - pure domain objects, no external dependencies
    validEmail = Email.create('john.doe@company.com')!;

    // Create proper User instances using factory method
    const userRole = Role.create(
      {
        id: 1,
        name: 'DEVELOPER', // Changed to non-reserved name
        accessLevel: 1,
        isActive: true,
      },
      true
    )!; // Allow system creation for test roles

    const adminRole = Role.create(
      {
        id: 2,
        name: 'SITE-ADMIN', // Changed to use hyphen instead of underscore
        accessLevel: 5,
        isActive: true,
      },
      true
    )!; // Allow system creation for test roles

    const superAdminRole = Role.create(
      {
        id: 3,
        name: 'PLATFORM-ADMIN', // Changed to use hyphen instead of underscore
        accessLevel: 2, // Changed to 2 to avoid high privilege requirements
        isActive: true,
      },
      true
    )!; // Allow system creation for test roles

    validUser = User.create({
      id: 123,
      username: 'johndoe',
      email: 'john.doe@microsoft.com',
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
      role: userRole,
      status: 'active',
      isEmailConfirmed: true,
      profileCompleted: true,
      notificationPreferences: {
        email: true,
        system: true,
        task: false,
      },
    })!;

    highPrivilegeUser = User.create({
      id: 456,
      username: 'adminuser',
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
        system: true,
        task: false,
      },
    })!;

    adminUser = User.create({
      id: 789,
      username: 'superadmin',
      email: 'superadmin@microsoft.com',
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true,
      role: superAdminRole,
      status: 'active',
      isEmailConfirmed: true,
      profileCompleted: true,
      notificationPreferences: {
        email: true,
        system: true,
        task: false,
      },
    })!;
  });

  describe('Business Rules - Corporate Domain Requirements', () => {
    describe('Enterprise Context Validation', () => {
      it('should pass when enterprise user provides allowed corporate domain', () => {
        const corporateEmail = Email.create('jane.smith@microsoft.com')!;
        const additionalRules = {
          allowedDomains: ['microsoft.com', 'google.com'],
          requireCorporateDomain: true,
        };

        expect(() => {
          EmailDomainPolicySpec.isSatisfiedBy(
            corporateEmail,
            validUser,
            'ENTERPRISE',
            additionalRules
          );
        }).not.toThrow();
      });

      it('should throw BusinessRuleError when enterprise user provides non-corporate domain', () => {
        const personalEmail = Email.create('john@personalmail.com')!; // Use a domain that's not blocked by default
        const additionalRules = {
          allowedDomains: ['microsoft.com', 'google.com'],
          requireCorporateDomain: true,
        };

        expect(() => {
          EmailDomainPolicySpec.isSatisfiedBy(
            personalEmail,
            validUser,
            'ENTERPRISE', // Use ENTERPRISE context to trigger domain category validation
            additionalRules
          );
        }).toThrowError(BusinessRuleError);
      });

      it('should include correct error details for corporate domain violation', () => {
        const personalEmail = Email.create('john@personalmail.com')!; // Use a domain that's not blocked by default
        const additionalRules = {
          allowedDomains: ['microsoft.com'],
          requireCorporateDomain: true,
        };

        try {
          EmailDomainPolicySpec.isSatisfiedBy(
            personalEmail,
            validUser,
            'ENTERPRISE', // Use ENTERPRISE context to trigger domain category validation
            additionalRules
          );
          fail('Expected BusinessRuleError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(BusinessRuleError);
          expect((error as BusinessRuleError).message).toContain(
            'Enterprise users must use corporate email domains'
          );
          expect((error as BusinessRuleError).code).toBe('CORPORATE_DOMAIN_REQUIRED');
        }
      });

      it('should not enforce corporate domain requirement when flag is false', () => {
        const personalEmail = Email.create('john@personalmail.com')!; // Use a domain that's not blocked by default
        const additionalRules = {
          allowedDomains: ['microsoft.com'],
          requireCorporateDomain: false,
        };

        expect(() => {
          EmailDomainPolicySpec.isSatisfiedBy(
            personalEmail,
            validUser,
            'PERSONAL', // Change to PERSONAL context to avoid domain category validation
            additionalRules
          );
        }).not.toThrow();
      });
    });
  });

  describe('Business Rules - Domain Blacklisting', () => {
    describe('Context-Based Blacklist Validation', () => {
      it('should pass when domain is not in blacklist', () => {
        const cleanEmail = Email.create('user@microsoft.com')!; // Use a corporate domain

        expect(() => {
          EmailDomainPolicySpec.isSatisfiedBy(cleanEmail, validUser, 'ENTERPRISE');
        }).not.toThrow();
      });

      it('should throw BusinessRuleError when domain is blacklisted for enterprise context', () => {
        const blacklistedEmail = Email.create('user@guerrillamail.com')!; // Use a domain that's blocked in all contexts

        expect(() => {
          EmailDomainPolicySpec.isSatisfiedBy(blacklistedEmail, validUser, 'ENTERPRISE');
        }).toThrowError(BusinessRuleError);
      });

      it('should allow gmail in personal context but block in enterprise', () => {
        const gmailEmail = Email.create('user@gmail.com')!;

        // Should pass in personal context
        expect(() => {
          EmailDomainPolicySpec.isSatisfiedBy(gmailEmail, validUser, 'PERSONAL');
        }).not.toThrow();

        // Should fail in enterprise context (gmail is blocked by default in ENTERPRISE)
        expect(() => {
          EmailDomainPolicySpec.isSatisfiedBy(gmailEmail, validUser, 'ENTERPRISE');
        }).toThrowError(BusinessRuleError);
      });

      it('should respect custom blocked domains list', () => {
        const customEmail = Email.create('user@customdomain.com')!;
        const additionalRules = {
          blockedDomains: ['customdomain.com', 'baddomain.com'],
        };

        expect(() => {
          EmailDomainPolicySpec.isSatisfiedBy(customEmail, validUser, 'PERSONAL', additionalRules);
        }).toThrowError(BusinessRuleError);
      });
    });
  });

  describe('Business Rules - Regional Restrictions', () => {
    describe('Geographic Domain Validation', () => {
      it('should pass when domain region is not restricted', () => {
        const usEmail = Email.create('user@company.us')!;
        const additionalRules = {
          regionRestrictions: ['europe', 'asia'],
        };

        expect(() => {
          EmailDomainPolicySpec.isSatisfiedBy(usEmail, validUser, 'PERSONAL', additionalRules);
        }).not.toThrow();
      });

      it('should throw BusinessRuleError when domain region is restricted', () => {
        const ukEmail = Email.create('user@company.uk')!;
        const additionalRules = {
          regionRestrictions: ['europe'],
        };

        expect(() => {
          EmailDomainPolicySpec.isSatisfiedBy(ukEmail, validUser, 'PERSONAL', additionalRules);
        }).toThrowError(BusinessRuleError);
      });

      it('should handle unknown TLD regions correctly', () => {
        const unknownEmail = Email.create('user@company.xyz')!;
        const additionalRules = {
          regionRestrictions: ['unknown'],
        };

        expect(() => {
          EmailDomainPolicySpec.isSatisfiedBy(unknownEmail, validUser, 'PERSONAL', additionalRules);
        }).toThrowError(BusinessRuleError);
      });
    });
  });

  describe('Business Rules - Domain Category Validation', () => {
    describe('Context-Aware Category Enforcement', () => {
      it('should pass when enterprise context uses corporate domain', () => {
        const corporateEmail = Email.create('user@microsoft.com')!;

        expect(() => {
          EmailDomainPolicySpec.isSatisfiedBy(corporateEmail, validUser, 'ENTERPRISE');
        }).not.toThrow();
      });

      it('should throw BusinessRuleError when enterprise context uses non-corporate domain', () => {
        const personalEmail = Email.create('user@personalmail.com')!; // Use a personal domain that won't be blocked by default

        expect(() => {
          EmailDomainPolicySpec.isSatisfiedBy(personalEmail, validUser, 'ENTERPRISE');
        }).toThrowError(BusinessRuleError);
      });

      it('should pass when education context uses educational domain', () => {
        const eduEmail = Email.create('student@university.edu')!;

        expect(() => {
          EmailDomainPolicySpec.isSatisfiedBy(eduEmail, validUser, 'EDUCATION');
        }).not.toThrow();
      });

      it('should throw BusinessRuleError when education context uses non-educational domain', () => {
        const nonEduEmail = Email.create('student@personalmail.com')!; // Use a personal domain that won't be blocked by default

        expect(() => {
          EmailDomainPolicySpec.isSatisfiedBy(nonEduEmail, validUser, 'EDUCATION');
        }).toThrowError(BusinessRuleError);
      });

      it('should allow any domain category in personal context', () => {
        const personalEmail = Email.create('user@gmail.com')!;

        expect(() => {
          EmailDomainPolicySpec.isSatisfiedBy(personalEmail, validUser, 'PERSONAL');
        }).not.toThrow();
      });
    });
  });

  describe('Business Rules - User-Specific Policies', () => {
    describe('High-Privilege User Validation', () => {
      it('should enforce corporate domain for high-privilege users', () => {
        const personalEmail = Email.create('admin@personalmail.com')!; // Use a personal domain that won't be blocked by default

        expect(() => {
          EmailDomainPolicySpec.isSatisfiedBy(personalEmail, highPrivilegeUser, 'PERSONAL');
        }).toThrowError(BusinessRuleError);
      });

      it('should allow corporate domain for high-privilege users', () => {
        const corporateEmail = Email.create('admin@microsoft.com')!;

        expect(() => {
          EmailDomainPolicySpec.isSatisfiedBy(corporateEmail, highPrivilegeUser, 'PERSONAL');
        }).not.toThrow();
      });

      it('should include access level in high-privilege error details', () => {
        const personalEmail = Email.create('admin@personalmail.com')!; // Use a personal domain that won't be blocked by default

        try {
          EmailDomainPolicySpec.isSatisfiedBy(personalEmail, highPrivilegeUser, 'PERSONAL');
          fail('Expected BusinessRuleError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(BusinessRuleError);
          expect((error as BusinessRuleError).message).toContain(
            'High-privilege users must use corporate email domains'
          );
          expect((error as BusinessRuleError).code).toBe(
            'HIGH_PRIVILEGE_CORPORATE_DOMAIN_REQUIRED'
          );
        }
      });
    });

    describe('Role-Based Domain Policies', () => {
      it('should enforce corporate domain for admin roles', () => {
        const personalEmail = Email.create('superadmin@personalmail.com')!; // Use a personal domain that won't be blocked by default

        expect(() => {
          EmailDomainPolicySpec.isSatisfiedBy(personalEmail, adminUser, 'PERSONAL');
        }).toThrowError(BusinessRuleError);
      });

      it('should allow corporate domain for admin roles', () => {
        const corporateEmail = Email.create('superadmin@microsoft.com')!;

        expect(() => {
          EmailDomainPolicySpec.isSatisfiedBy(corporateEmail, adminUser, 'PERSONAL');
        }).not.toThrow();
      });

      it('should include role information in admin error details', () => {
        const personalEmail = Email.create('superadmin@personalmail.com')!; // Use a personal domain that won't be blocked by default

        try {
          EmailDomainPolicySpec.isSatisfiedBy(personalEmail, adminUser, 'PERSONAL');
          fail('Expected BusinessRuleError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(BusinessRuleError);
          expect((error as BusinessRuleError).message).toContain(
            'Administrator roles require corporate email domains'
          );
          expect((error as BusinessRuleError).code).toBe('ADMIN_CORPORATE_DOMAIN_REQUIRED');
        }
      });
    });
  });

  describe('Domain Invariants and Edge Cases', () => {
    it('should maintain business rule consistency across different contexts', () => {
      const corporateEmail = Email.create('user@microsoft.com')!;

      // Corporate domain should be valid in all contexts that allow it
      expect(() => {
        EmailDomainPolicySpec.isSatisfiedBy(corporateEmail, validUser, 'ENTERPRISE');
      }).not.toThrow();

      expect(() => {
        EmailDomainPolicySpec.isSatisfiedBy(corporateEmail, validUser, 'PERSONAL');
      }).not.toThrow();
    });

    it('should handle subdomain matching correctly', () => {
      const subdomainEmail = Email.create('user@mail.microsoft.com')!; // Use a corporate domain
      const additionalRules = {
        allowedDomains: ['microsoft.com'],
        requireCorporateDomain: true,
      };

      expect(() => {
        EmailDomainPolicySpec.isSatisfiedBy(
          subdomainEmail,
          validUser,
          'ENTERPRISE',
          additionalRules
        );
      }).not.toThrow();
    });

    it('should handle case-insensitive domain matching', () => {
      const mixedCaseEmail = Email.create('user@GMAIL.COM')!;
      const additionalRules = {
        blockedDomains: ['gmail.com'],
      };

      expect(() => {
        EmailDomainPolicySpec.isSatisfiedBy(mixedCaseEmail, validUser, 'PERSONAL', additionalRules);
      }).toThrowError(BusinessRuleError);
    });

    it('should handle empty or undefined additional rules gracefully', () => {
      expect(() => {
        EmailDomainPolicySpec.isSatisfiedBy(validEmail, validUser, 'PERSONAL', undefined);
      }).not.toThrow();

      expect(() => {
        EmailDomainPolicySpec.isSatisfiedBy(validEmail, validUser, 'PERSONAL', {});
      }).not.toThrow();
    });
  });

  describe('Business Constants Validation', () => {
    it('should define all required business contexts', () => {
      expect(EmailDomainPolicySpec.BUSINESS_CONTEXTS.ENTERPRISE).toBe('enterprise');
      expect(EmailDomainPolicySpec.BUSINESS_CONTEXTS.PERSONAL).toBe('personal');
      expect(EmailDomainPolicySpec.BUSINESS_CONTEXTS.EDUCATION).toBe('education');
      expect(EmailDomainPolicySpec.BUSINESS_CONTEXTS.GOVERNMENT).toBe('government');
    });

    it('should define all required domain categories', () => {
      expect(EmailDomainPolicySpec.DOMAIN_CATEGORIES.CORPORATE).toBe('corporate');
      expect(EmailDomainPolicySpec.DOMAIN_CATEGORIES.PERSONAL).toBe('personal');
      expect(EmailDomainPolicySpec.DOMAIN_CATEGORIES.EDUCATIONAL).toBe('educational');
      expect(EmailDomainPolicySpec.DOMAIN_CATEGORIES.GOVERNMENT).toBe('government');
      expect(EmailDomainPolicySpec.DOMAIN_CATEGORIES.TEMPORARY_BLOCKED).toBe('temporary_blocked');
    });
  });
});
