import {
  COMMENT_SORT,
  DEFAULT_COMMENT_SORT,
  type CommentSort,
} from '@nearbyfeed/shared';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  type Comment,
  type CommentLike,
  type Post,
  type Prisma,
} from '@prisma/client';
import { FilterService } from 'src/filter/filter.service';
import { type CreateCommentDto, type GetCommentDto } from 'src/posts/dto';
import { type CommentWithLike } from 'src/posts/entities';

import { PrismaService } from 'src/prisma/prisma.service';
import { USER_WITHOUT_PASSWORD_SELECT } from 'src/users/entities';
import {
  parseOptionalRouteId,
  parseRouteId,
} from 'src/utils/parse-route-id.util';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: Logger,
    private readonly filterService: FilterService,
  ) {}

  async createComment(
    createCommentDto: CreateCommentDto,
    postId: number,
    authorId: number,
    parentCommentId?: number,
  ): Promise<CommentWithLike> {
    if (parentCommentId !== undefined) {
      const parentComment = await this.prismaService.comment
        .findFirst({
          where: {
            id: parentCommentId,
            postId,
            isActive: true,
            parentCommentId: null,
          },
        })
        .catch((e) => {
          this.logger.error(
            'Failed to find parent comment',
            e instanceof Error ? e.stack : undefined,
            CommentsService.name,
          );
          throw new BadRequestException('Failed to find parent comment');
        });

      if (parentComment === null) {
        this.logger.error(
          'Parent comment not found',
          undefined,
          CommentsService.name,
        );

        throw new BadRequestException('Parent comment not found');
      }
    }

    const data = {
      ...createCommentDto,
      postId,
      authorId,
      content: this.filterService.filterText(createCommentDto.content),
      parentCommentId,
    };

    const transactionItems: any = [
      this.prismaService.comment.create({
        data,
        include: {
          author: {
            select: USER_WITHOUT_PASSWORD_SELECT,
          },
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
      parentCommentId !== undefined
        ? this.prismaService.comment.update({
            where: { id: parentCommentId },
            data: {
              repliesCount: {
                increment: 1,
              },
            },
          })
        : null,
    ].filter((item) => item !== null);

    const [resultComment] = await this.prismaService
      .$transaction(transactionItems)
      .catch((e) => {
        this.logger.error(
          'Failed to create comment',
          e instanceof Error ? e.stack : undefined,
          CommentsService.name,
        );

        throw new BadRequestException('Failed to create comment');
      });

    return resultComment;
  }

  async findComment(
    postId: number,
    commentId: number,
    userId?: string,
  ): Promise<CommentWithLike | null> {
    const parsedUserId = parseOptionalRouteId(userId, 'userId');
    const selectLikes =
      parsedUserId !== undefined
        ? {
            where: {
              userId: parsedUserId,
            },
          }
        : false;

    const comment = await this.prismaService.comment
      .findFirst({
        where: {
          id: commentId,
          postId,
          isActive: true,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          postId: true,
          points: true,
          authorId: true,
          author: {
            select: USER_WITHOUT_PASSWORD_SELECT,
          },
          isActive: true,
          parentCommentId: true,
          repliesCount: true,
          likes: selectLikes,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find comment ${commentId}`,
          e instanceof Error ? e.stack : undefined,
          CommentsService.name,
        );

        throw new BadRequestException(`Failed to find comment ${commentId}`);
      });

    if (comment === null) return null;

    // transform the likes array into single like variable -> this is to indicate whether the current user likes the comment or not
    const parsedComment = {
      ...comment,
      like:
        comment.likes !== undefined && comment.likes.length > 0
          ? comment.likes[0]
          : undefined,
    };

    const { likes: _, ...result } = parsedComment;

    return result;
  }

  async findComments(
    postId: number,
    dto: GetCommentDto,
  ): Promise<{
    comments: CommentWithLike[];
    hasMore: boolean;
  }> {
    const limit = dto.take ?? 15;

    let cursor: { id: number } | undefined;
    if (dto.cursor !== undefined) {
      cursor = {
        id: parseRouteId(dto.cursor, 'cursor'),
      };
    }

    const sort: CommentSort = dto.sort ?? DEFAULT_COMMENT_SORT;

    let orderBy:
      | Prisma.CommentOrderByWithRelationInput
      | Prisma.CommentOrderByWithRelationInput[] =
      sort === COMMENT_SORT.TOP
        ? [
            {
              points: 'desc',
            },
            {
              createdAt: 'desc',
            },
          ]
        : {
            createdAt: 'desc',
          };

    if (sort === COMMENT_SORT.OLDEST) {
      orderBy = {
        createdAt: 'asc',
      };
    }

    // in order to skip the cursor
    const skip = cursor !== undefined ? 1 : undefined;

    const userId = parseOptionalRouteId(dto.userId, 'userId');
    const selectLikes =
      userId !== undefined
        ? {
            where: {
              userId,
            },
          }
        : false;

    const comments = await this.prismaService.comment
      .findMany({
        where: {
          postId,
          isActive: true,
          parentCommentId: null,
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
          author: {
            select: USER_WITHOUT_PASSWORD_SELECT,
          },
          isActive: true,
          parentCommentId: true,
          repliesCount: true,
          likes: selectLikes,
          replies: {
            where: {
              isActive: true,
            },
            orderBy: [
              {
                points: 'desc',
              },
              {
                createdAt: 'desc',
              },
            ],
            take: 3,
            select: {
              id: true,
              content: true,
              createdAt: true,
              updatedAt: true,
              postId: true,
              points: true,
              authorId: true,
              author: {
                select: USER_WITHOUT_PASSWORD_SELECT,
              },
              isActive: true,
              parentCommentId: true,
              repliesCount: true,
              likes: selectLikes,
            },
          },
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find comments for post ${postId}`,
          e instanceof Error ? e.stack : undefined,
          CommentsService.name,
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
        like:
          comment.likes !== undefined && comment.likes.length > 0
            ? comment.likes[0]
            : undefined,
      };

      const { likes: _, ...parsedComment } = p;

      const replies = parsedComment.replies
        .filter((reply) => reply.isActive)
        .map((reply) => {
          const parsedReply = {
            ...reply,
            like:
              reply.likes !== undefined && reply.likes.length > 0
                ? reply.likes[0]
                : undefined,
          };

          const { likes: _replyLikes, ...replyResult } = parsedReply;

          return replyResult;
        });

      return {
        ...parsedComment,
        replies,
      };
    });

    return {
      comments: parsedComments,
      hasMore,
    };
  }

  async findChildComments(
    postId: number,
    commentId: number,
    dto: GetCommentDto,
  ): Promise<{
    comments: CommentWithLike[];
    hasMore: boolean;
  }> {
    const limit = dto.take ?? 15;

    let cursor: { id: number } | undefined;
    if (dto.cursor !== undefined) {
      cursor = {
        id: parseRouteId(dto.cursor, 'cursor'),
      };
    }

    const orderBy: any = [
      {
        points: 'desc',
      },
      {
        createdAt: 'desc',
      },
    ];

    // in order to skip the cursor
    const skip = cursor !== undefined ? 1 : undefined;

    const userId = parseOptionalRouteId(dto.userId, 'userId');
    const selectLikes =
      userId !== undefined
        ? {
            where: {
              userId,
            },
          }
        : false;

    const comments = await this.prismaService.comment
      .findMany({
        where: {
          postId,
          isActive: true,
          parentCommentId: commentId,
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
          author: {
            select: USER_WITHOUT_PASSWORD_SELECT,
          },
          isActive: true,
          parentCommentId: true,
          repliesCount: true,
          likes: selectLikes,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find child comments for comment ${commentId}`,
          e instanceof Error ? e.stack : undefined,
          CommentsService.name,
        );

        throw new BadRequestException(
          `Failed to find child comments for comment ${commentId}`,
        );
      });

    const hasMore = comments.length === limit + 1;
    if (hasMore) {
      comments.pop();
    }

    // transform the likes array into single like variable -> this is to indicate whether the current user likes the post or not
    const parsedComments = comments.map((comment) => {
      const p = {
        ...comment,
        like:
          comment.likes !== undefined && comment.likes.length > 0
            ? comment.likes[0]
            : undefined,
      };

      const { likes: _, ...parsedComment } = p;

      return parsedComment;
    });

    return {
      comments: parsedComments,
      hasMore,
    };
  }

  async deleteComment(postId: number, commentId: number): Promise<Post> {
    const comment = await this.findComment(postId, commentId);

    if (comment === null) {
      throw new BadRequestException(`Failed to find comment ${commentId}`);
    }

    const count = 1 + comment.repliesCount;

    const transactionItems: any = [
      this.prismaService.comment.updateMany({
        where: {
          isActive: true,
          OR: [
            {
              id: commentId,
            },
            {
              parentCommentId: commentId,
            },
          ],
        },
        data: {
          isActive: false,
        },
      }),
      this.prismaService.post.update({
        where: { id: postId },
        data: {
          commentsCount: {
            increment: -count,
          },
        },
      }),
      comment.parentCommentId !== null
        ? this.prismaService.comment.update({
            where: { id: comment.parentCommentId },
            data: {
              repliesCount: {
                increment: -1,
              },
            },
          })
        : null,
    ].filter((item) => item !== null);

    const [, post] = await this.prismaService
      .$transaction(transactionItems)
      .catch((e) => {
        this.logger.error(
          `Failed to delete comment ${commentId}`,
          e instanceof Error ? e.stack : undefined,
          CommentsService.name,
        );

        throw new BadRequestException('Failed to delete comment');
      });

    return post;
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
          CommentsService.name,
        );

        throw new BadRequestException('Failed to like the comment');
      });

    return {
      like: resultLike,
      comment: resultComment,
    };
  }
}
