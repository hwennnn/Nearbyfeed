import { BadRequestException } from '@nestjs/common';
import { ReportReason } from '@nearbyfeed/shared';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const logger = { error: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createService = (prismaService: unknown): ReportsService =>
    new ReportsService(prismaService as any, logger as any);

  it('rejects malformed post ids before creating reports', async () => {
    const prismaService = {
      postReport: {
        create: jest.fn(),
      },
    };
    const service = createService(prismaService);

    await expect(
      service.reportPost(
        {
          postId: 'not-a-post',
          reason: ReportReason.SPAM,
        },
        '7',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaService.postReport.create).not.toHaveBeenCalled();
  });

  it('rejects unsafe comment ids before creating reports', async () => {
    const prismaService = {
      commentReport: {
        create: jest.fn(),
      },
    };
    const service = createService(prismaService);

    await expect(
      service.reportComment(
        {
          commentId: '9007199254740992',
          reason: ReportReason.HARASSMENT_OR_BULLYING,
        },
        '7',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaService.commentReport.create).not.toHaveBeenCalled();
  });

  it('rejects malformed reporter ids before creating reports', async () => {
    const prismaService = {
      commentReport: {
        create: jest.fn(),
      },
      postReport: {
        create: jest.fn(),
      },
    };
    const service = createService(prismaService);

    await expect(
      service.reportPost(
        {
          postId: '42',
          reason: ReportReason.FALSE_INFORMATION,
        },
        'not-a-user',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.reportComment(
        {
          commentId: '88',
          reason: ReportReason.PRIVACY_VIOLATION,
        },
        '9007199254740992',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaService.postReport.create).not.toHaveBeenCalled();
    expect(prismaService.commentReport.create).not.toHaveBeenCalled();
  });

  it('creates reports with parsed numeric target and reporter ids', async () => {
    const prismaService = {
      commentReport: {
        create: jest.fn().mockResolvedValue({ id: 2 }),
      },
      postReport: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
      },
    };
    const service = createService(prismaService);

    await service.reportPost(
      {
        postId: '42',
        reason: ReportReason.FALSE_INFORMATION,
      },
      '7',
    );
    await service.reportComment(
      {
        commentId: '88',
        reason: ReportReason.PRIVACY_VIOLATION,
      },
      '9',
    );

    expect(prismaService.postReport.create).toHaveBeenCalledWith({
      data: {
        postId: 42,
        reporterId: 7,
        reason: ReportReason.FALSE_INFORMATION,
      },
    });
    expect(prismaService.commentReport.create).toHaveBeenCalledWith({
      data: {
        commentId: 88,
        reporterId: 9,
        reason: ReportReason.PRIVACY_VIOLATION,
      },
    });
  });
});
