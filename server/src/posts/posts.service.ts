import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  getBoundingBox,
  getTimeWindowStart,
  isWithinDistanceMeters,
  PAGE_SIZE,
  resolveTimeWindow,
} from '@nearbyfeed/shared';
import { type Post, type PostLike } from '@prisma/client';
import { FilterService } from 'src/filter/filter.service';
import { GeocodingService } from 'src/geocoding/geocoding.service';
import {
  type CreatePostDto,
  type GetPostsDto,
  type UpdatePostDto,
} from 'src/posts/dto';
import { type PostWithLike } from 'src/posts/entities';

import { PrismaService } from 'src/prisma/prisma.service';
import { USER_WITHOUT_PASSWORD_SELECT } from 'src/users/entities';
import { UsersService } from 'src/users/users.service';
import {
  parseOptionalRouteId,
  parseRouteId,
} from 'src/utils/parse-route-id.util';

type NearbyPostCursor = {
  createdAt: Date;
  id: number;
};

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
    images?: string[],
  ): Promise<Post> {
    const geolocationName = await this.geocodingService.getLocationName(
      +createPostDto.latitude,
      +createPostDto.longitude,
    );

    const hasPollData =
      createPostDto.poll !== undefined && createPostDto.poll !== null;

    const hasLocationData =
      createPostDto.location !== undefined && createPostDto.location !== null;

    const data = {
      authorId,
      images,
      latitude: +createPostDto.latitude,
      longitude: +createPostDto.longitude,
      title: this.filterService.filterText(createPostDto.title),
      content:
        createPostDto.content !== undefined
          ? this.filterService.filterText(createPostDto.content)
          : null,
      locationName: geolocationName?.locationName,
      fullLocationName: geolocationName?.displayName,
      poll: hasPollData
        ? {
            create: {
              votingLength: +createPostDto.poll.votingLength,
              options: {
                createMany: {
                  data: createPostDto.poll.options.map((option, index) => ({
                    text: option,
                    order: index,
                  })),
                },
              },
            },
          }
        : undefined,
      location: hasLocationData
        ? {
            create: {
              latitude: +createPostDto.location.latitude,
              longitude: +createPostDto.location.longitude,
              name: createPostDto.location.name,
              formattedAddress: createPostDto.location.formattedAddress,
            },
          }
        : undefined,
    };

    const post = await this.prismaService.post
      .create({
        data,
        include: {
          author: {
            select: USER_WITHOUT_PASSWORD_SELECT,
          },
          poll: hasPollData
            ? {
                include: {
                  options: true,
                },
              }
            : false,
          location: hasLocationData,
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
    const center = {
      latitude: dto.latitude,
      longitude: dto.longitude,
    };
    const boundingBox = getBoundingBox(center, dto.distance);
    let pageCursor = await this.findNearbyPostCursor(dto.cursor);

    if (dto.cursor !== undefined && pageCursor === null) {
      return {
        hasMore: false,
        posts: [],
      };
    }

    const userId = parseOptionalRouteId(dto.userId, 'userId');
    const blockedIds =
      userId !== undefined
        ? await this.usersService.findBlockedUsersIds(userId)
        : [];

    const limit = dto.take ?? PAGE_SIZE.default;
    const createdAtFilter = {
      gte: getTimeWindowStart(resolveTimeWindow(dto.timeWindow)),
    };

    const selectLikes =
      userId !== undefined
        ? {
            where: {
              userId,
            },
          }
        : false;

    const posts: any[] = [];
    const batchSize = PAGE_SIZE.max * 2;
    let hasMoreCandidates = true;

    while (posts.length <= limit && hasMoreCandidates) {
      const cursorFilter =
        pageCursor === null || pageCursor === undefined
          ? undefined
          : this.buildNearbyPostCursorFilter(pageCursor);

      const candidates = await this.prismaService.post
        .findMany({
          take: batchSize,
          where: {
            latitude: {
              lte: boundingBox.maxLatitude,
              gte: boundingBox.minLatitude,
            },
            longitude: {
              lte: boundingBox.maxLongitude,
              gte: boundingBox.minLongitude,
            },
            isActive: true,
            createdAt: createdAtFilter,
            authorId: {
              notIn: blockedIds,
            },
            ...(cursorFilter !== undefined
              ? {
                  AND: [cursorFilter],
                }
              : {}),
          },
          select: {
            id: true,
            isActive: true,
            isEdited: true,
            title: true,
            content: true,
            latitude: true,
            longitude: true,
            locationName: true,
            fullLocationName: true,
            images: true,
            points: true,
            createdAt: true,
            updatedAt: true,
            authorId: true,
            likes: selectLikes,
            author: {
              select: USER_WITHOUT_PASSWORD_SELECT,
            },
            commentsCount: true,
            poll: {
              select: {
                options: {
                  orderBy: {
                    order: 'asc',
                  },
                },
                pollVotes: selectLikes,
                id: true,
                createdAt: true,
                updatedAt: true,
                postId: true,
                votingLength: true,
                participantsCount: true,
              },
            },
            location: true,
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        })
        .catch((e) => {
          this.logger.error(
            'Failed to find posts',
            e instanceof Error ? e.stack : undefined,
            PostsService.name,
          );

          throw new BadRequestException('Failed to find posts');
        });

      hasMoreCandidates = candidates.length === batchSize;
      pageCursor =
        candidates.length > 0
          ? {
              createdAt: candidates[candidates.length - 1].createdAt,
              id: candidates[candidates.length - 1].id,
            }
          : undefined;

      posts.push(
        ...candidates.filter((post) =>
          isWithinDistanceMeters(
            center,
            {
              latitude: post.latitude,
              longitude: post.longitude,
            },
            dto.distance,
          ),
        ),
      );

      if (candidates.length === 0) {
        hasMoreCandidates = false;
      }
    }

    const hasMore = posts.length > limit;
    if (hasMore) {
      posts.length = limit;
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

      const poll = parsedPost.poll;

      if (poll !== null) {
        const p = {
          ...poll,
          vote:
            poll.pollVotes !== undefined && poll.pollVotes.length > 0
              ? poll.pollVotes[0]
              : undefined,
        };

        const { pollVotes: _, ...parsedPoll } = p;

        return { ...parsedPost, poll: parsedPoll };
      }

      return parsedPost;
    });

    return {
      posts: parsedPosts,
      hasMore,
    };
  }

  private buildNearbyPostCursorFilter(cursor: NearbyPostCursor): {
    OR: Array<
      | { createdAt: { lt: Date } }
      | { createdAt: Date; id: { lt: number } }
    >;
  } {
    return {
      OR: [
        {
          createdAt: {
            lt: cursor.createdAt,
          },
        },
        {
          createdAt: cursor.createdAt,
          id: {
            lt: cursor.id,
          },
        },
      ],
    };
  }

  private async findNearbyPostCursor(
    cursor?: string,
  ): Promise<NearbyPostCursor | null | undefined> {
    if (cursor === undefined) return undefined;

    const cursorId = parseRouteId(cursor, 'cursor');

    return await this.prismaService.post.findUnique({
      select: {
        createdAt: true,
        id: true,
      },
      where: {
        id: cursorId,
      },
    });
  }

  async findPost(
    postId: number,
    userId?: string,
  ): Promise<PostWithLike | null> {
    const parsedUserId = parseOptionalRouteId(userId, 'userId');
    const selectLikes =
      parsedUserId !== undefined
        ? {
            where: {
              userId: parsedUserId,
            },
          }
        : false;

    const post = await this.prismaService.post
      .findFirst({
        where: {
          id: postId,
          isActive: true,
        },
        select: {
          id: true,
          title: true,
          isActive: true,
          isEdited: true,
          content: true,
          latitude: true,
          longitude: true,
          locationName: true,
          fullLocationName: true,
          images: true,
          points: true,
          createdAt: true,
          updatedAt: true,
          authorId: true,
          likes: selectLikes,
          author: {
            select: USER_WITHOUT_PASSWORD_SELECT,
          },
          commentsCount: true,
          location: true,
          poll: {
            select: {
              options: {
                orderBy: {
                  order: 'asc',
                },
              },
              pollVotes: selectLikes,
              id: true,
              createdAt: true,
              updatedAt: true,
              postId: true,
              votingLength: true,
              participantsCount: true,
            },
          },
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

    const { likes: _, ...result } = parsedPost;

    const poll = result.poll;

    if (poll !== null) {
      const p = {
        ...poll,
        vote:
          poll.pollVotes !== undefined && poll.pollVotes.length > 0
            ? poll.pollVotes[0]
            : undefined,
      };

      const { pollVotes: _, ...parsedPoll } = p;

      return { ...result, poll: parsedPoll };
    }

    return result;
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

  async deletePost(id: number): Promise<void> {
    await this.prismaService.post
      .update({
        data: {
          isActive: false,
        },
        where: {
          id,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to delete post ${id}`,
          e instanceof Error ? e.stack : undefined,
          PostsService.name,
        );

        throw new BadRequestException('Failed to delete post');
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
}
