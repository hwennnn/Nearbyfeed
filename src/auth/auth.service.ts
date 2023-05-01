import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { type AuthToken } from 'src/entities';
import { type CreateUserDto } from 'src/users/dto';
import { UsersService } from 'src/users/users.service';
import { hashPassword } from 'src/utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: Logger,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<AuthToken> {
    const userExists = await this.usersService.isUserExistByEmail(
      createUserDto.email,
    );

    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    const data = {
      ...createUserDto,
      password: await hashPassword(createUserDto.password),
    };

    const user = await this.usersService.create(data);

    const tokens = await this.getTokens(user.id.toString(), user.email);

    return tokens;
  }

  private async getTokens(userId: string, email: string): Promise<AuthToken> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]).catch((e) => {
      this.logger.error(
        'JWT token async signing failed',
        e instanceof Error ? e.stack : undefined,
        AuthService.name,
      );
      throw e;
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
