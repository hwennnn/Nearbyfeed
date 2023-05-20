import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { type User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { type CreateUserDto, type UpdateUserDto } from 'src/users/dto';

import { type UserWithoutPassword } from 'src/users/entities/userWithoutPassword';
import { exclude } from 'src/utils';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: Logger,
  ) {}

  private excludePassword(user: User): UserWithoutPassword {
    return exclude(user, ['password']);
  }

  async create(createUserDto: CreateUserDto): Promise<UserWithoutPassword> {
    return this.excludePassword(
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
    ).map((user) => this.excludePassword(user));
  }

  async findOne(id: number): Promise<UserWithoutPassword> {
    return this.excludePassword(
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
  ): Promise<UserWithoutPassword> {
    return this.excludePassword(
      await this.prismaService.user
        .update({
          where: { id },
          data: updateUserDto,
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
    return this.excludePassword(
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