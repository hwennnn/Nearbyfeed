import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ token: string }> {
    const token = await this.authService.register(createUserDto);

    return { token };
  }
}
