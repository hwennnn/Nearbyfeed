import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';

import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import { UpdateUserDto } from 'src/users/dto';
import { type UserWithoutPassword } from 'src/users/entities/userWithoutPassword';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<UserWithoutPassword[]> {
    return await this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserWithoutPassword> {
    return await this.usersService.findOne(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserWithoutPassword> {
    return await this.usersService.update(+id, updateUserDto);
  }
}
