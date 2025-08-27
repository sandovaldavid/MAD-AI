import { AccessToken, RefreshToken, TokenPair } from '../value-objects/local-tokens.vo';
import { BusinessRuleError } from '../errors/business-rule-error.entity';
import { TokenFormat } from '../enums/token-format.enum';

/**
 * Domain Service: Token generation and validation
 */
export class TokenService {
  static generatePair(payload: object): TokenPair {
    const accessToken = AccessToken.create('access_' + Math.random().toString(36).slice(2));
    const refreshToken = RefreshToken.create('refresh_' + Math.random().toString(36).slice(2));
    if (!accessToken || !refreshToken) {
      throw BusinessRuleError.invalidPreferencesUpdate({ payload });
    }
    return new TokenPair(accessToken, refreshToken);
  }

  static validateFormat(token: string): TokenFormat {
    if (token.startsWith('access_')) return TokenFormat.JWT;
    if (token.startsWith('refresh_')) return TokenFormat.JWT;
    throw new BusinessRuleError('Unknown token format', 'TOKEN_FORMAT_UNKNOWN', { token });
  }
}
