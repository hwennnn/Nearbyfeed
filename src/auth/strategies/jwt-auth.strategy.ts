import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { type TokenPayload, type TokenUser } from 'src/auth/entities';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: TokenPayload): Promise<TokenUser> {
    const storedRefreshToken = await this.redisService.get<string>(
      payload.sessionId,
    );

    if (storedRefreshToken === null) {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      sessionId: payload.sessionId,
    };
  }
}
