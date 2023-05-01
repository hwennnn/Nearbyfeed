import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
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

  @Post('refresh-token')
  @UseGuards(JwtRefreshGuard)
  async refreshToken(
    @GetUser('accessToken') accessToken: string,
  ): Promise<{ accessToken: string }> {
    return { accessToken };
  }
}
