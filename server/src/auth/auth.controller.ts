import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { AuthDto, ForgotPasswordDto, ResetPasswordDto } from 'src/auth/dto';
import { type AuthToken } from 'src/auth/entities';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import JwtRefreshGuard from 'src/auth/guards/jwt-refresh.guard';
import { CreateUserDto } from 'src/users/dto';
import { type PendingUserWithoutPassword } from 'src/users/entities';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<PendingUserWithoutPassword> {
    const pendingUser = await this.authService.register(createUserDto);

    return pendingUser;
  }

  @Post('login')
  async login(@Body() authDto: AuthDto): Promise<AuthToken> {
    const tokens = await this.authService.login(authDto);

    return tokens;
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@GetUser('sessionId') sessionId: string): Promise<void> {
    await this.authService.logout(sessionId);
  }

  @Get('verify-email/:id')
  async verifyEmail(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const user = await this.authService.verifyEmail(id);

    const deepLink = (await this.configService.get('APP_DEEP_LINK')) as string;
    res.redirect(deepLink + 'login/success');
  }

  @Post('refresh-token')
  @UseGuards(JwtRefreshGuard)
  async refreshToken(
    @GetUser('accessToken') accessToken: string,
  ): Promise<{ accessToken: string }> {
    return { accessToken };
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<void> {
    const email = forgotPasswordDto.email;

    await this.authService.sendResetPasswordEmail(email);
  }

  @Get('reset-password/:token')
  async resetPasswordProxy(
    @Param('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.authService.checkResetPasswordToken(token);

    const deepLink = (await this.configService.get('APP_DEEP_LINK')) as string;
    const resetEmailLink = deepLink + 'reset-password/' + token;

    res.redirect(resetEmailLink);
  }

  @Put('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<void> {
    await this.authService.resetPassword(resetPasswordDto);
  }
}
