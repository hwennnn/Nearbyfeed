import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { FilterService } from 'src/filter/filter.service';
import { type CreatePollDto } from 'src/posts/dto';
import { type PollWithOptions } from 'src/posts/entities';

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
  ): Promise<PollWithOptions> {
    const dto = {
      votingLength: createPollDto.votingLength,
      postId,
    };

    const pollWithOptions = await this.prismaService.poll
      .create({
        data: {
          ...dto,
          options: {
            createMany: {
              data: createPollDto.options.map((option) => ({
                text: this.filterService.filterText(option),
              })),
            },
          },
        },
        include: {
          options: true,
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to create poll',
          e instanceof Error ? e.stack : undefined,
          PollService.name,
        );

        throw new BadRequestException('Failed to create poll');
      });

    return pollWithOptions;
  }

  async findPoll(
    postId: number,
    pollId: number,
    userId?: string,
  ): Promise<PollWithOptions | null> {
    const selectVotes =
      userId !== undefined
        ? {
            where: {
              userId: +userId,
            },
          }
        : false;

    const pollWithOptions = await this.prismaService.poll
      .findFirst({
        where: {
          id: pollId,
        },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          postId: true,
          votingLength: true,
          participantsCount: true,
          options: true,
          pollVotes: selectVotes,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find poll ${pollId}`,
          e instanceof Error ? e.stack : undefined,
          PollService.name,
        );

        throw new BadRequestException(`Failed to find comment ${pollId}`);
      });

    if (pollWithOptions === null) return null;

    // transform the votes array into single vote variable
    // -> this is to indicate whether the current user vote or not
    const parsedPoll = {
      ...pollWithOptions,
      vote:
        pollWithOptions.pollVotes !== undefined &&
        pollWithOptions.pollVotes.length > 0
          ? pollWithOptions.pollVotes[0]
          : undefined,
    };

    const { pollVotes: _, ...result } = parsedPoll;

    return result;
  }
}
