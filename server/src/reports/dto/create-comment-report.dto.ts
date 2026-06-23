import { IsEnum, IsString } from 'class-validator';
import { ReportReason } from '@nearbyfeed/shared';
import { IsReportId } from './report-id.decorator';

export class CreateCommentReportDto {
  @IsString()
  @IsReportId()
  commentId: string;

  @IsEnum(ReportReason, {
    message: 'Reason must be a valid ReportReason enum value',
  })
  reason: ReportReason;
}
