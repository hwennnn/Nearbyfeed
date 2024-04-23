import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  type Comment,
  type CommentLike,
  type Post,
  type PostLike,
} from '@prisma/client';
import { FilterService } from 'src/filter/filter.service';
import { GeocodingService } from 'src/geocoding/geocoding.service';
import {
  GetCommentsSort,
  type CreateCommentDto,
  type CreatePostDto,
  type GetCommentDto,
  type GetPostsDto,
  type UpdateCommentDto,
  type UpdatePostDto,
} from 'src/posts/dto';
import { type CommentWithAuthor, type PostWithLike } from 'src/posts/entities';

import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class PostsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: Logger,
    private readonly filterService: FilterService,
    private readonly geocodingService: GeocodingService,
    private readonly usersService: UsersService,
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
        include: {
          author: true,
        },
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

  async findNearbyPosts(dto: GetPostsDto): Promise<{
    posts: PostWithLike[];
    hasMore: boolean;
  }> {
    const degreesPerMeter = 1 / 111320; // 1 degree is approximately 111320 meters
    const degreesPerDistance = dto.distance * degreesPerMeter;

    const limit = dto.take ?? 15;

    const selectLikes =
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
          createdAt: true,
          updatedAt: true,
          authorId: true,
          likes: selectLikes,
          author: true,
          commentsCount: true,
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

    // transform the likes array into single like variable -> this is to indicate whether the current user likes the post or not
    const parsedPosts = posts.map((post) => {
      const p = {
        ...post,
        like:
          post.likes !== undefined && post.likes.length > 0
            ? post.likes[0]
            : undefined,
      };

      const { likes: _, ...parsedPost } = p;

      return parsedPost;
    });

    return {
      posts: parsedPosts,
      hasMore,
    };
  }

  async findPost(
    postId: number,
    userId?: string,
  ): Promise<PostWithLike | null> {
    const selectLikes =
      userId !== undefined
        ? {
            where: {
              userId: +userId,
            },
          }
        : false;

    const post = await this.prismaService.post
      .findFirst({
        where: {
          id: +postId,
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
          createdAt: true,
          updatedAt: true,
          authorId: true,
          likes: selectLikes,
          author: true,
          commentsCount: true,
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to find post',
          e instanceof Error ? e.stack : undefined,
          PostsService.name,
        );

        throw new BadRequestException('Failed to find post');
      });

    if (post === null) return null;

    // transform the likes array into single like variable -> this is to indicate whether the current user likes the post or not
    const parsedPost = {
      ...post,
      like:
        post.likes !== undefined && post.likes.length > 0
          ? post.likes[0]
          : undefined,
    };

    return parsedPost;
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
    like: PostLike;
    post: Post;
  }> {
    const like = await this.prismaService.postLike.findFirst({
      where: {
        userId,
        postId,
      },
    });

    let incrementValue = value;

    // If the user alrady liked the post
    if (like !== null) {
      // If the user's vote is the same as the current vote
      if (like.value === value) {
        // nothing changed
        incrementValue = 0;
      } else {
        if (value === 1) {
          incrementValue = 1;
        } else {
          incrementValue = -1;
        }
      }
    }

    const [resultLike, resultPost] = await this.prismaService
      .$transaction([
        this.prismaService.postLike.upsert({
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
          'Failed to like the post',
          e instanceof Error ? e.stack : undefined,
          PostsService.name,
        );

        throw new BadRequestException('Failed to like the post');
      });

    return {
      like: resultLike,
      post: resultPost,
    };
  }

  async createComment(
    createCommentDto: CreateCommentDto,
    postId: number,
    authorId: number,
    parentCommentId?: number,
  ): Promise<Comment> {
    if (parentCommentId !== undefined) {
      const parentComment = await this.prismaService.comment
        .findUnique({
          where: {
            id: parentCommentId,
          },
        })
        .catch((e) => {
          this.logger.error(
            'Failed to find parent comment',
            e instanceof Error ? e.stack : undefined,
            PostsService.name,
          );
          throw new BadRequestException('Failed to find parent comment');
        });

      if (parentComment?.parentCommentId !== null) {
        this.logger.error(
          'Only one level of comments is allowed',
          undefined,
          PostsService.name,
        );

        throw new BadRequestException('Only one level of comments is allowed');
      }
    }

    const data = {
      ...createCommentDto,
      postId,
      authorId,
      content: this.filterService.filterText(createCommentDto.content),
      parentCommentId,
    };

    const [resultComment] = await this.prismaService
      .$transaction([
        this.prismaService.comment.create({
          data,
          include: {
            author: true,
          },
        }),
        this.prismaService.post.update({
          where: { id: postId },
          data: {
            commentsCount: {
              increment: 1,
            },
          },
        }),
      ])
      .catch((e) => {
        this.logger.error(
          'Failed to create comment',
          e instanceof Error ? e.stack : undefined,
          PostsService.name,
        );

        throw new BadRequestException('Failed to create comment');
      });

    return resultComment;
  }

  async findComments(
    postId: number,
    dto: GetCommentDto,
  ): Promise<{
    comments: CommentWithAuthor[];
    hasMore: boolean;
  }> {
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

    if (dto.sort === GetCommentsSort.TOP) {
      orderBy = [
        {
          points: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ];
    }

    // in order to skip the cursor
    const skip = cursor !== undefined ? 1 : undefined;

    const selectLikes =
      dto.userId !== undefined
        ? {
            where: {
              userId: +dto.userId,
            },
          }
        : false;

    const comments = await this.prismaService.comment
      .findMany({
        where: {
          postId,
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
          points: true,
          authorId: true,
          author: true,
          isDeleted: true,
          parentCommentId: true,
          repliesCount: true,
          likes: selectLikes,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find comments for post ${postId}`,
          e instanceof Error ? e.stack : undefined,
          PostsService.name,
        );

        throw new BadRequestException('Failed to find comments');
      });

    const hasMore = comments.length === limit + 1;
    if (hasMore) {
      comments.pop();
    }

    // transform the likes array into single like variable -> this is to indicate whether the current user likes the post or not
    const parsedComments = comments.map((comment) => {
      const p = {
        ...comment,
        like: comment.likes.length > 0 ? comment.likes[0] : undefined,
      };

      const { likes: _, ...parsedComment } = p;

      return parsedComment;
    });

    return {
      comments: parsedComments,
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

  async voteComment(
    userId: number,
    postId: number,
    commentId: number,
    value: number,
  ): Promise<{
    like: CommentLike;
    comment: Comment;
  }> {
    const like = await this.prismaService.commentLike.findFirst({
      where: {
        userId,
        commentId,
      },
    });

    let incrementValue = value;

    // If the user alrady liked the comment
    if (like !== null) {
      // If the user's vote is the same as the current vote
      if (like.value === value) {
        // nothing changed
        incrementValue = 0;
      } else {
        if (value === 1) {
          incrementValue = 1;
        } else {
          incrementValue = -1;
        }
      }
    }

    const [resultLike, resultComment] = await this.prismaService
      .$transaction([
        this.prismaService.commentLike.upsert({
          where: {
            commentId_userId: {
              commentId,
              userId,
            },
          },
          update: {
            value,
          },
          create: {
            commentId,
            userId,
            value,
          },
        }),
        this.prismaService.comment.update({
          data: {
            points: {
              increment: incrementValue,
            },
          },
          where: {
            id: commentId,
          },
        }),
      ])
      .catch((e) => {
        this.logger.error(
          'Failed to like the comment',
          e instanceof Error ? e.stack : undefined,
          PostsService.name,
        );

        throw new BadRequestException('Failed to like the comment');
      });

    return {
      like: resultLike,
      comment: resultComment,
    };
  }
}
