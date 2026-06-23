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

import { GetUser } from 'src/auth/decorators';
import { JwtAuthGuard } from 'src/auth/guards';
import { imageUploadOptions } from 'src/images/constants';
import { ImagesService } from 'src/images/images.service';
import { type PostWithLike } from 'src/posts/entities';
import { parseRouteId } from 'src/utils/parse-route-id.util';
import { PaginationDto, UpdateUserDto } from 'src/users/dto';
import { type UserResult, type UserWithoutPassword } from 'src/users/entities';
import { UserActiveGuard, UserMutateGuard } from 'src/users/guards';
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
  async getSelf(@GetUser('userId') userId: string): Promise<UserResult> {
    return await this.usersService.findOne(parseRouteId(userId, 'userId'));
  }

  @Patch(':id')
  @UseGuards(UserMutateGuard)
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserWithoutPassword> {
    const routeUserId = parseRouteId(id, 'id');
    let image: string | undefined;

    if (file !== undefined) {
      image = await this.imagesService.uploadImage(file);
    }

    return await this.usersService.update(routeUserId, updateUserDto, image);
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
    const routeUserId = parseRouteId(id, 'id');
    const tokenUserId = parseRouteId(userId, 'userId');

    if (routeUserId !== tokenUserId) {
      throw new ForbiddenException('Invalid credentials');
    }

    return await this.usersService.findOwnPosts(routeUserId, paginationDto);
  }

  @Get(':id/comments')
  @UseGuards(UserActiveGuard)
  async findOwnComments(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<{
    comments: Comment[];
    hasMore: boolean;
  }> {
    const routeUserId = parseRouteId(id, 'id');
    const tokenUserId = parseRouteId(userId, 'userId');

    if (routeUserId !== tokenUserId) {
      throw new ForbiddenException('Invalid credentials');
    }

    return await this.usersService.findOwnComments(routeUserId, paginationDto);
  }

  @Post(':id/block/:blockedId')
  @UseGuards(UserMutateGuard)
  async blockUser(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @Param('blockedId') blockedId: string,
  ): Promise<void> {
    const routeUserId = parseRouteId(id, 'id');
    const tokenUserId = parseRouteId(userId, 'userId');
    const targetUserId = parseRouteId(blockedId, 'blockedId');

    if (routeUserId !== tokenUserId) {
      throw new ForbiddenException('Invalid credentials');
    }

    if (tokenUserId === targetUserId) {
      throw new BadRequestException('You cannot block yourself');
    }

    await this.usersService.blockUser(tokenUserId, targetUserId);
  }

  @Delete(':id/block/:blockedId')
  @UseGuards(UserMutateGuard)
  async deleteBlockUser(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @Param('blockedId') blockedId: string,
  ): Promise<void> {
    const routeUserId = parseRouteId(id, 'id');
    const tokenUserId = parseRouteId(userId, 'userId');
    const targetUserId = parseRouteId(blockedId, 'blockedId');

    if (routeUserId !== tokenUserId) {
      throw new ForbiddenException('Invalid credentials');
    }

    if (tokenUserId === targetUserId) {
      throw new BadRequestException('Invalid request');
    }

    await this.usersService.deleteBlock(tokenUserId, targetUserId);
  }
}
