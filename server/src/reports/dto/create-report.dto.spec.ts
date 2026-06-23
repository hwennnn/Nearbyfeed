import { ReportReason } from '@nearbyfeed/shared';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCommentReportDto } from './create-comment-report.dto';
import { CreatePostReportDto } from './create-post-report.dto';

const validateDto = async <T extends object>(
  Dto: new () => T,
  body: Record<string, unknown>,
) => await validate(plainToInstance(Dto, body));

describe('report DTOs', () => {
  it('accepts report payloads with positive safe integer ids', async () => {
    await expect(
      validateDto(CreatePostReportDto, {
        postId: '42',
        reason: ReportReason.FALSE_INFORMATION,
      }),
    ).resolves.toHaveLength(0);

    await expect(
      validateDto(CreateCommentReportDto, {
        commentId: '88',
        reason: ReportReason.HARASSMENT_OR_BULLYING,
      }),
    ).resolves.toHaveLength(0);
  });

  it('rejects malformed, zero, or unsafe report ids', async () => {
    await expect(
      validateDto(CreatePostReportDto, {
        postId: 'not-a-post',
        reason: ReportReason.SPAM,
      }),
    ).resolves.toHaveLength(1);

    await expect(
      validateDto(CreatePostReportDto, {
        postId: '0',
        reason: ReportReason.SPAM,
      }),
    ).resolves.toHaveLength(1);

    await expect(
      validateDto(CreateCommentReportDto, {
        commentId: '9007199254740992',
        reason: ReportReason.SPAM,
      }),
    ).resolves.toHaveLength(1);
  });

  it('rejects unsupported report reasons', async () => {
    const errors = await validateDto(CreatePostReportDto, {
      postId: '42',
      reason: 'NOT_A_REASON',
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('reason');
  });
});
