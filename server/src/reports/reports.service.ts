import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { type CreateCommentReportDto } from 'src/reports/dto/create-comment-report.dto';
import { type CreatePostReportDto } from 'src/reports/dto/create-post-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: Logger,
  ) {}

  async reportPost(dto: CreatePostReportDto): Promise<void> {
    await this.prismaService.postReport
      .create({
        data: {
          postId: +dto.postId,
          reason: dto.reason,
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to report post',
          e instanceof Error ? e.stack : undefined,
          ReportsService.name,
        );

        throw new BadRequestException('Failed to report post');
      });
  }

  async reportComment(dto: CreateCommentReportDto): Promise<void> {
    await this.prismaService.commentReport
      .create({
        data: {
          commentId: +dto.commentId,
          reason: dto.reason,
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to report comment',
          e instanceof Error ? e.stack : undefined,
          ReportsService.name,
        );

        throw new BadRequestException('Failed to report comment');
      });
  }
}
