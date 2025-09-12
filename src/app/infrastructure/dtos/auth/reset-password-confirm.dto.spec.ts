import {
  ResetPasswordConfirmRequestDTO,
  ResetPasswordConfirmResponseDTO,
} from './reset-password-confirm.dto';

describe('Reset Password Confirm DTOs - Infrastructure Tests', () => {
  describe('ResetPasswordConfirmRequestDTO', () => {
    describe('structure validation', () => {
      it('should have all required properties', () => {
        // Given
        const resetPasswordConfirmRequest: ResetPasswordConfirmRequestDTO = {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          new_password: 'newPassword123',
          new_password_confirm: 'newPassword123',
        };

        // Then
        expect(resetPasswordConfirmRequest.token).toBeDefined();
        expect(resetPasswordConfirmRequest.new_password).toBeDefined();
        expect(resetPasswordConfirmRequest.new_password_confirm).toBeDefined();
        expect(typeof resetPasswordConfirmRequest.token).toBe('string');
        expect(typeof resetPasswordConfirmRequest.new_password).toBe('string');
        expect(typeof resetPasswordConfirmRequest.new_password_confirm).toBe('string');
      });

      it('should accept valid JWT token format', () => {
        // Given
        const validTokens = [
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMjMsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImV4cCI6MTYwOTQ1NTIwMH0.example_signature',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoicmVzZXRfcGFzc3dvcmQiLCJ1c2VyX2lkIjo0NTYsImV4cCI6MTYwOTQ1NTIwMH0.another_signature_example',
        ];

        validTokens.forEach((token) => {
          const resetPasswordConfirmRequest: ResetPasswordConfirmRequestDTO = {
            token: token,
            new_password: 'newPassword123',
            new_password_confirm: 'newPassword123',
          };

          // Then
          expect(resetPasswordConfirmRequest.token).toBe(token);
          expect(typeof resetPasswordConfirmRequest.token).toBe('string');
        });
      });

      it('should accept valid password formats', () => {
        // Given
        const validPasswords = [
          'password123',
          'P@ssw0rd!',
          'MySecureP@ssw0rd123',
          'ComplexP@ssw0rd!@#$%^&*()',
          'a'.repeat(128), // Very long password
        ];

        validPasswords.forEach((password) => {
          const resetPasswordConfirmRequest: ResetPasswordConfirmRequestDTO = {
            token: 'valid-token',
            new_password: password,
            new_password_confirm: password,
          };

          // Then
          expect(resetPasswordConfirmRequest.new_password).toBe(password);
          expect(resetPasswordConfirmRequest.new_password_confirm).toBe(password);
          expect(typeof resetPasswordConfirmRequest.new_password).toBe('string');
          expect(typeof resetPasswordConfirmRequest.new_password_confirm).toBe('string');
        });
      });
    });

    describe('serialization', () => {
      it('should serialize to JSON correctly', () => {
        // Given
        const resetPasswordConfirmRequest: ResetPasswordConfirmRequestDTO = {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          new_password: 'newPassword123',
          new_password_confirm: 'newPassword123',
        };

        // When
        const json = JSON.stringify(resetPasswordConfirmRequest);
        const parsed = JSON.parse(json);

        // Then
        expect(parsed.token).toBe(resetPasswordConfirmRequest.token);
        expect(parsed.new_password).toBe(resetPasswordConfirmRequest.new_password);
        expect(parsed.new_password_confirm).toBe(resetPasswordConfirmRequest.new_password_confirm);
        expect(parsed).toEqual(resetPasswordConfirmRequest);
      });

      it('should deserialize from JSON correctly', () => {
        // Given
        const jsonString = JSON.stringify({
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          new_password: 'newPassword123',
          new_password_confirm: 'newPassword123',
        });

        // When
        const parsed: ResetPasswordConfirmRequestDTO = JSON.parse(jsonString);

        // Then
        expect(parsed.token).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
        expect(parsed.new_password).toBe('newPassword123');
        expect(parsed.new_password_confirm).toBe('newPassword123');
        expect(typeof parsed.token).toBe('string');
        expect(typeof parsed.new_password).toBe('string');
        expect(typeof parsed.new_password_confirm).toBe('string');
      });

      it('should preserve data types after serialization round-trip', () => {
        // Given
        const resetPasswordConfirmRequest: ResetPasswordConfirmRequestDTO = {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          new_password: 'newPassword123',
          new_password_confirm: 'newPassword123',
        };

        // When
        const json = JSON.stringify(resetPasswordConfirmRequest);
        const parsed: ResetPasswordConfirmRequestDTO = JSON.parse(json);

        // Then
        expect(typeof parsed.token).toBe('string');
        expect(typeof parsed.new_password).toBe('string');
        expect(typeof parsed.new_password_confirm).toBe('string');
        expect(parsed).toEqual(resetPasswordConfirmRequest);
      });
    });

    describe('edge cases', () => {
      it('should handle empty token string', () => {
        // Given
        const resetPasswordConfirmRequest: ResetPasswordConfirmRequestDTO = {
          token: '',
          new_password: 'newPassword123',
          new_password_confirm: 'newPassword123',
        };

        // Then
        expect(resetPasswordConfirmRequest.token).toBe('');
        expect(typeof resetPasswordConfirmRequest.token).toBe('string');
      });

      it('should handle empty password strings', () => {
        // Given
        const resetPasswordConfirmRequest: ResetPasswordConfirmRequestDTO = {
          token: 'valid-token',
          new_password: '',
          new_password_confirm: '',
        };

        // Then
        expect(resetPasswordConfirmRequest.new_password).toBe('');
        expect(resetPasswordConfirmRequest.new_password_confirm).toBe('');
        expect(typeof resetPasswordConfirmRequest.new_password).toBe('string');
        expect(typeof resetPasswordConfirmRequest.new_password_confirm).toBe('string');
      });

      it('should handle mismatched passwords', () => {
        // Given
        const resetPasswordConfirmRequest: ResetPasswordConfirmRequestDTO = {
          token: 'valid-token',
          new_password: 'password123',
          new_password_confirm: 'differentPassword456',
        };

        // Then
        expect(resetPasswordConfirmRequest.new_password).toBe('password123');
        expect(resetPasswordConfirmRequest.new_password_confirm).toBe('differentPassword456');
        expect(resetPasswordConfirmRequest.new_password).not.toBe(
          resetPasswordConfirmRequest.new_password_confirm
        );
      });

      it('should handle special characters in passwords', () => {
        // Given
        const specialPassword = 'P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?';
        const resetPasswordConfirmRequest: ResetPasswordConfirmRequestDTO = {
          token: 'valid-token',
          new_password: specialPassword,
          new_password_confirm: specialPassword,
        };

        // Then
        expect(resetPasswordConfirmRequest.new_password).toBe(specialPassword);
        expect(resetPasswordConfirmRequest.new_password_confirm).toBe(specialPassword);
      });

      it('should handle unicode characters in passwords', () => {
        // Given
        const unicodePassword = 'Pássw0rd_émojis_🚀';
        const resetPasswordConfirmRequest: ResetPasswordConfirmRequestDTO = {
          token: 'valid-token',
          new_password: unicodePassword,
          new_password_confirm: unicodePassword,
        };

        // Then
        expect(resetPasswordConfirmRequest.new_password).toBe(unicodePassword);
        expect(resetPasswordConfirmRequest.new_password_confirm).toBe(unicodePassword);
      });

      it('should handle very long tokens', () => {
        // Given
        const longToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + 'a'.repeat(1000) + '.signature';
        const resetPasswordConfirmRequest: ResetPasswordConfirmRequestDTO = {
          token: longToken,
          new_password: 'password123',
          new_password_confirm: 'password123',
        };

        // Then
        expect(resetPasswordConfirmRequest.token).toBe(longToken);
        expect(resetPasswordConfirmRequest.token.length).toBeGreaterThan(1000);
      });

      it('should handle whitespace in passwords', () => {
        // Given
        const passwordWithWhitespace = '  password123  ';
        const resetPasswordConfirmRequest: ResetPasswordConfirmRequestDTO = {
          token: 'valid-token',
          new_password: passwordWithWhitespace,
          new_password_confirm: passwordWithWhitespace,
        };

        // Then
        expect(resetPasswordConfirmRequest.new_password).toBe(passwordWithWhitespace);
        expect(resetPasswordConfirmRequest.new_password_confirm).toBe(passwordWithWhitespace);
      });
    });

    describe('data consistency', () => {
      it('should maintain property integrity after serialization', () => {
        // Given
        const originalRequest: ResetPasswordConfirmRequestDTO = {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          new_password: 'newPassword123',
          new_password_confirm: 'newPassword123',
        };

        // When
        const json = JSON.stringify(originalRequest);
        const parsed: ResetPasswordConfirmRequestDTO = JSON.parse(json);

        // Then
        expect(parsed.token).toBe(originalRequest.token);
        expect(parsed.new_password).toBe(originalRequest.new_password);
        expect(parsed.new_password_confirm).toBe(originalRequest.new_password_confirm);
        expect(parsed).toEqual(originalRequest);
      });

      it('should handle case sensitivity in passwords', () => {
        // Given
        const caseSensitivePassword = 'Password123';
        const resetPasswordConfirmRequest: ResetPasswordConfirmRequestDTO = {
          token: 'valid-token',
          new_password: caseSensitivePassword,
          new_password_confirm: caseSensitivePassword,
        };

        // Then
        expect(resetPasswordConfirmRequest.new_password).toBe(caseSensitivePassword);
        expect(resetPasswordConfirmRequest.new_password_confirm).toBe(caseSensitivePassword);
        expect(resetPasswordConfirmRequest.new_password).not.toBe(
          caseSensitivePassword.toLowerCase()
        );
      });
    });
  });

  describe('ResetPasswordConfirmResponseDTO', () => {
    const mockResetPasswordConfirmResponse: ResetPasswordConfirmResponseDTO = {
      message: 'Password has been reset successfully',
    };

    describe('structure validation', () => {
      it('should have required message property', () => {
        // Then
        expect(mockResetPasswordConfirmResponse.message).toBeDefined();
        expect(typeof mockResetPasswordConfirmResponse.message).toBe('string');
        expect(mockResetPasswordConfirmResponse.message).toBe(
          'Password has been reset successfully'
        );
      });

      it('should accept different success message types', () => {
        // Given
        const messages = [
          'Password has been reset successfully',
          'Your password has been updated successfully',
          'Password reset completed. You can now log in with your new password.',
          'Password successfully changed. Please log in with your new credentials.',
        ];

        messages.forEach((message) => {
          const response: ResetPasswordConfirmResponseDTO = {
            message: message,
          };

          // Then
          expect(response.message).toBe(message);
          expect(typeof response.message).toBe('string');
        });
      });
    });

    describe('serialization', () => {
      it('should serialize to JSON correctly', () => {
        // When
        const json = JSON.stringify(mockResetPasswordConfirmResponse);
        const parsed = JSON.parse(json);

        // Then
        expect(parsed.message).toBe(mockResetPasswordConfirmResponse.message);
        expect(parsed).toEqual(mockResetPasswordConfirmResponse);
      });

      it('should deserialize from JSON correctly', () => {
        // Given
        const jsonString = JSON.stringify(mockResetPasswordConfirmResponse);

        // When
        const parsed: ResetPasswordConfirmResponseDTO = JSON.parse(jsonString);

        // Then
        expect(parsed).toEqual(mockResetPasswordConfirmResponse);
        expect(parsed.message).toBe('Password has been reset successfully');
      });

      it('should preserve data types after serialization round-trip', () => {
        // When
        const json = JSON.stringify(mockResetPasswordConfirmResponse);
        const parsed: ResetPasswordConfirmResponseDTO = JSON.parse(json);

        // Then
        expect(typeof parsed.message).toBe('string');
        expect(parsed).toEqual(mockResetPasswordConfirmResponse);
      });
    });

    describe('edge cases', () => {
      it('should handle empty message string', () => {
        // Given
        const responseWithEmptyMessage: ResetPasswordConfirmResponseDTO = {
          message: '',
        };

        // Then
        expect(responseWithEmptyMessage.message).toBe('');
        expect(typeof responseWithEmptyMessage.message).toBe('string');
      });

      it('should handle very long success messages', () => {
        // Given
        const longMessage =
          'Your password has been successfully reset and updated in our system. You can now log in using your new password. Please make sure to keep your password secure and do not share it with anyone. If you have any questions or concerns, please contact our support team. '.repeat(
            5
          );
        const responseWithLongMessage: ResetPasswordConfirmResponseDTO = {
          message: longMessage,
        };

        // Then
        expect(responseWithLongMessage.message).toBe(longMessage);
        expect(responseWithLongMessage.message.length).toBeGreaterThan(500);
      });

      it('should handle special characters in message', () => {
        // Given
        const specialMessage =
          'Password reset successful! ✅ You can now log in with your new password. (Remember to keep it secure!)';
        const responseWithSpecialChars: ResetPasswordConfirmResponseDTO = {
          message: specialMessage,
        };

        // Then
        expect(responseWithSpecialChars.message).toBe(specialMessage);
      });

      it('should handle unicode characters in message', () => {
        // Given
        const unicodeMessage =
          '¡Contraseña restablecida exitosamente! Ahora puedes iniciar sesión con tu nueva contraseña.';
        const responseWithUnicode: ResetPasswordConfirmResponseDTO = {
          message: unicodeMessage,
        };

        // Then
        expect(responseWithUnicode.message).toBe(unicodeMessage);
      });

      it('should handle HTML-like content in message', () => {
        // Given
        const htmlMessage =
          'Password reset successful! <a href="/login">Click here to log in</a> with your new password.';
        const responseWithHtml: ResetPasswordConfirmResponseDTO = {
          message: htmlMessage,
        };

        // Then
        expect(responseWithHtml.message).toBe(htmlMessage);
      });

      it('should handle multiline messages', () => {
        // Given
        const multilineMessage =
          'Password reset successful!\n\nYou can now log in with your new password.\nPlease keep your password secure.';
        const responseWithMultiline: ResetPasswordConfirmResponseDTO = {
          message: multilineMessage,
        };

        // Then
        expect(responseWithMultiline.message).toBe(multilineMessage);
        expect(responseWithMultiline.message).toContain('\n');
      });
    });

    describe('data consistency', () => {
      it('should maintain message property integrity', () => {
        // Given
        const originalMessage = 'Password has been reset successfully';
        const response: ResetPasswordConfirmResponseDTO = {
          message: originalMessage,
        };

        // When
        const json = JSON.stringify(response);
        const parsed: ResetPasswordConfirmResponseDTO = JSON.parse(json);

        // Then
        expect(parsed.message).toBe(originalMessage);
        expect(parsed.message).toBe(response.message);
      });

      it('should handle whitespace in message', () => {
        // Given
        const messageWithWhitespace = '  Password has been reset successfully  ';
        const response: ResetPasswordConfirmResponseDTO = {
          message: messageWithWhitespace,
        };

        // Then
        expect(response.message).toBe(messageWithWhitespace);
        expect(response.message).toContain('Password has been reset successfully');
      });

      it('should handle mixed content in message', () => {
        // Given
        const mixedMessage =
          'Password reset successful! 🎉\n\nNext steps:\n1. Log in with your new password\n2. Update your security settings\n3. Enable 2FA if available';
        const response: ResetPasswordConfirmResponseDTO = {
          message: mixedMessage,
        };

        // Then
        expect(response.message).toBe(mixedMessage);
        expect(response.message).toContain('Password reset successful');
        expect(response.message).toContain('🎉');
        expect(response.message).toContain('\n');
      });
    });
  });
});
