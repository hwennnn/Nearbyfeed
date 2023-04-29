import { Injectable } from '@nestjs/common';
import { type User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { type CreateUserDto } from './dto/create-user.dto';
import { type UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    return await this.prismaService.user.create({
      data: createUserDto,
    });
  }

  async findAll(): Promise<User[]> {
    return await this.prismaService.user.findMany({});
  }

  async findOne(id: number): Promise<User> {
    return await this.prismaService.user
      .findUniqueOrThrow({
        where: {
          id,
        },
      })
      .catch((e) => {
        throw e;
      });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    return await this.prismaService.user.update({
      where: { id },
      data: updateUserDto,
    });
  }
}
