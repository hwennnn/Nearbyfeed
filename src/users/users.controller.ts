import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { type UserWithoutPassword } from 'src/users/entities/userWithoutPassword';
import { hashPassword } from 'src/utils';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserWithoutPassword> {
    const data = {
      ...createUserDto,
      password: await hashPassword(createUserDto.password),
    };

    return await this.usersService.create(data).catch((e) => {
      throw e;
    });
  }

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
