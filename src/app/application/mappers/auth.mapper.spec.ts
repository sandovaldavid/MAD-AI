import { TestBed } from '@angular/core/testing';
import { AuthMapper } from './auth.mapper';
import type {
  PasswordResetConfirmRequest,
  LoginRequest,
  RegisterRequest,
} from '../types/auth.types';
import type { ResetPasswordContract } from '@domain/repositories/business/auth.contract';

describe('AuthMapper', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(AuthMapper).toBeTruthy();
  });

  describe('toResetPasswordContract', () => {
    it('should map PasswordResetConfirmRequest to ResetPasswordContract', () => {
      // Arrange
      const request: PasswordResetConfirmRequest = {
        token: 'reset-token-123',
        newPassword: 'NewSecurePassword123!',
        confirmPassword: 'NewSecurePassword123!',
        deviceInfo: {
          userAgent: 'Chrome/91.0',
          platform: 'desktop',
        },
      };

      // Act
      const result = AuthMapper.toResetPasswordContract(request);

      // Assert
      expect(result).toEqual({
        token: 'reset-token-123',
        newPassword: 'NewSecurePassword123!',
        newPasswordConfirm: 'NewSecurePassword123!',
      });
    });

    it('should handle minimal request without device info', () => {
      // Arrange
      const request: PasswordResetConfirmRequest = {
        token: 'minimal-token',
        newPassword: 'password123',
        confirmPassword: 'password123',
      };

      // Act
      const result = AuthMapper.toResetPasswordContract(request);

      // Assert
      expect(result).toEqual({
        token: 'minimal-token',
        newPassword: 'password123',
        newPasswordConfirm: 'password123',
      });
    });

    it('should correctly map confirmPassword to newPasswordConfirm', () => {
      // Arrange
      const request: PasswordResetConfirmRequest = {
        token: 'test-token',
        newPassword: 'newpass123',
        confirmPassword: 'confirmpass123',
      };

      // Act
      const result = AuthMapper.toResetPasswordContract(request);

      // Assert
      expect(result.newPasswordConfirm).toBe('confirmpass123');
    });
  });

  describe('toCredentialsContract', () => {
    it('should map LoginRequest to CredentialsContract with email identifier', () => {
      // Arrange
      const request: LoginRequest = {
        identifier: 'test@example.com',
        password: 'password123',
        rememberMe: true,
        deviceInfo: {
          userAgent: 'Chrome/91.0',
          platform: 'desktop',
        },
      };

      // Act
      const result = AuthMapper.toCredentialsContract(request);

      // Assert
      expect(result).toEqual({
        identifier: {
          type: 'email',
          value: 'test@example.com',
        },
        password: 'password123',
        rememberMe: true,
      });
    });

    it('should map LoginRequest to CredentialsContract with username identifier', () => {
      // Arrange
      const request: LoginRequest = {
        identifier: 'testuser',
        password: 'password123',
      };

      // Act
      const result = AuthMapper.toCredentialsContract(request);

      // Assert
      expect(result).toEqual({
        identifier: {
          type: 'username',
          value: 'testuser',
        },
        password: 'password123',
        rememberMe: false,
      });
    });

    it('should default rememberMe to false when not provided', () => {
      // Arrange
      const request: LoginRequest = {
        identifier: 'test@example.com',
        password: 'password123',
      };

      // Act
      const result = AuthMapper.toCredentialsContract(request);

      // Assert
      expect(result.rememberMe).toBe(false);
    });

    it('should handle request with device info', () => {
      // Arrange
      const request: LoginRequest = {
        identifier: 'test@example.com',
        password: 'password123',
        rememberMe: false,
        deviceInfo: {
          userAgent: 'Firefox/89.0',
          platform: 'mobile',
          deviceId: 'device-123',
        },
      };

      // Act
      const result = AuthMapper.toCredentialsContract(request);

      // Assert
      expect(result).toEqual({
        identifier: {
          type: 'email',
          value: 'test@example.com',
        },
        password: 'password123',
        rememberMe: false,
      });
    });
  });

  describe('toPasswordResetConfirmRequest', () => {
    it('should map ResetPasswordContract to PasswordResetConfirmRequest', () => {
      // Arrange
      const contract: ResetPasswordContract = {
        token: 'contract-token-456',
        newPassword: 'contractPassword789!',
        newPasswordConfirm: 'contractPassword789!',
      };

      // Act
      const result = AuthMapper.toPasswordResetConfirmRequest(contract);

      // Assert
      expect(result).toEqual({
        token: 'contract-token-456',
        newPassword: 'contractPassword789!',
        confirmPassword: 'contractPassword789!',
      });
    });

    it('should correctly map newPasswordConfirm to confirmPassword', () => {
      // Arrange
      const contract: ResetPasswordContract = {
        token: 'test-token',
        newPassword: 'newpass',
        newPasswordConfirm: 'confirmnewpass',
      };

      // Act
      const result = AuthMapper.toPasswordResetConfirmRequest(contract);

      // Assert
      expect(result.confirmPassword).toBe('confirmnewpass');
    });
  });

  describe('toRegisterUserContract', () => {
    it('should map RegisterRequest to RegisterUserContract with all fields', () => {
      // Arrange
      const request: RegisterRequest = {
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        passwordConfirm: 'password123',
        acceptTerms: true,
        roleId: 2,
        deviceInfo: {
          userAgent: 'Chrome/91.0',
          platform: 'desktop',
        },
      };

      // Act
      const result = AuthMapper.toRegisterUserContract(request);

      // Assert
      expect(result).toEqual({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        roleId: 2,
      });
    });

    it('should map RegisterRequest to RegisterUserContract with minimal fields', () => {
      // Arrange
      const request: RegisterRequest = {
        username: 'minimaluser',
        email: 'minimal@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        password: 'pass123',
        passwordConfirm: 'pass123',
        acceptTerms: true,
      };

      // Act
      const result = AuthMapper.toRegisterUserContract(request);

      // Assert
      expect(result).toEqual({
        username: 'minimaluser',
        email: 'minimal@example.com',
        password: 'pass123',
        passwordConfirm: 'pass123',
        firstName: 'Jane',
        lastName: 'Smith',
        roleId: null,
      });
    });

    it('should handle null roleId when not provided', () => {
      // Arrange
      const request: RegisterRequest = {
        username: 'noroleuser',
        email: 'norole@example.com',
        firstName: 'Bob',
        lastName: 'Wilson',
        password: 'password456',
        passwordConfirm: 'password456',
        acceptTerms: true,
      };

      // Act
      const result = AuthMapper.toRegisterUserContract(request);

      // Assert
      expect(result.roleId).toBeNull();
    });

    it('should handle undefined roleId', () => {
      // Arrange
      const request: RegisterRequest = {
        username: 'undefinedroleuser',
        email: 'undefined@example.com',
        firstName: 'Alice',
        lastName: 'Brown',
        password: 'password789',
        passwordConfirm: 'password789',
        acceptTerms: true,
        roleId: undefined,
      };

      // Act
      const result = AuthMapper.toRegisterUserContract(request);

      // Assert
      expect(result.roleId).toBeNull();
    });
  });

  describe('bidirectional mapping verification', () => {
    it('should maintain data integrity in password reset bidirectional mapping', () => {
      // Arrange
      const originalRequest: PasswordResetConfirmRequest = {
        token: 'bidirectional-token',
        newPassword: 'originalPassword123!',
        confirmPassword: 'originalPassword123!',
      };

      // Act
      const contract = AuthMapper.toResetPasswordContract(originalRequest);
      const mappedBack = AuthMapper.toPasswordResetConfirmRequest(contract);

      // Assert
      expect(mappedBack).toEqual(originalRequest);
    });

    it('should maintain data integrity in login mapping', () => {
      // Arrange
      const originalRequest: LoginRequest = {
        identifier: 'bidirectional@example.com',
        password: 'bidirectionalPass123!',
        rememberMe: true,
      };

      // Act
      const contract = AuthMapper.toCredentialsContract(originalRequest);

      // Assert
      expect(contract.identifier.type).toBe('email');
      expect(contract.identifier.value).toBe('bidirectional@example.com');
      expect(contract.password).toBe('bidirectionalPass123!');
      expect(contract.rememberMe).toBe(true);
    });
  });
});
