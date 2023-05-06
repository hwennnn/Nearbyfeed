import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { type Post as PostEntity } from '@prisma/client';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import { UpdatePostDto } from 'src/posts/dto';
import { CreatePostDto } from 'src/posts/dto/create-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createPostDto: CreatePostDto,
    @GetUser('userId') userId: string,
  ): Promise<PostEntity> {
    return await this.postsService.create(createPostDto, +userId);
  }

  @Get()
  async findAll(): Promise<PostEntity[]> {
    return await this.postsService.findAll();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostEntity> {
    return await this.postsService.update(+id, updatePostDto);
  }
}
