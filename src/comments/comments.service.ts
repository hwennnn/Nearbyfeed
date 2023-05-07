import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { type Comment } from '@prisma/client';
import { type CreateCommentDto, type UpdateCommentDto } from 'src/comments/dto';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: Logger,
  ) {}

  async create(
    createCommentDto: CreateCommentDto,
    postId: number,
    authorId: number,
  ): Promise<Comment> {
    const data = { ...createCommentDto, postId, authorId };

    const comment = await this.prismaService.comment
      .create({ data })
      .catch((e) => {
        this.logger.error(
          'Failed to create comment',
          e instanceof Error ? e.stack : undefined,
          CommentsService.name,
        );

        throw new BadRequestException('Failed to create comment');
      });

    return comment;
  }

  async find(id: number): Promise<Comment[]> {
    return await this.prismaService.comment
      .findMany({
        where: {
          postId: id,
          isDeleted: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find comments for post ${id}`,
          e instanceof Error ? e.stack : undefined,
          CommentsService.name,
        );

        throw new BadRequestException('Failed to find comments');
      });
  }

  async update(
    id: number,
    updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    return await this.prismaService.comment
      .update({
        where: { id },
        data: updateCommentDto,
      })
      .catch((e) => {
        this.logger.error(
          `Failed to update comment ${id}`,
          e instanceof Error ? e.stack : undefined,
          CommentsService.name,
        );

        throw new BadRequestException('Failed to update comment');
      });
  }
}