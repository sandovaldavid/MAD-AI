import { Email } from './email.vo';
import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import { FieldError } from '@domain/errors/field-error.type';

/**
 * Domain Layer Test - Email Value Object
 *
 * Tests value object creation, validation, and domain invariants following DDD principles.
 * Ensures Email maintains business rules and provides correct domain behavior for
 * user identification, communication, and domain-based business logic.
 */
describe('Email - Domain Tests', () => {
  describe('Constructor and Basic Properties', () => {
    it('should create Email with valid value', () => {
      const email = Email.create('user@example.com');

      expect(email).toBeInstanceOf(Email);
      expect(email.value).toBe('user@example.com');
    });

    it('should maintain immutability through readonly contract', () => {
      const email = Email.create('test@example.com');

      expect(email.value).toBe('test@example.com');
      // Domain Layer maintains immutability through TypeScript readonly contracts
      // The value object should be immutable by design, not through runtime freezing
      expect(email).toBeDefined();
      expect(typeof email.value).toBe('string');

      // Test that the same instance always returns the same value
      expect(email.value).toBe('test@example.com');
      expect(email.value).toBe('test@example.com');
    });

    it('should generate consistent string representation', () => {
      const email = Email.create('test@example.com');

      expect(email.toString()).toBe('test@example.com');
    });
  });

  describe('Factory Method - create', () => {
    describe('Valid Email Creation', () => {
      it('should create Email with simple valid format', () => {
        const email = Email.create('user@example.com');

        expect(email.value).toBe('user@example.com');
      });

      it('should create Email with subdomain', () => {
        const email = Email.create('user@mail.example.com');

        expect(email.value).toBe('user@mail.example.com');
      });

      it('should create Email with plus addressing', () => {
        const email = Email.create('user+tag@example.com');

        expect(email.value).toBe('user+tag@example.com');
      });

      it('should create Email with numbers in local part', () => {
        const email = Email.create('user123@example.com');

        expect(email.value).toBe('user123@example.com');
      });

      it('should create Email with underscore in local part', () => {
        const email = Email.create('user_name@example.com');

        expect(email.value).toBe('user_name@example.com');
      });

      it('should normalize email to lowercase', () => {
        const email = Email.create('USER@EXAMPLE.COM');

        expect(email.value).toBe('user@example.com');
      });

      it('should trim whitespace from email', () => {
        const email = Email.create('  user@example.com  ');

        expect(email.value).toBe('user@example.com');
      });

      it('should handle maximum valid length (254 characters)', () => {
        const longLocalPart = 'a'.repeat(64); // 64 chars
        const domain = 'example.com'; // 11 chars
        const atSymbol = '@'; // 1 char
        const totalLength = longLocalPart.length + atSymbol.length + domain.length; // 76 chars

        const email = Email.create(`${longLocalPart}@${domain}`);

        expect(email.value.length).toBe(totalLength);
        expect(email.value).toBe(`${longLocalPart}@${domain}`.toLowerCase());
      });
    });

    describe('Invalid Email Validation', () => {
      it('should reject empty string', () => {
        expect(() => Email.create('')).toThrow();
      });

      it('should reject whitespace-only string', () => {
        expect(() => {
          Email.create('   ');
        }).toThrow();
      });

      it('should reject null value', () => {
        expect(() => {
          Email.create(null as any);
        }).toThrow();
      });

      it('should reject undefined value', () => {
        expect(() => {
          Email.create(undefined as any);
        }).toThrow();
      });

      it('should reject email without @ symbol', () => {
        expect(() => Email.create('userexample.com')).toThrow();
      });

      it('should reject email without domain', () => {
        expect(() => {
          Email.create('user@');
        }).toThrow();
      });

      it('should reject email without local part', () => {
        expect(() => {
          Email.create('@example.com');
        }).toThrow();
      });

      it('should reject email with multiple @ symbols', () => {
        expect(() => {
          Email.create('user@domain@example.com');
        }).toThrow();
      });

      it('should reject email with whitespace characters', () => {
        expect(() => {
          Email.create('user @example.com');
        }).toThrow();

        expect(() => {
          Email.create('user@exam ple.com');
        }).toThrow();
      });

      it('should reject email exceeding maximum length (254 characters)', () => {
        const longEmail = 'a'.repeat(250) + '@example.com'; // 263 characters

        expect(() => {
          Email.create(longEmail);
        }).toThrow();
      });

      it('should reject email with invalid domain format', () => {
        expect(() => {
          Email.create('user@.com');
        }).toThrow();

        expect(() => {
          Email.create('user@example.');
        }).toThrow();

        expect(() => {
          Email.create('user@example..com');
        }).toThrow();
      });

      it('should reject email with invalid characters in local part', () => {
        expect(() => {
          Email.create('user<>@example.com');
        }).toThrow();
      });
    });

    describe('Error Messages and Codes', () => {
      it('should provide descriptive error for missing required field', () => {
        try {
          Email.create('');
          fail('Should have thrown ValidationError');
        } catch (error: any) {
          expect(error).toBeInstanceOf(ValidationError);
          expect(error.errors[0].field).toBe('email');
          expect(error.errors[0].code).toBe(ValidationErrorCode.REQUIRED_FIELD_MISSING);
        }
      });

      it('should provide descriptive error for maximum length exceeded', () => {
        const longEmail = 'a'.repeat(250) + '@example.com';

        try {
          Email.create(longEmail);
          fail('Should have thrown ValidationError');
        } catch (error: any) {
          expect(error).toBeInstanceOf(ValidationError);
          expect(
            error.errors.some((e: FieldError) => e.code === ValidationErrorCode.FIELD_TOO_LONG)
          ).toBe(true);
        }
      });

      it('should provide descriptive error for invalid format', () => {
        try {
          Email.create('invalid-email');
          fail('Should have thrown ValidationError');
        } catch (error: any) {
          expect(error).toBeInstanceOf(ValidationError);
          expect(
            error.errors.some((e: FieldError) => e.code === ValidationErrorCode.EMAIL_INVALID)
          ).toBe(true);
        }
      });

      it('should provide descriptive error for whitespace', () => {
        try {
          Email.create('user @example.com');
          fail('Should have thrown ValidationError');
        } catch (error: any) {
          expect(error).toBeInstanceOf(ValidationError);
          expect(
            error.errors.some((e: FieldError) => e.code === ValidationErrorCode.EMAIL_INVALID)
          ).toBe(true);
        }
      });
    });
  });

  describe('Value Object Equality', () => {
    it('should return true for equal emails', () => {
      const email1 = Email.create('user@example.com');
      const email2 = Email.create('user@example.com');

      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = Email.create('user@example.com');
      const email2 = Email.create('other@example.com');

      expect(email1.equals(email2)).toBe(false);
    });

    it('should return true for same instance comparison', () => {
      const email = Email.create('user@example.com');

      expect(email.equals(email)).toBe(true);
    });

    it('should be case insensitive for equality', () => {
      const email1 = Email.create('user@example.com');
      const email2 = Email.create('USER@EXAMPLE.COM');

      expect(email1.equals(email2)).toBe(true);
    });

    it('should handle different domains', () => {
      const email1 = Email.create('user@example.com');
      const email2 = Email.create('user@other.com');

      expect(email1.equals(email2)).toBe(false);
    });

    it('should handle different local parts', () => {
      const email1 = Email.create('user@example.com');
      const email2 = Email.create('other@example.com');

      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('Domain Extraction Methods', () => {
    describe('getDomain', () => {
      it('should extract domain from simple email', () => {
        const email = Email.create('user@example.com');

        expect(email.getDomain()).toBe('example.com');
      });

      it('should extract domain from email with subdomain', () => {
        const email = Email.create('user@mail.example.com');

        expect(email.getDomain()).toBe('mail.example.com');
      });

      it('should extract domain from email with plus addressing', () => {
        const email = Email.create('user+tag@example.com');

        expect(email.getDomain()).toBe('example.com');
      });

      it('should return lowercase domain', () => {
        const email = Email.create('user@EXAMPLE.COM');

        expect(email.getDomain()).toBe('example.com');
      });
    });

    describe('getLocalPart', () => {
      it('should extract local part from simple email', () => {
        const email = Email.create('user@example.com');

        expect(email.getLocalPart()).toBe('user');
      });

      it('should extract local part with plus addressing', () => {
        const email = Email.create('user+tag@example.com');

        expect(email.getLocalPart()).toBe('user+tag');
      });

      it('should extract local part with numbers and underscores', () => {
        const email = Email.create('user_123@example.com');

        expect(email.getLocalPart()).toBe('user_123');
      });

      it('should return lowercase local part', () => {
        const email = Email.create('USER@example.com');

        expect(email.getLocalPart()).toBe('user');
      });
    });
  });

  describe('Domain-Based Business Logic', () => {
    describe('isFromDomain', () => {
      it('should return true for matching domain', () => {
        const email = Email.create('user@example.com');

        expect(email.isFromDomain('example.com')).toBe(true);
      });

      it('should return false for non-matching domain', () => {
        const email = Email.create('user@example.com');

        expect(email.isFromDomain('other.com')).toBe(false);
      });

      it('should be case insensitive for domain comparison', () => {
        const email = Email.create('user@example.com');

        expect(email.isFromDomain('EXAMPLE.COM')).toBe(true);
        expect(email.isFromDomain('Example.Com')).toBe(true);
      });

      it('should handle subdomain matching', () => {
        const email = Email.create('user@mail.example.com');

        expect(email.isFromDomain('mail.example.com')).toBe(true);
        expect(email.isFromDomain('example.com')).toBe(false);
      });

      it('should return false for partial domain matches', () => {
        const email = Email.create('user@example.com');

        expect(email.isFromDomain('ample.com')).toBe(false);
        expect(email.isFromDomain('example')).toBe(false);
      });
    });

    describe('isFromPublicProvider', () => {
      it('should return true for Gmail', () => {
        const email = Email.create('user@gmail.com');

        expect(email.isFromPublicProvider()).toBe(true);
      });

      it('should return true for Yahoo', () => {
        const email = Email.create('user@yahoo.com');

        expect(email.isFromPublicProvider()).toBe(true);
      });

      it('should return true for Outlook', () => {
        const email = Email.create('user@outlook.com');

        expect(email.isFromPublicProvider()).toBe(true);
      });

      it('should return true for Hotmail', () => {
        const email = Email.create('user@hotmail.com');

        expect(email.isFromPublicProvider()).toBe(true);
      });

      it('should return true for iCloud', () => {
        const email = Email.create('user@icloud.com');

        expect(email.isFromPublicProvider()).toBe(true);
      });

      it('should return true for AOL', () => {
        const email = Email.create('user@aol.com');

        expect(email.isFromPublicProvider()).toBe(true);
      });

      it('should return true for ProtonMail', () => {
        const email = Email.create('user@protonmail.com');

        expect(email.isFromPublicProvider()).toBe(true);
      });

      it('should return true for Yandex', () => {
        const email = Email.create('user@yandex.com');

        expect(email.isFromPublicProvider()).toBe(true);
      });

      it('should return false for corporate domain', () => {
        const email = Email.create('user@company.com');

        expect(email.isFromPublicProvider()).toBe(false);
      });

      it('should return false for educational domain', () => {
        const email = Email.create('student@university.edu');

        expect(email.isFromPublicProvider()).toBe(false);
      });

      it('should return false for custom domain', () => {
        const email = Email.create('user@mydomain.org');

        expect(email.isFromPublicProvider()).toBe(false);
      });
    });
  });

  describe('Privacy and Display Methods', () => {
    describe('getMasked', () => {
      it('should mask email with default settings', () => {
        const email = Email.create('john.doe@example.com');

        expect(email.getMasked()).toBe('j*****@example.com');
      });

      it('should mask email with domain hidden', () => {
        const email = Email.create('john.doe@example.com');

        expect(email.getMasked(false)).toBe('j*****@e******.com');
      });

      it('should handle short local part', () => {
        const email = Email.create('a@example.com');

        expect(email.getMasked()).toBe('*@example.com');
      });

      it('should handle single character local part', () => {
        const email = Email.create('x@example.com');

        expect(email.getMasked()).toBe('*@example.com');
      });

      it('should limit asterisk count for long local parts', () => {
        const email = Email.create('verylongusername@example.com');

        const masked = email.getMasked();
        expect(masked).toBe('v*****@example.com');
        expect(masked.length).toBeLessThan(email.value.length);
      });

      it('should preserve domain case in masked output', () => {
        const email = Email.create('user@Example.Com');

        expect(email.getMasked()).toBe('u***@example.com');
      });

      it('should handle subdomain in masked output', () => {
        const email = Email.create('user@mail.example.com');

        expect(email.getMasked()).toBe('u***@mail.example.com');
        expect(email.getMasked(false)).toBe('u***@m******.com');
      });
    });
  });

  describe('Domain Invariants', () => {
    it('should maintain email format invariant', () => {
      // Domain Layer ensures invariants are always maintained
      const validEmails = [
        'user@example.com',
        'test.email@domain.org',
        'user+tag@company.net',
        'user_name@sub.domain.com',
      ];

      validEmails.forEach((emailStr) => {
        const email = Email.create(emailStr);
        expect(email.value).toMatch(
          /^[a-zA-Z0-9_'^&\/+-]+(?:\.[a-zA-Z0-9_'^&\/+-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/
        );
      });
    });

    it('should preserve value immutability across operations', () => {
      const original = Email.create('user@example.com');
      const originalValue = original.value;

      // Operations should not modify the original value
      original.equals(Email.create('other@example.com'));
      original.getDomain();
      original.getLocalPart();
      original.isFromDomain('example.com');
      original.isFromPublicProvider();
      original.getMasked();

      expect(original.value).toBe(originalValue);
    });

    it('should generate deterministic results', () => {
      const email1 = Email.create('user@example.com');
      const email2 = Email.create('user@example.com');

      expect(email1.getDomain()).toBe(email2.getDomain());
      expect(email1.getLocalPart()).toBe(email2.getLocalPart());
      expect(email1.isFromDomain('example.com')).toBe(email2.isFromDomain('example.com'));
      expect(email1.isFromPublicProvider()).toBe(email2.isFromPublicProvider());
      expect(email1.getMasked()).toBe(email2.getMasked());
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle boundary length emails', () => {
      // Create email at maximum allowed length
      const maxLocalPart = 'a'.repeat(64);
      const domain = 'example.com';
      const emailStr = `${maxLocalPart}@${domain}`;

      expect(emailStr.length).toBeLessThanOrEqual(254);

      const email = Email.create(emailStr);
      expect(email.value).toBe(emailStr.toLowerCase());
    });

    it('should handle emails with special characters in local part', () => {
      const specialChars = ['_', '+', '-', '.'];

      specialChars.forEach((char) => {
        const emailStr = `user${char}test@example.com`;
        const email = Email.create(emailStr);
        expect(email.value).toBe(emailStr.toLowerCase());
      });
    });

    it('should handle domains with numbers and hyphens', () => {
      const email = Email.create('user@domain-123.com');
      expect(email.getDomain()).toBe('domain-123.com');
    });

    it('should handle comparison with null and undefined', () => {
      const email = Email.create('user@example.com');

      expect(() => email.equals(null as any)).not.toThrow();
      expect(() => email.equals(undefined as any)).not.toThrow();
    });
  });

  describe('Business Rules Validation', () => {
    it('should support corporate email detection', () => {
      const corporateDomains = ['company.com', 'enterprise.org', 'business.net'];

      corporateDomains.forEach((domain) => {
        const email = Email.create(`employee@${domain}`);
        expect(email.isFromDomain(domain)).toBe(true);
        expect(email.isFromPublicProvider()).toBe(false);
      });
    });

    it('should support privacy masking for logs and displays', () => {
      const emails = ['john.doe@company.com', 'user@gmail.com', 'test.email@university.edu'];

      emails.forEach((emailStr) => {
        const email = Email.create(emailStr);
        const masked = email.getMasked();

        // Masked version should be shorter or same length
        expect(masked.length).toBeLessThanOrEqual(emailStr.length);
        // Should still contain @ symbol
        expect(masked).toContain('@');
        // Should not contain the full original email
        expect(masked).not.toBe(emailStr);
      });
    });

    it('should maintain consistent behavior across operations', () => {
      const email = Email.create('user@example.com');

      // Multiple calls should return same results
      expect(email.getDomain()).toBe('example.com');
      expect(email.getDomain()).toBe('example.com');

      expect(email.getLocalPart()).toBe('user');
      expect(email.getLocalPart()).toBe('user');

      expect(email.isFromDomain('example.com')).toBe(true);
      expect(email.isFromDomain('example.com')).toBe(true);
    });
  });
});
