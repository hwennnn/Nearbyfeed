import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { type Comment, type CommentLike } from '@prisma/client';
import { FilterService } from 'src/filter/filter.service';
import {
  GetCommentsSort,
  type CreateCommentDto,
  type GetCommentDto,
  type UpdateCommentDto,
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
          CommentsService.name,
        );

        throw new BadRequestException('Failed to create comment');
      });

    return resultComment;
  }

  async replyComment(
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
          isDeleted: true,
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

    return parsedComment;
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
      // temporarily commented as it might mess up with the pagination order
      // {
      //   points: 'desc',
      // },
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
          isDeleted: false,
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
          isDeleted: true,
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
          CommentsService.name,
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
