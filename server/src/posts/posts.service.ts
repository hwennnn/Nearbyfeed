import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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
    images?: string[],
  ): Promise<Post> {
    const geolocationName = await this.geocodingService.getLocationName(
      +createPostDto.latitude,
      +createPostDto.longitude,
    );

    const hasPollData =
      createPostDto.poll !== undefined && createPostDto.poll !== null;

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
    };

    const post = await this.prismaService.post
      .create({
        data,
        include: {
          author: true,
          poll: hasPollData
            ? {
                include: {
                  options: true,
                },
              }
            : false,
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

    const blockedIds =
      dto.userId !== undefined
        ? await this.usersService.findBlockedUsersIds(+dto.userId)
        : [];

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
          isDeleted: false,
          authorId: {
            notIn: blockedIds,
          },
        },
        select: {
          id: true,
          isDeleted: true,
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
          author: true,
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
          isDeleted: false,
        },
        select: {
          id: true,
          title: true,
          isDeleted: true,
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
          author: true,
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
