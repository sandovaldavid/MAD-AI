import { ResetPasswordRequestDTO, ResetPasswordResponseDTO } from './reset-password.dto';

describe('Reset Password DTOs - Infrastructure Tests', () => {
  describe('ResetPasswordRequestDTO', () => {
    describe('structure validation', () => {
      it('should have required email property', () => {
        // Given
        const resetPasswordRequest: ResetPasswordRequestDTO = {
          email: 'user@example.com',
        };

        // Then
        expect(resetPasswordRequest.email).toBeDefined();
        expect(typeof resetPasswordRequest.email).toBe('string');
        expect(resetPasswordRequest.email).toBe('user@example.com');
      });

      it('should accept valid email format', () => {
        // Given
        const validEmails = [
          'user@example.com',
          'test.user@domain.co.uk',
          'user+tag@example.org',
          'user123@test-domain.com',
        ];

        validEmails.forEach((email) => {
          const resetPasswordRequest: ResetPasswordRequestDTO = {
            email: email,
          };

          // Then
          expect(resetPasswordRequest.email).toBe(email);
          expect(typeof resetPasswordRequest.email).toBe('string');
        });
      });
    });

    describe('serialization', () => {
      it('should serialize to JSON correctly', () => {
        // Given
        const resetPasswordRequest: ResetPasswordRequestDTO = {
          email: 'user@example.com',
        };

        // When
        const json = JSON.stringify(resetPasswordRequest);
        const parsed = JSON.parse(json);

        // Then
        expect(parsed.email).toBe('user@example.com');
        expect(parsed).toEqual(resetPasswordRequest);
      });

      it('should deserialize from JSON correctly', () => {
        // Given
        const jsonString = JSON.stringify({
          email: 'user@example.com',
        });

        // When
        const parsed: ResetPasswordRequestDTO = JSON.parse(jsonString);

        // Then
        expect(parsed.email).toBe('user@example.com');
        expect(typeof parsed.email).toBe('string');
      });

      it('should preserve data types after serialization round-trip', () => {
        // Given
        const resetPasswordRequest: ResetPasswordRequestDTO = {
          email: 'user@example.com',
        };

        // When
        const json = JSON.stringify(resetPasswordRequest);
        const parsed: ResetPasswordRequestDTO = JSON.parse(json);

        // Then
        expect(typeof parsed.email).toBe('string');
        expect(parsed).toEqual(resetPasswordRequest);
      });
    });

    describe('edge cases', () => {
      it('should handle empty email string', () => {
        // Given
        const resetPasswordRequest: ResetPasswordRequestDTO = {
          email: '',
        };

        // Then
        expect(resetPasswordRequest.email).toBe('');
        expect(typeof resetPasswordRequest.email).toBe('string');
      });

      it('should handle special characters in email', () => {
        // Given
        const specialEmail = 'user+tag@example-domain.com';
        const resetPasswordRequest: ResetPasswordRequestDTO = {
          email: specialEmail,
        };

        // Then
        expect(resetPasswordRequest.email).toBe(specialEmail);
      });

      it('should handle unicode characters in email', () => {
        // Given
        const unicodeEmail = 'üser@éxample.com';
        const resetPasswordRequest: ResetPasswordRequestDTO = {
          email: unicodeEmail,
        };

        // Then
        expect(resetPasswordRequest.email).toBe(unicodeEmail);
      });

      it('should handle very long email addresses', () => {
        // Given
        const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
        const resetPasswordRequest: ResetPasswordRequestDTO = {
          email: longEmail,
        };

        // Then
        expect(resetPasswordRequest.email).toBe(longEmail);
        expect(resetPasswordRequest.email.length).toBeGreaterThan(100);
      });

      it('should handle email with multiple dots', () => {
        // Given
        const multiDotEmail = 'user.name.test@sub.domain.example.com';
        const resetPasswordRequest: ResetPasswordRequestDTO = {
          email: multiDotEmail,
        };

        // Then
        expect(resetPasswordRequest.email).toBe(multiDotEmail);
      });
    });

    describe('data consistency', () => {
      it('should maintain email property integrity', () => {
        // Given
        const originalEmail = 'user@example.com';
        const resetPasswordRequest: ResetPasswordRequestDTO = {
          email: originalEmail,
        };

        // When
        const json = JSON.stringify(resetPasswordRequest);
        const parsed: ResetPasswordRequestDTO = JSON.parse(json);

        // Then
        expect(parsed.email).toBe(originalEmail);
        expect(parsed.email).toBe(resetPasswordRequest.email);
      });

      it('should handle case sensitivity in email', () => {
        // Given
        const mixedCaseEmail = 'User@Example.COM';
        const resetPasswordRequest: ResetPasswordRequestDTO = {
          email: mixedCaseEmail,
        };

        // Then
        expect(resetPasswordRequest.email).toBe(mixedCaseEmail);
        expect(resetPasswordRequest.email).not.toBe(mixedCaseEmail.toLowerCase());
      });
    });
  });

  describe('ResetPasswordResponseDTO', () => {
    const mockResetPasswordResponse: ResetPasswordResponseDTO = {
      message: 'Password reset email sent successfully',
    };

    describe('structure validation', () => {
      it('should have required message property', () => {
        // Then
        expect(mockResetPasswordResponse.message).toBeDefined();
        expect(typeof mockResetPasswordResponse.message).toBe('string');
        expect(mockResetPasswordResponse.message).toBe('Password reset email sent successfully');
      });

      it('should accept different message types', () => {
        // Given
        const messages = [
          'Password reset email sent successfully',
          'If an account with that email exists, we have sent a password reset link.',
          'Check your email for further instructions.',
          'Password reset instructions have been sent to your email address.',
        ];

        messages.forEach((message) => {
          const response: ResetPasswordResponseDTO = {
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
        const json = JSON.stringify(mockResetPasswordResponse);
        const parsed = JSON.parse(json);

        // Then
        expect(parsed.message).toBe(mockResetPasswordResponse.message);
        expect(parsed).toEqual(mockResetPasswordResponse);
      });

      it('should deserialize from JSON correctly', () => {
        // Given
        const jsonString = JSON.stringify(mockResetPasswordResponse);

        // When
        const parsed: ResetPasswordResponseDTO = JSON.parse(jsonString);

        // Then
        expect(parsed).toEqual(mockResetPasswordResponse);
        expect(parsed.message).toBe('Password reset email sent successfully');
      });

      it('should preserve data types after serialization round-trip', () => {
        // When
        const json = JSON.stringify(mockResetPasswordResponse);
        const parsed: ResetPasswordResponseDTO = JSON.parse(json);

        // Then
        expect(typeof parsed.message).toBe('string');
        expect(parsed).toEqual(mockResetPasswordResponse);
      });
    });

    describe('edge cases', () => {
      it('should handle empty message string', () => {
        // Given
        const responseWithEmptyMessage: ResetPasswordResponseDTO = {
          message: '',
        };

        // Then
        expect(responseWithEmptyMessage.message).toBe('');
        expect(typeof responseWithEmptyMessage.message).toBe('string');
      });

      it('should handle very long messages', () => {
        // Given
        const longMessage =
          'This is a very long message that contains detailed information about the password reset process and what the user should expect to receive in their email inbox. '.repeat(
            10
          );
        const responseWithLongMessage: ResetPasswordResponseDTO = {
          message: longMessage,
        };

        // Then
        expect(responseWithLongMessage.message).toBe(longMessage);
        expect(responseWithLongMessage.message.length).toBeGreaterThan(500);
      });

      it('should handle special characters in message', () => {
        // Given
        const specialMessage =
          "Password reset sent! Check your email 📧 for instructions. (Don't forget to check spam!)";
        const responseWithSpecialChars: ResetPasswordResponseDTO = {
          message: specialMessage,
        };

        // Then
        expect(responseWithSpecialChars.message).toBe(specialMessage);
      });

      it('should handle unicode characters in message', () => {
        // Given
        const unicodeMessage =
          'Se ha enviado el correo de restablecimiento de contraseña. ¡Revisa tu bandeja de entrada!';
        const responseWithUnicode: ResetPasswordResponseDTO = {
          message: unicodeMessage,
        };

        // Then
        expect(responseWithUnicode.message).toBe(unicodeMessage);
      });

      it('should handle HTML-like content in message', () => {
        // Given
        const htmlMessage =
          'Password reset email sent. <a href="#">Click here</a> if you don\'t receive it.';
        const responseWithHtml: ResetPasswordResponseDTO = {
          message: htmlMessage,
        };

        // Then
        expect(responseWithHtml.message).toBe(htmlMessage);
      });
    });

    describe('data consistency', () => {
      it('should maintain message property integrity', () => {
        // Given
        const originalMessage = 'Password reset email sent successfully';
        const response: ResetPasswordResponseDTO = {
          message: originalMessage,
        };

        // When
        const json = JSON.stringify(response);
        const parsed: ResetPasswordResponseDTO = JSON.parse(json);

        // Then
        expect(parsed.message).toBe(originalMessage);
        expect(parsed.message).toBe(response.message);
      });

      it('should handle whitespace in message', () => {
        // Given
        const messageWithWhitespace = '  Password reset email sent successfully  ';
        const response: ResetPasswordResponseDTO = {
          message: messageWithWhitespace,
        };

        // Then
        expect(response.message).toBe(messageWithWhitespace);
        expect(response.message).toContain('Password reset email sent successfully');
      });

      it('should handle newlines in message', () => {
        // Given
        const multilineMessage =
          'Password reset email sent successfully.\nPlease check your inbox and spam folder.';
        const response: ResetPasswordResponseDTO = {
          message: multilineMessage,
        };

        // Then
        expect(response.message).toBe(multilineMessage);
        expect(response.message).toContain('\n');
      });
    });
  });
});
