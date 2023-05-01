import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { type AuthToken, type TokenPayload } from 'src/entities';
import { RedisService } from 'src/redis/redis.service';
import { type CreateUserDto } from 'src/users/dto';
import { UsersService } from 'src/users/users.service';
import { compareHash, hashData } from 'src/utils';
import { v4 as uuidV4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: Logger,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
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
      password: await hashData(createUserDto.password),
    };

    const user = await this.usersService.create(data);

    const tokens = await this.getTokens(user.id.toString(), user.email);

    return tokens;
  }

  async login(): Promise<void> {}

  async logout(): Promise<void> {}

  async refreshAccessToken(
    refreshToken: string,
    payload: TokenPayload,
  ): Promise<string> {
    const sessionId = payload.sessionId;

    const storedRefreshToken = await this.redisService.get<string>(sessionId);

    if (
      storedRefreshToken === null ||
      !(await compareHash(refreshToken, storedRefreshToken))
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = payload.sub;
    const user = await this.usersService.findOne(parseInt(userId));
    const newPayload: TokenPayload = {
      sub: user.id.toString(),
      email: user.email,
      sessionId: payload.sessionId,
    };

    const accessToken = await this.generateAccessToken(newPayload);

    return accessToken;
  }

  private async getTokens(userId: string, email: string): Promise<AuthToken> {
    const sessionId = uuidV4();

    const payload: TokenPayload = {
      sub: userId,
      email,
      sessionId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload),
    ]).catch((e) => {
      this.logger.error(
        'JWT token async signing failed',
        e instanceof Error ? e.stack : undefined,
        AuthService.name,
      );
      throw e;
    });

    const hashedRefreshToken = await hashData(refreshToken);

    await this.redisService.set(
      sessionId,
      hashedRefreshToken,
      30 * 24 * 60 * 60,
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  private async generateAccessToken(payload: any): Promise<string> {
    return await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '5d',
    });
  }

  private async generateRefreshToken(payload: any): Promise<string> {
    return await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '30d',
    });
  }
}
