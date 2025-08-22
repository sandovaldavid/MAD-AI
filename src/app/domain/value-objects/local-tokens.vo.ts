/**
 * Represents secure token value objects for authentication and authorization in the MAD-AI system.
 *
 * @description
 * The LocalTokens module provides comprehensive token management functionality including
 * access tokens, refresh tokens, and session tokens. It implements security best practices
 * for token validation, lifecycle management, and secure handling of authentication credentials.
 *
 * @securityPrinciples
 * - Tokens are treated as opaque strings to maintain flexibility across token formats
 * - No sensitive token data is logged or exposed in error messages
 * - Token validation includes format checking, expiration handling, and security constraints
 * - Masking functionality protects tokens in logs and debugging scenarios
 * - Immutable value objects prevent accidental token modification
 *
 * @tokenTypes
 * - **Access Tokens**: Short-lived tokens for API access (typically 15-60 minutes)
 * - **Refresh Tokens**: Long-lived tokens for obtaining new access tokens (days to weeks)
 * - **Session Tokens**: Application-specific session identifiers
 * - **API Keys**: Long-lived tokens for service-to-service authentication
 *
 * @businessRules
 * - Access tokens must have expiration times for security
 * - Refresh tokens must be sufficiently long and random
 * - Token validation respects both format and temporal constraints
 * - All tokens must meet minimum security requirements
 * - Token masking preserves enough information for debugging while protecting secrets
 *
 * @example
 * ```typescript
 * // Create access token with expiration
 * const accessToken = AccessToken.create(
 *   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
 * );
 *
 * // Create refresh token
 * const refreshToken = RefreshToken.create('rf_1234567890abcdefghijk...');
 *
 * // Token validation
 * const now = Math.floor(Date.now() / 1000);
 * const isValid = accessToken.isValid(now);
 * const isExpired = accessToken.isExpired(now);
 *
 * // Secure logging
 * console.log(`Token: ${accessToken.masked()}`); // Safe for logs
 *
 * // Token container for complete authentication state
 * const tokenPair = TokenPair.create(accessToken, refreshToken);
 * const shouldRefresh = tokenPair.shouldRefresh(now, 300); // 5 minutes before expiry
 * ```
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */

import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';

/**
 * Represents a validated access token with optional expiration handling.
 *
 * @description
 * Access tokens are short-lived credentials used for API authentication. They are treated
 * as opaque strings to maintain compatibility with various token formats (JWT, random strings, etc.).
 * The class provides validation, expiration checking, and secure handling functionality.
 *
 * @securityFeatures
 * - Opaque string handling for format flexibility
 * - Expiration time validation and checking
 * - Secure masking for logging and debugging
 * - Immutable value object pattern
 * - Minimum length validation for security
 *
 * @example
 * ```typescript
 * // Create with JWT token
 * const jwtToken = AccessToken.create(
 *   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
 *   1672531200 // Unix timestamp
 * );
 *
 * // Create with API key (no expiration)
 * const apiKey = AccessToken.create('ak_1234567890abcdef');
 *
 * // Validation
 * const now = Math.floor(Date.now() / 1000);
 * console.log(jwtToken.isValid(now)); // true/false
 * console.log(jwtToken.isExpired(now)); // true/false
 * console.log(jwtToken.timeToExpiry(now)); // seconds until expiry
 *
 * // Secure handling
 * console.log(jwtToken.masked()); // Safe for logs
 * console.log(jwtToken.getSecurityLevel()); // HIGH/MEDIUM/LOW
 * ```
 */
export class AccessToken {
    private constructor(public readonly value: string, public readonly expSeconds?: number) {}

    /**
     * Creates a validated AccessToken instance.
     *
     * @param value - The token string value
     * @param expSeconds - Optional expiration time in Unix seconds
     * @returns A new AccessToken instance
     * @throws {ValidationError} When the token is invalid
     *
     * @example
     * ```typescript
     * const token = AccessToken.create('your-token-here', 1672531200);
     * const permanentToken = AccessToken.create('api-key-token');
     * ```
     */
    static create(value: string, expSeconds?: number): AccessToken {
        const errors: Array<{
            field: string;
            value: unknown;
            message: string;
            code?: ValidationErrorCode;
        }> = [];

        if (!value || typeof value !== 'string' || value.trim().length === 0) {
            errors.push({
                field: 'accessToken',
                value,
                message: 'Access token is required',
                code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            });
        } else {
            const trimmed = value.trim();

            if (!TokenSpecs.isValidTokenFormat(trimmed)) {
                errors.push({
                    field: 'accessToken',
                    value: trimmed,
                    message: 'Invalid token format',
                    code: ValidationErrorCode.FIELD_FORMAT_INVALID,
                });
            }

            if (trimmed.length < TokenSpecs.ACCESS_TOKEN_MIN_LENGTH) {
                errors.push({
                    field: 'accessToken',
                    value: trimmed,
                    message: `Access token must be at least ${TokenSpecs.ACCESS_TOKEN_MIN_LENGTH} characters`,
                    code: ValidationErrorCode.FIELD_TOO_SHORT,
                });
            }

            if (trimmed.length > TokenSpecs.ACCESS_TOKEN_MAX_LENGTH) {
                errors.push({
                    field: 'accessToken',
                    value: trimmed,
                    message: `Access token cannot exceed ${TokenSpecs.ACCESS_TOKEN_MAX_LENGTH} characters`,
                    code: ValidationErrorCode.FIELD_TOO_LONG,
                });
            }
        }

        if (expSeconds !== undefined) {
            if (!Number.isInteger(expSeconds) || expSeconds <= 0) {
                errors.push({
                    field: 'expSeconds',
                    value: expSeconds,
                    message: 'Expiration time must be a positive integer',
                    code: ValidationErrorCode.FIELD_FORMAT_INVALID,
                });
            }
        }

        if (errors.length > 0) {
            throw ValidationError.createFromFields(errors);
        }

        return new AccessToken(value.trim(), expSeconds);
    }

    /**
     * Checks if the token is expired at the given time.
     *
     * @param nowEpochSeconds - Current time in Unix seconds
     * @returns True if the token is expired
     *
     * @example
     * ```typescript
     * const now = Math.floor(Date.now() / 1000);
     * if (token.isExpired(now)) {
     *   console.log('Token has expired');
     * }
     * ```
     */
    isExpired(nowEpochSeconds: number): boolean {
        return this.expSeconds ? this.expSeconds <= nowEpochSeconds : false;
    }

    /**
     * Checks if the token is valid (exists and not expired).
     *
     * @param nowEpochSeconds - Current time in Unix seconds
     * @returns True if the token is valid
     *
     * @example
     * ```typescript
     * const now = Math.floor(Date.now() / 1000);
     * if (token.isValid(now)) {
     *   // Token can be used for authentication
     *   await makeAuthenticatedRequest(token.value);
     * }
     * ```
     */
    isValid(nowEpochSeconds: number): boolean {
        return !!this.value && (!this.expSeconds || this.expSeconds > nowEpochSeconds);
    }

    /**
     * Gets the time remaining until token expiration.
     *
     * @param nowEpochSeconds - Current time in Unix seconds
     * @returns Seconds until expiration (0 if expired or no expiration)
     *
     * @example
     * ```typescript
     * const now = Math.floor(Date.now() / 1000);
     * const timeLeft = token.timeToExpiry(now);
     * if (timeLeft < 300) { // Less than 5 minutes
     *   console.log('Token expires soon, consider refreshing');
     * }
     * ```
     */
    timeToExpiry(nowEpochSeconds: number): number {
        if (!this.expSeconds) return Infinity;
        return Math.max(0, this.expSeconds - nowEpochSeconds);
    }

    /**
     * Checks if the token should be refreshed based on a threshold.
     *
     * @param nowEpochSeconds - Current time in Unix seconds
     * @param refreshThresholdSeconds - Seconds before expiry to trigger refresh
     * @returns True if the token should be refreshed
     *
     * @example
     * ```typescript
     * const now = Math.floor(Date.now() / 1000);
     * if (token.shouldRefresh(now, 300)) { // 5 minutes threshold
     *   await refreshTokens();
     * }
     * ```
     */
    shouldRefresh(nowEpochSeconds: number, refreshThresholdSeconds: number = 300): boolean {
        if (!this.expSeconds) return false;
        return this.timeToExpiry(nowEpochSeconds) <= refreshThresholdSeconds;
    }

    /**
     * Returns a masked version of the token for safe logging.
     *
     * @param prefixLength - Number of characters to show at the start
     * @param suffixLength - Number of characters to show at the end
     * @returns Masked token string
     *
     * @example
     * ```typescript
     * console.log(`Token: ${token.masked()}`); // "eyJh****ssw5c"
     * console.log(`Token: ${token.masked(8, 8)}`); // "eyJhbGci****adQssw5c"
     * ```
     */
    masked(prefixLength: number = 4, suffixLength: number = 4): string {
        return TokenUtils.maskToken(this.value, prefixLength, suffixLength);
    }

    /**
     * Gets the security level of the token based on its characteristics.
     *
     * @returns Security level assessment
     *
     * @example
     * ```typescript
     * const level = token.getSecurityLevel();
     * if (level === 'LOW') {
     *   console.warn('Token has low security characteristics');
     * }
     * ```
     */
    getSecurityLevel(): 'HIGH' | 'MEDIUM' | 'LOW' {
        return TokenUtils.assessTokenSecurity(this.value);
    }

    /**
     * Gets token metadata for analysis and monitoring.
     *
     * @param nowEpochSeconds - Current time in Unix seconds
     * @returns Token metadata object
     *
     * @example
     * ```typescript
     * const metadata = token.getMetadata(Math.floor(Date.now() / 1000));
     * console.log(metadata.isValid); // true/false
     * console.log(metadata.type); // 'JWT' | 'OPAQUE' | 'API_KEY'
     * ```
     */
    getMetadata(nowEpochSeconds: number): {
        isValid: boolean;
        isExpired: boolean;
        hasExpiration: boolean;
        timeToExpiry: number;
        securityLevel: string;
        type: string;
        length: number;
    } {
        return {
            isValid: this.isValid(nowEpochSeconds),
            isExpired: this.isExpired(nowEpochSeconds),
            hasExpiration: !!this.expSeconds,
            timeToExpiry: this.timeToExpiry(nowEpochSeconds),
            securityLevel: this.getSecurityLevel(),
            type: TokenUtils.detectTokenType(this.value),
            length: this.value.length,
        };
    }

    /**
     * Checks if this token equals another token.
     *
     * @param other - The other AccessToken to compare with
     * @returns True if tokens are equal
     */
    equals(other: AccessToken): boolean {
        return this.value === other.value && this.expSeconds === other.expSeconds;
    }

    /**
     * Converts the token to a string representation.
     * Note: This returns the masked version for security.
     *
     * @returns Masked token string
     */
    toString(): string {
        return this.masked();
    }
}

/**
 * Represents a validated refresh token for obtaining new access tokens.
 *
 * @description
 * Refresh tokens are long-lived credentials used to obtain new access tokens without
 * requiring user re-authentication. They are typically more secure and have longer
 * lifespans than access tokens.
 *
 * @securityFeatures
 * - Longer minimum length requirements for enhanced security
 * - Secure masking for logging protection
 * - Format validation to ensure token quality
 * - Entropy analysis for security assessment
 * - Immutable value object pattern
 *
 * @example
 * ```typescript
 * // Create refresh token
 * const refreshToken = RefreshToken.create('rf_1234567890abcdefghijklmnopqrstuvwxyz');
 *
 * // Validation
 * console.log(refreshToken.isValid()); // true/false
 * console.log(refreshToken.getSecurityLevel()); // HIGH/MEDIUM/LOW
 *
 * // Secure handling
 * console.log(refreshToken.masked()); // Safe for logs
 *
 * // Rotation detection
 * const newToken = RefreshToken.create('rf_new_token_value');
 * console.log(refreshToken.isRotationOf(newToken)); // false
 * ```
 */
export class RefreshToken {
    private constructor(public readonly value: string) {}

    /**
     * Creates a validated RefreshToken instance.
     *
     * @param value - The refresh token string value
     * @param minLength - Minimum required length (default from specs)
     * @returns A new RefreshToken instance
     * @throws {ValidationError} When the token is invalid
     *
     * @example
     * ```typescript
     * const token = RefreshToken.create('rf_your_refresh_token_here');
     * const customToken = RefreshToken.create('custom_token', 32);
     * ```
     */
    static create(value: string, minLength?: number): RefreshToken {
        const errors: Array<{
            field: string;
            value: unknown;
            message: string;
            code?: ValidationErrorCode;
        }> = [];

        const requiredLength = minLength || TokenSpecs.REFRESH_TOKEN_MIN_LENGTH;

        if (!value || typeof value !== 'string' || value.trim().length === 0) {
            errors.push({
                field: 'refreshToken',
                value,
                message: 'Refresh token is required',
                code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            });
        } else {
            const trimmed = value.trim();

            if (!TokenSpecs.isValidTokenFormat(trimmed)) {
                errors.push({
                    field: 'refreshToken',
                    value: trimmed,
                    message: 'Invalid refresh token format',
                    code: ValidationErrorCode.FIELD_FORMAT_INVALID,
                });
            }

            if (trimmed.length < requiredLength) {
                errors.push({
                    field: 'refreshToken',
                    value: trimmed,
                    message: `Refresh token must be at least ${requiredLength} characters`,
                    code: ValidationErrorCode.FIELD_TOO_SHORT,
                });
            }

            if (trimmed.length > TokenSpecs.REFRESH_TOKEN_MAX_LENGTH) {
                errors.push({
                    field: 'refreshToken',
                    value: trimmed,
                    message: `Refresh token cannot exceed ${TokenSpecs.REFRESH_TOKEN_MAX_LENGTH} characters`,
                    code: ValidationErrorCode.FIELD_TOO_LONG,
                });
            }

            if (!TokenSpecs.hasMinimumEntropy(trimmed)) {
                errors.push({
                    field: 'refreshToken',
                    value: trimmed,
                    message: 'Refresh token does not meet entropy requirements',
                    code: ValidationErrorCode.FIELD_FORMAT_INVALID,
                });
            }
        }

        if (errors.length > 0) {
            throw ValidationError.createFromFields(errors);
        }

        return new RefreshToken(value.trim());
    }

    /**
     * Validates the refresh token format and security characteristics.
     *
     * @param minLength - Minimum length requirement
     * @returns True if the token is valid
     *
     * @example
     * ```typescript
     * if (refreshToken.isValid()) {
     *   await useRefreshToken(refreshToken.value);
     * }
     * ```
     */
    isValid(minLength?: number): boolean {
        const requiredLength = minLength || TokenSpecs.REFRESH_TOKEN_MIN_LENGTH;
        return (
            this.value.length >= requiredLength &&
            TokenSpecs.isValidTokenFormat(this.value) &&
            TokenSpecs.hasMinimumEntropy(this.value)
        );
    }

    /**
     * Returns a masked version of the refresh token for safe logging.
     *
     * @param prefixLength - Number of characters to show at the start
     * @param suffixLength - Number of characters to show at the end
     * @returns Masked token string
     *
     * @example
     * ```typescript
     * console.log(`Refresh token: ${refreshToken.masked()}`);
     * ```
     */
    masked(prefixLength: number = 4, suffixLength: number = 4): string {
        return TokenUtils.maskToken(this.value, prefixLength, suffixLength);
    }

    /**
     * Gets the security level of the refresh token.
     *
     * @returns Security level assessment
     *
     * @example
     * ```typescript
     * const level = refreshToken.getSecurityLevel();
     * if (level !== 'HIGH') {
     *   console.warn('Refresh token should have higher security');
     * }
     * ```
     */
    getSecurityLevel(): 'HIGH' | 'MEDIUM' | 'LOW' {
        return TokenUtils.assessTokenSecurity(this.value);
    }

    /**
     * Checks if this token might be a rotation of another token.
     *
     * @param other - Another refresh token to compare with
     * @returns True if tokens might be related through rotation
     *
     * @example
     * ```typescript
     * if (oldToken.isRotationOf(newToken)) {
     *   console.log('Token appears to be rotated');
     * }
     * ```
     */
    isRotationOf(other: RefreshToken): boolean {
        // Simple heuristic: different values but similar characteristics
        if (this.value === other.value) return false;

        const thisType = TokenUtils.detectTokenType(this.value);
        const otherType = TokenUtils.detectTokenType(other.value);

        return thisType === otherType && Math.abs(this.value.length - other.value.length) <= 5;
    }

    /**
     * Gets refresh token metadata for analysis.
     *
     * @returns Token metadata object
     *
     * @example
     * ```typescript
     * const metadata = refreshToken.getMetadata();
     * console.log(metadata.entropy); // Entropy score
     * console.log(metadata.type); // Token type
     * ```
     */
    getMetadata(): {
        isValid: boolean;
        securityLevel: string;
        type: string;
        length: number;
        entropy: number;
        hasPrefix: boolean;
    } {
        return {
            isValid: this.isValid(),
            securityLevel: this.getSecurityLevel(),
            type: TokenUtils.detectTokenType(this.value),
            length: this.value.length,
            entropy: TokenUtils.calculateEntropy(this.value),
            hasPrefix: this.value.includes('_') || this.value.includes('-'),
        };
    }

    /**
     * Checks if this refresh token equals another.
     *
     * @param other - The other RefreshToken to compare with
     * @returns True if tokens are equal
     */
    equals(other: RefreshToken): boolean {
        return this.value === other.value;
    }

    /**
     * Converts the token to a string representation.
     * Note: This returns the masked version for security.
     *
     * @returns Masked token string
     */
    toString(): string {
        return this.masked();
    }
}

/**
 * Represents a complete token pair for authentication workflows.
 *
 * @description
 * TokenPair combines access and refresh tokens into a single cohesive unit for
 * managing complete authentication state. It provides convenience methods for
 * token lifecycle management, validation, and refresh operations.
 *
 * @example
 * ```typescript
 * const accessToken = AccessToken.create('access_token', expiry);
 * const refreshToken = RefreshToken.create('refresh_token');
 * const tokenPair = TokenPair.create(accessToken, refreshToken);
 *
 * // Check if refresh is needed
 * const now = Math.floor(Date.now() / 1000);
 * if (tokenPair.shouldRefresh(now)) {
 *   const newPair = await refreshTokens(tokenPair.refresh);
 * }
 * ```
 */
export class TokenPair {
    private constructor(
        public readonly access: AccessToken,
        public readonly refresh: RefreshToken
    ) {}

    /**
     * Creates a TokenPair from access and refresh tokens.
     *
     * @param access - The access token
     * @param refresh - The refresh token
     * @returns A new TokenPair instance
     *
     * @example
     * ```typescript
     * const pair = TokenPair.create(accessToken, refreshToken);
     * ```
     */
    static create(access: AccessToken, refresh: RefreshToken): TokenPair {
        return new TokenPair(access, refresh);
    }

    /**
     * Creates a TokenPair from string values.
     *
     * @param accessValue - Access token string
     * @param refreshValue - Refresh token string
     * @param accessExpiry - Access token expiry time
     * @returns A new TokenPair instance
     *
     * @example
     * ```typescript
     * const pair = TokenPair.fromValues('access_token', 'refresh_token', 1672531200);
     * ```
     */
    static fromValues(accessValue: string, refreshValue: string, accessExpiry?: number): TokenPair {
        const accessToken = AccessToken.create(accessValue, accessExpiry);
        const refreshToken = RefreshToken.create(refreshValue);
        return new TokenPair(accessToken, refreshToken);
    }

    /**
     * Checks if the token pair is valid.
     *
     * @param nowEpochSeconds - Current time in Unix seconds
     * @returns True if both tokens are valid
     *
     * @example
     * ```typescript
     * const now = Math.floor(Date.now() / 1000);
     * if (tokenPair.isValid(now)) {
     *   // Both tokens are valid
     * }
     * ```
     */
    isValid(nowEpochSeconds: number): boolean {
        return this.access.isValid(nowEpochSeconds) && this.refresh.isValid();
    }

    /**
     * Checks if the access token should be refreshed.
     *
     * @param nowEpochSeconds - Current time in Unix seconds
     * @param thresholdSeconds - Seconds before expiry to trigger refresh
     * @returns True if refresh is recommended
     *
     * @example
     * ```typescript
     * const now = Math.floor(Date.now() / 1000);
     * if (tokenPair.shouldRefresh(now, 300)) { // 5 minutes
     *   await performTokenRefresh();
     * }
     * ```
     */
    shouldRefresh(nowEpochSeconds: number, thresholdSeconds: number = 300): boolean {
        return this.access.shouldRefresh(nowEpochSeconds, thresholdSeconds);
    }

    /**
     * Gets the overall security level of the token pair.
     *
     * @returns The lower of the two token security levels
     *
     * @example
     * ```typescript
     * const level = tokenPair.getSecurityLevel();
     * if (level === 'LOW') {
     *   console.warn('Token pair has low security');
     * }
     * ```
     */
    getSecurityLevel(): 'HIGH' | 'MEDIUM' | 'LOW' {
        const accessLevel = this.access.getSecurityLevel();
        const refreshLevel = this.refresh.getSecurityLevel();

        // Return the lower security level
        if (accessLevel === 'LOW' || refreshLevel === 'LOW') return 'LOW';
        if (accessLevel === 'MEDIUM' || refreshLevel === 'MEDIUM') return 'MEDIUM';
        return 'HIGH';
    }

    /**
     * Gets masked representations of both tokens for safe logging.
     *
     * @returns Object with masked token values
     *
     * @example
     * ```typescript
     * const masked = tokenPair.masked();
     * console.log(`Access: ${masked.access}, Refresh: ${masked.refresh}`);
     * ```
     */
    masked(): { access: string; refresh: string } {
        return {
            access: this.access.masked(),
            refresh: this.refresh.masked(),
        };
    }

    /**
     * Converts token pair to a plain object for serialization.
     *
     * @returns Plain object representation
     *
     * @example
     * ```typescript
     * const data = tokenPair.toPlainObject();
     * localStorage.setItem('tokens', JSON.stringify(data));
     * ```
     */
    toPlainObject(): {
        accessToken: string;
        refreshToken: string;
        accessExpiry?: number;
    } {
        return {
            accessToken: this.access.value,
            refreshToken: this.refresh.value,
            accessExpiry: this.access.expSeconds,
        };
    }

    /**
     * Checks if this token pair equals another.
     *
     * @param other - The other TokenPair to compare with
     * @returns True if both token pairs are equal
     */
    equals(other: TokenPair): boolean {
        return this.access.equals(other.access) && this.refresh.equals(other.refresh);
    }
}

/**
 * Namespace containing token specifications and validation rules.
 *
 * @namespace TokenSpecs
 */
export namespace TokenSpecs {
    /**
     * Minimum length requirements for different token types.
     */
    export const ACCESS_TOKEN_MIN_LENGTH = 16;
    export const REFRESH_TOKEN_MIN_LENGTH = 32;
    export const API_KEY_MIN_LENGTH = 24;

    /**
     * Maximum length limits for token types.
     */
    export const ACCESS_TOKEN_MAX_LENGTH = 8192; // Large JWT tokens
    export const REFRESH_TOKEN_MAX_LENGTH = 512;
    export const API_KEY_MAX_LENGTH = 256;

    /**
     * Token format validation patterns.
     */
    export const TOKEN_FORMAT_PATTERNS = {
        JWT: /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
        BASE64: /^[A-Za-z0-9+/]+=*$/,
        HEX: /^[a-fA-F0-9]+$/,
        PREFIXED: /^[a-z]{2,6}_[A-Za-z0-9_-]{8,}$/,
        ALPHANUMERIC: /^[A-Za-z0-9_-]+$/,
    } as const;

    /**
     * Entropy thresholds for security assessment.
     */
    export const ENTROPY_THRESHOLDS = {
        HIGH: 4.5,
        MEDIUM: 3.5,
        LOW: 2.5,
    } as const;

    /**
     * Validates basic token format.
     *
     * @param token - Token string to validate
     * @returns True if format is valid
     */
    export function isValidTokenFormat(token: string): boolean {
        // Must contain only valid characters and have reasonable structure
        return (
            TOKEN_FORMAT_PATTERNS.ALPHANUMERIC.test(token) ||
            TOKEN_FORMAT_PATTERNS.JWT.test(token) ||
            TOKEN_FORMAT_PATTERNS.PREFIXED.test(token)
        );
    }

    /**
     * Checks if token has minimum entropy for security.
     *
     * @param token - Token string to check
     * @returns True if entropy is sufficient
     */
    export function hasMinimumEntropy(token: string): boolean {
        const entropy = TokenUtils.calculateEntropy(token);
        return entropy >= ENTROPY_THRESHOLDS.LOW;
    }

    /**
     * Gets security requirements for different token types.
     *
     * @param tokenType - Type of token
     * @returns Security requirements object
     */
    export function getSecurityRequirements(tokenType: 'access' | 'refresh' | 'api'): {
        minLength: number;
        maxLength: number;
        minEntropy: number;
        requiresExpiry: boolean;
    } {
        switch (tokenType) {
            case 'access':
                return {
                    minLength: ACCESS_TOKEN_MIN_LENGTH,
                    maxLength: ACCESS_TOKEN_MAX_LENGTH,
                    minEntropy: ENTROPY_THRESHOLDS.MEDIUM,
                    requiresExpiry: true,
                };
            case 'refresh':
                return {
                    minLength: REFRESH_TOKEN_MIN_LENGTH,
                    maxLength: REFRESH_TOKEN_MAX_LENGTH,
                    minEntropy: ENTROPY_THRESHOLDS.HIGH,
                    requiresExpiry: false,
                };
            case 'api':
                return {
                    minLength: API_KEY_MIN_LENGTH,
                    maxLength: API_KEY_MAX_LENGTH,
                    minEntropy: ENTROPY_THRESHOLDS.HIGH,
                    requiresExpiry: false,
                };
            default:
                throw new Error(`Unknown token type: ${tokenType}`);
        }
    }
}

/**
 * Namespace containing token utility functions.
 *
 * @namespace TokenUtils
 */
export namespace TokenUtils {
    /**
     * Masks a token for safe logging and display.
     *
     * @param token - Token to mask
     * @param prefixLength - Characters to show at start
     * @param suffixLength - Characters to show at end
     * @returns Masked token string
     */
    export function maskToken(
        token: string,
        prefixLength: number = 4,
        suffixLength: number = 4
    ): string {
        if (token.length <= prefixLength + suffixLength) {
            return '*'.repeat(Math.max(8, token.length));
        }

        const prefix = token.slice(0, prefixLength);
        const suffix = token.slice(-suffixLength);
        const middleLength = Math.max(4, token.length - prefixLength - suffixLength);

        return `${prefix}${'*'.repeat(middleLength)}${suffix}`;
    }

    /**
     * Calculates the entropy of a token string.
     *
     * @param token - Token to analyze
     * @returns Entropy value (bits per character)
     */
    export function calculateEntropy(token: string): number {
        if (!token || token.length === 0) return 0;

        const charCounts = new Map<string, number>();
        for (const char of token) {
            charCounts.set(char, (charCounts.get(char) || 0) + 1);
        }

        let entropy = 0;
        const length = token.length;

        for (const count of charCounts.values()) {
            const probability = count / length;
            entropy -= probability * Math.log2(probability);
        }

        return entropy;
    }

    /**
     * Assesses the security level of a token based on its characteristics.
     *
     * @param token - Token to assess
     * @returns Security level assessment
     */
    export function assessTokenSecurity(token: string): 'HIGH' | 'MEDIUM' | 'LOW' {
        const entropy = calculateEntropy(token);
        const length = token.length;
        const hasSpecialChars = /[_\-.]/.test(token);
        const hasNumbers = /\d/.test(token);
        const hasLowerCase = /[a-z]/.test(token);
        const hasUpperCase = /[A-Z]/.test(token);

        let score = 0;

        // Entropy scoring
        if (entropy >= TokenSpecs.ENTROPY_THRESHOLDS.HIGH) score += 3;
        else if (entropy >= TokenSpecs.ENTROPY_THRESHOLDS.MEDIUM) score += 2;
        else if (entropy >= TokenSpecs.ENTROPY_THRESHOLDS.LOW) score += 1;

        // Length scoring
        if (length >= 64) score += 2;
        else if (length >= 32) score += 1;

        // Character diversity scoring
        if (hasSpecialChars) score += 1;
        if (hasNumbers) score += 1;
        if (hasLowerCase && hasUpperCase) score += 1;

        if (score >= 6) return 'HIGH';
        if (score >= 4) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * Detects the likely type of a token based on its format.
     *
     * @param token - Token to analyze
     * @returns Detected token type
     */
    export function detectTokenType(token: string): 'JWT' | 'OPAQUE' | 'API_KEY' | 'RANDOM' {
        if (TokenSpecs.TOKEN_FORMAT_PATTERNS.JWT.test(token)) {
            return 'JWT';
        }

        if (TokenSpecs.TOKEN_FORMAT_PATTERNS.PREFIXED.test(token)) {
            return 'API_KEY';
        }

        if (TokenSpecs.TOKEN_FORMAT_PATTERNS.BASE64.test(token) && token.length > 20) {
            return 'OPAQUE';
        }

        return 'RANDOM';
    }

    /**
     * Validates token strength according to security policies.
     *
     * @param token - Token to validate
     * @param requirements - Security requirements to check against
     * @returns Validation result with details
     */
    export function validateTokenStrength(
        token: string,
        requirements: {
            minLength?: number;
            minEntropy?: number;
            requiredChars?: string[];
            forbiddenPatterns?: RegExp[];
        }
    ): {
        isValid: boolean;
        issues: string[];
        securityLevel: string;
    } {
        const issues: string[] = [];

        if (requirements.minLength && token.length < requirements.minLength) {
            issues.push(`Token too short (minimum ${requirements.minLength} characters)`);
        }

        if (requirements.minEntropy) {
            const entropy = calculateEntropy(token);
            if (entropy < requirements.minEntropy) {
                issues.push(
                    `Insufficient entropy (${entropy.toFixed(2)} < ${requirements.minEntropy})`
                );
            }
        }

        if (requirements.requiredChars) {
            for (const charType of requirements.requiredChars) {
                if (!token.includes(charType)) {
                    issues.push(`Missing required character type: ${charType}`);
                }
            }
        }

        if (requirements.forbiddenPatterns) {
            for (const pattern of requirements.forbiddenPatterns) {
                if (pattern.test(token)) {
                    issues.push(`Token matches forbidden pattern: ${pattern.source}`);
                }
            }
        }

        return {
            isValid: issues.length === 0,
            issues,
            securityLevel: assessTokenSecurity(token),
        };
    }

    /**
     * Generates a summary of token characteristics for monitoring.
     *
     * @param tokens - Array of tokens to analyze
     * @returns Statistical summary
     */
    export function generateTokenSummary(tokens: string[]): {
        totalTokens: number;
        averageLength: number;
        averageEntropy: number;
        typeDistribution: Record<string, number>;
        securityDistribution: Record<string, number>;
    } {
        if (tokens.length === 0) {
            return {
                totalTokens: 0,
                averageLength: 0,
                averageEntropy: 0,
                typeDistribution: {},
                securityDistribution: {},
            };
        }

        let totalLength = 0;
        let totalEntropy = 0;
        const typeDistribution: Record<string, number> = {};
        const securityDistribution: Record<string, number> = {};

        for (const token of tokens) {
            totalLength += token.length;
            totalEntropy += calculateEntropy(token);

            const type = detectTokenType(token);
            typeDistribution[type] = (typeDistribution[type] || 0) + 1;

            const security = assessTokenSecurity(token);
            securityDistribution[security] = (securityDistribution[security] || 0) + 1;
        }

        return {
            totalTokens: tokens.length,
            averageLength: Math.round(totalLength / tokens.length),
            averageEntropy: Number((totalEntropy / tokens.length).toFixed(2)),
            typeDistribution,
            securityDistribution,
        };
    }
}
