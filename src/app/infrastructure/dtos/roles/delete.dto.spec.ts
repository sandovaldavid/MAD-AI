import { DeleteRoleResponseDTO } from './delete.dto';

describe('Delete Role DTOs - Infrastructure Tests', () => {
  describe('DeleteRoleResponseDTO', () => {
    const mockDeleteRoleResponse: DeleteRoleResponseDTO = {
      message: 'Role deleted successfully',
    };

    describe('structure validation', () => {
      it('should have required message property', () => {
        // Then
        expect(mockDeleteRoleResponse.message).toBeDefined();
        expect(typeof mockDeleteRoleResponse.message).toBe('string');
        expect(mockDeleteRoleResponse.message).toBe('Role deleted successfully');
      });

      it('should accept different success message types', () => {
        // Given
        const messages = [
          'Role deleted successfully',
          'Role has been removed from the system',
          'Role deletion completed',
          'The role has been permanently deleted',
        ];

        messages.forEach((message) => {
          const response: DeleteRoleResponseDTO = {
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
        const json = JSON.stringify(mockDeleteRoleResponse);
        const parsed = JSON.parse(json);

        // Then
        expect(parsed.message).toBe(mockDeleteRoleResponse.message);
        expect(parsed).toEqual(mockDeleteRoleResponse);
      });

      it('should deserialize from JSON correctly', () => {
        // Given
        const jsonString = JSON.stringify(mockDeleteRoleResponse);

        // When
        const parsed: DeleteRoleResponseDTO = JSON.parse(jsonString);

        // Then
        expect(parsed).toEqual(mockDeleteRoleResponse);
        expect(parsed.message).toBe('Role deleted successfully');
      });

      it('should preserve data types after serialization round-trip', () => {
        // When
        const json = JSON.stringify(mockDeleteRoleResponse);
        const parsed: DeleteRoleResponseDTO = JSON.parse(json);

        // Then
        expect(typeof parsed.message).toBe('string');
        expect(parsed).toEqual(mockDeleteRoleResponse);
      });
    });

    describe('edge cases', () => {
      it('should handle empty message string', () => {
        // Given
        const responseWithEmptyMessage: DeleteRoleResponseDTO = {
          message: '',
        };

        // Then
        expect(responseWithEmptyMessage.message).toBe('');
        expect(typeof responseWithEmptyMessage.message).toBe('string');
      });

      it('should handle very long messages', () => {
        // Given
        const longMessage =
          'The role has been successfully deleted from the system. All associated permissions and access rights have been revoked. This action cannot be undone. Please ensure that all users who were assigned to this role have been reassigned to appropriate alternative roles. '.repeat(
            3
          );
        const responseWithLongMessage: DeleteRoleResponseDTO = {
          message: longMessage,
        };

        // Then
        expect(responseWithLongMessage.message).toBe(longMessage);
        expect(responseWithLongMessage.message.length).toBeGreaterThan(200);
      });

      it('should handle special characters in message', () => {
        // Given
        const specialMessage =
          'Role deleted successfully! ✅ All permissions revoked. (This action cannot be undone!)';
        const responseWithSpecialChars: DeleteRoleResponseDTO = {
          message: specialMessage,
        };

        // Then
        expect(responseWithSpecialChars.message).toBe(specialMessage);
      });

      it('should handle unicode characters in message', () => {
        // Given
        const unicodeMessage =
          '¡Rol eliminado exitosamente! Todos los permisos han sido revocados.';
        const responseWithUnicode: DeleteRoleResponseDTO = {
          message: unicodeMessage,
        };

        // Then
        expect(responseWithUnicode.message).toBe(unicodeMessage);
      });

      it('should handle HTML-like content in message', () => {
        // Given
        const htmlMessage =
          'Role deleted successfully! <strong>Warning:</strong> This action cannot be undone.';
        const responseWithHtml: DeleteRoleResponseDTO = {
          message: htmlMessage,
        };

        // Then
        expect(responseWithHtml.message).toBe(htmlMessage);
      });

      it('should handle multiline messages', () => {
        // Given
        const multilineMessage =
          'Role deleted successfully!\n\nAll permissions have been revoked.\nThis action cannot be undone.';
        const responseWithMultiline: DeleteRoleResponseDTO = {
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
        const originalMessage = 'Role deleted successfully';
        const response: DeleteRoleResponseDTO = {
          message: originalMessage,
        };

        // When
        const json = JSON.stringify(response);
        const parsed: DeleteRoleResponseDTO = JSON.parse(json);

        // Then
        expect(parsed.message).toBe(originalMessage);
        expect(parsed.message).toBe(response.message);
      });

      it('should handle whitespace in message', () => {
        // Given
        const messageWithWhitespace = '  Role deleted successfully  ';
        const response: DeleteRoleResponseDTO = {
          message: messageWithWhitespace,
        };

        // Then
        expect(response.message).toBe(messageWithWhitespace);
        expect(response.message).toContain('Role deleted successfully');
      });

      it('should handle mixed content in message', () => {
        // Given
        const mixedMessage =
          'Role deleted successfully! 🗑️\n\nNext steps:\n1. Verify all users have been reassigned\n2. Update any remaining references\n3. Confirm system integrity';
        const response: DeleteRoleResponseDTO = {
          message: mixedMessage,
        };

        // Then
        expect(response.message).toBe(mixedMessage);
        expect(response.message).toContain('Role deleted successfully');
        expect(response.message).toContain('🗑️');
        expect(response.message).toContain('\n');
      });
    });
  });
});
