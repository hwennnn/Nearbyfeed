import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  ProviderType,
  type Comment,
  type PendingUser,
  type User,
} from '@prisma/client';
import { type PostWithLike } from 'src/posts/entities';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  type CreateUserDto,
  type PaginationDto,
  type UpdateUserDto,
  type UpsertUserDto,
} from 'src/users/dto';

import {
  type PendingUserWithoutPassword,
  type UserResult,
  type UserWithoutPassword,
} from 'src/users/entities';
import { dayInMs, exclude, hashData } from 'src/utils';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: Logger,
  ) {}

  private excludePasswordFromUser(user: User): UserWithoutPassword {
    return exclude(user, ['password']);
  }

  private excludePasswordFromPendingUser(
    pendingUser: PendingUser,
  ): PendingUserWithoutPassword {
    return exclude(pendingUser, ['password']);
  }

  async createPendingUser(
    createUserDto: CreateUserDto,
  ): Promise<PendingUserWithoutPassword> {
    return this.excludePasswordFromPendingUser(
      await this.prismaService.pendingUser
        .create({
          data: createUserDto,
        })
        .catch((e) => {
          this.logger.error(
            'Failed to create user',
            e instanceof Error ? e.stack : undefined,
            UsersService.name,
          );

          throw new BadRequestException('Failed to create user');
        }),
    );
  }

  async createUserWithEmailProvider(
    createUserDto: CreateUserDto,
  ): Promise<UserWithoutPassword> {
    return this.excludePasswordFromUser(
      await this.prismaService.user
        .create({
          data: {
            ...createUserDto,
            providers: {
              create: {
                providerName: 'EMAIL',
                isActive: true,
              },
            },
          },
          include: {
            providers: true,
          },
        })
        .catch((e) => {
          this.logger.error(
            'Failed to create user',
            e instanceof Error ? e.stack : undefined,
            UsersService.name,
          );

          throw new BadRequestException('Failed to create user');
        }),
    );
  }

  async upsertUser(dto: UpsertUserDto): Promise<UserWithoutPassword> {
    try {
      let user = await this.findOneByEmail(dto.email);

      if (user?.isDeleted === true) {
        throw new BadRequestException('The account has already been deleted');
      }

      if (user === null) {
        // create new user if the user with this email does not exist
        user = await this.prismaService.user.create({
          data: {
            email: dto.email,
            image: dto.image,
            username: dto.name,
            providers: {
              create: {
                providerName: dto.providerName,
                isActive: true,
              },
            },
          },
          include: {
            providers: true,
          },
        });
      } else {
        // upsert the user provider if the user with this email already exists
        user = await this.prismaService.user.update({
          where: {
            id: user.id,
          },
          data: {
            providers: {
              upsert: {
                where: {
                  providerName_userId: {
                    providerName: dto.providerName,
                    userId: user.id,
                  },
                },
                create: {
                  providerName: dto.providerName,
                  isActive: true,
                },
                update: {
                  isActive: true,
                },
              },
            },
          },
          include: {
            providers: true,
          },
        });
      }
      return this.excludePasswordFromUser(user);
    } catch (e) {
      this.logger.error(
        'Failed to upsert user',
        e instanceof Error ? e.stack : undefined,
        UsersService.name,
      );

      throw new BadRequestException('Failed to upsert user');
    }
  }

  async findPendingUsersWithEmail(email: string): Promise<boolean> {
    const pendingUser = await this.prismaService.pendingUser
      .findFirst({
        where: {
          email,
          createdAt: {
            gte: new Date(new Date().getTime() - dayInMs),
          },
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find pending users with ${email}`,
          e instanceof Error ? e.stack : undefined,
          UsersService.name,
        );

        throw new BadRequestException('Failed to find user');
      });

    return pendingUser !== null;
  }

  async findPendingUser(id: string): Promise<PendingUser | null> {
    return await this.prismaService.pendingUser
      .findUnique({
        where: {
          id,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find pending user with id ${id}`,
          e instanceof Error ? e.stack : undefined,
          UsersService.name,
        );

        throw new BadRequestException('Failed to find user');
      });
  }

  async deletePendingUser(id: string): Promise<void> {
    await this.prismaService.pendingUser
      .delete({
        where: {
          id,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to delete pending user with id ${id}`,
          e instanceof Error ? e.stack : undefined,
          UsersService.name,
        );

        throw new BadRequestException('Failed to delete pending user');
      });
  }

  async findOne(id: number): Promise<UserResult> {
    const user = await this.prismaService.user
      .findUniqueOrThrow({
        where: {
          id,
        },
        include: {
          blockedUsers: {
            select: {
              id: true,
              blocked: {
                select: {
                  id: true,
                  username: true,
                  image: true,
                },
              },
            },
          },
          providers: true,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find user with id ${id}`,
          e instanceof Error ? e.stack : undefined,
          UsersService.name,
        );

        throw new BadRequestException('Failed to find user');
      });

    const blockedUsers = user.blockedUsers.map((b) => b.blocked);
    const hasPassword = user.password !== null;

    const result: UserResult = {
      ...user,
      blockedUsers,
      hasPassword,
    };

    return result;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    const user = await this.prismaService.user
      .findUnique({
        where: {
          email,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find user with email ${email}`,
          e instanceof Error ? e.stack : undefined,
          UsersService.name,
        );

        throw new BadRequestException('Failed to find user by this email');
      });

    return user !== null ? user : null;
  }

  async findOneById(id: number): Promise<User | null> {
    const user = await this.prismaService.user
      .findUnique({
        where: {
          id,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find user with id ${id}`,
          e instanceof Error ? e.stack : undefined,
          UsersService.name,
        );

        throw new BadRequestException('Failed to find user by this id');
      });

    return user !== null ? user : null;
  }

  async isUserExistByEmail(email: string): Promise<boolean> {
    return (
      (await this.prismaService.user.findUnique({
        where: {
          email,
        },
      })) !== null
    );
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    imageUrl?: string,
  ): Promise<UserWithoutPassword> {
    const data = {
      username: updateUserDto.username,
      image:
        imageUrl !== undefined
          ? imageUrl
          : updateUserDto.shouldSetImageNull
          ? null
          : undefined,
    };

    return this.excludePasswordFromUser(
      await this.prismaService.user
        .update({
          where: { id },
          data,
        })
        .catch((e) => {
          this.logger.error(
            'Failed to update user',
            e instanceof Error ? e.stack : undefined,
            UsersService.name,
          );

          throw new BadRequestException('Failed to update user');
        }),
    );
  }

  async updatePassword(
    id: number,
    password: string,
  ): Promise<UserWithoutPassword> {
    const hashedPassword = await hashData(password);

    return this.excludePasswordFromUser(
      await this.prismaService.user
        .update({
          where: { id },
          data: {
            password: hashedPassword,
            providers: {
              upsert: {
                where: {
                  providerName_userId: {
                    providerName: ProviderType.EMAIL,
                    userId: id,
                  },
                },
                update: {
                  isActive: true,
                },
                create: {
                  providerName: ProviderType.EMAIL,
                  isActive: true,
                },
              },
            },
          },
        })
        .catch((e) => {
          this.logger.error(
            `Failed to update password for user ${id}`,
            e instanceof Error ? e.stack : undefined,
            UsersService.name,
          );

          throw new BadRequestException('Failed to update user');
        }),
    );
  }

  async findOwnPosts(
    userId: number,
    dto: PaginationDto,
  ): Promise<{
    posts: PostWithLike[];
    hasMore: boolean;
  }> {
    const limit = dto.take ?? 15;

    const selectLikes = {
      where: {
        userId,
      },
    };

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
        where: {
          authorId: userId,
          isActive: true,
        },
        cursor: postCursor,
        select: {
          id: true,
          title: true,
          content: true,
          latitude: true,
          isActive: true,
          isEdited: true,
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
        orderBy: {
          createdAt: 'desc',
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to find posts',
          e instanceof Error ? e.stack : undefined,
          UsersService.name,
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

  async findOwnComments(
    userId: number,
    dto: PaginationDto,
  ): Promise<{
    comments: Comment[];
    hasMore: boolean;
  }> {
    const limit = dto.take ?? 15;

    let cursor: { id: number } | undefined;
    if (dto.cursor !== undefined) {
      cursor = {
        id: +dto.cursor,
      };
    }

    // in order to skip the cursor
    const skip = cursor !== undefined ? 1 : undefined;

    const comments = await this.prismaService.comment
      .findMany({
        where: {
          authorId: userId,
          isActive: true,
        },
        cursor,
        take: limit + 1,
        skip,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          postId: true,
          points: true,
          authorId: true,
          isActive: true,
          parentCommentId: true,
          repliesCount: true,
          post: true,
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to find comments',
          e instanceof Error ? e.stack : undefined,
          UsersService.name,
        );

        throw new BadRequestException('Failed to find comments');
      });

    const hasMore = comments.length === limit + 1;
    if (hasMore) {
      comments.pop();
    }

    return {
      comments,
      hasMore,
    };
  }

  async blockUser(blockerId: number, blockedId: number): Promise<void> {
    await this.prismaService.blockedUser
      .upsert({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId,
          },
        },
        create: {
          blockerId,
          blockedId,
        },
        update: {}, // do nothing if already exists
      })
      .catch((e) => {
        this.logger.error(
          `Failed to block user ${blockedId}`,
          e instanceof Error ? e.stack : undefined,
          UsersService.name,
        );

        throw new BadRequestException('Failed to block user');
      });
  }

  async deleteBlock(blockerId: number, blockedId: number): Promise<void> {
    await this.prismaService.blockedUser
      .delete({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId,
          },
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to delete block user record ${blockedId}`,
          e instanceof Error ? e.stack : undefined,
          UsersService.name,
        );

        throw new BadRequestException(
          `Failed to delete block user record ${blockedId}`,
        );
      });
  }

  async findBlockedUsersIds(blockerId: number): Promise<number[]> {
    const result = (
      await this.prismaService.blockedUser.findMany({
        where: {
          blockerId,
        },
        select: {
          blockedId: true,
        },
      })
    ).map((result) => result.blockedId);

    return result;
  }

  async connectProvider(id: number, providerName: ProviderType): Promise<void> {
    await this.prismaService.provider
      .upsert({
        where: {
          providerName_userId: {
            providerName,
            userId: id,
          },
        },
        create: {
          providerName,
          isActive: true,
          userId: id,
        },
        update: {
          isActive: true,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to add provider for user ${id}`,
          e instanceof Error ? e.stack : undefined,
          UsersService.name,
        );

        throw new BadRequestException('Failed to add provider');
      });
  }

  async disconnectProvider(
    id: number,
    providerName: ProviderType,
  ): Promise<void> {
    await this.prismaService.provider
      .delete({
        where: {
          providerName_userId: {
            providerName,
            userId: id,
          },
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to delete provider for user ${id}`,
          e instanceof Error ? e.stack : undefined,
          UsersService.name,
        );

        throw new BadRequestException('Failed to delete provider');
      });
  }

  async deletePassword(id: number): Promise<void> {
    await this.prismaService.user
      .update({
        where: {
          id,
        },
        data: {
          password: null,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to delete password for user ${id}`,
          e instanceof Error ? e.stack : undefined,
          UsersService.name,
        );

        throw new BadRequestException('Failed to delete password');
      });
  }
}
