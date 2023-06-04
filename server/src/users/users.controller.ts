import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import { imageUploadOptions } from 'src/images/constants';
import { ImagesService } from 'src/images/images.service';
import { UpdateUserDto } from 'src/users/dto';
import { type UserWithoutPassword } from 'src/users/entities/userWithoutPassword';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly imagesService: ImagesService,
  ) {}

  @Get('self')
  async getSelf(
    @GetUser('userId') userId: string,
  ): Promise<UserWithoutPassword> {
    return await this.usersService.findOne(+userId);
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
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserWithoutPassword> {
    if (id !== userId) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let image: string | undefined;

    if (file !== undefined) {
      image = await this.imagesService.uploadImage(file);
    }

    return await this.usersService.update(+id, updateUserDto, image);
  }
}
