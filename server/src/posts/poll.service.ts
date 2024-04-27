import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { type Poll } from '@prisma/client';
import { FilterService } from 'src/filter/filter.service';
import { type CreatePollDto } from 'src/posts/dto';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PollService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: Logger,
    private readonly filterService: FilterService,
  ) {}

  async createPoll(
    createPollDto: CreatePollDto,
    postId: number,
  ): Promise<Poll> {
    const data = {
      votingLength: createPollDto.votingLength,
      postId,
    };

    const poll = await this.prismaService.poll
      .create({
        data,
      })
      .catch((e) => {
        this.logger.error(
          'Failed to create poll',
          e instanceof Error ? e.stack : undefined,
          PollService.name,
        );

        throw new BadRequestException('Failed to create poll');
      });

    return poll;
  }
}
