import { Injectable } from '@nestjs/common';
import { type User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

import { type UserWithoutPassword } from 'src/users/entities/userWithoutPassword';
import { exclude } from 'src/utils';
import { type CreateUserDto } from './dto/create-user.dto';
import { type UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  excludePassword(user: User): UserWithoutPassword {
    return exclude(user, ['password']);
  }

  async create(createUserDto: CreateUserDto): Promise<UserWithoutPassword> {
    return this.excludePassword(
      await this.prismaService.user.create({
        data: createUserDto,
      }),
    );
  }

  async findAll(): Promise<UserWithoutPassword[]> {
    return (await this.prismaService.user.findMany({})).map((user) =>
      this.excludePassword(user),
    );
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
          throw e;
        }),
    );
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserWithoutPassword> {
    return this.excludePassword(
      await this.prismaService.user.update({
        where: { id },
        data: updateUserDto,
      }),
    );
  }
}
