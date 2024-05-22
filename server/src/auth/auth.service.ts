import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { type AuthDto, type ResetPasswordDto } from 'src/auth/dto';
import {
  type AuthToken,
  type LoginResult,
  type TokenPayload,
} from 'src/auth/entities';
import { MailService } from 'src/mail/mail.service';
import { RedisService } from 'src/redis/redis.service';
import { type CreateUserDto } from 'src/users/dto';
import {
  type PendingUserWithoutPassword,
  type UserWithoutPassword,
} from 'src/users/entities';

import { UsersService } from 'src/users/users.service';
import { compareHash, dayInMs, hashData } from 'src/utils';
import { v4 as uuidV4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: Logger,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) {}

  async register(
    createUserDto: CreateUserDto,
  ): Promise<PendingUserWithoutPassword> {
    const userExists = await this.usersService.isUserExistByEmail(
      createUserDto.email,
    );

    if (userExists) {
      throw new BadRequestException(
        'Email is already in use. Please use another email.',
      );
    }

    const data = {
      ...createUserDto,
      password: await hashData(createUserDto.password),
    };

    const pendingUser = await this.usersService.createPendingUser(data);

    await this.mailService.sendVerificationEmail(
      pendingUser.email,
      pendingUser.username,
      pendingUser.id,
    );

    return pendingUser;
  }

  async login(authDto: AuthDto): Promise<LoginResult> {
    const user = await this.usersService.findOneByEmail(authDto.email);
    const hasPendingUser = await this.usersService.findPendingUsersWithEmail(
      authDto.email,
    );

    if (user === null && hasPendingUser) {
      throw new ForbiddenException(
        'Please verify your email address before proceeding. You are unable to log in with unverified credentials',
      );
    }

    if (
      user === null ||
      !(await compareHash(authDto.password, user.password))
    ) {
      throw new ForbiddenException('Invalid credentials');
    }

    const tokens = await this.getTokens(user.id.toString(), user.email);

    return {
      tokens,
      user,
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.redisService.delete(sessionId).catch((e) => {
      this.logger.error(
        'Failed to remove refresh token',
        e instanceof Error ? e.stack : undefined,
        AuthService.name,
      );

      throw new ForbiddenException('Invalid credentials');
    });
  }

  async verifyEmail(id: string): Promise<UserWithoutPassword> {
    const pendingUser = await this.usersService.findPendingUser(id);
    console.log(pendingUser?.email, new Date().getTime());

    if (pendingUser === null) {
      throw new BadRequestException('Invalid email verification link');
    }

    const now = new Date();
    const hasExpired =
      now.getTime() - pendingUser.createdAt.getTime() > dayInMs;

    if (hasExpired) {
      throw new BadRequestException(
        'The verification link has already expired',
      );
    }

    const userExists = await this.usersService.isUserExistByEmail(
      pendingUser.email,
    );

    if (userExists) {
      throw new BadRequestException(
        'Email is already in use. Please use another email.',
      );
    }

    const createUserDto: CreateUserDto = {
      email: pendingUser.email,
      username: pendingUser.username,
      password: pendingUser.password,
    };
    const user = await this.usersService.createUser(createUserDto);
    await this.usersService.deletePendingUser(id);

    return user;
  }

  async refreshTokens(
    refreshToken: string,
    payload: TokenPayload,
  ): Promise<AuthToken> {
    const sessionId = payload.sessionId;

    const storedRefreshToken = await this.redisService.get<string>(sessionId);

    if (
      storedRefreshToken === null ||
      !(await compareHash(refreshToken, storedRefreshToken))
    ) {
      throw new ForbiddenException('Invalid refresh token');
    }

    const userId = payload.sub;
    const user = await this.usersService.findOne(parseInt(userId));

    // Delete the old refresh token stored in the redis
    await this.redisService.delete(sessionId);

    return await this.getTokens(user.id.toString(), user.email);
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

      throw new BadRequestException('Failed to generate tokens');
    });

    const hashedRefreshToken = await hashData(refreshToken);

    await this.redisService.set(sessionId, hashedRefreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async generateAccessToken(payload: any): Promise<string> {
    return await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '5m',
    });
  }

  private async generateRefreshToken(payload: any): Promise<string> {
    return await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      // the jwt refresh token will not be expired (Refresh token rotation)
    });
  }

  async sendResetPasswordEmail(email: string): Promise<void> {
    const user = await this.usersService.findOneByEmail(email);

    if (user === null) {
      return;
    }

    const resetPasswordId = uuidV4();

    await this.redisService.set(
      `reset-password/${resetPasswordId}`,
      user.email,
      dayInMs, // valid for 1 day
    );

    await this.mailService.sendResetPasswordEmail(
      user.email,
      user.username,
      resetPasswordId,
    );
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const key = `reset-password/${resetPasswordDto.token}`;
    const storedEmail = await this.redisService.get<string>(key);

    if (storedEmail === null) {
      throw new ForbiddenException('Token is not valid or already expired');
    }

    const user = await this.usersService.findOneByEmail(storedEmail);

    if (user === null) {
      throw new ForbiddenException('User not found');
    }

    if (await compareHash(resetPasswordDto.newPassword, user.password)) {
      throw new BadRequestException(
        'New password cannot be the same as the old password.',
      );
    }

    await this.usersService.updatePassword(
      user.id,
      await hashData(resetPasswordDto.newPassword),
    );

    await this.redisService.delete(key);
  }

  async checkResetPasswordToken(token: string): Promise<void> {
    const key = `reset-password/${token}`;
    const storedEmail = await this.redisService.get<string>(key);

    if (storedEmail === null) {
      throw new ForbiddenException('Token is not valid or already expired');
    }

    const user = await this.usersService.findOneByEmail(storedEmail);

    if (user === null) {
      throw new ForbiddenException('User not found');
    }
  }
}
