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
  type Comment as CommentEntity,
  type CommentLike,
  type Post as PostEntity,
  type PostLike,
} from '@prisma/client';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { type TokenUser } from 'src/auth/entities';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { imageUploadOptions } from 'src/images/constants';
import { ImagesService } from 'src/images/images.service';
import {
  CreateCommentDto,
  GetChildCommentDto,
  GetCommentDto,
  GetPostsDto,
  UpdateCommentDto,
  UpdatePostDto,
  VotePollDto,
} from 'src/posts/dto';
import { CreatePostDto } from 'src/posts/dto/create-post.dto';
import { LikeDto } from 'src/posts/dto/like.dto';
import {
  type CommentWithLike,
  type PollWithOptions,
  type PostWithLike,
  type VotePollResult,
} from 'src/posts/entities';
import { PollService } from 'src/posts/poll.service';
import { CommentsService } from './comments.service';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
    private readonly pollService: PollService,
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
  async findPosts(
    @Query() getPostsDto: GetPostsDto,
    @GetUser() user: TokenUser | null,
  ): Promise<{ posts: PostWithLike[]; hasMore: boolean }> {
    const parsedDto: GetPostsDto = {
      latitude: +getPostsDto.latitude,
      longitude: +getPostsDto.longitude,
      distance: +getPostsDto.distance,
      userId: user?.userId,
      cursor: getPostsDto.cursor,
      take: getPostsDto.take !== undefined ? +getPostsDto.take : undefined,
    };

    return await this.postsService.findNearbyPosts(parsedDto);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findPost(
    @Param('id') postId: string,
    @GetUser() user: TokenUser | null,
  ): Promise<PostWithLike | null> {
    return await this.postsService.findPost(+postId, user?.userId);
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
    @Body() likeDto: LikeDto,
  ): Promise<{
    like: PostLike;
    post: PostEntity;
  }> {
    return await this.postsService.votePost(+userId, +postId, likeDto.value);
  }

  @Post(':id/comments/:parentCommentId?')
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Body() createCommentDto: CreateCommentDto,
    @GetUser('userId') userId: string,
    @Param('id') postId: string,
    @Param('parentCommentId') parentCommentId?: string,
  ): Promise<CommentEntity> {
    return await this.commentsService.createComment(
      createCommentDto,
      +postId,
      +userId,
      parentCommentId !== undefined ? +parentCommentId : undefined,
    );
  }

  @Get(':postId/comments/:commentId')
  @UseGuards(OptionalJwtAuthGuard)
  async findComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @GetUser() user: TokenUser | null,
  ): Promise<CommentWithLike | null> {
    return await this.commentsService.findComment(
      +postId,
      +commentId,
      user?.userId,
    );
  }

  @Get(':id/comments')
  @UseGuards(OptionalJwtAuthGuard)
  async findComments(
    @Param('id') postId: string,
    @Query() getCommentDto: GetCommentDto,
    @GetUser() user: TokenUser | null,
  ): Promise<{ comments: CommentWithLike[]; hasMore: boolean }> {
    const parsedDto: GetCommentDto = {
      cursor: getCommentDto.cursor,
      take: getCommentDto.take !== undefined ? +getCommentDto.take : undefined,
      sort: getCommentDto.sort,
      userId: user?.userId,
    };

    return await this.commentsService.findComments(+postId, parsedDto);
  }

  @Get(':postId/comments/:commentId/replies')
  @UseGuards(OptionalJwtAuthGuard)
  async findChildComments(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Query() getChildCommentDto: GetChildCommentDto,
    @GetUser() user: TokenUser | null,
  ): Promise<{ comments: CommentWithLike[]; hasMore: boolean }> {
    const parsedDto: GetCommentDto = {
      cursor: getChildCommentDto.cursor,
      take:
        getChildCommentDto.take !== undefined
          ? +getChildCommentDto.take
          : undefined,
      userId: user?.userId,
    };

    return await this.commentsService.findChildComments(
      +postId,
      +commentId,
      parsedDto,
    );
  }

  @Patch(':postId/comments/:id')
  @UseGuards(JwtAuthGuard)
  async updateComment(
    @Param('id') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<CommentEntity> {
    return await this.commentsService.updateComment(
      +commentId,
      updateCommentDto,
    );
  }

  @Put(':postId/comments/:commentId/vote')
  @UseGuards(JwtAuthGuard)
  async voteComment(
    @GetUser('userId') userId: string,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() likeDto: LikeDto,
  ): Promise<{
    like: CommentLike;
    comment: CommentEntity;
  }> {
    return await this.commentsService.voteComment(
      +userId,
      +postId,
      +commentId,
      likeDto.value,
    );
  }

  @Get(':postId/polls/:pollId')
  @UseGuards(OptionalJwtAuthGuard)
  async findPoll(
    @Param('postId') postId: string,
    @Param('pollId') pollId: string,
    @GetUser() user: TokenUser | null,
  ): Promise<PollWithOptions | null> {
    return await this.pollService.findPoll(+postId, +pollId, user?.userId);
  }

  @Post(':postId/polls/:pollId/vote')
  @UseGuards(JwtAuthGuard)
  async votePoll(
    @Body() votePollDto: VotePollDto,
    @GetUser('userId') userId: string,
    @Param('postId') postId: string,
    @Param('pollId') pollId: string,
  ): Promise<VotePollResult> {
    return await this.pollService.votePoll(
      votePollDto,
      +postId,
      +pollId,
      +userId,
    );
  }
}
