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

  async create(
    createPostDto: CreatePostDto,
    authorId: number,
    image?: string,
  ): Promise<Post> {
    const data = {
      ...createPostDto,
      authorId,
      image,
      latitude: +createPostDto.latitude,
      longitude: +createPostDto.longitude,
    };

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

  async findNearby(
    latitude: number,
    longitude: number,
    distance: number,
  ): Promise<Post[]> {
    const degreesPerMeter = 1 / 111320; // 1 degree is approximately 111320 meters
    const degreesPerDistance = distance * degreesPerMeter;

    return await this.prismaService.post
      .findMany({
        where: {
          latitude: {
            lte: latitude + degreesPerDistance,
            gte: latitude - degreesPerDistance,
          },
          longitude: {
            lte: longitude + degreesPerDistance,
            gte: longitude - degreesPerDistance,
          },
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
