import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  type CreateCommentReportDto,
  type CreatePostReportDto,
} from 'src/reports/dto';
import { parseRouteId } from 'src/utils/parse-route-id.util';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: Logger,
  ) {}

  async reportPost(
    dto: CreatePostReportDto,
    reporterUserId: string,
  ): Promise<void> {
    const postId = parseRouteId(dto.postId, 'postId');
    const reporterId = parseRouteId(reporterUserId, 'userId');

    await this.prismaService.postReport
      .create({
        data: {
          postId,
          reporterId,
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

  async reportComment(
    dto: CreateCommentReportDto,
    reporterUserId: string,
  ): Promise<void> {
    const commentId = parseRouteId(dto.commentId, 'commentId');
    const reporterId = parseRouteId(reporterUserId, 'userId');

    await this.prismaService.commentReport
      .create({
        data: {
          commentId,
          reporterId,
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
