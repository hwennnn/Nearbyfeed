import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from 'src/auth/guards';
import { UserActiveGuard } from 'src/users/guards';
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
});
