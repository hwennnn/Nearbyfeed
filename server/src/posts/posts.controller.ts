import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
import { CommentsService } from './comments.service';
import {
  CreateCommentDto,
  GetChildCommentDto,
  GetCommentDto,
  GetPostsDto,
  UpdatePostDto,
  VotePollDto,
} from './dto';
import { CreatePostDto } from './dto/create-post.dto';
import { LikeDto } from './dto/like.dto';
import {
  type CommentWithLike,
  type PollWithOptions,
  type PostWithLike,
  type VotePollResult,
} from './entities';
import CommentActiveGuard from './guards/comment-active.guard';
import CommentMutateGuard from './guards/comment-mutate.guard';
import PostActiveGuard from './guards/post-active.guard';
import PostMutateGuard from './guards/post-mutate.guard';
import { PollService } from './poll.service';
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
  @UseInterceptors(FilesInterceptor('images', 5, imageUploadOptions)) // Allow up to 5 images
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @GetUser('userId') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<PostEntity> {
    let images: string[] | undefined;

    if (files !== undefined) {
      images = await this.imagesService.uploadImages(files);
    }

    return await this.postsService.createPost(createPostDto, +userId, images);
  }

  @Get()
  @UseGuards(new OptionalJwtAuthGuard(true))
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

  @Get(':postId')
  @UseGuards(new OptionalJwtAuthGuard(true), PostActiveGuard)
  async findPost(
    @Param('postId') postId: string,
    @GetUser() user: TokenUser | null,
  ): Promise<PostWithLike | null> {
    return await this.postsService.findPost(+postId, user?.userId);
  }

  @Patch(':postId')
  @UseGuards(JwtAuthGuard, PostMutateGuard)
  async updatePost(
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostEntity> {
    return await this.postsService.updatePost(+postId, updatePostDto);
  }

  @Put(':postId/vote')
  @UseGuards(JwtAuthGuard, PostActiveGuard)
  async votePost(
    @GetUser('userId') userId: string,
    @Param('postId') postId: string,
    @Body() likeDto: LikeDto,
  ): Promise<{
    like: PostLike;
    post: PostEntity;
  }> {
    return await this.postsService.votePost(+userId, +postId, likeDto.value);
  }

  @Delete(':postId')
  @UseGuards(JwtAuthGuard, PostMutateGuard)
  async deletePost(@Param('postId') postId: string): Promise<void> {
    await this.postsService.deletePost(+postId);
  }

  @Post(':postId/comments/:parentCommentId?')
  @UseGuards(JwtAuthGuard, PostActiveGuard)
  async createComment(
    @Body() createCommentDto: CreateCommentDto,
    @GetUser('userId') userId: string,
    @Param('postId') postId: string,
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
  @UseGuards(
    new OptionalJwtAuthGuard(true),
    PostActiveGuard,
    CommentActiveGuard,
  )
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

  @Get(':postId/comments')
  @UseGuards(new OptionalJwtAuthGuard(true), PostActiveGuard)
  async findComments(
    @Param('postId') postId: string,
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
  @UseGuards(
    new OptionalJwtAuthGuard(true),
    PostActiveGuard,
    CommentActiveGuard,
  )
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

  @Delete(':postId/comments/:commentId')
  @UseGuards(JwtAuthGuard, PostActiveGuard, CommentMutateGuard)
  async deleteComment(@Param('commentId') commentId: string): Promise<void> {
    await this.commentsService.deleteComment(+commentId);
  }

  @Put(':postId/comments/:commentId/vote')
  @UseGuards(JwtAuthGuard, PostActiveGuard, CommentActiveGuard)
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
  @UseGuards(new OptionalJwtAuthGuard(true), PostActiveGuard)
  async findPoll(
    @Param('postId') postId: string,
    @Param('pollId') pollId: string,
    @GetUser() user: TokenUser | null,
  ): Promise<PollWithOptions | null> {
    return await this.pollService.findPoll(+postId, +pollId, user?.userId);
  }

  @Post(':postId/polls/:pollId/vote')
  @UseGuards(JwtAuthGuard, PostActiveGuard)
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
