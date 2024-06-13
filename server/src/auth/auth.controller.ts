import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderType } from '@prisma/client';
import { Response } from 'express';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { ProviderIdValidationPipe } from 'src/auth/decorators/provider-id-validation-pipe';
import {
  AuthDto,
  CreatePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdatePasswordDto,
  VerifyEmailDto,
} from 'src/auth/dto';
import { TokenPayload, type LoginResult } from 'src/auth/entities';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import JwtRefreshGuard from 'src/auth/guards/jwt-refresh.guard';
import { CreateUserDto } from 'src/users/dto';
import { type PendingUserWithoutPassword } from 'src/users/entities';
import UserActiveGuard from 'src/users/guards/user-active.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('google/callback')
  async googleAuth(@Query('token') token: string): Promise<LoginResult> {
    return await this.authService.loginWithGoogle(token);
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<{
    sessionId: string;
    pendingUser: PendingUserWithoutPassword;
  }> {
    return await this.authService.register(createUserDto);
  }

  @Post('login')
  async login(@Body() authDto: AuthDto): Promise<LoginResult> {
    return await this.authService.login(authDto);
  }

  @Post('logout')
  @UseGuards(JwtRefreshGuard)
  async logout(@GetUser('payload') payload: TokenPayload): Promise<void> {
    await this.authService.logout(payload.sessionId);
  }

  @Post('verify-email/:id')
  async verifyEmail(
    @Param('id') pendingUserId: string,
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<LoginResult> {
    return await this.authService.verifyEmail(pendingUserId, verifyEmailDto);
  }

  @Put('verify-email/:id/resend')
  async requestEmailOTP(@Param('id') pendingUserId: string): Promise<{
    sessionId: string;
  }> {
    return await this.authService.resendEmailOtp(pendingUserId);
  }

  @Post('refresh-token')
  @UseGuards(JwtRefreshGuard)
  async refreshToken(
    @GetUser('refreshToken') refreshToken: string,
    @GetUser('payload') payload: TokenPayload,
  ): Promise<{ accessToken: string }> {
    return await this.authService.refreshTokens(refreshToken, payload);
  }

  @Post('password')
  @UseGuards(JwtAuthGuard, UserActiveGuard)
  async createPassword(
    @GetUser('userId') userId: string,
    @Body() createPasswordDto: CreatePasswordDto,
  ): Promise<void> {
    await this.authService.createPassword(+userId, createPasswordDto);
  }

  @Put('password')
  @UseGuards(JwtAuthGuard, UserActiveGuard)
  async updatePassword(
    @GetUser('userId') userId: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<void> {
    await this.authService.updatePassword(+userId, updatePasswordDto);
  }

  @Post('password/forgot')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<void> {
    const email = forgotPasswordDto.email;

    await this.authService.sendResetPasswordEmail(email);
  }

  @Get('password/reset/:token')
  async resetPasswordProxy(
    @Param('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.authService.checkResetPasswordToken(token);

    const deepLink = (await this.configService.get('APP_DEEP_LINK')) as string;
    const resetEmailLink = deepLink + 'reset-password/' + token;

    res.redirect(resetEmailLink);
  }

  @Put('password/reset')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<void> {
    await this.authService.resetPassword(resetPasswordDto);
  }

  @Post('providers/google')
  @UseGuards(JwtAuthGuard, UserActiveGuard)
  async connectProvider(
    @GetUser('userId') userId: string,
    @Query('token') token: string,
  ): Promise<void> {
    await this.authService.linkGoogleProvider(+userId, token);
  }

  @Delete('providers/:providerId')
  @UseGuards(JwtAuthGuard, UserActiveGuard)
  async disconnectProvider(
    @GetUser('userId') userId: string,
    @Param('providerId', ProviderIdValidationPipe) providerId: ProviderType,
  ): Promise<void> {
    await this.authService.disconnectProvider(+userId, providerId);
  }
}
