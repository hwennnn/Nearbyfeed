import { ReportReason } from '@nearbyfeed/shared';
import { describe, expect, it } from 'vitest';
import {
  REPORT_REASONS,
  getReportDialogCopy,
  getReportSuccessMessage,
  getReportReasonOption,
} from './report-presentation';

describe('report presentation', () => {
  it('shares the complete report reason menu with the mobile app', () => {
    expect(REPORT_REASONS).toHaveLength(10);
    expect(getReportReasonOption(ReportReason.FALSE_INFORMATION)).toMatchObject({
      label: 'False information',
    });
  });

  it('uses target-specific trust copy', () => {
    expect(getReportDialogCopy('post').title).toContain('feed');
    expect(getReportDialogCopy('comment').title).toContain('comment');
    expect(getReportDialogCopy('comment').body).not.toContain('post');
  });

  it('returns a clear post-submit acknowledgement', () => {
    expect(getReportSuccessMessage('comment')).toContain('comment');
    expect(getReportSuccessMessage('post')).toContain('feed');
  });
});
