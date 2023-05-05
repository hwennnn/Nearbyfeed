import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { AuthDto, ForgotPasswordDto, ResetPasswordDto } from 'src/auth/dto';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import JwtRefreshGuard from 'src/auth/guards/jwt-refresh.guard';
import { type AuthToken } from 'src/entities';
import { CreateUserDto } from 'src/users/dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<AuthToken> {
    const tokens = await this.authService.register(createUserDto);

    return tokens;
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

  @Put('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<void> {
    await this.authService.resetPassword(resetPasswordDto);
  }
}
