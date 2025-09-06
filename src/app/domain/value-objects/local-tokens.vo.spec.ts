import { AccessToken, RefreshToken, TokenPair } from './local-tokens.vo';
import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import { TokenLength } from '../enums/token-length.enum';

/**
 * Local Tokens Value Objects - Domain Tests
 *
 * Tests unitarios puros que validan:
 * - Reglas de negocio para tokens de autenticación
 * - Validaciones de creación y formato
 * - Inmutabilidad de los Value Objects
 * - Igualdad por valor
 * - Invariantes que deben mantenerse siempre
 */
describe('Local Tokens Value Objects - Domain Tests', () => {
  describe('AccessToken Value Object', () => {
    describe('Creación y Validación', () => {
      describe('Casos válidos', () => {
        it('debe crear AccessToken válido con token básico', () => {
          // Arrange
          const validToken = 'abcdefghijklmnop'; // 16 chars minimum

          // Act
          const accessToken = AccessToken.create(validToken);

          // Assert
          expect(accessToken).toBeDefined();
          expect(accessToken.getValue()).toBe(validToken);
        });
        it('debe crear AccessToken válido con caracteres permitidos', () => {
          // Given
          const rawToken = 'abc_123.def-456789'; // 18 chars

          // When
          const accessToken = AccessToken.create(rawToken);

          // Then
          expect(accessToken).toBeInstanceOf(AccessToken);
          expect(accessToken.getValue()).toBe('abc_123.def-456789');
        });

        it('debe crear AccessToken válido con tiempo de expiración', () => {
          // Given
          const rawToken = 'abcdefghijklmnop'; // 16 chars minimum
          const expSeconds = 3600;

          // When
          const accessToken = AccessToken.create(rawToken, expSeconds);

          // Then
          expect(accessToken).toBeInstanceOf(AccessToken);
          expect(accessToken.getValue()).toBe('abcdefghijklmnop');
          expect((accessToken as any).expSeconds).toBe(3600);
        });

        it('debe normalizar espacios en blanco', () => {
          // Given
          const rawToken = '  abcdefghijklmnop  '; // 16 chars + spaces

          // When
          const accessToken = AccessToken.create(rawToken);

          // Then
          expect(accessToken.getValue()).toBe('abcdefghijklmnop');
        });

        it('debe aceptar token en el límite mínimo de longitud', () => {
          // Given
          const rawToken = 'a'.repeat(TokenLength.ACCESS_TOKEN_MIN);

          // When
          const accessToken = AccessToken.create(rawToken);

          // Then
          expect(accessToken).toBeInstanceOf(AccessToken);
          expect(accessToken.getValue().length).toBe(TokenLength.ACCESS_TOKEN_MIN);
        });

        it('debe aceptar token en el límite máximo de longitud', () => {
          // Given
          const rawToken = 'a'.repeat(TokenLength.ACCESS_TOKEN_MAX);

          // When
          const accessToken = AccessToken.create(rawToken);

          // Then
          expect(accessToken).toBeInstanceOf(AccessToken);
          expect(accessToken.getValue().length).toBe(TokenLength.ACCESS_TOKEN_MAX);
        });
      });

      describe('Casos inválidos', () => {
        it('debe rechazar valor null', () => {
          // Given
          const rawToken = null as any;

          // When & Then
          try {
            AccessToken.create(rawToken);
            fail('Expected ValidationError to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
            expect((error as ValidationError).hasFieldError('accessToken')).toBe(true);
          }
        });

        it('debe rechazar valor undefined', () => {
          // Given
          const rawToken = undefined as any;

          // When & Then
          try {
            AccessToken.create(rawToken);
            fail('Expected ValidationError to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
            expect((error as ValidationError).hasFieldError('accessToken')).toBe(true);
          }
        });

        it('debe rechazar string vacío', () => {
          // Given
          const rawToken = '';

          // When & Then
          try {
            AccessToken.create(rawToken);
            fail('Expected ValidationError to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
            expect((error as ValidationError).hasFieldError('accessToken')).toBe(true);
          }
        });

        it('debe rechazar string solo con espacios', () => {
          // Given
          const rawToken = '   ';

          // When & Then
          try {
            AccessToken.create(rawToken);
            fail('Expected ValidationError to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
            expect((error as ValidationError).hasFieldError('accessToken')).toBe(true);
          }
        });

        it('debe rechazar token demasiado corto', () => {
          // Given
          const rawToken = 'a'.repeat(TokenLength.ACCESS_TOKEN_MIN - 1);

          // When & Then
          try {
            AccessToken.create(rawToken);
            fail('Expected ValidationError to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
            expect((error as ValidationError).hasFieldError('accessToken')).toBe(true);
          }
        });

        it('debe rechazar token demasiado largo', () => {
          // Given
          const rawToken = 'a'.repeat(TokenLength.ACCESS_TOKEN_MAX + 1);

          // When & Then
          try {
            AccessToken.create(rawToken);
            fail('Expected ValidationError to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
            expect((error as ValidationError).hasFieldError('accessToken')).toBe(true);
          }
        });

        it('debe rechazar caracteres inválidos', () => {
          // Given - caracteres no permitidos
          const invalidTokens = [
            'abc@123',
            'abc#123',
            'abc$123',
            'abc%123',
            'abc&123',
            'abc*123',
            'abc(123',
            'abc)123',
            'abc+123',
            'abc=123',
            'abc[123',
            'abc]123',
            'abc{123',
            'abc}123',
            'abc|123',
            'abc\\123',
            'abc/123',
            'abc?123',
            'abc<123',
            'abc>123',
            'abc,123',
            'abc.123', // punto no está permitido según regex
            'abc;123',
            'abc:123',
            'abc"123',
            "abc'123",
          ];

          // When & Then
          invalidTokens.forEach((invalidToken) => {
            try {
              AccessToken.create(invalidToken);
              fail(`Expected ValidationError to be thrown for: ${invalidToken}`);
            } catch (error) {
              expect(error).toBeInstanceOf(ValidationError);
              expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
              expect((error as ValidationError).hasFieldError('accessToken')).toBe(true);
            }
          });
        });

        it('debe rechazar tiempo de expiración negativo', () => {
          // Given
          const rawToken = 'abcdefghijklmnop';
          const expSeconds = -1;

          // When & Then
          try {
            AccessToken.create(rawToken, expSeconds);
            fail('Expected ValidationError to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
            expect((error as ValidationError).hasFieldError('expSeconds')).toBe(true);
          }
        });

        it('debe rechazar tiempo de expiración no entero', () => {
          // Given
          const rawToken = 'abcdefghijklmnop';
          const expSeconds = 3600.5;

          // When & Then
          try {
            AccessToken.create(rawToken, expSeconds);
            fail('Expected ValidationError to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
            expect((error as ValidationError).hasFieldError('expSeconds')).toBe(true);
          }
        });

        it('debe rechazar tiempo de expiración mayor a 2100', () => {
          // Given
          const rawToken = 'abcdefghijklmnop';
          const expSeconds = 4102444801; // año 2100 + 1 segundo

          // When & Then
          try {
            AccessToken.create(rawToken, expSeconds);
            fail('Expected ValidationError to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
            expect((error as ValidationError).hasFieldError('expSeconds')).toBe(true);
          }
        });
      });

      describe('Casos límite', () => {
        it('debe aceptar tiempo de expiración cero', () => {
          // Given
          const rawToken = 'abcdefghijklmnop';
          const expSeconds = 0;

          // When
          const accessToken = AccessToken.create(rawToken, expSeconds);

          // Then
          expect(accessToken).toBeInstanceOf(AccessToken);
          expect((accessToken as any).expSeconds).toBe(0);
        });

        it('debe aceptar tiempo de expiración en el límite de 2100', () => {
          // Given
          const rawToken = 'abcdefghijklmnop';
          const expSeconds = 4102444800; // año 2100

          // When
          const accessToken = AccessToken.create(rawToken, expSeconds);

          // Then
          expect(accessToken).toBeInstanceOf(AccessToken);
          expect((accessToken as any).expSeconds).toBe(4102444800);
        });
      });
    });

    describe('Inmutabilidad', () => {
      it('debe ser inmutable después de la creación', () => {
        // Given
        const accessToken = AccessToken.create('abcdefghijklmnop');
        const originalValue = accessToken.getValue();

        // When - Intentar modificar (esto debería fallar en compilación)
        // accessToken.value = 'modified'; // Esto causaría error de TypeScript

        // Then - Verificar que el valor original se mantiene
        expect(accessToken.getValue()).toBe(originalValue);
        expect(accessToken.getValue()).toBe('abcdefghijklmnop');
      });

      it('debe mantener el mismo valor en múltiples accesos', () => {
        // Given
        const accessToken = AccessToken.create('abcdefghijklmnop');

        // When
        const value1 = accessToken.getValue();
        const value2 = accessToken.getValue();

        // Then
        expect(value1).toBe('abcdefghijklmnop');
        expect(value2).toBe('abcdefghijklmnop');
        expect(value1).toBe(value2);
      });
    });

    describe('Igualdad por Valor', () => {
      it('debe ser igual a otro AccessToken con el mismo valor y expiración', () => {
        // Given
        const token1 = AccessToken.create('abcdefghijklmnop', 3600);
        const token2 = AccessToken.create('abcdefghijklmnop', 3600);

        // When & Then
        expect(token1.equals(token2)).toBe(true);
        expect(token2.equals(token1)).toBe(true);
      });

      it('debe ser diferente si el valor es diferente', () => {
        // Given
        const token1 = AccessToken.create('abcdefghijklmnop', 3600);
        const token2 = AccessToken.create('qrstuvwxyzabcdef', 3600);

        // When & Then
        expect(token1.equals(token2)).toBe(false);
        expect(token2.equals(token1)).toBe(false);
      });

      it('debe ser diferente si la expiración es diferente', () => {
        // Given
        const token1 = AccessToken.create('abcdefghijklmnop', 3600);
        const token2 = AccessToken.create('abcdefghijklmnop', 7200);

        // When & Then
        expect(token1.equals(token2)).toBe(false);
        expect(token2.equals(token1)).toBe(false);
      });

      it('debe ser diferente si uno tiene expiración y otro no', () => {
        // Given
        const token1 = AccessToken.create('abcdefghijklmnop', 3600);
        const token2 = AccessToken.create('abcdefghijklmnop');

        // When & Then
        expect(token1.equals(token2)).toBe(false);
        expect(token2.equals(token1)).toBe(false);
      });
    });

    describe('Métodos de Acceso', () => {
      let accessToken: AccessToken;

      beforeEach(() => {
        accessToken = AccessToken.create('abcdefghijklmnop');
      });

      describe('getValue()', () => {
        it('debe retornar el valor del token como string', () => {
          // When
          const value = accessToken.getValue();

          // Then
          expect(value).toBe('abcdefghijklmnop');
          expect(typeof value).toBe('string');
        });
      });
    });
  });

  describe('RefreshToken Value Object', () => {
    describe('Creación y Validación', () => {
      describe('Casos válidos', () => {
        it('debe crear RefreshToken válido con token básico', () => {
          // Given
          const rawToken = 'refresh_abc123def45678901234567890'; // 32 chars minimum

          // When
          const refreshToken = RefreshToken.create(rawToken);

          // Then
          expect(refreshToken).toBeInstanceOf(RefreshToken);
          expect(refreshToken.getValue()).toBe('refresh_abc123def45678901234567890');
        });

        it('debe crear RefreshToken válido con caracteres permitidos', () => {
          // Given
          const rawToken = 'refresh.abc-123_def+456/789=000123'; // 32 chars minimum

          // When
          const refreshToken = RefreshToken.create(rawToken);

          // Then
          expect(refreshToken).toBeInstanceOf(RefreshToken);
          expect(refreshToken.getValue()).toBe('refresh.abc-123_def+456/789=000123');
        });

        it('debe normalizar espacios en blanco', () => {
          // Given
          const rawToken = '  refresh_abcdefghijklmnop12345678  ';

          // When
          const refreshToken = RefreshToken.create(rawToken);

          // Then
          expect(refreshToken.getValue()).toBe('refresh_abcdefghijklmnop12345678');
        });

        it('debe aceptar token en el límite mínimo de longitud', () => {
          // Given
          const rawToken = 'a'.repeat(TokenLength.REFRESH_TOKEN_MIN);

          // When
          const refreshToken = RefreshToken.create(rawToken);

          // Then
          expect(refreshToken).toBeInstanceOf(RefreshToken);
          expect(refreshToken.getValue().length).toBe(TokenLength.REFRESH_TOKEN_MIN);
        });

        it('debe aceptar token en el límite máximo de longitud', () => {
          // Given
          const rawToken = 'a'.repeat(TokenLength.REFRESH_TOKEN_MAX);

          // When
          const refreshToken = RefreshToken.create(rawToken);

          // Then
          expect(refreshToken).toBeInstanceOf(RefreshToken);
          expect(refreshToken.getValue().length).toBe(TokenLength.REFRESH_TOKEN_MAX);
        });
      });

      describe('Casos inválidos', () => {
        it('debe rechazar valor null', () => {
          // Given
          const rawToken = null as any;

          // When & Then
          try {
            RefreshToken.create(rawToken);
            fail('Expected ValidationError to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
            expect((error as ValidationError).hasFieldError('refreshToken')).toBe(true);
          }
        });

        it('debe rechazar valor undefined', () => {
          // Given
          const rawToken = undefined as any;

          // When & Then
          try {
            RefreshToken.create(rawToken);
            fail('Expected ValidationError to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
            expect((error as ValidationError).hasFieldError('refreshToken')).toBe(true);
          }
        });

        it('debe rechazar string vacío', () => {
          // Given
          const rawToken = '';

          // When & Then
          try {
            RefreshToken.create(rawToken);
            fail('Expected ValidationError to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
            expect((error as ValidationError).hasFieldError('refreshToken')).toBe(true);
          }
        });

        it('debe rechazar string solo con espacios', () => {
          // Given
          const rawToken = '   ';

          // When & Then
          try {
            RefreshToken.create(rawToken);
            fail('Expected ValidationError to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
            expect((error as ValidationError).hasFieldError('refreshToken')).toBe(true);
          }
        });

        it('debe rechazar token demasiado corto', () => {
          // Given
          const rawToken = 'a'.repeat(TokenLength.REFRESH_TOKEN_MIN - 1);

          // When & Then
          try {
            RefreshToken.create(rawToken);
            fail('Expected ValidationError to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
            expect((error as ValidationError).hasFieldError('refreshToken')).toBe(true);
          }
        });

        it('debe rechazar token demasiado largo', () => {
          // Given
          const rawToken = 'a'.repeat(TokenLength.REFRESH_TOKEN_MAX + 1);

          // When & Then
          try {
            RefreshToken.create(rawToken);
            fail('Expected ValidationError to be thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
            expect((error as ValidationError).hasFieldError('refreshToken')).toBe(true);
          }
        });

        it('debe rechazar caracteres inválidos para refresh token', () => {
          // Given - caracteres no permitidos (más restrictivos que access token)
          const invalidTokens = [
            'refresh@abc',
            'refresh#abc',
            'refresh$abc',
            'refresh%abc',
            'refresh&abc',
            'refresh*abc',
            'refresh(abc',
            'refresh)abc',
            'refresh[abc',
            'refresh]abc',
            'refresh{abc',
            'refresh}abc',
            'refresh|abc',
            'refresh\\abc',
            'refresh?abc',
            'refresh<abc',
            'refresh>abc',
            'refresh,abc',
            'refresh;abc',
            'refresh:abc',
            'refresh"abc',
            "refresh'abc",
          ];

          // When & Then
          invalidTokens.forEach((invalidToken) => {
            try {
              RefreshToken.create(invalidToken);
              fail(`Expected ValidationError to be thrown for: ${invalidToken}`);
            } catch (error) {
              expect(error).toBeInstanceOf(ValidationError);
              expect((error as ValidationError).code).toBe(ValidationErrorCode.VALIDATION_ERROR);
              expect((error as ValidationError).hasFieldError('refreshToken')).toBe(true);
            }
          });
        });
      });
    });

    describe('Inmutabilidad', () => {
      it('debe ser inmutable después de la creación', () => {
        // Given
        const refreshToken = RefreshToken.create('refresh_abcdefghijklmnop12345678');
        const originalValue = refreshToken.getValue();

        // When - Intentar modificar (esto debería fallar en compilación)
        // refreshToken.value = 'modified'; // Esto causaría error de TypeScript

        // Then - Verificar que el valor original se mantiene
        expect(refreshToken.getValue()).toBe(originalValue);
        expect(refreshToken.getValue()).toBe('refresh_abcdefghijklmnop12345678');
      });

      it('debe mantener el mismo valor en múltiples accesos', () => {
        // Given
        const refreshToken = RefreshToken.create('refresh_abcdefghijklmnop12345678');

        // When
        const value1 = refreshToken.getValue();
        const value2 = refreshToken.getValue();

        // Then
        expect(value1).toBe('refresh_abcdefghijklmnop12345678');
        expect(value2).toBe('refresh_abcdefghijklmnop12345678');
        expect(value1).toBe(value2);
      });
    });

    describe('Métodos de Acceso', () => {
      let refreshToken: RefreshToken;

      beforeEach(() => {
        refreshToken = RefreshToken.create('refresh_abcdefghijklmnop12345678');
      });

      describe('getValue()', () => {
        it('debe retornar el valor del token como string', () => {
          // When
          const value = refreshToken.getValue();

          // Then
          expect(value).toBe('refresh_abcdefghijklmnop12345678');
          expect(typeof value).toBe('string');
        });
      });
    });
  });

  describe('TokenPair Class', () => {
    let accessToken: AccessToken;
    let refreshToken: RefreshToken;

    beforeEach(() => {
      accessToken = AccessToken.create('access_abcdefghijklmnop');
      refreshToken = RefreshToken.create('refresh_def456789012345678901234567890');
    });

    describe('Constructor y Validación', () => {
      it('debe crear TokenPair válido con ambos tokens', () => {
        // When
        const tokenPair = new TokenPair(accessToken, refreshToken);

        // Then
        expect(tokenPair).toBeInstanceOf(TokenPair);
        expect(tokenPair.accessToken).toBe(accessToken);
        expect(tokenPair.refreshToken).toBe(refreshToken);
      });

      it('debe rechazar constructor sin access token', () => {
        // When & Then
        expect(() => new TokenPair(null as any, refreshToken)).toThrowError(
          'AccessToken is required'
        );
      });

      it('debe rechazar constructor sin refresh token', () => {
        // When & Then
        expect(() => new TokenPair(accessToken, null as any)).toThrowError(
          'RefreshToken is required'
        );
      });
    });

    describe('Igualdad por Valor', () => {
      it('debe ser igual a otro TokenPair con los mismos tokens', () => {
        // Given
        const tokenPair1 = new TokenPair(accessToken, refreshToken);
        const tokenPair2 = new TokenPair(accessToken, refreshToken);

        // When & Then
        expect(tokenPair1.equals(tokenPair2)).toBe(true);
        expect(tokenPair2.equals(tokenPair1)).toBe(true);
      });

      it('debe ser diferente si el access token es diferente', () => {
        // Given
        const differentAccessToken = AccessToken.create('different_access');
        const tokenPair1 = new TokenPair(accessToken, refreshToken);
        const tokenPair2 = new TokenPair(differentAccessToken, refreshToken);

        // When & Then
        expect(tokenPair1.equals(tokenPair2)).toBe(false);
        expect(tokenPair2.equals(tokenPair1)).toBe(false);
      });

      it('debe ser diferente si el refresh token es diferente', () => {
        // Given
        const differentRefreshToken = RefreshToken.create(
          'different_refresh_abcdefghijklmnop12345678'
        );
        const tokenPair1 = new TokenPair(accessToken, refreshToken);
        const tokenPair2 = new TokenPair(accessToken, differentRefreshToken);

        // When & Then
        expect(tokenPair1.equals(tokenPair2)).toBe(false);
        expect(tokenPair2.equals(tokenPair1)).toBe(false);
      });
    });

    describe('Acceso a Tokens Individuales', () => {
      let tokenPair: TokenPair;

      beforeEach(() => {
        tokenPair = new TokenPair(accessToken, refreshToken);
      });

      it('debe proporcionar acceso al access token', () => {
        // When
        const retrievedAccessToken = tokenPair.accessToken;

        // Then
        expect(retrievedAccessToken).toBe(accessToken);
        expect(retrievedAccessToken.getValue()).toBe('access_abcdefghijklmnop');
      });

      it('debe proporcionar acceso al refresh token', () => {
        // When
        const retrievedRefreshToken = tokenPair.refreshToken;

        // Then
        expect(retrievedRefreshToken).toBe(refreshToken);
        expect(retrievedRefreshToken.getValue()).toBe('refresh_def456789012345678901234567890');
      });
    });
  });

  describe('Invariantes del Dominio', () => {
    describe('AccessToken', () => {
      it('debe mantener que el valor siempre cumple con el regex de validación', () => {
        // Given
        const accessToken = AccessToken.create('abc_123.def-45678901234567890');

        // When & Then
        expect(accessToken.getValue()).toMatch(/^[A-Za-z0-9._-]+$/);
      });

      it('debe mantener que el valor nunca está vacío después de trim', () => {
        // Given
        const accessToken = AccessToken.create('abcdefghijklmnop');

        // When & Then
        expect(accessToken.getValue().trim()).not.toBe('');
        expect(accessToken.getValue().length).toBeGreaterThan(0);
      });

      it('debe mantener que la longitud está dentro de los límites permitidos', () => {
        // Given
        const accessToken = AccessToken.create('abcdefghijklmnop');

        // When & Then
        expect(accessToken.getValue().length).toBeGreaterThanOrEqual(TokenLength.ACCESS_TOKEN_MIN);
        expect(accessToken.getValue().length).toBeLessThanOrEqual(TokenLength.ACCESS_TOKEN_MAX);
      });

      it('debe mantener que las operaciones no modifican el valor original', () => {
        // Given
        const original = AccessToken.create('abcdefghijklmnop');
        const originalValue = original.getValue();

        // When - Acceder a métodos que no modifican
        const value = original.getValue();

        // Then
        expect(original.getValue()).toBe(originalValue);
        expect(original.getValue()).toBe('abcdefghijklmnop');
        expect(value).toBe('abcdefghijklmnop');
      });
    });

    describe('RefreshToken', () => {
      it('debe mantener que el valor siempre cumple con el regex de validación', () => {
        // Given
        const refreshToken = RefreshToken.create('refresh.abc-123_def+456/789=0001234567890');

        // When & Then
        expect(refreshToken.getValue()).toMatch(/^[A-Za-z0-9._+-/=]+$/);
      });

      it('debe mantener que el valor nunca está vacío después de trim', () => {
        // Given
        const refreshToken = RefreshToken.create('refresh_abcdefghijklmnop12345678');

        // When & Then
        expect(refreshToken.getValue().trim()).not.toBe('');
        expect(refreshToken.getValue().length).toBeGreaterThan(0);
      });

      it('debe mantener que la longitud está dentro de los límites permitidos', () => {
        // Given
        const refreshToken = RefreshToken.create('refresh_abcdefghijklmnop12345678');

        // When & Then
        expect(refreshToken.getValue().length).toBeGreaterThanOrEqual(
          TokenLength.REFRESH_TOKEN_MIN
        );
        expect(refreshToken.getValue().length).toBeLessThanOrEqual(TokenLength.REFRESH_TOKEN_MAX);
      });
    });

    describe('TokenPair', () => {
      it('debe mantener que siempre tiene ambos tokens válidos', () => {
        // Given
        const accessToken = AccessToken.create('access_abcdefghijklmnop');
        const refreshToken = RefreshToken.create('refresh_def456789012345678901234567890');
        const tokenPair = new TokenPair(accessToken, refreshToken);

        // When & Then
        expect(tokenPair.accessToken).toBeDefined();
        expect(tokenPair.refreshToken).toBeDefined();
        expect(tokenPair.accessToken.getValue()).toBe('access_abcdefghijklmnop');
        expect(tokenPair.refreshToken.getValue()).toBe('refresh_def456789012345678901234567890');
      });
    });
  });

  describe('Reglas de Negocio para Tokens', () => {
    describe('Caracteres Permitidos', () => {
      it('debe aceptar caracteres alfanuméricos en ambos tipos de token', () => {
        // Given
        const accessTokenValue = 'abcdefghijklmnopDEF456';
        const refreshTokenValue = 'refresh_abcdefghijklmnopDEF45678901234567890';

        // When
        const accessToken = AccessToken.create(accessTokenValue);
        const refreshToken = RefreshToken.create(refreshTokenValue);

        // Then
        expect(accessToken.getValue()).toBe('abcdefghijklmnopDEF456');
        expect(refreshToken.getValue()).toBe('refresh_abcdefghijklmnopDEF45678901234567890');
      });

      it('debe aceptar guiones bajos en ambos tipos de token', () => {
        // Given
        const accessTokenValue = 'access_token_123';
        const refreshTokenValue = 'refresh_token_456789012345678901234567890';

        // When
        const accessToken = AccessToken.create(accessTokenValue);
        const refreshToken = RefreshToken.create(refreshTokenValue);

        // Then
        expect(accessToken.getValue()).toBe('access_token_123');
        expect(refreshToken.getValue()).toBe('refresh_token_456789012345678901234567890');
      });

      it('debe aceptar puntos en ambos tipos de token', () => {
        // Given
        const accessTokenValue = 'access.token.123';
        const refreshTokenValue = 'refresh.token.456789012345678901234567890';

        // When
        const accessToken = AccessToken.create(accessTokenValue);
        const refreshToken = RefreshToken.create(refreshTokenValue);

        // Then
        expect(accessToken.getValue()).toBe('access.token.123');
        expect(refreshToken.getValue()).toBe('refresh.token.456789012345678901234567890');
      });

      it('debe aceptar guiones en ambos tipos de token', () => {
        // Given
        const accessTokenValue = 'access-token-123';
        const refreshTokenValue = 'refresh.token.456789012345678901234567890';

        // When
        const accessToken = AccessToken.create(accessTokenValue);
        const refreshToken = RefreshToken.create(refreshTokenValue);

        // Then
        expect(accessToken.getValue()).toBe('access-token-123');
        expect(refreshToken.getValue()).toBe('refresh.token.456789012345678901234567890');
      });

      it('debe aceptar caracteres adicionales solo en refresh token', () => {
        // Given - caracteres que solo refresh token acepta
        const additionalChars = ['+', '/', '='];

        additionalChars.forEach((char) => {
          const refreshTokenValue = `refresh${char}token_abcdefghijklmnop12345678`;

          // When
          const refreshToken = RefreshToken.create(refreshTokenValue);

          // Then
          expect(refreshToken.getValue()).toBe(`refresh${char}token_abcdefghijklmnop12345678`);
        });
      });

      it('debe rechazar caracteres adicionales en access token', () => {
        // Given - caracteres que access token NO acepta
        const additionalChars = ['+', '/', '='];

        additionalChars.forEach((char) => {
          const accessTokenValue = `access${char}token`;

          // When & Then
          try {
            AccessToken.create(accessTokenValue);
            fail(`Expected ValidationError for access token with char: ${char}`);
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).hasFieldError('accessToken')).toBe(true);
          }
        });
      });
    });

    describe('Longitud de Tokens', () => {
      it('debe validar límites de longitud específicos para cada tipo de token', () => {
        // Access Token limits
        expect(TokenLength.ACCESS_TOKEN_MIN).toBeGreaterThan(0);
        expect(TokenLength.ACCESS_TOKEN_MAX).toBeGreaterThan(TokenLength.ACCESS_TOKEN_MIN);

        // Refresh Token limits
        expect(TokenLength.REFRESH_TOKEN_MIN).toBeGreaterThan(0);
        expect(TokenLength.REFRESH_TOKEN_MAX).toBeGreaterThan(TokenLength.REFRESH_TOKEN_MIN);

        // Access tokens pueden ser más largos que refresh tokens
        expect(TokenLength.ACCESS_TOKEN_MAX).toBeGreaterThanOrEqual(TokenLength.REFRESH_TOKEN_MAX);
      });
    });

    describe('Expiración de Access Tokens', () => {
      it('debe permitir tokens sin tiempo de expiración definido', () => {
        // Given
        const tokenValue = 'abcdefghijklmnop';

        // When
        const accessToken = AccessToken.create(tokenValue);

        // Then
        expect(accessToken).toBeInstanceOf(AccessToken);
        expect((accessToken as any).expSeconds).toBeUndefined();
      });

      it('debe validar que el tiempo de expiración es razonable', () => {
        // Given - tiempos de expiración típicos
        const validExpTimes = [300, 900, 3600, 7200, 86400]; // 5min to 1day

        validExpTimes.forEach((expTime) => {
          // When
          const accessToken = AccessToken.create('abcdefghijklmnop', expTime);

          // Then
          expect(accessToken).toBeInstanceOf(AccessToken);
          expect((accessToken as any).expSeconds).toBe(expTime);
        });
      });
    });
  });
});
