import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { type Comment } from '@prisma/client';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import { imageUploadOptions } from 'src/images/constants';
import { ImagesService } from 'src/images/images.service';
import { type PostWithLike } from 'src/posts/entities';
import { PaginationDto, UpdatePasswordDto, UpdateUserDto } from 'src/users/dto';
import { type UserWithoutPassword } from 'src/users/entities/userWithoutPassword';
import UserActiveGuard from 'src/users/guards/user-active.guard';
import UserMutateGuard from 'src/users/guards/user-mutate.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly imagesService: ImagesService,
  ) {}

  @Get('self')
  @UseGuards(UserActiveGuard)
  async getSelf(
    @GetUser('userId') userId: string,
  ): Promise<UserWithoutPassword> {
    return await this.usersService.findOne(+userId);
  }

  @Patch(':id')
  @UseGuards(UserMutateGuard)
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserWithoutPassword> {
    let image: string | undefined;

    if (file !== undefined) {
      image = await this.imagesService.uploadImage(file);
    }

    return await this.usersService.update(+id, updateUserDto, image);
  }

  @Patch(':id/update-password')
  @UseGuards(UserMutateGuard)
  async updatePassword(
    @Param('id') id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<void> {
    await this.usersService.updatePasswordHelper(+id, updatePasswordDto);
  }

  @Get(':id/posts')
  @UseGuards(UserActiveGuard)
  async findOwnPosts(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<{
    posts: PostWithLike[];
    hasMore: boolean;
  }> {
    if (id !== userId) {
      throw new ForbiddenException('Invalid credentials');
    }

    return await this.usersService.findOwnPosts(+id, paginationDto);
  }

  @Get(':id/comments')
  async findOwnComments(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<{
    comments: Comment[];
    hasMore: boolean;
  }> {
    if (id !== userId) {
      throw new ForbiddenException('Invalid credentials');
    }

    return await this.usersService.findOwnComments(+id, paginationDto);
  }

  @Post(':id/block/:blockedId')
  @UseGuards(UserMutateGuard)
  async blockUser(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @Param('blockedId') blockedId: string,
  ): Promise<void> {
    if (id !== userId) {
      throw new ForbiddenException('Invalid credentials');
    }

    if (userId === blockedId) {
      throw new BadRequestException('You cannot block yourself');
    }

    await this.usersService.blockUser(+userId, +blockedId);
  }

  @Delete(':id/block/:blockedId')
  @UseGuards(UserMutateGuard)
  async deleteBlockUser(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @Param('blockedId') blockedId: string,
  ): Promise<void> {
    if (id !== userId) {
      throw new ForbiddenException('Invalid credentials');
    }

    if (userId === blockedId) {
      throw new BadRequestException('Invalid request');
    }

    await this.usersService.deleteBlock(+userId, +blockedId);
  }
}
