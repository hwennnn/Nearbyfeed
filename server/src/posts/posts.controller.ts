import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  type Comment,
  type Post as PostEntity,
  type Updoot,
} from '@prisma/client';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { type TokenUser } from 'src/auth/entities';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { imageUploadOptions } from 'src/images/constants';
import { ImagesService } from 'src/images/images.service';
import {
  CreateCommentDto,
  GetCommentDto,
  GetPostDto,
  UpdateCommentDto,
  UpdatePostDto,
} from 'src/posts/dto';
import { CreatePostDto } from 'src/posts/dto/create-post.dto';
import { UpdootDto } from 'src/posts/dto/updoot.dto';
import { type PostWithUpdoot } from 'src/posts/entities';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly imagesService: ImagesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  async create(
    @Body() createPostDto: CreatePostDto,
    @GetUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<PostEntity> {
    let image: string | undefined;

    if (file !== undefined) {
      image = await this.imagesService.uploadImage(file);
    }

    return await this.postsService.createPost(createPostDto, +userId, image);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(
    @Query() getPostDto: GetPostDto,
    @GetUser() user: TokenUser | null,
  ): Promise<{ posts: PostWithUpdoot[]; hasMore: boolean }> {
    const parsedDto: GetPostDto = {
      latitude: +getPostDto.latitude,
      longitude: +getPostDto.longitude,
      distance: +getPostDto.distance,
      userId: user?.userId,
      cursor: getPostDto.cursor,
      take: getPostDto.take !== undefined ? +getPostDto.take : undefined,
    };

    return await this.postsService.findNearbyPosts(parsedDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @Param('id') postId: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostEntity> {
    return await this.postsService.updatePost(+postId, updatePostDto);
  }

  @Put(':id/vote')
  @UseGuards(JwtAuthGuard)
  async votePost(
    @GetUser('userId') userId: string,
    @Param('id') postId: string,
    @Body() updootDto: UpdootDto,
  ): Promise<{
    updoot: Updoot;
    post: PostEntity;
  }> {
    return await this.postsService.votePost(+userId, +postId, updootDto.value);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Body() createCommentDto: CreateCommentDto,
    @GetUser('userId') userId: string,
    @Param('id') postId: string,
  ): Promise<Comment> {
    return await this.postsService.createComment(
      createCommentDto,
      +postId,
      +userId,
    );
  }

  @Get(':id/comments')
  async findComments(
    @Param('id') postId: string,
    @Query() getCommentDto: GetCommentDto,
  ): Promise<{ comments: Comment[]; hasMore: boolean }> {
    const parsedDto: GetCommentDto = {
      cursor: getCommentDto.cursor,
      take: getCommentDto.take !== undefined ? +getCommentDto.take : undefined,
      sort: getCommentDto.sort,
    };

    return await this.postsService.findComments(+postId, parsedDto);
  }

  @Patch(':postId/comments/:id')
  @UseGuards(JwtAuthGuard)
  async updateComment(
    @Param('id') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    return await this.postsService.updateComment(+commentId, updateCommentDto);
  }
}
