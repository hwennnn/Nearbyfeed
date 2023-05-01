import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { type TokenPayload } from 'src/entities';
import { type UserWithoutPassword } from 'src/users/entities/userWithoutPassword';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: TokenPayload): Promise<UserWithoutPassword | null> {
    const userId = payload.sub;

    return await this.usersService.findOne(parseInt(userId));
  }
}
