import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { type Post, type Updoot } from '@prisma/client';
import { FilterService } from 'src/filter/filter.service';
import { GeocodingService } from 'src/geocoding/geocoding.service';
import {
  type CreatePostDto,
  type GetPostDto,
  type UpdatePostDto,
} from 'src/posts/dto';
import { type PostWithUpdoot } from 'src/posts/entities';

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

  async findNearby(dto: GetPostDto): Promise<PostWithUpdoot[]> {
    const degreesPerMeter = 1 / 111320; // 1 degree is approximately 111320 meters
    const degreesPerDistance = dto.distance * degreesPerMeter;

    const selectUpdoots =
      dto.userId !== undefined
        ? {
            where: {
              userId: +dto.userId,
            },
          }
        : false;

    return await this.prismaService.post
      .findMany({
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

    console.log(resultUpdoot, resultPost);

    return {
      updoot: resultUpdoot,
      post: resultPost,
    };
  }
}
