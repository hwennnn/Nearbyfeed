import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from 'src/auth/guards';
import { UserActiveGuard } from 'src/users/guards';
import { ReportReason } from '@nearbyfeed/shared';
import { ReportsController } from './reports.controller';

describe('ReportsController', () => {
  it.each([
    ['post reports', ReportsController.prototype.reportPost],
    ['comment reports', ReportsController.prototype.reportComment],
  ])('requires an active authenticated user for %s', (_label, handler) => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler);

    expect(guards).toContain(JwtAuthGuard);
    expect(guards).toContain(UserActiveGuard);
  });

  it('attributes post reports to the authenticated user', async () => {
    const reportsService = {
      reportPost: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new ReportsController(reportsService as any);

    await controller.reportPost(
      { postId: '42', reason: ReportReason.FALSE_INFORMATION },
      '7',
    );

    expect(reportsService.reportPost).toHaveBeenCalledWith(
      { postId: '42', reason: ReportReason.FALSE_INFORMATION },
      '7',
    );
  });

  it('attributes comment reports to the authenticated user', async () => {
    const reportsService = {
      reportComment: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new ReportsController(reportsService as any);

    await controller.reportComment(
      { commentId: '88', reason: ReportReason.PRIVACY_VIOLATION },
      '9',
    );

    expect(reportsService.reportComment).toHaveBeenCalledWith(
      { commentId: '88', reason: ReportReason.PRIVACY_VIOLATION },
      '9',
    );
  });
});
