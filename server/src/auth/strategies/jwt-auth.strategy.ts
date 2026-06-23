import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { type TokenPayload, type TokenUser } from 'src/auth/entities';
import { getJwtSecret } from 'src/auth/jwt-config';

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: getJwtSecret(configService, 'JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: TokenPayload): Promise<TokenUser> {
    return {
      userId: payload.sub,
      email: payload.email,
      sessionId: payload.sessionId,
    };
  }
}
