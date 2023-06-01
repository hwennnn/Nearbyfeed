import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { type Comment, type Post, type Updoot } from '@prisma/client';
import { FilterService } from 'src/filter/filter.service';
import { GeocodingService } from 'src/geocoding/geocoding.service';
import {
  GetCommentsSort,
  type CreateCommentDto,
  type CreatePostDto,
  type GetCommentDto,
  type GetPostDto,
  type UpdateCommentDto,
  type UpdatePostDto,
} from 'src/posts/dto';
import {
  type CommentWithAuthor,
  type PostWithUpdoot,
} from 'src/posts/entities';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: Logger,
    private readonly filterService: FilterService,
    private readonly geocodingService: GeocodingService,
  ) {}

  async createPost(
    createPostDto: CreatePostDto,
    authorId: number,
    image?: string,
  ): Promise<Post> {
    const geolocationName = await this.geocodingService.getLocationName(
      +createPostDto.latitude,
      +createPostDto.longitude,
    );

    const data = {
      ...createPostDto,
      authorId,
      image,
      latitude: +createPostDto.latitude,
      longitude: +createPostDto.longitude,
      title: this.filterService.filterText(createPostDto.title),
      content:
        createPostDto.content !== undefined
          ? this.filterService.filterText(createPostDto.content)
          : null,
      locationName: geolocationName?.locationName,
      fullLocationName: geolocationName?.displayName,
    };

    // await sleep(15000);

    const post = await this.prismaService.post
      .create({
        data,
      })
      .catch((e) => {
        this.logger.error(
          'Failed to create post',
          e instanceof Error ? e.stack : undefined,
          PostsService.name,
        );

        throw new BadRequestException('Failed to create post');
      });

    return post;
  }

  async findNearbyPosts(dto: GetPostDto): Promise<{
    posts: PostWithUpdoot[];
    hasMore: boolean;
  }> {
    const degreesPerMeter = 1 / 111320; // 1 degree is approximately 111320 meters
    const degreesPerDistance = dto.distance * degreesPerMeter;

    const limit = dto.take ?? 15;

    const selectUpdoots =
      dto.userId !== undefined
        ? {
            where: {
              userId: +dto.userId,
            },
          }
        : false;

    let postCursor: { id: number } | undefined;
    if (dto.cursor !== undefined) {
      postCursor = {
        id: +dto.cursor,
      };
    }

    // in order to skip the cursor
    const skip = postCursor !== undefined ? 1 : undefined;

    const posts = await this.prismaService.post
      .findMany({
        take: limit + 1,
        skip,
        cursor: postCursor,
        where: {
          latitude: {
            lte: dto.latitude + degreesPerDistance,
            gte: dto.latitude - degreesPerDistance,
          },
          longitude: {
            lte: dto.longitude + degreesPerDistance,
            gte: dto.longitude - degreesPerDistance,
          },
        },
        select: {
          id: true,
          title: true,
          content: true,
          latitude: true,
          longitude: true,
          locationName: true,
          fullLocationName: true,
          image: true,
          points: true,
          flagged: true,
          createdAt: true,
          updatedAt: true,
          authorId: true,
          updoots: selectUpdoots,
          author: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to find posts',
          e instanceof Error ? e.stack : undefined,
          PostsService.name,
        );

        throw new BadRequestException('Failed to find posts');
      });

    const hasMore = posts.length === limit + 1;
    if (hasMore) {
      posts.pop();
    }

    // transform the updoots array into single updoot variable
    const parsedPosts = posts.map((post) => {
      const p = {
        ...post,
        updoot: post.updoots.length > 0 ? post.updoots[0] : undefined,
      };

      const { updoots: _, ...parsedPost } = p;

      return parsedPost;
    });

    console.log(parsedPosts);

    return {
      posts: parsedPosts,
      hasMore,
    };
  }

  async updatePost(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
    const data = {
      ...updatePostDto,
    };

    if (updatePostDto.title !== undefined) {
      data.title = this.filterService.filterText(updatePostDto.title);
    }

    if (updatePostDto.content !== undefined) {
      data.content = this.filterService.filterText(updatePostDto.content);
    }

    return await this.prismaService.post
      .update({
        where: { id },
        data,
      })
      .catch((e) => {
        this.logger.error(
          `Failed to update post ${id}`,
          e instanceof Error ? e.stack : undefined,
          PostsService.name,
        );

        throw new BadRequestException('Failed to update post');
      });
  }

  async votePost(
    userId: number,
    postId: number,
    value: number,
  ): Promise<{
    updoot: Updoot;
    post: Post;
  }> {
    const updoot = await this.prismaService.updoot.findFirst({
      where: {
        userId,
        postId,
      },
    });

    let incrementValue = value;

    // If the user has already voted on the post
    if (updoot !== null) {
      // If the user's vote is the same as the current vote
      if (updoot.value === value) {
        // nothing changed
        incrementValue = 0;
      } else {
        // If the user is changing their vote
        if (updoot.value !== 0 && value === 0) {
          // If the previous vote was not 0 and the new vote is 0, set the increment value to the inverse of the previous vote
          incrementValue = -updoot.value;
        } else {
          // If the previous vote was 0 or the new vote is not 0, set the increment value to the new vote multiplied by 2
          incrementValue = updoot.value === 0 ? value : value * 2;
        }
      }
    }

    const [resultUpdoot, resultPost] = await this.prismaService
      .$transaction([
        this.prismaService.updoot.upsert({
          where: {
            postId_userId: {
              postId,
              userId,
            },
          },
          update: {
            value,
          },
          create: {
            postId,
            userId,
            value,
          },
        }),
        this.prismaService.post.update({
          data: {
            points: {
              increment: incrementValue,
            },
          },
          where: {
            id: postId,
          },
        }),
      ])
      .catch((e) => {
        this.logger.error(
          'Failed to updoot',
          e instanceof Error ? e.stack : undefined,
          PostsService.name,
        );

        throw new BadRequestException('Failed to updoot');
      });

    return {
      updoot: resultUpdoot,
      post: resultPost,
    };
  }

  async createComment(
    createCommentDto: CreateCommentDto,
    postId: number,
    authorId: number,
  ): Promise<Comment> {
    const data = {
      ...createCommentDto,
      postId,
      authorId,
      content: this.filterService.filterText(createCommentDto.content),
    };

    const comment = await this.prismaService.comment
      .create({ data })
      .catch((e) => {
        this.logger.error(
          'Failed to create comment',
          e instanceof Error ? e.stack : undefined,
          PostsService.name,
        );

        throw new BadRequestException('Failed to create comment');
      });

    return comment;
  }

  async findComments(
    id: number,
    dto: GetCommentDto,
  ): Promise<{ comments: CommentWithAuthor[]; hasMore: boolean }> {
    const limit = dto.take ?? 15;

    let cursor: { id: number } | undefined;
    if (dto.cursor !== undefined) {
      cursor = {
        id: +dto.cursor,
      };
    }

    // default sort is latest if not specified
    let orderBy: any = {
      createdAt: 'desc',
    };

    if (dto.sort === GetCommentsSort.OLDEST) {
      orderBy = {
        createdAt: 'asc',
      };
    }

    // in order to skip the cursor
    const skip = cursor !== undefined ? 1 : undefined;

    const comments = await this.prismaService.comment
      .findMany({
        where: {
          postId: id,
          isDeleted: false,
        },
        cursor,
        take: limit + 1,
        skip,
        orderBy,
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          postId: true,
          authorId: true,
          author: true,
          isDeleted: true,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find comments for post ${id}`,
          e instanceof Error ? e.stack : undefined,
          PostsService.name,
        );

        throw new BadRequestException('Failed to find comments');
      });

    const hasMore = comments.length === limit + 1;
    if (hasMore) {
      comments.pop();
    }

    return {
      comments,
      hasMore,
    };
  }

  async updateComment(
    commentId: number,
    updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    const data = { ...updateCommentDto };

    if (updateCommentDto.content !== undefined) {
      data.content = this.filterService.filterText(updateCommentDto.content);
    }

    return await this.prismaService.comment
      .update({
        where: { id: commentId },
        data,
      })
      .catch((e) => {
        this.logger.error(
          `Failed to update comment ${commentId}`,
          e instanceof Error ? e.stack : undefined,
          PostsService.name,
        );

        throw new BadRequestException('Failed to update comment');
      });
  }
}
