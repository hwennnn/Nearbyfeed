import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { type Post, type Updoot } from '@prisma/client';
import { FilterService } from 'src/filter/filter.service';
import { GeocodingService } from 'src/geocoding/geocoding.service';
import { type CreatePostDto, type UpdatePostDto } from 'src/posts/dto';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: Logger,
    private readonly filterService: FilterService,
    private readonly geocodingService: GeocodingService,
  ) {}

  async create(
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

  async vote(
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

    let result: [Updoot, Post];

    if (updoot === null) {
      result = await this.prismaService.$transaction([
        this.prismaService.updoot.create({
          data: {
            postId,
            userId,
            value,
          },
        }),
        this.prismaService.post.update({
          data: {
            points: {
              increment: value,
            },
          },
          where: {
            id: postId,
          },
        }),
      ]);

      console.log(result);
    } else if (updoot.value !== value) {
      const newValue = updoot.value === 0 ? value : value * 2;

      result = await this.prismaService.$transaction([
        this.prismaService.updoot.update({
          data: {
            value,
          },
          where: {
            postId_userId: {
              postId,
              userId,
            },
          },
        }),
        this.prismaService.post.update({
          data: {
            points: {
              increment: newValue,
            },
          },
          where: {
            id: postId,
          },
        }),
      ]);

      console.log(result);
    } else {
      // updoot.value === value
      // cancel the vote if the updoot value is the same as given value
      // reset the updoot value to 0
      result = await this.prismaService.$transaction([
        this.prismaService.updoot.update({
          data: {
            value: 0,
          },
          where: {
            postId_userId: {
              postId,
              userId,
            },
          },
        }),
        this.prismaService.post.update({
          data: {
            points: {
              // inverse the value
              increment: -value,
            },
          },
          where: {
            id: postId,
          },
        }),
      ]);

      console.log(result);
    }

    return {
      updoot: result[0],
      post: result[1],
    };
  }
}
