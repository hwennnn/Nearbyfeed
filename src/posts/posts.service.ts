import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { type Post } from '@prisma/client';
import { type CreatePostDto, type UpdatePostDto } from 'src/posts/dto';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: Logger,
  ) {}

  async create(createPostDto: CreatePostDto, authorId: number): Promise<Post> {
    const data = { ...createPostDto, authorId };

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

  async findAll(): Promise<Post[]> {
    return await this.prismaService.post.findMany({}).catch((e) => {
      this.logger.error(
        'Failed to find all posts',
        e instanceof Error ? e.stack : undefined,
        PostsService.name,
      );

      throw new BadRequestException('Failed to find all posts');
    });
  }

  async update(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
    return await this.prismaService.post
      .update({
        where: { id },
        data: updatePostDto,
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
}
