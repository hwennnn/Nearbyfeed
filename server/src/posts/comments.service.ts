import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { type Comment, type CommentLike, type Post } from '@prisma/client';
import { FilterService } from 'src/filter/filter.service';
import {
  GetCommentsSort,
  type CreateCommentDto,
  type GetCommentDto,
} from 'src/posts/dto';
import { type CommentWithLike } from 'src/posts/entities';

import { PrismaService } from 'src/prisma/prisma.service';

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
        .findUnique({
          where: {
            id: parentCommentId,
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

      if (parentComment?.parentCommentId !== null) {
        this.logger.error(
          'Only one level of comments is allowed',
          undefined,
          CommentsService.name,
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

    const transactionItems: any = [
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
    const selectLikes =
      userId !== undefined
        ? {
            where: {
              userId: +userId,
            },
          }
        : false;

    const comment = await this.prismaService.comment
      .findFirst({
        where: {
          id: commentId,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          postId: true,
          points: true,
          authorId: true,
          author: true,
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
          author: true,
          isActive: true,
          parentCommentId: true,
          repliesCount: true,
          likes: selectLikes,
          replies: {
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
              author: true,
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

      parsedComment.replies = parsedComment.replies.map((reply) => {
        return {
          ...reply,
          like:
            reply.likes !== undefined && reply.likes.length > 0
              ? reply.likes[0]
              : undefined,
        };
      });

      return parsedComment;
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
        id: +dto.cursor,
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
          author: true,
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
      this.prismaService.comment.delete({
        where: { id: commentId },
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
