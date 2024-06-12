import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  type AuthDto,
  type ResetPasswordDto,
  type VerifyEmailDto,
} from 'src/auth/dto';
import {
  type AuthToken,
  type GoogleUserProfile,
  type LoginResult,
  type TokenPayload,
} from 'src/auth/entities';
import { GOOGLE_API_USER_INFO_URL } from 'src/constants';
import { MailService } from 'src/mail/mail.service';
import { RedisService } from 'src/redis/redis.service';
import { type CreateUserDto } from 'src/users/dto';
import { type PendingUserWithoutPassword } from 'src/users/entities';

import { UsersService } from 'src/users/users.service';
import { compareHash, dayInMs, generateOTP, hashData } from 'src/utils';
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

  async register(createUserDto: CreateUserDto): Promise<{
    sessionId: string;
    pendingUser: PendingUserWithoutPassword;
  }> {
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
    const { sessionId, otpCode } = await this.generateVerifyEmailOtp(
      pendingUser.email,
    );

    await this.mailService.sendVerificationEmail(
      pendingUser.email,
      pendingUser.username,
      otpCode,
    );

    return {
      sessionId,
      pendingUser,
    };
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

    if (user?.password === null) {
      throw new ForbiddenException('User does not have a password');
    }

    if (
      user === null ||
      !(await compareHash(authDto.password, user.password))
    ) {
      throw new ForbiddenException('Invalid credentials');
    }

    if (user.isDeleted) {
      throw new BadRequestException('User is deleted');
    }

    const tokens = await this.getTokens(user.id.toString(), user.email);

    return {
      tokens,
      user,
    };
  }

  async loginWithGoogle(token: string): Promise<LoginResult> {
    try {
      const response = await fetch(GOOGLE_API_USER_INFO_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data: GoogleUserProfile = await response.json();

      const user = await this.usersService.upsertUser({
        email: data.email,
        name: data.name ?? data.given_name,
        image: data.picture,
        providerName: 'google',
      });

      const tokens = await this.getTokens(user.id.toString(), user.email);

      return {
        tokens,
        user,
      };
    } catch (err) {
      throw new BadRequestException('Invalid request');
    }
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

  async verifyEmail(
    pendingUserId: string,
    verifyEmailDto: VerifyEmailDto,
  ): Promise<LoginResult> {
    const pendingUser = await this.usersService.findPendingUser(pendingUserId);

    if (pendingUser === null) {
      throw new BadRequestException('Invalid request');
    }

    const userExists = await this.usersService.isUserExistByEmail(
      pendingUser.email,
    );

    if (userExists) {
      throw new BadRequestException(
        'An account has already been created with the associated email, please login instaed.',
      );
    }

    const storedOTP = await this.redisService.get<string>(
      verifyEmailDto.sessionId,
    );

    if (storedOTP === null || storedOTP !== verifyEmailDto.otpCode) {
      throw new BadRequestException('Invalid OTP Code. Please try again.');
    }

    const createUserDto: CreateUserDto = {
      email: pendingUser.email,
      username: pendingUser.username,
      password: pendingUser.password,
    };
    const user = await this.usersService.createUserWithEmailProvider(
      createUserDto,
    );
    await this.usersService.deletePendingUser(pendingUserId);
    await this.redisService.delete(verifyEmailDto.sessionId);

    const tokens = await this.getTokens(user.id.toString(), user.email);

    return {
      tokens,
      user,
    };
  }

  async resendEmailOtp(pendingUserId: string): Promise<{
    sessionId: string;
  }> {
    const pendingUser = await this.usersService.findPendingUser(pendingUserId);

    if (pendingUser === null) {
      throw new BadRequestException('Invalid request');
    }

    const userExists = await this.usersService.isUserExistByEmail(
      pendingUser.email,
    );

    if (userExists) {
      throw new BadRequestException(
        'An account has already been created with the associated email, please login instaed.',
      );
    }

    const { sessionId, otpCode } = await this.generateVerifyEmailOtp(
      pendingUser.email,
    );

    // TODO: add to a message queue to process sending of mails
    await this.mailService.sendVerificationEmail(
      pendingUser.email,
      pendingUser.username,
      otpCode,
    );

    return {
      sessionId,
    };
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

    if (userId !== user.id.toString() || user.isDeleted) {
      throw new BadRequestException('Invalid user');
    }

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
      expiresIn: '1m',
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

    if (user === null || user.isDeleted) {
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

    if (user?.password === null) {
      throw new ForbiddenException('User does not have a password');
    }

    if (await compareHash(resetPasswordDto.newPassword, user.password)) {
      throw new BadRequestException(
        'New password cannot be the same as the old password.',
      );
    }

    await this.usersService.updatePassword(
      user.id,
      resetPasswordDto.newPassword,
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

  async generateVerifyEmailOtp(email: string): Promise<{
    sessionId: string;
    otpCode: string;
  }> {
    const sessionId = uuidV4();
    const otpCode = generateOTP();

    await this.redisService.set(sessionId, otpCode, 10 * 60); // OTP code expires in 10 minutes

    return {
      sessionId,
      otpCode,
    };
  }
}
