import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { type PendingUser, type User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { type CreateUserDto, type UpdateUserDto } from 'src/users/dto';

import {
  type PendingUserWithoutPassword,
  type UserWithoutPassword,
} from 'src/users/entities';
import { dayInMs, exclude } from 'src/utils';

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

  async createUser(createUserDto: CreateUserDto): Promise<UserWithoutPassword> {
    return this.excludePasswordFromUser(
      await this.prismaService.user
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

  async findAll(): Promise<UserWithoutPassword[]> {
    return (
      await this.prismaService.user.findMany({}).catch((e) => {
        this.logger.error(
          'Failed to find users',
          e instanceof Error ? e.stack : undefined,
          UsersService.name,
        );

        throw new BadRequestException('Failed to find users');
      })
    ).map((user) => this.excludePasswordFromUser(user));
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

  async findOne(id: number): Promise<UserWithoutPassword> {
    return this.excludePasswordFromUser(
      await this.prismaService.user
        .findUniqueOrThrow({
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

          throw new BadRequestException('Failed to find user');
        }),
    );
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
    console.log(
      '🚀 ~ file: users.service.ts:195 ~ UsersService ~ updateUserDto:',
      updateUserDto,
    );

    const data = {
      username: updateUserDto.username,
      image:
        imageUrl !== undefined
          ? imageUrl
          : updateUserDto.shouldSetImageNull === true
          ? null
          : undefined,
    };

    console.log(data);

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
    return this.excludePasswordFromUser(
      await this.prismaService.user
        .update({
          where: { id },
          data: {
            password,
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
}
